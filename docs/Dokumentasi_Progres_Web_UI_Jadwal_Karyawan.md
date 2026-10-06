# Dokumentasi Progres Pengembangan Web UI — Jadwal Karyawan

**Status:** Draft / Progress Development  
**Versi:** 0.1  
**Tanggal:** 2026-10-06  
**Repository:** `veriyansyah1225-debug/jadwal-karyawan-web`

---

## 1. Tujuan Dokumen

Dokumen ini mencatat progres nyata pengembangan **Web UI Jadwal Karyawan** yang telah dilakukan setelah fondasi database PostgreSQL/Supabase tersedia.

Dokumen ini berbeda dengan **Roadmap Pengembangan Web UI — Database Jadwal Karyawan**. Roadmap digunakan sebagai acuan rencana pekerjaan, sedangkan dokumen ini digunakan untuk mencatat pekerjaan yang telah dilaksanakan, hasil yang diperoleh, keputusan yang telah dibuat, serta bagian yang masih dalam proses.

Dokumen ini bersifat **living document** dan akan diperbarui setiap kali terdapat milestone baru.

Tidak semua keputusan dalam dokumen ini dianggap final. Struktur UI, teknologi frontend, alur pengguna, fitur, dan detail implementasi masih dapat disesuaikan berdasarkan hasil pengujian dan kebutuhan operasional.

---

# 2. Kondisi Awal Sebelum Pengembangan Web UI

Pengembangan Web UI dilakukan setelah database Jadwal & Absensi Karyawan mempunyai fondasi PostgreSQL online melalui Supabase.

Project database dibuat secara terpisah dari sistem lain dengan nama:

`database-jadwal-karyawan`

Database tersebut menjadi sumber data untuk aplikasi Web UI.

Pada fase database telah tersedia tabel utama untuk departemen, JOB, karyawan, kode jadwal, jadwal karyawan, dan absensi. Selain tabel, telah dibuat view `v_jadwal_karyawan` untuk memudahkan aplikasi membaca data jadwal dalam bentuk yang telah digabungkan.

Database saat ini telah memiliki data:

| Komponen | Kondisi |
|---|---:|
| Departments | 2 |
| JOB | 8 |
| Karyawan | 30 |
| Kode jadwal | 6 |
| Jadwal Oktober 2026 | 401 record |
| Data absensi | 0 record |
| View `v_jadwal_karyawan` | Tersedia |

Data tersebut menjadi dasar untuk merancang tampilan Web UI.

---

# 3. Penetapan Repository Web UI

## Tujuan

Web UI dibuat dalam repository GitHub tersendiri agar pengembangan aplikasi tidak tercampur dengan repository sistem lain.

## Yang Dilakukan

Telah dibuat repository:

`veriyansyah1225-debug/jadwal-karyawan-web`

Repository tersebut digunakan khusus untuk pengembangan aplikasi Web UI Jadwal Karyawan.

Repository lain yang sudah ada tidak digunakan sebagai tempat pengembangan aplikasi ini.

## Hasil

Repository Web UI telah tersedia dengan branch utama:

`main`

Pada tahap awal repository berisi dokumentasi proyek dan prototype UI.

## Status

**Selesai.**

---

# 4. Dokumentasi Dasar Repository

## Tujuan

Sebelum kode aplikasi dikembangkan lebih jauh, repository diberi dokumentasi dasar agar tujuan proyek dan kondisi awal dapat dipahami kembali.

## Yang Dilakukan

Telah dibuat file:

`README.md`

README menjelaskan antara lain:

- tujuan proyek;
- gambaran arsitektur;
- hubungan Web UI dengan PostgreSQL/Supabase;
- kondisi database;
- roadmap pengembangan;
- status aplikasi;
- prinsip bahwa desain masih dapat berkembang.

## Hasil

Repository mempunyai dokumentasi awal yang dapat digunakan sebagai pintu masuk untuk memahami proyek.

## Status

**Selesai.**

---

# 5. Analisis Kebutuhan Tampilan Jadwal

## Tujuan

Menentukan bentuk halaman yang paling sesuai dengan format jadwal karyawan yang digunakan saat ini.

Format sumber menunjukkan pola tabel dengan karyawan, JOB, tanggal dalam satu bulan, serta kode jadwal pada masing-masing tanggal.

