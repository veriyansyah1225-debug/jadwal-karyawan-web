# Dokumentasi Perubahan dan Audit Web UI — Jadwal Karyawan

**Status:** Living Document  
**Versi:** 2.0  
**Tanggal:** 2026-10-07  
**Repository:** `veriyansyah1225-debug/jadwal-karyawan-web`  
**Branch produksi:** `main`  
**Deployment:** Vercel Production

---

## 1. Tujuan Dokumen

Dokumen ini menjadi catatan khusus untuk setiap perubahan Web UI dan integrasi database yang **sudah disepakati dan digunakan**.

Perubahan yang dicatat mencakup:

- fitur yang diperbaiki;
- fitur yang ditambahkan;
- fitur yang dihilangkan;
- perubahan sumber data;
- perubahan keamanan/integrasi;
- audit yang menghasilkan keputusan teknis;
- hasil verifikasi sebelum perubahan digunakan di Production.

Dokumen ini berbeda dari roadmap. Roadmap menjelaskan rencana, sedangkan dokumen ini mencatat **hasil yang benar-benar telah diterapkan**.

---

## 2. Prinsip Dokumentasi Otomatis

Mulai dari dokumentasi ini, setiap kali suatu perubahan telah disepakati untuk digunakan pada Web UI atau database:

1. Perubahan diimplementasikan.
2. Perubahan diverifikasi sesuai ruang lingkupnya.
3. Jika hasilnya disetujui untuk digunakan, perubahan langsung didokumentasikan.
4. Dokumen progres atau dokumen teknis terkait ikut diaudit jika isinya menjadi tidak sesuai.
5. Perubahan yang belum disepakati atau masih eksperimen tidak dicatat sebagai kondisi Production.
6. Dokumentasi harus membedakan dengan jelas antara:
   - **Production / sudah digunakan**;
   - **Preview / sedang diuji**;
   - **rencana / belum diterapkan**.

Dengan demikian, pengguna tidak perlu memberikan persetujuan terpisah hanya untuk proses dokumentasi setelah hasil perubahan sudah disepakati.

---

## 3. Aturan Sumber Kebenaran

Untuk status implementasi Web UI:

- GitHub branch `main` = sumber kode Production.
- Vercel Production = deployment yang digunakan secara online.
- PostgreSQL/Supabase = sumber data utama.
- Dokumentasi progres = ringkasan kondisi proyek.
- Dokumen ini = riwayat perubahan dan audit yang sudah disepakati.

Perubahan yang masih berada pada branch fitur/Preview tidak boleh disebut sebagai fitur Production sampai benar-benar digunakan pada `main` dan deployment Production berhasil.

---

## 4. Riwayat Perubahan

### 4.1 Penghapusan Data Demo dari Web UI

**Status:** Production  
**Commit:** `6cbebda2522111bf69194242dab61e164c7535bd`

#### Perubahan

Fallback data demo pada `src/App.jsx` dihapus.

Yang dihilangkan:

- `demoEmployees`;
- `resetToDemo()`;
- perilaku fallback ke data demo ketika Supabase belum tersedia;
- tombol/fungsi untuk menggunakan data demo.

#### Perilaku baru

Jika Supabase belum dikonfigurasi:

> Web UI menampilkan pesan bahwa Supabase belum dikonfigurasi.

Jika query Supabase gagal:

> Web UI menampilkan error dan tidak mengganti data dengan data palsu.

#### Keputusan

Data demo tidak lagi boleh muncul pada Web UI yang digunakan untuk membaca data aktual. Tujuannya agar pengguna tidak salah menganggap data contoh sebagai data produksi.

---

### 4.2 Sumber Departemen Dipindahkan ke Database

**Status:** Production  
**Commit:** `bec4e30c0eaffb8a844a75a69de1d7728382ce52`

#### Sebelum

Pilihan Departemen pada Web UI ditulis langsung di kode:

- FARM
- HATCHERY

#### Sesudah

Web UI membaca tabel:

`public.departments`

Query mengambil:

- `id`;
- `nama_departemen`;
- hanya record dengan `aktif = true`;
- diurutkan berdasarkan `nama_departemen`.

Dropdown kemudian dibentuk dari hasil query database.

#### Alur

