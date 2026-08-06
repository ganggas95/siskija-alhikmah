import { randomUUID } from "node:crypto";

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/[^A-Z0-9-]/gi, "").toUpperCase() || "DOC";
}

function formatDateSegment(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function createUniqueSuffix() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function createTransactionNumber(prefix: string, date = new Date()) {
  return `${normalizePrefix(prefix)}-${formatDateSegment(date)}-${createUniqueSuffix()}`;
}

export function createReceiptNumber(date = new Date()) {
  return `RCPT-${formatDateSegment(date)}-${createUniqueSuffix()}`;
}

export function createHouseholdCode(nextIndex: number) {
  return `JMH-${String(nextIndex).padStart(5, "0")}`;
}
