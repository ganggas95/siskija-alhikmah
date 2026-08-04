"use server";

import {
  BillStatus,
  ContributionPaymentStatus,
  IncomeStatus,
  PaymentMethod,
  PermissionKey,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";

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

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function recordPaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  try {
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

function deriveBillStatusFromPayments(amountDue: Decimal, totalPaid: Decimal): BillStatus {
  if (totalPaid.lte(0)) return BillStatus.BELUM_BAYAR;
  if (totalPaid.greaterThanOrEqualTo(amountDue)) return BillStatus.LUNAS;
  return BillStatus.SEBAGIAN;
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

    if (payment.status === ContributionPaymentStatus.DRAFT) {
      return {
        success: false,
        message: "Gunakan aksi Batalkan untuk pembayaran berstatus DRAFT.",
      };
    }

    // Only the recorder can delete, unless Admin
    if (user.role !== "ADMIN" && payment.recordedById !== user.id) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk menghapus pembayaran ini.",
      };
    }

    await db.$transaction(async (tx) => {
      // 1. Cancel the payment
        await tx.contributionPayment.update({
          where: { id },
          data: {
            canceledAt: new Date(),
            status: ContributionPaymentStatus.CANCELED,
          },
        });

      // 2. Cancel the associated income transaction
      if (payment.incomeTransactionId) {
        await tx.incomeTransaction.update({
          where: { id: payment.incomeTransactionId },
          data: {
            status: IncomeStatus.CANCELED,
            canceledAt: new Date(),
          },
        });

        // 3. Deactivate ledger entries
        await tx.cashLedger.updateMany({
          where: {
            sourceId: payment.incomeTransactionId,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      // 4. Recalculate bill status
      const validPayments = await tx.contributionPayment.findMany({
        where: {
          billId: payment.billId,
          canceledAt: null,
          status: ContributionPaymentStatus.VERIFIED,
        },
        select: { amountPaid: true },
      });

      const bill = await tx.contributionBill.findUnique({
        where: { id: payment.billId },
        select: { amountDue: true },
      });

      if (bill) {
        const totalPaid = validPayments.reduce(
          (total, p) => total.plus(p.amountPaid.toString()),
          new Decimal(0),
        );
        const nextStatus = deriveBillStatusFromPayments(
          new Decimal(bill.amountDue.toString()),
          totalPaid,
        );

        await tx.contributionBill.update({
          where: { id: payment.billId },
          data: { status: nextStatus },
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_CONTRIBUTION_PAYMENT",
          entity: "ContributionPayment",
          entityId: id,
          afterData: {
            billId: payment.billId,
            reason: "Dihapus oleh user",
          },
        },
      });
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
