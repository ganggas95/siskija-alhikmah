import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import { mapContributionExportRows } from "./export-contribution-payments";

describe("mapContributionExportRows", () => {
  it("menjumlahkan pembayaran dalam bulan yang sama dan mempertahankan bulan kosong", () => {
    const rows = mapContributionExportRows([
      {
        code: "JMH-00001",
        headName: "Ahmad",
        contributionBills: [
          { month: 1, payments: [{ amountPaid: new Decimal("10000") }, { amountPaid: new Decimal("2500") }] },
          { month: 2, payments: [] },
          { month: 3, payments: [{ amountPaid: new Decimal("15000.50") }] },
          { month: 13, payments: [{ amountPaid: new Decimal("999") }] },
        ],
      },
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
