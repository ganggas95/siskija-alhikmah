"use client";

import type { ReactNode } from "react";

import { SubmitButton } from "@/components/form/submit-button";
import { ActionLabel } from "@/components/ui/action-label";

type ServerAction = (formData: FormData) => Promise<{ success: boolean }>;

type DeleteWithConfirmFormProps = {
  action: ServerAction;
  id: string;
  confirmMessage: string;
  buttonLabel?: string;
  pendingLabel?: string;
  buttonClassName?: string;
  redirectTo?: string;
  children?: ReactNode;
};

export function DeleteWithConfirmForm({
  action,
  id,
  confirmMessage,
  buttonLabel = "Hapus",
  pendingLabel = "Menghapus...",
  buttonClassName,
  redirectTo,
  children,
}: DeleteWithConfirmFormProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      {children ?? (
        <SubmitButton
          pendingLabel={pendingLabel}
          className={buttonClassName}
        >
          <ActionLabel action="delete">{buttonLabel}</ActionLabel>
        </SubmitButton>
      )}
    </form>
  );
}
