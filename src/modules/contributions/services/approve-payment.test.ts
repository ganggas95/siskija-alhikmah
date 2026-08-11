import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { BillStatus } from "@prisma/client";
import { deriveContributionBillStatus } from "./approve-payment";

describe("deriveContributionBillStatus", () => {
  const due = new Decimal("100000");

  it("mengembalikan BELUM_BAYAR jika belum ada pembayaran valid", () => {
    expect(deriveContributionBillStatus(due, new Decimal(0))).toBe(BillStatus.BELUM_BAYAR);
  });

  it("mengembalikan SEBAGIAN jika total pembayaran kurang dari tagihan", () => {
    expect(deriveContributionBillStatus(due, new Decimal("50000"))).toBe(BillStatus.SEBAGIAN);
  });

  it("mengembalikan LUNAS jika pembayaran sama atau melebihi tagihan", () => {
    expect(deriveContributionBillStatus(due, new Decimal("100000"))).toBe(BillStatus.LUNAS);
    expect(deriveContributionBillStatus(due, new Decimal("125000"))).toBe(BillStatus.LUNAS);
  });
});
