import { ShieldUser } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { roleLabelMap } from "@/lib/user-role";

import { ChangePasswordForm } from "./_components/change-password-form";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function ProfilePage() {
  const sessionUser = await requireSession();

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User aktif tidak ditemukan.");
  }

  const roleLabels = user.userRoles.map(({ role }) => roleLabelMap[role.key]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Lihat detail akun aktif dan perbarui password Anda."
        icon={ShieldUser}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Detail User</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Nama" value={user.name} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Role" value={roleLabels.join(", ") || "-"} />
            <DetailItem label="Status" value={user.isActive ? "Aktif" : "Nonaktif"} />
            <DetailItem
              label="Tanggal Dibuat"
              value={dateFormatter.format(user.createdAt)}
            />
            <DetailItem label="User ID" value={user.id} mono />
          </div>
        </div>

        <ChangePasswordForm />
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-sm text-slate-900 ${mono ? "font-mono break-all" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