Namun format tersebut diperlakukan sebagai **referensi tampilan**, bukan sebagai struktur database.

Database menyimpan jadwal berdasarkan record tanggal sehingga Web UI nantinya harus membentuk tampilan kalender bulanan dari data tersebut.

## Keputusan

Konsep utama Web UI ditetapkan sebagai:

```text
Jadwal Karyawan
       |
       +-- Bulan
       +-- Tahun
       +-- Departemen
       +-- JOB
       +-- Pencarian Karyawan
       |
       v
Tabel Jadwal Bulanan
       |
       +-- JOB
       +-- Nama Karyawan
       +-- Tanggal 1 ... akhir bulan
```

Konsep ini memungkinkan satu halaman digunakan untuk berbagai departemen dan periode.

## Status

**Selesai sebagai rancangan awal.**

---

# 6. Penetapan Konsep Halaman Tunggal Jadwal Bulanan

## Tujuan

Menghindari pembuatan halaman yang terpisah untuk setiap departemen.

## Keputusan

Web UI menggunakan satu halaman utama:

**Jadwal Karyawan**

Departemen seperti FARM dan HATCHERY dipilih melalui filter.

Dengan pendekatan ini, aplikasi tidak perlu mempunyai halaman berbeda seperti:

```text
/farm
/hatchery
```

Sebaliknya, satu halaman dapat menampilkan data sesuai filter yang dipilih.

## Alasan

Pendekatan ini lebih mudah dikembangkan karena struktur tabel dan interaksi jadwal tetap sama, sedangkan departemen merupakan parameter data.

## Status

**Disepakati sebagai baseline UI, tetapi masih dapat berubah.**

---

# 7. Perancangan Filter

## Tujuan

Memungkinkan pengguna mempersempit data jadwal tanpa harus membuat halaman berbeda.

## Filter yang telah dirancang

1. Bulan
2. Tahun
3. Departemen
4. JOB
5. Pencarian nama karyawan

Contoh penggunaan:

```text
Bulan      : Oktober
Tahun      : 2026
Departemen : FARM
JOB        : SECURITY
Karyawan   : Yusuf
```

Hasil yang diharapkan adalah tabel jadwal yang hanya menampilkan data sesuai kombinasi filter tersebut.

## Kondisi Saat Ini

Filter sudah tersedia secara visual pada prototype, tetapi belum melakukan query ke database.

## Status

**UI selesai sebagai prototype. Logika/filter database belum diimplementasikan.**

---

# 8. Perancangan Tabel Jadwal Bulanan

## Tujuan

Membuat tampilan yang familiar dengan format jadwal yang digunakan saat ini sekaligus tetap sesuai dengan struktur database relasional.

## Struktur tampilan

Prototype menggunakan konsep:

```text
JOB | Nama Karyawan | 1 | 2 | 3 | ... | 31
```

Pada bagian tanggal ditampilkan pula singkatan hari.

Contohnya:

```text
1
KM

2
JM

3
SB
```

Tanggal dan jumlah hari nantinya akan dibuat dinamis berdasarkan bulan yang dipilih.

Dengan demikian Februari tidak dipaksa mempunyai 31 kolom.

## Sticky Column

Pada desktop, kolom:

- JOB
- Nama Karyawan

dirancang tetap terlihat ketika tabel digeser secara horizontal.

Hal ini diperlukan karena tabel bulanan mempunyai banyak kolom tanggal.

## Status

**Selesai sebagai desain prototype.**

---

# 9. Pengelompokan Karyawan Berdasarkan JOB

## Tujuan

Memudahkan pengguna membaca jadwal berdasarkan kelompok pekerjaan.

Prototype menampilkan JOB pada sisi kiri tabel dan mengelompokkan baris berdasarkan JOB.

Contoh:

```text
SECURITY
  Yusuf
  Ahmadi

POS 1
  Alvi

MEKANIK
  Wasto

LONDRY
  Anisah
```

JOB juga tetap disediakan sebagai filter.

## Status

**Selesai sebagai konsep UI.**

---

# 10. Perancangan Kode Warna Jadwal

## Tujuan