```
PostgreSQL
   ↓
public.departments
   ↓
Supabase Client
   ↓
React Web UI
   ↓
Dropdown Departemen
```

#### Dampak

Penambahan atau perubahan departemen aktif di database dapat tercermin pada dropdown Web UI tanpa harus menulis ulang daftar FARM/HATCHERY di kode.

#### Verifikasi

Perubahan diverifikasi sebelum masuk Production dengan memastikan:

- query `departments` tersedia;
- filter `aktif = true` tersedia;
- pengurutan nama tersedia;
- dropdown menggunakan hasil query;
- opsi FARM/HATCHERY tidak lagi hardcode;
- mekanisme data demo tetap tidak tersedia.

Setelah verifikasi, perubahan dipindahkan ke `main` dan berhasil digunakan pada Vercel Production.

---

### 4.3 Penetapan JOB Master HATCHERY dan Penempatan Deta/Alda

**Status:** Production / Database aktif  
**Tanggal:** 2026-10-07

#### Keputusan

Untuk tahap stabilisasi awal, Departemen HATCHERY menggunakan satu JOB master saja, yaitu HATCHERY.

Perubahan yang diterapkan pada database:

- menambahkan JOB master HATCHERY pada Departemen HATCHERY;
- menetapkan seluruh karyawan HATCHERY menggunakan JOB master HATCHERY;
- memastikan Deta dan Alda tercatat pada Departemen HATCHERY dengan JOB master HATCHERY;
- assignment harian Deta dan Alda seperti KANTIN, LONDRY, dan OFF tetap dipertahankan;
- tidak membuat duplikasi karyawan di Departemen FARM.

#### Hasil verifikasi

- 15 karyawan berada di Departemen HATCHERY;
- 15 karyawan tersebut menggunakan JOB master HATCHERY;
- Deta memiliki 27 record jadwal dan Alda memiliki 26 record jadwal;
- assignment harian mereka tetap tersimpan;
- total employee_schedules tetap 401;
- tidak ditemukan duplikasi employee_id dan tanggal.

#### Dampak UI

Saat filter Departemen HATCHERY digunakan, Deta dan Alda akan tampil sebagai karyawan HATCHERY. Assignment harian seperti KANTIN/LONDRY tetap dapat muncul pada tabel karena assignment tersebut berasal dari record jadwal, bukan perubahan identitas master karyawan.

Detail pembagian JOB internal HATCHERY ditunda sampai database stabil.

---

### 4.4 Penambahan JOB Master Kandang

**Status:** Production / Database aktif  
**Tanggal:** 2026-10-07

#### Perubahan

JOB master `Kandang` tersedia pada Departemen FARM.

Hasil verifikasi database:

- JOB `Kandang` tersedia;
- Departemen = FARM;
- status aktif = true;
- ID JOB = 10.

#### Batas perubahan

Penambahan JOB dilakukan lebih dahulu agar setiap karyawan yang dimasukkan sudah memiliki referensi JOB yang jelas.

Jadwal Oktober pada gambar **belum dimasukkan** pada tahap ini. Data master karyawan dan data jadwal sengaja dipisahkan untuk mencegah kesalahan pemasukan data.

---

### 4.6 Penambahan JOB IB, Karyawan IB, dan Jadwal Oktober 2026

**Status:** Production / Database aktif  
**Tanggal:** 2026-10-07

#### Sumber

Tabel sumber terbaru menunjukkan JOB `IB` dengan 12 karyawan dan tanda `L` pada tanggal **4, 11, 18, dan 25 Oktober 2026**. Data sebelumnya menggunakan tanggal 7, 14, 21, dan 28 sehingga dinyatakan perlu dikoreksi.

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

#### Keputusan

JOB `IB` dimasukkan sebagai JOB master pada Departemen FARM. Keputusan ini konsisten dengan contoh struktur awal project yang menempatkan IB sebagai JOB dan dengan konteks penambahan data FARM secara bertahap.

#### Perubahan database

- JOB master `IB` ditambahkan pada Departemen FARM;
- 12 karyawan dimasukkan ke `employees` sebagai FARM / IB;
- 48 record jadwal Oktober 2026 dikoreksi sebagai kode `L`;
- setiap karyawan memiliki jadwal L pada 4, 11, 18, dan 25 Oktober 2026.

