"use server";

import { PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/rbac";
import { generateBillForHouseholdMonth } from "@/modules/contributions/services/generate-bill-for-household-month";
import { generateYearlyBills } from "@/modules/contributions/services/generate-yearly-bills";
import type { ActionResult } from "@/lib/action-result";

const generateBillsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(9999),
});
const generateSingleBillSchema = z.object({
  householdId: z.string().cuid(),
  year: z.coerce.number().int().min(2000).max(9999),
  month: z.coerce.number().int().min(1).max(12),
});

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function generateBillsAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  try {
    const parsed = generateBillsSchema.safeParse({
      year: formData.get("year"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Tahun tidak valid.",
      };
    }

    await generateYearlyBills({
      year: parsed.data.year,
      actorId: user.id,
    });

    revalidatePath("/iuran/tagihan");
    revalidatePath("/iuran/pembayaran");
    revalidatePath("/laporan/iuran");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: "Tagihan tahunan berhasil digenerate.",
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

export async function generateSingleBillAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  try {
    const parsed = generateSingleBillSchema.safeParse({
      householdId: formData.get("householdId"),
      year: formData.get("year"),
      month: formData.get("month"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Data generate tagihan tidak valid.",
      };
    }

    const result = await generateBillForHouseholdMonth({
      ...parsed.data,
      actorId: user.id,
    });

    revalidatePath("/iuran/tagihan");
    revalidatePath("/iuran/pembayaran");
    revalidatePath("/laporan/iuran");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: result.created
        ? "Tagihan berhasil dibuat untuk bulan ini."
        : "Tagihan bulan ini sudah tersedia.",
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
