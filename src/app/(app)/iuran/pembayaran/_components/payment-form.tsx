"use client";

import { PaymentMethod } from "@prisma/client";

import { FormActions } from "@/components/form/form-actions";

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
  action: (formData: FormData) => Promise<void>;
  bills: BillOption[];
  redirectTo?: string;
};

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function PaymentForm({
  action,
  bills,
  redirectTo = "/iuran/pembayaran",
}: PaymentFormProps) {
  return (
    <form
      action={action}
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const billSelect = form.elements.namedItem("billId") as HTMLSelectElement;
        const amountInput = form.elements.namedItem("amountPaid") as HTMLInputElement;
        const selected = bills.find((b: BillOption) => b.id === billSelect.value);
        if (selected && Number(amountInput.value) < Number(selected.amountDue)) {
          e.preventDefault();
          amountInput.setCustomValidity(
            `Nominal dibayar minimal Rp${Number(selected.amountDue).toLocaleString("id-ID")}`,
          );
          amountInput.reportValidity();
        }
      }}
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h3 className="text-lg font-semibold text-slate-900">Input Pembayaran</h3>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tagihan</label>
          <select
            id="bill-select"
            name="billId"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
            onChange={(e) => {
              const select = e.currentTarget;
              const btn = document.getElementById("bill-amount-btn");
              const display = document.getElementById("bill-amount-display");
              const amountInput = document.getElementById("amount-input") as HTMLInputElement;
              const data = bills.find((b: BillOption) => b.id === select.value);
              if (btn && data) {
                btn.classList.remove("hidden");
              }
              if (display && data) {
                display.textContent = `Rp${Number(data.amountDue).toLocaleString("id-ID")}`;
              }
              if (amountInput) {
                amountInput.setCustomValidity("");
                amountInput.dataset.amountDue = data ? data.amountDue : "";
              }
            }}
          >
            <option value="">Pilih tagihan</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.household.code} - {bill.household.headName} ({bill.month}/{bill.year})
              </option>
            ))}
          </select>
          <button
            type="button"
            id="bill-amount-btn"
            className="hidden text-xs text-slate-500 hover:text-emerald-700"
            onClick={() => {
              const amountInput = document.getElementById("amount-input") as HTMLInputElement;
              if (amountInput) {
                amountInput.value = amountInput.dataset.amountDue ?? "";
                amountInput.setCustomValidity("");
              }
            }}
          >
            Isi nominal tagihan: <span id="bill-amount-display" className="font-semibold text-emerald-600">—</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tanggal Bayar</label>
          <input
            type="date"
            name="paymentDate"
            required
            defaultValue={toDateInputValue(new Date())}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nominal Dibayar</label>
          <input
            id="amount-input"
            type="number"
            name="amountPaid"
            required
            min={1}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Metode Pembayaran</label>
          <select
            name="method"
            defaultValue={PaymentMethod.CASH}
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            rows={3}
          />
        </div>

        <FormActions cancelHref={redirectTo} submitLabel="Simpan Pembayaran" />
      </div>
    </form>
  );
}


