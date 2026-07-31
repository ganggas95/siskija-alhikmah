import { CategoryType, ExpenseStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { SubmitButton } from "@/components/form/submit-button";
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
import { parseSortParam, type SortState } from "@/lib/table-sort";
import { SortableHeader } from "@/components/table/sortable-header";
import { verifyExpense } from "@/modules/cash/services/verify-expense";
import { deleteExpenseAction } from "./actions";

async function verifyExpenseAction(formData: FormData) {
  "use server";

  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);
  await verifyExpense({
    expenseId: String(formData.get("expenseId")),
    actorId: user.id,
  });

  revalidatePath("/kas-keluar");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

export default async function ExpensePage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_EXPENSES);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const categoryIdFilter = getQueryParam(resolvedSearchParams, "categoryId");
  const methodFilter = getQueryParam(resolvedSearchParams, "method");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  
  // Parse sort parameter
  const sortParam = getQueryParam(resolvedSearchParams, "sort");
  const sort: SortState = parseSortParam(sortParam);
  
  const activeFilterCount = [
    statusFilter,
    categoryIdFilter,
    methodFilter,
  ].filter((f) => f && f !== "all").length;

  const where: Prisma.ExpenseTransactionWhereInput = {
    ...(query
      ? {
          OR: [
            { transactionNumber: { contains: query, mode: "insensitive" } },
            { payeeName: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter as ExpenseStatus } : {}),
    ...(categoryIdFilter && categoryIdFilter !== "all" ? { categoryId: categoryIdFilter } : {}),
    ...(methodFilter && methodFilter !== "all" ? { method: methodFilter as PaymentMethod } : {}),
  };

  const [categories, transactions, totalTransactions] = await Promise.all([
    db.transactionCategory.findMany({
      where: { type: CategoryType.EXPENSE, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.expenseTransaction.findMany({
      where,
      include: { category: true },
      orderBy: sort.column
        ? { [sort.column]: sort.direction === "asc" ? "asc" : "desc" }
        : { transactionDate: "desc" },
      skip,
      take,
    }),
    db.expenseTransaction.count({ where }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Kas Keluar"
        description="Catat pengeluaran dan verifikasi sebelum saldo berkurang."
        icon={ArrowUpCircle}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Transaksi Pengeluaran</h3>
              <Link
                href="/kas-keluar/tambah"
                className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Tambah Kas Keluar
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Cari nomor, penerima, atau deskripsi"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
                {categoryIdFilter ? <input type="hidden" name="categoryId" value={categoryIdFilter} /> : null}
                {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
                {methodFilter ? <input type="hidden" name="method" value={methodFilter} /> : null}
                <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Cari
                </button>
              </form>
              <div className="flex gap-3">
                <TableFilterModal
                  title="Filter Kas Keluar"
                  description="Pilih kategori, status, dan metode untuk transaksi pengeluaran."
                  activeCount={activeFilterCount}
                >
                  {query ? <input type="hidden" name="q" value={query} /> : null}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Kategori</label>
                    <select
                      name="categoryId"
                      defaultValue={categoryIdFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      name="status"
                      defaultValue={statusFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua status</option>
                      {Object.values(ExpenseStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Metode</label>
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
                </TableFilterModal>
                <Link href="/kas-keluar" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  Reset
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <article key={transaction.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{transaction.transactionNumber}</p>
                      <p className="text-xs text-slate-500">{transaction.transactionDate.toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {transaction.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-slate-900">{transaction.payeeName}</p>
                    <p className="text-xs text-slate-500">{transaction.category.name}</p>
                  </div>
                  <p className="mt-4 text-right text-base font-semibold text-slate-900">
                    {formatRupiah(transaction.amount.toString())}
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {transaction.status !== ExpenseStatus.VERIFIED ? (
                      <form action={verifyExpenseAction}>
                        <input type="hidden" name="expenseId" value={transaction.id} />
                        <SubmitButton pendingLabel="Memverifikasi..." className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
                          Verifikasi
                        </SubmitButton>
                      </form>
                    ) : null}
                    {transaction.status === ExpenseStatus.DRAFT ? (
                      <>
                        <Link
                          href={`/kas-keluar/${transaction.id}/edit`}
                          className="rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Edit
                        </Link>
                        <form action={async (formData) => { await deleteExpenseAction(formData); }} onSubmit={(e) => { if (!confirm('Hapus transaksi kas keluar ini?')) e.preventDefault(); }}>
                          <input type="hidden" name="id" value={transaction.id} />
                          <SubmitButton pendingLabel="Menghapus..." className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600">
                            Hapus
                          </SubmitButton>
                        </form>
                      </>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Belum ada transaksi pengeluaran yang cocok.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="transactionNumber"
                      label="Nomor"
                      sort={sort}
                      baseHref="/kas-keluar"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="transactionDate"
                      label="Tanggal"
                      sort={sort}
                      baseHref="/kas-keluar"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3">Penerima</th>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="status"
                      label="Status"
                      sort={sort}
                      baseHref="/kas-keluar"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3 text-right">
                    <SortableHeader
                      column="amount"
                      label="Nominal"
                      sort={sort}
                      baseHref="/kas-keluar"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3 font-medium text-slate-900">{transaction.transactionNumber}</td>
                    <td className="px-3 py-3 text-slate-600">{transaction.transactionDate.toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{transaction.payeeName}</p>
                      <p className="text-slate-500">{transaction.category.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <span>{transaction.status}</span>
                        {transaction.status !== ExpenseStatus.VERIFIED ? (
                          <form action={verifyExpenseAction}>
                            <input type="hidden" name="expenseId" value={transaction.id} />
                            <SubmitButton pendingLabel="Memverifikasi..." className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
                              Verifikasi
                            </SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{formatRupiah(transaction.amount.toString())}</td>
                    <td className="px-3 py-3 text-right">
                      {transaction.status === ExpenseStatus.DRAFT ? (
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/kas-keluar/${transaction.id}/edit`}
                            className="text-sm font-medium text-green-800"
                          >
                            Edit
                          </Link>
                          <form action={async (formData) => { await deleteExpenseAction(formData); }} onSubmit={(e) => { if (!confirm('Hapus transaksi kas keluar ini?')) e.preventDefault(); }}>
                            <input type="hidden" name="id" value={transaction.id} />
                            <SubmitButton pendingLabel="Menghapus..." className="text-sm font-medium text-red-600">Hapus</SubmitButton>
                          </form>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            pathname="/kas-keluar"
            searchParams={resolvedSearchParams}
            totalItems={totalTransactions}
            page={page}
            pageSize={pageSize}
            itemLabel="transaksi"
          />
      </div>
    </section>
  );
}
