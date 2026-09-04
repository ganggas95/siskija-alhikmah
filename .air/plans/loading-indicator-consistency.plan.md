## 1. Goal
Memastikan setiap aksi yang memicu request ke backend di seluruh halaman aplikasi menampilkan loading indicator yang relevan: tombol aksi disabled dengan indikator loading, dan tabel list menampilkan loading indicator terpusat di area tabel saat filter, sort, tab, atau pagination memuat data baru.

## 2. Approach
Akan dipakai pendekatan komponen bersama, bukan patch per halaman secara ad-hoc. Alasan utamanya: pola request saat ini sudah cukup terpusat di komponen tombol/form dan komponen navigasi tabel, jadi memperbaiki fondasi bersama akan menutup banyak halaman sekaligus dan menjaga konsistensi UI. Untuk fetch berbasis navigasi server-rendered, loading tidak cukup diselesaikan dengan top progress bar di [route-progress.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/app/route-progress.tsx?type=file&root=%252F); perlu wrapper client-side yang mendeteksi transisi route/search-param dan menampilkan overlay di tengah kontainer tabel.

## 3. File Changes
- **Modify** [loading-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/loading-button.tsx?type=file&root=%252F)
  - Tambah indikator visual yang konsisten di dalam button saat `loading=true`, bukan hanya ganti label seperti implementasi saat ini pada baris 13-27.
- **Modify** [submit-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/submit-button.tsx?type=file&root=%252F)
  - Samakan perilaku dengan `LoadingButton`: disable tombol, set `aria-busy`, dan tampilkan spinner + label pending untuk semua form submission pada baris 14-32.
- **Modify** [form-actions.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/form-actions.tsx?type=file&root=%252F)
  - Pastikan tombol batal tetap non-interaktif saat submit pending dan mengikuti indikator loading yang sama untuk seluruh form CRUD.
- **Create** `src/components/app/loading-indicator.tsx`
  - Komponen indikator visual reusable untuk spinner/label yang dipakai di button dan table overlay.
- **Create** `src/components/table/table-loading-overlay.tsx`
  - Komponen overlay loading di tengah tabel dengan proper positioning, accessibility text, dan dukungan reuse untuk desktop/mobile list.
- **Create** `src/components/table/table-loading-state.tsx`
  - Wrapper client component yang memonitor transisi navigasi/search param dan menampilkan `table-loading-overlay` selama request list page berjalan.
- **Modify** [table-pagination.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-pagination.tsx?type=file&root=%252F)
  - Ganti link pagination pada baris 21-93 dengan versi yang bisa memberi tahu wrapper bahwa request tabel sedang berjalan, sambil tetap mempertahankan URL sebagai source of truth.
- **Modify** [sortable-header.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/sortable-header.tsx?type=file&root=%252F)
  - Ganti `Link` sorting pada baris 15-70 dengan navigasi yang mengaktifkan loading tabel sebelum route transition.
- **Modify** [table-filter-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-filter-modal.tsx?type=file&root=%252F)
  - Tombol submit filter pada baris 52-74 perlu memakai komponen loading button bersama agar disabled + spinner konsisten.
- **Modify** [jamaah/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/page.tsx?type=file&root=%252F)
  - Bungkus area list/table dengan wrapper loading state; ganti tombol pencarian biasa dan reset yang memicu reload data agar ikut memunculkan loading tabel.
- **Modify** [wilayah/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/wilayah/page.tsx?type=file&root=%252F)
  - Terapkan wrapper loading untuk mobile card + desktop table; tombol filter/search di baris 86-106 perlu konsisten dengan loading state.
- **Modify** [data-user/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/data-user/page.tsx?type=file&root=%252F)
  - Tambahkan loading state pada tabel user dan submit pencarian/filter.
- **Modify** [kas-masuk/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/kas-masuk/page.tsx?type=file&root=%252F)
  - Tabel daftar transaksi perlu loading overlay saat filter/sort/pagination; aksi verifikasi/hapus yang sudah memakai `SubmitButton` akan otomatis naik kualitas setelah komponen dasarnya diperbaiki.
- **Modify** [kas-keluar/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/kas-keluar/page.tsx?type=file&root=%252F)
  - Sama seperti kas masuk: overlay loading untuk tabel dan konsistensi action button.
- **Modify** [laporan/kas-bulanan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/laporan/kas-bulanan/page.tsx?type=file&root=%252F)
  - List transaksi laporan perlu loading overlay saat filter/pagination request.
