# Goal
Menambahkan view tab per wilayah pada halaman matriks tagihan tahunan, sekaligus memastikan view utama dan modal full-screen sama-sama memiliki pencarian, filter, dan pagination yang usable tanpa kehilangan aksi matriks yang sudah ada.

# Approach
Halaman [page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&linesData=%7B%22range%22%3A%7B%22first%22%3A0%2C%22second%22%3A2779%7D%2C%22lines%22%3A%7B%22first%22%3A0%2C%22second%22%3A95%7D%7D&root=%252F) saat ini hanya memuat satu dataset flat, satu toolbar di luar modal, dan satu pagination global di bawah tabel. Komponen [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&linesData=%7B%22range%22%3A%7B%22first%22%3A0%2C%22second%22%3A9465%7D%2C%22lines%22%3A%7B%22first%22%3A0%2C%22second%22%3A320%7D%7D&root=%252F) juga merender matrix fullscreen tanpa toolbar dan tanpa pagination, sehingga dua view tidak setara.

Pendekatan yang paling aman adalah mempertahankan filtering dan pagination di server, lalu memperkaya hasil query di [get-annual-bills-matrix.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.ts?type=file&linesData=%7B%22range%22%3A%7B%22first%22%3A0%2C%22second%22%3A7005%7D%2C%22lines%22%3A%7B%22first%22%3A0%2C%22second%22%3A274%7D%7D&root=%252F) dengan metadata tab wilayah dan subset rows per wilayah. UI kemudian dipecah menjadi komposisi shared: toolbar + tabs + matrix table + pagination, sehingga view utama dan modal fullscreen memakai struktur interaksi yang sama, hanya berbeda container/layout.

# File Changes
- **Modify** [src/app/(app)/iuran/tagihan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&root=%252F)
  - Saat ini membaca `q`, `regionId`, `status`, `year`, `page` dan memanggil `getAnnualBillsMatrix(...)` di baris 27-53, lalu menaruh toolbar di dalam `AnnualBillsMatrix` dan pagination di luar komponen di baris 66-93.
  - Akan diubah untuk juga membaca state tab wilayah aktif dari query string, meneruskan seluruh metadata region-tabs ke komponen matriks, dan memindahkan pagination agar bisa dirender konsisten di view utama maupun fullscreen.

- **Modify** [src/app/(app)/iuran/tagihan/_components/annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F)
  - Saat ini hanya punya satu header, satu tombol expand, dan dua render `MatrixTable` flat pada baris 67-111; fullscreen dialog di baris 76-100 tidak memiliki search/filter/pagination.
  - Akan direfaktor menjadi shell yang merender tabs per wilayah, toolbar yang bisa dipakai di dua konteks, pagination per view, dan satu renderer matrix reusable untuk view embedded dan fullscreen.

- **Modify** [src/app/(app)/iuran/tagihan/_components/annual-bills-toolbar.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-toolbar.tsx?type=file&root=%252F)
  - Saat ini hanya menangani filter umum dan generate-tagihan; belum mengenal query param tab wilayah dan belum reusable untuk fullscreen section.
  - Akan ditambah awareness terhadap `tabRegion`/state tab aktif, reset-link yang mempertahankan konteks tab, dan opsi layout agar toolbar yang sama bisa dipakai di view card dan modal fullscreen.

- **Modify** [src/modules/contributions/queries/get-annual-bills-matrix.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.ts?type=file&root=%252F)
  - Saat ini query household flat dengan `orderBy: { code: "asc" }` di baris 107-118 dan mengembalikan `rows`, `totalHouseholds`, `summary` pada baris 88-98 dan 263-273.
  - Akan diperluas untuk menghasilkan daftar tab wilayah (`all` + region aktif yang tersedia pada hasil filter), menghitung total item per tab, dan menyiapkan subset rows terurut per wilayah untuk page aktif.

- **Modify** [src/modules/contributions/annual-bills.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/annual-bills.ts?type=file&root=%252F)
  - Saat ini hanya mendefinisikan `AnnualBillsMatrixRow` flat dan builder rows di baris 34-40 dan 110-175.
  - Akan ditambah type baru untuk `AnnualBillsRegionTab`, `AnnualBillsRegionMatrixView`, dan helper grouping/sorting rows per wilayah agar query layer dan UI layer memakai kontrak yang konsisten.

