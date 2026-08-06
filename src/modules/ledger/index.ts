import {
  LedgerDirection,
  LedgerSourceType,
  Prisma,
} from "@prisma/client";
import Decimal from "decimal.js";

type TransactionClient = Prisma.TransactionClient;

type PostLedgerEntryInput = {
  transactionDate: Date;
  direction: LedgerDirection;
  sourceType: LedgerSourceType;
  sourceId: string;
  transactionNumber: string;
  description: string;
  amount: Prisma.Decimal | Decimal | string;
  incomeId?: string | null;
  expenseId?: string | null;
};

type ReverseLedgerInput = {
  sourceType: LedgerSourceType;
  sourceId: string;
  reason?: string | null;
};

function oppositeDirection(direction: LedgerDirection) {
  return direction === LedgerDirection.DEBIT
    ? LedgerDirection.CREDIT
    : LedgerDirection.DEBIT;
}

export async function postLedgerEntry(
  tx: TransactionClient,
  input: PostLedgerEntryInput,
) {
  const existing = await tx.cashLedger.findUnique({
    where: {
      sourceType_sourceId_isActive: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        isActive: true,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return tx.cashLedger.create({
    data: {
      transactionDate: input.transactionDate,
      direction: input.direction,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      transactionNumber: input.transactionNumber,
      description: input.description,
      amount:
        input.amount instanceof Decimal
          ? new Prisma.Decimal(input.amount.toFixed(2))
          : input.amount,
      incomeId: input.incomeId ?? undefined,
      expenseId: input.expenseId ?? undefined,
    },
  });
}

export async function reverseLedgerEntries(
  tx: TransactionClient,
  input: ReverseLedgerInput,
) {
  const activeEntries = await tx.cashLedger.findMany({
    where: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (activeEntries.length === 0) {
    return [];
  }

  const reversals = [];

  for (const entry of activeEntries) {
    await tx.cashLedger.update({
      where: { id: entry.id },
      data: { isActive: false },
    });

    reversals.push(
      await tx.cashLedger.upsert({
        where: {
          sourceType_sourceId_isActive: {
            sourceType: LedgerSourceType.REVERSAL,
            sourceId: entry.id,
            isActive: true,
          },
        },
        update: {},
        create: {
          transactionDate: new Date(),
          direction: oppositeDirection(entry.direction),
          sourceType: LedgerSourceType.REVERSAL,
          sourceId: entry.id,
          transactionNumber: `${entry.transactionNumber}-REV`,
          description: input.reason
            ? `Reversal ${entry.transactionNumber}: ${input.reason}`
            : `Reversal ${entry.transactionNumber}`,
          amount: entry.amount,
          incomeId: entry.incomeId,
          expenseId: entry.expenseId,
        },
      }),
    );
  }

  return reversals;
}

export async function getCurrentCashBalance(tx: TransactionClient) {
  const entries = await tx.cashLedger.findMany({
    where: { isActive: true },
    select: { direction: true, amount: true },
  });

  return entries.reduce((total, entry) => {
    const amount = new Decimal(entry.amount.toString());
    return entry.direction === LedgerDirection.DEBIT
      ? total.plus(amount)
      : total.minus(amount);
  }, new Decimal(0));
}
