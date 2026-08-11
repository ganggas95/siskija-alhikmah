# 1. Goal
Mengubah UI tagihan jamaah menjadi tampilan matriks tahunan yang lebih cepat dipakai bendahara, sekaligus mengganti alur generate tagihan dari per-bulan menjadi per-tahun dengan query dan struktur data yang tetap efisien.

# 2. Approach
Halaman utama `/iuran/tagihan` saat ini masih berupa daftar flat per tagihan dengan search/filter sederhana dan CTA generate yang terpisah ([src/app/(app)/iuran/tagihan/page.tsx:22-286]). Format export pembayaran jamaah justru sudah memakai struktur matriks 12 bulan per household ([src/modules/contributions/exports/export-contribution-payments.ts:47-70], [src/modules/contributions/exports/xlsx.ts:134-141]); itu sebaiknya dijadikan sumber desain data untuk UI baru.

Pendekatan yang paling pragmatis adalah mempertahankan tabel `ContributionBill` sebagai source of truth, lalu membangun service query tahunan yang memetakan household + 12 kolom bulan + ringkasan status/nominal. Ini lebih aman daripada mengganti model data besar-besaran sekarang, tetapi tetap membuka ruang optimasi lewat index komposit dan query agregasi agar tidak membentuk payload nested yang terlalu berat.

# 3. File Changes

- **Modify** `src/app/(app)/iuran/tagihan/page.tsx`
  - Saat ini membaca tagihan sebagai baris datar dan menampilkan card/table sederhana ([src/app/(app)/iuran/tagihan/page.tsx:72-279]). Ubah menjadi halaman matriks tahunan dengan summary cards, toolbar filter, CTA generate tahunan, dan tabel 12 bulan mirip format export Excel.

- **Modify** `src/app/(app)/iuran/tagihan/actions.ts`
  - Saat ini hanya menerima `year` + `month` dan memanggil generate bulanan ([src/app/(app)/iuran/tagihan/actions.ts:14-36]). Ubah action agar mendukung generate setahun penuh dan revalidate semua halaman yang terdampak.

- **Modify** `src/app/(app)/iuran/tagihan/_components/generate-bills-form.tsx`
  - Form sekarang khusus bulan+tahun ([src/app/(app)/iuran/tagihan/_components/generate-bills-form.tsx:43-104]). Ubah menjadi form generate tahunan yang lebih ringkas dan cocok disisipkan sebagai panel/dialog dari halaman utama.

- **Modify** `src/app/(app)/iuran/tagihan/generate/page.tsx`
  - Halaman generate khusus bisa dipertahankan sebagai fallback, tetapi isinya harus sinkron dengan flow tahunan baru ([src/app/(app)/iuran/tagihan/generate/page.tsx:1-18]). Bila diperlukan, jadikan wrapper tipis dari komponen generate tahunan yang sama.

- **Create** `src/app/(app)/iuran/tagihan/_components/bill-status-badge.tsx`
  - Komponen badge status aksesibel untuk `BELUM_BAYAR`, `SEBAGIAN`, `LUNAS`, `DIBEBASKAN`, `DIBATALKAN`, karena saat ini status hanya berupa teks polos atau pill generik ([src/app/(app)/iuran/tagihan/page.tsx:208-209], [src/app/(app)/iuran/tagihan/page.tsx:271]).

- **Create** `src/app/(app)/iuran/tagihan/_components/annual-bills-summary.tsx`
  - Menampilkan KPI tahunan: jumlah keluarga, total tagihan, total lunas, total tunggakan, dan coverage pembayaran berdasarkan filter aktif.

- **Create** `src/app/(app)/iuran/tagihan/_components/annual-bills-matrix.tsx`
  - Komponen tabel utama yang meniru struktur export Excel: kolom kode jamaah, nama, wilayah, lalu Jan–Des dengan isi status/nominal yang ramah aksesibilitas.

