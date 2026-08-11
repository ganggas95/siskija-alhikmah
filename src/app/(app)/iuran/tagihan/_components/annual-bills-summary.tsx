import { formatRupiah } from "@/lib/money";
import type { AnnualBillsSummary as AnnualBillsSummaryType } from "@/modules/contributions/annual-bills";

const cards = [
  {
    key: "householdCount",
    label: "Keluarga Tampil",
    tone: "text-slate-900",
    money: false,
  },
  {
    key: "generatedBillCount",
    label: "Tagihan Terbentuk",
    tone: "text-slate-900",
    money: false,
  },
  {
    key: "paidBillCount",
    label: "Tagihan Lunas",
    tone: "text-emerald-700",
    money: false,
  },
  {
    key: "totalOutstanding",
    label: "Total Tunggakan",
    tone: "text-amber-700",
    money: true,
  },
] as const;

export function AnnualBillsSummary({
  summary,
}: {
  summary: AnnualBillsSummaryType;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const rawValue = summary[card.key];
        const value = card.money ? formatRupiah(String(rawValue)) : String(rawValue);

        return (
          <article
            key={card.key}
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{value}</p>
          </article>
        );
      })}
      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:col-span-2 xl:col-span-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryLine label="Total Nominal Tagihan" value={formatRupiah(summary.totalAmountDue)} />
          <SummaryLine label="Total Sudah Dibayar" value={formatRupiah(summary.totalPaid)} />
          <SummaryLine
            label="Status Belum / Sebagian"
            value={`${summary.unpaidBillCount + summary.partialBillCount} tagihan`}
          />
          <SummaryLine label="Coverage Lunas" value={`${summary.coverageRate}%`} />
        </div>
      </article>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