- **Modify** [src/modules/contributions/queries/get-annual-bills-matrix.test.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.test.ts?type=file&root=%252F)
  - Saat ini hanya menguji mapping 12 bulan, payment totals, summary, dan household where di baris 7-97.
  - Akan ditambah test untuk grouping/tab metadata wilayah, fallback household tanpa wilayah, ordering tab, dan total per tab agar perubahan query-result tetap terjaga.

- **Possibly modify** [src/components/table/table-pagination.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-pagination.tsx?type=file&root=%252F)
  - Jika diperlukan, komponen ini akan dipakai ulang tanpa perubahan logika; bila ada perubahan, hanya untuk memperbaiki label/href saat pagination dirender di dalam fullscreen dialog dengan query string yang mempertahankan tab aktif.

# Implementation Steps
## Task 1: Tambahkan model data tab wilayah untuk matriks iuran
1. Di [src/modules/contributions/annual-bills.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/annual-bills.ts?type=file&root=%252F), definisikan type baru untuk tab wilayah, misalnya `AnnualBillsRegionTab` (id/value, label, totalHouseholds) dan payload view aktif (rows, totalHouseholds, activeRegionKey).
2. Di file yang sama, tambahkan helper pure untuk:
   - normalisasi nama wilayah (`Tanpa Wilayah` untuk `null`),
   - grouping `AnnualBillsMatrixRow[]` ke bucket wilayah,
   - sorting tabs berdasarkan nama wilayah, dengan tab `Semua Wilayah` selalu di awal.
3. Pastikan helper tetap pure dan bisa diuji tanpa akses database, mengikuti pola builder yang sudah ada di baris 110-175.

## Task 2: Perluas query server agar mengembalikan data tab wilayah yang dipaginasi
1. Di [src/modules/contributions/queries/get-annual-bills-matrix.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.ts?type=file&root=%252F), perluas `AnnualBillsMatrixInput` untuk menerima parameter tab wilayah aktif yang terpisah dari `regionId` filter global.
2. Pertahankan `regionId` yang sudah ada sebagai filter global dataset pada `buildAnnualBillsHouseholdWhere(...)` di baris 26-59, sehingga jika user memfilter satu wilayah saja, tab yang tampil tetap konsisten dengan dataset hasil filter.
3. Ubah query household pada baris 106-120 agar order utamanya berdasarkan nama wilayah lalu kode jamaah, sehingga distribusi rows per tab stabil dan tidak meloncat saat pagination pindah.
4. Setelah `rows` dibentuk melalui `buildAnnualBillsMatrixRows(...)`, group rows per wilayah di memory, lalu tentukan:
   - daftar tabs yang tersedia,
   - tab aktif valid berdasarkan query string,
   - `totalHouseholds` untuk tab aktif,
   - subset `rows` untuk page aktif pada tab tersebut.
5. Pertahankan `summary` existing pada baris 226-261 sebagai summary dataset terfilter global, bukan summary per tab, kecuali ada kebutuhan baru yang eksplisit.
6. Kembalikan shape hasil yang mencakup `tabs`, `activeTab`, `rowsForActiveTab`, dan `totalHouseholdsForActiveTab` agar page/UI tidak perlu menghitung ulang.

## Task 3: Hubungkan query params halaman dengan state tab wilayah dan pagination
1. Di [src/app/(app)/iuran/tagihan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&root=%252F), baca query param baru untuk tab aktif wilayah, selain `q`, `regionId`, `status`, `year`, dan `page` yang sudah dibaca pada baris 27-32.
2. Saat memanggil `getAnnualBillsMatrix(...)` di baris 43-53, kirim parameter tab aktif tersebut dan gunakan `matrix.totalHouseholdsForActiveTab` sebagai basis pagination, bukan total flat lama.
3. Pindahkan tanggung jawab render pagination dari container luar baris 84-93 ke komponen `AnnualBillsMatrix`, supaya view embedded dan fullscreen bisa sama-sama menerima pagination dengan total/tab state yang sama.
4. Pastikan semua link/query string mempertahankan `year`, `q`, `status`, `regionId`, dan tab aktif, serta meng-reset `page` ke 1 ketika tab wilayah berubah.

