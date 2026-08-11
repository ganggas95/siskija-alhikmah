"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FormActions } from "@/components/form/form-actions";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { generateBillsAction } from "../actions";

type GenerateBillsFormProps = {
  redirectTo?: string;
  normalAmount?: string;
  specialAmount?: string;
};

export function GenerateBillsForm({
  redirectTo = "/iuran/tagihan",
  normalAmount = "0",
  specialAmount = "0",
}: GenerateBillsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction] = useActionState(
    async (_: ActionResult, formData: FormData) => generateBillsAction(formData),
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

  const now = new Date();

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h3 className="text-lg font-semibold text-slate-900">Generate Tagihan</h3>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tahun</label>
            <input
              name="year"
              type="number"
              defaultValue={now.getFullYear()}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bulan</label>
            <input
              name="month"
              type="number"
              min={1}
              max={12}
              defaultValue={now.getMonth() + 1}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nominal Normal <span className="text-xs text-slate-500">(Rp)</span>
            </label>
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900">Rp{new Intl.NumberFormat("id-ID").format(Number(normalAmount))}</p>
            <p className="text-xs text-slate-500">
              Untuk jamaah tanpa status disabilitas/lansia. Diambil dari pengaturan organisasi.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nominal Disabilitas &amp; Lansia <span className="text-xs text-slate-500">(Rp)</span>
            </label>
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900">Rp{new Intl.NumberFormat("id-ID").format(Number(specialAmount))}</p>
            <p className="text-xs text-slate-500">
              Untuk jamaah dengan status disabilitas atau lansia. Diambil dari pengaturan organisasi.
            </p>
          </div>
        </div>

        <FormActions cancelHref={redirectTo} submitLabel="Generate Tagihan" />
      </div>
    </form>
  );
}
