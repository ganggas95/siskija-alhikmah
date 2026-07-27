import { MapPinned } from "lucide-react";
import { PermissionKey } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { requirePermission } from "@/lib/rbac";
import { createRegionAction } from "../actions";
import { RegionForm } from "../_components/region-form";

export default async function AddRegionPage() {
  await requirePermission(PermissionKey.MANAGE_REGIONS);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tambah Wilayah"
        description="Buat wilayah baru untuk pengelompokan data jamaah."
        icon={MapPinned}
      />
      <div className="max-w-2xl">
        <RegionForm action={createRegionAction} mode="create" />
      </div>
    </section>
  );
}
