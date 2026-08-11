# Goal
Menyiapkan konfigurasi GitHub Actions untuk repository ini agar memiliki pipeline CI yang konsisten, CD ke Vercel, dan workflow migration database production yang bisa dijalankan secara opsional/manual.

# Approach
Repository saat ini sudah punya script dasar untuk lint, type-check, unit test, e2e, dan Prisma migration deploy di [package.json](package.json) baris 5-19, serta dokumentasi yang sudah membedakan `prisma migrate dev` untuk lokal dan `prisma migrate deploy` untuk environment non-development di [README.md](README.md) baris 111-126 dan [DEPLOYMENT.md](DEPLOYMENT.md) baris 54-66. Karena target deploy yang dipilih adalah Vercel dan migration harus opsional, pendekatan paling aman adalah memisahkan tiga concern: CI untuk validasi kode, deploy workflow untuk preview/production Vercel, dan workflow migration manual `workflow_dispatch` untuk production database.

# File Changes
- Create: `.github/workflows/ci.yml`
  - Workflow CI untuk install dependency, generate Prisma client, menjalankan lint, type-check, unit/integration test, lalu e2e dengan PostgreSQL service container.
- Create: `.github/workflows/vercel-deploy.yml`
  - Workflow deploy ke Vercel menggunakan Vercel CLI, dengan jalur preview untuk PR / branch non-main dan production untuk push ke `main`.
- Create: `.github/workflows/migrate-production.yml`
  - Workflow manual `workflow_dispatch` untuk menjalankan `pnpm db:migrate:deploy` ke database production secara opsional dari tab Actions.
- Modify: `README.md`
  - Tambah dokumentasi setup GitHub Actions, daftar secrets yang dibutuhkan, dan cara trigger migration manual.
- Modify: `DEPLOYMENT.md`
  - Tambah bagian alur CI/CD Vercel, urutan aman deploy vs migration, dan recovery jika migration gagal di workflow manual.
- Optional Modify: `.env.production.example`
  - Tambah komentar yang menjelaskan env mana yang harus ada di Vercel dan env mana yang harus direplikasi sebagai GitHub Environment secrets untuk workflow migration.

