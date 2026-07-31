import {
  ContributionPaymentStatus,
  ImportBatchStatus,
  PaymentMethod,
  HouseholdStatus,
  Prisma,
} from "@prisma/client";
import Decimal from "decimal.js";

import { db } from "@/lib/db";
import { createReceiptNumber } from "@/modules/shared/numbering";
import { detectContributionImportHeader, readContributionImportWorkbook } from "./xlsx";

type ImportCell = {
  month: number;
  column: number;
  columnLabel: string;
  rawValue: string;
};

type ImportRow = {
  rowNumber: number;
  code: string;
  name: string;
  cells: ImportCell[];
};

export type ContributionImportProgressEvent = {
  type: "init" | "progress" | "row" | "done" | "error";
  message: string;
  payload?: Record<string, unknown>;
};

export type ContributionImportSummary = {
  batchId: string;
  totalRows: number;
  processedRows: number;
  createdPayments: number;
  skippedPayments: number;
  failedRows: number;
  spilledPayments: number;
};

export type ContributionImportBatchStatusSnapshot = {
  batchId: string;
  status: ImportBatchStatus | "NOT_FOUND";
  totalRows: number;
  processedRows: number;
  createdPayments: number;
  skippedPayments: number;
  failedRows: number;
  spilledPayments: number;
  progress: number;
  summary: ContributionImportSummary | null;
  errors: Array<Record<string, unknown>>;
  message: string;
};

export type ContributionImportIdentity = {
  fileHash: string;
  targetYear: number;
};

export type ImportContributionPaymentsInput = {
  fileName: string;
  fileSize: number;
  fileHash: string;
  targetYear: number;
  importedById: string;
  paymentDate: Date;
  buffer: ArrayBuffer;
};

type ImportContext = {
  batchId: string;
  fileName: string;
  fileHash: string;
  targetYear: number;
  importedById: string;
  paymentDate: Date;
  defaultContributionAmount: Decimal;
};

function normalizeAmount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/[^0-9,-]/g, "").replace(/,/g, ".");
  if (!cleaned) return null;

  const decimal = new Decimal(cleaned);
  if (decimal.lte(0)) return null;
  return decimal;
}

function monthName(month: number) {
  return [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ][month] ?? `Bulan ${month}`;
}

function nextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

async function getDefaultContributionAmount() {
  const setting = await db.contributionSetting.findFirst({
    where: { isActive: true },
    orderBy: { effectiveFrom: "desc" },
    select: { defaultAmount: true },
  });

  if (setting) {
    return setting.defaultAmount;
  }

  const profile = await db.mosqueProfile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { defaultContributionFee: true },
  });

  return profile?.defaultContributionFee ?? new Decimal(0);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function getContributionImportBatchStatus(
  batchId: string,
): Promise<ContributionImportBatchStatusSnapshot> {
  const batch = await db.importBatch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      status: true,
      totalRows: true,
      processedRows: true,
      createdPayments: true,
      skippedPayments: true,
      failedRows: true,
      spilledPayments: true,
      summary: true,
      errors: true,
    },
  });

  if (!batch) {
    return {
      batchId,
      status: "NOT_FOUND",
      totalRows: 0,
      processedRows: 0,
      createdPayments: 0,
      skippedPayments: 0,
      failedRows: 0,
      spilledPayments: 0,
      progress: 0,
      summary: null,
      errors: [],
      message: "Batch import tidak ditemukan.",
    };
  }

  const summary = batch.summary
    ? (batch.summary as unknown as ContributionImportSummary)
    : null;
  const errors = Array.isArray(batch.errors)
    ? (batch.errors as Array<Record<string, unknown>>)
    : [];
  const progress =
    batch.totalRows > 0 ? Math.round((batch.processedRows / batch.totalRows) * 100) : 0;

  return {
    batchId: batch.id,
    status: batch.status,
    totalRows: batch.totalRows,
    processedRows: batch.processedRows,
    createdPayments: batch.createdPayments,
    skippedPayments: batch.skippedPayments,
    failedRows: batch.failedRows,
    spilledPayments: batch.spilledPayments,
    progress,
    summary,
    errors,
    message:
      batch.status === ImportBatchStatus.COMPLETED
        ? "Import selesai."
        : batch.status === ImportBatchStatus.FAILED
          ? "Import gagal."
          : "Import sedang diproses.",
  };
}

