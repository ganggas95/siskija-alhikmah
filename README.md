# SISKIJA AL-HIKMAH

SISKIJA AL-HIKMAH adalah aplikasi internal untuk pengelolaan iuran jamaah dan kas masjid. Repository ini berisi aplikasi Next.js full-stack yang saat ini sudah dipakai untuk alur dasar operasional: login berbasis role, master wilayah dan jamaah, tagihan iuran, pembayaran iuran, kas masuk, kas keluar, buku kas, laporan dasar, profil masjid, dan manajemen user.

Dokumen ini mengikuti implementasi aktual di repository per 6 Agustus 2026. Jika requirement awal lebih luas dari isi dokumen ini, anggap requirement tersebut masih menjadi roadmap sampai ada route, service, schema, dan test yang mendukungnya.

## Status implementasi saat ini

### Sudah tersedia

- Login internal dengan Auth.js credentials dan role `ADMIN`, `TREASURER`, `AUDITOR`
- RBAC server-side untuk route dan server action
- Dashboard ringkas saldo, mutasi terbaru, jumlah tagihan, dan statistik operasional
- Master wilayah: tambah, edit, nonaktifkan, cari, filter, hitung jumlah KK
- Master jamaah/kepala keluarga: tambah, edit, nonaktifkan, filter, import XLSX, export rekap pembayaran XLSX
- Tagihan iuran bulanan: generate per bulan, daftar tagihan, filter per periode/wilayah/status
- Pembayaran iuran manual
- Import pembayaran iuran dari Excel/XLSX dengan batch import dan progress tracking
- Approval dan pembatalan pembayaran iuran draft
- Kas masuk non-iuran: tambah, edit draft, verifikasi, hapus draft
- Kas keluar: tambah, edit draft, verifikasi, hapus draft
- Buku kas dengan running balance dari ledger aktif
- Laporan kas bulanan
- Laporan iuran
- Profil masjid/organisasi, termasuk upload logo ke Supabase Storage
- Manajemen user internal
- Audit log pada operasi penting di layer service/action

### Sebagian tersedia

- Seed data: sudah ada akun demo, role, permission, kategori transaksi, profil masjid, dan contribution setting; belum ada seed transaksi operasional lengkap
- Testing: unit/integration/e2e dasar sudah ada, tetapi belum mencakup seluruh workflow requirement awal
- Export: sudah ada export XLSX untuk rekap pembayaran jamaah; export PDF umum belum ada
- Upload file: validasi logo sudah ada; upload lampiran transaksi umum belum ada

### Belum tersedia

- Dockerfile dan Docker Compose
- Health check endpoint khusus production
- Laporan kas tahunan
- Laporan kas masuk khusus per modul
- Laporan kas keluar khusus per modul
- Audit log UI khusus untuk auditor/admin
- Matriks iuran tahunan per keluarga
- Tunggakan iuran dengan halaman khusus
- Receipt/print PDF umum
- Backup automation
- Rate limiting login terdistribusi

## Fitur yang aktif di route aplikasi

- `/login`
- `/dashboard`
- `/wilayah`, `/wilayah/tambah`, `/wilayah/[id]/edit`
- `/jamaah`, `/jamaah/tambah`, `/jamaah/[id]/edit`
- `/iuran/tagihan`, `/iuran/tagihan/generate`
- `/iuran/pembayaran`, `/iuran/pembayaran/tambah`, `/iuran/pembayaran/import`
- `/kas-masuk`, `/kas-masuk/tambah`, `/kas-masuk/[id]/edit`
- `/kas-keluar`, `/kas-keluar/tambah`, `/kas-keluar/[id]/edit`
- `/buku-kas`
- `/laporan/kas-bulanan`
- `/laporan/iuran`
- `/data-user`, `/data-user/tambah`, `/data-user/[id]/edit`
- `/pengaturan/profil-masjid`
- `/profil`

## Teknologi yang dipakai saat ini

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma ORM + PostgreSQL
- Auth.js credentials + JWT session
- Zod
- Tailwind CSS
- Radix UI based components di `src/components/ui`
- TanStack Table
- React Hook Form
- Recharts terpasang sebagai dependency, tetapi visualisasi dashboard saat ini masih minimal
- Vitest
- Playwright
- Supabase Storage untuk logo organisasi

## Persyaratan lokal

- Node.js 22 atau lebih baru
- pnpm
- PostgreSQL 15 atau kompatibel

## Setup environment

1. Salin salah satu template env:
   - development lokal: `.env.development.example` -> `.env.development.local`
   - baseline umum: `.env.example`
   - production manual: `.env.production.example` -> `.env.production.local`
2. Isi minimal variabel berikut:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `AUTH_SECRET`
3. Isi variabel Supabase hanya jika ingin memakai upload logo:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`

Catatan:

- Prisma runtime membaca `POSTGRES_PRISMA_URL`
- Prisma migrate/direct connection membaca `POSTGRES_URL_NON_POOLING`
- aplikasi development lokal default mengarah ke database `sismata` di `localhost:5432`

## Menjalankan lokal

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Lalu buka [localhost:3000](http://localhost:3000).

## Build dan run production

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm start
```

Panduan detail deployment ada di [DEPLOYMENT.md](./DEPLOYMENT.md).

## Perintah utama

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed:staging
pnpm import:jamaah-master
```

## Akun demo hasil seed

Semua akun seed memakai password yang sama:

- Password: `Password123!`

Daftar akun:

- `admin@sismata.local` — role `ADMIN`
- `bendahara@sismata.local` — role `TREASURER`
- `auditor@sismata.local` — role `AUDITOR`

## Alur bisnis utama yang sudah aktif

1. Bendahara/admin login.
2. Kelola wilayah dan data kepala keluarga.
3. Generate tagihan iuran bulanan untuk jamaah aktif.
4. Catat pembayaran iuran manual atau import XLSX.
5. Pembayaran terverifikasi membuat `IncomeTransaction` dan `CashLedger`.
6. Kas masuk non-iuran dibuat sebagai draft lalu diverifikasi agar masuk ledger.
7. Kas keluar dibuat sebagai draft/pending lalu diverifikasi jika saldo cukup.
8. Pembatalan transaksi melakukan reversal di ledger, bukan menghapus histori saldo.
9. Dashboard, buku kas, dan laporan membaca ledger aktif sebagai source of truth saldo.

## Struktur folder

```text
src/app                 Route App Router, page, layout, server action
src/app/api             API route untuk import/export dan auth
src/modules             Domain service, import/export, helper workflow bisnis
src/lib                 Auth, RBAC, db, audit, money, table helpers
src/components          Komponen UI, form, tabel, navigasi
prisma                  Schema, migration, seed
tests/e2e               Skenario Playwright
scripts                 Script utilitas tambahan
```

## Storage dan upload

- Upload logo organisasi memakai Supabase Storage
- Tipe logo yang diterima: PNG, JPG/JPEG, WEBP
- Ukuran maksimal logo: 2 MB
- Jika env Supabase kosong, fitur upload logo tidak dapat dipakai

## Peta dokumen

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [SECURITY.md](./SECURITY.md)
- [TESTING.md](./TESTING.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Catatan scope

Repository ini belum mengimplementasikan seluruh requirement awal proyek. Saat menambah fitur baru, gunakan route, schema Prisma, service, dan test yang ada sebagai titik acuan, bukan daftar requirement ideal yang belum diwujudkan.
