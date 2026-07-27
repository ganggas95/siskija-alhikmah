import { PermissionKey } from "@prisma/client";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { createHouseholdAction } from "../actions";
import { HouseholdForm } from "../_components/household-form";

export default async function AddHouseholdPage() {
  await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);

  const regions = await db.region.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tambah Jamaah"
        description="Tambahkan data kepala keluarga baru ke master jamaah."
        icon={Users}
      />
      <div className="max-w-3xl">
        <HouseholdForm action={createHouseholdAction} mode="create" regions={regions} />
      </div>
    </section>
  );
}
