import Decimal from "decimal.js";
import { db } from "@/lib/db";

export type ContributionFeeConfig = { normal: Decimal; special: Decimal };

export async function getContributionFeeConfig(): Promise<ContributionFeeConfig> {
  const profile = await db.mosqueProfile.findFirst({ orderBy: { createdAt: "asc" }, select: { defaultContributionFee: true, specialContributionFee: true } });
  const legacy = profile ? null : await db.contributionSetting.findFirst({ where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, select: { defaultAmount: true } });
  const normal = profile?.defaultContributionFee ?? legacy?.defaultAmount ?? new Decimal(0);
  const special = profile?.specialContributionFee ?? normal;
  if (normal.lt(0) || special.lt(0)) throw new Error("Konfigurasi iuran tidak valid.");
  return { normal, special };
}

export function resolveContributionAmount(config: ContributionFeeConfig, household: { isElderly: boolean; isDisabled: boolean }) {
  return household.isElderly || household.isDisabled ? config.special : config.normal;
}
