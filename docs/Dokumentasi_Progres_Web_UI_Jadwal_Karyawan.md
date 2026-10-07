# Dokumentasi Progres Pengembangan Web UI — Jadwal Karyawan

**Status:** Draft / Living Document  
**Versi:** 2.8  
**Tanggal:** 2026-10-07  
**Repository:** `veriyansyah1225-debug/jadwal-karyawan-web`  
**Database:** `database-jadwal-karyawan` / PostgreSQL 17 / Supabase

---

## 1. Tujuan Dokumen

Dokumen ini mencatat progres nyata pengembangan **Web UI Jadwal Karyawan** yang terhubung dengan database PostgreSQL/Supabase.

Dokumen ini berbeda dengan **Roadmap Pengembangan Web UI — Database Jadwal Karyawan**. Roadmap berisi rencana pekerjaan, sedangkan dokumen ini berisi implementasi yang sudah dilakukan, hasil pengujian, keputusan teknis, temuan, dan pekerjaan yang masih terbuka.

Dokumen bersifat **living document**. Tidak semua keputusan di dalamnya dianggap final; aturan bisnis, keamanan, struktur UI, dan fitur dapat berubah setelah validasi operasional.

---

## 2. Kondisi Dasar Database

Web UI menggunakan project database terpisah:

`database-jadwal-karyawan`

Komponen yang tersedia saat Web UI mulai dikembangkan:

| Komponen | Kondisi |
|---|---:|
| Departments | 2 |
| JOB | 11 |
| Karyawan | 60 |
| Kode jadwal | 6 |
| Jadwal Oktober 2026 | 522 record saat ini |
| Data absensi | 0 record |
| View `v_jadwal_karyawan` | Tersedia |

Database PostgreSQL/Supabase menjadi sumber data utama Web UI.

**Catatan master data terbaru:** JOB `Kandang` tersedia pada Departemen FARM dan seluruh 17 nama Kandang sudah dimasukkan. JOB `IB` juga sudah ditambahkan pada Departemen FARM bersama 12 karyawan baru. Jadwal Oktober JOB Kandang sudah dikoreksi berdasarkan tabel sumber terbaru: 68 record kode L dan 1 record CT untuk RIDWAN pada 1 Oktober 2026. Untuk JOB IB, 12 karyawan masing-masing memiliki 4 record kode L pada 4, 11, 18, dan 25 Oktober 2026. JOB MEKANIK juga mendapat tambahan karyawan ARIF dengan 4 record L pada 1, 8, 15, dan 22 Oktober 2026.

---

## 3. Repository dan Teknologi

### Repository

- GitHub: `veriyansyah1225-debug/jadwal-karyawan-web`
- Branch utama: `main`

### Teknologi

- React 19
- React DOM 19
- Vite 7
- `@supabase/supabase-js`
- CSS custom
- Supabase/PostgreSQL
- Vercel untuk deployment

### Environment Variable

Frontend menggunakan:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Nilai yang digunakan untuk `VITE_SUPABASE_ANON_KEY` adalah Supabase Publishable Key. Service-role/secret key tidak boleh dimasukkan ke frontend atau repository.

---

## 4. Baseline Desain dan Prototype

### Prototype UI v1

File:

`prototype/index.html`

Mencakup konsep awal:

- sidebar;
- filter periode;
- filter Departemen;
- filter JOB;
- pencarian karyawan;
- tabel jadwal;
- sticky column;
- kode warna;
- legenda;
- responsive dasar.

### Prototype UI v2

File:

`prototype/index-v2.html`

Menyempurnakan:

- jumlah hari dinamis;
- label hari;
- filter;
- pencarian;
- jumlah hasil;
- empty/loading/error state;
- responsive;
- demo data.

Prototype v2 kemudian dijadikan baseline sementara untuk implementasi React.

---

## 5. Implementasi Frontend dan Integrasi Database

Prototype v2 diimplementasikan menjadi aplikasi React.

Fungsi dasar yang telah dibuat:

- halaman Jadwal Karyawan;
- tabel tanggal dinamis;
- label hari;
- filter Departemen;
- filter JOB;
- pemilihan karyawan;
- sticky kolom;
- legenda dan kode warna;
- loading/error/empty state.

Sumber data utama:

`v_jadwal_karyawan`

Alur data:

```
Browser
   |
   v
React + Vite
   |
   v
Supabase Client
   |
   v
v_jadwal_karyawan
   |
   v
PostgreSQL
```

Data dari view kemudian dikelompokkan oleh frontend menjadi tabel jadwal.

---

## 6. Deployment dan Pengujian Online

Aplikasi dideploy melalui Vercel.

Konfigurasi:

- Repository: `jadwal-karyawan-web`
- Branch: `main`
- Framework: Vite
- Environment: Production

Website:

`https://jadwal-karyawan-web.vercel.app`

Pada deployment awal pernah muncul:

```
Gagal memuat data Supabase: Invalid API key
```

