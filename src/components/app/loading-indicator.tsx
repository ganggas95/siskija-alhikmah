"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingIndicatorProps = {
  label?: ReactNode;
  srLabel?: string;
  className?: string;
  spinnerClassName?: string;
  labelClassName?: string;
};

export function LoadingIndicator({
  label = "Memproses...",
  srLabel = "Sedang memproses permintaan",
  className,
  spinnerClassName,
  labelClassName,
}: LoadingIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2
        className={cn("h-4 w-4 animate-spin", spinnerClassName)}
        aria-hidden="true"
      />
      {label ? <span className={labelClassName}>{label}</span> : null}
      <span className="sr-only">{srLabel}</span>
    </span>
  );
}