- **Modify** [laporan/iuran/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/laporan/iuran/page.tsx?type=file&root=%252F)
  - Rekap tabel laporan iuran perlu loading overlay saat filter/pagination request.
- **Modify** [buku-kas/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/buku-kas/page.tsx?type=file&root=%252F)
  - Tabel ledger perlu loading overlay saat filter/sort/pagination.
- **Modify** [dashboard/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/dashboard/page.tsx?type=file&root=%252F)
  - Bagian tabel transaksi terbaru / daftar lain yang berubah via filter bulan/tahun/wilayah perlu loading indicator terlokalisasi, bukan hanya route progress global.
- **Modify** [iuran/pembayaran/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/pembayaran/page.tsx?type=file&root=%252F)
  - Daftar pembayaran perlu overlay loading saat filter/pagination; action button per baris sudah punya pending state dan akan diseragamkan dari komponen dasar.
- **Modify** [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F)
  - Navigasi tab, fullscreen toggle, dan pagination pada baris 74-242 memicu route transition; perlu loading overlay di area matriks, termasuk saat ganti wilayah tab atau halaman.
- **Modify** [iuran/tagihan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&root=%252F)
  - Integrasikan wrapper loading ke matriks/summary list page.
- **Modify** [import-household-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/import-household-modal.tsx?type=file&root=%252F)
  - Request `fetch` POST/import-template pada baris 70-260 masih memakai button manual; ubah agar semua tombol action memakai loading indicator dalam button, termasuk download template.
- **Modify** [export-payment-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/export-payment-modal.tsx?type=file&root=%252F)
  - Tombol export/cancel masih manual pada baris 138-157; ubah ke loading button konsisten.
- **Modify** [import-contribution-form.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/pembayaran/import/_components/import-contribution-form.tsx?type=file&root=%252F)
  - Audit seluruh fetch template/upload/import agar setiap button disabled + spinner, karena file ini menggunakan `fetch` langsung di beberapa titik menurut hasil pencarian.
- **Modify** [login-form.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/login/login-form.tsx?type=file&root=%252F)
  - Verifikasi hasil akhir tetap menampilkan indicator di tombol login setelah komponen dasar diubah.
- **Modify** [logout-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/app/logout-button.tsx?type=file&root=%252F)
  - Pastikan indikator loading visual ikut tampil, bukan hanya label berubah.
- **Modify** [request-state.test.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/app/request-state.test.ts?type=file&root=%252F)
  - Tambah/ubah test agar perilaku request loading tetap aman saat gagal/sukses.
- **Create** test file untuk wrapper/loading table, misalnya `src/components/table/table-loading-state.test.tsx`
  - Memastikan overlay aktif saat navigasi dimulai dan hilang setelah param/route berubah.

## 4. Implementation Steps
### Task 1: Standarkan indikator loading button
1. Ubah [loading-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/loading-button.tsx?type=file&root=%252F) agar menampilkan spinner/icon loading inline sebelum label, mempertahankan `disabled || loading`, dan memberi fallback `sr-only`/teks aksesibel.
2. Ubah [submit-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/submit-button.tsx?type=file&root=%252F) agar output visual sama dengan `LoadingButton` dan pending dari `useFormStatus()` tetap menjadi sumber kebenaran.
3. Sesuaikan [form-actions.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/form/form-actions.tsx?type=file&root=%252F) supaya tombol batal tetap disabled saat submit pending dan tidak terlihat aktif ketika request sedang berjalan.
4. Audit komponen yang masih memakai `<button>` manual untuk request backend — terutama [table-filter-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-filter-modal.tsx?type=file&root=%252F), [import-household-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/import-household-modal.tsx?type=file&root=%252F), dan [export-payment-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/export-payment-modal.tsx?type=file&root=%252F) — lalu pindahkan ke komponen loading bersama.

### Task 2: Tambahkan fondasi loading state untuk tabel
1. Buat `src/components/app/loading-indicator.tsx` untuk spinner/label reuse sehingga button dan table memakai visual yang sama.
2. Buat `src/components/table/table-loading-overlay.tsx` yang merender overlay semi-transparan dengan indikator di tengah kontainer tabel/list.
3. Buat `src/components/table/table-loading-state.tsx` sebagai client wrapper yang:
   - menerima child konten tabel/list,
   - menerima key/pathname/search-param saat ini,
   - expose helper untuk memulai transisi loading sebelum navigasi,
   - otomatis menghentikan loading saat pathname/search params tujuan sudah aktif.
