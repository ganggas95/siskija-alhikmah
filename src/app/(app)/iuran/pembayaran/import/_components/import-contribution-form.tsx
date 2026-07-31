"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useAsyncRequest } from "@/components/app/request-state";
import { ActionLabel } from "@/components/ui/action-label";
import { Progress } from "@/components/ui/progress";

type ImportSummary = {
  batchId: string;
  totalRows: number;
  processedRows: number;
  createdPayments: number;
  skippedPayments: number;
  failedRows: number;
  spilledPayments: number;
};

type ImportSnapshot = {
  batchId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "NOT_FOUND";
  totalRows: number;
  processedRows: number;
  createdPayments: number;
  skippedPayments: number;
  failedRows: number;
  spilledPayments: number;
  progress: number;
  summary: ImportSummary | null;
  errors: Array<{ rowNumber?: number; code?: string; name?: string; message?: string }>;
  message: string;
};

type ImportRowEvent = {
  rowNumber: number;
  code?: string;
  status?: "success" | "skipped" | "failed";
  createdPayments?: number;
  skippedPayments?: number;
  spilledPayments?: number;
};

type ImportState = {
  running: boolean;
  polling: boolean;
  message: string;
  progress: number;
  processedRows: number;
  totalRows: number;
  createdPayments: number;
  skippedPayments: number;
  failedRows: number;
  spilledPayments: number;
  summary: ImportSummary | null;
  errors: Array<{ rowNumber?: number; code?: string; name?: string; message?: string }>;
};

const initialState: ImportState = {
  running: false,
  polling: false,
  message: "Siapkan file Excel dengan kolom Kode Jamaah, Nama, dan Januari-Desember.",
  progress: 0,
  processedRows: 0,
  totalRows: 0,
  createdPayments: 0,
  skippedPayments: 0,
  failedRows: 0,
  spilledPayments: 0,
  summary: null,
  errors: [],
};

