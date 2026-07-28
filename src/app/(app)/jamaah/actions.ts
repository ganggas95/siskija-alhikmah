"use server";

import { HouseholdStatus, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { createHouseholdCode } from "@/modules/shared/numbering";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function getBooleanField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "") === "true";
}

export async function createHouseholdAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);

  try {
    const headName = String(formData.get("headName") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const rt = String(formData.get("rt") ?? "").trim();
    const rw = String(formData.get("rw") ?? "").trim();
    const regionId = String(formData.get("regionId") ?? "");

    if (!headName) {
      return { success: false, message: "Nama kepala keluarga wajib diisi." };
    }

    const total = await db.household.count();

    await db.household.create({
      data: {
        code: createHouseholdCode(total + 1),
        headName,
        address: address || null,
        rt: rt || null,
        rw: rw || null,
        regionId: regionId || null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    revalidatePath("/jamaah");
    return {
      success: true,
      message: "Data jamaah berhasil ditambahkan.",
      redirectTo: getRedirectTo(formData, "/jamaah/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function updateHouseholdAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);

  try {
    const id = String(formData.get("id") ?? "");
    const headName = String(formData.get("headName") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const rt = String(formData.get("rt") ?? "").trim();
    const rw = String(formData.get("rw") ?? "").trim();
    const regionId = String(formData.get("regionId") ?? "");
    const status = String(
      formData.get("status") ?? HouseholdStatus.ACTIVE,
    ) as HouseholdStatus;
    const notes = String(formData.get("notes") ?? "").trim();

    if (!id) {
      return { success: false, message: "ID jamaah tidak ditemukan." };
    }

    if (!headName) {
      return { success: false, message: "Nama kepala keluarga wajib diisi." };
    }

    await db.household.update({
      where: { id },
      data: {
        headName,
        address: address || null,
        rt: rt || null,
        rw: rw || null,
        regionId: regionId || null,
        status,
        isDisabled: getBooleanField(formData, "isDisabled"),
        isElderly: getBooleanField(formData, "isElderly"),
        notes: notes || null,
        updatedById: user.id,
      },
    });

    revalidatePath("/jamaah");
    return {
      success: true,
      message: "Data jamaah berhasil diperbarui.",
      redirectTo: getRedirectTo(formData, "/jamaah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
