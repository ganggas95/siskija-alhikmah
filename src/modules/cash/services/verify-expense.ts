import {
  CategoryType,
  ExpenseStatus,
  LedgerDirection,
  LedgerSourceType,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getCurrentCashBalance, postLedgerEntry } from "@/modules/ledger";

type VerifyExpenseInput = {
  expenseId: string;
  actorId: string;
};

export async function verifyExpense(input: VerifyExpenseInput) {
  const expense = await db.expenseTransaction.findUnique({
    where: { id: input.expenseId },
    include: {
      category: {
        select: {
          type: true,
        },
      },
    },
  });

  if (!expense) {
    throw new Error("Transaksi kas keluar tidak ditemukan.");
  }

  if (
    expense.status !== ExpenseStatus.DRAFT &&
    expense.status !== ExpenseStatus.PENDING_VERIFICATION
  ) {
    throw new Error("Status transaksi kas keluar tidak valid untuk diverifikasi.");
  }

  if (expense.category.type !== CategoryType.EXPENSE) {
    throw new Error("Kategori transaksi tidak valid untuk kas keluar.");
  }

  return db.$transaction(async (tx) => {
    const currentBalance = await getCurrentCashBalance(tx);

    if (currentBalance.lessThan(expense.amount.toString())) {
      throw new Error("Saldo kas tidak mencukupi untuk memverifikasi pengeluaran ini.");
    }

    const updated = await tx.expenseTransaction.update({
      where: { id: input.expenseId },
      data: {
        status: ExpenseStatus.VERIFIED,
        verifiedById: input.actorId,
      },
    });

    await postLedgerEntry(tx, {
      transactionDate: updated.transactionDate,
      direction: LedgerDirection.CREDIT,
      sourceType: LedgerSourceType.EXPENSE_TRANSACTION,
      sourceId: updated.id,
      transactionNumber: updated.transactionNumber,
      description: updated.description ?? updated.payeeName,
      amount: updated.amount,
      expenseId: updated.id,
    });

    await createAuditLog(
      {
        userId: input.actorId,
        action: "VERIFY_EXPENSE",
        entity: "ExpenseTransaction",
        entityId: updated.id,
        beforeData: { status: expense.status },
        afterData: { status: updated.status },
      },
      tx,
    );

    return updated;
  });
}