function parseEventBlock(block: string) {
  const lines = block.split("\n");
  let type = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const dataText = dataLines.join("\n");
  const parsed = dataText ? JSON.parse(dataText) : {};
  return { type, data: parsed };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function ImportContributionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { execute: executeRequest } = useAsyncRequest<Response>();
  const [state, setState] = useState<ImportState>(initialState);

  function applySnapshot(snapshot: ImportSnapshot) {
    setState((current) => ({
      ...current,
      running: snapshot.status === "PROCESSING" || snapshot.status === "PENDING",
      polling: snapshot.status === "PROCESSING" || snapshot.status === "PENDING",
      message: snapshot.message,
      progress: snapshot.progress,
      processedRows: snapshot.processedRows,
      totalRows: snapshot.totalRows,
      createdPayments: snapshot.createdPayments,
      skippedPayments: snapshot.skippedPayments,
      failedRows: snapshot.failedRows,
      spilledPayments: snapshot.spilledPayments,
      summary: snapshot.summary ?? current.summary,
      errors: snapshot.errors.length > 0 ? snapshot.errors : current.errors,
    }));
  }

  async function pollImportStatus(fileHash: string, targetYear: number) {
    while (true) {
      const response = await executeRequest(() => fetch(
        `/api/iuran/import?fileHash=${encodeURIComponent(fileHash)}&year=${encodeURIComponent(targetYear)}`,
      ));

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Gagal membaca status import.");
      }

      const snapshot = (await response.json()) as ImportSnapshot;
      applySnapshot(snapshot);

      if (snapshot.status === "COMPLETED" || snapshot.status === "FAILED" || snapshot.status === "NOT_FOUND") {
        setState((current) => ({
          ...current,
          running: false,
          polling: false,
          progress: snapshot.status === "COMPLETED" ? 100 : current.progress,
          message: snapshot.message,
        }));
        break;
      }

      await delay(2000);
    }
  }

  async function startPollingFallback(form: HTMLFormElement) {
    const formData = new FormData(form);
    formData.set("mode", "poll");
    const response = await executeRequest(() => fetch("/api/iuran/import", {
      method: "POST",
      headers: {
        "X-Import-Mode": "poll",
      },
      body: formData,
    }));

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message ?? "Import gagal dijalankan.");
    }

    const payload = (await response.json()) as { fileHash?: string; targetYear?: number; message?: string };
    if (!payload.fileHash || !payload.targetYear) {
      throw new Error("Import fallback tidak mendapatkan identitas job.");
    }

    setState((current) => ({
      ...current,
      running: true,
      polling: true,
      message: payload.message ?? "Import berjalan dalam mode polling.",
    }));

    await pollImportStatus(payload.fileHash, payload.targetYear);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setState((current) => ({ ...current, message: "Pilih file Excel terlebih dahulu." }));
      return;
    }

    const formData = new FormData(form);
    setState({
      ...initialState,
      running: true,
      message: "Memulai import...",
    });

    try {
      const response = await executeRequest(() => fetch("/api/iuran/import", {
        method: "POST",
        body: formData,
      }));

      if (!response.ok) {
        await startPollingFallback(form);
        return;
      }

      if (!response.body) {
        await startPollingFallback(form);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamCompleted = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let splitIndex = buffer.indexOf("\n\n");
        while (splitIndex >= 0) {
          const chunk = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);

          if (chunk.trim()) {
            const event = parseEventBlock(chunk);
            if (event.type === "init") {
              setState((current) => ({
                ...current,
                message: event.data.message ?? "Import dimulai.",
                totalRows: Number(event.data.payload?.totalRows ?? 0),
              }));
            }

            if (event.type === "progress") {
              const processedRows = Number(event.data.payload?.processedRows ?? 0);
              const totalRows = Number(event.data.payload?.totalRows ?? 0);
              const summaryProgress = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
              setState((current) => ({
                ...current,
                message: event.data.message ?? current.message,
                progress: summaryProgress,
                processedRows,
                totalRows,
                createdPayments: Number(event.data.payload?.createdPaymentsTotal ?? current.createdPayments),
                skippedPayments: Number(event.data.payload?.skippedPaymentsTotal ?? current.skippedPayments),
                failedRows: Number(event.data.payload?.failedRows ?? current.failedRows),
                spilledPayments: Number(event.data.payload?.spilledPaymentsTotal ?? current.spilledPayments),
              }));
            }

            if (event.type === "row") {
              const row = event.data.payload as ImportRowEvent;
              setState((current) => ({
                ...current,
                errors:
                  event.data.payload?.status === "failed"
                    ? [...current.errors, { rowNumber: row.rowNumber, code: row.code, message: event.data.message }]
                    : current.errors,
              }));
            }

            if (event.type === "done") {
              const payload = event.data.payload as ImportSummary | undefined;
              streamCompleted = true;
              setState((current) => ({
                ...current,
                running: false,
                polling: false,
                message: event.data.message ?? "Import selesai.",
                progress: 100,
                summary: payload ?? current.summary,
                totalRows: payload?.totalRows ?? current.totalRows,
                processedRows: payload?.processedRows ?? current.processedRows,
                createdPayments: payload?.createdPayments ?? current.createdPayments,
                skippedPayments: payload?.skippedPayments ?? current.skippedPayments,
                failedRows: payload?.failedRows ?? current.failedRows,
                spilledPayments: payload?.spilledPayments ?? current.spilledPayments,
              }));
            }

            if (event.type === "error") {
              streamCompleted = true;
              setState((current) => ({
                ...current,
                running: false,
                polling: false,
                message: event.data.message ?? "Import gagal.",
              }));
            }
          }

          splitIndex = buffer.indexOf("\n\n");
        }
      }

      if (!streamCompleted) {
        await startPollingFallback(form);
      }
    } catch (error) {
      try {
        await startPollingFallback(form);
        return;
      } catch (fallbackError) {
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : "Import gagal dijalankan.";
        setState((current) => ({
          ...current,
          message,
          running: false,
          polling: false,
        }));
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Excel Iuran</h3>
            <p className="mt-1 text-sm text-slate-600">
              Gunakan file Excel yang sudah ditambah kolom <strong>Kode Jamaah</strong>.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Tahun Tagihan</span>
              <input
                name="year"
                type="number"
                defaultValue={new Date().getFullYear()}
                min={2000}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                required
              />
              <span className="block rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900">
                Belum memiliki format import pembayaran? Buka halaman Data Jamaah, gunakan tombol Export Pembayaran,
                pilih tahun yang sama, lalu upload file hasil export di sini.{" "}
                <a
                  href="/jamaah"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950"
                >
                  Buka Data Jamaah
                </a>
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">File Excel</span>
              <input
                ref={fileRef}
                name="file"
                type="file"
                accept=".xlsx"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                required
              />
            </label>
          </div>

          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Format wajib: <strong>Kode Jamaah</strong>, <strong>Nama</strong>, lalu kolom bulan Januari sampai Desember.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state.running}
              className="inline-flex items-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <ActionLabel action="import">
                {state.running ? (state.polling ? "Memproses via polling..." : "Memproses...") : "Mulai Import"}
              </ActionLabel>
            </button>
            <p className="text-sm text-slate-600">{state.message}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{state.progress}%</span>
            </div>
            <Progress value={state.progress} />
          </div>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Ringkasan</h4>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Stat label="Baris" value={`${state.processedRows}/${state.totalRows}`} />
            <Stat label="Payment dibuat" value={state.createdPayments} />
            <Stat label="Dilewati" value={state.skippedPayments} />
            <Stat label="Gagal" value={state.failedRows} />
            <Stat label="Spillover" value={state.spilledPayments} />
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Error Baris</h4>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
            {state.errors.length > 0 ? (
              state.errors.map((error, index) => (
                <div
                  key={`${error.rowNumber ?? index}-${index}`}
                  className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <p className="font-semibold">
                    Baris {error.rowNumber ?? "-"} {error.code ? `· ${error.code}` : ""}
                  </p>
                  <p className="mt-1">{error.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada error.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
