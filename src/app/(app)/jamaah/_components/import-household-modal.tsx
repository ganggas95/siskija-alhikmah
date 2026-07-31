"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

type RegionOption = {
  id: string;
  name: string;
};

type ImportError = {
  rowNumber: number;
  type: "INVALID" | "DUPLICATE";
  message: string;
};

type ImportSummary = {
  totalRows: number;
  createdRows: number;
  duplicateRows: number;
  invalidRows: number;
  errors: ImportError[];
};

type ImportHouseholdModalProps = {
  regions: RegionOption[];
};

const initialState = {
  open: false,
  importing: false,
  message: "",
  summary: null as ImportSummary | null,
};

export function ImportHouseholdModal({ regions }: ImportHouseholdModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(initialState.open);
  const [regionId, setRegionId] = useState("");
  const [state, setState] = useState(initialState);

  function reset() {
    setRegionId("");
    setState(initialState);
    if (fileRef.current) fileRef.current.value = "";
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];

    if (!regionId) {
      setState((current) => ({ ...current, message: "Wilayah wajib dipilih." }));
      return;
    }

    if (!file) {
      setState((current) => ({ ...current, message: "File Excel wajib dipilih." }));
      return;
    }

    const formData = new FormData();
    formData.set("regionId", regionId);
    formData.set("file", file);
    setState({ open: true, importing: true, message: "Memproses import...", summary: null });

    try {
      const response = await fetch("/api/jamaah/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; summary?: ImportSummary }
        | null;

      if (!response.ok || !payload?.summary) {
        throw new Error(payload?.message ?? "Import data jamaah gagal.");
      }

      const summary = payload.summary;
      showToast(
        "success",
        `Import selesai. Total: ${summary.totalRows} | Berhasil: ${summary.createdRows} | Duplikat: ${summary.duplicateRows} | Invalid: ${summary.invalidRows}`,
      );
      close();
      router.refresh();
    } catch (error) {
      setState({
        open: true,
        importing: false,
        message: error instanceof Error ? error.message : "Import data jamaah gagal.",
        summary: null,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-xl border border-green-700 bg-white px-4 py-3 text-sm font-semibold text-green-800"
        >
          Import Jamaah
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Jamaah</DialogTitle>
          <DialogDescription>
            Pilih wilayah dan file Excel dengan kolom Nama Jamaah, RT, dan RW.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="import-household-region" className="text-sm font-medium text-slate-700">
              Wilayah
            </label>
            <select
              id="import-household-region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              disabled={state.importing}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Pilih wilayah</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="import-household-file" className="text-sm font-medium text-slate-700">
              File Excel
            </label>
            <input
              ref={fileRef}
              id="import-household-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={state.importing}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <a
            href="/api/jamaah/import-template"
            download="template-import-jamaah.xlsx"
            className="inline-flex text-sm font-medium text-green-800 underline"
          >
            Download Template Import
          </a>

          {state.message ? (
            <div className={`rounded-2xl px-4 py-3 text-sm ${state.summary ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>
              {state.message}
            </div>
          ) : null}

          {state.summary ? (
            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Ringkasan Import</p>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                <div><dt>Total baris</dt><dd className="font-semibold">{state.summary.totalRows}</dd></div>
                <div><dt>Berhasil dibuat</dt><dd className="font-semibold text-green-800">{state.summary.createdRows}</dd></div>
                <div><dt>Duplikat dilewati</dt><dd className="font-semibold">{state.summary.duplicateRows}</dd></div>
                <div><dt>Invalid dilewati</dt><dd className="font-semibold text-amber-800">{state.summary.invalidRows}</dd></div>
              </dl>
              {state.summary.errors.length > 0 ? (
                <div className="mt-4 max-h-40 overflow-y-auto border-t border-slate-200 pt-3">
                  <p className="font-medium">Detail baris yang dilewati</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {state.summary.errors.map((error) => (
                      <li key={`${error.rowNumber}-${error.type}-${error.message}`}>
                        Baris {error.rowNumber}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                onClick={close}
                disabled={state.importing}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={state.importing}
              className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state.importing ? "Mengimport..." : "Import"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
