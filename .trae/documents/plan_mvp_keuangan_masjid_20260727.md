# Rencana Kerja MVP-First Sistem Keuangan dan Iuran Jamaah Masjid

## Summary

Kita akan mengeksekusi proyek ini dengan strategi **MVP-first** berdasarkan `AGENTS.md`, karena saat ini repository masih kosong dan belum memiliki fondasi aplikasi. Fokus MVP adalah menghasilkan artefak arsitektur yang diwajibkan di Tahap 1, lalu membangun fondasi Next.js full-stack yang cukup untuk menjalankan alur inti: autentikasi berbasis role, master data wilayah dan kepala keluarga, generate tagihan iuran, pencatatan pembayaran iuran yang otomatis membuat kas masuk dan ledger, pencatatan kas masuk non-iuran, pencatatan kas keluar dengan verifikasi, dashboard ringkas, dan laporan dasar.

Fitur lanjutan seperti ekspor PDF penuh, import CSV, lampiran file production-ready, matriks iuran tahunan lengkap, audit log eksploratif tingkat lanjut, hardening performa, dan deployment final akan ditunda ke fase setelah MVP agar delivery awal tetap fokus dan bisa segera divalidasi.

## Current State Analysis

- Repository saat ini hanya berisi [`AGENTS.md`](file:///Users/nizar/MyProject/sismata/AGENTS.md) dengan 1134 baris requirement produk, arsitektur, modul, aturan bisnis, tahapan implementasi, dan output awal.
- Belum ada:
  - kode aplikasi Next.js
  - `package.json`
  - konfigurasi TypeScript, Tailwind, Prisma, testing, atau Docker
  - struktur folder aplikasi
  - skema database atau migrasi
  - dokumentasi implementasi selain `AGENTS.md`
- Karena belum ada kode, pekerjaan harus dimulai dari **Tahap 1: Analisis dan Arsitektur** seperti yang diminta `AGENTS.md`, lalu langsung dilanjutkan ke fondasi proyek.
- Requirement paling kritis yang harus membentuk desain:
  - seluruh nominal keuangan diproses di server dan tidak memakai floating point JavaScript
  - semua operasi keuangan memakai database transaction dan menghasilkan ledger yang menjadi source of truth saldo
  - role-based access control harus ditegakkan di server
  - data keuangan terverifikasi tidak boleh dihapus permanen
  - antarmuka utama harus berbahasa Indonesia dan mudah dipakai bendahara non-teknis

## Scope MVP

### In Scope

1. Artefak Tahap 1:
   - ringkasan requirement
   - asumsi
   - risiko dan mitigasi
   - user flow utama
   - ERD
   - rancangan Prisma schema
   - struktur folder
   - matriks role dan permission
2. Fondasi proyek Next.js full-stack dengan App Router, TypeScript strict, Tailwind, shadcn/ui, Prisma, PostgreSQL, Auth.js credentials, Zod, React Hook Form, dan TanStack Table.
3. RBAC server-side untuk `ADMIN`, `TREASURER`, dan `AUDITOR`.
4. Modul master data inti:
   - profil masjid
   - wilayah
   - kepala keluarga
   - kategori transaksi
   - pengaturan iuran dasar
5. Modul iuran inti:
   - generate tagihan bulanan jamaah aktif
   - lihat daftar tagihan
   - catat pembayaran iuran
   - hitung status `BELUM_BAYAR`, `SEBAGIAN`, `LUNAS`, `DIBEBASKAN`, `DIBATALKAN`
6. Modul keuangan inti:
   - kas masuk non-iuran
   - kas keluar
   - verifikasi transaksi
   - pencatatan ledger dan running balance
7. Dashboard ringkas dan laporan dasar kas bulanan + laporan iuran.
8. Seed data, unit test inti, integration test inti, dan satu alur E2E utama.
9. Dokumentasi dasar pengembangan dan environment.

### Out of Scope untuk MVP Awal

- ekspor PDF production-grade
- impor/ekspor CSV lengkap
- upload lampiran file yang sudah siap production storage
- notifikasi
- backup/restore otomatis
- observability production
- audit log UI yang sangat lengkap
- laporan tahunan penuh dan semua varian laporan
- optimasi performa skala besar
- deployment production final

## Assumptions & Decisions

1. **Pendekatan delivery**: bangun vertikal per alur bisnis, bukan menyelesaikan seluruh UI sekaligus.
2. **Auth**: gunakan Auth.js dengan credentials login email + password untuk mempercepat MVP internal web app.
3. **Roles**:
   - `ADMIN`: akses penuh termasuk user, setting, kategori, audit log
   - `TREASURER`: CRUD operasional finansial sesuai aturan verifikasi
   - `AUDITOR`: read-only
4. **Database**: PostgreSQL dengan Prisma; seluruh nominal disimpan sebagai `Decimal` atau integer Rupiah yang konsisten. Untuk MVP disarankan `Decimal` Prisma agar aman untuk laporan dan perhitungan server.
5. **Ledger**: saldo dihitung dari `CashLedger` terverifikasi; dashboard tidak menyimpan saldo statis.
6. **Bill vs Payment**:
   - `ContributionBill` unik per `householdId + month + year`
   - pembayaran disimpan di `ContributionPayment`
   - status tagihan dihitung dari agregasi pembayaran valid
7. **Kas masuk iuran**: pembayaran iuran membuat atau memperbarui transaksi kas masuk terkait dan ledger dalam satu database transaction.
8. **Soft delete**: dipakai pada entitas master dan transaksi yang tidak boleh hilang secara permanen.
9. **Bahasa UI**: seluruh label utama berbahasa Indonesia.
10. **Monorepo**: tetap satu aplikasi Next.js full-stack tanpa backend terpisah.

## Proposed Changes

### 1. Dokumentasi dan artefak arsitektur awal

- [`README.md`](file:///Users/nizar/MyProject/sismata/README.md)  
  Apa: gambaran aplikasi, setup lokal, akun demo, perintah utama.  
  Mengapa: entry point proyek.  
  Bagaimana: ditulis setelah fondasi proyek agar command benar-benar valid.

- [`ARCHITECTURE.md`](file:///Users/nizar/MyProject/sismata/ARCHITECTURE.md)  
  Apa: ringkasan requirement, asumsi, user flow, modul, boundary layer, dan keputusan desain.  
  Mengapa: memenuhi output Tahap 1 dan jadi referensi implementasi.  
  Bagaimana: memuat strategi layered architecture `app -> modules -> domain -> persistence`.

- [`DATABASE.md`](file:///Users/nizar/MyProject/sismata/DATABASE.md)  
  Apa: ERD Mermaid, constraint, indexing, aturan transaksi, strategi ledger.  
  Mengapa: domain keuangan butuh sumber kebenaran yang eksplisit.  
  Bagaimana: sinkron dengan `prisma/schema.prisma`.

- [`SECURITY.md`](file:///Users/nizar/MyProject/sismata/SECURITY.md)  
  Apa: model autentikasi, otorisasi, hashing, session, validasi server, upload rules, audit log rules.  
  Mengapa: requirement keamanan cukup ketat sejak awal.

- [`TESTING.md`](file:///Users/nizar/MyProject/sismata/TESTING.md)  
  Apa: test pyramid, skenario unit/integration/E2E MVP.  
  Mengapa: acceptance bergantung pada keakuratan alur finansial.

- [`.env.example`](file:///Users/nizar/MyProject/sismata/.env.example)  
  Apa: daftar environment variables minimum.  
  Mengapa: onboarding lokal dan validasi environment.

### 2. Fondasi aplikasi Next.js

- [`package.json`](file:///Users/nizar/MyProject/sismata/package.json)  
  Apa: dependency Next.js, Prisma, Auth.js, Zod, RHF, TanStack Table, Vitest, Playwright.  
  Mengapa: fondasi runtime dan testing.

- [`tsconfig.json`](file:///Users/nizar/MyProject/sismata/tsconfig.json), [`next.config.ts`](file:///Users/nizar/MyProject/sismata/next.config.ts), [`postcss.config.js`](file:///Users/nizar/MyProject/sismata/postcss.config.js), [`tailwind.config.ts`](file:///Users/nizar/MyProject/sismata/tailwind.config.ts), [`components.json`](file:///Users/nizar/MyProject/sismata/components.json)  
  Apa: konfigurasi build, styling, dan shadcn.  
  Mengapa: standarisasi proyek.

- [`src/app/layout.tsx`](file:///Users/nizar/MyProject/sismata/src/app/layout.tsx), [`src/app/globals.css`](file:///Users/nizar/MyProject/sismata/src/app/globals.css), [`src/app/(app)/layout.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/layout.tsx)  
  Apa: shell aplikasi, navigasi, dan tema UI dasar.  
  Mengapa: semua halaman butuh layout konsisten dan ramah pengguna.

- [`src/app/login/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/login/page.tsx) dan route dashboard/master data/transaksi utama  
  Apa: entry pages sesuai struktur URL di `AGENTS.md`.  
  Mengapa: menjaga kesesuaian dengan requirement halaman.

### 3. Struktur domain dan shared modules

- [`src/modules/auth`](file:///Users/nizar/MyProject/sismata/src/modules/auth), [`src/modules/households`](file:///Users/nizar/MyProject/sismata/src/modules/households), [`src/modules/contributions`](file:///Users/nizar/MyProject/sismata/src/modules/contributions), [`src/modules/cash`](file:///Users/nizar/MyProject/sismata/src/modules/cash), [`src/modules/reports`](file:///Users/nizar/MyProject/sismata/src/modules/reports), [`src/modules/settings`](file:///Users/nizar/MyProject/sismata/src/modules/settings)  
  Apa: pemisahan per bounded context.  
  Mengapa: menghindari business logic menumpuk di route/page.

- [`src/lib/auth`](file:///Users/nizar/MyProject/sismata/src/lib/auth), [`src/lib/db.ts`](file:///Users/nizar/MyProject/sismata/src/lib/db.ts), [`src/lib/rbac.ts`](file:///Users/nizar/MyProject/sismata/src/lib/rbac.ts), [`src/lib/money.ts`](file:///Users/nizar/MyProject/sismata/src/lib/money.ts), [`src/lib/audit.ts`](file:///Users/nizar/MyProject/sismata/src/lib/audit.ts)  
  Apa: utilitas lintas modul untuk database, RBAC, formatting Rupiah, dan audit.  
  Mengapa: aturan keuangan dan hak akses harus reusable dan konsisten.

### 4. Database, migrasi, dan seed

- [`prisma/schema.prisma`](file:///Users/nizar/MyProject/sismata/prisma/schema.prisma)  
  Apa: model minimum `User`, `Role`, `Permission`, `UserRole`, `MosqueProfile`, `Region`, `Household`, `ContributionSetting`, `ContributionBill`, `ContributionPayment`, `IncomeTransaction`, `ExpenseTransaction`, `TransactionCategory`, `CashLedger`, `AuditLog`, `SystemSetting`.  
  Mengapa: requirement eksplisit dari `AGENTS.md`.  
  Bagaimana: menambahkan unique constraints, indexes, enum status, dan soft delete fields.

- [`prisma/seed.ts`](file:///Users/nizar/MyProject/sismata/prisma/seed.ts)  
  Apa: akun demo, wilayah, kepala keluarga contoh, tagihan, pembayaran, dan transaksi dasar.  
  Mengapa: mempercepat validasi UI dan E2E.

### 5. Alur transaksi inti yang harus dibuat lebih dulu

- [`src/modules/contributions/services/generate-monthly-bills.ts`](file:///Users/nizar/MyProject/sismata/src/modules/contributions/services/generate-monthly-bills.ts)  
  Apa: generate tagihan unik untuk jamaah aktif.  
  Mengapa: pintu masuk modul iuran.

- [`src/modules/contributions/services/record-payment.ts`](file:///Users/nizar/MyProject/sismata/src/modules/contributions/services/record-payment.ts)  
  Apa: simpan pembayaran, update status tagihan, sinkronkan income transaction + ledger + audit log.  
  Mengapa: alur finansial paling kritis.

- [`src/modules/cash/services/verify-income.ts`](file:///Users/nizar/MyProject/sismata/src/modules/cash/services/verify-income.ts) dan [`src/modules/cash/services/verify-expense.ts`](file:///Users/nizar/MyProject/sismata/src/modules/cash/services/verify-expense.ts)  
  Apa: verifikasi transaksi dan buat entry ledger idempoten.  
  Mengapa: saldo tidak boleh berubah tanpa verifikasi yang sah.

- [`src/modules/cash/services/cancel-transaction.ts`](file:///Users/nizar/MyProject/sismata/src/modules/cash/services/cancel-transaction.ts)  
  Apa: reversal atau perubahan status aman tanpa hard delete.  
  Mengapa: acceptance menuntut pembatalan aman dan terjejak.

### 6. UI MVP

- Dashboard:
  - [`src/app/(app)/dashboard/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/dashboard/page.tsx)
- Master data:
  - [`src/app/(app)/wilayah/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/wilayah/page.tsx)
  - [`src/app/(app)/jamaah/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/jamaah/page.tsx)
- Iuran:
  - [`src/app/(app)/iuran/tagihan/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/iuran/tagihan/page.tsx)
  - [`src/app/(app)/iuran/pembayaran/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/iuran/pembayaran/page.tsx)
- Kas:
  - [`src/app/(app)/kas-masuk/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/kas-masuk/page.tsx)
  - [`src/app/(app)/kas-keluar/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/kas-keluar/page.tsx)
  - [`src/app/(app)/buku-kas/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/buku-kas/page.tsx)
- Laporan:
  - [`src/app/(app)/laporan/kas-bulanan/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/laporan/kas-bulanan/page.tsx)
  - [`src/app/(app)/laporan/iuran/page.tsx`](file:///Users/nizar/MyProject/sismata/src/app/(app)/laporan/iuran/page.tsx)

Setiap halaman MVP wajib punya:
- tabel cari/filter/paginasi minimum
- loading, empty, dan error state
- validasi form di bawah field
- format tanggal Indonesia dan Rupiah
- guard role di server

### 7. Testing dan quality gates

- [`vitest.config.ts`](file:///Users/nizar/MyProject/sismata/vitest.config.ts) dan [`src/**/*.test.ts`](file:///Users/nizar/MyProject/sismata/src)  
  Unit test untuk status tagihan, saldo ledger, validasi nominal, RBAC, nomor transaksi, reversal.

- [`tests/e2e/mvp-flow.spec.ts`](file:///Users/nizar/MyProject/sismata/tests/e2e/mvp-flow.spec.ts)  
  E2E untuk login bendahara -> tambah kepala keluarga -> generate tagihan -> bayar iuran -> verifikasi pengeluaran -> cek saldo.

- CI lokal minimum via script:
  - `lint`
  - `type-check`
  - `test`
  - `test:e2e`

## Urutan Implementasi yang Disarankan

1. **Tahap 1 - Analisis & desain**
   - turunkan requirement ke dokumen arsitektur
   - susun ERD Mermaid
   - finalkan Prisma schema draft
   - finalkan matriks role/permission
2. **Tahap 2 - Bootstrap proyek**
   - inisialisasi Next.js + TypeScript + Tailwind + shadcn/ui
   - pasang Prisma + PostgreSQL + Auth.js
   - siapkan layout, nav, error handling, env validation
3. **Tahap 3 - Data model & auth**
   - implement schema, migration awal, seed
   - login credentials dan guard role
4. **Tahap 4 - Master data**
   - wilayah
   - kepala keluarga
   - kategori transaksi
   - profil masjid + setting iuran
5. **Tahap 5 - Iuran inti**
   - generate tagihan
   - daftar & filter
   - pencatatan pembayaran
   - sinkronisasi income + ledger + audit
6. **Tahap 6 - Keuangan inti**
   - kas masuk non-iuran
   - kas keluar
   - verifikasi dan pembatalan aman
   - buku kas
7. **Tahap 7 - Dashboard & laporan dasar**
   - metrik utama
   - laporan kas bulanan
   - laporan iuran
8. **Tahap 8 - Hardening MVP**
   - unit/integration/E2E
   - lint, type-check, accessibility pass
   - dokumentasi setup dan runbook lokal

## User Flow Utama untuk MVP

1. Admin login dan mengelola pengguna dasar.
2. Bendahara login.
3. Bendahara mengisi profil masjid, wilayah, kategori, dan data kepala keluarga.
4. Bendahara generate tagihan bulan berjalan untuk jamaah aktif.
5. Bendahara mencatat pembayaran iuran.
6. Sistem memperbarui status tagihan, kas masuk, ledger, dan audit log dalam satu transaction.
7. Bendahara mencatat kas masuk non-iuran dan kas keluar.
8. Pihak berwenang memverifikasi transaksi yang memerlukan verifikasi.
9. Dashboard dan laporan membaca data dari transaksi terverifikasi dan ledger.
10. Auditor login untuk melihat data tanpa hak mutasi.

## Risiko Teknis dan Mitigasi

1. **Ketidaksinkronan saldo**
   - Mitigasi: ledger sebagai source of truth; transaksi dan reversal idempoten; integration test ledger.
2. **Duplikasi tagihan/pembayaran**
   - Mitigasi: unique constraint, idempotency key untuk operasi sensitif, validasi server-side.
3. **RBAC hanya di UI**
   - Mitigasi: seluruh server action/route handler memanggil guard permission.
4. **Model domain terlalu besar untuk repo kosong**
   - Mitigasi: MVP scope dipersempit ke alur finansial inti; backlog deferred ditulis eksplisit.
5. **Regresi pada perhitungan uang**
   - Mitigasi: utilitas uang terpusat, hindari float, unit test semua kalkulasi inti.
6. **Kompleksitas laporan terlalu dini**
   - Mitigasi: mulai dari laporan kas bulanan dan laporan iuran; laporan lain setelah MVP tervalidasi.

## Verification Steps

1. `pnpm install` atau package manager yang dipilih berhasil tanpa dependency conflict.
2. `pnpm prisma migrate dev` dan `pnpm prisma db seed` berhasil pada PostgreSQL lokal.
3. `pnpm dev` menjalankan aplikasi dan halaman login dapat diakses.
4. Login berhasil untuk akun `ADMIN`, `TREASURER`, dan `AUDITOR`.
5. Bendahara dapat:
   - menambah wilayah
   - menambah kepala keluarga
   - generate tagihan bulan berjalan
   - mencatat pembayaran iuran
6. Setelah pembayaran iuran:
   - status tagihan berubah benar
   - transaksi kas masuk terbuat/terbarui
   - ledger bertambah
   - saldo dashboard berubah sesuai
7. Kas keluar yang belum diverifikasi tidak mengurangi saldo, dan setelah verifikasi saldo berkurang.
8. Auditor tidak bisa mengakses operasi mutasi secara langsung.
9. `pnpm lint`, `pnpm type-check`, `pnpm test`, dan `pnpm test:e2e` lulus untuk scope MVP.

## Deferred Backlog Setelah MVP

- impor/ekspor CSV
- ekspor PDF dan print layout penuh
- matriks pembayaran tahunan lengkap
- lampiran file upload production-ready
- laporan tahunan dan seluruh kombinasi filter lanjutan
- audit log UI lengkap dengan diff before/after
- Docker, Compose, health check, backup/restore, deployment guide final
- security hardening lanjutan seperti rate limiting dan CSRF tuning production
