import { HouseholdStatus } from "@prisma/client";

import { FormActions } from "@/components/form/form-actions";

type RegionOption = {
  id: string;
  name: string;
};

type HouseholdFormProps = {
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
  regions: RegionOption[];
  redirectTo?: string;
  defaultValues?: {
    id?: string;
    headName?: string;
    address?: string | null;
    rt?: string | null;
    rw?: string | null;
    regionId?: string | null;
    status?: HouseholdStatus;
    isDisabled?: boolean;
    isElderly?: boolean;
    notes?: string | null;
  };
};

export function HouseholdForm({
  action,
  mode,
  regions,
  redirectTo = mode === "create" ? "/jamaah/tambah" : "/jamaah",
  defaultValues,
}: HouseholdFormProps) {
  return (
    <form action={action} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <h3 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Tambah Kepala Keluarga" : "Edit Data Jamaah"}
      </h3>

      <div className="mt-4 space-y-4">
        <Field label="Nama Kepala Keluarga" name="headName" required defaultValue={defaultValues?.headName} />
        <Field label="Alamat" name="address" defaultValue={defaultValues?.address} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="RT" name="rt" defaultValue={defaultValues?.rt} />
          <Field label="RW" name="rw" defaultValue={defaultValues?.rw} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Wilayah</label>
          <select
            name="regionId"
            defaultValue={defaultValues?.regionId ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Pilih wilayah</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {mode === "edit" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                defaultValue={defaultValues?.status ?? HouseholdStatus.ACTIVE}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value={HouseholdStatus.ACTIVE}>Aktif</option>
                <option value={HouseholdStatus.INACTIVE}>Nonaktif</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isDisabled"
                  value="true"
                  defaultChecked={Boolean(defaultValues?.isDisabled)}
                />
                Disabilitas
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isElderly"
                  value="true"
                  defaultChecked={Boolean(defaultValues?.isElderly)}
                />
                Lansia
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Catatan</label>
              <textarea
                name="notes"
                defaultValue={defaultValues?.notes ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                rows={4}
              />
            </div>
          </>
        ) : null}

        <FormActions
          cancelHref={redirectTo}
          submitLabel={mode === "create" ? "Simpan Jamaah" : "Simpan Perubahan"}
        />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />
    </div>
  );
}
