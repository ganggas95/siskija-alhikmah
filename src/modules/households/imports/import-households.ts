import { HouseholdStatus, Prisma } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { createHouseholdCode } from "@/modules/shared/numbering";
import { readContributionImportWorkbook } from "@/modules/contributions/imports/xlsx";

export const MAX_HOUSEHOLD_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_HOUSEHOLD_IMPORT_ROWS = 10_000;

export type HouseholdImportError = {
  rowNumber: number;
  type: "INVALID" | "DUPLICATE";
  message: string;
};

export type HouseholdImportSummary = {
  totalRows: number;
  createdRows: number;
  duplicateRows: number;
  invalidRows: number;
  errors: HouseholdImportError[];
};

export type ImportHouseholdsInput = {
  fileName: string;
  fileSize: number;
  regionId: string;
  importedById: string;
  buffer: ArrayBuffer;
};

type HouseholdImportRow = {
  rowNumber: number;
  name: string;
  rt: string | null;
  rw: string | null;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string | null) {
  return normalizeText(value ?? "").toLocaleLowerCase("id-ID");
}

function householdKey(name: string, rt: string | null, rw: string | null, regionId: string) {
  return [normalizeKey(name), normalizeKey(rt), normalizeKey(rw), regionId].join("|");
}

function parseRows(rows: string[][]) {
  const header = rows[0] ?? [];
  const normalizedHeader = header.map((cell) => normalizeKey(cell));
  const nameColumn = normalizedHeader.indexOf("nama jamaah");
  const rtColumn = normalizedHeader.indexOf("rt");
  const rwColumn = normalizedHeader.indexOf("rw");

  if (nameColumn < 0 || rtColumn < 0 || rwColumn < 0) {
    throw new Error('Format file tidak dikenali. Header wajib: "Nama Jamaah", "RT", dan "RW".');
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_HOUSEHOLD_IMPORT_ROWS) {
    throw new Error(`Jumlah baris melebihi batas maksimal ${MAX_HOUSEHOLD_IMPORT_ROWS.toLocaleString("id-ID")}.`);
  }

  return dataRows.map((row, index) => ({
    rowNumber: index + 2,
    name: normalizeText(String(row[nameColumn] ?? "")),
    rt: normalizeText(String(row[rtColumn] ?? "")) || null,
    rw: normalizeText(String(row[rwColumn] ?? "")) || null,
  } satisfies HouseholdImportRow));
}

function getInitialSummary(): HouseholdImportSummary {
  return {
    totalRows: 0,
    createdRows: 0,
    duplicateRows: 0,
    invalidRows: 0,
    errors: [],
  };
}

function getNextHouseholdCode(lastCode: string | null, offset: number) {
  const lastNumber = lastCode?.match(/^(?:JMH-)?(\d+)$/i)?.[1];
  const nextIndex = (lastNumber ? Number(lastNumber) : 0) + offset;
  return createHouseholdCode(nextIndex);
}

export function buildHouseholdCodes(
  lastCode: string | null,
  usedCodes: Iterable<string>,
  count: number,
) {
  const allocatedCodes: string[] = [];
  const reservedCodes = new Set(usedCodes);
  let codeOffset = 1;

  while (allocatedCodes.length < count) {
    let code = getNextHouseholdCode(lastCode, codeOffset);
    while (reservedCodes.has(code)) {
      codeOffset += 1;
      code = getNextHouseholdCode(lastCode, codeOffset);
    }

    reservedCodes.add(code);
    allocatedCodes.push(code);
    codeOffset += 1;
  }

  return allocatedCodes;
}

export function validateHouseholdImportRows(rows: string[][]) {
  const parsedRows = parseRows(rows);
  const summary = getInitialSummary();
  summary.totalRows = parsedRows.length;
  const validRows: HouseholdImportRow[] = [];

  for (const row of parsedRows) {
    if (!row.name && !row.rt && !row.rw) {
      summary.invalidRows += 1;
      summary.errors.push({ rowNumber: row.rowNumber, type: "INVALID", message: "Baris kosong." });
      continue;
    }

    if (!row.name) {
      summary.invalidRows += 1;
      summary.errors.push({ rowNumber: row.rowNumber, type: "INVALID", message: "Nama Jamaah wajib diisi." });
      continue;
    }

    validRows.push(row);
  }

  return { summary, validRows };
}

export async function importHouseholds(
  input: ImportHouseholdsInput,
): Promise<HouseholdImportSummary> {
  if (input.fileSize > MAX_HOUSEHOLD_IMPORT_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 10 MB.");
  }

  const parsed = readContributionImportWorkbook(input.buffer);
  const { summary, validRows } = validateHouseholdImportRows(parsed.rows);

  return db.$transaction(async (tx) => {
    const region = await tx.region.findFirst({
      where: { id: input.regionId, isActive: true, deletedAt: null },
      select: { id: true },
    });

    if (!region) {
      throw new Error("Wilayah tidak ditemukan atau tidak aktif.");
    }

    const existing = await tx.household.findMany({
      where: { regionId: input.regionId, deletedAt: null },
      select: { headName: true, rt: true, rw: true, code: true },
    });
    const existingKeys = new Set(
      existing.map((row) => householdKey(row.headName, row.rt, row.rw, input.regionId)),
    );
    const allHouseholds = await tx.household.findMany({
      select: { code: true },
    });
    const usedCodes = new Set(allHouseholds.map((row) => row.code));
    const lastCode = [...usedCodes].sort().at(-1) ?? null;
    const rowsToCreate: HouseholdImportRow[] = [];

    for (const row of validRows) {
      const key = householdKey(row.name, row.rt, row.rw, input.regionId);
      if (existingKeys.has(key)) {
        summary.duplicateRows += 1;
        summary.errors.push({
          rowNumber: row.rowNumber,
          type: "DUPLICATE",
          message: "Data jamaah sudah terdaftar pada wilayah tersebut.",
        });
        continue;
      }

      existingKeys.add(key);
      rowsToCreate.push(row);
    }

    const codes = buildHouseholdCodes(lastCode, usedCodes, rowsToCreate.length);
    for (const [index, row] of rowsToCreate.entries()) {
      await tx.household.create({
        data: {
          code: codes[index],
          headName: row.name,
          rt: row.rt,
          rw: row.rw,
          regionId: input.regionId,
          status: HouseholdStatus.ACTIVE,
          createdById: input.importedById,
          updatedById: input.importedById,
        },
      });
    }

    summary.createdRows = rowsToCreate.length;

    await createAuditLog(
      {
        userId: input.importedById,
        action: "IMPORT_HOUSEHOLDS",
        entity: "HouseholdImport",
        entityId: input.regionId,
        afterData: {
          fileName: input.fileName,
          fileSize: input.fileSize,
          regionId: input.regionId,
          totalRows: summary.totalRows,
          createdRows: summary.createdRows,
          duplicateRows: summary.duplicateRows,
          invalidRows: summary.invalidRows,
        },
      },
      tx,
    );

    return summary;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
