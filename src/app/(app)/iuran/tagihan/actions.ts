"use server";

import { PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac";
import { generateMonthlyBills } from "@/modules/contributions/services/generate-monthly-bills";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function generateBillsAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  try {
    const year = Number(formData.get("year"));
    const month = Number(formData.get("month"));
    const amountNormal = String(formData.get("amountNormal") ?? "7000");
    const amountDiscounted = String(formData.get("amountDiscounted") ?? "5000");

    await generateMonthlyBills({
      year,
      month,
      actorId: user.id,
      amountNormal,
      amountDiscounted,
    });

    revalidatePath("/iuran/tagihan");
    return {
      success: true,
      message: "Tagihan berhasil digenerate.",
      redirectTo: getRedirectTo(formData, "/iuran/tagihan"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
