import { ExpenseStatus, LedgerDirection, LedgerSourceType } from "@prisma/client";

import { db } from "@/lib/db";

type VerifyExpenseInput = {
  expenseId: string;
  actorId: string;
};

export async function verifyExpense(input: VerifyExpenseInput) {
  const expense = await db.expenseTransaction.findUnique({
    where: { id: input.expenseId },
  });

  if (!expense) {
    throw new Error("Transaksi kas keluar tidak ditemukan.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.expenseTransaction.update({
      where: { id: input.expenseId },
      data: {
        status: ExpenseStatus.VERIFIED,
        verifiedById: input.actorId,
      },
    });

    await tx.cashLedger.upsert({
      where: {
        sourceType_sourceId_isActive: {
          sourceType: LedgerSourceType.EXPENSE_TRANSACTION,
          sourceId: updated.id,
          isActive: true,
        },
      },
      update: {},
      create: {
        transactionDate: updated.transactionDate,
        direction: LedgerDirection.CREDIT,
        sourceType: LedgerSourceType.EXPENSE_TRANSACTION,
        sourceId: updated.id,
        transactionNumber: updated.transactionNumber,
        description: updated.description ?? updated.payeeName,
        amount: updated.amount,
        expenseId: updated.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: "VERIFY_EXPENSE",
        entity: "ExpenseTransaction",
        entityId: updated.id,
      },
    });

    return updated;
  });
}
