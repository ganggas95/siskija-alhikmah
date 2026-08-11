import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { BillStatus } from "@prisma/client";

import { mapContributionExportRows } from "./export-contribution-payments";

describe("mapContributionExportRows", () => {
  it("menjumlahkan pembayaran dalam bulan yang sama dan mempertahankan bulan kosong", () => {
    const rows = mapContributionExportRows([
      {
        id: "household-1",
        code: "JMH-00001",
        headName: "Ahmad",
        region: null,
      },
    ], [
      {
        id: "bill-1",
        householdId: "household-1",
        month: 1,
        year: 2026,
        status: BillStatus.LUNAS,
        amountDue: new Decimal("12500"),
      },
      {
        id: "bill-2",
        householdId: "household-1",
        month: 2,
        year: 2026,
        status: BillStatus.BELUM_BAYAR,
        amountDue: new Decimal("10000"),
      },
      {
        id: "bill-3",
        householdId: "household-1",
        month: 3,
        year: 2026,
        status: BillStatus.SEBAGIAN,
        amountDue: new Decimal("20000"),
      },
      {
        id: "bill-4",
        householdId: "household-1",
        month: 13,
        year: 2026,
        status: BillStatus.LUNAS,
        amountDue: new Decimal("999"),
      },
    ], [
      { billId: "bill-1", totalPaid: new Decimal("12500") },
      { billId: "bill-3", totalPaid: new Decimal("15000.50") },
      { billId: "bill-4", totalPaid: new Decimal("999") },
    ]);

    expect(rows).toEqual([
      {
        code: "JMH-00001",
        name: "Ahmad",
        monthlyAmounts: [12500, null, 15000.5, ...Array<number | null>(9).fill(null)],
      },
    ]);
  });
});
