# Goal
Menyelaraskan basis kode SISKIJA MVP yang sudah ada dengan spesifikasi penuh pada AGENTS, tanpa merusak pola arsitektur yang sudah benar pada auth, ledger, dan transaction service.

# Approach
Repo saat ini sudah memiliki fondasi yang tepat: Next.js App Router, Prisma PostgreSQL, RBAC dasar, service-layer untuk workflow finansial, dan ledger aktif sebagai source of truth. Pendekatan terbaik adalah mempertahankan struktur yang ada lalu menutup gap secara bertahap per domain, dimulai dari integritas transaksi dan otorisasi server-side, kemudian memperluas modul, laporan, hardening keamanan, dan deployment.

# File Changes
- Modify `prisma/schema.prisma:11-419` — perluas model agar sesuai spesifikasi penuh: attachment linkage, audit metadata lengkap, reversal/cancellation traceability, transaction source validation, pengaturan sistem tambahan, dan relasi laporan/ekspor yang masih hilang.
- Modify `src/auth.ts:8-85` — tambahkan hardening login (rate limit hook, inactive/locked handling, session hardening) sambil mempertahankan Auth.js credentials flow.
- Modify `src/lib/rbac.ts:6-42` — ubah RBAC dari mapping statis minimum menjadi permission enforcement yang mencakup semua modul target dan read-only auditor tanpa celah mutasi.
- Modify `src/modules/shared/numbering.ts:1-10` — ganti generator berbasis `Date.now()` dengan skema nomor transaksi/bukti yang stabil, dapat dikonfigurasi, dan aman terhadap collision.
- Modify `src/modules/contributions/services/generate-monthly-bills.ts:7-20` — tambahkan dukungan generate per wilayah, skip jamaah nonaktif, status dibebaskan, idempotency, dan audit detail.
- Modify `src/modules/contributions/services/record-payment.ts:15-150` — pecah logika pembayaran agar mendukung partial payment, multi-month allocation, tunggakan, pembayaran di muka, serta sinkronisasi income transaction dan ledger yang bisa diubah/dibatalkan dengan benar.
- Modify `src/modules/contributions/services/approve-payment.ts:17-230` — satukan rule status tagihan, approval draft import, pembatalan, dan recalculation status agar tidak tersebar di server actions.
- Modify `src/modules/contributions/imports/import-contribution-payments.ts:1-340+` — selaraskan import Excel dengan rule pembayaran multi-bulan, partial, duplicate detection, dan observability batch yang lebih kuat.
- Modify `src/modules/cash/services/verify-income.ts:10-60` — pastikan verifikasi hanya valid untuk DRAFT, tambah guard status, audit before/after, dan attachment/reference persistence.
- Modify `src/modules/cash/services/verify-expense.ts:10-60` — tambahkan saldo warning policy, approval flow opsional, guard transisi status, dan audit lengkap.
- Modify `src/modules/cash/services/cancel-transaction.ts:19-81` — implementasikan reversal yang dapat dilacak, bukan hanya menonaktifkan ledger aktif, sesuai spesifikasi source-of-truth ledger.
- Modify `src/app/(app)/layout.tsx:10-135` dan `src/components/app/sidebar-nav.tsx:19-155` — perluas navigasi mengikuti struktur halaman target di AGENTS, termasuk laporan tambahan, audit log, kategori, pengaturan iuran, dan user management penuh.
- Modify `src/app/(app)/dashboard/page.tsx:1-260+` — ubah dashboard dari ringkasan MVP menjadi dashboard spesifikasi: cashflow bulanan, persen pembayaran, total tunggakan, kategori pemasukan/pengeluaran, wilayah terendah, dan filter bulan/tahun/wilayah.
- Modify `src/app/(app)/jamaah/page.tsx:1-320+` dan form terkait — tambah detail page, active/inactive toggle, CSV import/export final, histori iuran per household, dan filter lengkap sesuai requirement.
- Modify `src/app/(app)/iuran/tagihan/page.tsx:1-320+` dan `src/app/(app)/iuran/pembayaran/page.tsx:1-360+` — tambah matriks tahunan, pembayaran multi-bulan, receipt print/export, tunggakan, dan status aksesibel.
- Modify `src/app/(app)/kas-masuk/actions.ts:1-167` dan `src/app/(app)/kas-keluar/actions.ts:1-172` — ganti parsing langsung `FormData` dengan Zod schema server-side, attachment validation, guard transisi status, dan audit lengkap.
- Modify `src/app/(app)/buku-kas/page.tsx:1-320+` — tampilkan saldo awal, total pemasukan/pengeluaran periode, saldo akhir, running balance, dan filter periode.
- Modify `src/app/(app)/laporan/kas-bulanan/page.tsx:1-260+` dan `src/app/(app)/laporan/iuran/page.tsx:1-300+` — refactor agar membaca query/report service, bukan agregasi halaman sederhana; tambah export CSV/PDF dan print-friendly header.
- Create `src/modules/reports/*` — service layer baru untuk laporan kas bulanan/tahunan, iuran, kas masuk, kas keluar, dan jamaah dengan filter terpusat.
- Create `src/modules/ledger/*` — utilitas domain untuk posting entry, reversal, balance summary, opening balance, dan running balance agar logic ledger tidak tersebar.
- Create `src/modules/audit/*` — formatter audit event, actor metadata capture, dan entitas auditable.
- Create `src/modules/categories/*` — master kategori transaksi lengkap dengan validasi type income/expense.
- Create `src/modules/settings/*` — profile masjid, contribution policy, numbering config, lampiran, dan system settings yang tersentralisasi.
- Create halaman App Router yang belum ada dari AGENTS — terutama `/iuran/tunggakan`, `/iuran/matriks-tahunan`, `/iuran/[id]`, `/kas-masuk/[id]`, `/kas-keluar/[id]`, `/laporan/kas-tahunan`, `/laporan/kas-masuk`, `/laporan/kas-keluar`, `/laporan/jamaah`, `/pengaturan/kategori`, `/pengaturan/iuran`, `/pengaturan/pengguna`, `/pengaturan/audit-log`.
- Modify `tests/e2e/mvp-flow.spec.ts:1-65` dan tambah suite baru — perluas E2E sesuai acceptance AGENTS, termasuk generate tagihan, pembayaran, verifikasi pengeluaran, dan laporan.
- Modify unit/integration tests di `src/modules/**/**/*.test.ts` — tambah cakupan untuk saldo, tunggakan, numbering, RBAC, reversal, dan generate tagihan per policy.
- Modify `README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `TESTING.md` — dokumentasi saat ini masih mencerminkan MVP, belum spesifikasi penuh.
- Create `DEPLOYMENT.md`, `Dockerfile`, `docker-compose.yml`, health-check route, dan backup/restore guide — deployment target di AGENTS belum terwujud.

# Implementation Steps
## Task 1: Bekukan domain contract dan rapikan model data
1. Audit enum dan model di `prisma/schema.prisma:11-419` terhadap AGENTS: status transaksi, audit fields, attachment ownership, system setting, dan relasi reversal.
2. Tambahkan field/relasi yang hilang di schema Prisma untuk memenuhi kontrak bisnis tanpa mematahkan data MVP yang ada.
3. Perbarui seed di `prisma/seed.ts` dan `prisma/seed-staging.ts` agar menghasilkan role, kategori default, profile masjid, wilayah, household, bill, payment, income, expense, dan audit sample yang konsisten dengan schema final.

## Task 2: Satukan domain ledger dan numbering
1. Refactor posting ledger dari `src/modules/contributions/services/record-payment.ts:68-149`, `src/modules/contributions/services/approve-payment.ts:89-140`, `src/modules/cash/services/verify-income.ts:19-59`, dan `src/modules/cash/services/verify-expense.ts:19-59` ke service bersama di `src/modules/ledger/*`.
2. Implementasikan reversal domain di atas pola `src/modules/cash/services/cancel-transaction.ts:19-81` agar pembatalan tidak hanya mematikan row aktif, tetapi menghasilkan jejak reversal yang dapat diaudit.
3. Ganti helper `src/modules/shared/numbering.ts:1-10` dengan generator nomor deterministik berbasis konfigurasi profile/settings dan sequence yang aman.

## Task 3: Perketat auth, authorization, dan validasi
1. Pertahankan flow Auth.js di `src/auth.ts:13-85`, lalu tambah hardening login, session expiration policy, dan error handling aman.
2. Ganti RBAC minimum di `src/lib/rbac.ts:6-42` dengan permission matrix yang mencakup seluruh halaman dan server action target.
3. Tambahkan Zod schema di setiap server action yang masih parsing `FormData` langsung, khususnya `src/app/(app)/kas-masuk/actions.ts:20-167`, `src/app/(app)/kas-keluar/actions.ts:20-172`, dan `src/app/(app)/iuran/pembayaran/actions.ts:29-269`.

## Task 4: Selesaikan domain master data
1. Lengkapi CRUD wilayah, kepala keluarga, kategori transaksi, pengguna, dan profile masjid dengan soft delete/inactive policy yang konsisten.
2. Perluas `src/modules/households/filters.ts:1-40` dan import flow `src/modules/households/imports/import-households.ts:1-217` agar mendukung CSV import/export final, histori iuran, dan validasi wilayah/alamat opsional sesuai setting.
3. Tambahkan halaman detail/edit yang masih belum ada di struktur App Router target.

## Task 5: Lengkapi domain iuran
1. Refactor `src/modules/contributions/services/generate-monthly-bills.ts:9-20` untuk mendukung generate per wilayah, pembebasan, idempotency, dan policy iuran aktif/nonaktif.
2. Refactor `src/modules/contributions/services/record-payment.ts:36-150` agar pembayaran bisa partial, multi-bulan, tunggakan, dan pembayaran di muka tanpa melanggar unique bill constraint.
3. Satukan approval/cancel logic dari `src/modules/contributions/services/approve-payment.ts:33-230` dan `src/app/(app)/iuran/pembayaran/actions.ts:67-269` ke domain service tunggal.
4. Tambahkan query/report service untuk daftar belum bayar, sudah bayar, rekap tunggakan, receipt print/export, dan matriks tahunan.

## Task 6: Lengkapi domain kas masuk dan kas keluar
1. Tambahkan validasi nominal, referensi, lampiran, dan attachment ownership di action dan service kas masuk/keluar.
2. Implementasikan approval policy pengeluaran berdasar `MosqueProfile.requireExpenseApproval` di `prisma/schema.prisma:149-169`.
3. Tambahkan aturan saldo tersedia, warning overdraft, rejection reason, cancellation reason, dan audit trail penuh.
4. Tambahkan detail page dan daftar/filter lengkap untuk kedua modul.

## Task 7: Bangun reporting layer yang benar
1. Ekstrak logika agregasi dari halaman `src/app/(app)/dashboard/page.tsx:33-120`, `src/app/(app)/buku-kas/page.tsx:22-71`, `src/app/(app)/laporan/kas-bulanan/page.tsx:21-92`, dan `src/app/(app)/laporan/iuran/page.tsx:20-83` ke service query khusus.
2. Tambahkan laporan kas tahunan, kas masuk, kas keluar, jamaah, serta filter periode/wilayah/kategori/status sesuai AGENTS.
3. Tambahkan ekspor CSV/PDF dan print-friendly layout dengan identitas masjid, tanggal cetak, dan nama pencetak.

## Task 8: Selesaikan dashboard dan UX operasional
1. Perluas dashboard saat ini yang masih fokus MVP menjadi dashboard keuangan lengkap dengan KPI pembayaran, tunggakan, kategori, grafik tren, dan wilayah dengan performa pembayaran terendah.
2. Pastikan indikator status tidak hanya bergantung warna pada tagihan, pembayaran, income, expense, dan laporan.
3. Tambahkan preview ringkasan transaksi sebelum submit, loading state, empty state, dan keyboard-accessible dialogs secara konsisten.

## Task 9: Audit log dan observability
1. Perluas `src/lib/audit.ts:1-24` agar semua event penting menyimpan before/after snapshot yang relevan, tanpa data sensitif.
2. Tambahkan capture IP/user-agent untuk route/action yang mendukung, dan audit untuk login/logout/export/generate/import/verify/cancel.
3. Sediakan halaman baca audit log dengan filter entitas, user, aksi, dan periode.

## Task 10: Testing, hardening, deployment, dokumentasi
1. Tambah unit test untuk status tagihan, saldo, tunggakan, nomor transaksi, RBAC, reversal, dan generate tagihan.
2. Tambah integration test untuk contribution payment, income verification, expense verification, cancellation, ledger, dan report query.
3. Perluas Playwright dari `tests/e2e/mvp-flow.spec.ts:1-65` ke alur acceptance AGENTS.
4. Lengkapi dokumen arsitektur, database, security, testing, deployment; tambahkan Docker dan compose serta health endpoint.

# Acceptance Criteria
- Schema Prisma mencakup seluruh entitas inti pada AGENTS dan mempertahankan constraint unik penting: household code, bill per household-month-year, nomor transaksi, dan ledger source.
- Semua mutasi finansial berjalan dalam database transaction dan menghasilkan state transaksi, ledger, dan audit yang konsisten jika sukses; rollback penuh jika gagal.
- Pembayaran iuran mendukung status belum bayar, sebagian, lunas, dibebaskan, dibatalkan; mendukung tunggakan dan pembayaran di muka.
- Verifikasi kas masuk/kas keluar hanya dapat dilakukan melalui permission server-side yang benar dan mem-posting ledger tepat satu kali per transaksi aktif.
- Pembatalan transaksi finansial dapat dilacak dari audit dan ledger tanpa penghapusan permanen atas transaksi terverifikasi.
- Dashboard menampilkan saldo kas, total masuk/keluar, surplus-defisit, KPI iuran, tunggakan, statistik household, dan filter bulan/tahun/wilayah berdasarkan data terverifikasi.
- Modul laporan minimal mencakup kas bulanan, kas tahunan, iuran, kas masuk, kas keluar, dan jamaah dengan filter yang berfungsi.
- Auditor/read-only tidak dapat menjalankan server action mutasi meskipun memanggil endpoint langsung.
- Seluruh form mutasi utama memiliki validasi Zod server-side dan menolak nominal negatif, status transisi tidak valid, dan category-type mismatch.
- Suite `pnpm lint`, `pnpm type-check`, `pnpm test`, dan `pnpm test:e2e` lulus setelah implementasi.
- Aplikasi dapat dijalankan via Docker Compose dengan PostgreSQL dan health check yang aktif.

# Verification Steps
1. Jalankan `pnpm lint` untuk memastikan tidak ada pelanggaran ESLint.
2. Jalankan `pnpm type-check` untuk memastikan TypeScript strict tetap bersih.
3. Jalankan `pnpm test` untuk unit dan integration test domain.
4. Jalankan `pnpm test:e2e` untuk memverifikasi alur bendahara end-to-end.
5. Uji manual role `ADMIN`, `TREASURER`, dan `AUDITOR` pada mutasi dan halaman baca.
6. Uji manual kasus: generate tagihan bulanan, pembayaran partial, pembayaran multi-bulan, verifikasi expense, cancel transaction, dan cek running balance buku kas.
7. Uji ekspor laporan CSV/PDF dan print layout.
8. Jalankan `docker compose up -d` lalu cek login, dashboard, dan health endpoint.

# Risks & Mitigations
- Risiko: helper numbering berbasis `Date.now()` di `src/modules/shared/numbering.ts:1-10` rawan collision pada operasi paralel. Mitigasi: pindah ke sequence/transaction-safe numbering.
- Risiko: logic status tagihan saat ini tersebar di `record-payment.ts`, `approve-payment.ts`, dan action pembayaran, sehingga mudah divergen. Mitigasi: satu service/domain helper tunggal untuk status dan allocation.
- Risiko: cancel transaction saat ini hanya menonaktifkan ledger aktif di `src/modules/cash/services/cancel-transaction.ts:31-67`, kurang ideal untuk audit trail finansial. Mitigasi: tambahkan reversal entries dan state transition policy eksplisit.
- Risiko: banyak server action masih parsing `FormData` langsung tanpa Zod schema, sehingga validasi domain tidak konsisten. Mitigasi: semua mutasi lewat schema server-side dan domain service.
- Risiko: halaman dashboard/laporan masih mengandung query langsung dan agregasi lokal, sehingga business rule dapat terduplikasi. Mitigasi: pindahkan ke report/query services khusus.
- Risiko: dokumentasi saat ini mendeskripsikan MVP, bukan sistem penuh. Mitigasi: perbarui dokumen seiring penyelesaian tiap domain, bukan di akhir saja.