# Goal
Menyusun ulang README dan dokumen proyek agar akurat terhadap sistem yang saat ini berjalan, mudah dipakai untuk onboarding developer/operator, dan jelas membedakan fitur aktif dari fitur yang masih menjadi roadmap.

## Approach
Dokumentasi akan diturunkan dari implementasi yang ada sekarang, bukan dari requirement ideal awal. Fokus utama adalah menghapus overclaim, menambahkan bagian yang belum terdokumentasi tetapi sudah ada di codebase, dan menambahkan dokumen deployment/status scope agar pembaca langsung paham apa yang sudah bisa dipakai hari ini.

## File Changes
- **Modify** `README.md:1-78`
  - README saat ini masih ringkas dan belum menjelaskan scope aktual, setup environment, akun demo, fitur yang sudah ada, fitur yang belum ada, serta relasi ke dokumen lain.
- **Modify** `ARCHITECTURE.md:1-42`
  - Arsitektur perlu diperluas dari ringkasan menjadi gambaran alur aplikasi, lapisan kode, boundary domain, workflow transaksi, dan source of truth ledger sesuai implementasi aktual.
- **Modify** `DATABASE.md:1-59`
  - Dokumen database perlu diselaraskan dengan schema Prisma aktual, termasuk model import batch, status enum, attachment/storage, constraint, dan aturan ledger.
- **Modify** `SECURITY.md:1-26`
  - Security doc perlu mencerminkan kontrol yang benar-benar ada sekarang, termasuk lockout login in-memory di auth, JWT session, permission gate server-side, dan validasi upload/logo.
- **Modify** `TESTING.md:1-36`
  - Testing doc perlu diubah dari daftar fokus singkat menjadi peta test yang benar-benar ada berikut command, cakupan unit/integration/e2e, dan gap testing yang masih terbuka.
- **Create** `DEPLOYMENT.md`
  - Belum ada dokumen deployment padahal environment file production sudah tersedia di `.env.production.example:1-15` dan README saat ini belum menjelaskan langkah deploy ataupun batasan bahwa Docker belum tersedia.
- **Optional Modify** `.env.example:1-21`, `.env.development.example:1-15`, `.env.production.example:1-15`
  - Jika diperlukan setelah review dokumen, komentar env dapat dirapikan supaya istilah dan penjelasan konsisten dengan README/DEPLOYMENT.

## Implementation Steps
### Task 1: Audit scope dokumentasi terhadap implementasi aktual
1. Inventaris fitur aktif dari route dan navigasi untuk menentukan scope README dengan merujuk ke `src/components/app/sidebar-nav.tsx:48-175`, `src/app/(app)/dashboard/page.tsx:37-260`, `src/app/(app)/buku-kas/page.tsx:23-217`, `src/app/(app)/laporan/kas-bulanan/page.tsx:20-212`, `src/app/(app)/laporan/iuran/page.tsx:20-249`, `src/app/(app)/iuran/pembayaran/import/page.tsx:10-35`, dan `src/app/(app)/pengaturan/profil-masjid/page.tsx:2-25`.
2. Petakan workflow bisnis yang sudah aktif dari service layer agar dokumentasi menjelaskan proses finansial yang benar, memakai `src/modules/contributions/services/record-payment.ts:28-135`, `src/modules/contributions/services/generate-monthly-bills.ts:9-19`, `src/modules/cash/services/verify-income.ts:17-75`, `src/modules/cash/services/verify-expense.ts:17-84`, `src/modules/cash/services/cancel-transaction.ts:25-122`, `src/lib/audit.ts:16-32`, dan `src/lib/supabase-storage.ts:3-65`.
3. Catat command runtime dan dependency aktual dari `package.json:5-82`, lalu cocokan dengan env requirement di `.env.example:1-21`, `.env.development.example:1-15`, dan `.env.production.example:1-15`.

