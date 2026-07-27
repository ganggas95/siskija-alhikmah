import { PermissionKey } from "@prisma/client";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { requirePermission } from "@/lib/rbac";
import { generateBillsAction } from "../actions";
import { GenerateBillsForm } from "../_components/generate-bills-form";

export default async function GenerateBillsPage() {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Generate Tagihan"
        description="Buat tagihan bulanan untuk seluruh jamaah aktif dari halaman khusus."
        icon={ScrollText}
      />
      <div className="max-w-2xl">
        <GenerateBillsForm action={generateBillsAction} />
      </div>
    </section>
  );
}
