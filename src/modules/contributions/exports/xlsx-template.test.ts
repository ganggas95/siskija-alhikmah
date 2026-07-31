import { describe, expect, it } from "vitest";

import { readContributionImportWorkbook } from "@/modules/contributions/imports/xlsx";
import { createXlsxWorkbook } from "./xlsx";

describe("household import template workbook", () => {
  it("berisi header Nama Jamaah, RT, dan RW", () => {
    const workbook = createXlsxWorkbook("Import Jamaah", [["Nama Jamaah", "RT", "RW"]]);
    const parsed = readContributionImportWorkbook(
      workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength),
    );

    expect(parsed.sheetName).toBe("Import Jamaah");
    expect(parsed.rows).toEqual([["Nama Jamaah", "RT", "RW"]]);
  });
});
