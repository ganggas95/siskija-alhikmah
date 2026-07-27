import { IncomeStatus, LedgerDirection, LedgerSourceType } from "@prisma/client";

import { db } from "@/lib/db";

type VerifyIncomeInput = {
  incomeId: string;
  actorId: string;
};

export async function verifyIncome(input: VerifyIncomeInput) {
  const income = await db.incomeTransaction.findUnique({
    where: { id: input.incomeId },
  });

  if (!income) {
    throw new Error("Transaksi kas masuk tidak ditemukan.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.incomeTransaction.update({
      where: { id: input.incomeId },
      data: {
        status: IncomeStatus.VERIFIED,
        verifiedById: input.actorId,
      },
    });

    await tx.cashLedger.upsert({
      where: {
        sourceType_sourceId_isActive: {
          sourceType: LedgerSourceType.INCOME_TRANSACTION,
          sourceId: updated.id,
          isActive: true,
        },
      },
      update: {},
      create: {
        transactionDate: updated.transactionDate,
        direction: LedgerDirection.DEBIT,
        sourceType: LedgerSourceType.INCOME_TRANSACTION,
        sourceId: updated.id,
        transactionNumber: updated.transactionNumber,
        description: updated.description ?? updated.sourceName,
        amount: updated.amount,
        incomeId: updated.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: "VERIFY_INCOME",
        entity: "IncomeTransaction",
        entityId: updated.id,
      },
    });

    return updated;
  });
}
