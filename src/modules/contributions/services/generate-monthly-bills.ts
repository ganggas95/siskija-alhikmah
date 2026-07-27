import { HouseholdStatus } from "@prisma/client";

import { db } from "@/lib/db";

type GenerateBillsInput = {
  year: number;
  month: number;
  actorId: string;
  amountNormal: string;
  amountDiscounted: string;
};

export async function generateMonthlyBills(input: GenerateBillsInput) {
  const households = await db.household.findMany({
    where: {
      status: HouseholdStatus.ACTIVE,
      deletedAt: null,
    },
    orderBy: { code: "asc" },
  });

  const result = await db.$transaction(async (tx) => {
    let created = 0;

    for (const household of households) {
      const amountDue =
        household.isDisabled || household.isElderly
          ? input.amountDiscounted
          : input.amountNormal;

      await tx.contributionBill.upsert({
        where: {
          householdId_year_month: {
            householdId: household.id,
            year: input.year,
            month: input.month,
          },
        },
        update: {},
        create: {
          householdId: household.id,
          year: input.year,
          month: input.month,
          amountDue,
        },
      });

      created += 1;
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: "GENERATE_BILLS",
        entity: "ContributionBill",
        entityId: `${input.year}-${input.month}`,
        afterData: {
          year: input.year,
          month: input.month,
          households: households.length,
        },
      },
    });

    return { created };
  });

  return result;
}
