"use client";

import { ExpenseStatus, PaymentMethod } from "@prisma/client";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { FormActions } from "@/components/form/form-actions";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { createExpenseAction, updateExpenseAction } from "../actions";

type CategoryOption = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  redirectTo?: string;
  defaultValues?: {
    id?: string;
    transactionDate?: Date;
    categoryId?: string;
    payeeName?: string;
    amount?: string;
    method?: PaymentMethod;
    description?: string | null;
    status?: ExpenseStatus;
  };
};

function toDateInputValue(value?: Date) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function ExpenseForm({
  mode,
  categories,
  redirectTo = mode === "create" ? "/kas-keluar/tambah" : "/kas-keluar",
  defaultValues,
}: ExpenseFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction] = useActionState(
    async (_: ActionResult, formData: FormData) =>
      mode === "create"
        ? createExpenseAction(formData)
        : updateExpenseAction(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (!result.success) return;
    formRef.current?.reset();
    if (result.redirectTo && result.redirectTo !== pathname) {
      router.push(result.redirectTo);
    }
  }, [pathname, result, router, showToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Tambah Pengeluaran" : "Edit Kas Keluar"}
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

        <Field
          label="Penerima"
          name="payeeName"
          required
          defaultValue={defaultValues?.payeeName}
        />
        <Field
          label="Nominal"
          name="amount"
          type="number"
          required
          defaultValue={defaultValues?.amount}
        />

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
            defaultValue={defaultValues?.status ?? ExpenseStatus.DRAFT}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value={ExpenseStatus.DRAFT}>DRAFT</option>
            <option value={ExpenseStatus.PENDING_VERIFICATION}>
              PENDING_VERIFICATION
            </option>
            <option value={ExpenseStatus.VERIFIED}>VERIFIED</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Deskripsi
          </label>
          <textarea
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            rows={3}
          />
        </div>

        <FormActions
          cancelHref={"/kas-keluar"}
          submitLabel={
            mode === "create" ? "Simpan Pengeluaran" : "Simpan Perubahan"
          }
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
