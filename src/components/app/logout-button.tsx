"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { LoadingButton } from "@/components/form/loading-button";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  onClick?: () => void;
};

export function LogoutButton({
  className,
  label = "Keluar",
  onClick,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingButton
      type="button"
      className={className}
      loading={loading}
      loadingLabel="Keluar..."
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        onClick?.();
        try {
          await signOut({ callbackUrl: "/login" });
        } finally {
          setLoading(false);
        }
      }}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </LoadingButton>
  );
}
