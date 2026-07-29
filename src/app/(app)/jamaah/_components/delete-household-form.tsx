"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { deleteHouseholdAction } from "../actions";

type DeleteHouseholdFormProps = {
  householdId: string;
  className?: string;
};

export function DeleteHouseholdForm({
  householdId,
  className,
}: DeleteHouseholdFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, pending] = useActionState(
    async (_previousState: ActionResult | null, formData: FormData) =>
      deleteHouseholdAction(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (!result.success) return;
    formRef.current?.reset();
    router.refresh();
  }, [result, router, showToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Hapus data jamaah ini?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={householdId} />
      <button
        type="submit"
        disabled={pending}
        className={className ?? "text-sm font-medium text-red-600"}
      >
        {pending ? "Menghapus..." : "Hapus"}
      </button>
    </form>
  );
}
