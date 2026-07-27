export function createTransactionNumber(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function createReceiptNumber() {
  return `RCPT-${Date.now()}`;
}

export function createHouseholdCode(nextIndex: number) {
  return `JMH-${String(nextIndex).padStart(5, "0")}`;
}