Masalah diselesaikan dengan memperbaiki environment variable Vercel.

Pengujian berikutnya berhasil memastikan:

- halaman dapat dibuka;
- tabel tampil;
- data Supabase berhasil dimuat;
- data PostgreSQL aktual tampil di browser;
- deployment Production dapat digunakan untuk pengujian.

---

## 7. Validasi Data dan Perbaikan Pembacaan JOB

Pengujian awal dilakukan pada:

- Bulan: Oktober 2026
- Departemen: FARM
- Total karyawan yang tampil: 20

Pada data tersebut ditemukan perbedaan antara JOB master karyawan dan JOB yang dapat muncul pada record jadwal.

Perbaikan dilakukan tanpa mengubah isi jadwal secara asumtif:

1. View `v_jadwal_karyawan` ditambah `job_master_id` dan `nama_job_master`, sementara kolom lama tetap dipertahankan.
2. Frontend mengelompokkan jadwal berdasarkan `employee_id`, bukan kombinasi JOB dan nama.
3. JOB master digunakan sebagai informasi JOB utama bila tersedia.
4. Assignment JOB pada tanggal tertentu tetap dapat ditampilkan sebagai informasi jadwal.
5. Assignment seperti `KANTIN` atau `LONDRY` dapat ditampilkan langsung pada sel jika tidak mempunyai schedule code.

Tujuannya agar satu karyawan tidak terpecah menjadi beberapa baris hanya karena assignment JOB berbeda pada tanggal tertentu.

**Catatan:** struktur bisnis JOB master vs JOB assignment masih perlu divalidasi sebelum dilakukan perubahan database lebih lanjut.

---

## 8. Fitur Web UI Saat Ini

| Fitur | Status |
|---|---|
| Repository GitHub khusus | ✓ Selesai |
| Prototype UI v1 | ✓ Selesai |
| Prototype UI v2 | ✓ Selesai |
| React + Vite | ✓ Selesai |
| Integrasi Supabase | ✓ Selesai |
| Query `v_jadwal_karyawan` | ✓ Selesai |
| Loading / Error / Empty state | ✓ Selesai |
| Filter rentang tanggal | ✓ Selesai |
| Pemilih bulan Januari–Desember | ✓ Selesai |
| Filter Departemen dari master `departments` | ✓ Selesai |
| Filter JOB | ✓ Selesai |
| Multi-select karyawan | ✓ Selesai |
| Pencarian nama dalam picker | ✓ Selesai |
| Pilih Semua / Hapus Semua | ✓ Selesai |
| Tabel jadwal | ✓ Selesai |
| Tanggal dinamis | ✓ Selesai |
| Label hari | ✓ Selesai |
| Sticky JOB/Nama | ✓ Selesai |
| Toggle Tampilkan Job / Sembunyikan Job | ✓ Selesai |
| Kode warna jadwal | ✓ Selesai |
| Legenda kode jadwal | ✓ Selesai |
| Detail jadwal per sel | ✓ Selesai |
| Responsive dasar | ✓ Selesai |
| Mode Perbesar Jadwal | ✓ Selesai |
| Penanda khusus header hari Minggu | ✓ Selesai |
| Deployment Vercel | ✓ Selesai |
| Pengujian browser online | ✓ Selesai |
| Authentication | Belum |
| RLS policy final | Belum |
| Input/Edit jadwal | Belum |
| Modul absensi | Belum |
| Laporan | Belum |
| Export Excel/PDF | ✓ Selesai |
| Audit/histori perubahan | Belum |

---

## 9. Penyempurnaan UI Terbaru

### 9.1 Filter Rentang Tanggal

Pemilihan periode tidak lagi bergantung pada satu bulan saja.

Tersedia:

- **Dari Tanggal**
- **Sampai Tanggal**

Rentang dapat melewati bulan, misalnya 28 Oktober 2026 sampai 5 November 2026.

Tabel hanya menampilkan tanggal yang berada dalam rentang tersebut.

### 9.2 Pemilih Bulan

Shortcut periode disempurnakan menjadi **Pilih Bulan**.

Daftar berisi Januari sampai Desember. Memilih bulan otomatis mengatur:

- tanggal awal = hari pertama bulan;
- tanggal akhir = hari terakhir bulan.

Input rentang tanggal tetap tersedia untuk kebutuhan custom.

Perhitungan tanggal menggunakan kalender lokal untuk mencegah pergeseran tanggal akibat konversi UTC.

### 9.3 Multi-select Karyawan

Kontrol **Pilih Karyawan** menyediakan:

- pilih satu atau beberapa karyawan;
- pencarian nama;
- Pilih Semua;
- Hapus Semua;
- ringkasan jumlah pilihan.

Pemilihan menggunakan `employee_id`.

Jika tidak ada karyawan yang dipilih, semua karyawan yang sesuai filter ditampilkan.

### 9.4 Mode Perbesar Jadwal

