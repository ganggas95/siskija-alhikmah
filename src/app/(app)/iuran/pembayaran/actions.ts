"use server";

import {
  PaymentMethod,
  PermissionKey,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/rbac";
import { recordContributionPayment } from "@/modules/contributions/services/record-payment";
import {
  approveContributionPayment,
  approveContributionPayments,
  cancelContributionPayment,
  cancelContributionPayments,
} from "@/modules/contributions/services/approve-payment";
import type { ActionResult } from "@/lib/action-result";

const paymentFormSchema = z.object({
  billId: z.string().cuid(),
  amountPaid: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Nominal pembayaran harus lebih besar dari nol."),
  paymentDate: z.coerce.date(),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function recordPaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  try {
    const parsed = paymentFormSchema.safeParse({
      billId: formData.get("billId"),
      amountPaid: formData.get("amountPaid"),
      paymentDate: formData.get("paymentDate"),
      method: formData.get("method"),
      notes: formData.get("notes"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Input pembayaran tidak valid.",
      };
    }

    await recordContributionPayment({
      actorId: user.id,
      billId: parsed.data.billId,
      amountPaid: parsed.data.amountPaid,
      paymentDate: parsed.data.paymentDate,
      method: parsed.data.method,
      notes: parsed.data.notes || "",
    });

    revalidatePath("/iuran/pembayaran");
    revalidatePath("/dashboard");
    revalidatePath("/buku-kas");
    return {
      success: true,
      message: "Pembayaran berhasil disimpan.",
      redirectTo: getRedirectTo(formData, "/iuran/pembayaran/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function deletePaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();

  try {
    const id = String(formData.get("id") ?? "");

    if (!id) {
      return { success: false, message: "ID pembayaran tidak ditemukan." };
    }

    const payment = await db.contributionPayment.findUnique({
      where: { id },
      select: {
        id: true,
        recordedById: true,
        canceledAt: true,
        status: true,
        incomeTransactionId: true,
        billId: true,
        amountPaid: true,
      },
    });

    if (!payment || payment.canceledAt) {
      return { success: false, message: "Data pembayaran tidak ditemukan." };
    }

    // Only the recorder can delete, unless Admin
    if (user.role !== "ADMIN" && payment.recordedById !== user.id) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk menghapus pembayaran ini.",
      };
    }

    await cancelContributionPayment({
      paymentId: id,
      actorId: user.id,
      reason: "Dibatalkan dari aksi hapus pembayaran",
    });

    revalidatePath("/iuran/pembayaran");
    revalidatePath("/dashboard");
    revalidatePath("/buku-kas");
    return {
      success: true,
      message: "Pembayaran berhasil dihapus.",
      redirectTo: getRedirectTo(formData, "/iuran/pembayaran"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

function getPaymentIds(formData: FormData) {
  return [...new Set(formData.getAll("paymentId").map(String).filter(Boolean))];
}

export async function approvePaymentAction(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);

  try {
    const paymentId = String(formData.get("paymentId") ?? "");
    if (!paymentId) return { success: false, message: "ID pembayaran tidak ditemukan." };
    await approveContributionPayment({ paymentId, actorId: user.id });
    revalidateContributionPaymentPaths();
    return { success: true, message: "Pembayaran berhasil di-Approve." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan server." };
  }
}

export async function cancelPaymentAction(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);

  try {
    const paymentId = String(formData.get("paymentId") ?? "");
    if (!paymentId) return { success: false, message: "ID pembayaran tidak ditemukan." };
    await cancelContributionPayment({ paymentId, actorId: user.id });
    revalidateContributionPaymentPaths();
    return { success: true, message: "Pembayaran berhasil dibatalkan." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan server." };
  }
}

export async function approveSelectedPaymentsAction(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);
  const paymentIds = getPaymentIds(formData);
  if (!paymentIds.length) return { success: false, message: "Pilih minimal satu pembayaran." };

  try {
    await approveContributionPayments(paymentIds, user.id);
    revalidateContributionPaymentPaths();
    return { success: true, message: `${paymentIds.length} pembayaran berhasil di-Approve.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Bulk Approve gagal." };
  }
}

export async function cancelSelectedPaymentsAction(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.VERIFY_TRANSACTIONS);
  const paymentIds = getPaymentIds(formData);
  if (!paymentIds.length) return { success: false, message: "Pilih minimal satu pembayaran." };

  try {
    await cancelContributionPayments(paymentIds, user.id);
    revalidateContributionPaymentPaths();
    return { success: true, message: `${paymentIds.length} pembayaran berhasil dibatalkan.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Bulk Cancel gagal." };
  }
}

function revalidateContributionPaymentPaths() {
  revalidatePath("/iuran/pembayaran");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
  revalidatePath("/laporan/iuran");
  revalidatePath("/laporan/kas-masuk");
}