# Implementation Steps
## Task 1: Definisikan quality gate CI yang sesuai kondisi repo saat ini
1. Buat `.github/workflows/ci.yml` dengan trigger `pull_request` dan `push` ke branch utama agar setiap perubahan menjalani quality gate sebelum deploy.
2. Di workflow CI, gunakan Node 22 agar sesuai dokumentasi deployment di [DEPLOYMENT.md](DEPLOYMENT.md) baris 7-13, aktifkan pnpm cache, lalu jalankan `pnpm install --frozen-lockfile`.
3. Tambahkan langkah `pnpm db:generate` karena build script saat ini memang bergantung pada Prisma generate di [package.json](package.json) baris 7 dan 14.
4. Jalankan `pnpm lint`, `pnpm type-check`, dan `pnpm test`, sesuai command yang memang sudah didokumentasikan aktif di [TESTING.md](TESTING.md) baris 7-13.
5. Tambahkan PostgreSQL service container untuk job e2e, set env `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, dan `AUTH_SECRET`, lalu jalankan `pnpm db:migrate:deploy`, `pnpm db:seed`, dan `pnpm test:e2e` karena Playwright saat ini login memakai akun seed `admin@sismata.local` dan `bendahara@sismata.local` di [tests/e2e/mvp-flow.spec.ts](tests/e2e/mvp-flow.spec.ts) baris 9-17 dan 44-72.
6. Simpan artifact Playwright hanya saat gagal agar debugging tetap tersedia tanpa memperberat run normal.

## Task 2: Rancang deploy workflow Vercel yang tidak mencampur migration production
1. Buat `.github/workflows/vercel-deploy.yml` dengan dependency pada CI, sehingga deploy hanya berjalan bila quality gate lulus.
2. Tambahkan job preview untuk `pull_request` atau push non-`main` yang melakukan `vercel pull --environment=preview`, `vercel build`, lalu `vercel deploy --prebuilt`, mengikuti pola resmi Vercel CLI untuk GitHub Actions.
3. Tambahkan job production untuk `push` ke `main` yang melakukan `vercel pull --environment=production`, `vercel build --prod`, lalu `vercel deploy --prebuilt --prod`.
4. Gunakan secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, dan `VERCEL_PROJECT_ID` di level GitHub repository / environment.
5. Tambahkan `concurrency` untuk mencegah dua deploy production berjalan bersamaan, karena repo ini mengandung workflow finansial dan schema migration yang sensitif terhadap urutan rollout sebagaimana ditekankan di [DEPLOYMENT.md](DEPLOYMENT.md) baris 98-108 dan 176-180.
6. Pastikan workflow deploy tidak menjalankan migration otomatis, sehingga perubahan schema production hanya terjadi lewat workflow manual terpisah.

## Task 3: Tambahkan workflow migration manual yang aman untuk production
1. Buat `.github/workflows/migrate-production.yml` dengan trigger `workflow_dispatch` dan input seperti `reason` atau `confirm_target` agar eksekusi manual terdokumentasi.
2. Kaitkan workflow ini ke GitHub Environment `production` dengan required reviewers bila tersedia, agar migration tidak bisa dijalankan tanpa persetujuan yang tepat.
3. Dalam job migration, install dependency, jalankan `pnpm db:generate`, lalu `pnpm db:migrate:deploy`, karena repo sudah menegaskan bahwa `db:migrate:deploy` adalah command yang benar untuk production di [package.json](package.json) baris 15-16, [README.md](README.md) baris 125-126, dan [DEPLOYMENT.md](DEPLOYMENT.md) baris 54-66.
4. Set env dari GitHub secrets minimal `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING`, sesuai kebutuhan datasource Prisma di [prisma/schema.prisma](prisma/schema.prisma) baris 5-9 dan template production env di [.env.production.example](.env.production.example) baris 4-15.
5. Tambahkan langkah preflight `pnpm exec prisma migrate status` sebelum deploy migration agar operator mendapat sinyal dini bila ada mismatch histori migration, sejalan dengan recovery docs di [README.md](README.md) baris 128-153 dan [DEPLOYMENT.md](DEPLOYMENT.md) baris 134-164.
6. Tambahkan `concurrency` khusus migration production agar dua operator tidak bisa menjalankan migration pada database yang sama secara paralel.

## Task 4: Dokumentasikan setup secrets dan prosedur operasional
1. Perbarui `README.md` dengan subsection baru “GitHub Actions” yang menjelaskan workflow CI, deploy Vercel, dan migration manual.
2. Dokumentasikan daftar secrets repository: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` untuk deploy; serta environment secret production `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING` untuk migration.
3. Di `DEPLOYMENT.md`, tambahkan urutan operasional yang jelas:
   - merge ke branch deploy untuk memicu deploy Vercel
   - buka tab Actions untuk menjalankan migration bila release memang membawa perubahan schema
   - atau, untuk release yang butuh schema lebih dulu, jalankan migration manual sebelum promote deploy production
4. Tambahkan panduan rollback operasional: migration gagal berarti deploy production berikutnya harus ditahan sampai status `_prisma_migrations` konsisten kembali.
5. Bila diperlukan, beri komentar di `.env.production.example` bahwa env database harus sinkron antara Vercel project settings dan GitHub Environment production agar runtime dan workflow migration mengarah ke database yang sama.

