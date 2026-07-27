import { FormActions } from "@/components/form/form-actions";

type GenerateBillsFormProps = {
  action: (formData: FormData) => Promise<void>;
  redirectTo?: string;
};

export function GenerateBillsForm({
  action,
  redirectTo = "/iuran/tagihan",
}: GenerateBillsFormProps) {
  const now = new Date();

  return (
    <form action={action} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h3 className="text-lg font-semibold text-slate-900">Generate Tagihan</h3>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tahun</label>
            <input
              name="year"
              type="number"
              defaultValue={now.getFullYear()}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bulan</label>
            <input
              name="month"
              type="number"
              min={1}
              max={12}
              defaultValue={now.getMonth() + 1}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nominal Normal <span className="text-xs text-slate-500">(Rp)</span>
            </label>
            <input
              name="amountNormal"
              type="number"
              min={0}
              defaultValue={7000}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
            <p className="text-xs text-slate-500">
              Untuk jamaah tanpa status disabilitas/lansia
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nominal Disabilitas &amp; Lansia <span className="text-xs text-slate-500">(Rp)</span>
            </label>
            <input
              name="amountDiscounted"
              type="number"
              min={0}
              defaultValue={5000}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
            <p className="text-xs text-slate-500">
              Untuk jamaah dengan status disabilitas atau lansia
            </p>
          </div>
        </div>

        <FormActions cancelHref={redirectTo} submitLabel="Generate Tagihan" />
      </div>
    </form>
  );
}
