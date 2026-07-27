import {
  BillStatus,
  CategoryType,
  IncomeStatus,
  LedgerDirection,
  LedgerSourceType,
  type PaymentMethod,
} from "@prisma/client";
import Decimal from "decimal.js";

import { db } from "@/lib/db";
import { createReceiptNumber, createTransactionNumber } from "@/modules/shared/numbering";

type RecordPaymentInput = {
  billId: string;
  amountPaid: string;
  paymentDate: Date;
  method: PaymentMethod;
  notes?: string;
  actorId: string;
};

function deriveBillStatus(amountDue: Decimal, totalPaid: Decimal) {
  if (totalPaid.lte(0)) {
    return BillStatus.BELUM_BAYAR;
  }

  if (totalPaid.greaterThanOrEqualTo(amountDue)) {
    return BillStatus.LUNAS;
  }

  return BillStatus.SEBAGIAN;
}

export async function recordContributionPayment(input: RecordPaymentInput) {
  const bill = await db.contributionBill.findUnique({
    where: { id: input.billId },
    include: { household: true },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan.");
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
    const income = await tx.incomeTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("INC-IUR"),
        transactionDate: input.paymentDate,
        categoryId: incomeCategory.id,
        sourceName: bill.household.headName,
        amount: input.amountPaid,
        method: input.method,
        description: `Pembayaran iuran ${bill.household.headName}`,
        status: IncomeStatus.VERIFIED,
        createdById: input.actorId,
        verifiedById: input.actorId,
      },
    });

    const payment = await tx.contributionPayment.create({
      data: {
        billId: bill.id,
        amountPaid: input.amountPaid,
        paymentDate: input.paymentDate,
        method: input.method,
        notes: input.notes,
        receiptNumber: createReceiptNumber(),
        recordedById: input.actorId,
        incomeTransactionId: income.id,
      },
    });

    const validPayments = await tx.contributionPayment.findMany({
      where: {
        billId: bill.id,
        canceledAt: null,
      },
      select: { amountPaid: true },
    });

    const totalPaid = validPayments.reduce(
      (total, item) => total.plus(item.amountPaid.toString()),
      new Decimal(0),
    );

    const nextStatus = deriveBillStatus(
      new Decimal(bill.amountDue.toString()),
      totalPaid,
    );

    await tx.contributionBill.update({
      where: { id: bill.id },
      data: { status: nextStatus },
    });

    await tx.cashLedger.create({
      data: {
        transactionDate: input.paymentDate,
        direction: LedgerDirection.DEBIT,
        sourceType: LedgerSourceType.CONTRIBUTION_PAYMENT,
        sourceId: payment.id,
        transactionNumber: income.transactionNumber,
        description: `Pembayaran iuran ${bill.household.headName}`,
        amount: input.amountPaid,
        incomeId: income.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: "RECORD_CONTRIBUTION_PAYMENT",
        entity: "ContributionPayment",
        entityId: payment.id,
        afterData: {
          billId: bill.id,
          amountPaid: input.amountPaid,
          status: nextStatus,
        },
      },
    });

    return payment;
  });
}
