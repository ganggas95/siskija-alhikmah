import { BillStatus, ExpenseStatus, HouseholdStatus, IncomeStatus, LedgerDirection } from "@prisma/client";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpenText,
  CreditCard,
  Landmark,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { requireSession } from "@/lib/rbac";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requireSession();
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const directionFilter = getQueryParam(resolvedSearchParams, "direction");
  const activeDirectionFilter =
    directionFilter && directionFilter !== "all"
      ? (directionFilter as LedgerDirection)
      : undefined;
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams, 8);

  const ledgerWhere: Prisma.CashLedgerWhereInput = {
    isActive: true,
    ...(query
      ? {
          OR: [
            { transactionNumber: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(activeDirectionFilter ? { direction: activeDirectionFilter } : {}),
  };

  const [ledger, totalLedger, balanceSummary, incomeCount, expensePending, households, paidBills, unpaidBills] =
    await Promise.all([
      db.cashLedger.findMany({
        where: ledgerWhere,
        orderBy: { transactionDate: "desc" },
        skip,
        take,
      }),
      db.cashLedger.count({
        where: ledgerWhere,
      }),
      db.cashLedger.groupBy({
        by: ["direction"],
        where: { isActive: true },
        _sum: { amount: true },
      }),
      db.incomeTransaction.count({
        where: { status: IncomeStatus.VERIFIED },
      }),
      db.expenseTransaction.count({
        where: { status: ExpenseStatus.PENDING_VERIFICATION },
      }),
      db.household.count({
        where: { deletedAt: null, status: HouseholdStatus.ACTIVE },
      }),
      db.contributionBill.count({
        where: { status: BillStatus.LUNAS },
      }),
      db.contributionBill.count({
        where: { status: { in: [BillStatus.BELUM_BAYAR, BillStatus.SEBAGIAN] } },
      }),
    ]);

  const balance = balanceSummary.reduce((total, item) => {
    const amount = Number(item._sum.amount ?? 0);
    return item.direction === LedgerDirection.DEBIT ? total + amount : total - amount;
  }, 0);

  const stats = [
    { label: "Saldo Kas", value: formatRupiah(balance), icon: Landmark },
    { label: "Kas Masuk Terverifikasi", value: String(incomeCount), icon: ArrowDownCircle },
    { label: "Pengeluaran Menunggu Verifikasi", value: String(expensePending), icon: AlertCircle },
    { label: "Kepala Keluarga Aktif", value: String(households), icon: Users },
    { label: "Tagihan Lunas", value: String(paidBills), icon: CreditCard },
    { label: "Tagihan Belum/Sebagian", value: String(unpaidBills), icon: ArrowUpCircle },
  ];

  const quickActions = [
    {
      href: "/iuran/pembayaran/tambah",
      label: "Catat Pembayaran",
      description: "Input iuran jamaah",
      icon: CreditCard,
    },
    {
      href: "/kas-masuk/tambah",
      label: "Kas Masuk",
      description: "Catat pemasukan lain",
      icon: ArrowDownCircle,
    },
    {
      href: "/kas-keluar/tambah",
      label: "Kas Keluar",
      description: "Catat pengeluaran",
      icon: ArrowUpCircle,
    },
    {
      href: "/iuran/tagihan",
      label: "Lihat Tagihan",
      description: "Pantau status iuran",
      icon: ScrollText,
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan saldo, iuran, dan transaksi terbaru untuk operasional harian bendahara."
        icon={Landmark}
      />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="rounded-3xl bg-green-900 p-5 text-white shadow-sm">
          <p className="text-sm font-medium text-green-100">Saldo kas aktif</p>
          <p className="mt-2 text-3xl font-semibold leading-tight">{formatRupiah(balance)}</p>
          <p className="mt-2 max-w-xl text-sm text-green-100">
            Fokus mobile: angka paling penting, aksi cepat, dan mutasi terbaru tanpa perlu
            membuka tabel lebar.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="mt-1 text-sm text-green-100">{action.description}</p>
                  </div>
                  <action.icon className="mt-0.5 h-5 w-5 shrink-0 text-green-100" />
                </div>
              </Link>
            ))}
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {stats.slice(1, 4).map((stat) => (
            <article
              key={stat.label}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.slice(4).map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Mutasi Terbaru</h3>
                <p className="text-sm text-slate-500">
                  Ringkasan transaksi terbaru yang mudah dipantau dari Android.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="text-sm font-medium text-green-800">
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
              defaultValue={directionFilter ?? "all"}
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{totalLedger} transaksi</span>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {ledger.length > 0 ? (
            ledger.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.transactionNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.transactionDate.toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      entry.direction === LedgerDirection.DEBIT
                        ? "bg-green-50 text-green-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {entry.direction}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{entry.description}</p>
                <p className="mt-4 text-right text-base font-semibold text-slate-900">
                  {formatRupiah(entry.amount.toString())}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Belum ada mutasi yang cocok dengan filter saat ini.
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
                <th className="px-3 py-3">Arah</th>
                <th className="px-3 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length > 0 ? (
                ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{entry.transactionDate.toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{entry.transactionNumber}</td>
                    <td className="px-3 py-3 text-slate-600">{entry.description}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {entry.direction}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900">
                      {formatRupiah(entry.amount.toString())}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Belum ada mutasi yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          pathname="/dashboard"
          searchParams={resolvedSearchParams}
          totalItems={totalLedger}
          page={page}
          pageSize={pageSize}
          itemLabel="transaksi"
        />
      </section>
    </section>
  );
}
