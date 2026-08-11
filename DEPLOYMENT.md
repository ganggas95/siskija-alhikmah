# Deployment

## Status deployment saat ini

Repository ini sudah bisa dijalankan sebagai aplikasi Next.js production standar dengan PostgreSQL dan Prisma. Deployment saat ini masih manual. Docker, Docker Compose, dan health check endpoint khusus belum tersedia di repo.

## Komponen yang dibutuhkan

- Node.js 22+
- pnpm
- PostgreSQL
- environment variable aplikasi
- opsional: Supabase Storage untuk upload logo organisasi

## Environment production

Template production tersedia di `.env.production.example`.

Variabel utama:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`
- `APP_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

Catatan:

- `POSTGRES_PRISMA_URL` dipakai runtime Prisma
- `POSTGRES_URL_NON_POOLING` dipakai untuk migrate/direct connection
- `AUTH_SECRET` harus diganti dengan secret acak yang panjang

## Langkah deployment manual

### 1. Install dependency

```bash
pnpm install
```

### 2. Generate Prisma client

```bash
pnpm db:generate
```

### 3. Jalankan migration

```bash
pnpm db:migrate:deploy
```

Untuk production, shared staging, atau environment multi-user, jangan gunakan `pnpm db:migrate` karena script itu menjalankan `prisma migrate dev`.

Gunakan pembagian berikut:

- `pnpm db:migrate` untuk development lokal
- `pnpm db:migrate:deploy` untuk deployment non-development

### 4. Seed data awal bila diperlukan

```bash
pnpm db:seed
```

Seed saat ini membuat:

- role dan permission
- tiga akun demo/internal
- kategori transaksi dasar
- profil masjid default
- contribution setting default

### 5. Build aplikasi

```bash
pnpm build
```

Script build saat ini menjalankan:

- `prisma generate`
- `next build`

### 6. Jalankan aplikasi

```bash
pnpm start
```

## Rekomendasi urutan rollout

1. siapkan database production
2. isi environment variable production
3. install dependency
4. generate Prisma client
5. jalankan migration
6. seed awal jika database masih kosong
7. build
8. start aplikasi
9. verifikasi login admin dan akses dashboard

## Supabase Storage

Supabase hanya dibutuhkan jika fitur upload logo organisasi akan dipakai.

Jika tidak dipakai:

- kosongkan env Supabase
- hindari upload logo dari UI production

Jika dipakai:

- bucket default: `organization-assets`
- service role key harus hanya tersedia di server

## Verifikasi pasca deploy

- buka `/login`
- login dengan akun admin yang valid
- cek `/dashboard`
- cek halaman `/pengaturan/profil-masjid`
- cek query `MosqueProfile` tidak lagi gagal pada field `specialContributionFee`
- jika Supabase aktif, uji upload logo kecil berformat PNG/JPG/WEBP
- verifikasi query database dan koneksi Prisma normal

## Recovery mismatch schema `MosqueProfile.specialContributionFee`

Kasus ini relevan bila aplikasi gagal dengan Prisma `P2022` karena kolom `specialContributionFee` belum ada di database runtime.

Checklist recovery:

1. pastikan `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING` menunjuk database yang sama
2. cek status migration:

```bash
pnpm prisma migrate status
```

3. deploy migration repository:

```bash
pnpm db:migrate:deploy
pnpm db:generate
```

4. verifikasi migration `20260803100000_organization_contribution_settings` sudah applied
5. verifikasi tabel `MosqueProfile` sudah memiliki:
   - `organizationName`
   - `specialContributionFee` bertipe `DECIMAL(18,2)`
6. verifikasi data existing memiliki nilai `specialContributionFee` yang valid
7. restart aplikasi lalu uji:
   - `/pengaturan/profil-masjid`
   - dashboard
   - flow iuran yang membaca konfigurasi fee default

Jika migration history menyatakan applied tetapi kolom belum ada, perlakukan sebagai drift schema atau mismatch database target. Rekonsiliasi tabel `_prisma_migrations` dan koneksi database sebelum rollout dilanjutkan.

## Yang belum tersedia

- Dockerfile
- `docker-compose.yml`
- health check endpoint khusus
- reverse proxy config di repo
- automated backup
- restore script
- zero-downtime migration flow khusus production

## Risiko deployment saat ini

### Script migration

Script `pnpm db:migrate` memakai `prisma migrate dev`, yang nyaman untuk development tetapi tidak boleh dijadikan alur deploy production. Deployment harus memakai `pnpm db:migrate:deploy` agar migration repository diterapkan tanpa workflow development Prisma.

### Login lockout

Lockout login masih in-memory per process. Pada deployment multi-instance, perilaku lockout tidak konsisten antar instance.

### Upload dependency

Upload logo gagal bila env Supabase tidak lengkap atau service role key salah.

## Kaitan dengan README

README menjelaskan setup lokal dan status scope aplikasi. Dokumen ini fokus pada alur deploy manual production yang benar-benar didukung oleh file dan script di repository saat ini.
