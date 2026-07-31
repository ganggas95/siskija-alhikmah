"use client";

import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type LoadingButtonProps = Omit<ButtonProps, "children"> & {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export function LoadingButton({
  children,
  loading = false,
  loadingLabel = "Memproses...",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? loadingLabel : children}
    </Button>
  );
}
