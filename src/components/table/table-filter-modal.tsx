"use client";

import { Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TableFilterModalProps = {
  title: string;
  description?: string;
  action?: string;
  submitLabel?: string;
  activeCount?: number;
  children: React.ReactNode;
};

export function TableFilterModal({
  title,
  description,
  action,
  submitLabel = "Terapkan Filter",
  activeCount = 0,
  children,
}: TableFilterModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Filter className="h-4 w-4" />
        Filter
        {activeCount > 0 ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-lg rounded-t-3xl rounded-b-none bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:rounded-3xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    {description ? (
                      <p className="text-sm text-slate-600">{description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Tutup filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form action={action} className="space-y-5">
                  <div className="grid gap-4">{children}</div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {submitLabel}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
