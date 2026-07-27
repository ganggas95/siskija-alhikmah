# PROMPT AI AGENTIC CODER

## Sistem Informasi Keuangan dan Iuran Jamaah Masjid

Anda adalah seorang **Senior Full-stack Engineer, Software Architect, dan Product Engineer**. Tugas Anda adalah merancang dan membangun aplikasi web untuk membantu bendahara takmir masjid mengelola:

1. Data kepala keluarga jamaah.
2. Iuran jamaah bulanan.
3. Kas masuk selain iuran.
4. Kas keluar atau pengeluaran masjid.
5. Laporan dan rekapitulasi keuangan masjid.

Aplikasi harus dibangun menggunakan **Next.js full-stack** dalam satu repository dan terhubung langsung dengan database.

---

# 1. Konteks Sistem

Saat ini pencatatan keuangan masjid masih dilakukan secara manual. Bendahara membutuhkan sistem yang sederhana, jelas, dan mudah digunakan untuk mencatat seluruh arus kas.

Salah satu sumber utama kas masuk adalah iuran jamaah bulanan. Setiap keluarga akan diwakili oleh satu kepala keluarga. Selain iuran bulanan, pemasukan masjid juga dapat berasal dari:

- Sedekah.
- Kotak amal.
- Sewa aset atau tanah wakaf.
- Donasi kegiatan.
- Bantuan lembaga.
- Sumber pemasukan lainnya.

Kas keluar dapat digunakan untuk:

- Biaya listrik.
- Biaya air.
- Honor imam, marbot, khatib, atau petugas lainnya.
- Kegiatan keagamaan.
- Perawatan masjid.
- Pembelian perlengkapan.
- Santunan sosial.
- Pengeluaran operasional lainnya.

Sistem tidak perlu menyimpan data sensitif seperti NIK, nomor kartu keluarga, informasi kesehatan detail, atau dokumen identitas.

---

# 2. Tujuan Utama

Bangun aplikasi yang memungkinkan pengurus masjid:

- Mengetahui saldo kas masjid secara real-time.
- Melihat total kas masuk dan kas keluar.
- Mengetahui kepala keluarga yang sudah atau belum membayar iuran.
- Mencatat pembayaran iuran bulanan.
- Mencatat pemasukan non-iuran.
- Mencatat pengeluaran masjid.
- Melihat riwayat transaksi.
- Membuat laporan bulanan dan tahunan.
- Mencetak atau mengekspor laporan.
- Memiliki jejak audit perubahan data.

Prioritaskan kemudahan penggunaan bagi pengguna yang tidak memiliki latar belakang teknis.

---

# 3. Teknologi

Gunakan teknologi berikut:

- Next.js versi stabil terbaru.
- App Router.
- TypeScript strict mode.
- React Server Components jika sesuai.
- Server Actions atau Route Handlers untuk operasi server.
- PostgreSQL sebagai database utama.
- Prisma ORM.
- Zod untuk validasi.
- Tailwind CSS.
- shadcn/ui untuk komponen antarmuka.
- React Hook Form untuk formulir kompleks.
- TanStack Table untuk tabel data.
- Recharts untuk visualisasi sederhana.
- Auth.js atau sistem autentikasi aman yang sesuai.
- bcrypt atau Argon2 untuk password hashing.
- Vitest atau Jest untuk unit test.
- Playwright untuk end-to-end test.

Jangan membuat backend terpisah kecuali benar-benar diperlukan. Gunakan kemampuan full-stack Next.js dalam satu aplikasi.

---

# 4. Jenis Pengguna

## 4.1 Administrator

Administrator dapat:

- Mengelola akun pengguna.
- Mengatur profil masjid.
- Mengelola kategori transaksi.
- Mengelola data kepala keluarga.
- Mengelola iuran.
- Mengelola kas masuk dan kas keluar.
- Melihat seluruh laporan.
- Melihat audit log.
- Mengubah pengaturan sistem.

## 4.2 Bendahara

Bendahara dapat:

- Mengelola data kepala keluarga.
- Mencatat pembayaran iuran.
- Mencatat kas masuk.
- Mencatat kas keluar.
- Mengubah transaksi yang masih diizinkan.
- Melihat dashboard.
- Membuat dan mencetak laporan.

## 4.3 Ketua Takmir atau Auditor

Ketua takmir atau auditor memiliki akses baca untuk:

- Melihat dashboard.
- Melihat data jamaah.
- Melihat transaksi.
- Melihat laporan.
- Melihat audit log.

Pengguna ini tidak boleh mengubah transaksi keuangan.

Gunakan sistem **Role-Based Access Control**.

---

# 5. Modul Data Kepala Keluarga

Setiap keluarga jamaah diwakili oleh satu kepala keluarga.

Data yang dicatat:

- ID.
- Kode jamaah otomatis.
- Nama kepala keluarga.
- Alamat.
- RT.
- RW.
- Wilayah atau dusun.
- Status disabilitas.
- Status lansia.
- Status keaktifan jamaah.
- Tanggal mulai terdaftar.
- Catatan opsional.
- Tanggal dibuat.
- Tanggal diperbarui.
- Pengguna yang membuat atau memperbarui data.

Ketentuan:

- Nama wajib diisi.
- Alamat dapat dibuat opsional atau wajib berdasarkan pengaturan sistem.
- RT dan RW disimpan sebagai teks agar dapat menampung format seperti `001`.
- Wilayah harus dapat dipilih dari daftar wilayah.
- Status disabilitas hanya berupa boolean `ya/tidak`.
- Status lansia hanya berupa boolean `ya/tidak`.
- Jangan menyimpan jenis atau detail kondisi disabilitas.
- Jangan menyimpan data medis.
- Data tidak langsung dihapus permanen. Gunakan status aktif/nonaktif atau soft delete.
- Kode jamaah dibuat otomatis, misalnya `JMH-00001`.

Fitur:

- Tambah kepala keluarga.
- Edit data.
- Nonaktifkan data.
- Aktifkan kembali data.
- Pencarian berdasarkan nama, kode jamaah, alamat, RT/RW, dan wilayah.
- Filter berdasarkan wilayah.
- Filter jamaah aktif/nonaktif.
- Filter lansia.
- Filter disabilitas.
- Pagination.
- Impor CSV.
- Ekspor CSV.
- Riwayat pembayaran iuran pada halaman detail kepala keluarga.

---

# 6. Modul Wilayah

Buat master data wilayah untuk mengelompokkan jamaah.

Data wilayah:

- ID.
- Nama wilayah atau dusun.
- Keterangan.
- Status aktif.
- Tanggal dibuat.
- Tanggal diperbarui.

Fitur:

- Tambah wilayah.
- Edit wilayah.
- Nonaktifkan wilayah.
- Melihat jumlah kepala keluarga di setiap wilayah.

Wilayah yang sudah digunakan tidak boleh dihapus permanen.

---

# 7. Modul Iuran Bulanan

Setiap kepala keluarga dapat memiliki kewajiban iuran setiap bulan.

Sistem harus mendukung nominal iuran yang dapat dikonfigurasi, misalnya nominal standar berlaku untuk seluruh jamaah.

Data pembayaran iuran:

- ID.
- Kepala keluarga.
- Tahun.
- Bulan.
- Nominal tagihan.
- Nominal dibayar.
- Tanggal pembayaran.
- Metode pembayaran.
- Status pembayaran.
- Nomor bukti pembayaran.
- Catatan.
- Pengguna yang mencatat.
- Tanggal dibuat.
- Tanggal diperbarui.

Status pembayaran:

- Belum bayar.
- Dibayar sebagian.
- Lunas.
- Dibebaskan.
- Dibatalkan.

Metode pembayaran:

- Tunai.
- Transfer bank.
- QRIS.
- Metode lainnya.

Ketentuan:

- Satu kepala keluarga tidak boleh memiliki dua record tagihan aktif untuk bulan dan tahun yang sama.
- Pembayaran iuran otomatis menghasilkan transaksi kas masuk.
- Perubahan pembayaran harus memperbarui transaksi kas masuk yang terkait.
- Pembatalan pembayaran harus membatalkan transaksi kas terkait, bukan menghapusnya.
- Pembayaran dapat dilakukan untuk satu bulan atau beberapa bulan sekaligus.
- Sistem harus dapat mencatat pembayaran tunggakan.
- Sistem harus dapat mencatat pembayaran di muka.
- Jamaah nonaktif tidak otomatis dibuatkan tagihan baru.
- Jamaah yang dibebaskan tetap memiliki record status `Dibebaskan` agar laporan tetap jelas.

Fitur utama:

- Generate tagihan bulanan seluruh jamaah aktif.
- Generate tagihan berdasarkan wilayah.
- Input pembayaran per kepala keluarga.
- Pembayaran beberapa bulan sekaligus.
- Daftar jamaah belum membayar.
- Daftar jamaah sudah membayar.
- Filter berdasarkan bulan, tahun, wilayah, dan status.
- Rekap tunggakan per kepala keluarga.
- Rekap total penerimaan iuran.
- Cetak tanda terima pembayaran.
- Ekspor laporan iuran ke CSV atau PDF.
- Tampilan matriks pembayaran tahunan.

Contoh matriks tahunan:

| Nama Jamaah | Jan | Feb | Mar | Apr | Mei | Jun | Jul | Agu | Sep | Okt | Nov | Des |
| ----------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Gunakan indikator visual yang mudah dipahami:

- Lunas.
- Sebagian.
- Belum bayar.
- Dibebaskan.

Jangan hanya mengandalkan warna. Sertakan teks, ikon, atau label agar tetap ramah aksesibilitas.

---

# 8. Modul Kas Masuk Non-Iuran

Kas masuk non-iuran mencakup:

- Sedekah.
- Kotak amal.
- Sewa wakaf.
- Donasi kegiatan.
- Bantuan.
- Pemasukan lainnya.

Data transaksi:

- ID.
- Nomor transaksi otomatis.
- Tanggal transaksi.
- Kategori pemasukan.
- Sumber pemasukan.
- Nominal.
- Metode penerimaan.
- Deskripsi.
- Nomor referensi.
- Lampiran bukti opsional.
- Pengguna yang mencatat.
- Status transaksi.
- Tanggal dibuat.
- Tanggal diperbarui.

Status transaksi:

- Draft.
- Terverifikasi.
- Dibatalkan.

Ketentuan:

- Nominal harus lebih besar dari nol.
- Transaksi terverifikasi memengaruhi saldo kas.
- Transaksi draft tidak memengaruhi saldo.
- Transaksi dibatalkan tidak memengaruhi saldo.
- Transaksi yang sudah diverifikasi tidak boleh dihapus permanen.
- Perubahan transaksi terverifikasi harus masuk audit log.
- Kotak amal dapat dicatat berdasarkan periode penghitungan, misalnya mingguan atau setelah salat Jumat.
- Sewa wakaf dapat menyimpan nama penyewa secara opsional, tetapi jangan mewajibkan data sensitif.

---

# 9. Modul Kas Keluar

Kategori pengeluaran antara lain:

- Listrik.
- Air.
- Kebersihan.
- Perawatan bangunan.
- Perlengkapan ibadah.
- Kegiatan keagamaan.
- Honor petugas.
- Santunan.
- Konsumsi.
- Administrasi.
- Pengeluaran lainnya.

Data transaksi:

- ID.
- Nomor transaksi otomatis.
- Tanggal transaksi.
- Kategori pengeluaran.
- Penerima pembayaran.
- Nominal.
- Metode pembayaran.
- Deskripsi.
- Nomor referensi.
- Lampiran bukti pembayaran.
- Pengguna yang mencatat.
- Pengguna yang memverifikasi.
- Status transaksi.
- Tanggal dibuat.
- Tanggal diperbarui.