4. Jika perlu, sediakan context atau callback sederhana agar `SortableHeader`, pagination, dan filter bisa memicu loading tanpa saling tahu implementasi internal.

### Task 3: Integrasikan loading ke navigasi tabel bersama
1. Refactor [table-pagination.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-pagination.tsx?type=file&root=%252F) agar link page memakai handler navigasi client-side yang menyalakan table loading lebih dulu, lalu melakukan `router.push`/`Link` ke URL target.
2. Refactor [sortable-header.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/sortable-header.tsx?type=file&root=%252F) dengan pola yang sama untuk sort request.
3. Refactor [table-filter-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/table/table-filter-modal.tsx?type=file&root=%252F) supaya submit filter menyalakan loading tabel dan tombol submit modal menampilkan spinner di dalam button.
4. Tambahkan pola submit pencarian list page yang saat ini masih `<form>` GET + `<button>` biasa agar memakai komponen/button loading dan ikut mengaktifkan overlay tabel saat submit.

### Task 4: Terapkan wrapper loading pada semua halaman list utama
1. Bungkus area hasil data pada [jamaah/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/page.tsx?type=file&root=%252F), [wilayah/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/wilayah/page.tsx?type=file&root=%252F), dan [data-user/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/data-user/page.tsx?type=file&root=%252F) sehingga mobile cards dan desktop table sama-sama tertutup overlay loading ketika filter/sort/page berubah.
2. Terapkan pola yang sama pada [kas-masuk/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/kas-masuk/page.tsx?type=file&root=%252F), [kas-keluar/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/kas-keluar/page.tsx?type=file&root=%252F), [buku-kas/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/buku-kas/page.tsx?type=file&root=%252F), [laporan/kas-bulanan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/laporan/kas-bulanan/page.tsx?type=file&root=%252F), dan [laporan/iuran/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/laporan/iuran/page.tsx?type=file&root=%252F).
3. Terapkan wrapper atau integrasi serupa pada [iuran/pembayaran/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/pembayaran/page.tsx?type=file&root=%252F) dan [iuran/tagihan/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/page.tsx?type=file&root=%252F), termasuk [annual-bills-matrix.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/tagihan/_components/annual-bills-matrix.tsx?type=file&root=%252F) karena tab dan fullscreen toggle juga memicu backend render baru.
4. Untuk [dashboard/page.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/dashboard/page.tsx?type=file&root=%252F), batasi overlay hanya pada area data yang berubah, agar kartu ringkasan tidak terlihat broken saat filter reload.

### Task 5: Tutup gap fetch manual non-form
1. Ubah tombol aksi di [import-household-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/import-household-modal.tsx?type=file&root=%252F) sehingga:
   - tombol submit import menampilkan spinner di dalam button,
   - tombol download template menampilkan spinner saat `fetch` berjalan,
   - tombol batal tetap disabled selama request aktif.
2. Ubah tombol di [export-payment-modal.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/jamaah/_components/export-payment-modal.tsx?type=file&root=%252F) agar export memakai loading indicator di button dan cancel nonaktif saat request berjalan.
3. Audit [import-contribution-form.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/pembayaran/import/_components/import-contribution-form.tsx?type=file&root=%252F) untuk semua `fetch` langsung (template/upload/import) dan ganti button manual dengan loading button yang sama.
4. Verifikasi komponen mutasi yang sudah memakai `LoadingButton`/`SubmitButton` seperti [login-form.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/login/login-form.tsx?type=file&root=%252F), [logout-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/app/logout-button.tsx?type=file&root=%252F), [payment-action-button.tsx](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/app/%28app%29/iuran/pembayaran/_components/payment-action-button.tsx?type=file&root=%252F), dan CRUD forms lain tetap kompatibel setelah komponen dasar berubah.

