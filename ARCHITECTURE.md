# Architecture

## Ringkasan

SISKIJA AL-HIKMAH adalah aplikasi monorepo Next.js full-stack. Implementasi saat ini berfokus pada operasional inti bendahara: pengelolaan data master, pencatatan pemasukan/pengeluaran, iuran jamaah, dan pelaporan dasar. Seluruh mutasi penting berjalan di server dan operasi finansial utama memakai transaksi database Prisma.

## Lapisan aplikasi

### App Router

`src/app` menangani:

- page dan layout
- proteksi session awal
- form submission
- server action yang tipis
- route API untuk import/export

Page dan action tidak menjadi tempat business rule finansial yang kompleks. Mereka memanggil service domain atau helper bersama.

### Service layer

`src/modules/*/services` memegang workflow bisnis yang membutuhkan konsistensi data:

- generate tagihan bulanan
- pencatatan pembayaran iuran
- approve/cancel pembayaran iuran
- verifikasi kas masuk
- verifikasi kas keluar
- pembatalan transaksi dan reversal ledger

Layer ini menjadi tempat yang paling penting untuk perubahan aturan bisnis.

### Shared library

`src/lib` memegang utilitas lintas domain:

- `db.ts`: Prisma client
- `rbac.ts`: session dan permission gate
- `audit.ts`: penulisan audit log
- `money.ts`: format dan helper nominal
- `supabase-storage.ts`: validasi dan upload logo
- helper filter/sort/pagination tabel

### Database layer

`prisma/schema.prisma` adalah sumber kebenaran struktur data. Prisma dipakai sebagai boundary akses database, dan transaksi finansial dibungkus `db.$transaction(...)`.

## Boundary domain

- Auth & access: `User`, `Role`, `Permission`, `UserRole`
- Organisasi: `MosqueProfile`, `SystemSetting`
- Master data: `Region`, `Household`
- Iuran: `ContributionSetting`, `ContributionBill`, `ContributionPayment`, `ImportBatch`
- Kas: `TransactionCategory`, `IncomeTransaction`, `ExpenseTransaction`
- Ledger: `CashLedger`
- Audit & storage metadata: `AuditLog`, `Attachment`

## Auth dan otorisasi

- Login memakai Auth.js credentials provider
- Password diverifikasi dengan bcrypt
- Session strategy memakai JWT
- `requireSession()` memastikan user aktif dan punya sesi valid
- `requirePermission(permission)` menjadi gate server-side untuk route dan action

Role yang aktif saat ini:

- `ADMIN`
- `TREASURER`
- `AUDITOR`

## Alur transaksi utama

## 1. Generate tagihan bulanan

1. User dengan `MANAGE_CONTRIBUTIONS` memilih bulan dan tahun.
2. Service `generateMonthlyBills` mengambil semua `Household` aktif dan tidak soft-deleted.
3. Nominal tagihan dihitung dari konfigurasi iuran aktif.
4. `ContributionBill.createMany(..., skipDuplicates: true)` membuat tagihan baru.
5. Audit log `GENERATE_BILLS` disimpan.

## 2. Record pembayaran iuran manual

1. Action memvalidasi input dengan Zod.
2. Service `recordContributionPayment` mengambil tagihan dan memastikan tagihan tidak dibatalkan/dibebaskan.
3. Sistem membuat `IncomeTransaction` kategori `Iuran Jamaah`.
4. Sistem membuat `ContributionPayment` dengan `receiptNumber` unik.
5. Jika status pembayaran `VERIFIED`, sistem mem-post ledger `DEBIT`.
6. Status tagihan dihitung ulang dari total pembayaran.
7. Audit log pembayaran disimpan.

## 3. Approve pembayaran iuran draft

Workflow ini dipakai terutama untuk hasil import Excel:

1. Service mengambil `ContributionPayment` status `DRAFT`.
2. Sistem membuat `IncomeTransaction` terverifikasi.
3. Relasi one-to-one `ContributionPayment.incomeTransactionId` diisi.
4. Sistem mem-post ledger `DEBIT`.
5. Status tagihan diperbarui.
6. Audit log approval disimpan.

## 4. Verifikasi kas masuk non-iuran

1. User membuat `IncomeTransaction` dengan status draft.
2. `verifyIncome` memastikan kategori bertipe `INCOME`.
3. Status transaksi diubah ke `VERIFIED`.
4. Ledger `DEBIT` dibuat untuk sumber `INCOME_TRANSACTION`.
5. Audit log verifikasi disimpan.

## 5. Verifikasi kas keluar

1. User membuat `ExpenseTransaction` draft atau pending.
2. `verifyExpense` memastikan kategori bertipe `EXPENSE`.
3. Service menghitung saldo saat ini dari ledger aktif.
4. Jika saldo cukup, status diubah menjadi `VERIFIED`.
5. Ledger `CREDIT` dibuat untuk sumber `EXPENSE_TRANSACTION`.
6. Audit log verifikasi disimpan.

## 6. Cancel atau reversal transaksi

- Pembatalan kas masuk/kas keluar memakai `cancelTransaction`
- Pembatalan pembayaran iuran memakai `cancelContributionPayment`
- Jika transaksi/pembayaran sudah memengaruhi kas, sistem membuat reversal ledger dengan `sourceType = REVERSAL`
- Histori lama tidak dihapus; saldo berubah lewat entry reversal

## Ledger sebagai source of truth

`CashLedger` adalah source of truth saldo kas.

Aturan yang aktif saat ini:

- `DEBIT` menambah saldo
- `CREDIT` mengurangi saldo
- dashboard membaca agregasi ledger aktif
- halaman buku kas menghitung running balance dari urutan ledger
- reversal tidak menonaktifkan entry asal; reversal menambah entry lawan arah

Implikasinya:

- jangan simpan saldo final di frontend
- jangan hitung saldo dari tabel pemasukan/pengeluaran saja
- setiap perubahan finansial harus sinkron ke ledger

## Import dan export

### Import jamaah

- API route menerima file XLSX dan `regionId`
- validasi format header dan ukuran file
- import berjalan dalam transaksi serializable
- audit log import disimpan

### Import pembayaran iuran

- API route menerima XLSX tahunan
- sistem membuat atau melanjutkan `ImportBatch`
- tersedia mode progress stream dan mode polling status batch
- hasil import dapat membuat pembayaran draft/verified sesuai logika import

### Export

- saat ini export yang aktif adalah export rekap pembayaran jamaah ke XLSX
- export mencatat audit log

## Komponen UI dan akses

- layout aplikasi membangun navigasi berdasarkan permission
- halaman auditor tetap melewati filter permission server-side
- mobile dan desktop memakai tampilan berbeda, tetapi data sumber sama

## Prinsip implementasi yang sudah terlihat di codebase

- validasi input dilakukan di server
- numbering transaksi dan receipt dipusatkan di helper bersama
- log audit ditulis eksplisit pada workflow penting
- business rule finansial diletakkan di service, bukan di komponen React
- saldo selalu diturunkan dari ledger