Status:

- Draft.
- Menunggu verifikasi.
- Terverifikasi.
- Ditolak.
- Dibatalkan.

Ketentuan:

- Nominal wajib lebih besar dari nol.
- Pengeluaran hanya mengurangi saldo setelah terverifikasi.
- Sistem memberikan peringatan jika nominal pengeluaran melebihi saldo tersedia.
- Pengeluaran tetap dapat disimpan sebagai draft jika saldo tidak mencukupi.
- Lampiran bukti dapat berupa JPG, PNG, atau PDF.
- Batasi ukuran dan tipe file.
- Simpan file secara aman.
- Transaksi terverifikasi tidak boleh dihapus permanen.
- Pembatalan harus menyimpan alasan pembatalan.
- Seluruh perubahan penting masuk audit log.

---

# 10. Kategori Transaksi

Buat master kategori transaksi.

Data kategori:

- ID.
- Nama kategori.
- Tipe kategori: pemasukan atau pengeluaran.
- Deskripsi.
- Status aktif.
- Urutan tampilan.
- Tanggal dibuat.
- Tanggal diperbarui.

Kategori bawaan:

## Pemasukan

- Iuran jamaah.
- Sedekah.
- Kotak amal.
- Sewa wakaf.
- Donasi.
- Bantuan.
- Lainnya.

## Pengeluaran

- Listrik.
- Air.
- Kebersihan.
- Perawatan.
- Perlengkapan.
- Kegiatan.
- Honor petugas.
- Santunan.
- Konsumsi.
- Administrasi.
- Lainnya.

Kategori yang sudah digunakan tidak boleh dihapus permanen.

---

# 11. Buku Kas dan Saldo

Gunakan model **ledger atau buku kas** sebagai sumber utama perhitungan saldo.

Setiap transaksi yang terverifikasi harus menghasilkan entry buku kas.

Data buku kas:

- ID.
- Tanggal transaksi.
- Tipe: debit atau kredit.
- Jenis sumber transaksi.
- ID sumber transaksi.
- Nomor transaksi.
- Keterangan.
- Nominal.
- Status.
- Tanggal dibuat.

Aturan:

- Kas masuk menjadi debit atau penambahan saldo.
- Kas keluar menjadi kredit atau pengurangan saldo.
- Saldo tidak boleh disimpan sebagai angka statis yang mudah tidak sinkron.
- Saldo dihitung dari seluruh entry ledger yang valid.
- Jika menggunakan tabel saldo cache untuk performa, ledger tetap menjadi source of truth.
- Setiap transaksi hanya boleh memiliki satu relasi ledger aktif.
- Pembatalan transaksi menghasilkan reversal atau perubahan status yang dapat dilacak.
- Jangan menghapus entry ledger secara permanen.

Tampilkan:

- Saldo awal periode.
- Total pemasukan.
- Total pengeluaran.
- Saldo akhir.
- Mutasi kas per tanggal.
- Running balance.

---

# 12. Dashboard

Dashboard harus menampilkan:

- Saldo kas saat ini.
- Total kas masuk bulan ini.
- Total kas keluar bulan ini.
- Surplus atau defisit bulan ini.
- Total iuran bulan ini.
- Jumlah keluarga yang sudah membayar.
- Jumlah keluarga yang belum membayar.
- Persentase pembayaran iuran.
- Total tunggakan.
- Jumlah kepala keluarga aktif.
- Jumlah jamaah lansia.
- Jumlah jamaah disabilitas.
- Pemasukan berdasarkan kategori.
- Pengeluaran berdasarkan kategori.
- Grafik arus kas 6 atau 12 bulan terakhir.
- Transaksi terbaru.
- Pengeluaran menunggu verifikasi.
- Daftar wilayah dengan tingkat pembayaran terendah.

Semua perhitungan harus berdasarkan data terverifikasi.

Tambahkan filter:

- Bulan.
- Tahun.
- Wilayah.

---

# 13. Laporan