**Perbesar Jadwal** memperluas area tabel dengan menyembunyikan elemen halaman yang tidak diperlukan untuk pembacaan jadwal.

Tombol berubah menjadi **Kembalikan Tampilan** saat mode aktif.

Mode ini hanya memengaruhi tampilan, bukan data.

### 9.5 Toggle Kolom JOB

Kolom JOB secara default disembunyikan.

Kontrol:

- **Tampilkan Job**
- **Sembunyikan Job**

Saat JOB disembunyikan, kolom Nama Karyawan menjadi kolom sticky paling kiri.

### 9.6 Header Hari Minggu

Hanya header tanggal yang merupakan hari Minggu diberi penanda visual khusus.

Sel jadwal di bawah hari Minggu tidak ikut diubah warnanya.

---

## 10. Fitur Lama yang Tidak Lagi Menjadi Desain Saat Ini

Dokumentasi sebelumnya pernah mencatat **Mode Ringkas Hari**, yaitu mode untuk menyembunyikan Sabtu dan Minggu.

Fitur tersebut **sudah tidak menjadi desain UI saat ini**. Konsepnya digantikan oleh filter rentang tanggal.

Sabtu dan Minggu tetap dapat ditampilkan jika masuk dalam rentang tanggal yang dipilih.

Catatan ini dipertahankan hanya sebagai sejarah pengembangan agar tidak menimbulkan kebingungan ketika membaca riwayat lama.

---

## 11. Temuan dan Keputusan yang Masih Terbuka

### 11.1 JOB Master vs JOB Assignment

Untuk tahap stabilisasi saat ini, aturan bisnis sementara sudah ditetapkan:

- seluruh karyawan Departemen HATCHERY menggunakan JOB master HATCHERY;
- assignment JOB pada tanggal tertentu tetap disimpan pada employee_schedules.job_id;
- assignment seperti KANTIN atau LONDRY tidak mengubah Departemen/JOB master karyawan;
- Deta dan Alda tetap tercatat sebagai karyawan HATCHERY, walaupun pada tanggal tertentu mendapat assignment di FARM.

Detail JOB internal HATCHERY seperti admin, holding, sexer, dan pembagian lebih rinci ditunda sampai database stabil.

### 11.2 Penambahan JOB Kandang dan Karyawan Kandang

Pada 2026-10-07, JOB master **Kandang** tersedia pada Departemen FARM.

Daftar sumber berisi 17 nama karyawan dengan JOB Kandang. Seluruh 17 nama sudah dimasukkan ke master `employees` sebagai karyawan FARM dengan JOB master Kandang.

Hasil verifikasi:

- total karyawan FARM / Kandang = 17;
- seluruh 17 karyawan memiliki Departemen FARM;
- seluruh 17 karyawan memiliki JOB master Kandang;
- HERI = employee_id 31;
- karyawan Kandang terakhir yang ditambahkan memperoleh employee_id 47;
- 68 record libur kode L Oktober 2026 dimasukkan untuk 17 karyawan Kandang;
- 1 record CT untuk RIDWAN pada 1 Oktober 2026;
- total `employee_schedules` saat ini = 470;
- tidak ditemukan duplikasi pasangan employee_id dan tanggal.

### 11.3 Perubahan Desain Kode Libur: L sebagai Satu-satunya Kode Libur

Keputusan desain terbaru: **L dan OFF pada sumber sama-sama berarti libur. Desain sistem kemudian diubah agar `L` menjadi satu-satunya kode libur yang digunakan untuk input, penyimpanan standar, dan tampilan UI.**

Perubahan desain yang sudah diterapkan:

- aturan lama yang memperlakukan `L` dan `OFF` sebagai dua kode aktif untuk makna yang sama dihapus;
- `L` ditetapkan sebagai representasi standar untuk makna **Libur**;
- data lama `OFF` dinormalisasi ke `L` agar tidak ada dua kode aktif untuk arti yang sama;
- Web UI didesain ulang pada bagian legenda dan normalisasi data agar pengguna hanya melihat `L` sebagai kode libur;
- `OFF` tetap dipertahankan hanya sebagai referensi historis/inaktif, bukan sebagai kode input baru.


- seluruh record lama dengan kode `OFF` dipindahkan ke kode `L`;
- kode `OFF` dinonaktifkan pada `schedule_codes`;
- jumlah record `OFF` aktif = 0;
- Web UI tidak lagi menampilkan `OFF` pada legenda;
- Web UI juga menormalisasi `OFF` menjadi `L` jika suatu data lama masih muncul dari sumber.

Kode `CT` tetap dipertahankan sebagai Cuti karena pada sumber Kandang terdapat tanda `CT` yang berbeda makna dari libur.

### 11.4 Koreksi Jadwal Kandang Oktober 2026

Pada 2026-10-07, tabel sumber terbaru menunjukkan bahwa pemasukan jadwal Kandang sebelumnya tidak sesuai dengan data sumber.