- **Create** `src/app/(app)/iuran/tagihan/_components/annual-bills-toolbar.tsx`
  - Memecah search/filter/action dari page agar query-string management dan responsive layout lebih terkontrol dibanding markup inline saat ini ([src/app/(app)/iuran/tagihan/page.tsx:106-198]).

- **Create** `src/modules/contributions/queries/get-annual-bills-matrix.ts`
  - Service query khusus untuk read model matriks tahunan. Ia akan mengambil household yang lolos filter dan memetakan data tagihan per bulan tanpa membebani page dengan transformasi besar.

- **Create** `src/modules/contributions/services/generate-yearly-bills.ts`
  - Service baru untuk generate 12 bulan sekaligus. Reuse aturan nominal dari pengaturan iuran dan `createMany({ skipDuplicates: true })` seperti generator bulanan saat ini ([src/modules/contributions/services/generate-monthly-bills.ts:9-20]), tetapi dieksekusi per tahun.

- **Modify** `src/modules/contributions/services/generate-monthly-bills.ts`
  - Pilih salah satu: pertahankan untuk backward compatibility dan panggil dari service tahunan, atau refactor menjadi helper internal per bulan agar logic tidak duplikatif.

- **Modify** `src/modules/contributions/exports/export-contribution-payments.ts`
  - Saat ini export melakukan nested select `household -> contributionBills -> payments` ([src/modules/contributions/exports/export-contribution-payments.ts:47-69]). Samakan atau ekstrak mapping tahunan agar UI matriks dan export berbagi data shape yang konsisten.

- **Modify** `src/modules/contributions/exports/export-contribution-payments.test.ts`
  - Tambah coverage untuk mapping status/nilai bulanan yang akan dipakai ulang oleh UI matriks.

- **Modify** `src/app/(app)/iuran/pembayaran/tambah/page.tsx`
  - Form pembayaran saat ini hanya mengambil 50 bill outstanding terakhir ([src/app/(app)/iuran/pembayaran/tambah/page.tsx:12-27]). Setelah UI tagihan tahunan hadir, halaman ini minimal perlu sinkron dengan data source tahunan atau menyediakan deep-link yang lebih tepat dari matriks ke pembayaran per household/bulan.

- **Modify** `src/app/(app)/iuran/pembayaran/_components/payment-form.tsx`
  - Bila plan implementasi memilih CTA “Bayar” langsung dari sel/tagihan, form perlu mendukung preselected bill yang dikirim dari matriks, bukan hanya dropdown manual ([src/app/(app)/iuran/pembayaran/_components/payment-form.tsx:88-145]).

- **Modify** `prisma/schema.prisma`
  - Evaluasi penambahan index komposit pada `ContributionBill` dan `ContributionPayment` untuk query tahunan. Struktur saat ini baru punya `@@unique([householdId, year, month])`, `@@index([year, month])`, dan `@@index([status])` untuk bill ([prisma/schema.prisma:220-232]) serta index status/paymentDate untuk payment ([prisma/schema.prisma:234-261]).

- **Create** `prisma/migrations/<timestamp>_optimize_annual_contribution_bill_queries/migration.sql`
  - Menambahkan index yang diputuskan dari evaluasi schema di atas.

- **Modify** `src/app/(app)/layout.tsx`
  - Jika hasil revamp butuh label nav yang lebih spesifik seperti “Tagihan Tahunan”, update item navigasi yang sekarang hanya “Tagihan” ([src/app/(app)/layout.tsx:34-47]). Jika tidak, file ini cukup disentuh bila ada perubahan deep-link CTA.

- **Create** `src/modules/contributions/queries/get-annual-bills-matrix.test.ts`
  - Unit/integration-level test untuk transformasi read model tahunan agar mapping 12 bulan dan perhitungan summary tidak regress.

- **Create or Modify** test file untuk generator tahunan, misalnya `src/modules/contributions/services/generate-yearly-bills.test.ts`
  - Memastikan pembuatan tagihan 12 bulan idempoten, tidak duplikat, dan hanya untuk household aktif.

