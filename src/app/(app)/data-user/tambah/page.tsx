import { PermissionKey } from "@prisma/client";
import { ShieldUser } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { requirePermission } from "@/lib/rbac";

import { createUserAction } from "../actions";
import { UserForm } from "../_components/user-form";

export default async function AddUserPage() {
  await requirePermission(PermissionKey.MANAGE_USERS);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tambah User"
        description="Buat akun baru dan tentukan role awal untuk akses sistem."
        icon={ShieldUser}
      />
      <div className="max-w-2xl">
        <UserForm action={createUserAction} mode="create" />
      </div>
    </section>
  );
}
