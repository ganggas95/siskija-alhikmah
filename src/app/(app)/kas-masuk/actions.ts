"use server";

import { IncomeStatus, PaymentMethod, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { verifyIncome } from "@/modules/cash/services/verify-income";
import { createTransactionNumber } from "@/modules/shared/numbering";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function revalidateIncomePaths() {
  revalidatePath("/kas-masuk");
  revalidatePath("/dashboard");
  revalidatePath("/buku-kas");
}

export async function createIncomeAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_INCOME);

  try {
    const requestedStatus = String(
      formData.get("status") ?? IncomeStatus.DRAFT,
    ) as IncomeStatus;

    const income = await db.incomeTransaction.create({
      data: {
        transactionNumber: createTransactionNumber("INC"),
        transactionDate: new Date(String(formData.get("transactionDate"))),
        categoryId: String(formData.get("categoryId")),
        sourceName: String(formData.get("sourceName")),
        amount: String(formData.get("amount")),
        method: String(formData.get("method")) as PaymentMethod,
        description: String(formData.get("description") ?? ""),
        status: requestedStatus,
        createdById: user.id,
      },
    });

    if (requestedStatus === IncomeStatus.VERIFIED) {
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
    const id = String(formData.get("id") ?? "");
    const requestedStatus = String(
      formData.get("status") ?? IncomeStatus.DRAFT,
    ) as IncomeStatus;

    if (!id) {
      return {
        success: false,
        message: "ID transaksi kas masuk tidak ditemukan.",
      };
    }

    const existing = await db.incomeTransaction.findUnique({
      where: { id },
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
      where: { id },
      data: {
        transactionDate: new Date(String(formData.get("transactionDate"))),
        categoryId: String(formData.get("categoryId")),
        sourceName: String(formData.get("sourceName")),
        amount: String(formData.get("amount")),
        method: String(formData.get("method")) as PaymentMethod,
        description: String(formData.get("description") ?? ""),
        status: requestedStatus,
      },
    });

    if (requestedStatus === IncomeStatus.VERIFIED) {
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