export async function getContributionImportBatchStatusByIdentity(
  fileHash: string,
  targetYear: number,
): Promise<ContributionImportBatchStatusSnapshot> {
  const batch = await db.importBatch.findUnique({
    where: {
      sourceFileHash_targetYear: {
        sourceFileHash: fileHash,
        targetYear,
      },
    },
  });

  if (!batch) {
    return {
      batchId: "",
      status: "NOT_FOUND",
      totalRows: 0,
      processedRows: 0,
      createdPayments: 0,
      skippedPayments: 0,
      failedRows: 0,
      spilledPayments: 0,
      progress: 0,
      summary: null,
      errors: [],
      message: "Batch import tidak ditemukan.",
    };
  }

  return getContributionImportBatchStatus(batch.id);
}

async function ensureContributionBill(
  tx: Prisma.TransactionClient,
  householdId: string,
  year: number,
  month: number,
  defaultAmount: Decimal,
) {
  const existing = await tx.contributionBill.findUnique({
    where: {
      householdId_year_month: {
        householdId,
        year,
        month,
      },
    },
  });

  if (existing) return existing;

  return tx.contributionBill.create({
    data: {
      householdId,
      year,
      month,
      amountDue: defaultAmount,
    },
  });
}

async function getActivePaymentExists(
  tx: Prisma.TransactionClient,
  billId: string,
) {
  return tx.contributionPayment.findFirst({
    where: {
      billId,
      canceledAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });
}

export async function allocateCell(
  tx: Prisma.TransactionClient,
  context: ImportContext,
  row: ImportRow,
  cell: ImportCell,
  householdId: string,
) {
  let cursorYear = context.targetYear;
  let cursorMonth = cell.month;
  let remaining = new Decimal(cell.rawValue);
  const createdPayments: Array<{ billYear: number; billMonth: number; amount: string }> = [];
  let skippedPayments = 0;
  let spilledPayments = 0;

  while (remaining.gt(0)) {
    const bill = await ensureContributionBill(
      tx,
      householdId,
      cursorYear,
      cursorMonth,
      context.defaultContributionAmount,
    );
    const activePayment = await getActivePaymentExists(tx, bill.id);

    if (activePayment) {
      skippedPayments += 1;
      const next = nextMonth(cursorYear, cursorMonth);
      cursorYear = next.year;
      cursorMonth = next.month;
      continue;
    }

    const billAmount = new Decimal(bill.amountDue.toString());
    const allocation = Decimal.min(remaining, billAmount);
    const payment = await tx.contributionPayment.create({
      data: {
        billId: bill.id,
        amountPaid: allocation,
        paymentDate: context.paymentDate,
        method: PaymentMethod.CASH,
        status: ContributionPaymentStatus.DRAFT,
        receiptNumber: createReceiptNumber(),
        notes: [
          `Impor Excel ${context.fileName}`,
          `baris ${row.rowNumber}`,
          `kolom ${cell.columnLabel}`,
          `kode ${row.code}`,
        ].join(" | "),
        recordedById: context.importedById,
        importBatchId: context.batchId,
        importSourceKey: `${context.fileHash}:${context.targetYear}:${row.code}:${bill.year}:${bill.month}`,
        importSourceYear: context.targetYear,
        importSourceMonth: cell.month,
        importSourceRow: row.rowNumber,
        importSourceColumn: cell.columnLabel,
      },
    });

    createdPayments.push({
      billYear: bill.year,
      billMonth: bill.month,
      amount: payment.amountPaid.toString(),
    });

    remaining = remaining.minus(allocation);

    if (remaining.gt(0)) {
      spilledPayments += 1;
      const next = nextMonth(cursorYear, cursorMonth);
      cursorYear = next.year;
      cursorMonth = next.month;
      continue;
    }

    break;
  }

  return {
    createdPayments,
    skippedPayments,
    spilledPayments,
  };
}

function buildImportRows(rows: string[][]) {
  const header = detectContributionImportHeader(rows);
  const dataRows = rows.slice(header.dataStartRow);

  return dataRows
    .map((row, index) => {
      const code = String(row[header.codeColumn] ?? "").trim();
      const name = String(row[header.nameColumn] ?? "").trim();

      const cells = header.monthColumns
        .map((monthColumn) => {
          const rawValue = String(row[monthColumn.column] ?? "").trim();
          return {
            month: monthColumn.month,
            column: monthColumn.column,
            columnLabel: monthName(monthColumn.month),
            rawValue,
          };
        })
        .filter((cell) => cell.rawValue.length > 0);

      return {
        rowNumber: header.dataStartRow + index + 1,
        code,
        name,
        cells,
      } satisfies ImportRow;
    })
    .filter((row) => row.code.length > 0 || row.name.length > 0);
}

type PreparedImport = {
  parsedSheetName: string;
  rows: ImportRow[];
  batchId: string;
  defaultContributionAmount: Decimal;
  existingBatchStatus: ImportBatchStatus | null;
};

async function prepareContributionImport(input: ImportContributionPaymentsInput): Promise<PreparedImport> {
  const parsed = readContributionImportWorkbook(input.buffer);
  const rows = buildImportRows(parsed.rows);
  const defaultContributionAmount = await getDefaultContributionAmount();
  const existingBatch = await db.importBatch.findUnique({
    where: {
      sourceFileHash_targetYear: {
        sourceFileHash: input.fileHash,
        targetYear: input.targetYear,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingBatch?.status === ImportBatchStatus.COMPLETED) {
    return {
      parsedSheetName: parsed.sheetName,
      rows,
      batchId: existingBatch.id,
      defaultContributionAmount,
      existingBatchStatus: existingBatch.status,
    };
  }

  return {
    parsedSheetName: parsed.sheetName,
    rows,
    batchId: existingBatch?.id ?? "",
    defaultContributionAmount,
    existingBatchStatus: existingBatch?.status ?? null,
  };
}

async function createOrResetImportBatch(input: ImportContributionPaymentsInput, rows: ImportRow[]) {
  const existingBatch = await db.importBatch.findUnique({
    where: {
      sourceFileHash_targetYear: {
        sourceFileHash: input.fileHash,
        targetYear: input.targetYear,
      },
    },
  });

  if (existingBatch) {
    return db.importBatch.update({
      where: { id: existingBatch.id },
      data: {
        kind: "CONTRIBUTION_PAYMENT_EXCEL",
        sourceFileName: input.fileName,
        sourceFileSize: input.fileSize,
        sourceFileHash: input.fileHash,
        targetYear: input.targetYear,
        status: ImportBatchStatus.PROCESSING,
        totalRows: rows.length,
        processedRows: 0,
        createdPayments: 0,
        skippedPayments: 0,
        failedRows: 0,
        spilledPayments: 0,
        summary: Prisma.DbNull,
        errors: Prisma.DbNull,
        importedById: input.importedById,
        startedAt: new Date(),
        completedAt: null,
      },
    });
  }

  return db.importBatch.create({
    data: {
      kind: "CONTRIBUTION_PAYMENT_EXCEL",
      sourceFileName: input.fileName,
      sourceFileSize: input.fileSize,
      sourceFileHash: input.fileHash,
      targetYear: input.targetYear,
      status: ImportBatchStatus.PROCESSING,
      totalRows: rows.length,
      processedRows: 0,
      createdPayments: 0,
      skippedPayments: 0,
      failedRows: 0,
      spilledPayments: 0,
      summary: Prisma.DbNull,
      errors: Prisma.DbNull,
      importedById: input.importedById,
      startedAt: new Date(),
    },
  });
}

async function runContributionImport(
  input: ImportContributionPaymentsInput,
  emit?: (event: ContributionImportProgressEvent) => void,
  options?: { background?: boolean },
): Promise<ContributionImportSummary> {
  const prepared = await prepareContributionImport(input);

  if (prepared.existingBatchStatus === ImportBatchStatus.COMPLETED) {
    const summary = {
      batchId: prepared.batchId,
      totalRows: prepared.rows.length,
      processedRows: prepared.rows.length,
      createdPayments: 0,
      skippedPayments: 0,
      failedRows: 0,
      spilledPayments: 0,
    };

    emit?.({
      type: "done",
      message: "File ini sudah pernah diimpor untuk tahun yang sama.",
      payload: summary,
    });

    return summary;
  }

  if (prepared.existingBatchStatus === ImportBatchStatus.PROCESSING) {
    const snapshot = await getContributionImportBatchStatus(prepared.batchId);
    const summary = snapshot.summary ?? {
      batchId: prepared.batchId,
      totalRows: snapshot.totalRows,
      processedRows: snapshot.processedRows,
      createdPayments: snapshot.createdPayments,
      skippedPayments: snapshot.skippedPayments,
      failedRows: snapshot.failedRows,
      spilledPayments: snapshot.spilledPayments,
    };

    emit?.({
      type: "progress",
      message: "Import yang sama sedang berjalan.",
      payload: {
        ...summary,
        mode: options?.background ? "poll" : "stream",
      },
    });

    return summary;
  }

  const batch = await createOrResetImportBatch(input, prepared.rows);
  const context: ImportContext = {
    batchId: batch.id,
    fileName: input.fileName,
    fileHash: input.fileHash,
    targetYear: input.targetYear,
    importedById: input.importedById,
    paymentDate: input.paymentDate,
    defaultContributionAmount: prepared.defaultContributionAmount,
  };

  emit?.({
    type: "init",
    message: "Import dimulai.",
    payload: {
      batchId: batch.id,
      sheetName: prepared.parsedSheetName,
      totalRows: prepared.rows.length,
      targetYear: input.targetYear,
      mode: options?.background ? "poll" : "stream",
    },
  });

  const errors: Array<Record<string, unknown>> = [];
  let processedRows = 0;
  let createdPayments = 0;
  let skippedPayments = 0;
  let failedRows = 0;
  let spilledPayments = 0;

  try {
    for (const row of prepared.rows) {
      processedRows += 1;
      let rowCreated = 0;
      let rowSkipped = 0;
      let rowSpilled = 0;
      let rowStatus: "success" | "skipped" | "failed" = "success";
      let rowMessage = "Diproses.";

      try {
        const household = await db.household.findUnique({
          where: { code: row.code },
          select: {
            id: true,
            code: true,
            headName: true,
            status: true,
            deletedAt: true,
          },
        });

        if (!household || household.deletedAt) {
          rowStatus = "failed";
          rowMessage = `Kode jamaah ${row.code} tidak ditemukan.`;
          errors.push({
            rowNumber: row.rowNumber,
            code: row.code,
            name: row.name,
            message: rowMessage,
          });
          failedRows += 1;
          await db.importBatch.update({
            where: { id: batch.id },
            data: {
              processedRows,
              failedRows,
              errors: toJsonValue(errors),
            },
          });
          emit?.({
            type: "row",
            message: rowMessage,
            payload: {
              rowNumber: row.rowNumber,
              code: row.code,
              createdPayments: rowCreated,
              skippedPayments: rowSkipped,
              spilledPayments: rowSpilled,
              status: rowStatus,
            },
          });
          continue;
        }

        if (row.name && row.name.toLowerCase() !== household.headName.toLowerCase()) {
          rowMessage = `Kode cocok, nama pada file berbeda dengan data sistem (${household.headName}).`;
        }

        if (household.status === HouseholdStatus.INACTIVE) {
          rowMessage =
            rowMessage === "Diproses."
              ? "Jamaah berstatus nonaktif, tetapi tetap diproses karena kode cocok."
              : `${rowMessage} Jamaah berstatus nonaktif.`;
        }

        for (const cell of row.cells) {
          const amount = normalizeAmount(cell.rawValue);
          if (!amount) {
            continue;
          }

          const result = await db.$transaction(async (tx) => {
            return allocateCell(tx, context, row, cell, household.id);
          });

          rowCreated += result.createdPayments.length;
          rowSkipped += result.skippedPayments;
          rowSpilled += result.spilledPayments;
          createdPayments += result.createdPayments.length;
          skippedPayments += result.skippedPayments;
          spilledPayments += result.spilledPayments;
        }
      } catch (error) {
        rowStatus = "failed";
        rowMessage = error instanceof Error ? error.message : "Terjadi kesalahan import.";
        errors.push({
          rowNumber: row.rowNumber,
          code: row.code,
          name: row.name,
          message: rowMessage,
        });
        failedRows += 1;
      }

      await db.importBatch.update({
        where: { id: batch.id },
        data: {
          processedRows,
          createdPayments,
          skippedPayments,
          failedRows,
          spilledPayments,
          errors: toJsonValue(errors),
        },
      });

      emit?.({
        type: "progress",
        message: `Baris ${row.rowNumber} selesai.`,
        payload: {
          rowNumber: row.rowNumber,
          code: row.code,
          status: rowStatus,
          createdPayments: rowCreated,
          skippedPayments: rowSkipped,
          spilledPayments: rowSpilled,
          processedRows,
          totalRows: prepared.rows.length,
          createdPaymentsTotal: createdPayments,
          skippedPaymentsTotal: skippedPayments,
          failedRows,
        },
      });
    }

    const summary: ContributionImportSummary = {
      batchId: batch.id,
      totalRows: prepared.rows.length,
      processedRows,
      createdPayments,
      skippedPayments,
      failedRows,
      spilledPayments,
    };

    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        status: ImportBatchStatus.COMPLETED,
        processedRows,
        createdPayments,
        skippedPayments,
        failedRows,
        spilledPayments,
        summary: toJsonValue(summary),
        errors: toJsonValue(errors),
        completedAt: new Date(),
      },
    });

    emit?.({
      type: "done",
      message: "Import selesai.",
      payload: summary,
    });

    return summary;
  } catch (error) {
    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        status: ImportBatchStatus.FAILED,
        errors: toJsonValue([
          {
            message: error instanceof Error ? error.message : "Terjadi kesalahan import.",
          },
        ]),
        completedAt: new Date(),
      },
    });

    emit?.({
      type: "error",
      message: error instanceof Error ? error.message : "Terjadi kesalahan import.",
    });

    throw error;
  }
}

