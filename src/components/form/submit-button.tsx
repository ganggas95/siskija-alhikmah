"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = Omit<ButtonProps, "type" | "children"> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  pending?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel = "Memproses...",
  pending: externalPending = false,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || externalPending;

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