Koreksi dilakukan dengan mengganti seluruh record jadwal Kandang untuk Oktober 2026 berdasarkan tabel terbaru, bukan menambahkan data di atas data lama.

Hasil koreksi:

- 17 karyawan Kandang tetap menggunakan master yang sama;
- 68 record kode L dimasukkan sesuai tanggal pada tabel terbaru;
- 1 record CT untuk RIDWAN pada 1 Oktober 2026 dipertahankan sesuai sumber;
- total record jadwal Kandang Oktober 2026 sekarang = 69;
- sebelum koreksi terdapat 117 record Kandang Oktober 2026 yang semuanya tercatat sebagai L;
- setelah koreksi tidak ada duplikasi pasangan employee_id dan tanggal.

Koreksi ini hanya mengubah jadwal Oktober 2026 JOB Kandang. Data jadwal JOB lain tidak diubah.

**Catatan master nama:** tabel terbaru memiliki perbedaan ejaan pada dua nama dibanding master saat ini, yaitu RICO KRISMUNANTO vs RICO KRISMUNTO dan URAY IMANNUDDIN vs URAY IMAY INNUDDIN. Koreksi kali ini menggunakan employee master yang sudah ada dan belum mengubah ejaan master tersebut agar koreksi jadwal tidak sekaligus mengubah master tanpa keputusan terpisah.

### 11.5 Penambahan JOB IB dan Karyawan IB

Pada 2026-10-07, sumber jadwal baru menunjukkan JOB `IB` dengan 12 karyawan. Berdasarkan struktur awal project yang juga menggunakan IB sebagai contoh JOB, data tersebut dimasukkan sebagai JOB master Departemen FARM.

Daftar karyawan:

- KRISTIANI YONI
- M IKLAS RAMADHAN
- HONGFUNGLOY
- MARDIANA
- ROMADHAN
- HATIP
- HALIZAH
- FAREL
- NAJWAN NAUFAL NURRIFQI
- JILA FITRI
- NOPRIANTO
- ALDO

Jadwal Oktober 2026 yang diterima pada sumber adalah kode `L` pada tanggal 7, 14, 21, dan 28 untuk setiap karyawan. Hasil verifikasi:

- JOB IB tersedia pada Departemen FARM;
- 12 karyawan IB aktif;
- 48 record jadwal Oktober 2026 untuk IB;
- seluruh 48 record menggunakan kode `L`;
- setiap karyawan memiliki 4 record jadwal pada tanggal 7, 14, 21, dan 28;
- tidak ditemukan duplikasi pasangan employee_id dan tanggal;
- total karyawan aktif menjadi 59;
- total `employee_schedules` menjadi 522.

### 11.6 Koreksi Jadwal JOB IB Oktober 2026

Pada 2026-10-07, tabel sumber terbaru menunjukkan bahwa tanggal libur JOB IB sebelumnya salah. Koreksi dilakukan dengan mengganti seluruh jadwal IB Oktober 2026.

Tanggal L yang benar untuk seluruh 12 karyawan IB adalah:

- 4 Oktober 2026
- 11 Oktober 2026
- 18 Oktober 2026
- 25 Oktober 2026

Hasil verifikasi:

- 12 karyawan IB tetap;
- 48 record jadwal Oktober 2026;
- seluruh 48 record menggunakan kode `L`;
- setiap karyawan memiliki 4 record pada tanggal 4, 11, 18, dan 25 Oktober;
- tidak ditemukan duplikasi pasangan employee_id dan tanggal.

### 11.7 Penambahan Karyawan ARIF pada JOB MEKANIK

Sumber terbaru juga menunjukkan karyawan **ARIF** dengan JOB **Mekanik**.

ARIF dimasukkan sebagai karyawan Departemen FARM dengan JOB master `MEKANIK`.

Jadwal Oktober 2026 yang diberikan:

- 1 Oktober = L
- 8 Oktober = L
- 15 Oktober = L
- 22 Oktober = L

Hasil verifikasi:

- ARIF aktif pada JOB MEKANIK;
- 4 record jadwal Oktober 2026;
- seluruhnya menggunakan kode `L`;
- tidak ditemukan duplikasi employee_id dan tanggal.

### 11.8 Filter JOB

Saat ini sumber daftar JOB dapat bergantung pada data yang sedang dimuat.

Perlu dipertimbangkan apakah master JOB sebaiknya dimuat terpisah agar filter lebih konsisten.

### 11.9 Data Demo

Fallback data demo **sudah dihapus** dari Web UI Production.

Jika Supabase belum dikonfigurasi atau query Supabase gagal, aplikasi menampilkan kondisi error dan tidak mengganti data aktual dengan data demo.

Keputusan ini didokumentasikan pada `docs/Dokumentasi_Perubahan_dan_Audit_Web_UI.md`.

### 11.10 Sumber Departemen

Dropdown Departemen pada Web UI Production sekarang membaca `public.departments` melalui Supabase Client.

Query hanya mengambil departemen aktif (`aktif = true`) dan mengurutkan berdasarkan `nama_departemen`.

