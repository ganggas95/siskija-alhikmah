"use client";

import { LoadingIndicator } from "@/components/app/loading-indicator";
import { cn } from "@/lib/utils";

type TableLoadingOverlayProps = {
  label?: string;
  className?: string;
};

export function TableLoadingOverlay({
  label = "Memuat data terbaru...",
  className,
}: TableLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-[1px]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <LoadingIndicator label={label} />
      </div>
    </div>
  );
}
