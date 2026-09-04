"use client";

import Decimal from "decimal.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleDashed,
  Expand,
  PencilLine,
  ScrollText,
  ShieldMinus,
  XCircle,
} from "lucide-react";

import { TableEmptyState } from "@/components/table/empty-state";
import { TablePagination } from "@/components/table/table-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TableLoadingLink,
  TableLoadingState,
} from "@/components/table/table-loading-state";
import type { QueryValue } from "@/lib/table-query";
import { buildQueryString } from "@/lib/table-query";
import { formatRupiah } from "@/lib/money";
import {
  CONTRIBUTION_MONTH_LABELS,
  type AnnualBillsMatrixRow,
  type AnnualBillsRegionTab,
} from "@/modules/contributions/annual-bills";
import { BillStatus } from "@prisma/client";
import type { AnnualBillsToolbarProps } from "./annual-bills-toolbar";
import { AnnualBillsToolbar } from "./annual-bills-toolbar";
import { BillCellGenerateButton } from "./bill-cell-generate-button";
import { BillPaymentModal } from "./bill-payment-modal";
import { PaymentActionButton } from "../../pembayaran/_components/payment-action-button";
import { cancelPaymentAction } from "../../pembayaran/actions";

const PATHNAME = "/iuran/tagihan";

export function AnnualBillsMatrix({
  tabs,
  activeTab,
  rows,
  totalItems,
  currentSearchParams,
  year,
  page,
  pageSize,
  isFullscreen,
  toolbarProps,
}: {
  tabs: AnnualBillsRegionTab[];
  activeTab: AnnualBillsRegionTab;
  rows: AnnualBillsMatrixRow[];
  totalItems: number;
  currentSearchParams: Record<string, QueryValue>;
  year: number;
  page: number;
  pageSize: number;
  isFullscreen: boolean;
  toolbarProps: Omit<AnnualBillsToolbarProps, "mode">;
}) {
  const router = useRouter();
  const hasAnyRows = tabs.some((tab) => tab.totalHouseholds > 0);
  const fullscreenHref = `${PATHNAME}${buildQueryString(currentSearchParams, {
    fullscreen: "1",
  })}`;

  return (
    <TableLoadingState
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      overlayLabel="Memuat matriks tagihan..."
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Matriks Tagihan Tahunan</h3>
          <p className="text-sm text-slate-600">
            Setiap baris mewakili satu kepala keluarga. Klik sel belum lunas untuk langsung ke form pembayaran.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Perbesar matriks tagihan"
          asChild
        >
          <TableLoadingLink href={fullscreenHref} scroll={false}>
            <span className="sr-only">Perbesar matriks tagihan</span>
            <Expand className="h-4 w-4" />
          </TableLoadingLink>
        </Button>
        <Dialog
          open={isFullscreen}
          onOpenChange={(open) => {
            router.push(
              `${PATHNAME}${buildQueryString(currentSearchParams, {
                fullscreen: open ? "1" : undefined,
              })}`,
              { scroll: false },
            );
          }}
        >
          <DialogContent className="left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 p-0">
            <div className="flex h-full min-h-0 min-w-0 flex-col bg-white">
              <DialogHeader className="border-b border-slate-200 px-6 py-4">
                <DialogTitle>Matriks Tagihan Tahunan</DialogTitle>
                <DialogDescription>
                  Tampilan fokus layar penuh untuk melihat lebih banyak kolom dan aksi per sel.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-6 py-4">
                <AnnualBillsMatrixContent
                  tabs={tabs}
                  activeTab={activeTab}
                  rows={rows}
                  totalItems={totalItems}
                  currentSearchParams={currentSearchParams}
                  year={year}
                  page={page}
                  pageSize={pageSize}
                  toolbarProps={toolbarProps}
                  mode="fullscreen"
                  hasAnyRows={hasAnyRows}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AnnualBillsMatrixContent
        tabs={tabs}
        activeTab={activeTab}
        rows={rows}
        totalItems={totalItems}
        currentSearchParams={currentSearchParams}
        year={year}
        page={page}
        pageSize={pageSize}
        toolbarProps={toolbarProps}
        mode="embedded"
        hasAnyRows={hasAnyRows}
      />
    </TableLoadingState>
  );
}

