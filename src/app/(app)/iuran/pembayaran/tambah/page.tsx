import { PermissionKey } from "@prisma/client";
import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { recordPaymentAction } from "../actions";
import { PaymentForm } from "../_components/payment-form";

export default async function AddContributionPaymentPage() {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  const bills = await db.contributionBill.findMany({
    include: {
      household: {
        select: {
          code: true,
          headName: true,
        },
      },
    },
    where: {
      canceledAt: null,
      status: { in: ["BELUM_BAYAR", "SEBAGIAN"] },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { household: { code: "asc" } }],
    take: 50,
  });

  const billsFormatted = bills.map((b) => ({
    ...b,
    amountDue: b.amountDue.toString(),
  }));

  return (
    <section className="space-y-6">
      <PageHeader
        title="Input Pembayaran Iuran"
        description="Catat pembayaran iuran dari halaman form terpisah."
        icon={CreditCard}
      />
      <div className="max-w-3xl">
        <PaymentForm action={recordPaymentAction} bills={billsFormatted} />
      </div>
    </section>
  );
}
