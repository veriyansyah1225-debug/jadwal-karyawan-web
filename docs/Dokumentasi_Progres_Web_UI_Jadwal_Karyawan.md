# Dokumentasi Progres Pengembangan Web UI — Jadwal Karyawan

**Status:** Draft / Progress Development  
**Versi:** 1.0  
**Tanggal:** 2026-10-07  
**Repository:** `veriyansyah1225-debug/jadwal-karyawan-web`  
**Database:** `database-jadwal-karyawan` / PostgreSQL 17 / Supabase

---

## 1. Tujuan Dokumen

Dokumen ini mencatat progres nyata pengembangan **Web UI Jadwal Karyawan** yang terhubung dengan database PostgreSQL/Supabase.

Dokumen ini berbeda dengan **Roadmap Pengembangan Web UI — Database Jadwal Karyawan**. Roadmap digunakan sebagai acuan rencana pekerjaan, sedangkan dokumen ini mencatat pekerjaan yang benar-benar telah dilaksanakan, hasil pengujian, keputusan yang telah dibuat, dan bagian yang masih terbuka.

Dokumen ini bersifat **living document** dan akan diperbarui setiap kali terdapat milestone baru.

Tidak semua keputusan di dalamnya dianggap final. Struktur UI, aturan bisnis, keamanan, dan fitur masih dapat disesuaikan berdasarkan hasil pengujian dan kebutuhan operasional.

---

# 2. Kondisi Awal Sebelum Pengembangan Web UI

Pengembangan Web UI dilakukan setelah database Jadwal & Absensi Karyawan mempunyai fondasi PostgreSQL online melalui Supabase.

Project database dibuat secara terpisah dengan nama:

`database-jadwal-karyawan`

Database tersebut menjadi sumber data untuk aplikasi Web UI.

Komponen database yang telah tersedia:

| Komponen | Kondisi |
|---|---:|
| Departments | 2 |
| JOB | 8 |
| Karyawan | 30 |
| Kode jadwal | 6 |
| Jadwal Oktober 2026 | 401 record |
| Data absensi | 0 record |
| View `v_jadwal_karyawan` | Tersedia |

Data awal tersebut menjadi dasar pengembangan dan pengujian Web UI.

---

# 3. Penetapan Repository Web UI

## Tujuan

Web UI dibuat pada repository GitHub tersendiri agar pengembangan aplikasi tidak tercampur dengan repository sistem lain.

## Yang Dilakukan

Repository yang digunakan:

`veriyansyah1225-debug/jadwal-karyawan-web`

Branch utama:

`main`

Repository lain tidak digunakan sebagai tempat pengembangan aplikasi ini.

## Status

**Selesai.**

---

# 4. Dokumentasi Dasar Repository

Telah dibuat dan diperbarui:

`README.md`

README menjelaskan:

- tujuan proyek;
- hubungan Web UI dengan PostgreSQL/Supabase;
- kondisi database;
- struktur frontend;
- cara menjalankan aplikasi;
- environment variable;
- prinsip keamanan;
- status pengembangan.

## Status

**Selesai.**

---

# 5. Analisis Kebutuhan Tampilan Jadwal

Format jadwal sumber diperlakukan sebagai **referensi tampilan**, bukan struktur database.

Konsep utama Web UI:

```
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

## Status

**Selesai sebagai baseline desain awal.**

---

# 6. Penetapan Konsep Halaman Tunggal

Web UI menggunakan satu halaman utama:

**Jadwal Karyawan**

FARM dan HATCHERY dipilih melalui filter Departemen.

Tidak dibuat halaman terpisah seperti `/farm` dan `/hatchery`.

## Status

**Disepakati sebagai baseline UI, tetapi masih dapat berubah.**

---

# 7. Prototype UI v1

Prototype HTML statis telah dibuat pada:

`prototype/index.html`

Prototype v1 mencakup:

- sidebar;
- filter bulan;
- filter tahun;
- filter departemen;
- filter JOB;
- pencarian karyawan;
- tombol tampilkan;
- tabel jadwal;
- sticky column;
- kode warna;
- legenda;
- responsive dasar.

Prototype menggunakan data demonstrasi dan belum terhubung ke database.

## Status

**Selesai — Prototype UI v1.**

---

# 8. Review Prototype UI v1

Prototype v1 direview sebagai dasar untuk implementasi berikutnya.

Hasil review:

- struktur halaman sudah jelas;
- filter sudah tersedia;
- tabel jadwal sesuai konsep;
- sticky column membantu penggunaan desktop;
- kode warna membantu pembacaan;
- legenda tersedia.

Bagian yang masih perlu dikembangkan:

- filter aktif;
- pencarian aktif;
- data aktual;
- jumlah tanggal dinamis;
- koneksi Supabase;
- loading/error state;
- responsive/mobile lebih lanjut;
- authentication.

## Status

**Selesai — Review awal.**

---

# 9. Prototype UI v2

Setelah review v1, dibuat Prototype UI v2 pada:

`prototype/index-v2.html`

Prototype v2 memperbaiki dan menambahkan:

- jumlah hari dinamis berdasarkan bulan;
- label hari dinamis;
- filter bulan;
- filter tahun;
- filter departemen;
- filter JOB;
- pencarian nama secara langsung;
- jumlah hasil;
- empty state;
- konsep loading state;
- konsep error state;
- responsive/mobile;
- demo data;
- struktur tampilan yang lebih siap dijadikan baseline frontend.

Prototype v2 telah direview dan untuk saat ini dianggap cukup baik sebagai **baseline desain sementara**.

Prototype v2 tetap bukan aplikasi produksi dan belum menjadi sumber data utama.

## Status

**Selesai — Baseline UI sementara.**

---

# 10. Setup Frontend Project

Setelah Prototype v2 disetujui sebagai baseline sementara, repository dikembangkan menjadi aplikasi frontend sebenarnya.

Teknologi yang digunakan:

- React 19;
- React DOM 19;
- Vite 7;
- `@supabase/supabase-js`;
- CSS custom.

File utama yang dibuat:

```
package.json
index.html
vite.config.js
.env.example
.gitignore
src/
  main.jsx
  App.jsx
  styles.css
  lib/
    supabase.js