Daftar FARM/HATCHERY tidak lagi ditulis sebagai opsi hardcode pada Web UI.

### 11.11 Export Excel dan PDF

Pada 2026-10-07, Web UI ditambahkan fitur export data jadwal berdasarkan filter yang sedang aktif.

Tersedia dua tombol:

- **Excel** — mengunduh file `.xlsx`;
- **PDF** — mengunduh file `.pdf`.

Kedua export menggunakan data hasil filter Web UI saat ini, termasuk:

- rentang tanggal;
- Departemen;
- JOB;
- pilihan karyawan;
- status tampilan kolom JOB.

Export tidak mengubah database dan tidak melakukan query tambahan. Data yang diekspor berasal dari hasil query `v_jadwal_karyawan` yang sudah ditampilkan pada halaman.

### 11.12 Penyempurnaan Format Export

Masukan setelah penggunaan pertama menunjukkan bahwa file Excel perlu memiliki format visual dan PDF perlu lebih terbaca saat dicetak.

**Excel sekarang memiliki:**

- judul dan informasi Departemen/periode;
- header tabel yang diformat;
- border tabel;
- perataan isi;
- warna sel sesuai kode P, S, M, L, dan CT;
- lebar kolom dan tinggi baris yang disesuaikan;
- freeze pane;
- autofilter;
- pengaturan halaman landscape.

**PDF sekarang memiliki:**

- format A3 landscape;
- pembagian tanggal maksimal 16 tanggal per halaman;
- font isi dan kode jadwal diperbesar lagi;
- tinggi baris dinaikkan menjadi 10 mm;
- kolom JOB dan Nama Karyawan diperlebar;
- header tanggal dan nama karyawan dibuat lebih besar;
- border tabel dibuat lebih gelap dan lebih tebal;
- informasi bagian tanggal dan nomor halaman;
- pagination vertikal untuk jumlah karyawan yang melebihi tinggi halaman.

Dengan desain ini, PDF tidak lagi memaksakan seluruh tanggal dalam satu halaman sehingga hasil cetak dapat menggunakan ukuran teks yang lebih layak.

Perubahan format tidak mengubah sumber data maupun filter export.




### 11.13 Tampilan Bulan yang Belum Memiliki Jadwal

Keputusan desain baru untuk pengelolaan jadwal:

**Bulan yang belum memiliki record jadwal tetap harus dapat ditampilkan pada Web UI.**

Web UI tidak boleh menganggap bahwa tidak adanya record pada `employee_schedules` berarti karyawan tidak perlu ditampilkan. Daftar karyawan harus berasal dari master `employees`, sedangkan `employee_schedules` digunakan untuk mengisi tanggal yang memang sudah memiliki jadwal.

Contoh ketika November 2026 belum memiliki jadwal:

```
                    NOVEMBER 2026

Nama Karyawan       1   2   3   4   5   6 ... 30
--------------------------------------------------
Karyawan 1          -   -   -   -   -   - ...  -
Karyawan 2          -   -   -   -   -   - ...  -
Karyawan 3          -   -   -   -   -   - ...  -
...
```

Sel kosong/`-` memiliki arti **belum ada jadwal**, bukan Libur. Kode `L` tetap menjadi satu-satunya kode yang berarti **Libur**.

### Prinsip penyimpanan

Sistem **tidak membuat record kosong untuk seluruh tanggal dalam bulan**.

Contoh, jika hanya Karyawan 1 yang mendapat jadwal L pada 3 November:

```
employee_schedules
--------------------------------
Karyawan 1 | 2026-11-03 | L
```

Tidak dibuat record NULL untuk tanggal 1, 2, 4, 5, dan seterusnya.

Dengan demikian:

- master `employees` menentukan siapa yang ditampilkan;
- rentang tanggal menentukan kolom yang ditampilkan;
- `employee_schedules` menentukan tanggal yang sudah diisi;
- tidak ada record berarti **belum diisi**, bukan otomatis Libur;
- tidak diperlukan pembuatan 30/31 record kosong untuk setiap karyawan.

### Pertimbangan performa

Pendekatan ini tidak diperkirakan membebani Web UI secara berarti untuk skala data saat ini. Web UI memang tetap merender tabel karyawan × tanggal yang dipilih, tetapi database hanya mengirim data master karyawan dan record jadwal yang benar-benar ada.

Implementasi berikutnya perlu mengubah sumber pembentukan baris jadwal agar tidak hanya bergantung pada `v_jadwal_karyawan`, karena view jadwal dapat tidak memiliki baris ketika suatu bulan benar-benar belum mempunyai record.

**Status:** keputusan desain disepakati; implementasi Web UI belum dilakukan.

### 11.12 Authentication dan RLS

RLS sudah diaktifkan pada tabel utama database, tetapi policy final untuk aplikasi belum ditentukan.

Authentication dan RLS final harus diselesaikan sebelum aplikasi digunakan secara luas.

---