## Task 4: Refactor toolbar agar reusable dan aware terhadap tab wilayah
1. Di [src/app/(app)/iuran/tagihan/_components/annual-bills-toolbar.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-toolbar.tsx?type=file&root=%252F), perluas props agar menerima tab aktif wilayah dan mode tampilan (`embedded`/`fullscreen`) bila perlu untuk spacing/layout.
2. Update `resetHref` dan `generateRedirectTo` pada baris 50-64 supaya tetap membawa konteks tab aktif bila user reset sebagian filter atau selesai generate tagihan.
3. Tambahkan hidden input atau query propagation yang memastikan search/filter submit dari toolbar tidak menghapus state tab wilayah aktif secara tidak sengaja.
4. Pertahankan behavior filter saat ini—query teks, tahun, wilayah, status—karena itu sudah menjadi mekanisme server-side utama pada baris 68-125.

## Task 5: Bangun tab per wilayah dan parity fitur antara view utama dan fullscreen
1. Di [src/app/(app)/iuran/tagihan/_components/annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F), ubah prop komponen agar menerima:
   - metadata tabs wilayah,
   - active tab,
   - rows untuk tab aktif,
   - pagination props,
   - toolbar node shared.
2. Ganti layout flat di baris 67-111 dengan komposisi berikut untuk view utama:
   - header + tombol expand,
   - toolbar,
   - `Tabs/TabsList/TabsTrigger/TabsContent` dari [src/components/ui/tabs.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/ui/tabs.tsx?type=file&root=%252F),
   - `MatrixTable` untuk tab aktif,
   - `TablePagination` tepat di dalam card bawah tabel.
3. Ulangi komposisi yang sama di fullscreen dialog pada area baris 82-99, bukan hanya `MatrixTable`, agar fullscreen punya search/filter/pagination setara dengan view utama.
4. Gunakan satu renderer shared, misalnya `AnnualBillsMatrixContent`, untuk menghindari duplikasi besar antara embedded dan fullscreen. Perbedaan kedua view cukup pada wrapper class (`overflow`, `padding`, `height`).
5. Tampilkan label jumlah keluarga per tab wilayah agar pengguna paham skala masing-masing wilayah sebelum membuka tab.
6. Pastikan tab change menggunakan link/query-driven navigation atau controlled state yang sinkron dengan URL; untuk kebutuhan server-side pagination yang sudah ada, query-driven tab lebih konsisten daripada local-only state.

## Task 6: Pertahankan aksi sel matriks dan empty-state pada tab aktif
1. Biarkan `MatrixTable`, `MatrixCell`, dan `EmptyMatrixCell` di [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F) tetap memakai behavior existing untuk bayar/generate/edit/batalkan draft pada baris 180-320.
2. Pastikan `redirectTo` yang dibangun lewat `buildQueryString(...)` di baris 191 dan 221 tetap menyimpan query tab aktif agar setelah aksi pembayaran/generate user kembali ke wilayah dan page yang sama.
3. Tambahkan empty state spesifik untuk tab aktif bila suatu wilayah tidak punya row pada hasil filter/pagination, tanpa menampilkan pesan “Belum ada household pada matriks ini” untuk seluruh halaman bila tab lain masih memiliki data.

## Task 7: Tambahkan test untuk kontrak baru
1. Di [src/modules/contributions/queries/get-annual-bills-matrix.test.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.test.ts?type=file&root=%252F), tambahkan unit test untuk builder/result yang memverifikasi:
   - household terbagi ke tab wilayah yang benar,
   - household `region = null` masuk tab fallback yang stabil,
   - pagination menghitung total berdasarkan tab aktif,
   - switching tab tidak mengubah summary global.
2. Bila helper grouping dipindahkan ke [annual-bills.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/annual-bills.ts?type=file&root=%252F), tambahkan test pure tambahan di file test yang sama agar logika region-tabs tidak hanya tertutup secara implisit.

