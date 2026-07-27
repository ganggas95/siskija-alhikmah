"use client";

import { LogOut, Menu, ShieldUser, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SidebarNav, type SidebarNavGroup } from "@/components/app/sidebar-nav";
import { ThemeToggle } from "@/components/app/theme-toggle";

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

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-sidebar-drawer"
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-60 bg-slate-950/45 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            >
              <div
                id="mobile-sidebar-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Navigasi aplikasi"
                className="relative flex h-full w-[86vw] max-w-sm flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-800">
                        SISKIJA AL-HIKMAH
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        Navigasi aplikasi
                      </p>
                      <p className="text-sm text-slate-600">
                        Buka modul dan aksi akun dari satu tempat.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                      aria-label="Tutup menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-green-800 ring-1 ring-green-100">
                        <ShieldUser className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {userName}
                        </p>
                        <p className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-100">
                          {userRole}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={profileHref}
                        onClick={() => setOpen(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Profil
                      </Link>
                      <form action={logoutAction}>
                        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </form>
                    </div>

                    <div className="mt-3">
                      <ThemeToggle className="w-full justify-center" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Menu Modul
                    </p>
                  </div>
                  <SidebarNav
                    groups={groups}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
