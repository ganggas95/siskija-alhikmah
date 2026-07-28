"use server";

import bcrypt from "bcryptjs";
import { AppRoleKey, PermissionKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import type { ActionResult } from "@/lib/action-result";

function getRedirectTo(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

function parseRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "").trim() as AppRoleKey;

  if (!Object.values(AppRoleKey).includes(role)) {
    throw new Error("Role user tidak valid.");
  }

  return role;
}

export async function createUserAction(
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission(PermissionKey.MANAGE_USERS);

  try {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = parseRole(formData.get("role"));
    const isActive = String(formData.get("isActive") ?? "true") === "true";

    if (!name) {
      return { success: false, message: "Nama user wajib diisi." };
    }

    if (!email) {
      return { success: false, message: "Email user wajib diisi." };
    }

    if (password.length < 8) {
      return { success: false, message: "Password minimal 8 karakter." };
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { success: false, message: "Email sudah digunakan user lain." };
    }

    const roleRecord = await db.role.findUnique({
      where: { key: role },
      select: { id: true },
    });

    if (!roleRecord) {
      return { success: false, message: "Role user tidak ditemukan." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        isActive,
        userRoles: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
    });

    revalidatePath("/data-user");
    return {
      success: true,
      message: "User berhasil ditambahkan.",
      redirectTo: getRedirectTo(formData, "/data-user/tambah"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}

export async function updateUserAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requirePermission(PermissionKey.MANAGE_USERS);

  try {
    const id = String(formData.get("id") ?? "").trim();
    const role = parseRole(formData.get("role"));
    const isActive = String(formData.get("isActive") ?? "true") === "true";

    if (!id) {
      return { success: false, message: "ID user tidak ditemukan." };
    }

    if (id === actor.id) {
      return {
        success: false,
        message:
          "Status dan role akun Anda dikelola dari sesi aktif. Edit user lain untuk fitur ini.",
      };
    }

    const [user, roleRecord] = await Promise.all([
      db.user.findUnique({
        where: { id },
        select: { id: true },
      }),
      db.role.findUnique({
        where: { key: role },
        select: { id: true },
      }),
    ]);

    if (!user) {
      return { success: false, message: "User tidak ditemukan." };
    }

    if (!roleRecord) {
      return { success: false, message: "Role user tidak ditemukan." };
    }

    await db.$transaction([
      db.user.update({
        where: { id },
        data: { isActive },
      }),
      db.userRole.deleteMany({
        where: { userId: id },
      }),
      db.userRole.create({
        data: {
          userId: id,
          roleId: roleRecord.id,
        },
      }),
    ]);

    revalidatePath("/data-user");
    return {
      success: true,
      message: "User berhasil diperbarui.",
      redirectTo: getRedirectTo(formData, "/data-user"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
    };
  }
}
