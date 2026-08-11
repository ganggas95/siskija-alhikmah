import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  getContributionFeeConfig: vi.fn(),
  db: {
    household: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

vi.mock("./contribution-settings", () => ({
  getContributionFeeConfig: mocks.getContributionFeeConfig,
  resolveContributionAmount: (_config: { normal: { toString(): string }; special: { toString(): string } }, household: { isElderly: boolean; isDisabled: boolean }) =>
    household.isElderly || household.isDisabled ? 5000 : 10000,
}));

import { generateYearlyBills } from "./generate-yearly-bills";

describe("generateYearlyBills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("membuat 12 batch bulanan, idempoten, dan hanya untuk household aktif", async () => {
    mocks.getContributionFeeConfig.mockResolvedValue({
      normal: { toString: () => "10000" },
      special: { toString: () => "5000" },
    });
    mocks.db.household.findMany.mockResolvedValue([
      { id: "household-1", isElderly: false, isDisabled: false, code: "JMH-1" },
      { id: "household-2", isElderly: true, isDisabled: false, code: "JMH-2" },
    ]);

    const createMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValue({ count: 1 });
    const tx = { contributionBill: { createMany } };
    mocks.db.$transaction.mockImplementation(async (callback: (client: { contributionBill: { createMany: typeof createMany } }) => Promise<unknown>) => callback(tx));

    const result = await generateYearlyBills({
      year: 2026,
      actorId: "user-1",
    });

    expect(createMany).toHaveBeenCalledTimes(12);
    expect(createMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        skipDuplicates: true,
        data: [
          expect.objectContaining({
            householdId: "household-1",
            year: 2026,
            month: 1,
            amountDue: 10000,
          }),
          expect.objectContaining({
            householdId: "household-2",
            year: 2026,
            month: 1,
            amountDue: 5000,
          }),
        ],
      }),
    );
    expect(result.created).toBe(12);
    expect(result.skipped).toBe(12);
    expect(result.households).toBe(2);
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "GENERATE_BILLS",
        entityId: "2026",
        afterData: expect.objectContaining({
          year: 2026,
          households: 2,
          created: 12,
          skipped: 12,
        }),
      }),
      tx,
    );
  });
});
