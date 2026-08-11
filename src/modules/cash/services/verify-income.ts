import {
  CategoryType,
  IncomeStatus,
  LedgerDirection,
  LedgerSourceType,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { postLedgerEntry } from "@/modules/ledger";

type VerifyIncomeInput = {
  incomeId: string;
  actorId: string;
};

export async function verifyIncome(input: VerifyIncomeInput) {
  const income = await db.incomeTransaction.findUnique({
    where: { id: input.incomeId },
    include: {
      category: {
        select: {
          type: true,
        },
      },
    },
  });

  if (!income) {
    throw new Error("Transaksi kas masuk tidak ditemukan.");
  }

  if (income.status !== IncomeStatus.DRAFT) {
    throw new Error("Hanya transaksi kas masuk berstatus DRAFT yang dapat diverifikasi.");
  }

  if (income.category.type !== CategoryType.INCOME) {
    throw new Error("Kategori transaksi tidak valid untuk kas masuk.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.incomeTransaction.update({
      where: { id: input.incomeId },
      data: {
        status: IncomeStatus.VERIFIED,
        verifiedById: input.actorId,
      },
    });

    await postLedgerEntry(tx, {
      transactionDate: updated.transactionDate,
      direction: LedgerDirection.DEBIT,
      sourceType: LedgerSourceType.INCOME_TRANSACTION,
      sourceId: updated.id,
      transactionNumber: updated.transactionNumber,
      description: updated.description ?? updated.sourceName,
      amount: updated.amount,
      incomeId: updated.id,
    });

    await createAuditLog(
      {
        userId: input.actorId,
        action: "VERIFY_INCOME",
        entity: "IncomeTransaction",
        entityId: updated.id,
        beforeData: { status: income.status },
        afterData: { status: updated.status },
      },
      tx,
    );

    return updated;
  });
}
