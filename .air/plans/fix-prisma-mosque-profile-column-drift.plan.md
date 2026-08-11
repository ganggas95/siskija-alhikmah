## 1. Goal
Memulihkan aplikasi dari error Prisma `P2022` dengan memastikan database runtime telah memiliki kolom `MosqueProfile.specialContributionFee` dan alur migration deployment konsisten dengan schema repository.

## 2. Approach
Repository sudah konsisten di level code dan Prisma schema: field `specialContributionFee` dipakai oleh service iuran dan halaman profil masjid, dan migration penambah kolom itu sudah tersedia. Jadi fokus perbaikan bukan mengubah query, tetapi menyinkronkan database aktual dengan migration yang tertinggal, lalu memperkeras alur deploy agar runtime (`POSTGRES_PRISMA_URL`) dan migrate/direct connection (`POSTGRES_URL_NON_POOLING`) mengarah ke schema yang sama dan migration dijalankan dengan command yang tepat.

## 3. File Changes
- Modify `package.json`
  - Tambahkan script migration untuk deployment yang aman, mis. `db:migrate:deploy` memakai `prisma migrate deploy`, karena script saat ini hanya menyediakan `db:migrate` -> `prisma migrate dev`.
- Modify `README.md`
  - Perjelas langkah recovery mismatch schema dan bedakan alur local development vs production deploy.
- Modify `DEPLOYMENT.md`
  - Perjelas bahwa migration production harus memakai `prisma migrate deploy`, serta tambahkan checklist verifikasi bahwa database runtime memang sudah memuat kolom baru.
- No code change expected in `prisma/schema.prisma`
  - Referensi: model `MosqueProfile` sudah memuat `specialContributionFee` di line 149-166.
- No code change expected in `prisma/migrations/20260803100000_organization_contribution_settings/migration.sql`
  - Referensi: migration sudah menambah `organizationName` dan `specialContributionFee` di line 1-7.
- No code change expected in `src/modules/contributions/services/contribution-settings.ts`
  - Referensi: query yang gagal memang membaca `specialContributionFee` di line 6-12 dan sesuai schema.
- No code change expected in `src/app/(app)/pengaturan/profil-masjid/page.tsx`
  - Referensi: halaman profil juga membaca `profile.specialContributionFee` di line 6-23 dan sesuai schema.
- No code change expected in `src/app/(app)/pengaturan/profil-masjid/actions.ts`
  - Referensi: action update menyimpan `specialContributionFee` di line 3-4 dan sesuai schema.

## 4. Implementation Steps

### Task 1: Konfirmasi sumber drift database
1. Verifikasi bahwa model `MosqueProfile` di `prisma/schema.prisma` line 149-166 memang mensyaratkan kolom `specialContributionFee`.
2. Verifikasi bahwa migration `prisma/migrations/20260803100000_organization_contribution_settings/migration.sql` line 1-7 adalah migration yang seharusnya menambahkan kolom tersebut.
3. Cek environment aktif untuk memastikan runtime Prisma memakai `POSTGRES_PRISMA_URL` dan migrate memakai `POSTGRES_URL_NON_POOLING` sesuai `prisma/schema.prisma` line 5-8 dan `.env.example`.
4. Cek histori migration di database target melalui Prisma migration table atau `prisma migrate status`; jika migration `20260803100000_organization_contribution_settings` belum applied, itu akar masalah utama.
5. Jika migration table menyatakan applied tetapi kolom tetap tidak ada, perlakukan sebagai schema drift atau database target berbeda antara runtime dan migrate connection.

### Task 2: Sinkronkan database target
1. Jalankan migration yang tertinggal ke database yang sama dengan runtime aplikasi.
2. Untuk local/dev environment, gunakan alur repository saat ini bila memang database disposable.
3. Untuk shared/prod environment, gunakan command deploy migration, bukan `prisma migrate dev`.
4. Jika migration tidak bisa dijalankan otomatis tetapi perubahan hanya kolom yang sudah didefinisikan pada migration line 1-7, siapkan recovery SQL terkontrol untuk menambah kolom dan backfill nilai dari `defaultContributionFee`.
5. Setelah sinkronisasi, regenerate Prisma client bila diperlukan agar build/runtime konsisten.

