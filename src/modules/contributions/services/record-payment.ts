import {
  BillStatus,
  CategoryType,
  ContributionPaymentStatus,
  IncomeStatus,
  type PaymentMethod,
} from "@prisma/client";
import Decimal from "decimal.js";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  refreshContributionBillStatus,
} from "@/modules/contributions/domain/bill-status";
import { postLedgerEntry } from "@/modules/ledger";
import { createReceiptNumber, createTransactionNumber } from "@/modules/shared/numbering";

type RecordPaymentInput = {
  billId: string;
  amountPaid: string;
  paymentDate: Date;
  method: PaymentMethod;
  notes?: string;
  actorId: string;
  status?: ContributionPaymentStatus;
};

export async function recordContributionPayment(input: RecordPaymentInput) {
  const bill = await db.contributionBill.findUnique({
    where: { id: input.billId },
    include: { household: true },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  const amountPaidDecimal = new Decimal(input.amountPaid);

  if (bill.status === BillStatus.DIBATALKAN || bill.canceledAt) {
    throw new Error("Tagihan sudah dibatalkan.");
  }

  if (bill.status === BillStatus.DIBEBASKAN) {
    throw new Error("Tagihan dibebaskan dan tidak dapat menerima pembayaran.");
  }

  if (amountPaidDecimal.lte(0)) {
    throw new Error("Nominal pembayaran harus lebih besar dari nol.");
  }

  const incomeCategory = await db.transactionCategory.findUnique({
    where: {
      name_type: {
        name: "Iuran Jamaah",
        type: CategoryType.INCOME,
      },
    },
  });

  if (!incomeCategory) {
    throw new Error("Kategori iuran belum tersedia.");
  }

  return db.$transaction(async (tx) => {
    const paymentStatus = input.status ?? ContributionPaymentStatus.VERIFIED;
    const income = await tx.incomeTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("INC-IUR", input.paymentDate),
        transactionDate: input.paymentDate,
        categoryId: incomeCategory.id,
        sourceName: bill.household.headName,
        amount: input.amountPaid,
        method: input.method,
        description: `Pembayaran iuran ${bill.household.headName}`,
        status:
          paymentStatus === ContributionPaymentStatus.VERIFIED
            ? IncomeStatus.VERIFIED
            : IncomeStatus.DRAFT,
        createdById: input.actorId,
        verifiedById:
          paymentStatus === ContributionPaymentStatus.VERIFIED
            ? input.actorId
            : null,
      },
    });

    const payment = await tx.contributionPayment.create({
      data: {
        billId: bill.id,
        amountPaid: input.amountPaid,
        paymentDate: input.paymentDate,
        method: input.method,
        status: paymentStatus,
        notes: input.notes,
        receiptNumber: createReceiptNumber(input.paymentDate),
        recordedById: input.actorId,
        incomeTransactionId: income.id,
      },
    });

    if (paymentStatus === ContributionPaymentStatus.VERIFIED) {
      await postLedgerEntry(tx, {
        transactionDate: input.paymentDate,
        direction: "DEBIT",
        sourceType: "CONTRIBUTION_PAYMENT",
        sourceId: payment.id,
        transactionNumber: income.transactionNumber,
        description: `Pembayaran iuran ${bill.household.headName}`,
        amount: input.amountPaid,
        incomeId: income.id,
      });
    }

    const nextStatus = await refreshContributionBillStatus(tx, bill.id);

    await createAuditLog(
      {
        userId: input.actorId,
        action: "RECORD_CONTRIBUTION_PAYMENT",
        entity: "ContributionPayment",
        entityId: payment.id,
        afterData: {
          billId: bill.id,
          amountPaid: input.amountPaid,
          paymentStatus,
          billStatus: nextStatus,
        },
      },
      tx,
    );

    return payment;
  });
}
