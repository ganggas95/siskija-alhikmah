"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";

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
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href={cancelHref} tabIndex={pending ? -1 : 0} aria-disabled={pending}>
        Batalkan
        </Link>
      </Button>
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}
