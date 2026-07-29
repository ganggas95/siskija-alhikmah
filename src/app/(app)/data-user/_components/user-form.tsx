"use client";

import { AppRoleKey } from "@prisma/client";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { FormActions } from "@/components/form/form-actions";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { roleOptions } from "@/lib/user-role";
import { createUserAction, updateUserAction } from "../actions";

type UserFormProps = {
  mode: "create" | "edit";
  redirectTo?: string;
  defaultValues?: {
    id?: string;
    name?: string;
    email?: string;
    role?: AppRoleKey;
    isActive?: boolean;
  };
};

export function UserForm({
  mode,
  redirectTo = mode === "create" ? "/data-user/tambah" : "/data-user",
  defaultValues,
}: UserFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction] = useActionState(
    async (_: ActionResult, formData: FormData) =>
      mode === "create"
        ? createUserAction(formData)
        : updateUserAction(formData),
    null,
  );

  useEffect(() => {
    if (!result) return;
    showToast(result.success ? "success" : "error", result.message);
    if (!result.success) return;
    formRef.current?.reset();
    if (result.redirectTo && result.redirectTo !== pathname) {
      router.push(result.redirectTo);
    }
  }, [pathname, result, router, showToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Tambah User" : "Edit User"}
      </h3>

      <div className="mt-4 space-y-4">
        <Field
          label="Nama User"
          name="name"
          defaultValue={defaultValues?.name}
          required
          readOnly={mode === "edit"}
        />

        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          required
          readOnly={mode === "edit"}
        />

        {mode === "create" ? (
          <Field
            label="Password Awal"
            name="password"
            type="password"
            required
            helperText="Minimal 8 karakter."
          />
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Pada mode edit, hanya <strong>status</strong> dan{" "}
            <strong>role</strong> yang dapat diubah.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Role</label>
          <select
            name="role"
            defaultValue={defaultValues?.role ?? AppRoleKey.TREASURER}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="isActive"
            defaultValue={defaultValues?.isActive === false ? "false" : "true"}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>

        <FormActions
          cancelHref={"/data-user"}
          submitLabel={mode === "create" ? "Simpan User" : "Simpan Perubahan"}
        />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  readOnly = false,
  helperText,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        readOnly={readOnly}
        className={`w-full rounded-xl border px-4 py-3 text-sm ${
          readOnly
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-300"
        }`}
      />
      {helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
