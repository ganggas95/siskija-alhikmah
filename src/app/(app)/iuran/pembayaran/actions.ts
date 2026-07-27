"use server";

import { PaymentMethod, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/rbac";
import { recordContributionPayment } from "@/modules/contributions/services/record-payment";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function recordPaymentAction(formData: FormData) {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  await recordContributionPayment({
    actorId: user.id,
    billId: String(formData.get("billId")),
    amountPaid: String(formData.get("amountPaid")),
    paymentDate: new Date(String(formData.get("paymentDate"))),
    method: String(formData.get("method")) as PaymentMethod,
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/iuran/pembayaran");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
  redirect(getRedirectTo(formData, "/iuran/pembayaran"));
}
