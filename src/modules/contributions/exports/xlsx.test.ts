import { describe, expect, it } from "vitest";

import { detectContributionImportHeader, readContributionImportWorkbook } from "@/modules/contributions/imports/xlsx";
import { buildContributionExportRows, createContributionPaymentsWorkbook } from "./xlsx";

describe("contribution payment XLSX export", () => {
  it("menghasilkan workbook yang dapat dibaca ulang oleh parser import", () => {
    const rows = buildContributionExportRows([
      {
        code: "JMH-00001",
        name: "Amin & Siti",
        monthlyAmounts: [10000, null, 25000, ...Array<number | null>(9).fill(null)],
      },
    ]);
    const workbook = createContributionPaymentsWorkbook(rows);
    const parsed = readContributionImportWorkbook(
      workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength),
    );
    const header = detectContributionImportHeader(parsed.rows);

    expect(parsed.sheetName).toBe("Pembayaran Iuran");
    expect(header.dataStartRow).toBe(2);
    expect(header.monthColumns.map((column) => column.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(parsed.rows[2]).toEqual([
      "JMH-00001",
      "Amin & Siti",
      "10000",
      undefined,
      "25000",
    ]);
  });

  it("meng-escape teks dan tetap mempertahankan sel kosong", () => {
    const rows = buildContributionExportRows([
      {
        code: "JMH-00002",
        name: "A & B <Keluarga>",
        monthlyAmounts: Array<number | null>(12).fill(null),
      },
    ]);
    const workbook = createContributionPaymentsWorkbook(rows);
    const parsed = readContributionImportWorkbook(
      workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength),
    );

    expect(parsed.rows[2]?.[1]).toBe("A & B <Keluarga>");
    expect(parsed.rows[2]?.slice(2)).toEqual([]);
  });
});
