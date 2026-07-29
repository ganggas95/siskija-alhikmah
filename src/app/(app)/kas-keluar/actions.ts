"use server";

import { ExpenseStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/rbac";
import { verifyExpense } from "@/modules/cash/services/verify-expense";
import { createTransactionNumber } from "@/modules/shared/numbering";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function revalidateExpensePaths() {
  revalidatePath("/kas-keluar");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

export async function createExpenseAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_EXPENSES);

  try {
    const requestedStatus = String(
      formData.get("status") ?? ExpenseStatus.DRAFT,
    ) as ExpenseStatus;

    const expense = await db.expenseTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("EXP"),
        transactionDate: new Date(String(formData.get("transactionDate"))),
        categoryId: String(formData.get("categoryId")),
        payeeName: String(formData.get("payeeName")),
        amount: String(formData.get("amount")),
        method: String(formData.get("method")) as PaymentMethod,
        description: String(formData.get("description") ?? ""),
        status: requestedStatus,
        createdById: user.id,
      },
    });

    if (requestedStatus === ExpenseStatus.VERIFIED) {
      await verifyExpense({
        expenseId: expense.id,
        actorId: user.id,
      });
    }

    revalidateExpensePaths();
    return {
      success: true,
      message: "Transaksi kas keluar berhasil ditambahkan.",
      redirectTo: getRedirectTo(formData, "/kas-keluar/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function updateExpenseAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_EXPENSES);

  try {
    const id = String(formData.get("id") ?? "");
    const requestedStatus = String(
      formData.get("status") ?? ExpenseStatus.DRAFT,
    ) as ExpenseStatus;

    if (!id) {
      return {
        success: false,
        message: "ID transaksi kas keluar tidak ditemukan.",
      };
    }

    const existing = await db.expenseTransaction.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "Transaksi kas keluar tidak ditemukan.",
      };
    }

    if (existing.status !== ExpenseStatus.DRAFT) {
      return {
        success: false,
        message: "Hanya transaksi kas keluar berstatus DRAFT yang bisa diedit.",
      };
    }

    const updated = await db.expenseTransaction.update({
      where: { id },
      data: {
        transactionDate: new Date(String(formData.get("transactionDate"))),
        categoryId: String(formData.get("categoryId")),
        payeeName: String(formData.get("payeeName")),
        amount: String(formData.get("amount")),
        method: String(formData.get("method")) as PaymentMethod,
        description: String(formData.get("description") ?? ""),
        status: requestedStatus,
      },
    });

    if (requestedStatus === ExpenseStatus.VERIFIED) {
      await verifyExpense({
        expenseId: updated.id,
        actorId: user.id,
      });
    }

    revalidateExpensePaths();
    return {
      success: true,
      message: "Transaksi kas keluar berhasil diperbarui.",
      redirectTo: getRedirectTo(formData, "/kas-keluar"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function deleteExpenseAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();

  try {
    const id = String(formData.get("id") ?? "");

    if (!id) {
      return { success: false, message: "ID transaksi tidak ditemukan." };
    }

    const transaction = await db.expenseTransaction.findUnique({
      where: { id },
      select: { id: true, status: true, createdById: true },
    });

    if (!transaction) {
      return {
        success: false,
        message: "Transaksi kas keluar tidak ditemukan.",
      };
    }

    // Only DRAFT transactions can be deleted
    if (transaction.status !== ExpenseStatus.DRAFT) {
      return {
        success: false,
        message: "Hanya transaksi berstatus DRAFT yang dapat dihapus.",
      };
    }

    // Only the creator can delete, unless Admin
    if (user.role !== "ADMIN" && transaction.createdById !== user.id) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk menghapus transaksi ini.",
      };
    }

    await db.expenseTransaction.delete({ where: { id } });

    revalidateExpensePaths();
    return {
      success: true,
      message: "Transaksi kas keluar berhasil dihapus.",
      redirectTo: getRedirectTo(formData, "/kas-keluar"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
