import { AppRoleKey, PermissionKey } from "@prisma/client";
import { ShieldUser } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

import { UserForm } from "../../_components/user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  if (user.id === actor.id) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Edit User"
          description="Status dan role akun Anda dikelola dari halaman profil."
          icon={ShieldUser}
        />
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Untuk menjaga sesi aktif tetap konsisten, akun yang sedang Anda gunakan tidak dapat diubah role atau statusnya dari menu ini.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/profil"
              className="rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white"
            >
              Buka Profil Saya
            </Link>
            <Link
              href="/data-user"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Kembali ke Data User
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const primaryRole = (user.userRoles[0]?.role.key ?? AppRoleKey.AUDITOR) as AppRoleKey;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Edit User"
        description="Perbarui status akun dan role user sesuai kebutuhan operasional."
        icon={ShieldUser}
      />
      <div className="max-w-2xl">
        <UserForm
          mode="edit"
          defaultValues={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: primaryRole,
            isActive: user.isActive,
          }}
        />
      </div>
    </section>
  );
}
