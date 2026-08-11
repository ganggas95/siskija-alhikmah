import {
  BillStatus,
  ContributionPaymentStatus,
  Prisma,
} from "@prisma/client";
import Decimal from "decimal.js";

import { db } from "@/lib/db";
import {
  buildAnnualBillsSummary,
  buildAnnualBillsMatrixRows,
  type AnnualBillDraftPaymentRecord,
  type AnnualBillsSummary,
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
  summary?: AnnualBillsSummary;
}) {
  const rows = buildAnnualBillsMatrixRows({
    households: input.households,
    bills: input.bills,
    paymentTotals: input.paymentTotals,
    draftPayments: input.draftPayments,
  });

  return {
    rows,
    totalHouseholds: input.totalHouseholds,
    summary:
      input.summary ??
      buildAnnualBillsSummary({
        householdCount: input.totalHouseholds,
        bills: input.bills,
        paymentTotals: input.paymentTotals,
      }),
  };
}

export async function getAnnualBillsMatrix(input: AnnualBillsMatrixInput) {
  const householdWhere = buildAnnualBillsHouseholdWhere(input);
  const skip = Math.max((input.page ?? 1) - 1, 0) * (input.take ?? 25);
  const take = input.take ?? 25;

  const [households, totalHouseholds] = await Promise.all([
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
  ]);
  const householdIds = households.map((household) => household.id);

  const [
    filteredBills,
    paymentTotals,
    draftPayments,
    summaryByStatus,
    totalPaidAggregate,
    partialPaidAggregate,
  ] = await Promise.all([
    householdIds.length > 0
      ? db.contributionBill.findMany({
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
      : [],
    householdIds.length > 0
      ? db.contributionPayment.groupBy({
          by: ["billId"],
          where: {
            billId: {
              in: (
                await db.contributionBill.findMany({
                  where: {
                    canceledAt: null,
                    year: input.year,
                    householdId: { in: householdIds },
                  },
                  select: { id: true },
                })
              ).map((bill) => bill.id),
            },
            canceledAt: null,
            status: ContributionPaymentStatus.VERIFIED,
          },
          _sum: { amountPaid: true },
        })
      : [],
    householdIds.length > 0
      ? db.contributionPayment.findMany({
          where: {
            bill: {
              canceledAt: null,
              year: input.year,
              householdId: { in: householdIds },
            },
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
      : [],
    db.contributionBill.groupBy({
      by: ["status"],
      where: {
        canceledAt: null,
        year: input.year,
        household: householdWhere,
      },
      _count: { _all: true },
      _sum: { amountDue: true },
    }),
    db.contributionPayment.aggregate({
      where: {
        canceledAt: null,
        status: ContributionPaymentStatus.VERIFIED,
        bill: {
          canceledAt: null,
          year: input.year,
          household: householdWhere,
        },
      },
      _sum: { amountPaid: true },
    }),
    db.contributionPayment.aggregate({
      where: {
        canceledAt: null,
        status: ContributionPaymentStatus.VERIFIED,
        bill: {
          canceledAt: null,
          year: input.year,
          status: BillStatus.SEBAGIAN,
          household: householdWhere,
        },
      },
      _sum: { amountPaid: true },
    }),
  ]);
  const statusMap = new Map(summaryByStatus.map((item) => [item.status, item]));
  const totalAmountDue = summaryByStatus.reduce(
    (total, item) => total.plus(item._sum.amountDue?.toString() ?? "0"),
    new Decimal(0),
  );
  const unpaidAmountDue = new Decimal(
    statusMap.get(BillStatus.BELUM_BAYAR)?._sum.amountDue?.toString() ?? "0",
  );
  const partialAmountDue = new Decimal(
    statusMap.get(BillStatus.SEBAGIAN)?._sum.amountDue?.toString() ?? "0",
  );
  const partialPaid = new Decimal(partialPaidAggregate._sum.amountPaid?.toString() ?? "0");
  const totalPaid = new Decimal(totalPaidAggregate._sum.amountPaid?.toString() ?? "0");
  const totalOutstanding = unpaidAmountDue.plus(Decimal.max(partialAmountDue.minus(partialPaid), 0));
  const generatedBillCount = summaryByStatus.reduce(
    (total, item) => total + item._count._all,
    0,
  );
  const paidBillCount = statusMap.get(BillStatus.LUNAS)?._count._all ?? 0;
  const partialBillCount = statusMap.get(BillStatus.SEBAGIAN)?._count._all ?? 0;
  const unpaidBillCount = statusMap.get(BillStatus.BELUM_BAYAR)?._count._all ?? 0;
  const exemptedBillCount = statusMap.get(BillStatus.DIBEBASKAN)?._count._all ?? 0;
  const canceledBillCount = statusMap.get(BillStatus.DIBATALKAN)?._count._all ?? 0;
  const summary: AnnualBillsSummary = {
    householdCount: totalHouseholds,
    generatedBillCount,
    paidBillCount,
    partialBillCount,
    unpaidBillCount,
    exemptedBillCount,
    canceledBillCount,
    totalAmountDue: totalAmountDue.toString(),
    totalPaid: totalPaid.toString(),
    totalOutstanding: totalOutstanding.toString(),
    coverageRate: generatedBillCount ? Math.round((paidBillCount / generatedBillCount) * 100) : 0,
  };

  return buildAnnualBillsMatrixResult({
    households,
    totalHouseholds,
    bills: filteredBills,
    paymentTotals: paymentTotals.map((item) => ({
      billId: item.billId,
      totalPaid: item._sum.amountPaid ?? new Prisma.Decimal(0),
    })),
    draftPayments,
    summary,
  });
}
