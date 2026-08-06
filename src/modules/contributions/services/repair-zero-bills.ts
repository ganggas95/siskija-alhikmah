import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getContributionFeeConfig, resolveContributionAmount } from "./contribution-settings";

/** Repairs only legacy zero-value bills that have no payment history. */
export async function repairLegacyZeroContributionBills(actorId: string) {
  const fees = await getContributionFeeConfig();
  const bills = await db.contributionBill.findMany({ where: { amountDue: 0, payments: { none: {} } }, include: { household: { select: { isElderly: true, isDisabled: true, status: true } } } });
  return db.$transaction(async (tx) => {
    let repaired = 0;
    for (const bill of bills) {
      const amount = resolveContributionAmount(fees, bill.household);
      await tx.contributionBill.update({ where: { id: bill.id }, data: { amountDue: amount } });
      await createAuditLog({ userId: actorId, action: "REPAIR_ZERO_CONTRIBUTION_BILL", entity: "ContributionBill", entityId: bill.id, beforeData: { amountDue: "0" }, afterData: { amountDue: amount.toString(), householdStatus: bill.household.status } }, tx);
      repaired += 1;
    }
    return { repaired };
  });
}
