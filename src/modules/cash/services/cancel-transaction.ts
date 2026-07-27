import { ExpenseStatus, IncomeStatus } from "@prisma/client";

import { db } from "@/lib/db";

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
      const updated = await tx.incomeTransaction.update({
        where: { id: input.id },
        data: {
          status: IncomeStatus.CANCELED,
          canceledAt: new Date(),
          description: input.reason,
        },
      });

      await tx.cashLedger.updateMany({
        where: {
          sourceId: input.id,
          isActive: true,
        },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          userId: input.actorId,
          action: "CANCEL_INCOME",
          entity: "IncomeTransaction",
          entityId: input.id,
          afterData: { reason: input.reason },
        },
      });

      return updated;
    }

    const updated = await tx.expenseTransaction.update({
      where: { id: input.id },
      data: {
        status: ExpenseStatus.CANCELED,
        canceledAt: new Date(),
        cancellationReason: input.reason,
      },
    });

    await tx.cashLedger.updateMany({
      where: {
        sourceId: input.id,
        isActive: true,
      },
      data: { isActive: false },
    });

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: "CANCEL_EXPENSE",
        entity: "ExpenseTransaction",
        entityId: input.id,
        afterData: { reason: input.reason },
      },
    });

    return updated;
  });
}
