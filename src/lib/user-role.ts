import { AppRoleKey } from "@prisma/client";

export const roleLabelMap: Record<AppRoleKey, string> = {
  ADMIN: "Admin",
  TREASURER: "Bendahara",
  AUDITOR: "Auditor",
};

export const roleOptions = Object.entries(roleLabelMap).map(([value, label]) => ({
  value: value as AppRoleKey,
  label,
}));