### Task 2: Tulis ulang README untuk onboarding yang akurat
1. Ganti bagian pembuka `README.md:1-78` dengan ringkasan produk yang menyebut scope aktual: auth/RBAC, master wilayah/jamaah, tagihan iuran, pembayaran iuran, import Excel pembayaran, kas masuk, kas keluar, buku kas, laporan kas bulanan, laporan iuran, profil masjid, dan user management sesuai route aktif dan schema.
2. Tambahkan bagian “Status Implementasi Saat Ini” yang membedakan fitur aktif versus fitur belum tersedia, dengan dasar dari route aktif dan schema di `prisma/schema.prisma:11-419`; ini penting karena requirement awal jauh lebih luas daripada implementasi saat ini.
3. Perbarui bagian instalasi dan setup lokal agar memakai command yang benar dari `package.json:5-18`, strategi env dari `.env.example:1-21`, serta seed/demo account dari `prisma/seed.ts:50-153`.
4. Tambahkan bagian akun demo, struktur folder aktual, peta dokumen, dan catatan storage/logo Supabase berdasarkan `prisma/seed.ts:50-106`, `src/lib/supabase-storage.ts:11-65`, dan struktur repo yang ada.

### Task 3: Perluas dokumen arsitektur dan database
1. Ubah `ARCHITECTURE.md:1-42` agar menjelaskan pembagian tanggung jawab antara App Router, server actions, service layer, utilitas shared, dan Prisma, merujuk ke `src/auth.ts:1-104`, `src/lib/rbac.ts:1-60`, serta service-file domain.
2. Tambahkan alur transaksi utama: generate bill, record payment, verify income/expense, cancel/reversal, dan audit logging menggunakan referensi `record-payment.ts`, `generate-monthly-bills.ts`, `verify-income.ts`, `verify-expense.ts`, dan `cancel-transaction.ts`.
3. Perbarui `DATABASE.md:1-59` dengan model dan enum yang benar dari `prisma/schema.prisma:11-419`, termasuk `ImportBatch`, `ContributionPaymentStatus`, `ExpenseStatus`, `LedgerSourceType`, serta relasi satu-ke-satu payment ke income transaction di `prisma/schema.prisma:239-259`.
4. Tambahkan penjelasan constraint dan source of truth ledger memakai `prisma/schema.prisma:220-237`, `prisma/schema.prisma:315-384`, dan tampilan running balance di `src/app/(app)/buku-kas/page.tsx:50-77`.

### Task 4: Sinkronkan dokumen security dan testing
1. Revisi `SECURITY.md:1-26` agar menyebut kontrol yang benar-benar aktif: bcrypt, Auth.js credentials, JWT maxAge/updateAge, server-side permission checks, dan login lockout in-memory sesuai `src/auth.ts:10-104` dan `src/lib/rbac.ts:19-60`.
2. Tambahkan bagian upload/storage security untuk logo berdasarkan `src/lib/supabase-storage.ts:3-65`, termasuk MIME whitelist, ukuran maksimal 2 MB, dan ketergantungan pada Supabase service role key.
3. Tandai secara eksplisit kontrol yang belum lengkap atau masih fase berikutnya, misalnya rate limiting terdistribusi, hardening upload umum, dan deployment secret management, agar dokumentasi jujur terhadap kondisi sekarang.
4. Revisi `TESTING.md:1-36` memakai test aktual yang sudah ada di `src/lib/money.test.ts`, `src/modules/households/imports/import-households.test.ts`, `src/modules/contributions/services/approve-payment.test.ts`, `src/modules/contributions/imports/import-contribution-payments.test.ts`, `src/modules/contributions/exports/export-contribution-payments.test.ts`, `src/app/api/jamaah/import/route.test.ts`, `src/app/api/jamaah/import-template/route.test.ts`, `src/app/api/jamaah/export-pembayaran/route.test.ts`, dan `tests/e2e/mvp-flow.spec.ts:1-57`.
5. Tambahkan penjelasan prakondisi test dan quality gate dari `package.json:9-18` serta `playwright.config.ts` bila diperlukan untuk menjelaskan e2e setup.

### Task 5: Tambahkan dokumen deployment yang realistis
1. Buat `DEPLOYMENT.md` yang menjelaskan deployment scope saat ini berbasis Next.js + PostgreSQL + Prisma + optional Supabase Storage, dengan env requirement dari `.env.production.example:1-15`.
2. Jelaskan langkah build dan start memakai `package.json:6-8`, serta strategi migrate/generate/seed yang sesuai dengan script `package.json:14-18`.
3. Tambahkan bagian “Belum tersedia” untuk Docker, Docker Compose, backup automation, dan health check endpoint jika memang belum ada file/route implementasinya, supaya dokumen tetap akurat dan tidak menjanjikan hal yang belum dibuat.
4. Hubungkan `DEPLOYMENT.md` kembali ke README supaya alur onboarding lengkap untuk dev lokal dan server production.

