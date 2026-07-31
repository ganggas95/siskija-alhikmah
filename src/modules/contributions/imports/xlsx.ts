import { inflateRawSync } from "node:zlib";

const EOCD_SIGNATURE = 0x06054b50;
const CEN_SIGNATURE = 0x02014b50;
const LOC_SIGNATURE = 0x04034b50;

const MONTH_ALIASES: Array<{ month: number; patterns: string[] }> = [
  { month: 1, patterns: ["jan", "januari", "january"] },
  { month: 2, patterns: ["feb", "februari", "february"] },
  { month: 3, patterns: ["mar", "maret", "march"] },
  { month: 4, patterns: ["apr", "april"] },
  { month: 5, patterns: ["mei", "may"] },
  { month: 6, patterns: ["jun", "juni", "june"] },
  { month: 7, patterns: ["jul", "juli", "july"] },
  { month: 8, patterns: ["agu", "agust", "agustus", "aug", "augustus"] },
  { month: 9, patterns: ["sep", "september"] },
  { month: 10, patterns: ["okt", "oktob", "oktober", "oct"] },
  { month: 11, patterns: ["nov", "novem", "november"] },
  { month: 12, patterns: ["des", "desem", "desember", "dec"] },
];

function decodeXml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeText(value: string) {
  return decodeXml(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseAttributes(source: string) {
  const attrs: Record<string, string> = {};
  source.replace(/([A-Za-z_:][-A-Za-z0-9_:.]*)="([^"]*)"/g, (_, key: string, value: string) => {
    attrs[key] = decodeXml(value);
    return "";
  });
  return attrs;
}

function readUint16LE(buffer: Buffer, offset: number) {
  return buffer.readUInt16LE(offset);
}

function readUint32LE(buffer: Buffer, offset: number) {
  return buffer.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (readUint32LE(buffer, offset) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  throw new Error("File Excel tidak valid.");
}

function unzipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = readUint16LE(buffer, eocdOffset + 10);
  const centralDirectoryOffset = readUint32LE(buffer, eocdOffset + 16);

  let offset = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    if (readUint32LE(buffer, offset) !== CEN_SIGNATURE) {
      throw new Error("Struktur ZIP Excel tidak valid.");
    }

    const compressionMethod = readUint16LE(buffer, offset + 10);
    const compressedSize = readUint32LE(buffer, offset + 20);
    const uncompressedSize = readUint32LE(buffer, offset + 24);
    const fileNameLength = readUint16LE(buffer, offset + 28);
    const extraLength = readUint16LE(buffer, offset + 30);
    const commentLength = readUint16LE(buffer, offset + 32);
    const localHeaderOffset = readUint32LE(buffer, offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    if (readUint32LE(buffer, localHeaderOffset) !== LOC_SIGNATURE) {
      throw new Error(`Entry ZIP Excel "${fileName}" tidak valid.`);
    }

    const localFileNameLength = readUint16LE(buffer, localHeaderOffset + 26);
    const localExtraLength = readUint16LE(buffer, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = buffer.slice(dataOffset, dataOffset + compressedSize);

    let data: Buffer;
    if (compressionMethod === 0) {
      data = Buffer.from(compressed);
    } else if (compressionMethod === 8) {
      data = inflateRawSync(compressed);
    } else {
      throw new Error(`Metode kompresi ZIP tidak didukung untuk "${fileName}".`);
    }

    if (data.length !== uncompressedSize) {
      // Keep parsing, but the size mismatch usually indicates corruption.
    }

    entries.set(fileName, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  const itemRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml))) {
    const textParts: string[] = [];
    match[1].replace(/<t[^>]*>([\s\S]*?)<\/t>/g, (_, value: string) => {
      textParts.push(decodeXml(value));
      return "";
    });
    strings.push(textParts.join(""));
  }

  return strings;
}

function columnToIndex(column: string) {
  let index = 0;
  for (const char of column) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function parseCellValue(cellXml: string, sharedStrings: string[]) {
  const openTagMatch = cellXml.match(/^<c\b([^>]*)>/);
  if (!openTagMatch) return null;

  const attrs = parseAttributes(openTagMatch[1]);
  const cellType = attrs.t;
  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  const inlineTextMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g);

  if (cellType === "s" && valueMatch) {
    const index = Number(valueMatch[1]);
    return sharedStrings[index] ?? "";
  }

  if (cellType === "inlineStr" && inlineTextMatch) {
    return inlineTextMatch
      .map((segment) => {
        const text = segment.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
        return decodeXml(text);
      })
      .join("");
  }

  if (!valueMatch) return "";
  return decodeXml(valueMatch[1]);
}

function parseSheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml))) {
    const cells: string[] = [];
    const rowContent = rowMatch[2];
    const cellRegex = /<c\b[^>]*r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowContent))) {
      const colIndex = columnToIndex(cellMatch[1]);
      const value = parseCellValue(`<c${cellMatch[0].slice(2)}`, sharedStrings);
      cells[colIndex] = value ?? "";
    }

    rows[Number(rowMatch[1]) - 1] = cells;
  }

  return rows;
}

