"use server";

import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

type ChangePasswordState = {
  error?: string;
  success?: string;
};

export async function changePasswordAction(
  _previousState: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const sessionUser = await requireSession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua field password wajib diisi." };
  }

  if (newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password baru tidak cocok." };
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return { error: "User tidak ditemukan." };
  }

  const isValidCurrentPassword = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isValidCurrentPassword) {
    return { error: "Password saat ini tidak sesuai." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
    },
  });

  return { success: "Password berhasil diperbarui." };
}
