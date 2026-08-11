import { HouseholdStatus } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getContributionFeeConfig, resolveContributionAmount } from "./contribution-settings";
import { generateYearlyBills } from "./generate-yearly-bills";

type GenerateBillsInput = { year: number; month: number; actorId: string };

export async function generateMonthlyBills(input: GenerateBillsInput) {
  if (input.month < 1 || input.month > 12) {
    throw new Error("Bulan harus antara 1 sampai 12.");
  }

  const feeConfig = await getContributionFeeConfig();
  const households = await db.household.findMany({ where: { status: HouseholdStatus.ACTIVE, deletedAt: null }, orderBy: { code: "asc" } });
  return db.$transaction(async (tx) => {
    const created = households.length ? (await tx.contributionBill.createMany({
      data: households.map((household) => ({ householdId: household.id, year: input.year, month: input.month, amountDue: resolveContributionAmount(feeConfig, household) })),
      skipDuplicates: true,
    })).count : 0;
    await createAuditLog({ userId: input.actorId, action: "GENERATE_BILLS", entity: "ContributionBill", entityId: `${input.year}-${input.month}`, afterData: { year: input.year, month: input.month, households: households.length, normal: feeConfig.normal.toString(), special: feeConfig.special.toString() } }, tx);
    return { created };
  }, { maxWait: 10000, timeout: 15000 });
}

export { generateYearlyBills };
