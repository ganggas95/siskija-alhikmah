import { BillStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBillStatusLabel } from "@/modules/contributions/annual-bills";

const statusClasses: Record<BillStatus, string> = {
  BELUM_BAYAR: "border-slate-200 bg-slate-100 text-slate-700",
  SEBAGIAN: "border-amber-200 bg-amber-50 text-amber-800",
  LUNAS: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DIBEBASKAN: "border-sky-200 bg-sky-50 text-sky-800",
  DIBATALKAN: "border-rose-200 bg-rose-50 text-rose-800",
};

export function BillStatusBadge({
  status,
  className,
}: {
  status: BillStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("justify-center font-semibold", statusClasses[status], className)}
    >
      {getBillStatusLabel(status)}
    </Badge>
  );
}
