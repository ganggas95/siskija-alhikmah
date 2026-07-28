"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { PermissionKey } from "@prisma/client";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function createRegionAction(
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission(PermissionKey.MANAGE_REGIONS);

  try {
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      return { success: false, message: "Nama wilayah wajib diisi." };
    }

    await db.region.create({
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath("/wilayah");
    return {
      success: true,
      message: "Wilayah berhasil ditambahkan.",
      redirectTo: getRedirectTo(formData, "/wilayah/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function updateRegionAction(
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission(PermissionKey.MANAGE_REGIONS);

  try {
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const isActive = String(formData.get("isActive") ?? "true") === "true";

    if (!id) {
      return { success: false, message: "ID wilayah tidak ditemukan." };
    }

    if (!name) {
      return { success: false, message: "Nama wilayah wajib diisi." };
    }

    await db.region.update({
      where: { id },
      data: {
        name,
        description: description || null,
        isActive,
      },
    });

    revalidatePath("/wilayah");
    return {
      success: true,
      message: "Wilayah berhasil diperbarui.",
      redirectTo: getRedirectTo(formData, "/wilayah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