# Acceptance Criteria
- Pull request dan push ke branch utama menjalankan workflow CI yang mencakup `pnpm lint`, `pnpm type-check`, `pnpm test`, dan e2e terhadap PostgreSQL sementara.
- Push ke `main` memicu deploy production Vercel hanya setelah CI sukses.
- Pull request atau branch non-`main` menghasilkan preview deployment Vercel melalui GitHub Actions.
- Tidak ada workflow deploy yang memanggil `pnpm db:migrate`.
- Workflow migration manual tersedia di tab GitHub Actions dan hanya berjalan saat dipicu `workflow_dispatch`.
- Workflow migration manual menjalankan `pnpm db:migrate:deploy`, bukan `prisma migrate dev`.
- Workflow migration manual memakai env database production dari GitHub secrets/environment, bukan nilai hardcoded.
- Dokumentasi menjelaskan dengan eksplisit lokasi secrets, cara trigger migration manual, dan urutan aman migration vs deploy.
- Concurrency protection mencegah dua deploy production atau dua migration production berjalan bersamaan.

# Verification Steps
1. Buka pull request dummy dan verifikasi workflow CI berjalan sampai selesai.
2. Verifikasi job e2e membuat database ephemeral, menjalankan `pnpm db:migrate:deploy`, `pnpm db:seed`, lalu `pnpm test:e2e` tanpa memakai database production.
3. Buat branch non-`main` dan verifikasi workflow deploy preview menghasilkan URL deployment Vercel.
4. Merge ke `main` dan verifikasi workflow production Vercel berjalan setelah CI sukses.
5. Dari tab Actions, trigger workflow `migrate-production` secara manual dengan input alasan eksekusi.
6. Verifikasi log workflow migration menampilkan preflight `prisma migrate status` lalu `pnpm db:migrate:deploy`.
7. Uji skenario tanpa migration baru: workflow manual selesai tanpa perubahan schema dan tanpa error.
8. Uji skenario migration baru belum diterapkan: workflow manual meng-apply migration, lalu aplikasi production tetap bisa membuka `/login` dan `/dashboard` sesuai checklist verifikasi di [DEPLOYMENT.md](DEPLOYMENT.md) baris 124-132.

# Risks & Mitigations
- Risiko: deploy production berjalan dengan kode baru tetapi schema belum di-apply.
  - Mitigasi: pisahkan workflow migration manual, dokumentasikan urutan release yang butuh schema change, dan gunakan environment protection + reviewer.
- Risiko: workflow migration diarahkan ke database yang berbeda dari runtime Vercel.
  - Mitigasi: dokumentasikan bahwa `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING` di GitHub Environment production harus sama targetnya dengan env di Vercel, sesuai peringatan di [README.md](README.md) baris 134-153 dan [DEPLOYMENT.md](DEPLOYMENT.md) baris 140-164.
- Risiko: e2e CI flaky karena login bergantung pada seed database.
  - Mitigasi: jalankan `pnpm db:migrate:deploy` dan `pnpm db:seed` eksplisit sebelum `pnpm test:e2e`, memakai akun seed yang memang sudah didokumentasikan di [TESTING.md](TESTING.md) baris 46-52.
- Risiko: dua operator menjalankan migration atau deploy bersamaan.
  - Mitigasi: pakai `concurrency` per workflow dan GitHub Environment approval.
- Risiko: Prisma CLI tidak tersedia pada job tertentu bila hanya mengandalkan runtime platform.
  - Mitigasi: seluruh migration dijalankan di GitHub Actions setelah `pnpm install`, bukan di runtime Vercel, selaras dengan rekomendasi Prisma production workflow.

# Notes from official docs
- Prisma mendokumentasikan bahwa `migrate deploy` adalah command yang tepat untuk staging/production dan idealnya dijalankan sebagai bagian dari CI/CD pipeline: [Prisma docs](https://docs.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production), [Prisma migrate deploy reference](https://docs.prisma.io/docs/cli/migrate/deploy), [Prisma deploy guide](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate).
- Vercel mendokumentasikan pola GitHub Actions berbasis `vercel pull`, `vercel build`, dan `vercel deploy --prebuilt` untuk preview dan production deployment: [Vercel GitHub guide](https://vercel.com/docs/git/vercel-for-github), [Vercel GitHub Actions KB](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel), [Vercel CLI build](https://vercel.com/docs/cli/build), [Vercel CLI deploy](https://vercel.com/docs/cli/deploy).