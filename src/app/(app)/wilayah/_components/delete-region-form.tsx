"use client";

import { useActionState, useEffect, useRef } from "react";

import { LoadingButton } from "@/components/form/loading-button";
import { ActionLabel } from "@/components/ui/action-label";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { deleteRegionAction } from "../actions";

type DeleteRegionFormProps = {
  regionId: string;
};

export function DeleteRegionForm({ regionId }: DeleteRegionFormProps) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, pending] = useActionState(
    async (_previousState: ActionResult | null, formData: FormData) =>
      deleteRegionAction(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (result.success) {
      formRef.current?.reset();
    }
  }, [result, showToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-busy={pending}
      onSubmit={(event) => {
        if (!window.confirm("Hapus wilayah ini?")) {
          event.preventDefault();
          return;
        }
      }}
    >
      <input type="hidden" name="id" value={regionId} />
      <LoadingButton
        type="submit"
        loading={pending}
        loadingLabel="Menghapus..."
        variant="link"
        className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ActionLabel action="delete">Hapus</ActionLabel>
      </LoadingButton>
    </form>
  );
}