# Acceptance Criteria
- Pada [halaman matriks tagihan tahunan](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&root=%252F), pengguna melihat tab `Semua Wilayah` plus satu tab untuk setiap wilayah yang muncul pada dataset hasil filter.
- Saat pengguna memilih tab wilayah tertentu, tabel hanya menampilkan household dari wilayah itu, dan jumlah item pagination mengikuti total household pada tab aktif.
- View utama di card dan view modal full-screen sama-sama menampilkan pencarian, filter, tab wilayah, tabel matriks, dan pagination.
- Pencarian, filter status, filter wilayah global, dan perubahan tahun tetap bekerja server-side dan menghasilkan URL yang bisa di-refresh/share tanpa kehilangan state tab aktif.
- Aksi sel matriks—generate tagihan per bulan kosong, bayar tagihan, edit draft, batalkan draft—tetap mengembalikan pengguna ke tab wilayah dan page yang sama setelah redirect.
- Jika household tidak memiliki wilayah, data tersebut tetap bisa diakses melalui tab fallback yang jelas namanya, bukan hilang dari matriks.
- Summary kartu di atas matriks tetap konsisten dengan dataset hasil filter global, tidak rusak oleh pagination/tab switching.
- Query/result tests mencakup setidaknya satu kasus multi-wilayah, satu kasus tanpa wilayah, dan satu kasus pagination berbasis tab aktif.

# Verification Steps
- Jalankan test unit yang relevan untuk query matriks iuran, minimal target file [get-annual-bills-matrix.test.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.test.ts?type=file&root=%252F).
- Buka halaman `/iuran/tagihan`, lalu verifikasi manual skenario berikut:
  1. Tab default `Semua Wilayah` muncul dan menampilkan data existing.
  2. Berpindah ke salah satu tab wilayah mereset page ke 1 dan menampilkan household yang sesuai.
  3. Search/filter dari view utama memperbarui hasil tabel dan tab counts.
  4. Klik expand membuka fullscreen dan di dalam modal tersedia search/filter/tab/pagination yang sama.
  5. Pagination di fullscreen dan view utama sama-sama mengubah dataset sesuai tab aktif.
  6. Jalankan satu aksi sel (mis. bayar/generate) dan pastikan redirect kembali ke tab wilayah yang sama.
- Uji edge case berikut:
  - hasil filter membuat hanya satu tab tersedia,
  - tab aktif di URL tidak valid lagi setelah filter berubah,
  - wilayah tanpa data pada page tertentu,
  - household tanpa wilayah.

# Risks & Mitigations
- **Risiko mismatch antara filter wilayah global dan tab wilayah aktif.** `regionId` saat ini sudah menjadi filter dataset di [get-annual-bills-matrix.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/modules/contributions/queries/get-annual-bills-matrix.ts?type=file&root=%252F) baris 46 dan 193-195; jika tidak dibedakan dari tab aktif, hasilnya bisa redundan atau membingungkan. Mitigasi: jadikan `regionId` tetap sebagai filter global dataset, sementara tab wilayah memakai key terpisah (`tabRegion`) yang hanya memilih subset dari dataset terfilter.
- **Risiko duplikasi UI antara embedded dan fullscreen.** [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F) saat ini merender dua versi tabel berbeda di baris 91-97 dan 105-111. Mitigasi: ekstrak satu content renderer shared dan satu toolbar shared.
- **Risiko pagination terasa “lompat” saat pindah tab atau filter.** Pagination existing hanya berbasis `page` global dari [table-query.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/lib/table-query.ts?type=file&root=%252F) baris 30-42. Mitigasi: reset `page` ke 1 pada perubahan tab/filter dan validasi `safePage` terhadap total tab aktif.
- **Risiko redirect aksi sel menghilangkan konteks tab.** `redirectTo` di [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F) baris 191 dan 221 bergantung pada `currentSearchParams`. Mitigasi: pastikan query param baru untuk tab aktif ikut dipropagasikan ke semua `buildQueryString(...)` yang dipakai aksi.
- **Risiko summary dan rows memakai basis hitung berbeda.** Saat ini summary dihitung dari seluruh dataset terfilter di baris 190-224 dan 226-261, sedangkan rows akan dipotong per tab/page. Mitigasi: dokumentasikan kontrak bahwa summary bersifat global sesuai filter, dan gunakan nama prop yang eksplisit (`summary`, `activeTabRows`, `activeTabTotal`) agar tidak tertukar di UI.