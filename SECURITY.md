# Security

## Kontrol MVP

- password di-hash dengan `bcryptjs`
- login memakai Auth.js credentials
- session strategy memakai JWT
- seluruh route aplikasi berada di bawah layout yang mewajibkan session
- operasi mutasi memanggil `requirePermission(...)`
- input sensitif finansial diproses di server
- Prisma mencegah SQL injection raw-query pada MVP ini

## Aturan Otorisasi

- `ADMIN`: seluruh permission
- `TREASURER`: mutasi operasional dan verifikasi transaksi
- `AUDITOR`: hanya baca laporan dan audit

## Catatan Operasional

- `AUTH_SECRET` wajib diisi di environment
- gunakan `.env.development.local` untuk database lokal saat development
- gunakan `.env.production.local` atau environment variable host untuk production
- jangan commit `.env`, `.env.local`, `.env.development.local`, atau `.env.production.local`
- role UI tidak boleh dijadikan satu-satunya kontrol akses
- untuk fase setelah MVP perlu ditambahkan rate limiting login, upload validation, dan hardening cookie/session
