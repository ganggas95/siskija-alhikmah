import { ContributionPaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { buildHouseholdWhere, type HouseholdFilterInput } from "@/modules/households/filters";
import {
  buildAnnualBillsMatrixRows,
  buildContributionExportRowsFromMatrix,
  type AnnualBillPaymentTotalRecord,
} from "@/modules/contributions/annual-bills";

export type ContributionExportInput = HouseholdFilterInput & { year: number };

export type ContributionExportRow = {
  code: string;
  name: string;
  monthlyAmounts: Array<number | null>;
};

export function mapContributionExportRows(
  households: Array<{
    id: string;
    code: string;
    headName: string;
    region: { name: string } | null;
  }>,
  bills: Array<{
    id: string;
    householdId: string;
    month: number;
    year: number;
    status: import("@prisma/client").BillStatus;
    amountDue: { toString(): string };
  }>,
  paymentTotals: AnnualBillPaymentTotalRecord[],
): ContributionExportRow[] {
  const rows = buildAnnualBillsMatrixRows({
    households,
    bills,
    paymentTotals,
  });

  return buildContributionExportRowsFromMatrix(rows);
}

export async function getContributionPaymentExportRows(
  input: ContributionExportInput,
): Promise<ContributionExportRow[]> {
  const households = await db.household.findMany({
    where: buildHouseholdWhere(input),
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      headName: true,
      region: { select: { name: true } },
    },
  });

  const householdIds = households.map((household) => household.id);
  const bills =
    householdIds.length > 0
      ? await db.contributionBill.findMany({
          where: {
            canceledAt: null,
            year: input.year,
            householdId: { in: householdIds },
          },
          select: {
            id: true,
            householdId: true,
            month: true,
            year: true,
            status: true,
            amountDue: true,
          },
          orderBy: [{ household: { code: "asc" } }, { month: "asc" }],
        })
      : [];

  const paymentTotals =
    bills.length > 0
      ? await db.contributionPayment.groupBy({
          by: ["billId"],
          where: {
            billId: { in: bills.map((bill) => bill.id) },
            canceledAt: null,
            status: ContributionPaymentStatus.VERIFIED,
          },
          _sum: { amountPaid: true },
        })
      : [];

  return mapContributionExportRows(
    households,
    bills,
    paymentTotals.map((item) => ({
      billId: item.billId,
      totalPaid: item._sum.amountPaid ?? 0,
    })),
  );
}
