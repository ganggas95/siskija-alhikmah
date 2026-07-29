"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  showToast: (type: ToastType, message: string) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastRoot key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
        <ToastPrimitives.Viewport className="fixed inset-x-0 bottom-4 z-[99999] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 outline-none md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:mx-0" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

function ToastRoot({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const tone =
    toast.type === "success"
      ? "border-emerald-700/20 bg-emerald-800 text-white"
      : toast.type === "error"
        ? "border-red-700/20 bg-red-700 text-white"
        : "border-slate-700/20 bg-slate-800 text-white";

  const icon =
    toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ";

  return (
    <ToastPrimitives.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onDismiss(toast.id);
        }
      }}
      className={cn(
        "group pointer-events-auto flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-medium shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-2",
        tone,
      )}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
        {icon}
      </span>
      <ToastPrimitives.Description className="flex-1">
        {toast.message}
      </ToastPrimitives.Description>
      <ToastPrimitives.Close
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