#### Verifikasi

- 12 karyawan IB aktif;
- 48 jadwal Oktober 2026;
- seluruh 48 jadwal menggunakan kode `L`;
- tidak ditemukan duplikasi employee_id dan tanggal;
- total karyawan aktif setelah penambahan ARIF = 60;
- total `employee_schedules` setelah penambahan ARIF = 522.

Perubahan ini hanya menambahkan JOB, master karyawan, dan jadwal IB yang diberikan. Data JOB lain tidak diubah.

---

### 4.7 Koreksi Jadwal IB dan Penambahan ARIF pada JOB MEKANIK

**Status:** Production / Database aktif  
**Tanggal:** 2026-10-07

#### Koreksi JOB IB

Berdasarkan tabel sumber terbaru, tanggal L JOB IB yang benar adalah **4, 11, 18, dan 25 Oktober 2026** untuk seluruh 12 karyawan.

Seluruh 48 record IB Oktober 2026 sebelumnya dihapus dan dimasukkan kembali dengan tanggal yang benar. Tidak ada perubahan pada master karyawan IB.

#### Penambahan ARIF

Sumber yang sama menunjukkan:

- Nama: **ARIF**
- JOB: **Mekanik**
- L: **1, 8, 15, 22 Oktober 2026**

ARIF ditambahkan sebagai karyawan FARM dengan JOB master `MEKANIK`, kemudian 4 record jadwal L Oktober 2026 dimasukkan.

#### Verifikasi

- total karyawan aktif = 60;
- total `employee_schedules` = 522;
- IB memiliki 48 jadwal L pada 4, 11, 18, 25 Oktober;
- ARIF memiliki 4 jadwal L pada 1, 8, 15, 22 Oktober;
- tidak ditemukan duplikasi pasangan employee_id dan tanggal.

---

### 4.8 Penambahan Export Excel dan PDF

**Status:** Production / Web UI aktif  
**Tanggal:** 2026-10-07

#### Perubahan

Web UI sekarang menyediakan dua tombol export pada halaman jadwal:

- **Excel** untuk mengunduh `.xlsx`;
- **PDF** untuk mengunduh `.pdf`.

#### Aturan export

Export menggunakan hasil data yang sedang ditampilkan setelah filter aktif diterapkan. Dengan demikian pengguna dapat mengunduh:

- seluruh karyawan yang sedang ditampilkan;
- hanya JOB tertentu;
- hanya karyawan tertentu;
- rentang tanggal tertentu;
- Departemen yang sedang dipilih.

PDF dibuat dalam format landscape A3 agar tabel jadwal tetap memiliki ruang horizontal yang cukup. Excel menggunakan sheet `Jadwal` dan menyertakan Departemen serta periode pada bagian atas.

#### Batasan

Fitur ini hanya membaca data. Export tidak mengubah database, tidak menambah/menghapus jadwal, dan tidak membutuhkan hak tulis.

#### Verifikasi

Kode export ditempatkan di frontend dan menggunakan data hasil query `v_jadwal_karyawan` yang sudah dimuat. Tombol export dinonaktifkan ketika data sedang dimuat atau tidak ada hasil.

---

### 4.9 Penambahan Karyawan HERI sebagai FARM / Kandang

**Status:** Production / Database aktif  
**Tanggal:** 2026-10-07

#### Sumber

Daftar yang diberikan pengguna menunjukkan:

- Nama: **HERI**
- JOB: **Kandang**

#### Perubahan database

Karyawan HERI dimasukkan ke `public.employees` dengan:

- employee_id = 31;
- nama = HERI;
- Departemen = FARM;
- JOB master = Kandang;
- aktif = true.

#### Verifikasi

Setelah pemasukan:

- HERI berhasil tersimpan pada master karyawan;
- JOB Kandang tersedia dan menjadi referensi HERI;
- tidak ada duplikasi nama `HERI` pada master sebelum pemasukan;
- tidak ada perubahan pada 401 record `employee_schedules`;
- jadwal Oktober dari gambar **belum dimasukkan** untuk HERI.

#### Batas perubahan

