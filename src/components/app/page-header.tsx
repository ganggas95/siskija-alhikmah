import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

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
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="rounded-2xl bg-green-50 p-2.5 text-green-800 sm:p-3">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
            <p className="max-w-2xl text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