Sediakan laporan berikut:

## 13.1 Laporan Kas Bulanan

- Saldo awal.
- Total pemasukan.
- Total pengeluaran.
- Saldo akhir.
- Daftar transaksi.
- Ringkasan per kategori.

## 13.2 Laporan Kas Tahunan

- Ringkasan setiap bulan.
- Total tahunan.
- Grafik pemasukan dan pengeluaran.
- Kategori pemasukan terbesar.
- Kategori pengeluaran terbesar.

## 13.3 Laporan Iuran

- Total tagihan.
- Total pembayaran.
- Total tunggakan.
- Persentase pembayaran.
- Daftar kepala keluarga sudah membayar.
- Daftar belum membayar.
- Rekap berdasarkan wilayah.
- Matriks pembayaran tahunan.

## 13.4 Laporan Kas Masuk

- Berdasarkan periode.
- Berdasarkan kategori.
- Berdasarkan metode pembayaran.
- Berdasarkan sumber pemasukan.

## 13.5 Laporan Kas Keluar

- Berdasarkan periode.
- Berdasarkan kategori.
- Berdasarkan status.
- Berdasarkan penerima.

## 13.6 Laporan Jamaah

- Jumlah kepala keluarga.
- Jumlah per wilayah.
- Jumlah lansia.
- Jumlah disabilitas.
- Status aktif dan nonaktif.

Fitur laporan:

- Filter tanggal.
- Filter bulan dan tahun.
- Filter wilayah.
- Filter kategori.
- Cetak.
- Ekspor CSV.
- Ekspor PDF.
- Tampilan print-friendly.
- Nomor halaman.
- Identitas masjid pada header.
- Tanggal pencetakan.
- Nama pengguna yang mencetak.

---

# 14. Audit Log

Catat aktivitas penting:

- Login.
- Logout.
- Tambah data.
- Edit data.
- Nonaktifkan data.
- Verifikasi transaksi.
- Tolak transaksi.
- Batalkan transaksi.
- Generate tagihan.
- Input pembayaran iuran.
- Perubahan pengaturan.
- Ekspor laporan.

Data audit:

- ID.
- Pengguna.
- Aksi.
- Entitas.
- ID entitas.
- Data sebelum perubahan.
- Data setelah perubahan.
- Waktu.
- Alamat IP jika tersedia.
- User agent jika tersedia.

Jangan mencatat password, token, atau data rahasia ke dalam audit log.

Audit log tidak boleh dapat diubah oleh pengguna biasa.

---

# 15. Pengaturan Masjid

Data pengaturan:

- Nama masjid.
- Alamat masjid.
- RT/RW.
- Wilayah.
- Nomor kontak.
- Logo.
- Nama ketua takmir.
- Nama bendahara.
- Nominal iuran standar.
- Mata uang.
- Format nomor transaksi.
- Tahun buku.
- Teks tanda terima.
- Tanda tangan digital opsional.
- Pengaturan verifikasi pengeluaran.
- Batas ukuran lampiran.

Gunakan format mata uang Rupiah dengan tampilan seperti:

`Rp150.000`

Simpan nilai uang dalam satuan integer terkecil atau gunakan tipe decimal yang aman. Jangan gunakan floating-point JavaScript untuk operasi keuangan.

---

# 16. Rancangan Database Awal

Buat minimal model berikut:

- `User`
- `Role`
- `Permission`
- `UserRole`
- `MosqueProfile`
- `Region`
- `Household`
- `ContributionSetting`
- `ContributionBill`
- `ContributionPayment`
- `IncomeTransaction`
- `ExpenseTransaction`
- `TransactionCategory`
- `CashLedger`
- `Attachment`
- `AuditLog`
- `SystemSetting`

Gunakan UUID atau CUID untuk primary key.

Tambahkan:

- Foreign key.
- Unique constraint.
- Index pada kolom pencarian.
- Timestamp.
- Soft delete jika diperlukan.
- Database transaction untuk operasi keuangan.

Constraint penting:

- Kombinasi `householdId`, `month`, dan `year` pada tagihan iuran harus unik.
- Nomor transaksi harus unik.
- Nominal tidak boleh negatif.
- Entry ledger harus memiliki referensi sumber yang valid.
- Relasi pembayaran dan transaksi kas masuk tidak boleh ganda.
- Kategori pemasukan tidak boleh digunakan untuk pengeluaran dan sebaliknya.

Buat ERD sebelum implementasi.

---

# 17. Halaman Aplikasi

Buat struktur halaman berikut:

```text
/login

/dashboard

/jamaah
/jamaah/tambah
/jamaah/[id]
/jamaah/[id]/edit

/wilayah
/wilayah/tambah
/wilayah/[id]/edit

/iuran
/iuran/tagihan
/iuran/pembayaran
/iuran/tunggakan
/iuran/matriks-tahunan
/iuran/[id]

/kas-masuk
/kas-masuk/tambah
/kas-masuk/[id]
/kas-masuk/[id]/edit

/kas-keluar
/kas-keluar/tambah
/kas-keluar/[id]
/kas-keluar/[id]/edit

/buku-kas

/laporan
/laporan/kas-bulanan
/laporan/kas-tahunan
/laporan/iuran
/laporan/kas-masuk
/laporan/kas-keluar
/laporan/jamaah

/pengaturan
/pengaturan/profil-masjid
/pengaturan/kategori
/pengaturan/iuran
/pengaturan/pengguna
/pengaturan/audit-log
```

---

# 18. Antarmuka Pengguna

Gunakan desain yang:

- Bersih.
- Sederhana.
- Profesional.
- Responsif.
- Mudah dibaca oleh pengguna berusia lanjut.
- Tidak terlalu banyak animasi.
- Tidak menggunakan istilah teknis.
- Mendukung desktop, tablet, dan ponsel.

Ketentuan UI:

- Gunakan ukuran font yang nyaman.
- Gunakan kontras yang baik.
- Tampilkan label, bukan hanya ikon.
- Konfirmasi sebelum membatalkan transaksi.
- Tampilkan pesan sukses dan error yang jelas.
- Berikan loading state.
- Berikan empty state.
- Berikan skeleton loading bila sesuai.
- Tampilkan validasi tepat di bawah input.
- Tabel harus dapat dicari, difilter, diurutkan, dan dipaginasi.
- Form transaksi harus menampilkan preview ringkasan sebelum disimpan.
- Format tanggal menggunakan format Indonesia.
- Format nominal menggunakan Rupiah.
- Semua dialog harus bisa digunakan melalui keyboard.
- Jangan hanya menggunakan warna untuk menunjukkan status.

Gunakan Bahasa Indonesia sebagai bahasa utama antarmuka.

---

# 19. Keamanan

Implementasikan:

- Autentikasi aman.
- Password hashing.
- Session expiration.
- Role-Based Access Control.
- Server-side authorization pada setiap operasi.
- Validasi Zod di server.
- CSRF protection jika dibutuhkan.
- Rate limiting pada login.
- Sanitasi input.
- Pencegahan SQL injection melalui ORM.
- Validasi file upload.
- Pembatasan ukuran file.
- Pembatasan MIME type.
- Secure cookie.
- Environment variables untuk secrets.
- Audit log.
- Backup database.
- Jangan mengekspos stack trace kepada pengguna.
- Jangan mengandalkan pembatasan tombol UI sebagai otorisasi.

Pastikan pengguna dengan akses baca tidak dapat memanggil endpoint mutasi secara langsung.

---

# 20. Konsistensi Transaksi Keuangan

Seluruh operasi keuangan harus menggunakan database transaction.

Contoh operasi pembayaran iuran:

1. Validasi kepala keluarga.
2. Validasi tagihan.
3. Simpan pembayaran.
4. Perbarui status tagihan.
5. Buat atau perbarui transaksi kas masuk.
6. Buat atau perbarui entry ledger.
7. Simpan audit log.
8. Commit seluruh operasi.

