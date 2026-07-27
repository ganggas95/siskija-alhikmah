import { ArrowUpCircle } from "lucide-react";
import { CategoryType, PermissionKey } from "@prisma/client";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { createExpenseAction } from "../actions";
import { ExpenseForm } from "../_components/expense-form";

export default async function AddExpensePage() {
  await requirePermission(PermissionKey.MANAGE_EXPENSES);

  const categories = await db.transactionCategory.findMany({
    where: { type: CategoryType.EXPENSE, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tambah Kas Keluar"
        description="Catat transaksi pengeluaran dari halaman form terpisah."
        icon={ArrowUpCircle}
      />
      <div className="max-w-3xl">
        <ExpenseForm action={createExpenseAction} mode="create" categories={categories} />
      </div>
    </section>
  );
}
