# Dokumentasi Progres Pengembangan Web UI — Jadwal Karyawan

**Status:** Draft / Progress Development  
**Versi:** 0.3  
**Tanggal:** 2026-10-06  
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

## Status

**Pengujian berhasil; aturan bisnis JOB masih terbuka.**

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

Sebagian schedule memiliki `job_id` kosong sehingga UI menampilkan `—`.

Ini perlu keputusan bisnis sebelum perubahan struktur atau view.

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
| v0.3 | Validasi data FARM Oktober 2026 | Selesai |
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
**Online Web UI + Supabase Integration + Browser Testing — BERHASIL.**
