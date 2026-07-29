import { PermissionKey } from "@prisma/client";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { HouseholdForm } from "../../_components/household-form";

export default async function EditHouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);
  const { id } = await params;

  const [household, regions] = await Promise.all([
    db.household.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    }),
    db.region.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!household) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Edit Jamaah"
        description="Perbarui data kepala keluarga, wilayah, dan status jamaah."
        icon={Users}
      />
      <div className="max-w-3xl">
        <HouseholdForm
          mode="edit"
          regions={regions}
          defaultValues={{
            id: household.id,
            headName: household.headName,
            address: household.address,
            rt: household.rt,
            rw: household.rw,
            regionId: household.regionId,
            status: household.status,
            isDisabled: household.isDisabled,
            isElderly: household.isElderly,
            notes: household.notes,
          }}
        />
      </div>
    </section>
  );
}
