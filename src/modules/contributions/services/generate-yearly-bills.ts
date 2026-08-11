import { HouseholdStatus } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  getContributionFeeConfig,
  resolveContributionAmount,
} from "./contribution-settings";

type GenerateYearlyBillsInput = {
  year: number;
  actorId: string;
};

export async function generateYearlyBills(input: GenerateYearlyBillsInput) {
  const feeConfig = await getContributionFeeConfig();
  const households = await db.household.findMany({
    where: { status: HouseholdStatus.ACTIVE, deletedAt: null },
    orderBy: { code: "asc" },
  });

  return db.$transaction(
    async (tx) => {
      const results: Array<{ month: number; created: number }> = [];

      for (let month = 1; month <= 12; month += 1) {
        const created = households.length
          ? (
              await tx.contributionBill.createMany({
                data: households.map((household) => ({
                  householdId: household.id,
                  year: input.year,
                  month,
                  amountDue: resolveContributionAmount(feeConfig, household),
                })),
                skipDuplicates: true,
              })
            ).count
          : 0;

        results.push({ month, created });
      }

      const created = results.reduce((total, item) => total + item.created, 0);
      const skipped = households.length * 12 - created;

      await createAuditLog(
        {
          userId: input.actorId,
          action: "GENERATE_BILLS",
          entity: "ContributionBill",
          entityId: String(input.year),
          afterData: {
            year: input.year,
            households: households.length,
            created,
            skipped,
            normal: feeConfig.normal.toString(),
            special: feeConfig.special.toString(),
            months: results,
          },
        },
        tx,
      );

      return {
        created,
        skipped,
        households: households.length,
        months: results,
      };
    },
    { maxWait: 10000, timeout: 20000 },
  );
}