```

## Prinsip konfigurasi

Aplikasi membaca:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

dari environment variable.

Tidak ada credential sensitif yang disimpan di repository.

## Status

**Selesai — Fondasi frontend.**

---

# 11. Implementasi UI React

Prototype v2 kemudian diimplementasikan ke React.

Fungsi yang sudah dibuat:

- halaman Jadwal Karyawan;
- pemilihan bulan;
- pemilihan tahun;
- pemilihan departemen;
- pemilihan JOB;
- pencarian nama;
- jumlah karyawan hasil filter;
- tabel tanggal dinamis;
- label hari;
- sticky kolom JOB/nama;
- legenda kode jadwal;
- loading state;
- error state;
- empty state;
- fallback data demo untuk kebutuhan pengujian prototype.

## Status

**Selesai — Implementasi UI frontend awal.**

---

# 12. Integrasi Supabase

Frontend kemudian dihubungkan dengan Supabase menggunakan `@supabase/supabase-js`.

Sumber data aplikasi:

`v_jadwal_karyawan`

Query aplikasi menggunakan periode tanggal yang dipilih dan filter departemen, kemudian data diurutkan berdasarkan JOB, nama karyawan, dan tanggal.

Alur data:

```
Browser
   |
   v
React
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

Data dari database kemudian dikelompokkan kembali oleh frontend menjadi bentuk tabel bulanan.

## Status

**Selesai — Integrasi dasar.**

---

# 13. Pengujian Awal Integrasi Supabase

Pada deployment pertama, aplikasi berhasil terbuka tetapi muncul:

```
Gagal memuat data Supabase: Invalid API key
```

Hal ini menunjukkan:

- Vercel berhasil menjalankan aplikasi;
- React berhasil berjalan;
- tetapi konfigurasi API key belum benar.

Masalah kemudian ditelusuri pada konfigurasi environment variable Vercel.

## Perbaikan

Environment variable frontend disesuaikan:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Keduanya digunakan sebagai konfigurasi yang dapat tersedia pada bundle frontend.

Untuk `VITE_SUPABASE_ANON_KEY`, nilai yang digunakan adalah **Supabase Publishable Key**, bukan service-role/secret key.

Service-role/secret key tidak boleh dimasukkan ke frontend.

## Status

**Selesai — Error API key berhasil diperbaiki.**

---

# 14. Deployment Online melalui Vercel

Repository `jadwal-karyawan-web` kemudian dideploy ke Vercel.

Konfigurasi deployment:

- Repository: `veriyansyah1225-debug/jadwal-karyawan-web`
- Branch: `main`
- Framework: Vite
- Environment: Production

Website hasil deployment:

`https://jadwal-karyawan-web.vercel.app`

Vercel berhasil melakukan build dan deployment.

## Status

**Selesai — Website online untuk pengujian.**

---

# 15. Pengujian Website dari Browser

Website kemudian dibuka langsung melalui browser menggunakan URL deployment Vercel.

Hasil pengujian:

- halaman Web UI dapat dibuka;
- sidebar tampil;
- filter tampil;
- tabel jadwal tampil;
- data Supabase berhasil dimuat;
- tidak lagi muncul error `Invalid API key`.

Dengan demikian alur berikut telah berhasil diuji:

```
Browser
   |
   v
Vercel
   |
   v
React
   |
   v
Supabase
   |
   v
PostgreSQL
   |
   v
v_jadwal_karyawan
```

## Status

**Selesai — Integrasi online berhasil diuji.**

---

# 16. Validasi Data FARM Oktober 2026

Pada pengujian browser digunakan:

```
Bulan      : Oktober
Tahun      : 2026
Departemen : FARM
```

Website menampilkan:

**Jadwal FARM — Oktober 2026**

dan data aktual dari database.

Hasil pengujian database menunjukkan untuk FARM Oktober 2026 terdapat:

- 17 karyawan pada schedule yang belum memiliki `job_id` pada record schedule;
- 1 karyawan pada JOB KANTIN;
- 2 karyawan pada JOB LONDRY.

Total karyawan yang muncul pada tampilan saat pengujian:

**20 karyawan.**

## Catatan

Sebagian baris pada tabel menampilkan JOB sebagai:

`—`

Hal ini bukan error koneksi. Ini terjadi karena struktur saat ini memungkinkan `employee_schedules.job_id` kosong, sementara JOB juga tersimpan pada master karyawan.

Masalah ini **belum boleh langsung diperbaiki dengan asumsi**. Aturan bisnis perlu ditentukan terlebih dahulu:

- apakah JOB pada jadwal harus mengikuti JOB master karyawan;
- atau apakah JOB pada jadwal boleh berbeda dari JOB master;
- atau apakah keduanya memiliki fungsi berbeda.

## Perbaikan yang Dilakukan

Setelah pemeriksaan data, ditemukan bahwa frontend sebelumnya mengelompokkan baris berdasarkan kombinasi `nama_job` pada schedule dan nama karyawan. Akibatnya satu karyawan seperti Deta/Alda dapat terpecah menjadi beberapa baris dan JOB tertentu tampil sebagai `—`.

Perbaikan dilakukan pada dua lapisan:

