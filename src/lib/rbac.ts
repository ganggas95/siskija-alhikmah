import { AppRoleKey, PermissionKey, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const rolePermissions: Record<AppRoleKey, PermissionKey[]> = {
  ADMIN: Object.values(PermissionKey),
  TREASURER: [
    PermissionKey.MANAGE_REGIONS,
    PermissionKey.MANAGE_HOUSEHOLDS,
    PermissionKey.MANAGE_CONTRIBUTIONS,
    PermissionKey.MANAGE_INCOME,
    PermissionKey.MANAGE_EXPENSES,
    PermissionKey.VERIFY_TRANSACTIONS,
    PermissionKey.VIEW_REPORTS,
  ],
  AUDITOR: [PermissionKey.VIEW_REPORTS, PermissionKey.VIEW_AUDIT_LOG],
};

export type SessionUser = Pick<User, "id" | "name" | "email"> & {
  role: AppRoleKey;
};

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user as SessionUser;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireSession();

  if (!rolePermissions[user.role]?.includes(permission)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user;
}
