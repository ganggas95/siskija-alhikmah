import Decimal from "decimal.js";
import { db } from "@/lib/db";
import { buildHouseholdWhere, type HouseholdFilterInput } from "@/modules/households/filters";

export type ContributionExportInput = HouseholdFilterInput & { year: number };

export type ContributionExportRow = {
  code: string;
  name: string;
  monthlyAmounts: Array<number | null>;
};

type ContributionExportHousehold = {
  code: string;
  headName: string;
  contributionBills: Array<{
    month: number;
    payments: Array<{ amountPaid: { toString(): string } }>;
  }>;
};

export function mapContributionExportRows(
  households: ContributionExportHousehold[],
): ContributionExportRow[] {
  return households.map((household) => {
    const monthlyAmounts = Array<number | null>(12).fill(null);

    for (const bill of household.contributionBills) {
      if (bill.month < 1 || bill.month > 12) continue;
      const total = bill.payments.reduce(
        (sum, payment) => sum.plus(payment.amountPaid.toString()),
        new Decimal(0),
      );
      if (total.gt(0)) {
        monthlyAmounts[bill.month - 1] = Number(total.toString());
      }
    }

    return {
      code: household.code,
      name: household.headName,
      monthlyAmounts,
    };
  });
}

export async function getContributionPaymentExportRows(
  input: ContributionExportInput,
): Promise<ContributionExportRow[]> {
  const households = await db.household.findMany({
    where: buildHouseholdWhere(input),
    orderBy: { code: "asc" },
    select: {
      code: true,
      headName: true,
      contributionBills: {
        where: { year: input.year },
        select: {
          month: true,
          payments: {
            where: { canceledAt: null },
            select: { amountPaid: true },
          },
        },
      },
    },
  });

  return mapContributionExportRows(households);
}