### Task 3: Hardening alur deploy agar tidak terulang
1. Tambahkan script deploy migration di `package.json`, mis. `db:migrate:deploy`.
2. Perbarui `README.md` agar setup lokal tetap jelas tetapi tidak mendorong penggunaan `migrate dev` untuk server bersama.
3. Perbarui `DEPLOYMENT.md` dengan urutan deploy yang benar: install, generate client, migrate deploy, seed opsional, build, start.
4. Tambahkan catatan verifikasi pasca migration: cek halaman `/pengaturan/profil-masjid`, dashboard, dan service iuran yang mengakses konfigurasi fee.

### Task 4: Verifikasi fungsional pasca recovery
1. Uji query `db.mosqueProfile.findFirst()` yang dipakai `src/modules/contributions/services/contribution-settings.ts` line 7.
2. Uji render halaman `src/app/(app)/pengaturan/profil-masjid/page.tsx` line 4-23.
3. Uji update profil masjid melalui action `src/app/(app)/pengaturan/profil-masjid/actions.ts` line 3-4.
4. Uji flow yang memakai konfigurasi iuran agar fallback `specialContributionFee ?? normal` bekerja dengan data aktual.

## 5. Acceptance Criteria
- Database runtime yang dipakai `POSTGRES_PRISMA_URL` memiliki kolom `MosqueProfile.specialContributionFee` bertipe `DECIMAL(18,2)`.
- Migration `20260803100000_organization_contribution_settings` tercatat applied pada database target, atau perubahan SQL ekuivalennya sudah diterapkan dan terdokumentasi.
- Query `prisma.mosqueProfile.findFirst()` tidak lagi melempar `P2022` untuk kolom `specialContributionFee`.
- Halaman profil masjid dapat dibuka tanpa error dan menampilkan nilai `specialContributionFee`.
- Service `getContributionFeeConfig()` di `src/modules/contributions/services/contribution-settings.ts` line 6-12 mengembalikan konfigurasi valid.
- `package.json` menyediakan script deployment migration yang eksplisit untuk environment non-development.
- README dan deployment docs menjelaskan perbedaan `migrate dev` vs `migrate deploy` dan sumber env yang dipakai Prisma runtime vs migrate.

## 6. Verification Steps
1. Jalankan status migration pada database target dan pastikan migration 3 Agustus 2026 sudah terpasang.
2. Verifikasi struktur tabel `MosqueProfile` di database target; kolom `specialContributionFee` dan `organizationName` harus ada.
3. Jalankan generate client Prisma.
4. Start aplikasi lalu akses halaman profil masjid.
5. Uji alur yang memanggil service konfigurasi iuran.
6. Jika tersedia, jalankan type-check minimal untuk memastikan tidak ada perubahan docs/script yang merusak workflow.

Verifikasi SQL yang relevan:
- cek struktur `MosqueProfile`
- cek nilai `specialContributionFee` existing row
- pastikan runtime URL dan migrate URL mengarah ke database yang sama secara host/database/schema

## 7. Risks & Mitigations
- Risiko: runtime Prisma dan migration memakai database berbeda.
  - Mitigasi: cocokkan `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING` ke host/database/schema yang sama sebelum menjalankan migration.
- Risiko: migration history menandai applied tetapi DDL belum benar-benar ada karena drift/manual change.
  - Mitigasi: audit tabel `_prisma_migrations`, lalu gunakan recovery SQL terkontrol dan dokumentasikan reconciliation.
- Risiko: menjalankan `prisma migrate dev` pada production/shared DB membuat perubahan yang tidak diinginkan.
  - Mitigasi: gunakan `prisma migrate deploy` untuk deployment dan sisakan `migrate dev` hanya untuk local development.
- Risiko: data lama `MosqueProfile` memiliki nilai null/invalid untuk fee khusus.
  - Mitigasi: pakai backfill SQL yang sudah ada di migration line 5-7, yaitu set `specialContributionFee = defaultContributionFee` untuk baris default 0, lalu verifikasi hasilnya.