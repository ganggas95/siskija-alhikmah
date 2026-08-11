import { BillStatus } from "@prisma/client";
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import {
  buildAnnualBillsHouseholdWhere,
  buildAnnualBillsMatrixResult,
} from "./get-annual-bills-matrix";

describe("buildAnnualBillsMatrixResult", () => {
  it("memetakan 12 bulan, total bayar, dan summary tahunan dengan benar", () => {
    const result = buildAnnualBillsMatrixResult({
      households: [
        {
          id: "household-1",
          code: "JMH-00001",
          headName: "Ahmad",
          region: { name: "Utara" },
        },
        {
          id: "household-2",
          code: "JMH-00002",
          headName: "Budi",
          region: null,
        },
      ],
      totalHouseholds: 2,
      bills: [
        {
          id: "bill-1",
          householdId: "household-1",
          month: 1,
          year: 2026,
          status: BillStatus.LUNAS,
          amountDue: new Decimal("10000"),
        },
        {
          id: "bill-2",
          householdId: "household-1",
          month: 2,
          year: 2026,
          status: BillStatus.SEBAGIAN,
          amountDue: new Decimal("10000"),
        },
        {
          id: "bill-3",
          householdId: "household-2",
          month: 1,
          year: 2026,
          status: BillStatus.DIBEBASKAN,
          amountDue: new Decimal("10000"),
        },
      ],
      paymentTotals: [
        { billId: "bill-1", totalPaid: new Decimal("10000") },
        { billId: "bill-2", totalPaid: new Decimal("4000") },
      ],
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.months[0]).toMatchObject({
      billId: "bill-1",
      status: BillStatus.LUNAS,
      paidAmount: "10000",
      outstandingAmount: "0",
    });
    expect(result.rows[0]?.months[1]).toMatchObject({
      billId: "bill-2",
      status: BillStatus.SEBAGIAN,
      paidAmount: "4000",
      outstandingAmount: "6000",
    });
    expect(result.rows[1]?.months[0]).toMatchObject({
      billId: "bill-3",
      status: BillStatus.DIBEBASKAN,
      outstandingAmount: "0",
    });
    expect(result.summary).toMatchObject({
      householdCount: 2,
      generatedBillCount: 3,
      paidBillCount: 1,
      partialBillCount: 1,
      unpaidBillCount: 0,
      exemptedBillCount: 1,
      totalAmountDue: "30000",
      totalPaid: "14000",
      totalOutstanding: "6000",
      coverageRate: 33,
    });
  });
});

describe("buildAnnualBillsHouseholdWhere", () => {
  it("menerapkan filter household dan status tahunan sebagai filter household-level", () => {
    expect(
      buildAnnualBillsHouseholdWhere({
        year: 2026,
        query: "Ahmad",
        regionId: "region-1",
        status: BillStatus.SEBAGIAN,
      }),
    ).toMatchObject({
      deletedAt: null,
      regionId: "region-1",
      contributionBills: {
        some: {
          year: 2026,
          status: BillStatus.SEBAGIAN,
          canceledAt: null,
        },
      },
    });
  });
});
