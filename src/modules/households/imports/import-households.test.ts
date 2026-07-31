import { describe, expect, it } from "vitest";

import { buildHouseholdCodes, validateHouseholdImportRows } from "./import-households";

describe("validateHouseholdImportRows", () => {
  it("membaca format Nama Jamaah, RT, RW dan menormalisasi nilai", () => {
    const result = validateHouseholdImportRows([
      ["Nama Jamaah", "RT", "RW"],
      ["  Ahmad   Hadi ", "001", " 002 "],
    ]);

    expect(result.summary).toMatchObject({
      totalRows: 1,
      invalidRows: 0,
    });
    expect(result.validRows).toEqual([
      { rowNumber: 2, name: "Ahmad Hadi", rt: "001", rw: "002" },
    ]);
  });

  it("melaporkan baris kosong dan nama yang tidak diisi", () => {
    const result = validateHouseholdImportRows([
      ["Nama Jamaah", "RT", "RW"],
      ["", "", ""],
      ["", "001", "002"],
      ["Budi", "003", "004"],
    ]);

    expect(result.summary.totalRows).toBe(3);
    expect(result.summary.invalidRows).toBe(2);
    expect(result.summary.errors).toEqual([
      { rowNumber: 2, type: "INVALID", message: "Baris kosong." },
      { rowNumber: 3, type: "INVALID", message: "Nama Jamaah wajib diisi." },
    ]);
    expect(result.validRows).toHaveLength(1);
  });

  it("menolak header yang tidak lengkap", () => {
    expect(() =>
      validateHouseholdImportRows([
        ["Nama", "RT", "RW"],
        ["Budi", "001", "002"],
      ]),
    ).toThrow('Header wajib: "Nama Jamaah", "RT", dan "RW"');
  });
});

describe("buildHouseholdCodes", () => {
  it("memastikan kode baru unik secara global lintas wilayah", () => {
    expect(
      buildHouseholdCodes("JMH-00001", ["JMH-00001", "JMH-00002"], 2),
    ).toEqual(["JMH-00003", "JMH-00004"]);
  });
});