### Task 6: Review konsistensi istilah dan batas MVP
1. Samakan istilah produk, peran, dan nama modul di seluruh dokumen agar konsisten dengan enum/schema: `ADMIN`, `TREASURER`, `AUDITOR`, `IncomeTransaction`, `ExpenseTransaction`, `CashLedger`, `ContributionBill`, dan `ContributionPayment` dari `prisma/schema.prisma:11-419`.
2. Pastikan setiap klaim fitur di docs dapat ditelusuri ke route, schema, seed, service, atau test yang ada sekarang.
3. Pastikan setiap dokumen menyebut dengan jelas jika fitur masih “sudah ada”, “sebagian ada”, atau “belum ada”, bukan menggabungkannya dalam satu daftar requirement.

## Acceptance Criteria
- README menjelaskan cara setup lokal, environment file, migration, seed, akun demo, command utama, dan daftar fitur yang benar-benar tersedia berdasarkan `package.json:5-18`, `.env*.example`, dan `prisma/seed.ts:50-153`.
- README memiliki bagian eksplisit yang membedakan fitur aktif saat ini dari roadmap yang belum diimplementasikan.
- ARCHITECTURE.md menjelaskan alur transaksi finansial utama dan menyebut ledger sebagai source of truth sesuai implementasi `src/modules/*` dan `src/app/(app)/buku-kas/page.tsx:78-214`.
- DATABASE.md mencerminkan model Prisma aktual, termasuk enum status, `ImportBatch`, unique constraint, dan aturan ledger dari `prisma/schema.prisma:11-419`.
- SECURITY.md menyebut kontrol yang aktif saat ini tanpa mengklaim hardening yang belum ada, dan mencantumkan upload validation/logo storage sesuai `src/lib/supabase-storage.ts:33-65`.
- TESTING.md memetakan test yang benar-benar ada dan command yang benar dari `package.json:9-18`.
- DEPLOYMENT.md tersedia dan hanya mendokumentasikan alur deploy yang konsisten dengan file serta script yang ada sekarang.
- Tidak ada dokumen yang menyatakan fitur tersedia jika route, service, schema, atau test pendukungnya belum ada di repo.

## Verification Steps
1. Baca ulang seluruh dokumen dan cocokkan setiap klaim utama terhadap `package.json`, `prisma/schema.prisma`, route page, service layer, auth/RBAC, dan test file yang relevan.
2. Pastikan command di README/TESTING/DEPLOYMENT identik dengan script pada `package.json:5-18`.
3. Pastikan semua variabel environment yang disebut di docs ada pada `.env.example:10-21`, `.env.development.example:4-15`, atau `.env.production.example:4-15`.
4. Pastikan daftar akun demo sesuai dengan seed di `prisma/seed.ts:50-78`.
5. Verifikasi bahwa setiap fitur yang disebut “aktif” memiliki jejak implementasi minimal pada route/page, service, schema, atau test.
6. Verifikasi bahwa fitur yang belum ada—misalnya Docker/Compose, laporan kas tahunan, audit log UI, export PDF umum, health check—ditandai sebagai belum tersedia jika memang tidak ditemukan file implementasinya.

## Risks & Mitigations
- **Risk:** Dokumentasi tetap overclaim karena mengikuti requirement awal, bukan codebase aktual.
  - **Mitigation:** Jadikan route aktif, schema Prisma, service layer, dan test sebagai sumber kebenaran; semua fitur tanpa bukti implementasi ditandai roadmap.
- **Risk:** Ada fitur yang tersembunyi di action/API tetapi tidak terlihat dari page-level review.
  - **Mitigation:** Cross-check service dan API/import/export files yang relevan sebelum finalisasi dokumen, terutama untuk iuran import/export dan mutasi keuangan.
- **Risk:** Dokumentasi deployment jadi menyesatkan jika menjelaskan Docker atau health check yang belum ada.
  - **Mitigation:** DEPLOYMENT.md harus eksplisit soal prasyarat manual saat ini dan memiliki bagian “belum tersedia”.
- **Risk:** Istilah domain tidak konsisten antara bahasa bisnis dan nama teknis model.
  - **Mitigation:** Gunakan istilah bisnis di narasi, lalu mapping ke nama model teknis secara konsisten di bagian referensi arsitektur/database.