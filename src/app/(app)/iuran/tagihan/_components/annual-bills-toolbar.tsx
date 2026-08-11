"use client";

import { BillStatus } from "@prisma/client";
import { Filter, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableFilterModal } from "@/components/table/table-filter-modal";
import { ActionLabel } from "@/components/ui/action-label";
import type { QueryValue } from "@/lib/table-query";
import { buildQueryString } from "@/lib/table-query";
import { GenerateBillsForm } from "./generate-bills-form";

const statusOptions = [
  { value: "all", label: "Semua status" },
  { value: BillStatus.BELUM_BAYAR, label: "Ada Belum Bayar" },
  { value: BillStatus.SEBAGIAN, label: "Ada Sebagian" },
  { value: BillStatus.LUNAS, label: "Ada Lunas" },
  { value: BillStatus.DIBEBASKAN, label: "Ada Dibebaskan" },
  { value: BillStatus.DIBATALKAN, label: "Ada Dibatalkan" },
] as const;

export function AnnualBillsToolbar({
  query,
  year,
  regionId,
  status,
  regions,
  currentSearchParams,
  normalAmount,
  specialAmount,
}: {
  query: string;
  year: number;
  regionId: string;
  status: string;
  regions: Array<{ id: string; name: string }>;
  currentSearchParams: Record<string, QueryValue>;
  normalAmount: string;
  specialAmount: string;
}) {
  const resetHref = `/iuran/tagihan${buildQueryString(currentSearchParams, {
    q: undefined,
    regionId: undefined,
    status: undefined,
    page: undefined,
    year,
  })}`;
  const hasActiveFilter = Boolean(query || (regionId && regionId !== "all") || (status && status !== "all"));
  const generateRedirectTo = `/iuran/tagihan${buildQueryString(currentSearchParams, {
    q: query || undefined,
    regionId: regionId || undefined,
    status: status || undefined,
    page: undefined,
    year,
  })}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <TableFilterModal
        title="Filter Matriks Tahunan"
        description="Cari keluarga, pilih wilayah, dan fokus pada household yang punya status tertentu."
        activeCount={hasActiveFilter ? 1 : 0}
      >
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Cari jamaah</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Nama, kode, alamat, RT/RW, atau wilayah"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tahun</span>
          <input
            name="year"
            type="number"
            min={2000}
            max={9999}
            defaultValue={year}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Wilayah</span>
          <select
            name="regionId"
            defaultValue={regionId || "all"}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="all">Semua wilayah</option>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Status household</span>
          <select
            name="status"
            defaultValue={status || "all"}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </TableFilterModal>

      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Generate Tagihan Tahunan</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Tagihan Tahunan</DialogTitle>
            <DialogDescription>
              Buat tagihan Januari sampai Desember untuk seluruh jamaah aktif tanpa perlu generate per bulan.
            </DialogDescription>
          </DialogHeader>
          <GenerateBillsForm
            redirectTo={generateRedirectTo}
            normalAmount={normalAmount}
            specialAmount={specialAmount}
            variant="plain"
          />
        </DialogContent>
      </Dialog>

      {hasActiveFilter ? (
        <Link
          href={resetHref}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ActionLabel action="reset">Reset Filter</ActionLabel>
        </Link>
      ) : null}

      <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 sm:inline-flex">
        <Filter className="h-4 w-4" />
        Tahun aktif: {year}
      </div>
    </div>
  );
}
