import Decimal from "decimal.js";

export function toDecimal(value: Decimal.Value) {
  return new Decimal(value);
}

export function formatRupiah(value: Decimal.Value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(new Decimal(value).toFixed(0)));
}

export function sumMoney(values: Decimal.Value[]) {
  return values.reduce<Decimal>(
    (total, current) => total.plus(new Decimal(current)),
    new Decimal(0),
  );
}
