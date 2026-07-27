import { IncomeStatus, PaymentMethod } from "@prisma/client";

import { FormActions } from "@/components/form/form-actions";

type CategoryOption = {
  id: string;
  name: string;
};

type IncomeFormProps = {
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
  categories: CategoryOption[];
  redirectTo?: string;
  defaultValues?: {
    id?: string;
    transactionDate?: Date;
    categoryId?: string;
    sourceName?: string;
    amount?: string;
    method?: PaymentMethod;
    description?: string | null;
    status?: IncomeStatus;
  };
};

function toDateInputValue(value?: Date) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function IncomeForm({
  action,
  mode,
  categories,
  redirectTo = "/kas-masuk",
  defaultValues,
}: IncomeFormProps) {
  return (
    <form action={action} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Tambah Kas Masuk" : "Edit Kas Masuk"}
      </h3>

      <div className="mt-4 space-y-4">
        <Field
          label="Tanggal"
          name="transactionDate"
          type="date"
          required
          defaultValue={toDateInputValue(defaultValues?.transactionDate)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Kategori</label>
          <select
            name="categoryId"
            defaultValue={defaultValues?.categoryId ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Sumber Pemasukan" name="sourceName" required defaultValue={defaultValues?.sourceName} />
        <Field label="Nominal" name="amount" type="number" required defaultValue={defaultValues?.amount} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Metode</label>
          <select
            name="method"
            defaultValue={defaultValues?.method ?? PaymentMethod.CASH}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            {Object.values(PaymentMethod).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={defaultValues?.status ?? IncomeStatus.DRAFT}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value={IncomeStatus.DRAFT}>DRAFT</option>
            <option value={IncomeStatus.VERIFIED}>VERIFIED</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            rows={3}
          />
        </div>

        <FormActions
          cancelHref={redirectTo}
          submitLabel={mode === "create" ? "Simpan Kas Masuk" : "Simpan Perubahan"}
        />
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
