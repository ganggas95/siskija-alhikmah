"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { LoadingButton } from "@/components/form/loading-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

type PaymentAction = (formData: FormData) => Promise<ActionResult>;

export function PaymentActionButton({
  paymentId,
  action,
  label,
  loadingLabel,
  className,
  confirmation,
  icon,
}: {
  paymentId: string;
  action: PaymentAction;
  label: string;
  loadingLabel: string;
  className: string;
  confirmation: string;
  icon: ReactNode;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [result, formAction, pending] = useActionState(
    async (_previous: ActionResult, formData: FormData) => action(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (result.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [result, router, showToast]);

  return (
    <>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="paymentId" value={paymentId} />
        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            disabled={pending}
            className={`inline-flex items-center gap-1.5 ${className}`}
          >
            {icon}
            {label}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi {label}</DialogTitle>
              <DialogDescription>{confirmation}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Batal
              </Button>
              <LoadingButton
                type="button"
                loading={pending}
                loadingLabel={loadingLabel}
                className={`inline-flex items-center gap-1.5 ${className}`}
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                {icon}
                {label}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </>
  );
}
