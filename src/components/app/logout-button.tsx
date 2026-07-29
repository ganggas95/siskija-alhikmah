"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

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
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        onClick?.();
        await signOut({ callbackUrl: "/login" });
      }}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
