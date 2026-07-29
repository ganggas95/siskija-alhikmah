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

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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
  onNavigate,
}: {
  groups: SidebarNavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.label, !isGroupActive(pathname, group)]),
      ),
  );

  return (
    <nav aria-label="Navigasi modul" className="space-y-3">
      {groups.map((group) => {
        const collapsed = collapsedGroups[group.label] ?? false;
        const activeGroup = isGroupActive(pathname, group);

        return (
          <Collapsible
            key={group.label}
            open={!collapsed}
            onOpenChange={(open) =>
              setCollapsedGroups((current) => ({
                ...current,
                [group.label]: !open,
              }))
            }
            className={`w-full rounded-2xl border p-3 transition ${
              activeGroup
                ? "border-green-200 bg-green-50/60"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left hover:bg-transparent"
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
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent id={`submenu-${group.label}`} className="mt-3">
              <div className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const activeItem = isItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`inline-flex min-h-11 w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                        activeItem
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>

            {collapsed && activeGroup ? (
              <Badge variant="secondary" className="mt-3 inline-flex rounded-xl px-3 py-2 text-sm font-medium">
                {group.items.find((item) => isItemActive(pathname, item.href))?.label}
              </Badge>
            ) : null}
          </Collapsible>
        );
      })}
    </nav>
  );
}
