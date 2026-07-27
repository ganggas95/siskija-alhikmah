import { AppRoleKey, PermissionKey, Prisma } from "@prisma/client";
import { ShieldUser } from "lucide-react";
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
import { roleLabelMap } from "@/lib/user-role";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function UserPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const currentUser = await requirePermission(PermissionKey.MANAGE_USERS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const role = getQueryParam(resolvedSearchParams, "role");
  const status = getQueryParam(resolvedSearchParams, "status");
  const { page, skip, take, pageSize } = getPaginationState(resolvedSearchParams);

  const activeFilters = Number(Boolean(role)) + Number(Boolean(status));

  const where: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            {
              userRoles: {
                some: {
                  role: {
                    name: { contains: query, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(role
      ? {
          userRoles: {
            some: {
              role: {
                key: role as AppRoleKey,
              },
            },
          },
        }
      : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
        ? { isActive: false }
        : {}),
  };

  const [users, totalUsers] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Data User"
        description="Kelola akun pengguna internal yang dapat mengakses sistem."
        icon={ShieldUser}
      />
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Daftar User</h3>
            <div className="flex items-center gap-3">
              <Link
                href="/data-user/tambah"
                className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Tambah User
              </Link>
              <Link href="/data-user" className="text-sm font-medium text-green-800">
                Reset
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form className="grid gap-3 md:w-full md:max-w-xl md:grid-cols-[minmax(0,1fr)_auto]">
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="status" value={status} />
              <input
                name="q"
                defaultValue={query}
                placeholder="Cari nama, email, atau role"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
              <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Cari
              </button>
            </form>
            <TableFilterModal
              title="Filter Data User"
              description="Saring data user berdasarkan role dan status akun."
              activeCount={activeFilters}
            >
              <input type="hidden" name="q" value={query} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  name="role"
                  defaultValue={role || "all"}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="all">Semua role</option>
                  {Object.entries(roleLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={status || "all"}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="all">Semua status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </TableFilterModal>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Dibuat</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => {
                  const roleLabels = user.userRoles.map(({ role }) => roleLabelMap[role.key]);

                  return (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-3 py-3">{roleLabels.join(", ") || "-"}</td>
                      <td className="px-3 py-3">
                        <span className={user.isActive ? "text-green-800" : "text-slate-500"}>
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {dateFormatter.format(user.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {user.id === currentUser.id ? (
                          <span className="text-sm font-medium text-slate-500">Kelola di Profil Saya</span>
                        ) : (
                          <Link
                            href={`/data-user/${user.id}/edit`}
                            className="text-sm font-medium text-green-800"
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Tidak ada data user yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          pathname="/data-user"
          searchParams={resolvedSearchParams}
          totalItems={totalUsers}
          page={page}
          pageSize={pageSize}
          itemLabel="user"
        />
      </div>
    </section>
  );
}
