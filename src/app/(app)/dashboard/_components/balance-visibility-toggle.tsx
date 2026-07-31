"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type BalanceVisibilityToggleProps = {
  value: string;
};

export function BalanceVisibilityToggle({ value }: BalanceVisibilityToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-3">
      <p
        className="text-3xl font-semibold leading-tight"
        aria-live="polite"
        aria-label={visible ? `Saldo ${value}` : "Saldo disembunyikan"}
      >
        {visible ? value : "Rp ••••••"}
      </p>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Sembunyikan saldo" : "Tampilkan saldo"}
        aria-pressed={!visible}
        title={visible ? "Sembunyikan saldo" : "Tampilkan saldo"}
        className="rounded-lg p-2 text-green-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Eye aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