## 12. Prinsip Teknis yang Dipertahankan

1. PostgreSQL/Supabase menjadi sumber data utama.
2. Web UI menggunakan Supabase Client sebagai akses data.
3. Database dan UI tetap dipisahkan.
4. Tampilan tanggal merupakan representasi visual; jadwal tetap disimpan sebagai record per tanggal.
5. FARM dan HATCHERY menggunakan halaman jadwal yang sama.
6. Data kosong tidak boleh diisi berdasarkan asumsi.
7. Publishable key boleh tersedia pada frontend; secret/service-role key tidak boleh.
8. Authentication dan RLS harus diselesaikan sebelum penggunaan publik.
9. Aturan bisnis yang belum dikonfirmasi tidak boleh dipaksakan ke database.
10. Perubahan UI tidak boleh dianggap sebagai perubahan data database kecuali memang dinyatakan demikian.
11. Penambahan master karyawan dilakukan bertahap dan diverifikasi sebelum jadwal terkait dimasukkan.

---

## 13. Keamanan

Repository Web UI bersifat publik.

Tidak boleh terdapat:

- password database;
- service-role key;
- secret key;
- token pribadi;
- credential pengguna.

Environment variable frontend dikonfigurasi di Vercel untuk Production dan Preview.

**Publishable key bukan pengganti RLS.** Keamanan data tetap bergantung pada authentication dan policy RLS yang benar.

---

## 14. Kondisi Proyek Saat Ini

Arsitektur aktual:

```
DATABASE
   |
   | PostgreSQL / Supabase
   | v_jadwal_karyawan
   v
WEB UI
   |
   | React + Vite
   | Supabase Client
   v
DEPLOYMENT
   |
   | Vercel
   v
BROWSER
   |
   | Data PostgreSQL aktual
   v
PENGUJIAN ONLINE
```

Web UI telah melewati tahap prototype lokal dan **sudah berhasil terhubung ke PostgreSQL/Supabase secara online**.

### Alur penggunaan saat ini

1. Tentukan **Dari Tanggal** dan **Sampai Tanggal**, atau pilih bulan melalui **Pilih Bulan**.
2. Pilih **Departemen**.
3. Jika diperlukan, pilih **JOB**.
4. Buka **Pilih Karyawan** untuk memilih satu atau beberapa karyawan.
5. Baca jadwal pada tabel.
6. Klik sel untuk melihat detail jadwal.
7. Gunakan **Tampilkan Job** bila ingin melihat kolom JOB.
8. Gunakan **Perbesar Jadwal** untuk memperluas area tabel.

Seluruh filter dan mode tampilan tersebut tidak mengubah data jadwal di PostgreSQL.

---

## 15. Pekerjaan yang Belum Dikerjakan

### Authentication

- login;
- session;
- role;
- hak akses.

### RLS Final

Menentukan siapa yang boleh:

- melihat jadwal;
- membuat jadwal;
- mengubah jadwal;
- mengelola master.

### Pengelolaan Jadwal

- tambah;
- edit;
- koreksi;
- hapus;
- validasi;
- histori perubahan.

### Master Data

- Karyawan;
- Departemen;
- JOB;
- Kode Jadwal.

### Absensi

Database sudah memiliki `attendance_records`, tetapi modul Web UI absensi belum dikembangkan.

### Laporan dan Export

- laporan jadwal;
- laporan absensi;
- **Export Excel — sudah tersedia pada Web UI**;
- **Export PDF — sudah tersedia pada Web UI**;
- pencetakan format final.

### Operasional

- audit;
- backup/operasional;
- custom domain jika diperlukan.

---

## 16. Roadmap Berikutnya

Urutan pengembangan yang disarankan:

1. **Stabilisasi master data**
   - masukkan karyawan FARM yang belum ada secara bertahap;
   - validasi Departemen dan JOB;
   - koreksi nama master bila data asli sudah tersedia.

2. **Validasi aturan bisnis**
   - JOB master vs assignment;
   - aturan schedule code;
   - validasi data Oktober 2026.

3. **Penyempurnaan database/view**
   - hanya setelah aturan bisnis disepakati.

4. **Authentication**

5. **RLS final**

6. **Interaksi dan pengelolaan jadwal**

7. **Master data**

8. **Modul absensi**

9. **Penyempurnaan export dan laporan**

10. **Audit dan operasional**

Fokus saat ini tetap pada penyelesaian dan stabilisasi **master data + Web UI v1** sebelum masuk ke perubahan besar database atau modul berikutnya.

---

## 17. Riwayat Progres Ringkas

