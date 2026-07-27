import { CategoryType, IncomeStatus, PermissionKey } from "@prisma/client";
import { ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { updateIncomeAction } from "../../actions";
import { IncomeForm } from "../../_components/income-form";

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PermissionKey.MANAGE_INCOME);
  const { id } = await params;

  const [income, categories] = await Promise.all([
    db.incomeTransaction.findUnique({
      where: { id },
    }),
    db.transactionCategory.findMany({
      where: { type: CategoryType.INCOME, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!income) {
    notFound();
  }

  if (income.status !== IncomeStatus.DRAFT) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Edit Kas Masuk"
          description="Transaksi yang sudah diverifikasi tidak bisa diedit."
          icon={ArrowDownCircle}
        />
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Hanya transaksi kas masuk berstatus <strong>DRAFT</strong> yang dapat diubah.
          </p>
          <Link
            href="/kas-masuk"
            className="mt-4 inline-flex items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Kembali ke Kas Masuk
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Edit Kas Masuk"
        description="Perbarui transaksi draft sebelum diverifikasi."
        icon={ArrowDownCircle}
      />
      <div className="max-w-3xl">
        <IncomeForm
          action={updateIncomeAction}
          mode="edit"
          categories={categories}
          defaultValues={{
            id: income.id,
            transactionDate: income.transactionDate,
            categoryId: income.categoryId,
            sourceName: income.sourceName,
            amount: income.amount.toString(),
            method: income.method,
            description: income.description,
            status: income.status,
          }}
        />
      </div>
    </section>
  );
}