Perubahan ini hanya memasukkan **master karyawan**. Tanda jadwal seperti L, CT, dan OFF pada gambar belum diproses.

Enam belas nama Kandang lainnya masih akan dimasukkan satu per satu.

---

## 5. Kondisi Production Saat Ini

### Web UI

Web UI Production:

- membaca jadwal dari `v_jadwal_karyawan`;
- tidak memiliki fallback data demo;
- Departemen dibaca dari tabel `departments`;
- masih bersifat read-only;
- belum memiliki login;
- belum memiliki input/edit jadwal.

### Database

PostgreSQL/Supabase tetap menjadi sumber data utama.

Perubahan terakhir pada master data dan jadwal:

- JOB Kandang tersedia pada FARM;
- seluruh 17 karyawan Kandang sudah ditambahkan sebagai karyawan FARM / Kandang;
- 68 record libur Kandang Oktober 2026 sudah dimasukkan sebagai kode L;
- 1 record CT untuk RIDWAN pada 1 Oktober 2026;
- kode OFF sudah dinormalisasi ke L dan dinonaktifkan;
- desain kode libur sudah diubah menjadi satu standar: L untuk Libur pada input dan tampilan.

Total `employee_schedules` saat ini = 522.

Web UI juga sudah menyediakan export Excel dan PDF untuk jadwal yang sedang ditampilkan.

JOB `IB` juga sudah ditambahkan pada Departemen FARM bersama 12 karyawan dan 48 record jadwal L Oktober 2026 yang sudah dikoreksi ke tanggal 4, 11, 18, dan 25. ARIF juga sudah ditambahkan pada JOB MEKANIK dengan 4 record L pada 1, 8, 15, dan 22 Oktober 2026.

---

## 6. Audit Dokumen yang Relevan

Setelah perubahan Production, dokumentasi progres harus mencerminkan kondisi aktual.

Bagian yang perlu dijaga konsistensinya:

- sumber data Web UI;
- status data demo;
- sumber daftar Departemen;
- status deployment;
- fitur yang sudah Production;
- fitur yang masih Preview atau belum dibuat;
- jumlah master JOB;
- jumlah karyawan;
- jumlah jadwal setelah penambahan JOB baru;
- koreksi tanggal jadwal berdasarkan sumber terbaru;
- status pemasukan karyawan FARM.

### Hasil audit

Dokumentasi progres diperbarui menjadi versi 1.9 untuk mencatat:

- jumlah karyawan menjadi 47;
- seluruh 17 karyawan Kandang sudah menjadi karyawan FARM;
- seluruh 17 karyawan menggunakan JOB Kandang;
- 68 record libur Kandang Oktober 2026 sudah dimasukkan sebagai L;
- 1 record CT untuk RIDWAN pada 1 Oktober 2026;
- total employee_schedules menjadi 522 setelah koreksi IB dan penambahan ARIF;
- JOB IB dan 12 karyawan IB sudah ditambahkan pada FARM;
- 48 jadwal L Oktober 2026 untuk IB sudah dikoreksi menjadi tanggal 4, 11, 18, dan 25;
- ARIF sudah ditambahkan pada JOB MEKANIK dengan 4 jadwal L;
- OFF dinormalisasi menjadi L dan dinonaktifkan;
- Web UI tidak lagi menampilkan OFF;
- perubahan tersebut dicatat sebagai perubahan desain/standarisasi, bukan hanya perubahan visual.

---

## 7. Batas Perubahan

Perubahan yang tercatat di dokumen ini **tidak berarti** bahwa fitur berikut sudah tersedia:

- login;
- authentication;
- CRUD jadwal;
- pengelolaan master karyawan melalui Web UI;
- pengelolaan JOB melalui Web UI;
- pengelolaan kode jadwal;
- absensi;
- laporan;
- export — sudah tersedia untuk Excel dan PDF;
- audit histori perubahan.

Fitur-fitur tersebut tetap mengikuti status pada dokumentasi progres dan roadmap.

---

## 8. Prosedur Dokumentasi untuk Perubahan Berikutnya

Setiap perubahan berikutnya mengikuti pola:

```
Kebutuhan
   ↓
Diskusi / validasi
   ↓
Implementasi
   ↓
Verifikasi
   ↓
Disepakati untuk digunakan
   ↓
Dokumentasikan otomatis
   ↓
Audit dokumen terkait
   ↓
Production
```

