import { LedgerDirection, PermissionKey } from "@prisma/client";
import { BookOpenText } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
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

export default async function LedgerPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.VIEW_REPORTS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const directionFilter = getQueryParam(resolvedSearchParams, "direction");
  const { page, pageSize } = getPaginationState(resolvedSearchParams);

  const where: Prisma.CashLedgerWhereInput = {
    isActive: true,
    ...(query
      ? {
          OR: [
            { transactionNumber: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(directionFilter ? { direction: directionFilter as LedgerDirection } : {}),
  };

  const entries = await db.cashLedger.findMany({
    where,
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });

  const rows = entries.reduce<Array<{ entry: (typeof entries)[number]; runningBalance: number }>>(
    (accumulator, entry) => {
      const amount = Number(entry.amount);
      const previousBalance = accumulator.at(-1)?.runningBalance ?? 0;
      const runningBalance =
        previousBalance +
        (entry.direction === LedgerDirection.DEBIT ? amount : -amount);

      accumulator.push({
        entry,
        runningBalance,
      });

      return accumulator;
    },
    [],
  );
  const totalItems = rows.length;
  const startIndex = (page - 1) * pageSize;
  const pagedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Buku Kas"
        description="Ledger aktif menjadi source of truth untuk saldo kas masjid."
        icon={BookOpenText}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Daftar Ledger</h3>
            <Link href="/buku-kas" className="text-sm font-medium text-green-800">
              Reset
            </Link>
          </div>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input
              name="q"
              defaultValue={query}
              placeholder="Cari nomor transaksi atau keterangan"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <select
              name="direction"
              defaultValue={directionFilter || "all"}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="all">Semua arah</option>
              {Object.values(LedgerDirection).map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Terapkan
            </button>
          </form>
        </div>
        <div className="space-y-3 md:hidden">
          {pagedRows.length > 0 ? (
            pagedRows.map(({ entry, runningBalance }) => (
              <article key={entry.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.transactionNumber}</p>
                    <p className="text-xs text-slate-500">
                      {entry.transactionDate.toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      entry.direction === LedgerDirection.DEBIT
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.direction === LedgerDirection.DEBIT ? "DEBIT" : "KREDIT"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{entry.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm">
                    <span className="text-slate-500">
                      {entry.direction === LedgerDirection.DEBIT ? "Debit: " : "Kredit: "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(entry.amount.toString())}
                    </span>
                  </p>
                  <p className="text-right text-sm">
                    <span className="text-slate-500">Saldo: </span>
                    <span className="font-semibold text-slate-900">{formatRupiah(runningBalance)}</span>
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Belum ada entry ledger yang cocok.
            </div>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Nomor</th>
                <th className="px-3 py-3">Keterangan</th>
                <th className="px-3 py-3">Debit</th>
                <th className="px-3 py-3">Kredit</th>
                <th className="px-3 py-3 text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map(({ entry, runningBalance }) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{entry.transactionDate.toLocaleDateString("id-ID")}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{entry.transactionNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{entry.description}</td>
                  <td className="px-3 py-3">{entry.direction === LedgerDirection.DEBIT ? formatRupiah(entry.amount.toString()) : "-"}</td>
                  <td className="px-3 py-3">{entry.direction === LedgerDirection.CREDIT ? formatRupiah(entry.amount.toString()) : "-"}</td>
                  <td className="px-3 py-3 text-right font-medium text-slate-900">{formatRupiah(runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          pathname="/buku-kas"
          searchParams={resolvedSearchParams}
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          itemLabel="entry ledger"
        />
      </div>
    </section>
  );
}