| Tahap | Pekerjaan utama | Status |
|---|---|---|
| v0.1 | Repository, README, konsep halaman, Prototype UI v1 | Selesai |
| v0.2 | Prototype UI v2, React + Vite, Supabase Client, filter awal | Selesai |
| v0.3 | Deployment Vercel, environment variable, perbaikan Invalid API Key, pengujian online | Selesai |
| v0.4 | Validasi FARM Oktober 2026, perbaikan view JOB master, grouping berdasarkan employee_id, assignment KANTIN/LONDRY | Selesai |
| v1.0 | Detail jadwal, navigasi periode, responsive, penyempurnaan tabel | Selesai |
| v1.0 | Filter rentang tanggal lintas bulan | Selesai |
| v1.0 | Multi-select karyawan dan pencarian dalam picker | Selesai |
| v1.0 | Mode Perbesar Jadwal | Selesai |
| v1.0 | Pemilih bulan Januari–Desember dan perbaikan kalender lokal | Selesai |
| v1.0 | Toggle Tampilkan Job / Sembunyikan Job | Selesai |
| v1.0 | Penanda visual header hari Minggu | Selesai |
| v1.1 | Penghapusan fallback data demo dari Web UI | Selesai |
| v1.1 | Dropdown Departemen membaca master `departments` | Selesai |
| v1.2 | Seluruh karyawan HATCHERY menggunakan JOB master HATCHERY; Deta/Alda dipastikan sebagai HATCHERY tanpa menghapus assignment harian | Selesai |
| v1.3 | Penambahan JOB master Kandang pada FARM | Selesai |
| v1.5 | Penambahan HERI sebagai karyawan FARM JOB Kandang | Selesai |
| v1.6 | Penambahan seluruh 17 karyawan FARM JOB Kandang | Selesai |
| v1.7 | Input libur Kandang Oktober 2026 dan standarisasi L menggantikan OFF | Selesai |
| v1.8 | Dokumentasi perubahan desain: L ditetapkan sebagai satu-satunya kode Libur pada database dan Web UI | Selesai |
| v1.9 | Koreksi jadwal Kandang Oktober 2026 berdasarkan tabel sumber terbaru | Selesai |
| v2.0 | Penambahan JOB IB, 12 karyawan IB, dan 48 jadwal L Oktober 2026 | Selesai |
| v2.1 | Koreksi tanggal libur IB dan penambahan ARIF pada JOB MEKANIK | Selesai |
| v2.2 | Penambahan export Excel dan PDF berdasarkan filter aktif | Selesai |
| v2.3 | Penyempurnaan format Excel dan keterbacaan PDF untuk hasil cetak | Selesai |
| v2.4 | Perbesar font dan pertegas border PDF | Selesai |\n| v2.5 | Evaluasi A4/F4 dan pengembalian PDF ke A3 satu tampilan penuh | Selesai |
| v2.6 | Pondasi Admin Login + role admin + RLS dasar | Selesai |

---

### v2.5 — PDF kembali ke A3

Format A4/F4 sudah dievaluasi, tetapi untuk laporan bulanan 1–31 pembagian tanggal menjadi beberapa blok tidak sesuai kebutuhan. Export PDF dikembalikan ke A3 landscape. Seluruh tanggal pada rentang yang dipilih ditampilkan dalam satu blok horizontal; jika jumlah karyawan terlalu banyak, halaman hanya terbagi secara vertikal.


### Penyesuaian label export PDF

Label tombol pada Web UI sekarang ditampilkan sebagai **PDF** agar lebih sederhana. Format teknis file tetap A3 landscape dan tidak berubah.


### Penyederhanaan tampilan informasi

Teks informasi internal mengenai sumber Supabase dan catatan penggunaan filter dihapus dari halaman jadwal agar area kerja lebih ringkas. Informasi tersebut tetap tercatat di dokumentasi teknis, bukan pada tampilan operasional utama.


### v2.6 — Pondasi Admin Login

Pondasi Admin mulai diterapkan tanpa mengubah akses publik read-only. Database memiliki tabel `admin_users` dengan RLS untuk memetakan akun Supabase Auth yang berhak menjadi Admin. Web UI memiliki dialog Login Admin dan pemeriksaan role. Fitur CRUD jadwal belum dibuka pada tahap ini.


### Penempatan akses Admin

Akses Admin tidak lagi ditampilkan di dekat tabel jadwal. Login Admin ditempatkan di dalam menu **Pengaturan** agar area operasional jadwal tetap bersih.


## 18. Status Dokumen

Dokumen ini adalah **dokumentasi progres**, bukan spesifikasi final.

Audit versi sebelumnya mempertahankan informasi penting dalam bentuk yang lebih ringkas, terutama:

- milestone historis;
- fitur aktif;
- fitur yang sudah tidak digunakan;
- temuan dan keputusan terbuka;
- keamanan;
- roadmap;
- status pekerjaan.

**Status keseluruhan:**