Jika perubahan belum disepakati:

```
Eksperimen / Preview
   ↓
Belum dicatat sebagai Production
```

---

## 9. Catatan Keputusan

### Keputusan D-001 — Tidak ada fallback data demo

**Keputusan:** disetujui dan Production.

Web UI tidak boleh menampilkan data demo ketika data aktual tidak tersedia.

### Keputusan D-002 — Departemen berasal dari master database

**Keputusan:** disetujui dan Production.

Dropdown Departemen menggunakan data aktif dari `public.departments`.

### Keputusan D-003 — Dokumentasi otomatis setelah hasil disepakati

**Keputusan:** disetujui.

Setelah sebuah fitur diperbaiki, ditambahkan, dihilangkan, atau sebuah audit menghasilkan perubahan yang telah disepakati untuk digunakan, dokumentasi perubahan dan dokumen terkait diperbarui tanpa memerlukan persetujuan dokumentasi tambahan.

### Keputusan D-004 — Baseline JOB HATCHERY

**Keputusan:** disetujui dan diterapkan pada database.

Untuk tahap awal, seluruh karyawan Departemen HATCHERY menggunakan satu JOB master, yaitu HATCHERY. Penugasan harian lintas pekerjaan tetap dicatat sebagai assignment pada jadwal dan tidak memindahkan identitas master karyawan ke Departemen FARM.

### Keputusan D-005 — Penambahan data FARM secara bertahap

**Keputusan:** disetujui dan sedang diterapkan.

Data karyawan FARM dari sumber baru dimasukkan per JOB. JOB master harus tersedia lebih dahulu, kemudian daftar karyawan diverifikasi sebelum dimasukkan. Jadwal sumber tidak otomatis dimasukkan bersamaan dengan master karyawan.

### Keputusan D-006 — Seluruh 17 karyawan Kandang dimasukkan

**Keputusan:** diterapkan pada database.

Seluruh 17 nama dari daftar JOB Kandang dimasukkan ke master `employees` sebagai FARM / Kandang.

### Keputusan D-008 — Penambahan JOB IB dan 12 karyawan

**Keputusan:** diterapkan pada database.

JOB `IB` ditambahkan pada Departemen FARM. Dua belas karyawan dari sumber dimasukkan sebagai karyawan FARM / IB dan masing-masing memperoleh empat jadwal `L` pada 7, 14, 21, dan 28 Oktober 2026.

### Keputusan D-009 — Koreksi jadwal IB dan penambahan ARIF

**Keputusan:** diterapkan pada database.

Tanggal IB dikoreksi berdasarkan sumber terbaru menjadi 4, 11, 18, dan 25 Oktober 2026. ARIF ditambahkan sebagai karyawan FARM / MEKANIK dengan jadwal L pada 1, 8, 15, dan 22 Oktober 2026.

### Keputusan D-010 — Export jadwal Excel dan PDF

**Keputusan:** diterapkan pada Web UI.

Export menjadi fitur read-only yang menggunakan hasil filter aktif. Excel dan PDF tidak mengubah data database dan dapat digunakan sebelum Authentication/CRUD selesai.

### Keputusan D-011 — Perubahan desain: L menjadi satu-satunya kode libur

**Keputusan:** diterapkan pada database dan Web UI.

`L` dan `OFF` sama-sama berarti libur pada sumber, tetapi sistem menggunakan `L` sebagai satu-satunya kode libur untuk input dan tampilan. Record lama `OFF` sudah dipindahkan ke `L`, kode `OFF` dinonaktifkan, dan Web UI menampilkan `L` jika menerima nilai `OFF` dari data lama.

---

## 10. Status Dokumen

Dokumen ini bersifat **living document**.

Setiap perubahan Production yang relevan harus ditambahkan sebagai catatan baru dengan minimal:

- tanggal;
- status;
- commit atau referensi perubahan;
- apa yang berubah;
- alasan/permasalahan;
- dampak;
- hasil verifikasi;
- keputusan.

**Tujuan utama:** menjaga agar kondisi Web UI, database, deployment, dan dokumentasi selalu menggambarkan sistem yang sama.
