import { PermissionKey } from "@prisma/client";
import { MapPinned } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { RegionForm } from "../../_components/region-form";
import { updateRegionAction } from "../../actions";

export default async function EditRegionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PermissionKey.MANAGE_REGIONS);
  const { id } = await params;

  const region = await db.region.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!region) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Edit Wilayah"
        description="Perbarui nama, keterangan, dan status wilayah."
        icon={MapPinned}
      />
      <div className="max-w-2xl">
        <RegionForm
          action={updateRegionAction}
          mode="edit"
          defaultValues={{
            id: region.id,
            name: region.name,
            description: region.description,
            isActive: region.isActive,
          }}
        />
      </div>
    </section>
  );
}
