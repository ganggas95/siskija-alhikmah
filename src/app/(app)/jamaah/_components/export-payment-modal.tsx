"use client";

import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAsyncRequest } from "@/components/app/request-state";

type ExportPaymentModalProps = {
  query?: string;
  regionId?: string;
  status?: string;
  disability?: string;
  elderly?: string;
  defaultYear: number;
};

export function ExportPaymentModal({
  query,
  regionId,
  status,
  disability,
  elderly,
  defaultYear,
}: ExportPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const { execute, isLoading, error } = useAsyncRequest<{
    blob: Blob;
    fileName: string;
  }>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set("year", String(formData.get("year") ?? ""));
    if (query) params.set("q", query);
    if (regionId) params.set("regionId", regionId);
    if (status) params.set("status", status);
    if (disability) params.set("disability", disability);
    if (elderly) params.set("elderly", elderly);

    try {
      const result = await execute(async () => {
        const response = await fetch("/api/jamaah/export-pembayaran?" + params.toString());
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Export pembayaran gagal.");
        }

        const contentDisposition = response.headers.get("content-disposition") ?? "";
        const fileName =
          contentDisposition.match(/filename="?([^"]+)"?/)?.[1] ??
          "export-pembayaran-jamaah.xlsx";

        return { blob: await response.blob(), fileName };
      });

      const downloadUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      showToast("success", "Export pembayaran berhasil diunduh.");
      setOpen(false);
    } catch {
      // Error is exposed by useAsyncRequest and shown in the modal.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLoading) return;
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-xl border border-green-700 bg-white px-4 py-3 text-sm font-semibold text-green-800"
        >
          Export Pembayaran
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Pembayaran</DialogTitle>
          <DialogDescription>
            Pilih tahun pembayaran yang ingin diekspor berdasarkan filter jamaah saat ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
          {query ? <input type="hidden" name="q" value={query} /> : null}
          {regionId ? <input type="hidden" name="regionId" value={regionId} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {disability ? <input type="hidden" name="disability" value={disability} /> : null}
          {elderly ? <input type="hidden" name="elderly" value={elderly} /> : null}

          <div className="space-y-2">
            <label htmlFor="export-payment-year" className="text-sm font-medium text-slate-700">
              Tahun pembayaran
            </label>
            <input
              id="export-payment-year"
              name="year"
              type="number"
              min={2000}
              max={9999}
              defaultValue={defaultYear}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {error.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={isLoading}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
            >
              {isLoading ? "Mengekspor..." : "Export"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