> **Web UI React + Vite sudah online, terhubung ke Supabase/PostgreSQL, mampu menampilkan jadwal berdasarkan rentang tanggal atau pilihan bulan, memfilter karyawan secara multi-select, membuka detail jadwal, memperbesar area tabel, menampilkan/menyembunyikan kolom JOB, dan memberikan penanda visual khusus pada header hari Minggu. Authentication, RLS final, pengelolaan jadwal, absensi, laporan, dan beberapa aturan bisnis masih belum final. Export Excel/PDF sudah tersedia untuk data jadwal yang sedang ditampilkan. Format Excel sudah diberi styling, sedangkan PDF menggunakan pembagian tanggal per halaman untuk meningkatkan keterbacaan saat dicetak. Master data FARM untuk daftar Kandang yang diterima sudah dimasukkan; daftar JOB FARM berikutnya masih menunggu sumber.**

**Milestone saat ini:**  
**Online Web UI + Supabase Integration + Stabilisasi Master Data + Penyempurnaan Web UI v1 — SEDANG DIKERJAKAN.**

Perubahan Production terbaru dan keputusan audit dicatat pada `docs/Dokumentasi_Perubahan_dan_Audit_Web_UI.md`.

### Baseline Master Data Terbaru

- Departemen aktif: 2
- JOB master: 11, termasuk JOB HATCHERY pada Departemen HATCHERY, JOB Kandang pada Departemen FARM, dan JOB IB pada Departemen FARM
- Karyawan: 60
- Seluruh 15 karyawan HATCHERY menggunakan JOB master HATCHERY
- Deta dan Alda berada di HATCHERY dan tetap memiliki assignment harian seperti KANTIN, LONDRY, atau OFF
- Total employee_schedules: 522
- Tidak ditemukan duplikasi pasangan employee_id dan tanggal pada jadwal
- Daftar Kandang: 17 nama dari sumber; seluruh 17 sudah dimasukkan ke master employees
- Jadwal Kandang Oktober 2026: 68 record kode L + 1 record CT
- Jadwal IB Oktober 2026: 48 record kode L untuk 12 karyawan, pada tanggal 4, 11, 18, 25
- ARIF: karyawan FARM / MEKANIK dengan 4 record L pada 1, 8, 15, 22 Oktober 2026
- Standar kode libur: `L` saja untuk input dan tampilan; `OFF` nonaktif/historis\n### v2.5 — PDF A4 dan F4\n\nExport PDF sekarang menyediakan dua pilihan ukuran kertas: **A4 landscape** dan **F4 landscape**. Pembagian tanggal disesuaikan dengan lebar masing-masing kertas agar font dan border tetap terbaca.\n\n- A4: 8 tanggal per blok horizontal.\n- F4: 10 tanggal per blok horizontal.\n- Tinggi baris: 10 mm.\n- Border tabel dibuat lebih tegas.\n- Jumlah halaman menyesuaikan jumlah tanggal dan karyawan.\n

### v2.8 — Keputusan tampilan bulan tanpa jadwal

Bulan tanpa record `employee_schedules` tetap harus menampilkan seluruh karyawan aktif yang sesuai filter, dengan sel kosong/`-` sebagai tanda belum ada jadwal. Record kosong tidak dibuat ke database. Implementasi berikutnya akan menggabungkan master `employees` dengan record jadwal pada rentang tanggal yang dipilih.

### v2.7 — Admin Tambah Jadwal

**Status:** Production code / menunggu uji simpan browser

Pondasi Admin Login yang sudah ada diperluas menjadi fitur awal pengelolaan jadwal.

Web UI:
- setelah login Admin, menu **Pengaturan** menampilkan **Pengelolaan Jadwal**;
- Admin dapat membuka **Tambah Jadwal**;
- form menyediakan karyawan, tanggal, kode jadwal aktif, dan keterangan;
- penyimpanan menggunakan upsert berdasarkan `employee_id,tanggal`.

Database:
- `employee_schedules` memiliki policy INSERT/UPDATE/DELETE untuk Admin aktif;
- publik tetap hanya memiliki akses SELECT;
- unique index `employee_schedules_employee_date_unique` menjaga satu jadwal per karyawan per tanggal.

Tahap ini belum mencakup hapus melalui UI, pengelolaan master data, atau edit langsung dari tabel.


## 19. Audit Terbaru — Login Admin dan Read-only

Pada 2026-10-07, pengujian setelah Login Admin menemukan bahwa sesi `authenticated` dapat membuat query yang policy SELECT-nya hanya `anon` tidak mengembalikan data.

Perbaikan Web UI sudah diterapkan dengan memisahkan:
- client authenticated untuk Authentication, role Admin, dan operasi tulis;
- client `publicSupabase` tanpa session untuk query read-only publik.

Perbaikan ini dicatat pada audit Web UI dan dokumentasi keamanan. Tidak ada perubahan data PostgreSQL.

**Status:** kode sudah masuk `main`; verifikasi browser setelah deployment terbaru masih diperlukan.

Fitur Admin saat ini:
- Login Admin: tersedia;
- Tambah Jadwal: tersedia pada Web UI;
- RLS INSERT/UPDATE/DELETE `employee_schedules`: tersedia untuk Admin aktif;
- uji simpan dari browser: belum dinyatakan selesai;
- edit/hapus visual dari tabel: belum dibuat.
