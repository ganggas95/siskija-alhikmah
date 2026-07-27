# Architecture

## Ringkasan

SISKIJA AL-HIKMAH dibangun sebagai aplikasi web internal single-repo berbasis Next.js App Router. Target pengguna utamanya adalah bendahara dan pengurus masjid non-teknis, sehingga desainnya menekankan form sederhana, tabel yang mudah dibaca, dan otorisasi server-side yang ketat.

## Layer Utama

- `src/app`: route, layout, server action ringan, dan entry UI
- `src/modules`: business service per domain
- `src/lib`: utilitas lintas domain seperti database, RBAC, audit, formatting uang
- `prisma`: source of truth model data dan seed

## Domain MVP

1. Auth dan RBAC
2. Master wilayah
3. Master kepala keluarga
4. Tagihan iuran
5. Pembayaran iuran
6. Kas masuk non-iuran
7. Kas keluar
8. Cash ledger
9. Dashboard dan laporan dasar

## User Flow Utama

1. Pengguna login dengan email dan password.
2. Bendahara mengelola wilayah dan data kepala keluarga.
3. Bendahara generate tagihan bulanan.
4. Bendahara mencatat pembayaran iuran.
5. Sistem membuat income transaction dan ledger dalam satu transaction database.
6. Bendahara mencatat kas masuk dan kas keluar lain.
7. Verifikasi transaksi memperbarui ledger aktif.
8. Dashboard, buku kas, dan laporan membaca data ledger dan transaksi terverifikasi.

## Keputusan Penting

- saldo kas dibaca dari `CashLedger`, bukan angka cache di frontend
- nominal disimpan sebagai `Decimal` Prisma
- Auth.js memakai credentials + JWT session agar MVP internal tetap sederhana
- complex financial workflow ditempatkan di `src/modules/*/services`