1. View `v_jadwal_karyawan` sekarang juga menyediakan `job_master_id` dan `nama_job_master` tanpa menghilangkan kolom lama.
2. Frontend mengelompokkan jadwal berdasarkan `employee_id`, bukan berdasarkan JOB pada setiap record tanggal.
3. JOB master digunakan sebagai JOB utama bila tersedia.
4. Jika tidak ada JOB master tetapi terdapat penempatan JOB pada tanggal tertentu, daftar JOB tersebut digunakan sebagai informasi JOB.
5. Jika suatu tanggal berisi penempatan JOB seperti `KANTIN` atau `LONDRY` dan tidak mempunyai schedule code, nama JOB ditampilkan langsung pada sel tanggal.

Dengan demikian data `KANTIN`/`LONDRY` tidak lagi membuat satu karyawan menjadi beberapa baris terpisah.

## Status

**Selesai — perbaikan struktur pembacaan JOB dan pengelompokan karyawan.**

---

# 17. Fitur yang Sudah Dikerjakan

| Fitur/Komponen | Status |
|---|---|
| Repository GitHub khusus | ✓ Selesai |
| README proyek | ✓ Selesai |
| Prototype UI v1 | ✓ Selesai |
| Review Prototype v1 | ✓ Selesai |
| Prototype UI v2 | ✓ Selesai |
| Implementasi React | ✓ Selesai |
| Vite frontend | ✓ Selesai |
| Environment configuration | ✓ Selesai |
| Integrasi Supabase Client | ✓ Selesai |
| Query `v_jadwal_karyawan` | ✓ Selesai |
| Loading state | ✓ Selesai |
| Error state | ✓ Selesai |
| Empty state | ✓ Selesai |
| Filter Bulan | ✓ Selesai |
| Filter Tahun | ✓ Selesai |
| Filter Departemen | ✓ Selesai |
| Filter JOB | ✓ Selesai |
| Search Karyawan | ✓ Selesai |
| Tabel jadwal bulanan | ✓ Selesai |
| Tanggal dinamis | ✓ Selesai |
| Label hari | ✓ Selesai |
| Sticky JOB/Nama | ✓ Selesai |
| Kode warna jadwal | ✓ Selesai |
| Legenda | ✓ Selesai |
| Responsive dasar | ✓ Selesai |
| Deployment Vercel | ✓ Selesai |
| Pengujian browser online | ✓ Selesai |
| Pembacaan data PostgreSQL aktual | ✓ Selesai |
| Authentication | Belum |
| RLS policy final | Belum |
| Input/Edit jadwal | Belum |
| Modul absensi | Belum |
| Laporan | Belum |
| Export Excel/PDF | Belum |
| Audit/histori perubahan | Belum |

---

# 18. Hal yang Masih Belum Dikerjakan

## 18.1 Authentication

Belum dibuat:

- login;
- session;
- role;
- hak akses pengguna.

## 18.2 RLS / Keamanan Final

RLS telah diaktifkan pada tabel utama database, tetapi policy final untuk penggunaan aplikasi belum ditentukan.

Sebelum aplikasi digunakan oleh pengguna nyata, model akses harus ditetapkan.

## 18.3 Pengelolaan Jadwal

Belum dibuat:

- tambah jadwal;
- edit jadwal;
- koreksi jadwal;
- hapus jadwal;
- validasi perubahan;
- histori perubahan.

## 18.4 Modul Absensi

Database telah memiliki `attendance_records`, tetapi Web UI absensi belum dikembangkan.

## 18.5 Laporan dan Export

Belum dibuat:

- laporan;
- export Excel;
- export PDF;
- pencetakan format final.

## 18.6 Domain

Website masih menggunakan domain Vercel.

Custom domain belum ditentukan.

---

# 19. Temuan dan Keputusan yang Masih Terbuka

Temuan penting setelah aplikasi benar-benar terhubung ke data:

### 19.1 JOB pada schedule

Temuan awal `JOB —` sudah ditangani pada sisi pembacaan data tanpa mengubah isi data jadwal.

Sekarang frontend membedakan:

- JOB master karyawan;
- JOB assignment pada tanggal tertentu;
- schedule code seperti P/S/M/L/OFF/CT.

Data yang memang tidak mempunyai JOB tetap tidak dibuat-buat. Jadi `—` hanya digunakan ketika sumber data memang tidak menyediakan informasi JOB.

### 19.2 L dan OFF

Makna `L` dan `OFF` masih perlu dikonfirmasi agar tidak hanya menjadi dua kode dengan makna visual yang sama.

### 19.3 Filter JOB

Saat ini daftar JOB pada frontend dapat bergantung pada data yang sedang dimuat. Pada tahap berikutnya perlu dipertimbangkan apakah master JOB sebaiknya dimuat secara terpisah agar filter lebih konsisten.

### 19.4 Data demo

Fallback data demo masih ada untuk kebutuhan pengembangan. Sebelum aplikasi dianggap produksi, perilaku fallback perlu ditinjau agar pengguna tidak keliru menganggap data demo sebagai data aktual.

---

# 20. Prinsip Teknis yang Dipertahankan

1. PostgreSQL/Supabase menjadi sumber data utama.
2. Web UI tidak mengakses PostgreSQL secara langsung.
3. Database dan UI tetap dipisahkan.
4. Tampilan tanggal 1–31 hanya representasi visual.
5. Jadwal tetap disimpan berdasarkan record tanggal.
6. FARM dan HATCHERY menggunakan halaman jadwal yang sama.
7. Data kosong tidak boleh diisi berdasarkan asumsi.
8. Publishable key boleh digunakan pada frontend, sedangkan secret/service-role key tidak boleh.
9. RLS dan authentication harus diselesaikan sebelum penggunaan publik.
10. Prototype dan struktur UI masih dapat berubah.
11. Aturan bisnis yang belum dikonfirmasi tidak boleh dipaksakan ke database.