export async function importContributionPayments(
  input: ImportContributionPaymentsInput,
  emit?: (event: ContributionImportProgressEvent) => void,
): Promise<ContributionImportSummary> {
  return runContributionImport(input, emit);
}

export async function startContributionImportJob(
  input: ImportContributionPaymentsInput,
): Promise<ContributionImportIdentity> {
  const prepared = await prepareContributionImport(input);

  if (prepared.existingBatchStatus === ImportBatchStatus.COMPLETED) {
    return { fileHash: input.fileHash, targetYear: input.targetYear };
  }

  if (prepared.existingBatchStatus === ImportBatchStatus.PROCESSING) {
    return { fileHash: input.fileHash, targetYear: input.targetYear };
  }

  await db.importBatch.create({
    data: {
      kind: "CONTRIBUTION_PAYMENT_EXCEL",
      sourceFileName: input.fileName,
      sourceFileSize: input.fileSize,
      sourceFileHash: input.fileHash,
      targetYear: input.targetYear,
      status: ImportBatchStatus.PENDING,
      totalRows: prepared.rows.length,
      processedRows: 0,
      createdPayments: 0,
      skippedPayments: 0,
      failedRows: 0,
      spilledPayments: 0,
      summary: Prisma.DbNull,
      errors: Prisma.DbNull,
      importedById: input.importedById,
      startedAt: new Date(),
    },
  });

  void runContributionImport(input, undefined, { background: true }).catch(() => undefined);

  return { fileHash: input.fileHash, targetYear: input.targetYear };
}
