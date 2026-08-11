import { PermissionKey } from "@prisma/client";
import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { PaymentForm } from "../_components/payment-form";
import { resolveSearchParams, type SearchParamsInput } from "@/lib/table-query";

export default async function AddContributionPaymentPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const billId = String(resolvedSearchParams.billId ?? "").trim();
  const householdId = String(resolvedSearchParams.householdId ?? "").trim();
  const year = Number(resolvedSearchParams.year ?? "");
  const redirectTo = String(resolvedSearchParams.redirectTo ?? "").trim();

  const selectedBill = billId
    ? await db.contributionBill.findUnique({
        where: { id: billId },
        include: {
          household: {
            select: {
              id: true,
              code: true,
              headName: true,
            },
          },
        },
      })
    : null;

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
      ...(householdId ? { householdId } : {}),
      ...(Number.isInteger(year) && year >= 2000 ? { year } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { household: { code: "asc" } }],
    take: householdId ? 200 : 50,
  });

  const allBills = selectedBill && !bills.some((bill) => bill.id === selectedBill.id)
    ? [selectedBill, ...bills]
    : bills;

  const billsFormatted = allBills.map((b) => ({
    ...b,
    amountDue: b.amountDue.toString(),
  }));

  return (
    <section className="space-y-6">
      <PageHeader
        title="Input Pembayaran Iuran"
        description="Catat pembayaran iuran. Anda bisa langsung masuk dari matriks tagihan tahunan dengan tagihan yang sudah terpilih."
        icon={CreditCard}
      />
      <div className="max-w-3xl">
        <PaymentForm
          bills={billsFormatted}
          initialBillId={selectedBill?.id}
          redirectTo={redirectTo || "/iuran/pembayaran/tambah"}
        />
      </div>
    </section>
  );
}
