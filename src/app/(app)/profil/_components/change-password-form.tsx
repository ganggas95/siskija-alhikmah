"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { changePasswordAction } from "@/app/(app)/profil/actions";
import { LoadingButton } from "@/components/form/loading-button";

const initialState = {} as {
  error?: string;
  success?: string;
};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-semibold text-slate-900">Ubah Password</h3>

      <div className="mt-4 space-y-4">
        <Field
          label="Password Saat Ini"
          name="currentPassword"
        />
        <Field
          label="Password Baru"
          name="newPassword"
          helperText="Gunakan minimal 8 karakter."
        />
        <Field
          label="Konfirmasi Password Baru"
          name="confirmPassword"
        />

        {state?.error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        {state?.success ? (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {state.success}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          loading={pending}
          loadingLabel="Memproses..."
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <KeyRound className="h-4 w-4" />
          Simpan Password Baru
        </LoadingButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  helperText,
}: {
  label: string;
  name: string;
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="password"
        name={name}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        required
      />
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}
