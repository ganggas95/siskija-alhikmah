import { BillStatus } from "@prisma/client";
import Decimal from "decimal.js";

export const CONTRIBUTION_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export type AnnualBillCell = {
  billId: string;
  householdId: string;
  householdCode: string;
  householdName: string;
  month: number;
  year: number;
  status: BillStatus;
  amountDue: string;
  paidAmount: string;
  outstandingAmount: string;
  draftPaymentCount: number;
  latestDraftPaymentId: string | null;
};

export type AnnualBillsMatrixRow = {
  householdId: string;
  code: string;
  name: string;
  regionName: string | null;
  months: Array<AnnualBillCell | null>;
};

export type AnnualBillRecord = {
  id: string;
  householdId: string;
  month: number;
  year: number;
  status: BillStatus;
  amountDue: { toString(): string };
};

export type AnnualBillPaymentTotalRecord = {
  billId: string;
  totalPaid: { toString(): string };
};

export type AnnualBillDraftPaymentRecord = {
  id: string;
  billId: string;
  createdAt: Date;
};

export type AnnualHouseholdRecord = {
  id: string;
  code: string;
  headName: string;
  region: { name: string } | null;
};

export type AnnualBillsSummary = {
  householdCount: number;
  generatedBillCount: number;
  paidBillCount: number;
  partialBillCount: number;
  unpaidBillCount: number;
  exemptedBillCount: number;
  canceledBillCount: number;
  totalAmountDue: string;
  totalPaid: string;
  totalOutstanding: string;
  coverageRate: number;
};

export function getBillStatusLabel(status: BillStatus) {
  switch (status) {
    case BillStatus.LUNAS:
      return "Lunas";
    case BillStatus.SEBAGIAN:
      return "Sebagian";
    case BillStatus.DIBEBASKAN:
      return "Dibebaskan";
    case BillStatus.DIBATALKAN:
      return "Dibatalkan";
    case BillStatus.BELUM_BAYAR:
    default:
      return "Belum";
  }
}

function buildPaymentTotalsMap(
  paymentTotals: AnnualBillPaymentTotalRecord[] = [],
) {
  return new Map(
    paymentTotals.map((payment) => [
      payment.billId,
      new Decimal(payment.totalPaid.toString()),
    ]),
  );
}

export function buildAnnualBillsMatrixRows(input: {
  households: AnnualHouseholdRecord[];
  bills: AnnualBillRecord[];
  paymentTotals: AnnualBillPaymentTotalRecord[];
  draftPayments?: AnnualBillDraftPaymentRecord[];
}) {
  const paymentTotalsByBillId = buildPaymentTotalsMap(input.paymentTotals);
  const draftPayments = input.draftPayments ?? [];
  const draftPaymentCountByBillId = new Map<string, number>();
  const latestDraftPaymentByBillId = new Map<string, string>();
  const billsByHouseholdId = new Map<string, AnnualBillRecord[]>();

  for (const draftPayment of draftPayments) {
    draftPaymentCountByBillId.set(
      draftPayment.billId,
      (draftPaymentCountByBillId.get(draftPayment.billId) ?? 0) + 1,
    );

    if (!latestDraftPaymentByBillId.has(draftPayment.billId)) {
      latestDraftPaymentByBillId.set(draftPayment.billId, draftPayment.id);
    }
  }

  for (const bill of input.bills) {
    const items = billsByHouseholdId.get(bill.householdId) ?? [];
    items.push(bill);
    billsByHouseholdId.set(bill.householdId, items);
  }

  return input.households.map<AnnualBillsMatrixRow>((household) => {
    const months = Array<AnnualBillCell | null>(12).fill(null);

    for (const bill of billsByHouseholdId.get(household.id) ?? []) {
      if (bill.month < 1 || bill.month > 12) continue;
      const amountDue = new Decimal(bill.amountDue.toString());
      const paidAmount = paymentTotalsByBillId.get(bill.id) ?? new Decimal(0);
      const outstandingAmount =
        bill.status === BillStatus.DIBATALKAN || bill.status === BillStatus.DIBEBASKAN
          ? new Decimal(0)
          : Decimal.max(amountDue.minus(paidAmount), 0);

      months[bill.month - 1] = {
        billId: bill.id,
        householdId: household.id,
        householdCode: household.code,
        householdName: household.headName,
        month: bill.month,
        year: bill.year,
        status: bill.status,
        amountDue: amountDue.toString(),
        paidAmount: paidAmount.toString(),
        outstandingAmount: outstandingAmount.toString(),
        draftPaymentCount: draftPaymentCountByBillId.get(bill.id) ?? 0,
        latestDraftPaymentId: latestDraftPaymentByBillId.get(bill.id) ?? null,
      };
    }

    return {
      householdId: household.id,
      code: household.code,
      name: household.headName,
      regionName: household.region?.name ?? null,
      months,
    };
  });
}

export function buildAnnualBillsSummary(input: {
  householdCount: number;
  bills: AnnualBillRecord[];
  paymentTotals: AnnualBillPaymentTotalRecord[];
}) {
  const paymentTotalsByBillId = buildPaymentTotalsMap(input.paymentTotals);
  let totalAmountDue = new Decimal(0);
  let totalPaid = new Decimal(0);
  let totalOutstanding = new Decimal(0);
  let paidBillCount = 0;
  let partialBillCount = 0;
  let unpaidBillCount = 0;
  let exemptedBillCount = 0;
  let canceledBillCount = 0;

  for (const bill of input.bills) {
    const amountDue = new Decimal(bill.amountDue.toString());
    const paidAmount = paymentTotalsByBillId.get(bill.id) ?? new Decimal(0);

    totalAmountDue = totalAmountDue.plus(amountDue);
    totalPaid = totalPaid.plus(paidAmount);

    switch (bill.status) {
      case BillStatus.LUNAS:
        paidBillCount += 1;
        break;
      case BillStatus.SEBAGIAN:
        partialBillCount += 1;
        totalOutstanding = totalOutstanding.plus(
          Decimal.max(amountDue.minus(paidAmount), 0),
        );
        break;
      case BillStatus.DIBEBASKAN:
        exemptedBillCount += 1;
        break;
      case BillStatus.DIBATALKAN:
        canceledBillCount += 1;
        break;
      case BillStatus.BELUM_BAYAR:
      default:
        unpaidBillCount += 1;
        totalOutstanding = totalOutstanding.plus(amountDue);
        break;
    }
  }

  const generatedBillCount = input.bills.length;
  const coverageRate = generatedBillCount
    ? Math.round((paidBillCount / generatedBillCount) * 100)
    : 0;

  return {
    householdCount: input.householdCount,
    generatedBillCount,
    paidBillCount,
    partialBillCount,
    unpaidBillCount,
    exemptedBillCount,
    canceledBillCount,
    totalAmountDue: totalAmountDue.toString(),
    totalPaid: totalPaid.toString(),
    totalOutstanding: totalOutstanding.toString(),
    coverageRate,
  } satisfies AnnualBillsSummary;
}

export function buildContributionExportRowsFromMatrix(
  rows: AnnualBillsMatrixRow[],
) {
  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    monthlyAmounts: row.months.map((month) => {
      if (!month) return null;
      const paidAmount = new Decimal(month.paidAmount);
      return paidAmount.gt(0) ? Number(paidAmount.toString()) : null;
    }),
  }));
}
