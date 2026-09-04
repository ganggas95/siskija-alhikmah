"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LoadingButton } from "@/components/form/loading-button";
import { useTableLoadingState } from "@/components/table/table-loading-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ActionLabel } from "@/components/ui/action-label";

type TableFilterModalProps = {
  title: string;
  description?: string;
  action?: string;
  submitLabel?: string;
  activeCount?: number;
  children: React.ReactNode;
};

export function TableFilterModal({
  title,
  description,
  action,
  submitLabel = "Terapkan Filter",
  activeCount = 0,
  children,
}: TableFilterModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tableLoading = useTableLoadingState();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <ActionLabel action="filter">Filter</ActionLabel>
          {activeCount > 0 ? <Badge variant="secondary">{activeCount}</Badge> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          action={action}
          className="space-y-5"
          aria-busy={submitting}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitting(true);

            const formData = new FormData(event.currentTarget);
            const params = new URLSearchParams();

            for (const [key, value] of formData.entries()) {
              if (typeof value !== "string") continue;
              const trimmedValue = value.trim();
              if (!trimmedValue || trimmedValue === "all") continue;
              params.append(key, trimmedValue);
            }

            const actionPath = action || pathname;
            const href = `${actionPath}${params.toString() ? `?${params.toString()}` : ""}`;
            tableLoading?.startLoading(href);
            setOpen(false);
            router.push(href, { scroll: false });
          }}
        >
          <div className="grid gap-4">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              <ActionLabel action="cancel">Batal</ActionLabel>
            </Button>
            <LoadingButton type="submit" loading={submitting} loadingLabel="Menerapkan...">
              <ActionLabel action="submit">{submitLabel}</ActionLabel>
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
