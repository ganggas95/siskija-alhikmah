"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

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
import {
  approveSelectedPaymentsAction,
  cancelSelectedPaymentsAction,
} from "../actions";

export function PaymentBulkActions() {
  const { showToast } = useToast();
  const approveFormRef = useRef<HTMLFormElement>(null);
  const cancelFormRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [confirmationAction, setConfirmationAction] = useState<"approve" | "cancel" | null>(null);
  const [approveResult, approveAction, approvePending] = useActionState(
    async (_previous: ActionResult, formData: FormData) => approveSelectedPaymentsAction(formData),
    null,
  );
  const [cancelResult, cancelAction, cancelPending] = useActionState(
    async (_previous: ActionResult, formData: FormData) => cancelSelectedPaymentsAction(formData),
    null,
  );
  const lastApproveResult = useRef<ActionResult>(null);
  const lastCancelResult = useRef<ActionResult>(null);

  useEffect(() => {
    const updateSelectedCount = () => {
      setSelectedCount(
        document.querySelectorAll<HTMLInputElement>("input[data-payment-selection]:checked").length,
      );
    };

    document.addEventListener("change", updateSelectedCount);
    return () => document.removeEventListener("change", updateSelectedCount);
  }, []);

  useEffect(() => {
    if (!approveResult || approveResult === lastApproveResult.current) return;
    lastApproveResult.current = approveResult;
    showToast(approveResult.success ? "success" : "error", approveResult.message);
    if (approveResult.success) {
      approveFormRef.current?.reset();
      document.querySelectorAll<HTMLInputElement>("input[data-payment-selection]").forEach((checkbox) => {
        checkbox.checked = false;
      });
      document.dispatchEvent(new Event("change"));
    }
  }, [approveResult, showToast]);

  useEffect(() => {
    if (!cancelResult || cancelResult === lastCancelResult.current) return;
    lastCancelResult.current = cancelResult;
    showToast(cancelResult.success ? "success" : "error", cancelResult.message);
    if (cancelResult.success) {
      document.querySelectorAll<HTMLInputElement>("input[data-payment-selection]").forEach((checkbox) => {
        checkbox.checked = false;
      });
      document.dispatchEvent(new Event("change"));
    }
  }, [cancelResult, showToast]);

  function submitSelected(event: React.FormEvent<HTMLFormElement>, action: "approve" | "cancel") {
    const form = event.currentTarget;
    const selected = [...document.querySelectorAll<HTMLInputElement>("input[data-payment-selection]:checked")];
    form.querySelectorAll("input[name=paymentId]").forEach((input) => input.remove());
    selected.forEach((checkbox) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "paymentId";
      input.value = checkbox.value;
      form.appendChild(input);
    });

    if (!selected.length) {
      event.preventDefault();
      showToast("error", "Pilih minimal satu pembayaran.");
      return;
    }

    if (allowSubmitRef.current) {
      allowSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    setConfirmationAction(action);
  }

  function confirmSelectedAction() {
    const form = confirmationAction === "approve" ? approveFormRef.current : cancelFormRef.current;
    if (!form) return;

    allowSubmitRef.current = true;
    setConfirmationAction(null);
    form.requestSubmit();
  }

  const confirmationLabel = confirmationAction === "approve" ? "Approve" : "Batalkan";

  if (selectedCount < 2) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
        <span className="text-slate-600">{selectedCount} pembayaran dipilih.</span>
        <div className="flex gap-x-2">
          <form
            ref={approveFormRef}
            action={approveAction}
            onSubmit={(event) => submitSelected(event, "approve")}
          >
            <LoadingButton
              type="submit"
              loading={approvePending}
              loadingLabel="Memproses..."
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approve Terpilih
            </LoadingButton>
          </form>
          <form
            ref={cancelFormRef}
            action={cancelAction}
            onSubmit={(event) => submitSelected(event, "cancel")}
          >
            <LoadingButton
              type="submit"
              loading={cancelPending}
              loadingLabel="Memproses..."
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Batalkan Terpilih
            </LoadingButton>
          </form>
        </div>
      </div>
      <Dialog
        open={confirmationAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmationAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi {confirmationLabel}</DialogTitle>
            <DialogDescription>
              {confirmationLabel} {selectedCount} pembayaran terpilih?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmationAction(null)}>
              Batal
            </Button>
            <LoadingButton
              type="button"
              loading={confirmationAction === "approve" ? approvePending : cancelPending}
              loadingLabel="Memproses..."
              className={confirmationAction === "approve" ? "bg-green-800 text-white" : "border border-red-300 bg-white text-red-700"}
              onClick={confirmSelectedAction}
            >
              {confirmationAction === "approve" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
              {confirmationLabel}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