---

# 21. Keamanan dan Environment Variable

Repository GitHub Web UI bersifat publik.

Karena itu tidak boleh terdapat:

- password database;
- service-role key;
- secret key;
- token pribadi;
- credential pengguna.

Frontend menggunakan:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Nilai `VITE_SUPABASE_ANON_KEY` pada implementasi saat ini adalah Supabase Publishable Key.

Environment variable tersebut dikonfigurasi di Vercel untuk Production dan Preview.

**Catatan penting:** Publishable key bukan pengganti RLS. Keamanan data tetap harus ditentukan melalui authentication dan RLS policy.

---

# 22. Kondisi Proyek Saat Ini

Kondisi aktual:

```
DATABASE
   |
   | PostgreSQL/Supabase
   | Data Oktober 2026
   | View v_jadwal_karyawan
   v
DESAIN UI
   |
   | Prototype v1
   | Prototype v2
   v
FRONTEND
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
   | Data aktual berhasil tampil
   v
TESTING BERHASIL
```

Dengan demikian proyek **sudah melewati tahap prototype lokal dan integrasi online dasar**.

---

# 23. Roadmap Setelah Milestone Deployment

Urutan berikutnya yang direkomendasikan:

### Tahap 1 — Validasi aturan bisnis

Fokus pada:

- JOB master vs JOB pada schedule;
- arti L dan OFF;
- aturan schedule code;
- validasi data Oktober 2026.

### Tahap 2 — Penyempurnaan data/view

Setelah aturan bisnis disepakati:

- perbaiki view bila diperlukan;
- pastikan JOB yang tampil benar;
- pastikan filter menggunakan sumber data yang konsisten.

### Tahap 3 — Authentication

Implementasi:

- login;
- session;
- role;
- hak akses.

### Tahap 4 — RLS final

Menentukan siapa yang boleh:

- melihat jadwal;
- membuat jadwal;
- mengubah jadwal;
- mengelola master.

### Tahap 5 — Interaksi Jadwal

Menambahkan:

- klik sel;
- detail jadwal;
- detail karyawan;
- kemungkinan edit jadwal.

### Tahap 6 — Master Data

Mengembangkan halaman:

- Karyawan;
- Departemen;
- JOB;
- Kode Jadwal.

### Tahap 7 — Absensi

Mengembangkan modul absensi berdasarkan `attendance_records`.

### Tahap 8 — Laporan dan Export

Mengembangkan:

- laporan jadwal;
- laporan absensi;
- Excel;
- PDF;
- pencetakan.

### Tahap 9 — Audit dan Operasional

Menambahkan:

- histori perubahan;
- audit;
- validasi;
- backup/operasional;
- custom domain jika diperlukan.

---

# 24. Riwayat Progres

| Versi | Kegiatan | Status |
|---|---|---|
| v0.1 | Repository Web UI dibuat | Selesai |
| v0.1 | README proyek dibuat | Selesai |
| v0.1 | Konsep halaman Jadwal Bulanan | Selesai |
| v0.1 | Filter dirancang | Selesai |
| v0.1 | Prototype UI v1 | Selesai |
| v0.1 | Review Prototype v1 | Selesai |
| v0.2 | Prototype UI v2 | Selesai |
| v0.2 | Frontend React + Vite | Selesai |
| v0.2 | Supabase Client | Selesai |
| v0.2 | Query `v_jadwal_karyawan` | Selesai |
| v0.2 | Filter dan search aktual | Selesai |
| v0.2 | Loading/error/empty state | Selesai |
| v0.3 | Deployment Vercel | Selesai |
| v0.3 | Konfigurasi environment variable | Selesai |
| v0.3 | Perbaikan Invalid API Key | Selesai |
| v0.3 | Pengujian browser online | Selesai |
| v0.3 | Validasi data FARM Oktober 2026 | Selesai |\n| v0.4 | Analisis penyebab JOB tampil `—` | Selesai |\n| v0.4 | Perbaikan view untuk JOB master | Selesai |\n| v0.4 | Perbaikan grouping frontend berdasarkan employee | Selesai |\n| v0.4 | Tampilan assignment KANTIN/LONDRY pada sel tanggal | Selesai |
| v0.3 | Authentication | Belum |
| v0.3 | RLS policy final | Belum |
| v0.3 | Input/Edit jadwal | Belum |
| v0.3 | Absensi | Belum |
| v0.3 | Laporan/Export | Belum |

---

# 25. Status Dokumen

Dokumen ini merupakan dokumentasi progres dan **bukan dokumen spesifikasi final**.

Perkembangan dicatat berdasarkan pekerjaan yang benar-benar telah dilakukan.

Setiap milestone berikutnya akan dicatat dengan prinsip:

- apa yang dikerjakan;
- tujuan pengerjaan;
- hasil;
- keputusan;
- status;
- temuan;
- pekerjaan yang masih terbuka.

**Status keseluruhan Web UI saat ini:**

> **Frontend React + Vite sudah terhubung ke Supabase, dideploy melalui Vercel, dan berhasil menampilkan data PostgreSQL aktual dari browser. Authentication, RLS final, pengelolaan jadwal, absensi, laporan, dan aturan bisnis tertentu masih dalam pengembangan.**

**Milestone saat ini:**  
**Online Web UI + Supabase Integration + Penyempurnaan Web UI v1 — SEDANG DIKERJAKAN.**


---

# 28. Penyempurnaan Web UI — Navigasi Periode Jadwal