function AnnualBillsMatrixContent({
  tabs,
  activeTab,
  rows,
  totalItems,
  currentSearchParams,
  year,
  page,
  pageSize,
  toolbarProps,
  mode,
  hasAnyRows,
}: {
  tabs: AnnualBillsRegionTab[];
  activeTab: AnnualBillsRegionTab;
  rows: AnnualBillsMatrixRow[];
  totalItems: number;
  currentSearchParams: Record<string, QueryValue>;
  year: number;
  page: number;
  pageSize: number;
  toolbarProps: Omit<AnnualBillsToolbarProps, "mode">;
  mode: "embedded" | "fullscreen";
  hasAnyRows: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
      <AnnualBillsToolbar {...toolbarProps} mode={mode} />

      {!hasAnyRows ? (
        <TableEmptyState
          icon={ScrollText}
          title="Belum ada household pada matriks ini"
          description="Coba ubah filter atau generate tagihan tahunan lebih dulu."
        />
      ) : null}

      {hasAnyRows ? (
        <Tabs value={activeTab.key} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-slate-100 p-2">
            {tabs.map((tab) => {
              const href = `${PATHNAME}${buildQueryString(currentSearchParams, {
                tabRegion: tab.key === "all" ? undefined : tab.key,
                page: undefined,
              })}`;

              return (
                <TabsTrigger key={tab.key} value={tab.key} asChild className="px-3 py-2">
                  <TableLoadingLink href={href} scroll={false}>
                    <span>{tab.label}</span>
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-700">
                      {tab.totalHouseholds}
                    </span>
                  </TableLoadingLink>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab.key} className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <div className={mode === "fullscreen" ? "min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto" : "overflow-x-auto"}>
              {rows.length === 0 ? (
                <TableEmptyState
                  icon={ScrollText}
                  title={`Belum ada keluarga pada tab ${activeTab.label}`}
                  description="Coba ubah pencarian, filter, atau pilih wilayah lain."
                />
              ) : (
                <MatrixTable
                  rows={rows}
                  currentSearchParams={currentSearchParams}
                  year={year}
                  stickyCellClassName="bg-white"
                  containerClassName={mode === "fullscreen" ? "h-full min-w-max overflow-visible" : "overflow-x-auto"}
                />
              )}
            </div>

            <TablePagination
              pathname={PATHNAME}
              searchParams={currentSearchParams}
              totalItems={totalItems}
              page={page}
              pageSize={pageSize}
              itemLabel="keluarga"
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function MatrixTable({
  rows,
  currentSearchParams,
  year,
  stickyCellClassName,
  containerClassName,
}: {
  rows: AnnualBillsMatrixRow[];
  currentSearchParams: Record<string, QueryValue>;
  year: number;
  stickyCellClassName: string;
  containerClassName: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className={containerClassName}>
        <table className="min-w-[1500px] text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className={`sticky left-0 z-20 min-w-[240px] px-3 py-3 ${stickyCellClassName}`}>Jamaah</th>
              <th className={`sticky left-[240px] z-20 min-w-[180px] px-3 py-3 ${stickyCellClassName}`}>Wilayah</th>
              {CONTRIBUTION_MONTH_LABELS.map((label) => (
                <th key={label} className="min-w-[120px] px-3 py-3 text-center">
                  {label} {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.householdId} className="border-b border-slate-100 align-top">
                <td className={`sticky left-0 z-10 px-3 py-4 ${stickyCellClassName}`}>
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.code}</p>
                </td>
                <td className={`sticky left-[240px] z-10 px-3 py-4 text-slate-600 ${stickyCellClassName}`}>
                  {row.regionName ?? "-"}
                </td>
                {row.months.map((cell, index) => (
                  <td key={`${row.householdId}-${index + 1}`} className="px-3 py-4">
                    {cell ? (
                      <MatrixCell
                        cell={cell}
                        currentSearchParams={currentSearchParams}
                      />
                    ) : (
                      <EmptyMatrixCell
                        householdId={row.householdId}
                        year={year}
                        month={index + 1}
                        currentSearchParams={currentSearchParams}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

function EmptyMatrixCell({
  householdId,
  year,
  month,
  currentSearchParams,
}: {
  householdId: string;
  year: number;
  month: number;
  currentSearchParams: Record<string, QueryValue>;
}) {
  const redirectTo = `${PATHNAME}${buildQueryString(currentSearchParams, {})}`;

  return (
    <div className="flex min-h-[112px] flex-col rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-2 py-2.5 text-center">
      <div className="flex-1">
        <p className="text-[10px] text-slate-400">Tagihan belum dibuat</p>
      </div>
      <div className="mt-1.5 flex justify-center">
        <BillCellGenerateButton
          householdId={householdId}
          year={year}
          month={month}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}

function MatrixCell({
  cell,
  currentSearchParams,
}: {
  cell: AnnualBillsMatrixRow["months"][number];
  currentSearchParams: Record<string, QueryValue>;
}) {
  if (!cell) return null;

  const showPayAction =
    cell.status === "BELUM_BAYAR" || cell.status === "SEBAGIAN";
  const redirectTo = `${PATHNAME}${buildQueryString(currentSearchParams, {})}`;

  return (
    <div className="relative flex min-h-[112px] flex-col rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-center transition-colors hover:border-slate-300 hover:bg-slate-50/40">
      <div className="absolute right-1.5 top-1.5">
        <StatusCornerIcon status={cell.status} />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex w-full flex-col items-center rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              aria-label="Lihat detail tagihan"
            >
              <p className="text-xs font-semibold text-slate-900">
                {formatRupiah(cell.amountDue)}
              </p>
              {cell.draftPaymentCount > 0 ? (
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-sky-700">
                  Draft
                </p>
              ) : new Decimal(cell.outstandingAmount).gt(0) ? (
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-amber-700">
                  Belum lunas
                </p>
              ) : (
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                  Detail
                </p>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] px-3 py-2 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                Tagihan {formatRupiah(cell.amountDue)}
              </p>
              <p className="text-slate-600">
                Dibayar {formatRupiah(cell.paidAmount)}
              </p>
              {new Decimal(cell.outstandingAmount).gt(0) ? (
                <p className="text-amber-700">
                  Sisa {formatRupiah(cell.outstandingAmount)}
                </p>
              ) : null}
              {cell.draftPaymentCount > 0 ? (
                <p className="text-sky-700">
                  Ada {cell.draftPaymentCount} pembayaran draft
                </p>
              ) : null}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-1">
        {cell.latestDraftPaymentId ? (
          <>
            <Link
              href={`/iuran/pembayaran/${cell.latestDraftPaymentId}/edit`}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-1 text-[9px] font-semibold text-sky-800 hover:bg-sky-100"
            >
              <PencilLine className="h-3 w-3" />
              Ubah
            </Link>
            <PaymentActionButton
              paymentId={cell.latestDraftPaymentId}
              action={cancelPaymentAction}
              label="Batalkan draft"
              loadingLabel="Memproses..."
              confirmation="Batalkan pembayaran draft ini?"
              icon={<XCircle className="h-3 w-3" aria-hidden="true" />}
              className="rounded-md border border-red-300 px-1.5 py-1 text-[9px] font-medium text-red-600"
            />
          </>
        ) : null}
        {showPayAction && !cell.latestDraftPaymentId ? (
          <BillPaymentModal
            redirectTo={redirectTo}
            bill={{
              id: cell.billId,
              amountDue: cell.amountDue,
              household: {
                code: cell.householdCode ?? "",
                headName: cell.householdName ?? "",
              },
              month: cell.month,
              year: cell.year,
            }}
            trigger={
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-800 hover:bg-emerald-100"
              >
                Bayar
              </button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function StatusCornerIcon({ status }: { status: BillStatus }) {
  switch (status) {
    case BillStatus.LUNAS:
      return (
        <span aria-label="Lunas" title="Lunas">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </span>
      );
    case BillStatus.SEBAGIAN:
      return (
        <span aria-label="Dibayar sebagian" title="Dibayar sebagian">
          <CircleDashed className="h-4 w-4 text-amber-600" />
        </span>
      );
    case BillStatus.DIBEBASKAN:
      return (
        <span aria-label="Dibebaskan" title="Dibebaskan">
          <ShieldMinus className="h-4 w-4 text-sky-600" />
        </span>
      );
    case BillStatus.DIBATALKAN:
      return (
        <span aria-label="Dibatalkan" title="Dibatalkan">
          <XCircle className="h-4 w-4 text-rose-600" />
        </span>
      );
    case BillStatus.BELUM_BAYAR:
    default:
      return (
        <span aria-label="Belum lunas" title="Belum lunas">
          <CircleDashed className="h-4 w-4 text-slate-400" />
        </span>
      );
  }
}
