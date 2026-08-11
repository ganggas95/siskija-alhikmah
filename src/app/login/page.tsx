import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await auth();
  const isStaging = process.env.APP_ENV === "staging";

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="mb-8 space-y-2 text-center">
          <div className="mx-auto w-fit overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-slate-200">
            <Image
              src="/logo.png"
              alt="Logo SISKIJA AL-HIKMAH"
              width={72}
              height={72}
              className="h-18 w-18 object-contain"
              priority
            />
          </div>
          <p className="text-sm font-medium text-green-800">SISKIJA AL-HIKMAH</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Login Pengelola Masjid
          </h1>
        </div>
        <LoginForm />
        {isStaging ? (
          <aside className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            <h2 className="font-semibold">Akun Demo Staging</h2>
            <p className="mt-1 text-xs text-sky-800">
              Gunakan salah satu akun berikut untuk mencoba aplikasi.
            </p>
            <div className="mt-3 space-y-2">
              {[
                { role: "Admin", email: "admin@sismata.local" },
                { role: "Bendahara", email: "bendahara@sismata.local" },
                { role: "Auditor", email: "auditor@sismata.local" },
              ].map((account) => (
                <div
                  key={account.email}
                  className="rounded-xl bg-white/70 px-3 py-2 ring-1 ring-sky-100"
                >
                  <p className="font-medium">{account.role}</p>
                  <p className="text-xs text-sky-800">
                    Email: <code>{account.email}</code>
                  </p>
                  <p className="text-xs text-sky-800">
                    Password: <code>Password123!</code>
                  </p>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
        <p className="mt-6 text-center text-sm text-slate-500">
          Kembali ke <Link href="/" className="font-medium text-green-800">beranda</Link>
        </p>
      </section>
    </div>
  );
}
