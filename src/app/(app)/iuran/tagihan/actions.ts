"use server";

import { PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/rbac";
import { generateMonthlyBills } from "@/modules/contributions/services/generate-monthly-bills";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function generateBillsAction(formData: FormData) {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  await generateMonthlyBills({
    year,
    month,
    actorId: user.id,
  });

  revalidatePath("/iuran/tagihan");
  redirect(getRedirectTo(formData, "/iuran/tagihan"));
}
