import { describe, expect, it } from "vitest";

import { formatRupiah, sumMoney, toDecimal } from "@/lib/money";

describe("money utils", () => {
  it("menjumlahkan nominal dengan presisi decimal", () => {
    const total = sumMoney([10000, "25000", toDecimal("15000.00")]);
    expect(total.toString()).toBe("50000");
  });

  it("memformat nominal menjadi Rupiah", () => {
    expect(formatRupiah(50000)).toContain("50.000");
  });
});
