"use client";

import { useState } from "react";

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
          onSubmit={() => setSubmitting(true)}
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
            <Button type="submit" disabled={submitting}>
              <ActionLabel action="submit">
                {submitting ? "Menerapkan..." : submitLabel}
              </ActionLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
