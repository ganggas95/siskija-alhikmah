import { PaymentMethod } from "@prisma/client";

import { FormActions } from "@/components/form/form-actions";

type BillOption = {
  id: string;
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
    <form action={action} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h3 className="text-lg font-semibold text-slate-900">Input Pembayaran</h3>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tagihan</label>
          <select
            name="billId"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
          >
            <option value="">Pilih tagihan</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.household.code} - {bill.household.headName} ({bill.month}/{bill.year})
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Tanggal Bayar"
          name="paymentDate"
          type="date"
          required
          defaultValue={toDateInputValue(new Date())}
        />
        <Field label="Nominal Dibayar" name="amountPaid" type="number" required />

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

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />
    </div>
  );
}
