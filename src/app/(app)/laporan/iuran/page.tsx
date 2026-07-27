import { BillStatus, PermissionKey, Prisma } from "@prisma/client";
import { HandCoins } from "lucide-react";
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

export default async function ContributionReportPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.VIEW_REPORTS);
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
  ].filter(Boolean).length;
  const andFilters: Prisma.ContributionBillWhereInput[] = [];

  if (regionIdFilter) {
    andFilters.push({ household: { regionId: regionIdFilter } });
  }
  if (statusFilter) {
    andFilters.push({ status: statusFilter as BillStatus });
  }
  if (yearFilter) {
    andFilters.push({ year: Number(yearFilter) });
  }
  if (monthFilter) {
    andFilters.push({ month: Number(monthFilter) });
  }

  const where: Prisma.ContributionBillWhereInput = {
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

  const [bills, totalBills, paidBills, regions] = await Promise.all([
    db.contributionBill.findMany({
      where,
      include: {
        household: {
          include: { region: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take,
    }),
    db.contributionBill.count({ where }),
    db.contributionBill.count({
      where: { ...where, status: BillStatus.LUNAS },
    }),
    db.region.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalDue = bills.reduce((total, bill) => total + Number(bill.amountDue), 0);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Laporan Iuran"
        description="Ringkasan status tagihan dan realisasi pembayaran iuran jamaah."
        icon={HandCoins}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Jumlah Tagihan" value={String(totalBills)} />
        <Card label="Tagihan Lunas" value={String(paidBills)} />
        <Card label="Total Nominal Tagihan" value={formatRupiah(totalDue)} />
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Rincian Laporan Iuran</h3>
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
                Cari
              </button>
            </form>
            <div className="flex gap-3">
              <TableFilterModal
                title="Filter Laporan Iuran"
                description="Atur periode, wilayah, dan status tagihan yang masuk ke laporan."
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
              <Link href="/laporan/iuran" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                Reset
              </Link>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-3">Periode</th>
                <th className="px-3 py-3">Jamaah</th>
                <th className="px-3 py-3">Wilayah</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{`${bill.month}/${bill.year}`}</td>
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
          pathname="/laporan/iuran"
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