Sebagai bagian dari milestone aktif **Penyelesaian Web UI Jadwal Karyawan v1**, ditambahkan kontrol navigasi periode pada kartu jadwal.

Perubahan:

- tombol **Bulan Sebelumnya**;
- tombol **Bulan Ini**;
- tombol **Bulan Berikutnya**;
- perpindahan bulan otomatis memperbarui tahun ketika melewati Januari/Desember;
- pilihan JOB dikosongkan ketika periode berpindah agar filter tidak membawa konteks JOB yang mungkin tidak tersedia pada periode baru;
- kontrol navigasi dibuat lebih sesuai untuk layar kecil.

Perubahan ini hanya berada pada Web UI dan **tidak mengubah struktur atau data database**.

## Status

**Selesai — Penyempurnaan navigasi periode.**

---

# 29. Milestone Aktif — Update

**Milestone aktif: Penyelesaian Web UI Jadwal Karyawan v1**

Status:

**SEDANG DIKERJAKAN**

Pekerjaan yang telah diselesaikan dalam milestone ini sejauh ini:

- integrasi data aktual;
- filter dasar;
- tabel jadwal bulanan;
- responsive dasar;
- navigasi bulan sebelumnya/berikutnya;
- tombol kembali ke bulan berjalan.

Pekerjaan berikutnya tetap difokuskan pada penyempurnaan Web UI sebelum berpindah ke Authentication, RLS final, atau perubahan besar aturan bisnis.


---

# 30. Penyempurnaan Web UI — Detail Jadwal per Sel

Sebagai bagian dari penyelesaian Web UI v1, setiap sel jadwal sekarang dapat diklik untuk membuka detail.

Informasi yang ditampilkan:

- nama karyawan;
- departemen;
- JOB;
- tanggal;
- status/kode jadwal;
- tugas/penempatan jika tersedia;
- keterangan jika tersedia.

Detail mengambil informasi dari data yang sudah diterima dari `v_jadwal_karyawan`, termasuk kolom `keterangan`. Tidak ada perubahan struktur database pada pekerjaan ini.

Klik di luar dialog atau tombol tutup digunakan untuk menutup detail.

## Status

**Selesai — Interaksi detail jadwal dasar.**

---

# 31. Milestone Aktif — Update

**Milestone aktif: Penyelesaian Web UI Jadwal Karyawan v1**

Status:

**SEDANG DIKERJAKAN**

Pekerjaan Web UI yang telah diselesaikan dalam milestone aktif:

- integrasi data aktual;
- filter dasar;
- tabel jadwal bulanan;
- responsive dasar;
- navigasi bulan;
- tombol Bulan Ini;
- detail jadwal per sel.

Pekerjaan berikutnya tetap difokuskan pada penyempurnaan pengalaman penggunaan tabel dan responsive sebelum berpindah ke tahap Authentication, RLS final, atau perubahan besar aturan bisnis.


---

# 32. Penyempurnaan Web UI — Mode Ringkas Hari

Sebagai lanjutan penyempurnaan tabel jadwal, tombol **Ringkas Hari** sekarang memiliki perilaku nyata pada tabel.

Perubahan:

- mode **Tampilkan Semua Hari** menampilkan seluruh tanggal dalam bulan;
- mode **Ringkas Hari** menyembunyikan Sabtu dan Minggu dari tampilan tabel;
- data Sabtu dan Minggu tidak dihapus dan tetap tersedia pada data jadwal;
- tombol berubah menjadi **Tampilkan Semua Hari** ketika mode ringkas aktif;
- keterangan pada bagian bawah tabel menjelaskan mode yang sedang digunakan;
- identitas baris menggunakan `employee_id` bila tersedia sehingga lebih aman terhadap nama karyawan yang sama.

Perubahan ini hanya berada pada Web UI dan **tidak mengubah struktur atau data database**.

## Status

**Selesai — Mode ringkas tabel jadwal.**

---

# 33. Validasi Deployment Web UI

Setelah penyempurnaan UI, deployment Production diverifikasi melalui Vercel.

Kondisi yang berhasil dikonfirmasi:

- repository: `jadwal-karyawan-web`;
- branch: `main`;
- environment: `Production`;
- deployment berstatus `Ready`;
- commit UI terbaru berhasil dibuat dan diproses Vercel;
- versi terbaru dapat dibuka melalui tombol **Visit** pada deployment Production.

Temuan sebelumnya adalah browser membuka deployment lama. Setelah memilih deployment Production terbaru, perubahan UI berhasil tampil.

## Status

**Selesai — Validasi deployment Production.**

---

# 34. Milestone Aktif — Update

**Milestone aktif: Penyelesaian Web UI Jadwal Karyawan v1**

Status:

**SEDANG DIKERJAKAN**

Pekerjaan Web UI yang telah diselesaikan:

- integrasi data aktual;
- filter dasar;
- tabel jadwal bulanan;
- responsive dasar;
- navigasi bulan;
- tombol Bulan Ini;
- detail jadwal per sel;
- mode Ringkas Hari untuk menyembunyikan Sabtu/Minggu;
- validasi deployment Production.

Pekerjaan berikutnya tetap berada dalam milestone Web UI v1 sampai baseline UI dianggap stabil.

**Authentication, RLS final, perubahan aturan bisnis JOB, input/edit jadwal, absensi, dan laporan belum dimulai pada tahap ini.**


---

# 35. Penyempurnaan Web UI — Filter Rentang Tanggal

Konsep filter periode kemudian diubah dari pemilihan bulan/tahun menjadi **rentang tanggal langsung**.

Perubahan:

- filter **Dari Tanggal**;
- filter **Sampai Tanggal**;
- rentang dapat melewati pergantian bulan, misalnya 28 Oktober 2026 sampai 5 November 2026;
- tabel hanya menampilkan tanggal dalam rentang yang dipilih;
- query Supabase menggunakan batas tanggal awal dan akhir;
- rentang tanggal yang tidak valid ditolak oleh UI;
- tombol **Bulan Ini** tetap tersedia sebagai shortcut untuk mengembalikan periode ke bulan berjalan;
- rentang panjang tetap dapat digeser secara horizontal.

Perubahan ini hanya mengubah cara data ditampilkan dan diambil berdasarkan periode; tidak mengubah struktur tabel database.

## Status

**Selesai — Filter rentang tanggal.**

---

# 36. Penyempurnaan Web UI — Pemilihan Banyak Karyawan

Pencarian karyawan kemudian diubah menjadi kontrol **Pilih Karyawan** berbentuk multi-select.

Fungsi yang tersedia:

- memilih satu atau beberapa karyawan;
- pencarian nama di dalam daftar pilihan;
- **Pilih Semua**;
- **Hapus Semua**;
- ringkasan jumlah karyawan yang dipilih;
- jika tidak ada karyawan dipilih, semua karyawan ditampilkan;
- daftar pilihan mengikuti filter Departemen dan JOB;
- perubahan Departemen atau JOB mengosongkan pilihan karyawan agar tidak membawa filter lama yang tidak relevan.

Pemilihan menggunakan employee_id sehingga tidak bergantung pada nama karyawan.

Filter ini bersifat **client-side terhadap data yang sudah dimuat** dan tidak mengubah data jadwal di database.

## Status

**Selesai — Multi-select karyawan.**

---

# 37. Penyempurnaan Web UI — Mode Perbesar Jadwal

Tombol **Tampilkan** yang sebelumnya hanya berfungsi menutup dropdown pemilihan karyawan kemudian diganti menjadi fungsi yang lebih berguna, yaitu **Perbesar Jadwal**.

Saat mode aktif:

- sidebar disembunyikan;
- header halaman dan bagian yang tidak diperlukan untuk pembacaan tabel disembunyikan;
- kartu jadwal menggunakan area halaman yang lebih luas;
- tinggi area tabel diperbesar sehingga lebih banyak baris dapat dilihat;
- tabel tetap menggunakan scroll horizontal untuk periode tanggal yang panjang;
- tombol berubah menjadi **Kembalikan Tampilan** untuk keluar dari mode fokus.

Mode ini hanya memengaruhi presentasi Web UI. Data, filter, dan database tidak berubah.

## Status

**Selesai — Mode Perbesar Jadwal.**

---

# 38. Pembaruan Daftar Fitur Web UI

Daftar fitur Web UI yang saat ini sudah tersedia diperbarui menjadi:

| Fitur/Komponen | Status |
|---|---|
| Repository GitHub khusus | ✓ Selesai |
| README proyek | ✓ Selesai |
| Prototype UI v1 | ✓ Selesai |
| Prototype UI v2 | ✓ Selesai |
| Implementasi React + Vite | ✓ Selesai |
| Integrasi Supabase | ✓ Selesai |
| Query v_jadwal_karyawan | ✓ Selesai |
| Loading / Error / Empty state | ✓ Selesai |
| Filter rentang tanggal | ✓ Selesai |
| Shortcut Bulan Ini | ✓ Selesai |
| Filter Departemen | ✓ Selesai |
| Filter JOB | ✓ Selesai |
| Multi-select karyawan | ✓ Selesai |
| Tabel jadwal | ✓ Selesai |
| Tanggal dinamis | ✓ Selesai |
| Label hari | ✓ Selesai |
| Sticky JOB/Nama | ✓ Selesai |
| Kode warna jadwal | ✓ Selesai |
| Legenda kode jadwal | ✓ Selesai |
| Detail jadwal per sel | ✓ Selesai |
| Responsive dasar | ✓ Selesai |
| Mode Perbesar Jadwal | ✓ Selesai |
| Deployment Vercel | ✓ Selesai |
| Pengujian browser online | ✓ Selesai |
| Authentication | Belum |
| RLS policy final | Belum |
| Input/Edit jadwal | Belum |
| Modul absensi | Belum |
| Laporan | Belum |
| Export Excel/PDF | Belum |
| Audit/histori perubahan | Belum |

---

# 39. Catatan Koreksi terhadap Fitur Lama

Dokumentasi sebelumnya mencatat adanya **Mode Ringkas Hari** yang menyembunyikan Sabtu/Minggu.

Fitur tersebut **tidak lagi menjadi desain UI saat ini**. Konsep tersebut telah digantikan oleh filter rentang tanggal, sehingga pengguna dapat menentukan sendiri tanggal awal dan akhir yang ingin ditampilkan.

Dengan demikian:

- tidak ada lagi kebutuhan untuk mode khusus menyembunyikan weekend;
- Sabtu/Minggu tetap dapat ditampilkan jika masuk dalam rentang tanggal;
- pengguna dapat membuat rentang pendek maupun panjang sesuai kebutuhan.

Bagian dokumentasi lama mengenai Mode Ringkas Hari dipertahankan sebagai **riwayat pengembangan**, bukan sebagai spesifikasi UI saat ini.

---

# 40. Kondisi Web UI Saat Ini

Alur penggunaan Web UI saat ini:

1. Pengguna memilih **Dari Tanggal** dan **Sampai Tanggal**.
2. Pengguna memilih **Departemen**.
3. Pengguna dapat memilih **JOB**.
4. Pengguna dapat membuka **Pilih Karyawan** untuk memilih satu atau beberapa karyawan.
5. Tabel jadwal menampilkan data sesuai filter.
6. Sel jadwal dapat diklik untuk melihat detail.
7. Jika membutuhkan area kerja yang lebih besar, pengguna memilih **Perbesar Jadwal**.
8. Untuk kembali ke tampilan normal, pengguna memilih **Kembalikan Tampilan**.

