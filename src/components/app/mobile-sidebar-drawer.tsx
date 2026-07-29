"use client";

import { LogOut, Menu, ShieldUser } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SidebarNav, type SidebarNavGroup } from "@/components/app/sidebar-nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileSidebarDrawerProps = {
  groups: SidebarNavGroup[];
  userName: string;
  userRole: string;
  profileHref: string;
  logoutAction: () => Promise<void>;
};

export function MobileSidebarDrawer({
  groups,
  userName,
  userRole,
  profileHref,
  logoutAction,
}: MobileSidebarDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="text-left text-sm font-semibold uppercase tracking-[0.16em] text-green-800">
            SISKIJA AL-HIKMAH
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-foreground">
            Navigasi aplikasi
          </SheetDescription>
          <p className="text-sm text-muted-foreground">
            Buka modul dan aksi akun dari satu tempat.
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-2 text-green-800 ring-1 ring-green-100">
                <ShieldUser className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                <Badge variant="secondary" className="mt-1">
                  {userRole}
                </Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={profileHref} onClick={() => setOpen(false)}>
                  Profil
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Keluar
                </Button>
              </form>
            </div>

            <div className="mt-3">
              <ThemeToggle className="w-full justify-center" />
            </div>
          </div>

          <div className="mb-3 mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Menu Modul
            </p>
          </div>
          <SidebarNav groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
