# Rencana Pemisahan Form Tambah dan Tahap 1 Fitur Edit Data

## Summary
- Pisahkan semua form create yang saat ini masih inline di halaman list menjadi halaman dedicated.
- Gunakan konvensi route:
  - `/wilayah/tambah`
  - `/jamaah/tambah`
  - `/kas-masuk/tambah`
  - `/kas-keluar/tambah`
  - `/iuran/pembayaran/tambah`
  - `/iuran/tagihan/generate` untuk aksi generate tagihan
- Tahap 1 fitur edit hanya mencakup:
  - `Wilayah`
  - `Jamaah`
  - `Kas Masuk` dengan status `DRAFT`
  - `Kas Keluar` dengan status `DRAFT`
- `Pembayaran Iuran` belum masuk scope edit karena sudah berelasi ke `IncomeTransaction`, `CashLedger`, dan `receiptNumber` unik, sehingga perubahan historisnya butuh aturan reversal yang berbeda.

## Current State Analysis
- Semua form create masih ditanam langsung di halaman list:
  - `src/app/(app)/wilayah/page.tsx`
  - `src/app/(app)/jamaah/page.tsx`
  - `src/app/(app)/kas-masuk/page.tsx`
  - `src/app/(app)/kas-keluar/page.tsx`
  - `src/app/(app)/iuran/pembayaran/page.tsx`
  - `src/app/(app)/iuran/tagihan/page.tsx` untuk generate tagihan
- Halaman list saat ini sudah memuat:
  - search
  - filter
  - pagination
  - responsive table
- Belum ada:
  - route detail/create per resource
  - route edit per resource
  - kolom aksi `Tambah`/`Edit` berbasis route
- Server action create juga masih bercampur di file list page, sehingga form list dan form dedicated belum bisa berbagi logic dengan bersih.
- Permission yang tersedia sudah cukup untuk tahap ini, tidak perlu perubahan RBAC:
  - `MANAGE_REGIONS`
  - `MANAGE_HOUSEHOLDS`
  - `MANAGE_INCOME`
  - `MANAGE_EXPENSES`
  - `MANAGE_CONTRIBUTIONS`

## Proposed Changes

### 1. Jadikan halaman list fokus ke daftar data
- Ubah halaman list berikut agar hanya menampilkan:
  - `PageHeader`
  - tombol CTA ke halaman dedicated
  - search/filter/pagination
  - tabel data + kolom aksi
- File yang diubah:
  - `src/app/(app)/wilayah/page.tsx`
  - `src/app/(app)/jamaah/page.tsx`
  - `src/app/(app)/kas-masuk/page.tsx`
  - `src/app/(app)/kas-keluar/page.tsx`
  - `src/app/(app)/iuran/pembayaran/page.tsx`
  - `src/app/(app)/iuran/tagihan/page.tsx`

### 2. Tambahkan route dedicated untuk create
- Tambah halaman baru:
  - `src/app/(app)/wilayah/tambah/page.tsx`
  - `src/app/(app)/jamaah/tambah/page.tsx`
  - `src/app/(app)/kas-masuk/tambah/page.tsx`
  - `src/app/(app)/kas-keluar/tambah/page.tsx`
  - `src/app/(app)/iuran/pembayaran/tambah/page.tsx`
  - `src/app/(app)/iuran/tagihan/generate/page.tsx`
- Pola UI tiap halaman:
  - `PageHeader` dengan judul aksi
  - tombol kembali ke halaman list
  - satu card form utama
  - submit sukses -> redirect ke halaman list terkait

### 3. Ekstrak server action per domain
- Pindahkan server action dari list page ke file route-level agar bisa dipakai ulang oleh page create dan edit:
  - `src/app/(app)/wilayah/actions.ts`
  - `src/app/(app)/jamaah/actions.ts`
  - `src/app/(app)/kas-masuk/actions.ts`
  - `src/app/(app)/kas-keluar/actions.ts`
  - `src/app/(app)/iuran/pembayaran/actions.ts`
  - `src/app/(app)/iuran/tagihan/actions.ts`
- Isi file action:
  - create action
  - update action untuk resource yang masuk scope edit
  - helper revalidate path yang konsisten

### 4. Buat komponen form reusable per domain
- Tambahkan komponen form agar create dan edit memakai field yang sama:
  - `src/app/(app)/wilayah/_components/region-form.tsx`
  - `src/app/(app)/jamaah/_components/household-form.tsx`
  - `src/app/(app)/kas-masuk/_components/income-form.tsx`
  - `src/app/(app)/kas-keluar/_components/expense-form.tsx`
  - `src/app/(app)/iuran/pembayaran/_components/payment-form.tsx`
  - `src/app/(app)/iuran/tagihan/_components/generate-bills-form.tsx`
- Prinsip form:
  - menerima `mode: "create" | "edit"` untuk resource yang di-edit
  - menerima `defaultValues`
  - tombol submit dan judul menyesuaikan mode
  - validasi server tetap jadi source of truth

### 5. Rute dan perilaku edit tahap 1
- Tambah route edit:
  - `src/app/(app)/wilayah/[id]/edit/page.tsx`
  - `src/app/(app)/jamaah/[id]/edit/page.tsx`
  - `src/app/(app)/kas-masuk/[id]/edit/page.tsx`
  - `src/app/(app)/kas-keluar/[id]/edit/page.tsx`

#### 5.1 Wilayah
- Edit field:
  - `name`
  - `description`
  - `isActive`
- Guard:
  - data `deletedAt: null`
  - nama tetap unik
- Update list table:
  - tambah kolom aksi dengan link `Edit`

#### 5.2 Jamaah
- Edit field:
  - `headName`
  - `address`
  - `rt`
  - `rw`
  - `regionId`
  - `status`
  - `isDisabled`
  - `isElderly`
  - `notes`
