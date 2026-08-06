import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import { allocateCell } from "@/modules/contributions/imports/import-contribution-payments";
import { detectContributionImportHeader } from "@/modules/contributions/imports/xlsx";

function createFakeTx() {
  const bills = new Map<string, { id: string; year: number; month: number; amountDue: Decimal }>();
  const activePayments = new Set<string>();
  const createdPayments: Array<{
    billId: string;
    amountPaid: Decimal;
    paymentDate: Date;
    receiptNumber: string;
  }> = [];
  const billCreates: Array<{ householdId: string; year: number; month: number; amountDue: Decimal }> = [];

  return {
    createdPayments,
    billCreates,
    setActivePayment(year: number, month: number) {
      activePayments.add(`${year}-${month}`);
    },
    setBillAmount(year: number, month: number, amountDue: string) {
      const key = `${year}-${month}`;
      bills.set(key, {
        id: `bill-${key}`,
        year,
        month,
        amountDue: new Decimal(amountDue),
      });
    },
    contributionBill: {
      async findUnique({ where }: { where: { householdId_year_month: { householdId: string; year: number; month: number } } }) {
        const key = `${where.householdId_year_month.year}-${where.householdId_year_month.month}`;
        return bills.get(key) ?? null;
      },
      async create({
        data,
      }: {
        data: { householdId: string; year: number; month: number; amountDue: Decimal };
      }) {
        billCreates.push(data);
        const bill = {
          id: `bill-${data.year}-${data.month}`,
          year: data.year,
          month: data.month,
          amountDue: data.amountDue,
        };
        bills.set(`${data.year}-${data.month}`, bill);
        return bill;
      },
    },
    contributionPayment: {
      async findFirst({ where }: { where: { billId: string } }) {
        const bill = Array.from(bills.values()).find((item) => item.id === where.billId);
        if (!bill) return null;
        const key = `${bill.year}-${bill.month}`;
        if (!activePayments.has(key)) return null;
        return { id: `payment-${key}`, status: "VERIFIED" };
      },
      async create({
        data,
      }: {
        data: {
          billId: string;
          amountPaid: Decimal;
          paymentDate: Date;
          method: string;
          status: string;
          receiptNumber: string;
          notes: string;
          recordedById: string;
          importBatchId: string;
          importSourceKey: string;
          importSourceYear: number;
          importSourceMonth: number;
          importSourceRow: number;
          importSourceColumn: string;
        };
      }) {
        createdPayments.push({
          billId: data.billId,
          amountPaid: data.amountPaid,
          paymentDate: data.paymentDate,
          receiptNumber: data.receiptNumber,
        });
        return data;
      },
    },
    auditLog: {
      async create() {
        return {};
      },
    },
  };
}

function makeContext() {
  return {
    batchId: "batch-1",
    fileName: "iuran.xlsx",
    fileHash: "hash-1",
    targetYear: 2026,
    importedById: "user-1",
    paymentDate: new Date("2026-07-30T00:00:00.000Z"),
    defaultContributionAmount: new Decimal("10000"),
    contributionFeeConfig: {
      normal: new Decimal("10000"),
      special: new Decimal("5000"),
    },
  };
}

function makeRow() {
  return {
    rowNumber: 2,
    code: "JMH-00001",
    name: "Ahmad",
    cells: [],
  };
}

describe("detectContributionImportHeader", () => {
  it("mendeteksi header dua baris dengan bulan di baris berikutnya", () => {
    const header = detectContributionImportHeader([
      ["Kode Jamaah", "Nama", "", ""],
      ["", "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      ["JMH-00001", "Ahmad", "10000", "20000", "30000", "40000", "50000", "60000"],
    ]);

    expect(header.codeColumn).toBe(0);
    expect(header.nameColumn).toBe(1);
    expect(header.monthColumns.map((entry) => entry.month)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(header.dataStartRow).toBe(2);
  });
});

describe("allocateCell", () => {
  it("membuat tagihan nominal khusus untuk jamaah lansia", async () => {
    const tx = createFakeTx();
    await allocateCell(
      tx as never,
      makeContext(),
      makeRow(),
      { month: 1, column: 2, columnLabel: "Januari", rawValue: "5000" },
      "household-1",
      { isElderly: true, isDisabled: false },
    );

    expect(tx.billCreates[0]?.amountDue.toString()).toBe("5000");
  });

  it("membuat tagihan nominal khusus untuk jamaah disabilitas", async () => {
    const tx = createFakeTx();
    await allocateCell(
      tx as never,
      makeContext(),
      makeRow(),
      { month: 1, column: 2, columnLabel: "Januari", rawValue: "5000" },
      "household-1",
      { isElderly: false, isDisabled: true },
    );

    expect(tx.billCreates[0]?.amountDue.toString()).toBe("5000");
  });

  it("mengalokasikan nominal pas untuk satu bulan", async () => {
    const tx = createFakeTx();
    const result = await allocateCell(
      tx as never,
      makeContext(),
      makeRow(),
      { month: 1, column: 2, columnLabel: "Januari", rawValue: "10000" },
      "household-1",
    );

    expect(result.createdPayments).toHaveLength(1);
    expect(result.createdPayments[0]).toMatchObject({
      billYear: 2026,
      billMonth: 1,
      amount: "10000",
    });
    expect(result.skippedPayments).toBe(0);
    expect(result.spilledPayments).toBe(0);
    expect(tx.billCreates).toHaveLength(1);
    expect(tx.createdPayments[0].paymentDate.toISOString()).toBe("2026-07-30T00:00:00.000Z");
  });

  it("memecah nominal ke beberapa bulan dan lintas tahun", async () => {
    const tx = createFakeTx();
    const result = await allocateCell(
      tx as never,
      makeContext(),
      makeRow(),
      { month: 12, column: 13, columnLabel: "Desember", rawValue: "30000" },
      "household-1",
    );

    expect(result.createdPayments).toHaveLength(3);
    expect(result.createdPayments.map((entry) => `${entry.billYear}-${entry.billMonth}`)).toEqual([
      "2026-12",
      "2027-1",
      "2027-2",
    ]);
    expect(result.createdPayments.map((entry) => entry.amount)).toEqual(["10000", "10000", "10000"]);
    expect(result.spilledPayments).toBe(2);
  });

  it("melewati bulan yang sudah punya pembayaran aktif", async () => {
    const tx = createFakeTx();
    tx.setActivePayment(2026, 1);

    const result = await allocateCell(
      tx as never,
      makeContext(),
      makeRow(),
      { month: 1, column: 2, columnLabel: "Januari", rawValue: "20000" },
      "household-1",
    );

    expect(result.skippedPayments).toBe(1);
    expect(result.createdPayments).toHaveLength(2);
    expect(result.createdPayments.map((entry) => `${entry.billYear}-${entry.billMonth}`)).toEqual([
      "2026-2",
      "2026-3",
    ]);
  });
});
