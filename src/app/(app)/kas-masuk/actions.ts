"use server";

import { IncomeStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/rbac";
import { verifyIncome } from "@/modules/cash/services/verify-income";
import { createTransactionNumber } from "@/modules/shared/numbering";
import type { ActionResult } from "@/lib/action-result";

const incomeFormSchema = z.object({
  id: z.string().cuid().optional(),
  transactionDate: z.coerce.date(),
  categoryId: z.string().cuid(),
  sourceName: z.string().trim().min(1, "Sumber pemasukan wajib diisi."),
  amount: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Nominal harus lebih besar dari nol."),
  method: z.nativeEnum(PaymentMethod),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.nativeEnum(IncomeStatus).default(IncomeStatus.DRAFT),
});

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function revalidateIncomePaths() {
  revalidatePath("/kas-masuk");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

async function assertIncomeCategory(categoryId: string) {
  const category = await db.transactionCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, type: true, isActive: true, deletedAt: true },
  });

  if (!category || category.deletedAt || !category.isActive) {
    throw new Error("Kategori pemasukan tidak ditemukan atau tidak aktif.");
  }

  if (category.type !== "INCOME") {
    throw new Error("Kategori yang dipilih bukan kategori pemasukan.");
  }
}

function getPersistedIncomeStatus(status: IncomeStatus) {
  return status === IncomeStatus.VERIFIED ? IncomeStatus.DRAFT : status;
}

export async function createIncomeAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_INCOME);

  try {
    const parsed = incomeFormSchema.safeParse({
      transactionDate: formData.get("transactionDate"),
      categoryId: formData.get("categoryId"),
      sourceName: formData.get("sourceName"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description"),
      status: formData.get("status") ?? IncomeStatus.DRAFT,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Input kas masuk tidak valid.",
      };
    }

    await assertIncomeCategory(parsed.data.categoryId);

    const income = await db.incomeTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("INC", parsed.data.transactionDate),
        transactionDate: parsed.data.transactionDate,
        categoryId: parsed.data.categoryId,
        sourceName: parsed.data.sourceName,
        amount: parsed.data.amount,
        method: parsed.data.method,
        description: parsed.data.description || "",
        status: getPersistedIncomeStatus(parsed.data.status),
        createdById: user.id,
      },
    });

    if (parsed.data.status === IncomeStatus.VERIFIED) {
      await verifyIncome({
        incomeId: income.id,
        actorId: user.id,
      });
    }

    revalidateIncomePaths();
    return {
      success: true,
      message: "Transaksi kas masuk berhasil ditambahkan.",
      redirectTo: getRedirectTo(formData, "/kas-masuk/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function updateIncomeAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_INCOME);

  try {
    const parsed = incomeFormSchema.safeParse({
      id: formData.get("id"),
      transactionDate: formData.get("transactionDate"),
      categoryId: formData.get("categoryId"),
      sourceName: formData.get("sourceName"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description"),
      status: formData.get("status") ?? IncomeStatus.DRAFT,
    });

    if (!parsed.success || !parsed.data.id) {
      return {
        success: false,
        message:
          parsed.success
            ? "ID transaksi kas masuk tidak ditemukan."
            : parsed.error.issues[0]?.message ?? "Input kas masuk tidak valid.",
      };
    }

    await assertIncomeCategory(parsed.data.categoryId);

    const existing = await db.incomeTransaction.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return { success: false, message: "Transaksi kas masuk tidak ditemukan." };
    }

    if (existing.status !== IncomeStatus.DRAFT) {
      return {
        success: false,
        message: "Hanya transaksi kas masuk berstatus DRAFT yang bisa diedit.",
      };
    }

    const updated = await db.incomeTransaction.update({
      where: { id: parsed.data.id },
      data: {
        transactionDate: parsed.data.transactionDate,
        categoryId: parsed.data.categoryId,
        sourceName: parsed.data.sourceName,
        amount: parsed.data.amount,
        method: parsed.data.method,
        description: parsed.data.description || "",
        status: getPersistedIncomeStatus(parsed.data.status),
      },
    });

    if (parsed.data.status === IncomeStatus.VERIFIED) {
      await verifyIncome({
        incomeId: updated.id,
        actorId: user.id,
      });
    }

    revalidateIncomePaths();
    return {
      success: true,
      message: "Transaksi kas masuk berhasil diperbarui.",
      redirectTo: getRedirectTo(formData, "/kas-masuk"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function deleteIncomeAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();

  try {
    const id = String(formData.get("id") ?? "");

    if (!id) {
      return { success: false, message: "ID transaksi tidak ditemukan." };
    }

    const transaction = await db.incomeTransaction.findUnique({
      where: { id },
      select: { id: true, status: true, createdById: true },
    });

    if (!transaction) {
      return { success: false, message: "Transaksi kas masuk tidak ditemukan." };
    }

    // Only DRAFT transactions can be deleted
    if (transaction.status !== IncomeStatus.DRAFT) {
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

    await db.incomeTransaction.delete({ where: { id } });

    revalidateIncomePaths();
    return {
      success: true,
      message: "Transaksi kas masuk berhasil dihapus.",
      redirectTo: getRedirectTo(formData, "/kas-masuk"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
