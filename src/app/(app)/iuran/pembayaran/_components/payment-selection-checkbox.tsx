"use client";

export function PaymentSelectionCheckbox({
  paymentId,
  disabled = false,
  selectAll = false,
}: {
  paymentId?: string;
  disabled?: boolean;
  selectAll?: boolean;
}) {
  return (
    <input
      type="checkbox"
      value={paymentId}
      disabled={disabled}
      data-payment-selection={selectAll ? undefined : "true"}
      data-payment-select-all={selectAll ? "true" : undefined}
      aria-label={selectAll ? "Pilih semua pembayaran draft" : "Pilih pembayaran"}
      className="h-4 w-4 rounded border-slate-300 text-green-800 focus:ring-green-700"
      onChange={(event) => {
        if (!selectAll) return;
        document.querySelectorAll<HTMLInputElement>("input[data-payment-selection]").forEach((checkbox) => {
          checkbox.checked = event.currentTarget.checked;
        });
      }}
    />
  );
}