### Task 6: Verifikasi otomatis
1. Tambah unit test untuk komponen loading button agar assert disabled state, `aria-busy`, dan spinner/label pending.
2. Tambah test untuk wrapper table loading (`table-loading-state`) agar loading aktif saat navigasi tabel dimulai dan berhenti saat route/search-param berubah.
3. Sesuaikan [request-state.test.ts](air-file://0r90263oosr3m9hbokp6/Users/nizar/MyProject/sismata/src/components/app/request-state.test.ts?type=file&root=%252F) jika ada perilaku loading/error yang berubah akibat standardisasi button.
4. Jalankan verifikasi minimal pada test yang relevan untuk komponen baru dan halaman list yang terkena pola shared.

## 5. Acceptance Criteria
- Setiap tombol yang memicu POST/mutasi backend menampilkan indikator loading di dalam button dan tidak bisa diklik ulang selama request pending.
- Setiap tombol submit form yang memakai `SubmitButton` menampilkan spinner + label pending yang konsisten.
- Aksi fetch manual seperti import, export, download template, dan logout menampilkan spinner di button yang memicu request.
- Pada halaman tabel/list, saat user menjalankan pencarian, filter, sorting, pagination, atau tab yang memicu request server, area tabel/list menampilkan loading indicator di tengah kontainer sampai data baru selesai dimuat.
- Loading tabel muncul di area konten data, bukan hanya progress bar global di atas halaman.
- Empty state tetap tampil hanya setelah request selesai; selama request berjalan, overlay loading lebih diprioritaskan daripada menampilkan tabel kosong sementara.
- Semua tombol cancel/secondary yang berpotensi memicu state conflict menjadi nonaktif saat request terkait masih berjalan.
- Komponen shared yang baru tetap menjaga accessibility dengan `aria-busy`, disabled state, dan teks loading yang dapat dibaca.
- Halaman berikut minimal tercakup oleh pola loading tabel: jamaah, wilayah, data user, kas masuk, kas keluar, buku kas, laporan kas bulanan, laporan iuran, iuran pembayaran, dan matriks iuran tahunan.

## 6. Verification Steps
- Jalankan unit/component tests yang relevan untuk komponen shared loading dan request state.
- Uji manual halaman list berikut:
  - `/jamaah`: cari, filter, sort, pagination.
  - `/wilayah`: cari/filter, sort, pagination.
  - `/data-user`: cari/filter, sort, pagination.
  - `/kas-masuk` dan `/kas-keluar`: filter, sort, pagination, verify/delete action.
  - `/iuran/pembayaran`: filter, pagination, approve/cancel action.
  - `/iuran/tagihan`: ganti tab wilayah, pagination, toggle fullscreen, generate bill per sel.
- Uji manual fetch non-form:
  - modal import jamaah: download template dan submit import.
  - modal export pembayaran: submit export.
  - import pembayaran iuran: semua tombol fetch.
- Uji manual form CRUD utama seperti tambah/edit kas masuk, kas keluar, wilayah, jamaah, dan pembayaran iuran untuk memastikan submit button disable + spinner dan redirect pasca submit tetap berjalan.
- Verifikasi bahwa loading overlay muncul di tengah area tabel, tidak menggeser layout utama, dan hilang setelah hasil baru tampil.

## 7. Risks & Mitigations
- **Risk:** Navigasi tabel saat ini banyak memakai `Link` dan GET form server-rendered, sehingga sinkronisasi start/stop loading bisa race dengan perubahan route.
  - **Mitigation:** Gunakan wrapper client yang membandingkan pathname + serialized search params saat ini terhadap target request, lalu reset loading hanya ketika navigasi benar-benar berubah.
- **Risk:** Overlay loading bisa menutupi aksi row-level yang justru tidak terkait fetch list.
  - **Mitigation:** Batasi overlay hanya aktif untuk request list-level (search/filter/sort/pagination/tab), bukan untuk server action per-row yang sudah punya pending state sendiri.
- **Risk:** Visual spinner di button bisa memecah layout button sempit pada tabel aksi.
  - **Mitigation:** Gunakan indikator inline kecil dengan lebar stabil dan label pending yang tetap singkat, terutama untuk tombol aksi tabel.
- **Risk:** Ada beberapa tombol manual yang memakai state lokal `isLoading`/`importing` terpisah dan bisa saling tumpang tindih.
  - **Mitigation:** Rapikan state per aksi dan pastikan sumber disabled/loading eksplisit per tombol, bukan satu flag global yang tidak membedakan jenis request.
- **Risk:** Halaman dashboard/matriks memiliki beberapa area data; overlay penuh halaman bisa terasa berat.
  - **Mitigation:** Tempatkan wrapper pada subkontainer data yang berubah, bukan seluruh page section.

## 8. Questions that truly block implementation
Tidak ada blocker requirement yang perlu ditanyakan. Ekspektasi perilaku sudah cukup jelas: loading di tengah tabel untuk request list, dan button disabled + loading indicator untuk action POST/fetch ke backend.