Filter dan mode tampilan tersebut tidak mengubah data yang tersimpan di PostgreSQL.

---

# 41. Riwayat Perubahan Web UI Terbaru

| Perubahan | Status |
|---|---|
| Penggantian Ringkas Hari dengan filter rentang tanggal | Selesai |
| Dukungan rentang lintas bulan | Selesai |
| Penggantian Search Karyawan menjadi Pilih Karyawan | Selesai |
| Multi-select karyawan | Selesai |
| Pencarian nama di dalam picker | Selesai |
| Pilih Semua / Hapus Semua | Selesai |
| Pengelompokan filter berdasarkan employee_id | Selesai |
| Penggantian tombol Tampilkan menjadi Perbesar Jadwal | Selesai |
| Mode fokus untuk memperbesar tabel | Selesai |
| Tombol Kembalikan Tampilan | Selesai |

---

# 42. Status Dokumen Setelah Update Terbaru

Dokumen ini tetap merupakan **living document** dan belum menjadi spesifikasi final.

Perubahan terbaru menunjukkan bahwa Web UI sudah berkembang dari prototype tabel bulanan menjadi antarmuka yang lebih fleksibel untuk pekerjaan operasional:

- periode dapat ditentukan dengan rentang tanggal;
- karyawan dapat dipilih secara individual atau massal;
- detail jadwal dapat dibuka dari sel;
- tabel dapat diperbesar untuk penggunaan layar besar.

Fokus pengembangan tetap pada **Web UI v1** sampai baseline penggunaan dianggap stabil. Tahap Authentication, RLS final, pengelolaan jadwal, absensi, laporan, dan penyelesaian aturan bisnis tetap belum menjadi bagian dari implementasi saat ini.

**Status keseluruhan saat ini:**

> **Web UI React + Vite sudah online, terhubung ke Supabase/PostgreSQL, mampu menampilkan jadwal berdasarkan rentang tanggal, memfilter karyawan secara multi-select, membuka detail jadwal, dan menyediakan mode Perbesar Jadwal.**


---

# 43. Penyempurnaan Web UI — Pemilih Bulan 12 Bulan

Shortcut periode **Bulan Ini** kemudian disempurnakan menjadi **Pilih Bulan**.

Perubahan:

- tombol **Pilih Bulan** membuka daftar Januari sampai Desember;
- pengguna dapat memilih salah satu bulan secara langsung;
- pemilihan bulan otomatis mengatur tanggal awal ke hari pertama bulan tersebut;
- pemilihan bulan otomatis mengatur tanggal akhir ke hari terakhir bulan tersebut;
- filter **Dari Tanggal** dan **Sampai Tanggal** tetap tersedia sehingga pengguna masih dapat membuat rentang tanggal custom;
- pemilihan bulan mengosongkan filter JOB dan pilihan karyawan agar konteks filter lama tidak terbawa;
- pemilihan bulan hanya memengaruhi tampilan/periode query dan tidak mengubah database.

## Perbaikan Teknis

Ditemukan masalah pada penanganan tanggal ketika konversi menggunakan UTC sehingga tanggal awal dapat bergeser satu hari pada kondisi tertentu.

Perbaikan dilakukan dengan menggunakan kalender lokal untuk:

- pembentukan nilai input tanggal;
- perhitungan awal/akhir bulan;
- pembentukan rentang tanggal.

Dengan demikian pemilihan bulan tidak lagi mengalami pergeseran tanggal akibat perbedaan timezone.

## Status

**Selesai — Pemilih bulan 12 bulan dan perbaikan kalender lokal.**

---

# 44. Penyempurnaan Web UI — Tombol Tampilkan Job

Kolom **JOB** pada tabel dibuat dapat ditampilkan atau disembunyikan untuk memberikan ruang lebih besar pada area jadwal.

Perubahan:

- secara default kolom JOB **disembunyikan**;
- tombol kontrol menggunakan tulisan **Tampilkan Job**;
- ketika kolom JOB sedang tampil, tombol berubah menjadi **Sembunyikan Job**;
- kolom JOB dapat ditampilkan kembali tanpa mengubah data;
- ketika JOB disembunyikan, kolom **Nama Karyawan** menjadi kolom sticky paling kiri;
- perubahan hanya memengaruhi presentasi tabel.

Tujuan utama perubahan ini adalah memberikan area yang lebih luas untuk membaca tanggal-tanggal jadwal, terutama pada layar dengan lebar terbatas.

## Status

**Selesai — Toggle tampilan kolom JOB.**

---

# 45. Penyempurnaan Web UI — Penanda Header Hari Minggu

Untuk membantu pembacaan kalender kerja, header kolom yang merupakan **hari Minggu** diberi tampilan warna khusus.

Perubahan:

- hanya header tanggal hari Minggu yang diberi warna berbeda;
- header hari Senin sampai Sabtu tetap menggunakan tampilan normal;
- sel jadwal karyawan di bawah hari Minggu **tidak ikut diubah warnanya**;
- kode jadwal seperti P, S, M, L, OFF, dan CT tetap menggunakan warna masing-masing;
- perubahan hanya bersifat visual dan tidak memengaruhi data jadwal.

Hari Minggu dikenali dari kode hari kalender lokal yang digunakan oleh frontend.

## Status

**Selesai — Penanda visual header hari Minggu.**

---

# 46. Pembaruan Daftar Fitur Web UI — Setelah Penyempurnaan Terbaru

