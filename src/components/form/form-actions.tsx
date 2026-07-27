"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

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
        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:px-4"
        tabIndex={pending ? -1 : 0}
        aria-disabled={pending}
      >
        Batalkan
      </Link>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4"
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </div>
  );
}
