import {
  ExpenseStatus,
  IncomeStatus,
  LedgerSourceType,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { reverseLedgerEntries } from "@/modules/ledger";

type CancelTransactionInput =
  | {
      type: "income";
      id: string;
      actorId: string;
      reason?: string;
    }
  | {
      type: "expense";
      id: string;
      actorId: string;
      reason?: string;
    };

export async function cancelTransaction(input: CancelTransactionInput) {
  return db.$transaction(async (tx) => {
    if (input.type === "income") {
      const existing = await tx.incomeTransaction.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          canceledAt: true,
          description: true,
        },
      });

      if (!existing) {
        throw new Error("Transaksi kas masuk tidak ditemukan.");
      }

      if (existing.status === IncomeStatus.CANCELED || existing.canceledAt) {
        throw new Error("Transaksi kas masuk sudah dibatalkan.");
      }

      const updated = await tx.incomeTransaction.update({
        where: { id: input.id },
        data: {
          status: IncomeStatus.CANCELED,
          canceledAt: new Date(),
          description: input.reason || existing.description,
        },
      });

      await reverseLedgerEntries(tx, {
        sourceType: LedgerSourceType.INCOME_TRANSACTION,
        sourceId: input.id,
        reason: input.reason ?? "Transaksi kas masuk dibatalkan",
      });

      await createAuditLog(
        {
          userId: input.actorId,
          action: "CANCEL_INCOME",
          entity: "IncomeTransaction",
          entityId: input.id,
          beforeData: { status: existing.status },
          afterData: { status: updated.status, reason: input.reason },
        },
        tx,
      );

      return updated;
    }

    const existing = await tx.expenseTransaction.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        status: true,
        canceledAt: true,
      },
    });

    if (!existing) {
      throw new Error("Transaksi kas keluar tidak ditemukan.");
    }

    if (existing.status === ExpenseStatus.CANCELED || existing.canceledAt) {
      throw new Error("Transaksi kas keluar sudah dibatalkan.");
    }

    const updated = await tx.expenseTransaction.update({
      where: { id: input.id },
      data: {
        status: ExpenseStatus.CANCELED,
        canceledAt: new Date(),
        cancellationReason: input.reason,
      },
    });

    await reverseLedgerEntries(tx, {
      sourceType: LedgerSourceType.EXPENSE_TRANSACTION,
      sourceId: input.id,
      reason: input.reason ?? "Transaksi kas keluar dibatalkan",
    });

    await createAuditLog(
      {
        userId: input.actorId,
        action: "CANCEL_EXPENSE",
        entity: "ExpenseTransaction",
        entityId: input.id,
        beforeData: { status: existing.status },
        afterData: { status: updated.status, reason: input.reason },
      },
      tx,
    );

    return updated;
  });
}
