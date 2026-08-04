import {
  BillStatus,
  CategoryType,
  ContributionPaymentStatus,
  IncomeStatus,
  LedgerDirection,
  LedgerSourceType,
  type Prisma,
} from "@prisma/client";
import Decimal from "decimal.js";

import { db } from "@/lib/db";
import { createTransactionNumber } from "@/modules/shared/numbering";

type TransactionClient = Prisma.TransactionClient;

const paymentTransactionOptions = {
  maxWait: 10_000,
  timeout: 60_000,
} as const;

type PaymentActionInput = {
  paymentId: string;
  actorId: string;
};

export function deriveContributionBillStatus(amountDue: Decimal, totalPaid: Decimal) {
  if (totalPaid.lte(0)) return BillStatus.BELUM_BAYAR;
  if (totalPaid.greaterThanOrEqualTo(amountDue)) return BillStatus.LUNAS;
  return BillStatus.SEBAGIAN;
}

async function refreshBillStatus(tx: TransactionClient, billId: string) {
  const bill = await tx.contributionBill.findUnique({
    where: { id: billId },
    select: { amountDue: true },
  });

  if (!bill) return;

  const payments = await tx.contributionPayment.findMany({
    where: {
      billId,
      canceledAt: null,
      status: ContributionPaymentStatus.VERIFIED,
    },
    select: { amountPaid: true },
  });

  const totalPaid = payments.reduce(
    (total, payment) => total.plus(payment.amountPaid.toString()),
    new Decimal(0),
  );

  await tx.contributionBill.update({
    where: { id: billId },
    data: {
      status: deriveContributionBillStatus(new Decimal(bill.amountDue.toString()), totalPaid),
    },
  });
}

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
    throw new Error("Hanya pembayaran berstatus DRAFT yang dapat di-Approve.");
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
      transactionNumber: createTransactionNumber("INC-IUR"),
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

  await tx.cashLedger.create({
    data: {
      transactionDate: payment.paymentDate,
      direction: LedgerDirection.DEBIT,
      sourceType: LedgerSourceType.CONTRIBUTION_PAYMENT,
      sourceId: payment.id,
      transactionNumber: income.transactionNumber,
      description: `Pembayaran iuran ${payment.bill.household.headName}`,
      amount: payment.amountPaid,
      incomeId: income.id,
    },
  });

  await refreshBillStatus(tx, payment.billId);

  await tx.auditLog.create({
    data: {
      userId: input.actorId,
      action: "APPROVE_CONTRIBUTION_PAYMENT",
      entity: "ContributionPayment",
      entityId: payment.id,
      beforeData: { status: ContributionPaymentStatus.DRAFT },
      afterData: {
        status: ContributionPaymentStatus.VERIFIED,
        amountPaid: payment.amountPaid.toString(),
        incomeTransactionId: income.id,
      },
    },
  });

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
    },
  });

  if (!payment) throw new Error("Pembayaran tidak ditemukan.");
  if (payment.status !== ContributionPaymentStatus.DRAFT || payment.canceledAt) {
    throw new Error("Hanya pembayaran berstatus DRAFT yang dapat dibatalkan.");
  }

  const updated = await tx.contributionPayment.update({
    where: { id: payment.id },
    data: {
      status: ContributionPaymentStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  await refreshBillStatus(tx, payment.billId);

  await tx.auditLog.create({
    data: {
      userId: input.actorId,
      action: "CANCEL_CONTRIBUTION_PAYMENT",
      entity: "ContributionPayment",
      entityId: payment.id,
      beforeData: { status: ContributionPaymentStatus.DRAFT },
      afterData: {
        status: ContributionPaymentStatus.CANCELED,
        amountPaid: payment.amountPaid.toString(),
        reason: "Dibatalkan dari modul pembayaran",
      },
    },
  });

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