# 4. Implementation Steps

## Task 1: Bentuk read model tahunan yang cocok untuk UI dan export
1. Audit ulang shape export pembayaran tahunan yang sekarang berasal dari `getContributionPaymentExportRows()` dan `mapContributionExportRows()` di [src/modules/contributions/exports/export-contribution-payments.ts:22-69]. Tentukan shape bersama untuk 12 bulan yang bisa dipakai UI matriks dan export.
2. Buat `src/modules/contributions/queries/get-annual-bills-matrix.ts` untuk menerima filter `year`, `q`, `regionId`, `status`, dan mengembalikan:
   - identitas household,
   - data bulan 1–12,
   - status bulanan,
   - amount due,
   - total paid atau outstanding jika diperlukan untuk cell tooltip/ringkasan.
3. Hindari nested payload berlebihan dengan memilih salah satu strategi query:
   - query household + bill tahunan terfilter lalu reduce di server, atau
   - query bills tahunan terfilter dan group by household di memory,
   - tambahkan aggregate payment verified/canceled yang benar sehingga tidak perlu fetch semua payment rows jika hanya total dibutuhkan.
4. Ekstrak helper mapping bulan/status reusable agar eksport Excel dan UI matriks tidak memiliki dua logika paralel.

## Task 2: Ubah generator dari bulanan ke tahunan
1. Tambah service `generate-yearly-bills.ts` yang melakukan loop bulan 1–12 dalam satu database transaction dan memakai aturan nominal dari `getContributionFeeConfig()` / `resolveContributionAmount()` yang saat ini dipakai generator bulanan ([src/modules/contributions/services/generate-monthly-bills.ts:1-20]).
2. Pastikan service tahunan bersifat idempoten dengan `createMany(... skipDuplicates: true)` per bulan, sehingga menjalankan generate ulang untuk tahun yang sama tidak menimbulkan duplikasi.
3. Simpan audit log tahunan yang mencatat tahun, jumlah household aktif, jumlah row yang dibuat/skipped, dan bila perlu breakdown per bulan.
4. Ubah `generateBillsAction()` di [src/app/(app)/iuran/tagihan/actions.ts:14-36] agar memanggil service tahunan, memvalidasi input tahun, dan me-revalidate `/iuran/tagihan`, `/iuran/pembayaran`, `/laporan/iuran`, dan dashboard jika summary ikut berubah.
5. Refactor `generate-monthly-bills.ts` menjadi helper per bulan atau legacy wrapper agar tidak ada logic hitung nominal yang duplikatif.

## Task 3: Revamp UI halaman tagihan menjadi matriks tahunan
1. Ganti query di `src/app/(app)/iuran/tagihan/page.tsx` dari `db.contributionBill.findMany()` flat list ([src/app/(app)/iuran/tagihan/page.tsx:72-90]) ke service `getAnnualBillsMatrix()` dan jadikan `year` filter utama, default ke tahun berjalan.
2. Tambahkan summary cards di atas tabel untuk meniru kebutuhan operasional bendahara: total keluarga, total lunas, total belum/sebagian, total nominal tagihan, dan total tunggakan berdasarkan hasil query tahunan.
3. Pecah toolbar menjadi komponen sendiri agar search, filter wilayah, filter status, pemilihan tahun, reset, dan CTA generate tahunan lebih jelas pada mobile dan desktop.
4. Ganti tampilan tabel/card menjadi matriks ala Excel:
   - kolom tetap untuk kode/nama/wilayah,
   - 12 kolom bulan Jan–Des,
   - isi sel menampilkan label status singkat + nominal jika relevan,
   - bukan warna saja; gunakan badge/icon/teks seperti “Lunas”, “Sebagian”, “Belum”.
