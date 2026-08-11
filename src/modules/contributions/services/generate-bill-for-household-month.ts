import { HouseholdStatus } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  getContributionFeeConfig,
  resolveContributionAmount,
} from "./contribution-settings";

type GenerateBillForHouseholdMonthInput = {
  householdId: string;
  year: number;
  month: number;
  actorId: string;
};

export async function generateBillForHouseholdMonth(
  input: GenerateBillForHouseholdMonthInput,
) {
  if (input.month < 1 || input.month > 12) {
    throw new Error("Bulan harus antara 1 sampai 12.");
  }

  const household = await db.household.findUnique({
    where: { id: input.householdId },
    select: {
      id: true,
      code: true,
      headName: true,
      isDisabled: true,
      isElderly: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!household || household.deletedAt) {
    throw new Error("Jamaah tidak ditemukan.");
  }

  if (household.status !== HouseholdStatus.ACTIVE) {
    throw new Error("Hanya jamaah aktif yang dapat dibuatkan tagihan.");
  }

  const feeConfig = await getContributionFeeConfig();

  return db.$transaction(async (tx) => {
    const existing = await tx.contributionBill.findUnique({
      where: {
        householdId_year_month: {
          householdId: household.id,
          year: input.year,
          month: input.month,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return { created: false, billId: existing.id };
    }

    const bill = await tx.contributionBill.create({
      data: {
        householdId: household.id,
        year: input.year,
        month: input.month,
        amountDue: resolveContributionAmount(feeConfig, household),
      },
      select: { id: true },
    });

    await createAuditLog(
      {
        userId: input.actorId,
        action: "GENERATE_BILLS",
        entity: "ContributionBill",
        entityId: bill.id,
        afterData: {
          householdId: household.id,
          householdCode: household.code,
          householdName: household.headName,
          year: input.year,
          month: input.month,
        },
      },
      tx,
    );

    return { created: true, billId: bill.id };
  });
}
