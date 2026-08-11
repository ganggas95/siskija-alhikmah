import { ContributionPaymentStatus, IncomeStatus, type PaymentMethod } from "@prisma/client";
import Decimal from "decimal.js";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

type UpdateDraftPaymentInput = {
  paymentId: string;
  amountPaid: string;
  paymentDate: Date;
  method: PaymentMethod;
  notes?: string;
  actorId: string;
};

export async function updateDraftContributionPayment(
  input: UpdateDraftPaymentInput,
) {
  const amountPaidDecimal = new Decimal(input.amountPaid);

  if (amountPaidDecimal.lte(0)) {
    throw new Error("Nominal pembayaran harus lebih besar dari nol.");
  }

  return db.$transaction(async (tx) => {
    const payment = await tx.contributionPayment.findUnique({
      where: { id: input.paymentId },
      select: {
        id: true,
        status: true,
        canceledAt: true,
        amountPaid: true,
        paymentDate: true,
        method: true,
        notes: true,
        incomeTransactionId: true,
      },
    });

    if (!payment) {
      throw new Error("Pembayaran draft tidak ditemukan.");
    }

    if (payment.status !== ContributionPaymentStatus.DRAFT || payment.canceledAt) {
      throw new Error("Hanya pembayaran berstatus DRAFT yang dapat diubah.");
    }

    const updated = await tx.contributionPayment.update({
      where: { id: payment.id },
      data: {
        amountPaid: input.amountPaid,
        paymentDate: input.paymentDate,
        method: input.method,
        notes: input.notes,
      },
    });

    if (payment.incomeTransactionId) {
      await tx.incomeTransaction.update({
        where: { id: payment.incomeTransactionId },
        data: {
          amount: input.amountPaid,
          transactionDate: input.paymentDate,
          method: input.method,
          description: input.notes || undefined,
          status: IncomeStatus.DRAFT,
        },
      });
    }

    await createAuditLog(
      {
        userId: input.actorId,
        action: "UPDATE_DRAFT_CONTRIBUTION_PAYMENT",
        entity: "ContributionPayment",
        entityId: payment.id,
        beforeData: {
          amountPaid: payment.amountPaid.toString(),
          paymentDate: payment.paymentDate.toISOString(),
          method: payment.method,
          notes: payment.notes,
        },
        afterData: {
          amountPaid: input.amountPaid,
          paymentDate: input.paymentDate.toISOString(),
          method: input.method,
          notes: input.notes,
        },
      },
      tx,
    );

    return updated;
  });
}
