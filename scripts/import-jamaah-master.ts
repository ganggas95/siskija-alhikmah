import { execFileSync } from "node:child_process";
import path from "node:path";

import { AppRoleKey, HouseholdStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RawRow = {
  sourceSheet: string;
  sourceRow: number;
  nama: string;
  region: string;
  rt: string;
  rw: string;
  isDisabled: string;
  isElderly: string;
  status: string;
};

type PreparedRow = {
  code: string;
  headName: string;
  regionName: string;
  rt: string;
  rw: string;
  isDisabled: boolean;
  isElderly: boolean;
  status: HouseholdStatus;
  notes: string | null;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeRegion(value: string) {
  return normalizeText(value);
}

function padAreaCode(value: string) {
  const trimmed = normalizeText(value);
  if (!trimmed) {
    return "";
  }

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) {
    return trimmed;
  }

  return String(numeric).padStart(3, "0");
}

function normalizeBool(value: string) {
  return value === "1";
}

function normalizeStatus(value: string) {
  return value === "1" ? HouseholdStatus.ACTIVE : HouseholdStatus.INACTIVE;
}

function makeHouseholdCode(index: number) {
  return `JMH-${String(index).padStart(5, "0")}`;
}

function loadWorkbookRows(filePath: string): RawRow[] {
  const pythonCode = `
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

path = sys.argv[1]
NS = {
  "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

with zipfile.ZipFile(path) as z:
    shared = []
    shared_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in shared_root.findall("m:si", NS):
        shared.append("".join(t.text or "" for t in si.iterfind(".//m:t", NS)))

    workbook = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rel_map = {r.attrib["Id"]: "xl/" + r.attrib["Target"] for r in rels}

    rows = []
    for sheet in workbook.find("m:sheets", NS):
        sheet_name = sheet.attrib["name"]
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        sheet_root = ET.fromstring(z.read(rel_map[rid]))
        xml_rows = sheet_root.findall(".//m:sheetData/m:row", NS)
        for row_index, row in enumerate(xml_rows[1:], start=2):
            values = {}
            for cell in row.findall("m:c", NS):
                cell_ref = cell.attrib.get("r", "")
                match = re.match(r"([A-Z]+)", cell_ref)
                if not match:
                    continue
                col = match.group(1)
                cell_type = cell.attrib.get("t")
                value_node = cell.find("m:v", NS)
                text = ""
                if value_node is not None and value_node.text is not None:
                    text = shared[int(value_node.text)] if cell_type == "s" else value_node.text
                values[col] = text

            if not any(values.values()):
                continue

            rows.append({
                "sourceSheet": sheet_name,
                "sourceRow": row_index,
                "nama": values.get("A", ""),
                "region": values.get("B", ""),
                "rt": values.get("C", ""),
                "rw": values.get("D", ""),
                "isDisabled": values.get("E", ""),
                "isElderly": values.get("F", ""),
                "status": values.get("G", ""),
            })

    print(json.dumps(rows, ensure_ascii=False))
`;

  const stdout = execFileSync("python3", ["-c", pythonCode, filePath], {
    encoding: "utf8",
  });

  return JSON.parse(stdout) as RawRow[];
}

async function main() {
  const filePath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(process.cwd(), "DATA_JAMAAH.xlsx");

  const financeCounts = await prisma.$transaction([
    prisma.contributionBill.count(),
    prisma.contributionPayment.count(),
    prisma.incomeTransaction.count(),
    prisma.expenseTransaction.count(),
    prisma.cashLedger.count(),
  ]);

  const financeRows = financeCounts.reduce((total, count) => total + count, 0);
  if (financeRows > 0) {
    throw new Error(
      "Import master data diblokir karena sudah ada data finansial. Script ini hanya aman dijalankan sebelum data iuran/transaksi dibuat.",
    );
  }

  const rawRows = loadWorkbookRows(filePath);
  const treasurer = await prisma.user.findFirst({
    where: {
      userRoles: {
        some: {
          role: {
            key: AppRoleKey.TREASURER,
          },
        },
      },
    },
  });

  const duplicateCounter = new Map<string, number>();
  const preparedRows: PreparedRow[] = rawRows.map((row, index) => {
    const regionName = normalizeRegion(row.region);
    const headName = normalizeText(row.nama);
    const rt = padAreaCode(row.rt);
    const rw = padAreaCode(row.rw);
    const duplicateKey = [headName.toUpperCase(), regionName.toUpperCase(), rt, rw].join("|");
    const occurrence = (duplicateCounter.get(duplicateKey) ?? 0) + 1;
    duplicateCounter.set(duplicateKey, occurrence);

    const noteParts = [`Import master dari ${path.basename(filePath)} (${row.sourceSheet}:${row.sourceRow})`];
    if (headName.includes("/")) {
      noteParts.push("Perlu review manual: nama mengandung alias atau separator '/'.");
    }
    if (occurrence > 1) {
      noteParts.push(`Duplikat natural key ke-${occurrence}; tidak di-merge otomatis.`);
    }

    return {
      code: makeHouseholdCode(index + 1),
      headName,
      regionName,
      rt,
      rw,
      isDisabled: normalizeBool(row.isDisabled),
      isElderly: normalizeBool(row.isElderly),
      status: normalizeStatus(row.status),
      notes: noteParts.join(" | "),
    };
  });

  const uniqueRegions = [...new Set(preparedRows.map((row) => row.regionName))].sort();

  await prisma.$transaction(async (tx) => {
    await tx.household.deleteMany();
    await tx.region.deleteMany();

    for (const regionName of uniqueRegions) {
      await tx.region.create({
        data: {
          name: regionName,
        },
      });
    }

    const regionMap = new Map(
      (
        await tx.region.findMany({
          where: {
            name: { in: uniqueRegions },
          },
        })
      ).map((region) => [region.name, region.id]),
    );

    for (const row of preparedRows) {
      await tx.household.create({
        data: {
          code: row.code,
          headName: row.headName,
          rt: row.rt,
          rw: row.rw,
          isDisabled: row.isDisabled,
          isElderly: row.isElderly,
          status: row.status,
          notes: row.notes,
          regionId: regionMap.get(row.regionName),
          createdById: treasurer?.id,
          updatedById: treasurer?.id,
        },
      });
    }
  });

  const duplicateRows = [...duplicateCounter.values()].filter((count) => count > 1);
  const slashNameRows = preparedRows.filter((row) => row.headName.includes("/")).length;
  const inactiveRows = preparedRows.filter((row) => row.status === HouseholdStatus.INACTIVE).length;

  console.log("Import master data jamaah selesai.");
  console.log(`Sumber file       : ${filePath}`);
  console.log(`Region diimpor    : ${uniqueRegions.length}`);
  console.log(`Household diimpor : ${preparedRows.length}`);
  console.log(`Duplikat diretain : ${duplicateRows.length} kelompok`);
  console.log(`Nama review manual: ${slashNameRows} baris`);
  console.log(`Status nonaktif   : ${inactiveRows} baris`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
