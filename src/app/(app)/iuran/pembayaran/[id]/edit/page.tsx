import { ContributionPaymentStatus, PermissionKey } from "@prisma/client";
import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { PaymentForm } from "../../_components/payment-form";

export default async function EditContributionDraftPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const { id } = await params;

  const payment = await db.contributionPayment.findUnique({
    where: { id },
    include: {
      bill: {
        include: {
          household: {
            select: {
              code: true,
              headName: true,
            },
          },
        },
      },
    },
  });

  if (!payment || payment.canceledAt) {
    throw new Error("Pembayaran draft tidak ditemukan.");
  }

  if (payment.status !== ContributionPaymentStatus.DRAFT) {
    throw new Error("Hanya pembayaran berstatus DRAFT yang dapat diubah.");
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Ubah Pembayaran Draft"
        description="Perbarui data pembayaran draft sebelum di-approve atau dibatalkan."
        icon={CreditCard}
      />
      <div className="max-w-3xl">
        <PaymentForm
          bills={[
            {
              id: payment.billId,
              amountDue: payment.bill.amountDue.toString(),
              household: {
                code: payment.bill.household.code,
                headName: payment.bill.household.headName,
              },
              month: payment.bill.month,
              year: payment.bill.year,
            },
          ]}
          initialBillId={payment.billId}
          paymentId={payment.id}
          mode="edit-draft"
          redirectTo="/iuran/pembayaran"
          defaultValues={{
            paymentDate: payment.paymentDate.toISOString().slice(0, 10),
            amountPaid: payment.amountPaid.toString(),
            method: payment.method,
            notes: payment.notes ?? "",
          }}
        />
      </div>
    </section>
  );
}
