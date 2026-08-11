"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FormActions } from "@/components/form/form-actions";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ActionLabel } from "@/components/ui/action-label";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { generateBillsAction } from "../actions";

type GenerateBillsFormProps = {
  redirectTo?: string;
  normalAmount?: string;
  specialAmount?: string;
  variant?: "card" | "plain";
};

export function GenerateBillsForm({
  redirectTo = "/iuran/tagihan",
  normalAmount = "0",
  specialAmount = "0",
  variant = "card",
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
  const isCard = variant === "card";

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

      <h3 className="text-lg font-semibold text-slate-900">Generate Tagihan Tahunan</h3>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
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
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Sistem akan membuat tagihan Januari–Desember untuk seluruh jamaah aktif. Generate ulang pada tahun yang sama aman karena baris duplikat akan dilewati.
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

        {isCard ? (
          <FormActions cancelHref={redirectTo} submitLabel="Generate Tagihan Tahunan" />
        ) : (
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <ActionLabel action="cancel">Batalkan</ActionLabel>
              </Button>
            </DialogClose>
            <SubmitButton pendingLabel="Menyimpan..." className="w-full sm:w-auto">
              <ActionLabel action="submit">Generate Tagihan Tahunan</ActionLabel>
            </SubmitButton>
          </div>
        )}
      </div>
    </form>
  );
}
