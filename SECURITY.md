# Security

## Kontrol yang aktif saat ini

### Authentication

- Login memakai Auth.js credentials provider
- Validasi input login memakai Zod
- Password diverifikasi dengan `bcryptjs.compare`
- Session strategy memakai JWT
- `maxAge` session: 12 jam
- `updateAge` session: 1 jam
- halaman login dipusatkan di `/login`

### Login lockout

Proteksi brute force yang aktif saat ini bersifat in-memory:

- maksimum 5 kegagalan login
- lock window 15 menit
- key lockout berdasarkan email yang dinormalisasi

Implikasi:

- proteksi ini hanya berlaku per proses aplikasi
- pada multi-instance deployment, lockout tidak tersinkron antar instance
- restart proses akan menghapus state lockout

### Authorization

- seluruh route aplikasi berada di bawah session gate
- `requireSession()` memastikan sesi valid dan user masih aktif di database
- `requirePermission()` menjadi gate server-side untuk page dan action
- API route import/export memeriksa permission dari sesi secara eksplisit
- UI permission bukan satu-satunya kontrol; backend tetap memverifikasi role

Role matrix yang aktif:

- `ADMIN`: semua permission
- `TREASURER`: operasional wilayah, jamaah, iuran, kas masuk, kas keluar, verifikasi transaksi, laporan
- `AUDITOR`: baca laporan dan audit log permission-level

## Validasi input

- Form mutasi utama memakai Zod di server action
- Nominal kas masuk, kas keluar, dan pembayaran iuran harus lebih besar dari nol
- Validasi kategori memastikan tipe `INCOME` tidak dipakai untuk `EXPENSE`, dan sebaliknya
- Prisma dipakai untuk menghindari query SQL string-building manual

## Keamanan transaksi finansial

- workflow finansial penting berjalan dalam `db.$transaction(...)`
- verifikasi kas keluar menghitung saldo dari ledger aktif sebelum approval
- pembatalan transaksi melakukan reversal ledger, bukan penghapusan histori saldo
- tagihan dan pembayaran memiliki unique constraint untuk mencegah duplikasi penting

## Upload dan storage

Kontrol upload yang aktif saat ini baru untuk logo organisasi:

- MIME yang diizinkan:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
- ukuran maksimum: 2 MB
- upload memakai Supabase Storage dengan service role key
- signed URL dipakai untuk membaca logo

Risiko operasional:

- service role key memberi akses tinggi dan harus disimpan hanya di environment server
- fitur upload transaksi umum belum ada, jadi belum ada hardening upload untuk bukti pengeluaran/pemasukan

## Audit

- operasi penting menulis `AuditLog`
- action audit yang aktif meliputi generate tagihan, record/approve/cancel pembayaran iuran, verifikasi kas, import jamaah, export rekap pembayaran, dan update profil masjid
- password, token, dan rahasia autentikasi tidak ditulis ke audit log

## Secret management

Environment penting:

- `AUTH_SECRET`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Rahasia belum dikelola oleh tooling khusus di repo ini. Pengelolaan secret masih bergantung pada environment host/deployment.

## Yang belum lengkap

- rate limiting login terdistribusi
- CSRF hardening khusus di luar default surface Next/Auth yang dipakai
- secret rotation policy
- upload scanning/virus scanning
- generic attachment security untuk transaksi
- audit log viewer UI
- centralized security monitoring
- multi-instance aware lockout

## Catatan implementasi

- jangan mengandalkan visibilitas tombol UI untuk mencegah mutasi
- jangan menjalankan app production dengan `AUTH_SECRET` placeholder
- jika Supabase env tidak tersedia, nonaktifkan ekspektasi upload logo di lingkungan tersebut
