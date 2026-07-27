"use client";

import type { PermissionKey } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileBarChart2,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  MapPinned,
  ScrollText,
  ShieldUser,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type IconName =
  | "dashboard"
  | "region"
  | "household"
  | "bill"
  | "payment"
  | "income"
  | "expense"
  | "ledger"
  | "cashReport"
  | "contributionReport"
  | "user";

export type SidebarNavGroup = {
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: IconName;
    permission?: PermissionKey;
  }>;
};

const iconMap: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  region: MapPinned,
  household: Users,
  bill: ScrollText,
  payment: CreditCard,
  income: BanknoteArrowDown,
  expense: BanknoteArrowUp,
  ledger: BookOpenText,
  cashReport: FileBarChart2,
  contributionReport: HandCoins,
  user: ShieldUser,
};

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, group: SidebarNavGroup) {
  return group.items.some((item) => isItemActive(pathname, item.href));
}

export function SidebarNav({
  groups,
}: {
  groups: SidebarNavGroup[];
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.label, false]),
      ),
  );

  return (
    <nav className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-4 lg:overflow-visible">
      {groups.map((group) => {
        const collapsed = collapsedGroups[group.label] ?? false;
        const activeGroup = isGroupActive(pathname, group);

        return (
          <div
            key={group.label}
            className="min-w-55 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:min-w-0"
          >
            <button
              type="button"
              onClick={() =>
                setCollapsedGroups((current) => ({
                  ...current,
                  [group.label]: !collapsed,
                }))
              }
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left"
              aria-expanded={!collapsed}
              aria-controls={`submenu-${group.label}`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <FolderTree className="h-3.5 w-3.5 shrink-0" />
                {group.label}
              </span>
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {!collapsed ? (
              <div
                id={`submenu-${group.label}`}
                className="mt-3 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
              >
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const activeItem = isItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex min-w-fit items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition lg:w-full ${
                        activeItem
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:border-transparent"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {collapsed && activeGroup ? (
              <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                {group.items.find((item) => isItemActive(pathname, item.href))?.label}
              </p>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
