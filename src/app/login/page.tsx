import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await auth();

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
          <p className="text-sm text-slate-600">
            Gunakan akun demo hasil seed untuk masuk ke dashboard.
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Akun demo</p>
          <p>`admin@sismata.local` / `Password123!`</p>
          <p>`bendahara@sismata.local` / `Password123!`</p>
          <p>`auditor@sismata.local` / `Password123!`</p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Kembali ke <Link href="/" className="font-medium text-green-800">beranda</Link>
        </p>
      </section>
    </div>
  );
}