5. Tambahkan affordance aksi yang relevan dari matriks, minimal deep-link ke input pembayaran dengan bill tertentu atau household tertentu bila cell belum lunas. Ini akan mengurangi friction dibanding flow sekarang yang memaksa pilih bill dari dropdown besar.
6. Pertahankan fallback mobile dengan horizontal-scroll atau stacked cards yang masih membawa 12 bulan secara jelas, bukan hanya satu baris data generik seperti saat ini ([src/app/(app)/iuran/tagihan/page.tsx:200-233]).

## Task 4: Sinkronkan flow pembayaran dan export
1. Sinkronkan `PaymentForm` agar dapat menerima bill prapilih dari halaman tagihan tahunan, bukan hanya dropdown generik 50 item ([src/app/(app)/iuran/pembayaran/tambah/page.tsx:12-27], [src/app/(app)/iuran/pembayaran/_components/payment-form.tsx:88-145]).
2. Jika perlu, ganti source dropdown pembayaran menjadi query parameterized by household/year atau outstanding bill list yang lebih relevan dari klik sel matriks.
3. Sesuaikan export pembayaran agar menggunakan helper data tahunan yang sama. Tujuannya: format Excel dan tampilan UI selalu konsisten, dan perubahan status mapping cukup dirawat di satu tempat.

## Task 5: Optimasi schema dan performa
1. Review query plan untuk pembacaan matriks tahunan dan generate setahun penuh. Query export saat ini bukan N+1 klasik karena Prisma nested select menghasilkan query relasional terkoordinasi, tetapi payload-nya bisa membesar karena setiap bill ikut membawa array payment ([src/modules/contributions/exports/export-contribution-payments.ts:50-66]).
2. Tambahkan index komposit pada `ContributionBill` yang membantu akses tahunan per household dan filter status, misalnya kandidat:
   - `@@index([householdId, year])`
   - `@@index([year, status])` atau `@@index([year, month, status])`
   - bila filter wilayah sering dipakai, pertimbangkan mengandalkan index `Household.regionId` yang sudah ada ([prisma/schema.prisma:216-218]) lalu join via relation.
3. Tambahkan index komposit pada `ContributionPayment` bila query total per bill/tahun sering membutuhkan payment aktif terverifikasi, misalnya `@@index([billId, status, canceledAt])`.
4. Jangan langsung menambah tabel agregasi/materialized cache di tahap ini. Mulai dari read-model service + index. Hanya jika profiling menunjukkan bottleneck nyata, baru pertimbangkan projection table tahunan atau kolom denormalisasi `paidAmount` yang harus dijaga konsistensinya di semua mutation path.

## Task 6: Tambah test coverage
1. Tambah test generator tahunan untuk memastikan 12 bulan dibuat sekali, household inactive dilewati, dan rerun tidak menduplikasi row.
2. Tambah test read-model matriks tahunan untuk memastikan:
   - mapping 12 bulan benar,
   - bill tanpa pembayaran tetap tampil,
   - status `LUNAS/SEBAGIAN/BELUM_BAYAR/DIBEBASKAN/DIBATALKAN` termapping benar,
   - filter status dan wilayah tetap bekerja.
3. Perbarui test export agar tetap valid ketika helper data tahunan dipakai ulang oleh UI.

# 5. Acceptance Criteria

- Halaman `/iuran/tagihan` menampilkan data per household dalam format matriks 12 bulan, bukan lagi daftar flat satu bill per baris.
- User dapat memilih tahun dan melihat seluruh status tagihan Januari–Desember untuk household yang lolos filter.
- Tombol generate di area tagihan membuat tagihan untuk 12 bulan pada satu tahun dalam satu alur, tanpa perlu generate per bulan manual.
- Menjalankan generate untuk tahun yang sama dua kali tidak membuat duplikasi `ContributionBill`.
- Tampilan sel matriks membedakan minimal `Lunas`, `Sebagian`, `Belum`, `Dibebaskan`, dan `Dibatalkan` dengan teks/label yang dapat dipahami tanpa bergantung pada warna saja.
- Filter pencarian, wilayah, dan status tetap berfungsi pada tampilan matriks tahunan.
- Export pembayaran tahunan tetap konsisten dengan struktur matriks yang tampil di UI.
- Dari halaman tagihan, user bisa menuju flow pembayaran yang lebih langsung daripada memilih manual dari dropdown 50 item.
- Query pembacaan tagihan tahunan tidak mem-fetch detail payment yang tidak dipakai hanya untuk menampilkan matrix status ringkas.
- Schema memiliki index yang mendukung query tahunan utama dan migration berhasil dibuat.

