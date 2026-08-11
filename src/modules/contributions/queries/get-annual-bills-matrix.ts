import {
  BillStatus,
  ContributionPaymentStatus,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  buildAnnualBillsMatrixRows,
  buildAnnualBillsSummary,
  type AnnualBillDraftPaymentRecord,
  type AnnualBillPaymentTotalRecord,
} from "@/modules/contributions/annual-bills";

export type AnnualBillsMatrixInput = {
  year: number;
  query?: string;
  regionId?: string;
  status?: BillStatus | "all";
  page?: number;
  take?: number;
};

export function buildAnnualBillsHouseholdWhere({
  year,
  query,
  regionId,
  status,
}: Pick<AnnualBillsMatrixInput, "year" | "query" | "regionId" | "status">): Prisma.HouseholdWhereInput {
  return {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { headName: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { rt: { contains: query, mode: "insensitive" } },
            { rw: { contains: query, mode: "insensitive" } },
            { region: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(regionId && regionId !== "all" ? { regionId } : {}),
    ...(status && status !== "all"
      ? {
          contributionBills: {
            some: {
              year,
              status,
              canceledAt: null,
            },
          },
        }
      : {}),
  };
}

export function buildAnnualBillsMatrixResult(input: {
  households: Array<{
    id: string;
    code: string;
    headName: string;
    region: { name: string } | null;
  }>;
  totalHouseholds: number;
  bills: Array<{
    id: string;
    householdId: string;
    month: number;
    year: number;
    status: BillStatus;
    amountDue: { toString(): string };
  }>;
  paymentTotals: AnnualBillPaymentTotalRecord[];
  draftPayments?: AnnualBillDraftPaymentRecord[];
}) {
  const rows = buildAnnualBillsMatrixRows({
    households: input.households,
    bills: input.bills,
    paymentTotals: input.paymentTotals,
    draftPayments: input.draftPayments,
  });
  const summary = buildAnnualBillsSummary({
    householdCount: input.totalHouseholds,
    bills: input.bills,
    paymentTotals: input.paymentTotals,
  });

  return {
    rows,
    totalHouseholds: input.totalHouseholds,
    summary,
  };
}

export async function getAnnualBillsMatrix(input: AnnualBillsMatrixInput) {
  const householdWhere = buildAnnualBillsHouseholdWhere(input);
  const skip = Math.max((input.page ?? 1) - 1, 0) * (input.take ?? 25);
  const take = input.take ?? 25;

  const [households, totalHouseholds, filteredBills] = await Promise.all([
    db.household.findMany({
      where: householdWhere,
      select: {
        id: true,
        code: true,
        headName: true,
        region: { select: { name: true } },
      },
      orderBy: { code: "asc" },
      skip,
      take,
    }),
    db.household.count({ where: householdWhere }),
    db.contributionBill.findMany({
      where: {
        canceledAt: null,
        year: input.year,
        household: householdWhere,
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
    }),
  ]);

  const paymentTotals =
    filteredBills.length > 0
      ? await db.contributionPayment.groupBy({
          by: ["billId"],
          where: {
            billId: { in: filteredBills.map((bill) => bill.id) },
            canceledAt: null,
            status: ContributionPaymentStatus.VERIFIED,
          },
          _sum: { amountPaid: true },
        })
      : [];
  const draftPayments =
    filteredBills.length > 0
      ? await db.contributionPayment.findMany({
          where: {
            billId: { in: filteredBills.map((bill) => bill.id) },
            canceledAt: null,
            status: ContributionPaymentStatus.DRAFT,
          },
          select: {
            id: true,
            billId: true,
            createdAt: true,
          },
          orderBy: [{ billId: "asc" }, { createdAt: "desc" }],
        })
      : [];

  return buildAnnualBillsMatrixResult({
    households,
    totalHouseholds,
    bills: filteredBills,
    paymentTotals: paymentTotals.map((item) => ({
      billId: item.billId,
      totalPaid: item._sum.amountPaid ?? new Prisma.Decimal(0),
    })),
    draftPayments,
  });
}
