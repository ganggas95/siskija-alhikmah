"use client";

import { PaymentMethod } from "@prisma/client";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { FormActions } from "@/components/form/form-actions";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ActionLabel } from "@/components/ui/action-label";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { recordPaymentAction, updateDraftPaymentAction } from "../actions";

type BillOption = {
  id: string;
  amountDue: string;
  household: {
    code: string;
    headName: string;
  };
  month: number;
  year: number;
};

type PaymentFormProps = {
  bills: BillOption[];
  initialBillId?: string;
  redirectTo?: string;
  initialBillId?: string;
  paymentId?: string;
  defaultValues?: {
    paymentDate: string;
    amountPaid: string;
    method: PaymentMethod;
    notes: string;
  };
  mode?: "create" | "edit-draft";
  variant?: "card" | "plain";
  lockBillSelection?: boolean;
  onSuccess?: () => void;
};

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function PaymentForm({
  bills,
  initialBillId,
  redirectTo = "/iuran/pembayaran/tambah",
  initialBillId,
  paymentId,
  defaultValues,
  mode = "create",
  variant = "card",
  lockBillSelection = false,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction] = useActionState(
    async (_: ActionResult, formData: FormData) =>
      mode === "edit-draft"
        ? updateDraftPaymentAction(formData)
        : recordPaymentAction(formData),
    null,
  );
  const [selectedBillId, setSelectedBillId] = useState(initialBillId ?? "");
  const selectedBill = useMemo(
    () => bills.find((bill) => bill.id === selectedBillId) ?? null,
    [bills, selectedBillId],
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (!result.success) return;
    formRef.current?.reset();
    onSuccess?.();
    if (result.redirectTo && result.redirectTo !== pathname) {
      router.push(result.redirectTo);
    }
  }, [onSuccess, pathname, result, router, showToast]);

  const isCard = variant === "card";
  const shouldLockBillSelection = mode === "edit-draft" || lockBillSelection;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={
        isCard
          ? "rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
          : "grid gap-4"
      }
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {paymentId ? <input type="hidden" name="paymentId" value={paymentId} /> : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "edit-draft" ? "Ubah Pembayaran Draft" : "Input Pembayaran"}
      </h3>

      <div className="mt-4 space-y-4">
        {selectedBill ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Tagihan terpilih: <span className="font-semibold">{selectedBill.household.code}</span> — {selectedBill.household.headName} untuk {String(selectedBill.month).padStart(2, "0")}/{selectedBill.year}.
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tagihan</label>
          <select
            id="bill-select"
            name="billId"
            defaultValue={initialBillId ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
            defaultValue={initialBillId}
            disabled={shouldLockBillSelection}
            onChange={(e) => {
              setSelectedBillId(e.currentTarget.value);
            }}
          >
            <option value="">Pilih tagihan</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.household.code} - {bill.household.headName} ({bill.month}/
                {bill.year})
              </option>
            ))}
          </select>
          {shouldLockBillSelection && initialBillId ? (
            <input type="hidden" name="billId" value={initialBillId} />
          ) : null}
          {selectedBill ? (
            <button
              type="button"
              id="bill-amount-btn"
              className="text-xs text-slate-500 hover:text-emerald-700"
              onClick={() => {
                const amountInput = document.getElementById(
                  "amount-input",
                ) as HTMLInputElement;
                if (amountInput) {
                  amountInput.value = selectedBill.amountDue;
                  amountInput.setCustomValidity("");
                }
              }}
            >
              Isi nominal tagihan:{" "}
              <span
                id="bill-amount-display"
                className="font-semibold text-emerald-600"
              >
                Rp{Number(selectedBill.amountDue).toLocaleString("id-ID")}
              </span>
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Tanggal Bayar
          </label>
          <input
            type="date"
            name="paymentDate"
            required
            defaultValue={defaultValues?.paymentDate ?? toDateInputValue(new Date())}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Nominal Dibayar
          </label>
          <input
            id="amount-input"
            type="number"
            name="amountPaid"
            required
            min={1}
            defaultValue={defaultValues?.amountPaid}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            data-amount-due={selectedBill?.amountDue ?? ""}
            onInput={(e) =>
              (e.currentTarget as HTMLInputElement).setCustomValidity("")
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Metode Pembayaran
          </label>
          <select
            name="method"
            defaultValue={defaultValues?.method ?? PaymentMethod.CASH}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
          >
            {Object.values(PaymentMethod).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Catatan</label>
          <textarea
            name="notes"
            defaultValue={defaultValues?.notes}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            rows={3}
          />
        </div>

        {isCard ? (
          <FormActions
            cancelHref={"/iuran/pembayaran/"}
            submitLabel={mode === "edit-draft" ? "Simpan Perubahan Draft" : "Simpan Pembayaran"}
          />
        ) : (
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <ActionLabel action="cancel">Batalkan</ActionLabel>
              </Button>
            </DialogClose>
            <SubmitButton pendingLabel="Menyimpan..." className="w-full sm:w-auto">
              <ActionLabel action="submit">
                {mode === "edit-draft" ? "Simpan Perubahan Draft" : "Simpan Pembayaran"}
              </ActionLabel>
            </SubmitButton>
          </div>
        )}
      </div>
    </form>
  );
}