function findSheetPath(entries: Map<string, Buffer>) {
  const workbookXml = entries.get("xl/workbook.xml");
  const relsXml = entries.get("xl/_rels/workbook.xml.rels");

  if (!workbookXml || !relsXml) {
    throw new Error("Workbook Excel tidak lengkap.");
  }

  const workbook = workbookXml.toString("utf8");
  const rels = relsXml.toString("utf8");
  const sheetMatch = workbook.match(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/);

  if (!sheetMatch) {
    throw new Error("Sheet Excel tidak ditemukan.");
  }

  const relMatch = rels.match(
    new RegExp(`<Relationship\\b[^>]*Id="${sheetMatch[2]}"[^>]*Target="([^"]+)"`),
  );

  if (!relMatch) {
    throw new Error("Relasi sheet Excel tidak ditemukan.");
  }

  return `xl/${relMatch[1].replace(/^\//, "")}`;
}

function isMonthLabel(value: string) {
  const normalized = normalizeText(value);
  return MONTH_ALIASES.find((entry) =>
    entry.patterns.some((pattern) => normalized.startsWith(pattern)),
  );
}

export type ParsedContributionImportSheet = {
  sheetName: string;
  rows: string[][];
};

export type ContributionImportHeaderMap = {
  codeColumn: number;
  nameColumn: number;
  monthColumns: Array<{ month: number; column: number }>;
  dataStartRow: number;
};

export function readContributionImportWorkbook(buffer: ArrayBuffer): ParsedContributionImportSheet {
  const binary = Buffer.from(buffer);
  const entries = unzipEntries(binary);
  const workbookXml = entries.get("xl/workbook.xml");
  const sharedStringsXml = entries.get("xl/sharedStrings.xml");

  if (!workbookXml) {
    throw new Error("Workbook Excel tidak valid.");
  }

  const sheetPath = findSheetPath(entries);
  const sheetXml = entries.get(sheetPath);

  if (!sheetXml) {
    throw new Error("Worksheet Excel tidak ditemukan.");
  }

  const sharedStrings = sharedStringsXml
    ? parseSharedStrings(sharedStringsXml.toString("utf8"))
    : [];

  const sheetRows = parseSheetRows(sheetXml.toString("utf8"), sharedStrings);
  const workbook = workbookXml.toString("utf8");
  const sheetNameMatch = workbook.match(/<sheet\b[^>]*name="([^"]+)"/);

  return {
    sheetName: sheetNameMatch?.[1] ?? "Sheet1",
    rows: Array.from(sheetRows, (row) => row ?? []),
  };
}

export function detectContributionImportHeader(rows: string[][]): ContributionImportHeaderMap {
  const candidateRows = rows.slice(0, 10);

  for (let rowIndex = 0; rowIndex < candidateRows.length; rowIndex += 1) {
    const currentRow = candidateRows[rowIndex] ?? [];
    const nextRow = candidateRows[rowIndex + 1] ?? [];
    const currentNormalized = currentRow.map((cell) => normalizeText(cell ?? ""));
    const nextNormalized = nextRow.map((cell) => normalizeText(cell ?? ""));

    const codeColumn =
      currentNormalized.findIndex((cell) => cell.includes("kode jamaah")) >= 0
        ? currentNormalized.findIndex((cell) => cell.includes("kode jamaah"))
        : nextNormalized.findIndex((cell) => cell.includes("kode jamaah"));

    const nameColumn =
      currentNormalized.findIndex((cell) => cell === "nama" || cell.includes("nama")) >= 0
        ? currentNormalized.findIndex((cell) => cell === "nama" || cell.includes("nama"))
        : nextNormalized.findIndex((cell) => cell === "nama" || cell.includes("nama"));

    const currentMonthColumns = currentNormalized
      .map((cell, column) => {
        const month = isMonthLabel(cell);
        return month ? { month: month.month, column } : null;
      })
      .filter((value): value is { month: number; column: number } => Boolean(value));

    const nextMonthColumns = nextNormalized
      .map((cell, column) => {
        const month = isMonthLabel(cell);
        return month ? { month: month.month, column } : null;
      })
      .filter((value): value is { month: number; column: number } => Boolean(value));

    if (codeColumn >= 0 && nameColumn >= 0 && currentMonthColumns.length >= 6) {
      return {
        codeColumn,
        nameColumn,
        monthColumns: currentMonthColumns.sort((a, b) => a.column - b.column),
        dataStartRow: rowIndex + 2,
      };
    }

    if (codeColumn >= 0 && nameColumn >= 0 && nextMonthColumns.length >= 6) {
      return {
        codeColumn,
        nameColumn,
        monthColumns: nextMonthColumns.sort((a, b) => a.column - b.column),
        dataStartRow: rowIndex + 2,
      };
    }
  }

  throw new Error(
    'Format file tidak dikenali. Pastikan ada kolom "Kode Jamaah", "Nama", dan kolom bulan Januari-Desember.',
  );
}
