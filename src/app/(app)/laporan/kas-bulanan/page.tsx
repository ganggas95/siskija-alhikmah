import { LedgerDirection, PermissionKey, Prisma } from "@prisma/client";
import { FileBarChart2 } from "lucide-react";
import { ActionLabel } from "@/components/ui/action-label";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { TableFilterModal } from "@/components/table/table-filter-modal";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { requirePermission } from "@/lib/rbac";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";

export default async function MonthlyCashReportPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.VIEW_REPORTS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const query = getQueryParam(resolvedSearchParams, "q");
  const directionFilter = getQueryParam(resolvedSearchParams, "direction");
  const year = Number(getQueryParam(resolvedSearchParams, "year")) || currentYear;
  const month = Number(getQueryParam(resolvedSearchParams, "month")) || currentMonth;
  const { page, pageSize } = getPaginationState(resolvedSearchParams);
  const yearFilter = getQueryParam(resolvedSearchParams, "year");
  const monthFilter = getQueryParam(resolvedSearchParams, "month");
  const activeFilterCount = [yearFilter, monthFilter, directionFilter].filter(
    (f) => f && f !== "all"
  ).length;

  const where: Prisma.CashLedgerWhereInput = {
    isActive: true,
    transactionDate: {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    },
    ...(query
      ? {
          OR: [
            { transactionNumber: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(directionFilter && directionFilter !== "all" ? { direction: directionFilter as LedgerDirection } : {}),
  };

  const entries = await db.cashLedger.findMany({
    where,
    orderBy: { transactionDate: "asc" },
  });
  const totalItems = entries.length;
  const startIndex = (page - 1) * pageSize;
  const pagedEntries = entries.slice(startIndex, startIndex + pageSize);

  const income = entries
    .filter((entry) => entry.direction === LedgerDirection.DEBIT)
    .reduce((total, entry) => total + Number(entry.amount), 0);
  const expense = entries
    .filter((entry) => entry.direction === LedgerDirection.CREDIT)
    .reduce((total, entry) => total + Number(entry.amount), 0);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Laporan Kas Bulanan"
        description="Ringkasan kas berjalan untuk bulan ini."
        icon={FileBarChart2}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Total Pemasukan" value={formatRupiah(income)} />
        <Card label="Total Pengeluaran" value={formatRupiah(expense)} />
        <Card label="Saldo Bersih" value={formatRupiah(income - expense)} />
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Rincian Mutasi Bulanan</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                name="q"
                defaultValue={query}
                placeholder="Cari nomor transaksi atau keterangan"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
              {yearFilter ? <input type="hidden" name="year" value={yearFilter} /> : null}
              {monthFilter ? <input type="hidden" name="month" value={monthFilter} /> : null}
              {directionFilter ? <input type="hidden" name="direction" value={directionFilter} /> : null}
              <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  <ActionLabel action="search">Cari</ActionLabel>
              </button>
            </form>
            <div className="flex gap-3">
              <TableFilterModal
                title="Filter Laporan Kas"
                description="Atur periode laporan dan arah transaksi yang ingin ditampilkan."
                activeCount={activeFilterCount}
              >
                {query ? <input type="hidden" name="q" value={query} /> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tahun</label>
                    <input
                      name="year"
                      type="number"
                      defaultValue={year}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Bulan</label>
                    <input
                      name="month"
                      type="number"
                      min={1}
                      max={12}
                      defaultValue={month}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Arah Transaksi</label>
                  <select
                    name="direction"
                    defaultValue={directionFilter || "all"}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="all">Semua arah</option>
                    {Object.values(LedgerDirection).map((direction) => (
                      <option key={direction} value={direction}>
                        {direction}
                      </option>
                    ))}
                  </select>
                </div>
              </TableFilterModal>
              <Link href="/laporan/kas-bulanan" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  <ActionLabel action="reset">Reset</ActionLabel>
              </Link>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Nomor</th>
                <th className="px-3 py-3">Keterangan</th>
                <th className="px-3 py-3">Arah</th>
                <th className="px-3 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {pagedEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{entry.transactionDate.toLocaleDateString("id-ID")}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{entry.transactionNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{entry.description}</td>
                  <td className="px-3 py-3">{entry.direction}</td>
                  <td className="px-3 py-3 text-right">{formatRupiah(entry.amount.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          pathname="/laporan/kas-bulanan"
          searchParams={resolvedSearchParams}
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          itemLabel="mutasi"
        />
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
