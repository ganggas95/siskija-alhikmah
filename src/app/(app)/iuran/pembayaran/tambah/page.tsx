import { BillStatus, Prisma, PermissionKey } from "@prisma/client";
import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import {
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";
import { PaymentForm } from "../_components/payment-form";

const payableBillWhere = {
  canceledAt: null,
  status: { in: [BillStatus.BELUM_BAYAR, BillStatus.SEBAGIAN] },
} satisfies Prisma.ContributionBillWhereInput;

export default async function AddContributionPaymentPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const selectedBillId = getQueryParam(resolvedSearchParams, "billId");

  const [bills, selectedBill] = await Promise.all([
    db.contributionBill.findMany({
      include: {
        household: {
          select: {
            code: true,
            headName: true,
          },
        },
      },
      where: payableBillWhere,
      orderBy: [{ year: "desc" }, { month: "desc" }, { household: { code: "asc" } }],
      take: 50,
    }),
    selectedBillId
      ? db.contributionBill.findFirst({
          include: {
            household: {
              select: {
                code: true,
                headName: true,
              },
            },
          },
          where: {
            id: selectedBillId,
            ...payableBillWhere,
          },
        })
      : Promise.resolve(null),
  ]);

  const allBills = selectedBill
    ? [selectedBill, ...bills.filter((bill) => bill.id !== selectedBill.id)]
    : bills;

  const billsFormatted = allBills.map((b) => ({
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
        <PaymentForm bills={billsFormatted} initialBillId={selectedBill?.id} />
      </div>
    </section>
  );
}
