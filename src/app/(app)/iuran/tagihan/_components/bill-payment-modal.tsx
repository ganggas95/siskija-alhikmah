"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "../../pembayaran/_components/payment-form";

type BillPaymentModalProps = {
  trigger: React.ReactNode;
  bill: {
    id: string;
    amountDue: string;
    household: {
      code: string;
      headName: string;
    };
    month: number;
    year: number;
  };
  redirectTo: string;
};

export function BillPaymentModal({
  trigger,
  bill,
  redirectTo,
}: BillPaymentModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Input Pembayaran Iuran</DialogTitle>
          <DialogDescription>
            Tagihan sudah dipilih dari matriks tahunan. Anda hanya perlu mengisi detail pembayaran.
          </DialogDescription>
        </DialogHeader>
        <PaymentForm
          bills={[bill]}
          initialBillId={bill.id}
          redirectTo={redirectTo}
          variant="plain"
          lockBillSelection
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
