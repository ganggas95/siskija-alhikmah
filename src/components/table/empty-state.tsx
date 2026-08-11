import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type TableEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export function TableEmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: TableEmptyStateProps) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
      <span className="rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold text-slate-700">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}
