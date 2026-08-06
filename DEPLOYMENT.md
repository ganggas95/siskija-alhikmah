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
pnpm db:migrate
```

Untuk server production yang ketat, evaluasi ulang penggunaan `prisma migrate dev` karena script saat ini masih mengarah ke command development Prisma. Bila perlu, siapkan script deploy migration terpisah sebelum rollout production multi-user.

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
- jika Supabase aktif, uji upload logo kecil berformat PNG/JPG/WEBP
- verifikasi query database dan koneksi Prisma normal

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

Script `pnpm db:migrate` memakai `prisma migrate dev`, yang nyaman untuk development tetapi bukan alur deploy production yang paling ketat. Untuk environment production bersama, sebaiknya tambahkan script deploy migration terpisah sebelum scale-up.

### Login lockout

Lockout login masih in-memory per process. Pada deployment multi-instance, perilaku lockout tidak konsisten antar instance.

### Upload dependency

Upload logo gagal bila env Supabase tidak lengkap atau service role key salah.

## Kaitan dengan README

README menjelaskan setup lokal dan status scope aplikasi. Dokumen ini fokus pada alur deploy manual production yang benar-benar didukung oleh file dan script di repository saat ini.
