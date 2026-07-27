import Link from "next/link";

type FormActionsProps = {
  cancelHref: string;
  submitLabel: string;
};

export function FormActions({
  cancelHref,
  submitLabel,
}: FormActionsProps) {
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
      <Link
        href={cancelHref}
        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Batalkan
      </Link>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        {submitLabel}
      </button>
    </div>
  );
}
