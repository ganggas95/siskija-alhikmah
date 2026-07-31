import { PaymentMethod, PermissionKey } from "@prisma/client";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { SortableHeader } from "@/components/table/sortable-header";
import { TableFilterModal } from "@/components/table/table-filter-modal";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { requirePermission } from "@/lib/rbac";
import { parseSortParam, type SortState } from "@/lib/table-sort";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";
import { DeletePaymentForm } from "./_components/delete-payment-form";

export default async function ContributionPaymentsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const methodFilter = getQueryParam(resolvedSearchParams, "method");
  const yearFilter = getQueryParam(resolvedSearchParams, "year");
  const monthFilter = getQueryParam(resolvedSearchParams, "month");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  const activeFilterCount = [methodFilter, yearFilter, monthFilter].filter((f) => f && f !== "all").length;

  const sortParam = getQueryParam(resolvedSearchParams, "sort");
  const sort: SortState = parseSortParam(sortParam);
  const andFilters: Prisma.ContributionPaymentWhereInput[] = [];

  if (methodFilter && methodFilter !== "all") {
    andFilters.push({ method: methodFilter as PaymentMethod });
  }
  if (yearFilter && yearFilter !== "all") {
    andFilters.push({ bill: { year: Number(yearFilter) } });
  }
  if (monthFilter && monthFilter !== "all") {
    andFilters.push({ bill: { month: Number(monthFilter) } });
  }

  const paymentWhere: Prisma.ContributionPaymentWhereInput = {
    ...(query
      ? {
          OR: [
            { receiptNumber: { contains: query, mode: "insensitive" } },
            { bill: { household: { headName: { contains: query, mode: "insensitive" } } } },
            { bill: { household: { code: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(andFilters.length ? { AND: andFilters } : {}),
  };

  const [payments, totalPayments] = await Promise.all([
    db.contributionPayment.findMany({
      where: paymentWhere,
      include: {
        bill: {
          include: { household: true },
        },
      },
      orderBy: sort.column
        ? { [sort.column]: sort.direction === "asc" ? "asc" : "desc" }
        : { paymentDate: "desc" },
      skip,
      take,
    }),
    db.contributionPayment.count({
      where: paymentWhere,
    }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Pembayaran Iuran"
        description="Catat pembayaran iuran dan sinkronkan otomatis ke kas masuk serta ledger."
        icon={CreditCard}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Riwayat Pembayaran</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/iuran/pembayaran/import"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Import Excel
                </Link>
                <Link
                  href="/iuran/pembayaran/tambah"
                  className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
                >
                  Input Pembayaran
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Cari nama, kode, atau nomor bukti"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
                {methodFilter ? <input type="hidden" name="method" value={methodFilter} /> : null}
                {yearFilter ? <input type="hidden" name="year" value={yearFilter} /> : null}
                {monthFilter ? <input type="hidden" name="month" value={monthFilter} /> : null}
                <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Cari
                </button>
              </form>
              <div className="flex gap-3">
                <TableFilterModal
                  title="Filter Pembayaran"
                  description="Atur metode dan periode pembayaran yang ingin ditampilkan."
                  activeCount={activeFilterCount}
                >
                  {query ? <input type="hidden" name="q" value={query} /> : null}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Metode Pembayaran</label>
                    <select
                      name="method"
                      defaultValue={methodFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua metode</option>
                      {Object.values(PaymentMethod).map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Tahun</label>
                      <input
                        name="year"
                        type="number"
                        defaultValue={yearFilter}
                        placeholder="Tahun"
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
                        defaultValue={monthFilter}
                        placeholder="Bulan"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </TableFilterModal>
                <Link href="/iuran/pembayaran" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  Reset
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <article key={payment.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{payment.bill.household.headName}</p>
                      <p className="text-xs text-slate-500">{payment.paymentDate.toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {payment.method}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">{payment.receiptNumber}</p>
                  </div>
                  <p className="mt-4 text-right text-base font-semibold text-slate-900">
                    {formatRupiah(payment.amountPaid.toString())}
                  </p>
                  <div className="mt-3 flex items-center justify-end">
                      <DeletePaymentForm
                        paymentId={payment.id}
                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600"
                      />
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Belum ada pembayaran yang cocok.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">
                    <SortableHeader column="paymentDate" label="Tanggal" sort={sort} baseHref="/iuran/pembayaran" currentSearchParams={resolvedSearchParams} />
                  </th>
                  <th className="px-3 py-3">Jamaah</th>
                  <th className="px-3 py-3">
                    <SortableHeader column="method" label="Metode" sort={sort} baseHref="/iuran/pembayaran" currentSearchParams={resolvedSearchParams} />
                  </th>
                  <th className="px-3 py-3 text-right">
                    <SortableHeader column="amountPaid" label="Nominal" sort={sort} baseHref="/iuran/pembayaran" currentSearchParams={resolvedSearchParams} />
                  </th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{payment.paymentDate.toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{payment.bill.household.headName}</p>
                      <p className="text-slate-500">{payment.receiptNumber}</p>
                      <p className="text-xs text-amber-700">{payment.status}</p>
                    </td>
                    <td className="px-3 py-3">{payment.method}</td>
                    <td className="px-3 py-3 text-right">{formatRupiah(payment.amountPaid.toString())}</td>
                    <td className="px-3 py-3 text-right">
                      <DeletePaymentForm paymentId={payment.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            pathname="/iuran/pembayaran"
            searchParams={resolvedSearchParams}
            totalItems={totalPayments}
            page={page}
            pageSize={pageSize}
            itemLabel="pembayaran"
          />
      </div>
    </section>
  );
}