Membantu pengguna membaca pola shift/libur dengan cepat tanpa harus membaca teks pada setiap sel.

Prototype memberikan warna berbeda untuk:

| Kode | Makna sementara |
|---|---|
| P | Shift Pagi |
| S | Shift Sore |
| M | Shift Malam |
| L | Libur |
| OFF | Libur |
| CT | Cuti |

Makna tersebut mengikuti dokumentasi database saat ini dan masih dapat dikonfirmasi kembali, terutama perbedaan antara `L` dan `OFF`.

## Status

**Selesai sebagai rancangan visual; aturan bisnis kode masih dapat berubah.**

---

# 11. Pembuatan Prototype UI v1

## Tujuan

Menguji rancangan halaman sebelum masuk ke pengembangan frontend sebenarnya.

## Yang Dibuat

Telah dibuat prototype HTML statis yang menampilkan:

- sidebar navigasi;
- judul halaman;
- filter bulan;
- filter tahun;
- filter departemen;
- filter JOB;
- input pencarian karyawan;
- tombol tampilkan;
- tabel jadwal bulanan;
- sticky column;
- warna kode jadwal;
- legenda kode jadwal;
- desain responsif dasar.

Prototype menggunakan data demonstrasi untuk menguji layout.

## Hasil

Prototype berhasil memberikan gambaran awal bagaimana jadwal FARM/HATCHERY dapat ditampilkan dalam aplikasi web.

Prototype belum menggunakan query database dan belum dianggap sebagai aplikasi produksi.

## Status

**Selesai — Prototype UI v1.**

---

# 12. Penyimpanan Prototype ke Repository

Prototype UI v1 kemudian dimasukkan ke repository GitHub pada:

`prototype/index.html`

File tersebut menjadi artefak awal yang dapat digunakan untuk review dan iterasi desain berikutnya.

## Status

**Selesai.**

---

# 13. Review Prototype UI v1

## Tujuan

Memastikan konsep dasar sudah sesuai sebelum membangun frontend yang terhubung dengan database.

## Hasil Review

Prototype dinilai sudah memenuhi kebutuhan dasar tampilan:

- struktur halaman jelas;
- filter sudah tersedia;
- tabel jadwal sesuai konsep;
- sticky column membantu penggunaan desktop;
- kode warna membantu pembacaan;
- legenda sudah tersedia.

Namun beberapa bagian masih perlu dikembangkan:

1. filter belum aktif;
2. pencarian belum terhubung ke data;
3. data masih dummy;
4. jumlah tanggal masih berupa contoh/static;
5. belum ada koneksi Supabase;
6. belum ada autentikasi;
7. responsive/mobile masih perlu diuji lebih lanjut.

## Kesimpulan

Prototype v1 dianggap cukup sebagai **baseline untuk iterasi berikutnya**, tetapi belum siap digunakan sebagai aplikasi operasional.

## Status

**Selesai — Review awal.**

---

# 14. Status Integrasi Supabase

Sampai dokumentasi ini dibuat, Web UI **belum terhubung ke Supabase**.

Database sudah menyediakan view:

`public.v_jadwal_karyawan`

View tersebut menyatukan informasi dari:

- employees;
- departments;
- jobs;
- schedule_codes;
- employee_schedules.

View tersebut dirancang agar aplikasi dapat membaca jadwal dengan query yang lebih sederhana.

## Rencana Integrasi

Pada tahap frontend berikutnya, aplikasi akan membaca data dari database dan membentuk tampilan jadwal berdasarkan:

```text
v_jadwal_karyawan
        |
        v
Filter bulan/tahun
        |
        v
Filter departemen
        |
        v
Filter JOB
        |
        v
Pencarian karyawan
        |
        v
Tabel Jadwal Bulanan
```

## Status

**Belum dimulai.**

---

# 15. Status Frontend Project

Pada tahap dokumentasi ini, yang tersedia adalah prototype HTML.

Belum dilakukan finalisasi framework frontend seperti React atau Next.js sebagai implementasi produksi.

Pemilihan teknologi frontend masih mengikuti roadmap dan dapat ditentukan setelah prototype UI disepakati.

## Status

**Belum final.**

---

# 16. Fitur yang Sudah Dibuat

