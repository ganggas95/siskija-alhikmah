import {
  CategoryType,
  ContributionPaymentStatus,
  IncomeStatus,
  LedgerDirection,
  LedgerSourceType,
  type Prisma,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  deriveContributionBillStatus,
  refreshContributionBillStatus,
} from "@/modules/contributions/domain/bill-status";
import { postLedgerEntry, reverseLedgerEntries } from "@/modules/ledger";
import { createTransactionNumber } from "@/modules/shared/numbering";

type TransactionClient = Prisma.TransactionClient;

const paymentTransactionOptions = {
  maxWait: 10_000,
  timeout: 60_000,
} as const;

type PaymentActionInput = {
  paymentId: string;
  actorId: string;
  reason?: string;
};

export { deriveContributionBillStatus };

async function approvePaymentInTransaction(
  tx: TransactionClient,
  input: PaymentActionInput,
) {
  const payment = await tx.contributionPayment.findUnique({
    where: { id: input.paymentId },
    include: { bill: { include: { household: true } } },
  });

  if (!payment) throw new Error("Pembayaran tidak ditemukan.");
  if (payment.status !== ContributionPaymentStatus.DRAFT || payment.canceledAt) {
    throw new Error("Hanya pembayaran berstatus DRAFT yang dapat di-approve.");
  }
  if (payment.incomeTransactionId) {
    throw new Error("Pembayaran ini sudah memiliki transaksi kas terkait.");
  }

  const category = await tx.transactionCategory.findUnique({
    where: {
      name_type: { name: "Iuran Jamaah", type: CategoryType.INCOME },
    },
    select: { id: true },
  });

  if (!category) throw new Error("Kategori iuran belum tersedia.");

  const income = await tx.incomeTransaction.create({
    data: {
      transactionNumber: createTransactionNumber("INC-IUR", payment.paymentDate),
      transactionDate: payment.paymentDate,
      categoryId: category.id,
      sourceName: payment.bill.household.headName,
      amount: payment.amountPaid,
      method: payment.method,
      description: `Pembayaran iuran ${payment.bill.household.headName}`,
      status: IncomeStatus.VERIFIED,
      createdById: payment.recordedById ?? input.actorId,
      verifiedById: input.actorId,
    },
  });

  const updated = await tx.contributionPayment.update({
    where: { id: payment.id },
    data: {
      status: ContributionPaymentStatus.VERIFIED,
      incomeTransactionId: income.id,
    },
  });

  await postLedgerEntry(tx, {
    transactionDate: payment.paymentDate,
    direction: LedgerDirection.DEBIT,
    sourceType: LedgerSourceType.CONTRIBUTION_PAYMENT,
    sourceId: payment.id,
    transactionNumber: income.transactionNumber,
    description: `Pembayaran iuran ${payment.bill.household.headName}`,
    amount: payment.amountPaid,
    incomeId: income.id,
  });

  const billStatus = await refreshContributionBillStatus(tx, payment.billId);

  await createAuditLog(
    {
      userId: input.actorId,
      action: "APPROVE_CONTRIBUTION_PAYMENT",
      entity: "ContributionPayment",
      entityId: payment.id,
      beforeData: { status: ContributionPaymentStatus.DRAFT },
      afterData: {
        status: ContributionPaymentStatus.VERIFIED,
        amountPaid: payment.amountPaid.toString(),
        incomeTransactionId: income.id,
        billStatus,
      },
    },
    tx,
  );

  return updated;
}

async function cancelPaymentInTransaction(
  tx: TransactionClient,
  input: PaymentActionInput,
) {
  const payment = await tx.contributionPayment.findUnique({
    where: { id: input.paymentId },
    select: {
      id: true,
      billId: true,
      status: true,
      canceledAt: true,
      amountPaid: true,
      incomeTransactionId: true,
    },
  });

  if (!payment) throw new Error("Pembayaran tidak ditemukan.");
  if (payment.status === ContributionPaymentStatus.CANCELED || payment.canceledAt) {
    throw new Error("Pembayaran sudah dibatalkan.");
  }

  if (payment.status === ContributionPaymentStatus.VERIFIED && payment.incomeTransactionId) {
    await tx.incomeTransaction.update({
      where: { id: payment.incomeTransactionId },
      data: {
        status: IncomeStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    await reverseLedgerEntries(tx, {
      sourceType: LedgerSourceType.CONTRIBUTION_PAYMENT,
      sourceId: payment.id,
      reason: input.reason ?? "Pembayaran iuran dibatalkan",
    });
  }

  const updated = await tx.contributionPayment.update({
    where: { id: payment.id },
    data: {
      status: ContributionPaymentStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  const billStatus = await refreshContributionBillStatus(tx, payment.billId);

  await createAuditLog(
    {
      userId: input.actorId,
      action: "CANCEL_CONTRIBUTION_PAYMENT",
      entity: "ContributionPayment",
      entityId: payment.id,
      beforeData: { status: payment.status },
      afterData: {
        status: ContributionPaymentStatus.CANCELED,
        amountPaid: payment.amountPaid.toString(),
        reason: input.reason ?? "Dibatalkan dari modul pembayaran",
        billStatus,
      },
    },
    tx,
  );

  return updated;
}

export function approveContributionPayment(input: PaymentActionInput) {
  return db.$transaction(
    (tx) => approvePaymentInTransaction(tx, input),
    paymentTransactionOptions,
  );
}

export function approveContributionPayments(paymentIds: string[], actorId: string) {
  return db.$transaction(
    async (tx) => {
      const results = [];
      for (const paymentId of paymentIds) {
        results.push(await approvePaymentInTransaction(tx, { paymentId, actorId }));
      }
      return results;
    },
    paymentTransactionOptions,
  );
}

export function cancelContributionPayment(input: PaymentActionInput) {
  return db.$transaction(
    (tx) => cancelPaymentInTransaction(tx, input),
    paymentTransactionOptions,
  );
}

export function cancelContributionPayments(paymentIds: string[], actorId: string) {
  return db.$transaction(
    async (tx) => {
      const results = [];
      for (const paymentId of paymentIds) {
        results.push(await cancelPaymentInTransaction(tx, { paymentId, actorId }));
      }
      return results;
    },
    paymentTransactionOptions,
  );
}
