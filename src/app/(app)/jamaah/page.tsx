import { HouseholdStatus, PermissionKey, Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { TableFilterModal } from "@/components/table/table-filter-modal";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";

export default async function HouseholdPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const regionIdFilter = getQueryParam(resolvedSearchParams, "regionId");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const disabilityFilter = getQueryParam(resolvedSearchParams, "disability");
  const elderlyFilter = getQueryParam(resolvedSearchParams, "elderly");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  const activeFilterCount = [
    regionIdFilter,
    statusFilter,
    disabilityFilter,
    elderlyFilter,
  ].filter(Boolean).length;

  const where: Prisma.HouseholdWhereInput = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { headName: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { rt: { contains: query, mode: "insensitive" } },
            { rw: { contains: query, mode: "insensitive" } },
            { region: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(regionIdFilter ? { regionId: regionIdFilter } : {}),
    ...(statusFilter === "active"
      ? { status: HouseholdStatus.ACTIVE }
      : statusFilter === "inactive"
        ? { status: HouseholdStatus.INACTIVE }
        : {}),
    ...(disabilityFilter === "yes"
      ? { isDisabled: true }
      : disabilityFilter === "no"
        ? { isDisabled: false }
        : {}),
    ...(elderlyFilter === "yes"
      ? { isElderly: true }
      : elderlyFilter === "no"
        ? { isElderly: false }
        : {}),
  };

  const [households, regions, totalHouseholds] = await Promise.all([
    db.household.findMany({
      where,
      include: { region: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.region.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.household.count({ where }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Data Kepala Keluarga"
        description="Kelola data jamaah per kepala keluarga, wilayah, dan status dasar."
        icon={Users}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Daftar Jamaah</h3>
              <Link
                href="/jamaah/tambah"
                className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Tambah Jamaah
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Cari kode, nama, alamat, RT/RW"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
                {regionIdFilter ? <input type="hidden" name="regionId" value={regionIdFilter} /> : null}
                {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
                {disabilityFilter ? <input type="hidden" name="disability" value={disabilityFilter} /> : null}
                {elderlyFilter ? <input type="hidden" name="elderly" value={elderlyFilter} /> : null}
                <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Cari
                </button>
              </form>
              <div className="flex gap-3">
                <TableFilterModal
                  title="Filter Jamaah"
                  description="Pilih parameter tambahan untuk mempersempit data jamaah."
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
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      name="status"
                      defaultValue={statusFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua status</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status Disabilitas</label>
                    <select
                      name="disability"
                      defaultValue={disabilityFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua disabilitas</option>
                      <option value="yes">Disabilitas</option>
                      <option value="no">Tidak disabilitas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status Lansia</label>
                    <select
                      name="elderly"
                      defaultValue={elderlyFilter || "all"}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="all">Semua lansia</option>
                      <option value="yes">Lansia</option>
                      <option value="no">Bukan lansia</option>
                    </select>
                  </div>
                </TableFilterModal>
                <Link href="/jamaah" className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-medium text-green-800">
                  Reset
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {households.length > 0 ? (
              households.map((household) => (
                <article
                  key={household.id}
                  className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{household.code}</p>
                      <p className="mt-1 text-sm text-slate-900">{household.headName}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        household.status === "ACTIVE"
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      {household.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {household.address ?? "-"}
                    {household.rt ? `, RT ${household.rt}` : ""}
                    {household.rw ? `/RW ${household.rw}` : ""}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">{household.region?.name ?? "-"}</p>
                    <Link
                      href={`/jamaah/${household.id}/edit`}
                      className="text-sm font-medium text-green-800"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Tidak ada data jamaah.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">Kode</th>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Wilayah</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {households.map((household) => (
                  <tr key={household.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">{household.code}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{household.headName}</p>
                      <p className="text-slate-500">
                        {household.address ?? "-"} {household.rt ? `RT ${household.rt}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">{household.region?.name ?? "-"}</td>
                    <td className="px-3 py-3">{household.status}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/jamaah/${household.id}/edit`}
                        className="text-sm font-medium text-green-800"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            pathname="/jamaah"
            searchParams={resolvedSearchParams}
            totalItems={totalHouseholds}
            page={page}
            pageSize={pageSize}
            itemLabel="jamaah"
          />
      </div>
    </section>
  );
}
