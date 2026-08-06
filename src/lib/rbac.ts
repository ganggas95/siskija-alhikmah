import { AppRoleKey, PermissionKey, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

const permissionMatrix: Record<AppRoleKey, ReadonlySet<PermissionKey>> = {
  ADMIN: new Set(Object.values(PermissionKey)),
  TREASURER: new Set([
    PermissionKey.MANAGE_REGIONS,
    PermissionKey.MANAGE_HOUSEHOLDS,
    PermissionKey.MANAGE_CONTRIBUTIONS,
    PermissionKey.MANAGE_INCOME,
    PermissionKey.MANAGE_EXPENSES,
    PermissionKey.VERIFY_TRANSACTIONS,
    PermissionKey.VIEW_REPORTS,
  ]),
  AUDITOR: new Set([PermissionKey.VIEW_REPORTS, PermissionKey.VIEW_AUDIT_LOG]),
};

export const rolePermissions: Record<AppRoleKey, PermissionKey[]> = {
  ADMIN: Object.values(PermissionKey),
  TREASURER: [...permissionMatrix.TREASURER],
  AUDITOR: [...permissionMatrix.AUDITOR],
};

export type SessionUser = Pick<User, "id" | "name" | "email"> & {
  role: AppRoleKey;
  isActive?: boolean;
};

export async function requireSession() {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  return session.user as SessionUser;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireSession();

  if (!permissionMatrix[user.role]?.has(permission)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user;
}

export function hasPermission(
  role: AppRoleKey,
  permission: PermissionKey,
) {
  return permissionMatrix[role]?.has(permission) ?? false;
}
