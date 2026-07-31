"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

import { SubmitButton } from "@/components/form/submit-button";
import { ActionLabel } from "@/components/ui/action-label";
import { cn } from "@/lib/utils";

type FormActionsProps = {
  cancelHref: string;
  submitLabel: string;
};

export function FormActions({
  cancelHref,
  submitLabel,
}: FormActionsProps) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
      <Link
        href={cancelHref}
        tabIndex={pending ? -1 : 0}
        aria-disabled={pending}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground",
          pending && "pointer-events-none opacity-50",
        )}
      >
        <ActionLabel action="cancel">Batalkan</ActionLabel>
        </Link>
      <SubmitButton pendingLabel="Menyimpan..." className="w-full sm:w-auto">
        <ActionLabel action="submit">{submitLabel}</ActionLabel>
      </SubmitButton>
    </div>
  );
}
