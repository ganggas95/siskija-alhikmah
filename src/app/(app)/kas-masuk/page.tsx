import { CategoryType, IncomeStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

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
import { verifyIncome } from "@/modules/cash/services/verify-income";

async function verifyIncomeAction(formData: FormData) {
  "use server";

  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);
  await verifyIncome({
    incomeId: String(formData.get("incomeId")),
    actorId: user.id,
  });

  revalidatePath("/kas-masuk");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_INCOME);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const categoryIdFilter = getQueryParam(resolvedSearchParams, "categoryId");
  const methodFilter = getQueryParam(resolvedSearchParams, "method");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  const activeFilterCount = [
    statusFilter,
    categoryIdFilter,
    methodFilter,
  ].filter(Boolean).length;

  const where: Prisma.IncomeTransactionWhereInput = {
    ...(query
      ? {
          OR: [
            { transactionNumber: { contains: query, mode: "insensitive" } },
            { sourceName: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter as IncomeStatus } : {}),
    ...(categoryIdFilter ? { categoryId: categoryIdFilter } : {}),
    ...(methodFilter ? { method: methodFilter as PaymentMethod } : {}),
  };

  const [categories, transactions, totalTransactions] = await Promise.all([
    db.transactionCategory.findMany({
      where: { type: CategoryType.INCOME, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.incomeTransaction.findMany({
      where,
      include: { category: true },
      orderBy: { transactionDate: "desc" },
      skip,
      take,
    }),
    db.incomeTransaction.count({ where }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Kas Masuk Non-Iuran"
        description="Catat sedekah, donasi, dan pemasukan lain di luar iuran."
        icon={ArrowDownCircle}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Transaksi Kas Masuk</h3>
              <Link
                href="/kas-masuk/tambah"
                className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Tambah Kas Masuk
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Cari nomor, sumber, atau deskripsi"
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
                  title="Filter Kas Masuk"
                  description="Pilih kategori, status, dan metode untuk transaksi kas masuk."
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
                      {Object.values(IncomeStatus).map((status) => (
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
                <Link href="/kas-masuk" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  Reset
                </Link>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">Nomor</th>
                  <th className="px-3 py-3">Sumber</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Nominal</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{transaction.transactionNumber}</p>
                      <p className="text-slate-500">{transaction.transactionDate.toLocaleDateString("id-ID")}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{transaction.sourceName}</p>
                      <p className="text-slate-500">{transaction.category.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <span>{transaction.status}</span>
                        {transaction.status !== IncomeStatus.VERIFIED ? (
                          <form action={verifyIncomeAction}>
                            <input type="hidden" name="incomeId" value={transaction.id} />
                            <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
                              Verifikasi
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{formatRupiah(transaction.amount.toString())}</td>
                    <td className="px-3 py-3 text-right">
                      {transaction.status === IncomeStatus.DRAFT ? (
                        <Link
                          href={`/kas-masuk/${transaction.id}/edit`}
                          className="text-sm font-medium text-green-800"
                        >
                          Edit
                        </Link>
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
            pathname="/kas-masuk"
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