| Fitur/Komponen | Status |
|---|---|
| Repository GitHub khusus | ✓ Selesai |
| README proyek | ✓ Selesai |
| Prototype halaman Jadwal | ✓ Selesai |
| Filter Bulan | ✓ Prototype |
| Filter Tahun | ✓ Prototype |
| Filter Departemen | ✓ Prototype |
| Filter JOB | ✓ Prototype |
| Search Karyawan | ✓ Prototype |
| Tabel jadwal bulanan | ✓ Prototype |
| Sticky JOB/Nama | ✓ Prototype |
| Kode warna jadwal | ✓ Prototype |
| Legenda | ✓ Prototype |
| Responsive dasar | ✓ Prototype |
| Query Supabase | Belum |
| Filter database | Belum |
| Authentication | Belum |
| Input/Edit jadwal | Belum |
| Modul absensi | Belum |
| Laporan | Belum |
| Deployment online | Belum |

---

# 17. Fitur yang Belum Dikerjakan

Fitur berikut belum menjadi bagian dari implementasi Web UI saat ini:

## 17.1 Integrasi Database

- koneksi frontend ke Supabase;
- membaca `v_jadwal_karyawan`;
- query berdasarkan periode;
- filter database;
- penanganan loading/error.

## 17.2 Authentication

- login;
- session;
- role;
- hak akses;
- integrasi RLS.

## 17.3 Pengelolaan Jadwal

- tambah jadwal;
- edit jadwal;
- hapus/koreksi jadwal;
- validasi jadwal;
- histori perubahan.

## 17.4 Absensi

Modul absensi belum dikembangkan pada Web UI.

## 17.5 Laporan

Belum dibuat:

- laporan;
- export Excel;
- export PDF;
- pencetakan format final.

## 17.6 Deployment

Web UI belum dipublikasikan sebagai aplikasi produksi.

---

# 18. Prinsip Teknis yang Dipertahankan

Selama pengembangan Web UI, beberapa prinsip dari rancangan database tetap dipertahankan.

### 18.1 Database sebagai sumber data

PostgreSQL/Supabase menjadi sumber data utama.

### 18.2 Tabel UI bukan struktur database

Tampilan tanggal 1–31 hanya merupakan representasi visual. Database tetap menyimpan jadwal berdasarkan tanggal.

### 18.3 Satu halaman untuk berbagai departemen

FARM dan HATCHERY menggunakan halaman jadwal yang sama.

### 18.4 JOB tetap menjadi bagian penting

JOB digunakan sebagai informasi identitas pekerjaan sekaligus filter.

### 18.5 Data kosong tidak boleh diisi berdasarkan asumsi

Web UI harus menampilkan data yang tersedia dari database dan tidak membuat jadwal berdasarkan dugaan.

### 18.6 Desain masih dapat berubah

Prototype digunakan untuk validasi dan bukan dianggap sebagai desain final.

---

# 19. Catatan Keamanan

Repository GitHub Web UI bersifat publik.

Oleh karena itu, informasi sensitif tidak boleh dimasukkan ke repository, termasuk:

- password database;
- Supabase service role key;
- secret key;
- token;
- credential pengguna.

Ketika integrasi Supabase dilakukan, konfigurasi sensitif harus dikelola melalui environment variable atau mekanisme konfigurasi yang sesuai.

Selain itu, database saat ini masih mempunyai konfigurasi keamanan yang belum final. RLS telah diaktifkan pada tabel utama, tetapi policy final dan authentication belum ditentukan.

Karena itu aplikasi belum boleh dianggap siap untuk penggunaan publik/produksi hanya berdasarkan prototype saat ini.

---

# 20. Keputusan yang Sudah Dibuat

Keputusan sementara yang telah menjadi baseline:

1. Web UI dibuat pada repository terpisah.
2. Repository yang digunakan adalah `jadwal-karyawan-web`.
3. Web UI menggunakan satu halaman utama Jadwal Karyawan.
4. FARM/HATCHERY dipilih melalui filter Departemen.
5. Tabel menampilkan JOB, nama karyawan, dan tanggal dalam bulan.
6. JOB dan nama karyawan dibuat sticky pada desktop.
7. Jadwal menggunakan kode warna.
8. Filter menjadi bagian utama halaman.
9. Prototype dibuat sebelum implementasi frontend produksi.
10. Integrasi database dilakukan setelah rancangan UI cukup tervalidasi.
11. Fitur absensi, laporan, export, approval, dan automation belum menjadi fokus tahap prototype.

