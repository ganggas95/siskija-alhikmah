import { ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { CategoryType, ExpenseStatus, PermissionKey } from "@prisma/client";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { updateExpenseAction } from "../../actions";
import { ExpenseForm } from "../../_components/expense-form";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PermissionKey.MANAGE_EXPENSES);
  const { id } = await params;

  const [expense, categories] = await Promise.all([
    db.expenseTransaction.findUnique({
      where: { id },
    }),
    db.transactionCategory.findMany({
      where: { type: CategoryType.EXPENSE, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!expense) {
    notFound();
  }

  if (expense.status !== ExpenseStatus.DRAFT) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Edit Kas Keluar"
          description="Transaksi non-draft tidak bisa diedit."
          icon={ArrowUpCircle}
        />
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Hanya transaksi kas keluar berstatus <strong>DRAFT</strong> yang dapat diubah.
          </p>
          <Link
            href="/kas-keluar"
            className="mt-4 inline-flex items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Kembali ke Kas Keluar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Edit Kas Keluar"
        description="Perbarui transaksi draft sebelum proses verifikasi."
        icon={ArrowUpCircle}
      />
      <div className="max-w-3xl">
        <ExpenseForm
          action={updateExpenseAction}
          mode="edit"
          categories={categories}
          defaultValues={{
            id: expense.id,
            transactionDate: expense.transactionDate,
            categoryId: expense.categoryId,
            payeeName: expense.payeeName,
            amount: expense.amount.toString(),
            method: expense.method,
            description: expense.description,
            status: expense.status,
          }}
        />
      </div>
    </section>
  );
}
