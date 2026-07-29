import { CategoryType, PermissionKey } from "@prisma/client";
import { ArrowDownCircle } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { IncomeForm } from "../_components/income-form";

export default async function AddIncomePage() {
  await requirePermission(PermissionKey.MANAGE_INCOME);

  const categories = await db.transactionCategory.findMany({
    where: { type: CategoryType.INCOME, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tambah Kas Masuk"
        description="Catat transaksi kas masuk dari halaman form terpisah."
        icon={ArrowDownCircle}
      />
      <div className="max-w-3xl">
        <IncomeForm mode="create" categories={categories} />
      </div>
    </section>
  );
}
