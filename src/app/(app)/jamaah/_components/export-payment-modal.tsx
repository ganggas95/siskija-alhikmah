"use client";

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
  return (
    <Dialog>
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

        <form action="/api/jamaah/export-pembayaran" method="get" className="space-y-5">
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
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
            >
              Export
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