Jika salah satu proses gagal, rollback seluruh operasi.

Lakukan hal yang sama untuk:

- Verifikasi kas masuk.
- Verifikasi kas keluar.
- Pembatalan transaksi.
- Perubahan pembayaran.
- Reversal transaksi.

Gunakan idempotency untuk operasi yang berisiko dijalankan berulang.

---

# 21. Seed Data

Buat seed data untuk:

- Satu administrator.
- Satu bendahara.
- Satu pengguna auditor.
- Beberapa wilayah.
- Minimal 15 data kepala keluarga contoh.
- Tagihan iuran beberapa bulan.
- Pembayaran dengan status berbeda.
- Transaksi sedekah.
- Transaksi kotak amal.
- Transaksi sewa wakaf.
- Beberapa transaksi pengeluaran.
- Kategori pemasukan dan pengeluaran.
- Profil masjid contoh.

Jangan gunakan data nyata.

---

# 22. Testing

Buat unit test untuk:

- Perhitungan status tagihan.
- Perhitungan saldo.
- Perhitungan total tunggakan.
- Validasi nominal.
- Generate nomor transaksi.
- Hak akses pengguna.
- Reversal transaksi.
- Generate tagihan bulanan.

Buat integration test untuk:

- Pembayaran iuran.
- Kas masuk.
- Kas keluar.
- Verifikasi transaksi.
- Pembatalan transaksi.
- Ledger.
- Laporan.

Buat end-to-end test untuk:

1. Login sebagai bendahara.
2. Menambahkan kepala keluarga.
3. Generate tagihan.
4. Mencatat pembayaran iuran.
5. Memastikan kas masuk bertambah.
6. Mencatat pengeluaran.
7. Memverifikasi pengeluaran.
8. Memastikan saldo berkurang.
9. Membuka laporan bulanan.
10. Mengekspor laporan.

---

# 23. Dokumentasi

Buat dokumentasi berikut:

- `README.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TESTING.md`
- `.env.example`

README harus memuat:

- Gambaran aplikasi.
- Fitur.
- Teknologi.
- Persyaratan sistem.
- Cara instalasi.
- Cara konfigurasi database.
- Cara menjalankan migration.
- Cara menjalankan seed.
- Cara menjalankan development server.
- Cara menjalankan test.
- Cara build production.
- Akun demo.
- Struktur folder.

---

# 24. Deployment

Siapkan aplikasi agar dapat di-deploy menggunakan:

- Docker.
- Docker Compose.
- PostgreSQL.
- Reverse proxy bila diperlukan.

Buat:

- `Dockerfile`
- `docker-compose.yml`
- Health check endpoint.
- Production environment validation.
- Database migration strategy.
- Backup dan restore guide.

Aplikasi harus dapat dijalankan dengan alur sederhana:

```bash
docker compose up -d
```

Jangan menyimpan secrets di repository.

---

# 25. Tahapan Implementasi

Kerjakan secara bertahap.

## Tahap 1 — Analisis dan Arsitektur

Hasilkan:

- Ringkasan kebutuhan.
- Asumsi.
- Daftar risiko.
- User flow.
- ERD.
- Skema database.
- Struktur folder.
- Matriks role dan permission.

Jangan langsung menulis seluruh implementasi sebelum arsitektur disusun.

## Tahap 2 — Fondasi Proyek

Implementasikan:

- Next.js.
- TypeScript.
- Tailwind.
- shadcn/ui.
- Prisma.
- PostgreSQL.
- Authentication.
- Authorization.
- Layout.
- Navigation.
- Error handling.
- Logging.

## Tahap 3 — Master Data

Implementasikan:

- Profil masjid.
- Wilayah.
- Kepala keluarga.
- Kategori transaksi.
- Pengaturan iuran.

## Tahap 4 — Iuran Jamaah

Implementasikan:

- Generate tagihan.
- Pembayaran.
- Tunggakan.
- Matriks tahunan.
- Tanda terima.

