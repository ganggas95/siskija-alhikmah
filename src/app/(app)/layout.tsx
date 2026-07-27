import Image from "next/image";
import Link from "next/link";
import { PermissionKey } from "@prisma/client";
import {
  LogOut,
  ShieldUser,
} from "lucide-react";

import { signOut } from "@/auth";
import { SidebarNav, type SidebarNavGroup } from "@/components/app/sidebar-nav";
import { requireSession, rolePermissions } from "@/lib/rbac";

const navigationGroups: SidebarNavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        href: "/wilayah",
        label: "Data Wilayah",
        icon: "region",
        permission: PermissionKey.MANAGE_REGIONS,
      },
      {
        href: "/jamaah",
        label: "Data Jamaah",
        icon: "household",
        permission: PermissionKey.MANAGE_HOUSEHOLDS,
      },
    ],
  },
  {
    label: "Data Keuangan",
    items: [
      {
        href: "/iuran/tagihan",
        label: "Tagihan",
        icon: "bill",
        permission: PermissionKey.MANAGE_CONTRIBUTIONS,
      },
      {
        href: "/iuran/pembayaran",
        label: "Pembayaran",
        icon: "payment",
        permission: PermissionKey.MANAGE_CONTRIBUTIONS,
      },
      {
        href: "/kas-masuk",
        label: "Kas Masuk",
        icon: "income",
        permission: PermissionKey.MANAGE_INCOME,
      },
      {
        href: "/kas-keluar",
        label: "Kas Keluar",
        icon: "expense",
        permission: PermissionKey.MANAGE_EXPENSES,
      },
    ],
  },
  {
    label: "Laporan Keuangan",
    items: [
      {
        href: "/buku-kas",
        label: "Buku Kas",
        icon: "ledger",
        permission: PermissionKey.VIEW_REPORTS,
      },
      {
        href: "/laporan/kas-bulanan",
        label: "Laporan Kas",
        icon: "cashReport",
        permission: PermissionKey.VIEW_REPORTS,
      },
      {
        href: "/laporan/iuran",
        label: "Laporan Iuran",
        icon: "contributionReport",
        permission: PermissionKey.VIEW_REPORTS,
      },
    ],
  },
  {
    label: "Data User",
    items: [
      {
        href: "/data-user",
        label: "Data User",
        icon: "user",
        permission: PermissionKey.MANAGE_USERS,
      },
    ],
  },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireSession();
  const allowedPermissions = new Set(rolePermissions[user.role] ?? []);
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || allowedPermissions.has(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-slate-200">
              <Image
                src="/logo.png"
                alt="Logo SISKIJA AL-HIKMAH"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">SISKIJA AL-HIKMAH</p>
              <h1 className="text-lg font-semibold text-slate-900">
                Sistem Informasi Keuangan dan Iuran Jamaah
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <Link
              href="/profil"
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
            >
              <ShieldUser className="h-4 w-4" />
              {user.name}
            </Link>
            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-800">
              {user.role}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:p-4">
          <SidebarNav groups={visibleNavigationGroups} />
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