Fitur Web UI yang telah tersedia saat ini mencakup:

| Fitur/Komponen | Status |
|---|---|
| Repository GitHub khusus | ✓ Selesai |
| README proyek | ✓ Selesai |
| Prototype UI v1 | ✓ Selesai |
| Prototype UI v2 | ✓ Selesai |
| Implementasi React + Vite | ✓ Selesai |
| Integrasi Supabase | ✓ Selesai |
| Query v_jadwal_karyawan | ✓ Selesai |
| Loading / Error / Empty state | ✓ Selesai |
| Filter rentang tanggal | ✓ Selesai |
| Pemilih bulan Januari–Desember | ✓ Selesai |
| Filter Departemen | ✓ Selesai |
| Filter JOB | ✓ Selesai |
| Multi-select karyawan | ✓ Selesai |
| Pencarian nama dalam picker | ✓ Selesai |
| Pilih Semua / Hapus Semua | ✓ Selesai |
| Tabel jadwal | ✓ Selesai |
| Tanggal dinamis | ✓ Selesai |
| Label hari | ✓ Selesai |
| Penanda khusus header hari Minggu | ✓ Selesai |
| Sticky JOB/Nama | ✓ Selesai |
| Toggle Tampilkan Job / Sembunyikan Job | ✓ Selesai |
| Kode warna jadwal | ✓ Selesai |
| Legenda kode jadwal | ✓ Selesai |
| Detail jadwal per sel | ✓ Selesai |
| Responsive dasar | ✓ Selesai |
| Mode Perbesar Jadwal | ✓ Selesai |
| Deployment Vercel | ✓ Selesai |
| Pengujian browser online | ✓ Selesai |
| Authentication | Belum |
| RLS policy final | Belum |
| Input/Edit jadwal | Belum |
| Modul absensi | Belum |
| Laporan | Belum |
| Export Excel/PDF | Belum |
| Audit/histori perubahan | Belum |

---

# 47. Kondisi Web UI Setelah Penyempurnaan Terbaru

Alur penggunaan Web UI saat ini:

1. Pengguna menentukan **Dari Tanggal** dan **Sampai Tanggal**, atau menggunakan **Pilih Bulan** untuk memilih Januari–Desember.
2. Pengguna memilih **Departemen**.
3. Pengguna dapat memilih **JOB**.
4. Pengguna dapat membuka **Pilih Karyawan** untuk memilih satu atau beberapa karyawan.
5. Tabel menampilkan jadwal sesuai filter.
6. Header hari Minggu memiliki penanda visual khusus untuk memudahkan pembacaan kalender.
7. Kolom JOB dapat ditampilkan melalui tombol **Tampilkan Job** atau disembunyikan melalui **Sembunyikan Job**.
8. Sel jadwal dapat diklik untuk melihat detail.
9. Pengguna dapat memilih **Perbesar Jadwal** untuk mendapatkan area kerja tabel yang lebih luas.
10. Pengguna dapat memilih **Kembalikan Tampilan** untuk kembali ke tampilan normal.

Seluruh perubahan tersebut masih berada pada lapisan Web UI dan tidak mengubah struktur maupun data jadwal di PostgreSQL.

---

# 48. Riwayat Perubahan Web UI Terbaru — Pembaruan

| Perubahan | Status |
|---|---|
| Penggantian Ringkas Hari dengan filter rentang tanggal | Selesai |
| Dukungan rentang lintas bulan | Selesai |
| Penggantian Search Karyawan menjadi Pilih Karyawan | Selesai |
| Multi-select karyawan | Selesai |
| Pencarian nama di dalam picker | Selesai |
| Pilih Semua / Hapus Semua | Selesai |
| Pengelompokan filter berdasarkan employee_id | Selesai |
| Penggantian tombol Tampilkan menjadi Perbesar Jadwal | Selesai |
| Mode fokus untuk memperbesar tabel | Selesai |
| Tombol Kembalikan Tampilan | Selesai |
| Penggantian shortcut Bulan Ini menjadi Pilih Bulan | Selesai |
| Pemilihan 12 bulan Januari–Desember | Selesai |
| Perbaikan pergeseran tanggal akibat timezone | Selesai |
| Toggle kolom JOB melalui tombol Tampilkan Job | Selesai |
| Tombol berubah menjadi Sembunyikan Job saat kolom aktif | Selesai |
| Penanda khusus header hari Minggu | Selesai |

---

# 49. Status Dokumen Setelah Penyempurnaan Terbaru

Dokumen ini tetap merupakan **living document** dan belum menjadi spesifikasi final.

Penyempurnaan Web UI terbaru berfokus pada efisiensi penggunaan tabel:

- periode dapat dipilih melalui rentang tanggal atau bulan;
- pemilihan karyawan dapat dilakukan secara multi-select;
- tabel dapat diperbesar;
- kolom JOB dapat disembunyikan untuk memperluas area jadwal;
- hari Minggu lebih mudah dikenali melalui header khusus;
- detail jadwal tetap dapat dibuka dari sel.

Tidak ada perubahan database yang dilakukan untuk penyempurnaan UI pada bagian ini.

**Status keseluruhan saat ini:**

> **Web UI React + Vite sudah online, terhubung ke Supabase/PostgreSQL, mampu menampilkan jadwal berdasarkan rentang tanggal atau pilihan bulan, memfilter karyawan secara multi-select, membuka detail jadwal, memperbesar area tabel, menyembunyikan/menampilkan kolom JOB, dan memberikan penanda visual khusus pada header hari Minggu.**

**Milestone saat ini:**  
**Online Web UI + Supabase Integration + Penyempurnaan Web UI v1 — SEDANG DIKERJAKAN.**