## Tahap 5 — Keuangan

Implementasikan:

- Kas masuk.
- Kas keluar.
- Verifikasi.
- Ledger.
- Running balance.
- Audit log.

## Tahap 6 — Dashboard dan Laporan

Implementasikan:

- Dashboard.
- Grafik.
- Filter.
- Laporan.
- Ekspor.
- Print view.

## Tahap 7 — Testing dan Hardening

Implementasikan:

- Unit test.
- Integration test.
- E2E test.
- Security review.
- Performance review.
- Accessibility review.

## Tahap 8 — Deployment

Implementasikan:

- Docker.
- Production configuration.
- Migration.
- Backup.
- Dokumentasi deployment.

---

# 26. Aturan Kerja AI Agent

Saat mengerjakan proyek:

1. Jangan mengubah requirement utama tanpa alasan.
2. Jika ada keputusan yang belum ditentukan, pilih solusi paling sederhana dan dokumentasikan asumsi.
3. Jangan membuat fitur yang tidak berhubungan dengan pengelolaan jamaah dan keuangan.
4. Jangan menyimpan data sensitif yang tidak diperlukan.
5. Jangan menggunakan mock data dalam fitur production.
6. Jangan menjalankan operasi keuangan tanpa database transaction.
7. Jangan menghitung saldo hanya dari state frontend.
8. Jangan mempercayai nilai total yang dikirim frontend.
9. Semua nominal harus dihitung ulang di server.
10. Semua otorisasi harus diperiksa di server.
11. Gunakan reusable components.
12. Hindari duplikasi business logic.
13. Pisahkan UI, validation, service, repository, dan domain logic dengan jelas.
14. Selalu jalankan lint, type-check, dan test setelah perubahan besar.
15. Perbaiki error sebelum melanjutkan tahap berikutnya.
16. Jangan menghapus data keuangan terverifikasi secara permanen.
17. Gunakan migration untuk setiap perubahan schema.
18. Dokumentasikan setiap keputusan arsitektur penting.
19. Buat commit kecil dan terstruktur jika lingkungan mendukung Git.
20. Pastikan aplikasi dapat dijalankan setelah setiap tahap selesai.

---

# 27. Kriteria Penerimaan

Proyek dianggap berhasil apabila:

- Pengguna dapat login sesuai role.
- Bendahara dapat menambahkan kepala keluarga.
- Bendahara dapat generate tagihan bulanan.
- Bendahara dapat mencatat pembayaran iuran.
- Pembayaran otomatis tercatat sebagai kas masuk.
- Bendahara dapat mencatat pemasukan non-iuran.
- Bendahara dapat mencatat pengeluaran.
- Transaksi terverifikasi memengaruhi saldo.
- Pembatalan transaksi ditangani secara aman.
- Saldo buku kas akurat.
- Tunggakan dapat dihitung dengan benar.
- Laporan dapat difilter.
- Laporan dapat dicetak dan diekspor.
- Pengguna read-only tidak dapat mengubah data.
- Perubahan transaksi tercatat di audit log.
- Seluruh form memiliki validasi server-side.
- Aplikasi responsif.
- Aplikasi lolos lint dan type-check.
- Test utama berhasil.
- Aplikasi dapat dijalankan melalui Docker.

---

# 28. Output Pertama yang Harus Diberikan

Sebelum mulai mengimplementasikan kode, berikan:

1. Ringkasan pemahaman requirement.
2. Daftar asumsi.
3. Daftar fitur MVP.
4. Fitur yang ditunda setelah MVP.
5. User flow utama.
6. Matriks role dan permission.
7. ERD dalam format Mermaid.
8. Rancangan Prisma schema.
9. Struktur folder.
10. Rencana implementasi per tahap.
11. Risiko teknis dan mitigasinya.
12. Daftar pertanyaan yang benar-benar menghambat implementasi.

Setelah itu, mulai implementasi dari fondasi proyek dan kerjakan secara bertahap sampai aplikasi dapat dijalankan.
