import { BillStatus, PermissionKey, Prisma } from "@prisma/client";
import { ScrollText } from "lucide-react";
import { ActionLabel } from "@/components/ui/action-label";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { SortableHeader } from "@/components/table/sortable-header";
import { TableFilterModal } from "@/components/table/table-filter-modal";
import { TablePagination } from "@/components/table/table-pagination";
import { TableEmptyState } from "@/components/table/empty-state";
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

export default async function ContributionBillsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const regionIdFilter = getQueryParam(resolvedSearchParams, "regionId");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const yearFilter = getQueryParam(resolvedSearchParams, "year");
  const monthFilter = getQueryParam(resolvedSearchParams, "month");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  const activeFilterCount = [
    regionIdFilter,
    statusFilter,
    yearFilter,
    monthFilter,
  ].filter((f) => f && f !== "all").length;

  const sortParam = getQueryParam(resolvedSearchParams, "sort");
  const sort: SortState = parseSortParam(sortParam);
  const andFilters: Prisma.ContributionBillWhereInput[] = [];

  if (regionIdFilter && regionIdFilter !== "all") {
    andFilters.push({ household: { regionId: regionIdFilter } });
  }
  if (statusFilter && statusFilter !== "all") {
    andFilters.push({ status: statusFilter as BillStatus });
  }
  if (yearFilter && yearFilter !== "all") {
    andFilters.push({ year: Number(yearFilter) });
  }
  if (monthFilter && monthFilter !== "all") {
    andFilters.push({ month: Number(monthFilter) });
  }

  const where: Prisma.ContributionBillWhereInput = {
    canceledAt: null,
    ...(query
      ? {
          OR: [
            { household: { headName: { contains: query, mode: "insensitive" } } },
            { household: { code: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(andFilters.length ? { AND: andFilters } : {}),
  };

  const [bills, totalBills, regions] = await Promise.all([
    db.contributionBill.findMany({
      where,
      include: {
        household: {
          include: {
            region: true,
          },
        },
        payments: {
          where: { canceledAt: null },
        },
      },
      orderBy: sort.column
        ? { [sort.column]: sort.direction === "asc" ? "asc" : "desc" }
        : [{ year: "desc" }, { month: "desc" }, { household: { code: "asc" } }],
      skip,
      take,
    }),
    db.contributionBill.count({ where }),
    db.region.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tagihan Iuran"
        description="Generate tagihan bulanan dan pantau status pembayaran per keluarga."
        icon={ScrollText}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Daftar Tagihan</h3>
              <Link
                href="/iuran/tagihan/generate"
                className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
              >
                <ActionLabel action="add">Generate Tagihan</ActionLabel>
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Cari nama atau kode jamaah"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
                {regionIdFilter ? <input type="hidden" name="regionId" value={regionIdFilter} /> : null}
                {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
                {yearFilter ? <input type="hidden" name="year" value={yearFilter} /> : null}
                {monthFilter ? <input type="hidden" name="month" value={monthFilter} /> : null}
                <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  <ActionLabel action="search">Cari</ActionLabel>
                </button>
              </form>
              <div className="flex gap-3">
                <TableFilterModal
                  title="Filter Tagihan"
                  description="Atur periode, wilayah, dan status tagihan."
                  activeCount={activeFilterCount}
                >
                  {query ? <input type="hidden" name="q" value={query} /> : null}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Wilayah</label>
                    <select
                      name="regionId"
                      defaultValue={regionIdFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua wilayah</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status Tagihan</label>
                    <select
                      name="status"
                      defaultValue={statusFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua status</option>
                      {Object.values(BillStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
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
                <Link href="/iuran/tagihan" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  <ActionLabel action="reset">Reset</ActionLabel>
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {bills.length > 0 ? (
              bills.map((bill) => (
                <article key={bill.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{`${String(bill.month).padStart(2, "0")}/${bill.year}`}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {bill.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-slate-900">{bill.household.headName}</p>
                    <p className="text-xs text-slate-500">{bill.household.code}</p>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-slate-500">{bill.household.region?.name ?? "-"}</p>
                  </div>
                  <p className="mt-4 text-right text-base font-semibold text-slate-900">
                    {formatRupiah(bill.amountDue.toString())}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              <TableEmptyState
                icon={ScrollText}
                title="Belum ada tagihan"
                description="Tagihan yang sesuai dengan filter akan tampil di sini."
              />
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">
                    <SortableHeader column="month" label="Periode" sort={sort} baseHref="/iuran/tagihan" currentSearchParams={resolvedSearchParams} />
                  </th>
                  <th className="px-3 py-3">Jamaah</th>
                  <th className="px-3 py-3">Wilayah</th>
                  <th className="px-3 py-3">
                    <SortableHeader column="status" label="Status" sort={sort} baseHref="/iuran/tagihan" currentSearchParams={resolvedSearchParams} />
                  </th>
                  <th className="px-3 py-3 text-right">
                    <SortableHeader column="amountDue" label="Nominal" sort={sort} baseHref="/iuran/tagihan" currentSearchParams={resolvedSearchParams} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <TableEmptyState
                        icon={ScrollText}
                        title="Belum ada tagihan"
                        description="Coba ubah filter atau generate tagihan baru."
                      />
                    </td>
                  </tr>
                ) : null}
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{`${String(bill.month).padStart(2, "0")}/${bill.year}`}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{bill.household.headName}</p>
                      <p className="text-slate-500">{bill.household.code}</p>
                    </td>
                    <td className="px-3 py-3">{bill.household.region?.name ?? "-"}</td>
                    <td className="px-3 py-3">{bill.status}</td>
                    <td className="px-3 py-3 text-right">{formatRupiah(bill.amountDue.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            pathname="/iuran/tagihan"
            searchParams={resolvedSearchParams}
            totalItems={totalBills}
            page={page}
            pageSize={pageSize}
            itemLabel="tagihan"
          />
      </div>
    </section>
  );
}
