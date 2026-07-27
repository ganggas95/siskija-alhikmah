"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { PermissionKey } from "@prisma/client";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function createRegionAction(formData: FormData) {
  await requirePermission(PermissionKey.MANAGE_REGIONS);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Nama wilayah wajib diisi.");
  }

  await db.region.create({
    data: {
      name,
      description: description || null,
    },
  });

  revalidatePath("/wilayah");
  redirect(getRedirectTo(formData, "/wilayah"));
}

export async function updateRegionAction(formData: FormData) {
  await requirePermission(PermissionKey.MANAGE_REGIONS);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!id) {
    throw new Error("ID wilayah tidak ditemukan.");
  }

  if (!name) {
    throw new Error("Nama wilayah wajib diisi.");
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
  redirect(getRedirectTo(formData, "/wilayah"));
}
