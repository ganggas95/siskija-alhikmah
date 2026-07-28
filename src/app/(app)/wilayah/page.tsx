import { PermissionKey } from "@prisma/client";
import { MapPinned } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";
import { parseSortParam, getPrismaOrderBy, type SortState } from "@/lib/table-sort";
import { SortableHeader } from "@/components/table/sortable-header";

export default async function RegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_REGIONS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const status = getQueryParam(resolvedSearchParams, "status");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);
  
  // Parse sort parameter
  const sortParam = getQueryParam(resolvedSearchParams, "sort");
  const sort: SortState = parseSortParam(sortParam);

  const where: Prisma.RegionWhereInput = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
        ? { isActive: false }
        : {}),
  };

  const [regions, totalRegions] = await Promise.all([
    db.region.findMany({
      where,
      include: {
        _count: {
          select: {
            households: true,
          },
        },
      },
      orderBy: sort.column 
        ? { [sort.column]: sort.direction }
        : { name: "asc" },
      skip,
      take,
    }),
    db.region.count({ where }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Master Wilayah"
        description="Kelompokkan kepala keluarga per dusun atau wilayah operasional."
        icon={MapPinned}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Daftar Wilayah</h3>
              <div className="flex items-center gap-3">
                <Link
                  href="/wilayah/tambah"
                  className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
                >
                  Tambah Wilayah
                </Link>
                <Link
                  href="/wilayah"
                  className="text-sm font-medium text-green-800"
                >
                  Reset
                </Link>
              </div>
            </div>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                name="q"
                defaultValue={query}
                placeholder="Cari nama atau keterangan"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
              <select
                name="status"
                defaultValue={status || "all"}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Terapkan
              </button>
            </form>
          </div>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {regions.map((region) => (
              <article
                key={region.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{region.name}</p>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      region.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {region.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-500">
                  {region.description ?? "-"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {region._count.households} KK
                  </span>
                  <Link
                    href={`/wilayah/${region.id}/edit`}
                    className="text-sm font-medium text-green-800"
                  >
                    Edit
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="name"
                      label="Nama"
                      sort={sort}
                      baseHref="/wilayah"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="isActive"
                      label="Status"
                      sort={sort}
                      baseHref="/wilayah"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3">
                    <SortableHeader
                      column="createdAt"
                      label="Tanggal"
                      sort={sort}
                      baseHref="/wilayah"
                      currentSearchParams={resolvedSearchParams}
                    />
                  </th>
                  <th className="px-3 py-3">Jumlah KK</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{region.name}</p>
                      <p className="text-slate-500">{region.description ?? "-"}</p>
                    </td>
                    <td className="px-3 py-3">{region.isActive ? "Aktif" : "Nonaktif"}</td>
                    <td className="px-3 py-3 text-slate-600">{region.createdAt.toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-3">{region._count.households}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/wilayah/${region.id}/edit`}
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
            pathname="/wilayah"
            searchParams={resolvedSearchParams}
            totalItems={totalRegions}
            page={page}
            pageSize={pageSize}
            itemLabel="wilayah"
          />
      </div>
    </section>
  );
}