- Keputusan:
  - create page tetap minimal mengikuti field create saat ini
  - form edit boleh lebih lengkap karena schema dan filter yang ada memang sudah mendukung field tersebut
- Update list table:
  - tambah kolom aksi dengan link `Edit`

#### 5.3 Kas Masuk
- Edit hanya untuk `IncomeTransaction.status === DRAFT`
- Edit field:
  - `transactionDate`
  - `categoryId`
  - `sourceName`
  - `amount`
  - `method`
  - `description`
  - `status`
- Guard:
  - jika record bukan `DRAFT`, halaman edit tampilkan state terblokir atau redirect ke list dengan query error
  - record `VERIFIED` tidak boleh diedit karena sudah dapat memicu ledger
- Update list table:
  - kolom aksi `Edit` hanya muncul untuk `DRAFT`

#### 5.4 Kas Keluar
- Edit hanya untuk `ExpenseTransaction.status === DRAFT`
- Edit field:
  - `transactionDate`
  - `categoryId`
  - `payeeName`
  - `amount`
  - `method`
  - `description`
  - `status`
- Guard:
  - sama seperti kas masuk, record non-`DRAFT` tidak boleh diedit
- Update list table:
  - kolom aksi `Edit` hanya muncul untuk `DRAFT`

### 6. Detail perubahan per file

#### `src/app/(app)/wilayah/page.tsx`
- hapus card form tambah inline
- tambahkan CTA `Tambah Wilayah` ke `/wilayah/tambah`
- tambahkan kolom aksi `Edit`

#### `src/app/(app)/jamaah/page.tsx`
- hapus form tambah inline
- tambahkan CTA `Tambah Jamaah` ke `/jamaah/tambah`
- tambahkan kolom aksi `Edit`

#### `src/app/(app)/kas-masuk/page.tsx`
- hapus form tambah inline
- tambahkan CTA `Tambah Kas Masuk` ke `/kas-masuk/tambah`
- tambahkan kolom aksi `Edit` hanya untuk `DRAFT`

#### `src/app/(app)/kas-keluar/page.tsx`
- hapus form tambah inline
- tambahkan CTA `Tambah Kas Keluar` ke `/kas-keluar/tambah`
- tambahkan kolom aksi `Edit` hanya untuk `DRAFT`

#### `src/app/(app)/iuran/pembayaran/page.tsx`
- hapus form input pembayaran inline
- tambahkan CTA `Input Pembayaran` ke `/iuran/pembayaran/tambah`
- belum menambahkan aksi edit

#### `src/app/(app)/iuran/tagihan/page.tsx`
- hapus form generate inline
- tambahkan CTA `Generate Tagihan` ke `/iuran/tagihan/generate`
- tabel tetap list-only

#### `src/app/(app)/layout.tsx`
- tidak mengubah sidebar utama
- cukup andalkan CTA per halaman, tidak menambah item sidebar baru untuk `Tambah`/`Edit`

### 7. Strategi data loading untuk create/edit pages
- Create page:
  - load reference data yang diperlukan saja
  - contoh: region list, category list, bill list
- Edit page:
  - `findUniqueOrThrow` berdasarkan `id`
  - validasi permission di awal
  - map data database ke `defaultValues`
- Reference data per resource:
  - `jamaah`: `Region`
  - `kas-masuk`: `TransactionCategory` type `INCOME`
  - `kas-keluar`: `TransactionCategory` type `EXPENSE`
  - `pembayaran`: `ContributionBill` aktif

## Assumptions & Decisions
- Konvensi route create adalah `/tambah` untuk resource CRUD biasa.
- `Generate Tagihan` memakai `/generate`, bukan `/tambah`, karena secara bisnis ini adalah aksi batch, bukan create manual satu record.
- Edit tahap 1 tidak mencakup `Pembayaran Iuran`.
- Edit transaksi hanya dibuka untuk status `DRAFT` agar tidak merusak histori keuangan yang sudah terverifikasi.
- Tidak ada perubahan schema Prisma pada tahap ini.
- Tidak ada perubahan permission enum atau role mapping pada tahap ini.
- Tidak menambah item sidebar khusus untuk create/edit; navigasi cukup melalui tombol CTA di halaman list dan tombol kembali di halaman form.

## Verification Steps
1. Pastikan setiap halaman list tetap menampilkan search, filter, pagination, dan tabel tanpa form inline.
2. Pastikan CTA menuju route dedicated benar:
   - `/wilayah/tambah`
   - `/jamaah/tambah`
   - `/kas-masuk/tambah`
   - `/kas-keluar/tambah`
   - `/iuran/pembayaran/tambah`
   - `/iuran/tagihan/generate`
3. Pastikan create dari halaman dedicated berhasil lalu kembali ke list yang benar.
4. Pastikan halaman edit berikut bisa membuka data existing:
   - `/wilayah/[id]/edit`
   - `/jamaah/[id]/edit`
   - `/kas-masuk/[id]/edit`
   - `/kas-keluar/[id]/edit`
5. Pastikan tombol `Edit` hanya tampil pada:
   - semua baris `Wilayah`
   - semua baris `Jamaah`
   - `Kas Masuk` status `DRAFT`
   - `Kas Keluar` status `DRAFT`
6. Pastikan akses edit transaksi non-`DRAFT` ditolak dengan perilaku yang jelas.
7. Jalankan verifikasi teknis:
   - `./node_modules/.bin/tsc --noEmit`
   - `./node_modules/.bin/eslint .`
   - `AUTH_SECRET="dev-secret" AUTH_TRUST_HOST="true" DATABASE_URL="postgresql://nizar@localhost:5432/sismata" ./node_modules/.bin/next build`
