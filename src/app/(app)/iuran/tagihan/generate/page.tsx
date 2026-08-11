import { PermissionKey } from "@prisma/client";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { requirePermission } from "@/lib/rbac";
import { GenerateBillsForm } from "../_components/generate-bills-form";
import { getContributionFeeConfig } from "@/modules/contributions/services/contribution-settings";

export default async function GenerateBillsPage() {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const fees = await getContributionFeeConfig();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Generate Tagihan"
        description="Buat tagihan bulanan untuk seluruh jamaah aktif dari halaman khusus."
        icon={ScrollText}
      />
      <div className="max-w-2xl">
        <GenerateBillsForm normalAmount={fees.normal.toString()} specialAmount={fees.special.toString()} />
      </div>
    </section>
  );
}
