import { FormActions } from "@/components/form/form-actions";

type RegionFormProps = {
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
  redirectTo?: string;
  defaultValues?: {
    id?: string;
    name?: string;
    description?: string | null;
    isActive?: boolean;
  };
};

export function RegionForm({
  action,
  mode,
  redirectTo = "/wilayah",
  defaultValues,
}: RegionFormProps) {
  return (
    <form action={action} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Tambah Wilayah" : "Edit Wilayah"}
      </h3>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nama Wilayah</label>
          <input
            name="name"
            defaultValue={defaultValues?.name ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Keterangan</label>
          <textarea
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            rows={4}
          />
        </div>

        {mode === "edit" ? (
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
        ) : null}

        <FormActions
          cancelHref={redirectTo}
          submitLabel={mode === "create" ? "Simpan Wilayah" : "Simpan Perubahan"}
        />
      </div>
    </form>
  );
}