# 6. Verification Steps

- Jalankan unit/integration tests untuk modul kontribusi, terutama generator tahunan, mapping matriks, dan export pembayaran.
- Verifikasi manual:
  1. Buka `/iuran/tagihan`.
  2. Pilih satu tahun.
  3. Pastikan tabel menampilkan Jan–Des untuk setiap household.
  4. Jalankan generate tahunan untuk tahun yang belum ada.
  5. Refresh halaman dan pastikan seluruh bulan muncul tanpa duplikasi.
  6. Klik salah satu sel/aksi pada bill belum lunas dan pastikan flow pembayaran membawa konteks tagihan yang benar.
  7. Export pembayaran tahunan dan cocokkan beberapa household dengan tampilan matriks.
- Verifikasi edge case:
  - household inactive tidak ikut generate,
  - bill dibebaskan tetap tampil di matriks,
  - tahun yang sudah sebagian tergenerate tetap idempoten saat generate ulang,
  - household tanpa bill tampil sesuai keputusan desain (ditampilkan kosong atau tidak ditampilkan) dan konsisten dengan filter.
- Jika tersedia akses query plan lokal, cek bahwa index baru dipakai pada query tahunan utama.

# 7. Risks & Mitigations

- **Risk: payload query membesar saat membawa semua payments untuk setiap bill.**
  - Mitigasi: read-model matriks hanya ambil aggregate/status yang diperlukan; hindari nested `payments` penuh kecuali untuk tooltip/detail spesifik.

- **Risk: generate tahunan dalam satu transaction dapat berat pada dataset besar.**
  - Mitigasi: gunakan `createMany` per bulan dengan `skipDuplicates`, batasi select household ke field yang dibutuhkan, dan audit log ringkas.

- **Risk: menambah schema denormalisasi terlalu cepat akan memperumit konsistensi pembayaran/cancel/reversal.**
  - Mitigasi: tahap pertama fokus ke index + query service; evaluasi projection/cache hanya setelah ada bukti bottleneck.

- **Risk: flow pembayaran existing tidak cocok dengan UI matriks tahunan.**
  - Mitigasi: tambahkan deep-link atau preselected bill ke `PaymentForm` agar interaksi dari sel matriks tetap pendek dan jelas.

- **Risk: desain matriks 12 bulan buruk di mobile.**
  - Mitigasi: buat toolbar mobile-first, sticky identity columns bila memungkinkan, dan fallback horizontal scroll/card grouping yang tetap menjaga konteks bulan.

# 8. Notes from research

- Halaman tagihan sekarang belum punya summary KPI atau annual matrix; status masih tampil sebagai string mentah ([src/app/(app)/iuran/tagihan/page.tsx:98-279]).
- Generator sekarang hanya bulanan dan memakai `createMany(skipDuplicates: true)` untuk household aktif ([src/modules/contributions/services/generate-monthly-bills.ts:9-20]).
- Export Excel pembayaran sudah memakai format 12 bulan per household, sehingga sangat cocok dijadikan acuan shape UI ([src/modules/contributions/exports/export-contribution-payments.ts:22-69], [src/modules/contributions/exports/xlsx.ts:134-141]).
- Form pembayaran saat ini masih dropdown-based dan membatasi opsi ke 50 bill outstanding terakhir ([src/app/(app)/iuran/pembayaran/tambah/page.tsx:12-27]), yang akan menjadi bottleneck usability jika user bekerja dari matriks tahunan.