import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="rounded-2xl bg-green-50 p-2.5 text-green-800 sm:p-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
          <p className="max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </header>
  );
}
