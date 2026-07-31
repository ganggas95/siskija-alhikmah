"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import { LoadingButton } from "@/components/form/loading-button";
import type { ActionResult } from "@/lib/action-result";
import { deletePaymentAction } from "../actions";

type DeletePaymentFormProps = {
  paymentId: string;
  className?: string;
};

export function DeletePaymentForm({
  paymentId,
  className,
}: DeletePaymentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, pending] = useActionState(
    async (_previousState: ActionResult | null, formData: FormData) =>
      deletePaymentAction(formData),
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
        if (!window.confirm("Hapus pembayaran ini?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={paymentId} />
      <LoadingButton
        disabled={pending}
        loading={pending}
        loadingLabel="Menghapus..."
        className={className ?? "text-sm font-medium text-red-600"}
      >
        Hapus
      </LoadingButton>
    </form>
  );
}
