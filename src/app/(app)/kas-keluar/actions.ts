"use server";

import { ExpenseStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/rbac";
import { verifyExpense } from "@/modules/cash/services/verify-expense";
import { createTransactionNumber } from "@/modules/shared/numbering";

const expenseFormSchema = z.object({
  id: z.string().cuid().optional(),
  transactionDate: z.coerce.date(),
  categoryId: z.string().cuid(),
  payeeName: z.string().trim().min(1, "Penerima pembayaran wajib diisi."),
  amount: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Nominal harus lebih besar dari nol."),
  method: z.nativeEnum(PaymentMethod),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.nativeEnum(ExpenseStatus).default(ExpenseStatus.DRAFT),
});

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function revalidateExpensePaths() {
  revalidatePath("/kas-keluar");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

async function assertExpenseCategory(categoryId: string) {
  const category = await db.transactionCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, type: true, isActive: true, deletedAt: true },
  });

  if (!category || category.deletedAt || !category.isActive) {
    throw new Error("Kategori pengeluaran tidak ditemukan atau tidak aktif.");
  }

  if (category.type !== "EXPENSE") {
    throw new Error("Kategori yang dipilih bukan kategori pengeluaran.");
  }
}

function getPersistedExpenseStatus(status: ExpenseStatus) {
  return status === ExpenseStatus.VERIFIED ? ExpenseStatus.DRAFT : status;
}

export async function createExpenseAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_EXPENSES);

  try {
    const parsed = expenseFormSchema.safeParse({
      transactionDate: formData.get("transactionDate"),
      categoryId: formData.get("categoryId"),
      payeeName: formData.get("payeeName"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description"),
      status: formData.get("status") ?? ExpenseStatus.DRAFT,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Input kas keluar tidak valid.",
      };
    }

    await assertExpenseCategory(parsed.data.categoryId);

    const expense = await db.expenseTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("EXP", parsed.data.transactionDate),
        transactionDate: parsed.data.transactionDate,
        categoryId: parsed.data.categoryId,
        payeeName: parsed.data.payeeName,
        amount: parsed.data.amount,
        method: parsed.data.method,
        description: parsed.data.description || "",
        status: getPersistedExpenseStatus(parsed.data.status),
        createdById: user.id,
      },
    });

    if (parsed.data.status === ExpenseStatus.VERIFIED) {
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
    const parsed = expenseFormSchema.safeParse({
      id: formData.get("id"),
      transactionDate: formData.get("transactionDate"),
      categoryId: formData.get("categoryId"),
      payeeName: formData.get("payeeName"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description"),
      status: formData.get("status") ?? ExpenseStatus.DRAFT,
    });

    if (!parsed.success || !parsed.data.id) {
      return {
        success: false,
        message:
          parsed.success
            ? "ID transaksi kas keluar tidak ditemukan."
            : parsed.error.issues[0]?.message ?? "Input kas keluar tidak valid.",
      };
    }

    await assertExpenseCategory(parsed.data.categoryId);

    const existing = await db.expenseTransaction.findUnique({
      where: { id: parsed.data.id },
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
      where: { id: parsed.data.id },
      data: {
        transactionDate: parsed.data.transactionDate,
        categoryId: parsed.data.categoryId,
        payeeName: parsed.data.payeeName,
        amount: parsed.data.amount,
        method: parsed.data.method,
        description: parsed.data.description || "",
        status: getPersistedExpenseStatus(parsed.data.status),
      },
    });

    if (parsed.data.status === ExpenseStatus.VERIFIED) {
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

    if (transaction.status !== ExpenseStatus.DRAFT) {
      return {
        success: false,
        message: "Hanya transaksi berstatus DRAFT yang dapat dihapus.",
      };
    }

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
