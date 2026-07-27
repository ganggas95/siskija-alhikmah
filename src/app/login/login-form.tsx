"use client";

import { useActionState } from "react";
import { Lock, LogIn, Mail } from "lucide-react";

import { authenticate } from "@/app/login/actions";

export function LoginForm() {
  const [message, action, pending] = useActionState(authenticate, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="contoh@email.com"
            className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none ring-0 transition focus:border-green-700"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none ring-0 transition focus:border-green-700"
            required
          />
        </div>
      </div>
      {message ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <LogIn className="h-4 w-4" />
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