---

# 21. Keputusan yang Masih Terbuka

Beberapa keputusan belum dianggap final:

- framework frontend;
- desain mobile final;
- bentuk detail jadwal ketika sel diklik;
- model authentication;
- role pengguna;
- policy RLS;
- aturan `L` dan `OFF`;
- kebutuhan input/edit jadwal;
- kebutuhan export;
- kebutuhan laporan;
- format final untuk pencetakan;
- apakah sidebar tetap digunakan pada versi final.

---

# 22. Kondisi Proyek Saat Ini

Secara umum proyek Web UI berada pada kondisi:

```text
DATABASE
   |
   |  PostgreSQL/Supabase sudah tersedia
   |  Data jadwal Oktober 2026 tersedia
   v
DESAIN UI
   |
   |  Konsep halaman sudah ditentukan
   |  Filter sudah dirancang
   |  Tabel sudah dirancang
   v
PROTOTYPE
   |
   |  Prototype UI v1 selesai
   |  Sudah direview
   v
NEXT
   |
   +--> Prototype UI v2 / penyempurnaan
   |
   +--> Setup frontend project
   |
   +--> Integrasi Supabase
   |
   +--> Tampilkan data aktual
   |
   +--> Aktifkan filter & pencarian
   |
   +--> Testing
   |
   +--> Deployment
```

---

# 23. Next Step yang Direkomendasikan

Tahap berikutnya bukan langsung menambahkan banyak fitur.

Urutan yang direkomendasikan:

### Tahap 1 — Prototype UI v2

Menyempurnakan hasil review prototype v1, terutama:

- struktur tabel;
- tampilan filter;
- responsif/mobile;
- visual hierarchy;
- kemungkinan interaksi dasar.

### Tahap 2 — Finalisasi baseline UI

Setelah Prototype v2 direview, struktur tampilan dijadikan acuan implementasi frontend.

### Tahap 3 — Setup Frontend

Membuat struktur aplikasi frontend sebenarnya pada repository `jadwal-karyawan-web`.

### Tahap 4 — Integrasi Supabase

Menghubungkan frontend dengan database PostgreSQL/Supabase dan membaca `v_jadwal_karyawan`.

### Tahap 5 — Implementasi Jadwal Bulanan

Mengubah data record tanggal menjadi tampilan kalender/tabel bulanan.

### Tahap 6 — Filter dan Search

Mengaktifkan:

- bulan;
- tahun;
- departemen;
- JOB;
- karyawan.

### Tahap 7 — Testing

Menguji hasil aplikasi terhadap data Oktober 2026 yang sudah tersedia.

---

# 24. Riwayat Progres

| Versi | Kegiatan | Status |
|---|---|---|
| v0.1 | Repository Web UI dibuat | Selesai |
| v0.1 | README proyek dibuat | Selesai |
| v0.1 | Konsep halaman Jadwal Bulanan ditentukan | Selesai |
| v0.1 | Filter dirancang | Selesai |
| v0.1 | Prototype UI v1 dibuat | Selesai |
| v0.1 | Prototype disimpan ke GitHub | Selesai |
| v0.1 | Review Prototype v1 | Selesai |
| v0.2 | Prototype UI v2 | Belum |
| v0.2 | Setup frontend produksi | Belum |
| v0.2 | Integrasi Supabase | Belum |

---

# 25. Status Dokumen

Dokumen ini merupakan dokumentasi progres dan **bukan dokumen spesifikasi final**.

Setiap perkembangan berikutnya akan dicatat dengan prinsip:

- apa yang dikerjakan;
- tujuan pengerjaan;
- hasil;
- keputusan;
- status;
- catatan perubahan.

Dengan demikian, dokumen ini dapat digunakan sebagai riwayat pembangunan Web UI Jadwal Karyawan dari prototype sampai aplikasi online.

**Status keseluruhan Web UI saat ini:**

> **Prototype UI v1 selesai dan telah direview. Implementasi frontend produksi dan integrasi Supabase belum dimulai.**
