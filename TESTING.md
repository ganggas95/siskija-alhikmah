# Testing

## Ringkasan

Suite test saat ini terdiri dari unit/integration test berbasis Vitest dan e2e test berbasis Playwright. Cakupan sudah cukup untuk helper penting, import/export, dan sebagian workflow iuran, tetapi belum mencakup seluruh requirement awal proyek.

## Command yang aktif

```bash
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm lint
pnpm type-check
```

## Unit dan integration test yang sudah ada

### Utilitas umum

- `src/lib/money.test.ts`
  - format nominal
  - parsing/penanganan uang
- `src/components/app/request-state.test.ts`
  - helper state request UI

### Jamaah

- `src/modules/households/filters.test.ts`
  - pembentukan filter query jamaah
- `src/modules/households/imports/import-households.test.ts`
  - validasi import jamaah
  - alokasi kode jamaah
  - handling duplicate/invalid row

### Iuran

- `src/modules/contributions/services/approve-payment.test.ts`
  - logika derive status tagihan
  - workflow approve/cancel pembayaran draft
- `src/modules/contributions/imports/import-contribution-payments.test.ts`
  - parsing dan workflow import pembayaran iuran
- `src/modules/contributions/exports/export-contribution-payments.test.ts`
  - pembentukan row export rekap pembayaran
- `src/modules/contributions/exports/xlsx.test.ts`
  - workbook export XLSX
- `src/modules/contributions/exports/xlsx-template.test.ts`
  - template workbook

### API route

- `src/app/api/jamaah/import/route.test.ts`
- `src/app/api/jamaah/import-template/route.test.ts`
- `src/app/api/jamaah/export-pembayaran/route.test.ts`

Fokus test API saat ini adalah validasi request, permission guard, dan respons route.

## E2E yang sudah ada

- `tests/e2e/mvp-flow.spec.ts`

Skenario yang diuji:

- halaman login tampil
- login admin berhasil dan dashboard tampil
- layout mobile tampil benar
- drawer mobile tersedia
- shortcut aksi cepat tampil
- dashboard mobile menampilkan card, bukan tabel

Catatan: file ini belum menguji alur end-to-end penuh seperti generate tagihan -> bayar -> verifikasi -> cek saldo.

## Prasyarat menjalankan test

### Untuk Vitest

- dependency sudah ter-install
- environment database hanya dibutuhkan untuk test yang menyentuh layer terkait; sebagian besar suite saat ini fokus pada helper/import/export dan mockable logic

### Untuk Playwright

- aplikasi dapat dijalankan di `http://127.0.0.1:3000`
- Playwright config akan menjalankan `pnpm dev` otomatis melalui `webServer`
- akun seed harus tersedia:
  - `admin@sismata.local`
  - `bendahara@sismata.local`
  - password `Password123!`

## Quality gate yang disarankan

Sebelum merge perubahan besar:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
```

## Gap testing yang masih terbuka

- belum ada test khusus untuk `verify-income.ts`
- belum ada test khusus untuk `verify-expense.ts`
- belum ada test khusus untuk `cancel-transaction.ts`
- belum ada integration test ledger running balance end-to-end
- belum ada test khusus auth lockout
- belum ada e2e penuh untuk workflow bendahara
- belum ada test deployment smoke / production startup

## Prioritas penambahan test berikutnya

1. workflow kas masuk draft -> verify -> ledger
2. workflow kas keluar draft -> verify -> saldo berkurang
3. cancel transaction dan reversal ledger
4. generate monthly bills
5. auth lockout dan RBAC negative cases
