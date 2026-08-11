"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { generateSingleBillAction } from "../actions";

export function BillCellGenerateButton({
  householdId,
  year,
  month,
  redirectTo,
}: {
  householdId: string;
  year: number;
  month: number;
  redirectTo: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, pending] = useActionState(
    async (_previous: ActionResult, formData: FormData) =>
      generateSingleBillAction(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (result.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [result, router, showToast]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
      >
        {pending ? "Membuat..." : "Buat tagihan"}
      </button>
    </form>
  );
}
