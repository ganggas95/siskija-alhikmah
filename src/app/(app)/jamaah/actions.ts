"use server";

import { HouseholdStatus, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { createHouseholdCode } from "@/modules/shared/numbering";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function getBooleanField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "") === "true";
}

export async function createHouseholdAction(formData: FormData) {
  const user = await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);
  const headName = String(formData.get("headName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const rt = String(formData.get("rt") ?? "").trim();
  const rw = String(formData.get("rw") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "");

  if (!headName) {
    throw new Error("Nama kepala keluarga wajib diisi.");
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
  redirect(getRedirectTo(formData, "/jamaah"));
}

export async function updateHouseholdAction(formData: FormData) {
  const user = await requirePermission(PermissionKey.MANAGE_HOUSEHOLDS);
  const id = String(formData.get("id") ?? "");
  const headName = String(formData.get("headName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const rt = String(formData.get("rt") ?? "").trim();
  const rw = String(formData.get("rw") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "");
  const status = String(formData.get("status") ?? HouseholdStatus.ACTIVE) as HouseholdStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) {
    throw new Error("ID jamaah tidak ditemukan.");
  }

  if (!headName) {
    throw new Error("Nama kepala keluarga wajib diisi.");
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
  redirect(getRedirectTo(formData, "/jamaah"));
}
