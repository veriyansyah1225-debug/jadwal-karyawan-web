# Dokumentasi Progres Pengembangan Web UI — Jadwal Karyawan

**Status:** Draft / Living Document  
**Versi:** 1.3  
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
| JOB | 9 |
| Karyawan | 30 |
| Kode jadwal | 6 |
| Jadwal Oktober 2026 | 401 record |
| Data absensi | 0 record |
| View `v_jadwal_karyawan` | Tersedia |

Database PostgreSQL/Supabase menjadi sumber data utama Web UI.

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
| Export Excel/PDF | Belum |
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

### 11.2 L dan OFF

Makna `L` dan `OFF` masih perlu dikonfirmasi agar keduanya tidak sekadar menjadi dua kode dengan makna visual yang sama.

### 11.3 Filter JOB

Saat ini sumber daftar JOB dapat bergantung pada data yang sedang dimuat.

Perlu dipertimbangkan apakah master JOB sebaiknya dimuat terpisah agar filter lebih konsisten.

### 11.4 Data Demo

Fallback data demo **sudah dihapus** dari Web UI Production.

Jika Supabase belum dikonfigurasi atau query Supabase gagal, aplikasi menampilkan kondisi error dan tidak mengganti data aktual dengan data demo.

Keputusan ini didokumentasikan pada `docs/Dokumentasi_Perubahan_dan_Audit_Web_UI.md`.

### 11.5 Sumber Departemen

Dropdown Departemen pada Web UI Production sekarang membaca `public.departments` melalui Supabase Client.

Query hanya mengambil departemen aktif (`aktif = true`) dan mengurutkan berdasarkan `nama_departemen`.

Daftar FARM/HATCHERY tidak lagi ditulis sebagai opsi hardcode pada Web UI.

### 11.6 Authentication dan RLS

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
- Excel;
- PDF;
- pencetakan format final.

### Operasional

- audit;
- backup/operasional;
- custom domain jika diperlukan.

---

## 16. Roadmap Berikutnya

Urutan pengembangan yang disarankan:

1. **Validasi aturan bisnis**
   - JOB master vs assignment;
   - arti L dan OFF;
   - aturan schedule code;
   - validasi data Oktober 2026.

2. **Penyempurnaan database/view**
   - hanya setelah aturan bisnis disepakati.

3. **Authentication**

4. **RLS final**

5. **Interaksi dan pengelolaan jadwal**

6. **Master data**

7. **Modul absensi**

8. **Laporan dan export**

9. **Audit dan operasional**

Fokus saat ini tetap pada penyelesaian dan stabilisasi **Web UI v1** sebelum masuk ke perubahan besar database atau modul berikutnya.

---

## 17. Riwayat Progres Ringkas

Riwayat berikut mempertahankan milestone penting tanpa mengulang daftar fitur dan status proyek pada setiap bagian.

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
| Saat ini | Stabilisasi Web UI v1 | Sedang dikerjakan |

---

## 18. Status Dokumen

Dokumen ini adalah **dokumentasi progres**, bukan spesifikasi final.

Audit versi 1.1 menghapus pengulangan yang sebelumnya terdapat pada:

- beberapa daftar fitur dengan isi hampir sama;
- beberapa bagian kondisi/status proyek;
- beberapa tabel riwayat perubahan UI;
- beberapa update milestone yang hanya mengulang daftar pekerjaan;
- pengulangan alur penggunaan Web UI;
- pengulangan status dokumen pada beberapa bagian.

Informasi penting tetap dipertahankan dalam bentuk yang lebih ringkas, terutama:

- milestone historis;
- fitur aktif;
- fitur yang sudah tidak digunakan;
- temuan dan keputusan terbuka;
- keamanan;
- roadmap;
- status pekerjaan.

**Status keseluruhan:**

> **Web UI React + Vite sudah online, terhubung ke Supabase/PostgreSQL, mampu menampilkan jadwal berdasarkan rentang tanggal atau pilihan bulan, memfilter karyawan secara multi-select, membuka detail jadwal, memperbesar area tabel, menampilkan/menyembunyikan kolom JOB, dan memberikan penanda visual khusus pada header hari Minggu. Authentication, RLS final, pengelolaan jadwal, absensi, laporan, dan beberapa aturan bisnis masih belum final.**

**Milestone saat ini:**  
**Online Web UI + Supabase Integration + Penyempurnaan Web UI v1 — SEDANG DIKERJAKAN.**

Perubahan Production terbaru dan keputusan audit dicatat pada `docs/Dokumentasi_Perubahan_dan_Audit_Web_UI.md`.


### Baseline Master Data Terbaru

- Departemen aktif: 2
- JOB master: 9, termasuk JOB HATCHERY pada Departemen HATCHERY
- Karyawan: 30
- Seluruh 15 karyawan HATCHERY menggunakan JOB master HATCHERY
- Deta dan Alda berada di HATCHERY dan tetap memiliki assignment harian seperti KANTIN, LONDRY, atau OFF
- Total employee_schedules: 401
- Tidak ditemukan duplikasi pasangan employee_id dan tanggal pada jadwal
