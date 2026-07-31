import { PermissionKey } from "@prisma/client";
import { ShieldUser } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LogoutButton } from "@/components/app/logout-button";
import { MobileSidebarDrawer } from "@/components/app/mobile-sidebar-drawer";
import { SidebarNav, type SidebarNavGroup } from "@/components/app/sidebar-nav";
import { requireSession, rolePermissions } from "@/lib/rbac";

const navigationGroups: SidebarNavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }],
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
    <div className="min-h-screen w-full bg-slate-100">
      <header className="sticky inset-x-0 top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex w-full max-w-none items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:mx-auto lg:max-w-7xl lg:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MobileSidebarDrawer
              groups={visibleNavigationGroups}
              userName={user.name}
              userRole={user.role}
              profileHref="/profil"
            />
            <div className="overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-slate-200">
              <Image
                src="/logo.png"
                alt="Logo SISKIJA AL-HIKMAH"
                width={48}
                height={48}
                className="h-12 w-12 object-contain lg:h-14 lg:w-14"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-800">
                SISKIJA AL-HIKMAH
              </p>
              <h1 className="text-[15px] font-semibold leading-tight text-slate-900 lg:text-lg">
                Sistem Informasi Keuangan dan Iuran Jamaah
              </h1>
            </div>
          </div>

          <div className="hidden flex-wrap items-center gap-2 text-sm text-slate-600 lg:flex lg:gap-3">
            <Link
              href="/profil"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
            >
              <ShieldUser className="h-4 w-4" />
              {user.name}
            </Link>
            <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-green-800">
              {user.role}
            </span>
            <LogoutButton className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-50 transition hover:text-slate-700 hover:bg-slate-50" />
          </div>
        </div>
      </header>
      <div className="grid w-full max-w-none gap-4 px-4 py-4 lg:mx-auto lg:max-w-7xl lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:py-6">
        <aside className="hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:block lg:self-start lg:p-4">
          <SidebarNav groups={visibleNavigationGroups} />
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
