# SISKIJA AL-HIKMAH

SISKIJA AL-HIKMAH adalah aplikasi Next.js full-stack untuk mengelola kepala keluarga jamaah, iuran bulanan, kas masuk, kas keluar, ledger, dan laporan dasar keuangan masjid.

## Fitur MVP

- autentikasi internal berbasis role `ADMIN`, `TREASURER`, `AUDITOR`
- master wilayah dan kepala keluarga
- generate tagihan iuran bulanan
- pencatatan pembayaran iuran yang otomatis membuat kas masuk dan ledger
- pencatatan kas masuk non-iuran dan kas keluar
- dashboard, buku kas, laporan kas bulanan, dan laporan iuran
- seed data akun demo dan data operasional contoh

## Teknologi

- Next.js App Router
- TypeScript strict mode
- Prisma + PostgreSQL
- Auth.js credentials
- Zod
- Tailwind CSS
- React Hook Form dan TanStack Table sudah disiapkan di dependency map MVP
- Vitest dan Playwright

## Persyaratan

- Node.js 22+
- pnpm 11+
- PostgreSQL 15+

## Menjalankan Lokal

1. Salin `.env.example` menjadi `.env`.
2. Pastikan PostgreSQL aktif dan database `sismata` tersedia.
3. Jalankan:

```bash
pnpm install --no-frozen-lockfile
pnpm exec prisma generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

4. Buka `http://localhost:3000`.

## Akun Demo

- `admin@sismata.local` / `Password123!`
- `bendahara@sismata.local` / `Password123!`
- `auditor@sismata.local` / `Password123!`

## Perintah Penting

```bash
pnpm dev
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
```

## Struktur Folder

```text
src/app              Route App Router
src/lib              Helper database, auth, RBAC, money
src/modules          Domain services per modul bisnis
prisma               Schema dan seed
tests/e2e            Skenario end-to-end
```

Lihat juga `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, dan `TESTING.md`.
