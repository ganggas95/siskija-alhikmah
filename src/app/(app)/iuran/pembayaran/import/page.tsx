import { ArrowUpCircle, FileSpreadsheet } from "lucide-react";
import { PermissionKey } from "@prisma/client";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { requirePermission } from "@/lib/rbac";
import { ImportContributionForm } from "./_components/import-contribution-form";

export default async function ImportContributionPaymentsPage() {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Import Iuran Excel"
        description="Impor file Excel iuran tahunan dengan alokasi nominal otomatis ke bulan berikutnya."
        icon={FileSpreadsheet}
      />

      <div className="max-w-6xl">
        <ImportContributionForm />
      </div>

      <div>
        <Link
          href="/iuran/pembayaran"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Kembali ke Pembayaran
        </Link>
      </div>
    </section>
  );
}

