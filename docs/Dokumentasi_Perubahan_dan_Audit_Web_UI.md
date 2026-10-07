# Dokumentasi Perubahan dan Audit Web UI — Jadwal Karyawan

**Status:** Living Document  
**Versi:** 2.5  
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

### 4.9 Penyempurnaan Format Export Excel dan PDF

**Status:** Production / Web UI diperbarui  
**Tanggal:** 2026-10-07

#### Masukan pengguna

Hasil penggunaan export menunjukkan dua masalah:

- file Excel berhasil diunduh tetapi belum memiliki format visual yang memadai;
- PDF memiliki format visual, tetapi teks dan angka terlalu kecil ketika dicetak.

#### Perubahan Web UI

Export Excel diperbarui menggunakan library yang mendukung styling cell.

Format yang ditambahkan:

- judul dan informasi Departemen/periode;
- header tabel dengan format visual;
- border tabel;
- perataan teks;
- warna sel mengikuti kode jadwal P, S, M, L, dan CT;
- lebar kolom dan tinggi baris yang lebih sesuai;
- freeze pane;
- autofilter;
- pengaturan halaman landscape untuk pencetakan.

Export PDF diperbarui dengan prinsip **memprioritaskan keterbacaan hasil cetak**, bukan memaksakan seluruh tanggal Oktober pada satu halaman.

Perubahan PDF:

- tetap menggunakan A3 landscape;
- tanggal dibagi menjadi beberapa bagian horizontal, maksimal 16 tanggal per halaman;
- ukuran teks dan tinggi baris diperbesar;
- header tanggal dan nama karyawan dibuat lebih jelas;
- informasi bagian tanggal dan nomor halaman ditambahkan;
- data karyawan tetap dipaginasi secara vertikal jika jumlah karyawan melebihi tinggi halaman.

#### Batas perubahan

Perubahan hanya menyentuh format file hasil export. Data yang diekspor, filter aktif, sumber view jadwal, dan perilaku read-only tetap sama.

#### Verifikasi

Pengguna sudah memverifikasi bahwa file Excel dan PDF dapat diunduh sebelum penyempurnaan ini. Perubahan ini ditujukan untuk memperbaiki kualitas tampilan dan keterbacaan hasil download/print.

Build lokal otomatis belum dapat diverifikasi pada lingkungan pengembangan saat perubahan ini karena akses jaringan untuk instalasi dependency tidak tersedia. Karena itu, status perubahan ini dicatat sebagai **Production code / menunggu verifikasi download-print setelah deployment** sampai hasil file baru diuji.


### 4.10 Penyesuaian Lanjutan Keterbacaan PDF

**Status:** Production code / menunggu verifikasi hasil cetak  
**Tanggal:** 2026-10-07

Berdasarkan masukan lanjutan, ukuran font PDF diperbesar kembali dan garis border tabel dibuat lebih tegas.

Perubahan:

- tinggi baris PDF dinaikkan menjadi 10 mm;
- lebar kolom JOB dan Nama Karyawan diperbesar;
- ukuran font isi dinaikkan;
- ukuran kode jadwal P/S/M/L/CT dinaikkan;
- ukuran font header tanggal dan nama karyawan dinaikkan;
- warna garis border dibuat lebih gelap;
- ketebalan garis border dinaikkan;
- lebar kolom tanggal sedikit diperbesar dengan tetap mempertahankan pembagian maksimal 16 tanggal per halaman.

Tujuan perubahan adalah agar hasil cetak A3 lebih mudah dibaca dan garis antar-kolom lebih jelas.

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

### Keputusan D-014 — PDF mengikuti ukuran kertas A4/F4\n\n**Keputusan:** diterapkan pada Web UI.\n\nExport PDF dipisahkan menjadi A4 landscape dan F4 landscape agar file yang dihasilkan dapat langsung diarahkan ke ukuran kertas tujuan tanpa bergantung pada scaling dari A3.\n\n### Keputusan D-013 — Perbesar font dan pertegas border PDF

**Keputusan:** diterapkan pada Web UI.

PDF menggunakan font yang lebih besar, baris yang lebih tinggi, dan border tabel yang lebih tegas untuk meningkatkan keterbacaan hasil cetak A3.

### Keputusan D-012 — Penyempurnaan format export Excel dan PDF

**Keputusan:** diterapkan pada Web UI.

Export harus menghasilkan file yang tidak hanya dapat dibuka, tetapi juga layak digunakan secara operasional. Excel menggunakan styling pada cell dan pengaturan halaman, sedangkan PDF menggunakan pembagian tanggal ke beberapa halaman A3 landscape agar ukuran teks lebih terbaca saat dicetak.

### Keputusan D-011 — Perubahan desain: L menjadi satu-satunya kode libur

**Keputusan:** diterapkan pada database dan Web UI.

`L` dan `OFF` sama-sama berarti libur pada sumber, tetapi sistem menggunakan `L` sebagai satu-satunya kode libur untuk input dan tampilan. Record lama `OFF` sudah dipindahkan ke `L`, kode `OFF` dinonaktifkan, dan Web UI menampilkan `L` jika menerima nilai `OFF` dari data lama.

---

### 4.12 Pengembalian PDF ke A3 untuk laporan 1–31

- Tanggal: 2026-10-07
- Status: Production code
- Commit: a50d49c5816745e85ffaa9233ab9f5fe567dfaca
- Alasan: Format A4/F4 membuat rentang 1–31 terpecah menjadi beberapa blok horizontal, sehingga tidak sesuai kebutuhan laporan.
- Keputusan: PDF kembali ke A3 landscape dan seluruh tanggal dalam rentang yang dipilih tetap berada dalam satu blok horizontal. Jika jumlah karyawan melebihi kapasitas halaman, pembagian hanya dilakukan secara vertikal.
- Keterbacaan: font tetap diperbesar dan border tetap tegas seperti penyesuaian sebelumnya.
- Verifikasi: kode sudah diterapkan pada main; hasil cetak fisik perlu diuji setelah deployment.


### 4.13 Penyederhanaan label tombol PDF

- Tanggal: 2026-10-07
- Status: Production code
- Commit: 3aeaabcf902d95970dc63f4f0b4a702357a53723
- Perubahan: label tombol export di Web UI diubah dari `PDF A3` menjadi `PDF`.
- Fungsi tetap sama: export menggunakan format A3 landscape dengan seluruh tanggal dalam rentang pada satu blok horizontal.
- Tidak ada perubahan pada data, database, atau format isi PDF.


### 4.14 Penghilangan teks informasi internal dari tampilan jadwal

- Tanggal: 2026-10-07
- Status: Production code
- Commit: 30b1620eed82ad621b94870dad7871d95565a059
- Perubahan: teks `Sumber: Supabase / v_jadwal_karyawan · Export mengikuti filter yang sedang aktif.` dihapus dari area judul jadwal.
- Perubahan: catatan `Data produksi berasal dari v_jadwal_karyawan...` di bawah tabel juga dihapus.
- Dampak: tampilan jadwal menjadi lebih ringkas; fungsi filter, tabel, export, dan sumber data tidak berubah.


### 4.15 Pondasi Authentication dan Role Admin

- Tanggal: 2026-10-07
- Status: Production code + database foundation
- Commit Web UI: 10eb9240838fd7854b5f4f25b161547e58f4abab dan cb2129fd75e02f23f3130e00d8a985655307d58e
- Commit database: migration create_admin_users_role_table
- Database: tabel public.admin_users dibuat untuk memetakan user Supabase Auth yang berhak sebagai Admin.
- Keamanan: RLS admin_users aktif; user authenticated hanya dapat membaca role miliknya sendiri yang aktif. Insert/update/delete admin_users tidak diberikan kepada anon maupun authenticated.
- Web UI: tombol Admin dan dialog Login Admin ditambahkan. Setelah login, aplikasi memeriksa role admin sebelum mempertahankan sesi sebagai Admin. Pengguna tanpa role admin langsung dikeluarkan.
- Batas tahap ini: belum ada fitur membuat/edit/menghapus jadwal. Belum ada akun Admin yang dibuat melalui tahap ini.
- Verifikasi: struktur tabel dan policy berhasil diverifikasi di PostgreSQL; build/deployment Web UI belum diverifikasi independen pada tahap ini.


### 4.16 Penempatan akses Admin di Pengaturan

- Tanggal: 2026-10-07
- Status: Production code
- Commit Web UI: 0a197f00bcd0f50c785f26e5452d7c207978aa8b dan 9326f6425ee6c300f8f01fa2d7f388d16990f9b2
- Perubahan: tombol akses Admin di area tabel dihapus.
- Perubahan: akses Admin dipindahkan ke menu **Pengaturan** pada sidebar.
- Pengaturan sekarang menampilkan status Admin dan tombol Login Admin / keluar.
- Dampak: area tabel tetap fokus pada filter, navigasi periode, export, dan jadwal.


### 4.17 Audit Integrasi Read-only setelah Login Admin

- **Tanggal:** 2026-10-07
- **Status:** Production code / perbaikan diterapkan
- **Commit Web UI:** `4e91dad3f69c5682609c1b59775e6678c8e54543` dan `d2b4852de3595b01f9f9ed307c66b573de3697f5`

#### Temuan

Setelah fitur Login Admin aktif, sesi Supabase pada browser berubah menjadi role `authenticated`. Policy SELECT yang ada pada tabel master publik dan jadwal sebelumnya hanya berlaku untuk role `anon`.

Akibatnya, ketika sesi Admin masih aktif:
- query `departments` tidak memperoleh daftar departemen;
- dropdown Departemen tampil kosong walaupun state aplikasi masih memiliki nilai `FARM`;
- query jadwal dan master data yang ikut membaca tabel dengan RLS SELECT `anon` berpotensi gagal.

Temuan ini sesuai dengan kondisi pada screenshot pengujian Web Production tanggal 2026-10-07: heading masih menunjukkan `Jadwal FARM`, tetapi dropdown Departemen tidak memiliki opsi yang dapat dipilih dan tabel menampilkan kondisi tanpa karyawan.

#### Keputusan teknis

Daripada memperluas policy SELECT database hanya untuk mengakomodasi sesi Admin, Web UI menggunakan dua Supabase Client:

1. `supabase` — client utama dengan session untuk Authentication, pemeriksaan role Admin, dan operasi tulis yang memang harus menggunakan role `authenticated`.
2. `publicSupabase` — client read-only tanpa persistensi session untuk query data publik.

Query read-only berikut dipindahkan ke `publicSupabase`:
- `departments`;
- `v_jadwal_karyawan`;
- `employees` untuk kebutuhan form Admin;
- `schedule_codes` untuk kebutuhan form Admin.

Operasi Authentication dan penyimpanan jadwal Admin tetap menggunakan `supabase` yang memiliki session.

#### Dampak keamanan

Perubahan ini mempertahankan model keamanan yang sudah diterapkan:
- data publik tetap dibaca melalui role `anon`;
- session Admin tidak digunakan untuk query publik;
- INSERT/UPDATE/DELETE `employee_schedules` tetap melewati policy RLS Admin pada role `authenticated`;
- tidak ada service-role key atau secret yang dipindahkan ke frontend.

#### Hasil

Masalah yang terlihat pada screenshot diidentifikasi sebagai konflik antara session Admin dan policy SELECT `anon`, bukan hilangnya data Departemen di PostgreSQL. Perbaikan Web UI sudah diterapkan pada `main`.

**Verifikasi Production browser masih diperlukan:** buka ulang Web Production setelah deployment terbaru dan pastikan dropdown Departemen menampilkan `FARM` dan `HATCHERY`, lalu pastikan tabel jadwal FARM kembali tampil.

### 4.19 Tampilan Bulan Tanpa Jadwal Menggunakan Master Karyawan

- **Tanggal:** 2026-10-07
- **Status:** Terverifikasi Production
- **Commit Web UI:** `39e825316f9ef42b25982d4d9a4df05ac65d7db0`

#### Masalah

Sebelumnya baris tabel dibentuk hanya dari `v_jadwal_karyawan`. Jika suatu bulan belum memiliki record jadwal sama sekali, query view menghasilkan data kosong sehingga daftar karyawan juga tidak tampil.

#### Perubahan

Web UI sekarang melakukan dua pembacaan read-only:

1. master karyawan aktif dari `employees`, termasuk Departemen dan JOB master;
2. jadwal pada rentang tanggal dari `v_jadwal_karyawan`.

Keduanya kemudian digabungkan berdasarkan `employee_id`.

Akibatnya, ketika November 2026 belum memiliki jadwal:
- seluruh karyawan aktif Departemen yang dipilih tetap tampil;
- setiap tanggal tanpa record jadwal menampilkan `—`;
- `—` tidak berarti Libur;
- `L` tetap menjadi kode Libur;
- tidak ada INSERT record kosong ke database.

#### Pertimbangan performa

Pendekatan ini tidak menambah jumlah record database. Untuk skala master saat ini, query master karyawan dan jadwal dibatasi pada kebutuhan halaman dan dilakukan secara paralel.

#### Verifikasi

Kode perubahan sudah masuk branch `main`. Deployment Vercel sempat gagal karena syntax JSX pada commit berikutnya, lalu diperbaiki pada commit `88dbb7680414851bcda54e4806898d98e69eecb2` dan deployment Production berhasil. Pengujian browser Production kemudian dikonfirmasi berhasil: bulan tanpa jadwal tetap menampilkan karyawan aktif dan sel tanpa jadwal tampil sebagai `—`.

### 10. Status Dokumen

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

**Tujuan utama:** menjaga agar kondisi Web UI, database, deployment, dan dokumentasi selalu menggambarkan sistem yang sama.\n### 4.11 Penyesuaian PDF untuk Cetak A4 dan F4\n\n- **Tanggal:** 2026-10-07\n- **Status:** Production code\n- **Commit:** `5512332402122dfbc836201589d276e54b9ac538` dan `8d48945be5c84aef09456f71b180942f67d954a6`\n- **Perubahan:** PDF tidak lagi menggunakan A3 sebagai format cetak utama. Export dipisahkan menjadi **PDF A4 landscape** dan **PDF F4 landscape**.\n- **A4:** maksimal 8 tanggal per blok horizontal.\n- **F4:** maksimal 10 tanggal per blok horizontal.\n- **Keterbacaan:** ukuran font, tinggi baris 10 mm, serta border dibuat lebih tegas agar sesuai untuk pencetakan langsung.\n- **Dampak:** jumlah halaman akan bertambah sesuai jumlah tanggal dan jumlah karyawan, tetapi setiap halaman mengikuti ukuran kertas tujuan.\n- **Verifikasi:** kode sudah diterapkan pada branch `main`; hasil cetak fisik masih perlu diverifikasi setelah deployment Vercel.\n

### 4.11 Admin Login dan Pengelolaan Jadwal — Tahap Tambah Jadwal

**Status:** Production code / menunggu uji simpan dari browser  
**Tanggal:** 2026-10-07

#### Database

Role Admin yang sebelumnya sudah dibuat kini diperluas untuk penulisan `employee_schedules`.

Policy RLS yang diterapkan pada `public.employee_schedules`:
- `admin_insert_employee_schedules` — INSERT untuk role authenticated yang terdaftar sebagai Admin aktif;
- `admin_update_employee_schedules` — UPDATE untuk Admin aktif;
- `admin_delete_employee_schedules` — DELETE untuk Admin aktif;
- policy SELECT publik tetap dipertahankan untuk kebutuhan Web UI read-only.

Database juga sudah memiliki unique index `employee_schedules_employee_date_unique` pada `(employee_id, tanggal)` untuk memastikan satu karyawan tidak memiliki lebih dari satu record jadwal pada tanggal yang sama.

#### Web UI

Setelah login Admin, menu **Pengaturan** sekarang menyediakan bagian **Pengelolaan Jadwal** dengan tombol **Tambah Jadwal**.

Form Admin tahap pertama menyediakan:
- pilihan karyawan;
- tanggal;
- kode jadwal aktif;
- keterangan opsional;
- tombol **Simpan Jadwal**.

Penyimpanan menggunakan Supabase Client dan operasi upsert pada pasangan `employee_id,tanggal`. Dengan demikian, bila tanggal yang sama sudah memiliki jadwal, data jadwal pada tanggal tersebut diperbarui, bukan membuat record duplikat.

Kode jadwal yang tersedia mengikuti master aktif, sehingga `OFF` yang sudah dinonaktifkan tidak muncul pada form.

#### Batas tahap

Tahap ini belum membuka pengelolaan master karyawan/JOB/kode jadwal dan belum menyediakan tombol hapus pada Web UI. Fitur edit visual langsung dari sel jadwal juga belum dibuat.

#### Verifikasi

- role Admin pada akun yang digunakan sudah berhasil terdeteksi oleh Web UI;
- policy INSERT/UPDATE/DELETE Admin sudah terdaftar pada `employee_schedules`;
- unique index `(employee_id,tanggal)` tersedia;
- perubahan kode Web UI sudah masuk branch `main`;
- pengujian penyimpanan record dari browser belum dilakukan pada tahap dokumentasi ini.


### 4.18 Perbaikan RLS SELECT untuk Sesi Admin

- **Tanggal:** 2026-10-07
- **Status:** Production / database diperbaiki
- **Temuan:** setelah Login Admin, role database menjadi `authenticated`. Policy SELECT data jadwal sebelumnya hanya mencakup `anon`, sehingga dropdown Departemen dan pembacaan jadwal dapat kosong walaupun data PostgreSQL tersedia.
- **Perubahan database:** policy SELECT pada `departments`, `employees`, `jobs`, `schedule_codes`, dan `employee_schedules` diperluas menjadi `anon, authenticated`.
- **Batas keamanan:** perubahan hanya untuk SELECT. INSERT/UPDATE/DELETE `employee_schedules` tetap khusus Admin aktif.
- **Verifikasi:** kelima policy SELECT sudah diverifikasi memiliki roles `{anon,authenticated}`.
- **Dampak:** tidak ada data jadwal atau master yang diubah.


### 4.20 Audit Perbaikan Build Vercel — Struktur JSX Modal Pengaturan

- **Tanggal:** 2026-10-07
- **Status:** Perbaikan diterapkan / deployment Vercel menunggu hasil
- **Commit Web UI:** `88dbb7680414851bcda54e4806898d98e69eecb2`

#### Temuan

Deployment Production pada commit `39e825316f9ef42b25982d4d9a4df05ac65d7db0` gagal dengan pesan:

`Command "npm run build" exited with 1`

Build log menunjukkan esbuild berhenti pada struktur JSX `App.jsx` sekitar baris 846. Pemeriksaan kode menemukan satu penutupan `</div>` berlebih setelah bagian **Akses Admin** pada modal **Pengaturan**.

#### Perbaikan

Struktur modal diperbaiki dengan merapikan bagian **Akses Admin** menjadi `settings-section` yang memiliki pasangan pembuka/penutup yang benar. Tidak ada perubahan pada PostgreSQL, RLS, master data, atau record jadwal.

#### Verifikasi

Commit perbaikan sudah masuk branch `main` dan Vercel sudah menerima deployment baru dengan status **Pending** saat dokumentasi ini diperbarui. Hasil build dan verifikasi browser Production masih harus dikonfirmasi.

#### Dampak

Perbaikan hanya menyentuh sintaks/struktur JSX agar proses Vite/esbuild dapat dilanjutkan. Fungsionalitas yang dirancang sebelumnya untuk menampilkan master karyawan pada bulan tanpa jadwal tidak diubah.


### 4.21 Penambahan Edit Jadwal Admin melalui Detail

- **Tanggal:** 2026-10-07
- **Status:** Implemented on main / verifikasi browser Production belum selesai
- **Commit Web UI:** `5470d004d93c646c8aed0f8f568ea854cbc6f151`
- **Commit penyegaran data setelah simpan:** `3a8271786d17ce0193ff1188f0afc30bf9a290f2`

#### Perubahan

Admin sekarang dapat membuka detail sebuah sel jadwal dan menggunakan tombol **Edit Jadwal** jika sel sudah memiliki schedule code.

Form Edit menggunakan data sel yang dipilih:
- employee;
- tanggal;
- kode jadwal;
- keterangan.

Penyimpanan tetap menggunakan operasi upsert pada unique key `employee_id,tanggal`. Setelah penyimpanan berhasil, state penyegaran memicu pembacaan ulang jadwal sehingga perubahan dapat terlihat tanpa harus mengganti periode.

Untuk sel yang belum memiliki jadwal, tombol yang sama menggunakan label **Tambah Jadwal** dan mengisi karyawan serta tanggal dari sel yang dipilih.

#### Batas

Tidak ada perubahan schema PostgreSQL atau policy RLS pada tahap ini. Tombol **Hapus Jadwal** belum ditambahkan.

#### Verifikasi

Kode sudah berada di branch `main`. Verifikasi browser Production perlu memastikan:
1. Admin dapat membuka detail sel;
2. tombol Edit Jadwal muncul pada sel yang memiliki jadwal;
3. form terisi dengan data yang benar;
4. perubahan kode/keterangan dapat disimpan;
5. tabel langsung menampilkan hasil perubahan setelah simpan.


### 4.22 Penambahan Hapus Jadwal Admin melalui Detail

- **Tanggal:** 2026-10-07
- **Status:** Implemented on main / verifikasi browser Production belum selesai
- **Commit Web UI:** `08be2601ba08933b0f51515743cc912ed8d520f4`
- **Commit styling:** `ee0caab6c988eb83c24fe62d2163881cb001cec5`

#### Perubahan

Admin sekarang dapat menghapus record jadwal langsung dari **Detail Jadwal**.

Penghapusan hanya tersedia jika sel memiliki schedule code. Sebelum DELETE dijalankan, browser meminta konfirmasi pengguna.

Operasi database:
- tabel: `employee_schedules`;
- kondisi: `employee_id` dan `tanggal`;
- menggunakan client Supabase authenticated;
- RLS DELETE Admin yang sudah ada tetap menjadi pengaman operasi.

Setelah DELETE berhasil:
- detail ditutup;
- tabel jadwal dimuat ulang;
- sel menjadi `—`;
- tidak ada record kosong yang dibuat.

#### Batas

Master karyawan, JOB, schedule_codes, dan struktur database tidak diubah. Audit/history perubahan belum tersedia.

#### Verifikasi yang diperlukan

Gunakan data uji yang sudah ada pada ARIF tanggal 4 Oktober 2026. Karena data tersebut saat ini memiliki kode `L` dan keterangan `Ganti Libur`, pengujian Hapus dapat memastikan record benar-benar hilang dan sel kembali menjadi `—`. Jika hasil pengujian menghapus data uji tersebut, jadwal ARIF tanggal 4 perlu dibuat kembali melalui fitur Tambah Jadwal untuk mengembalikan kondisi data sebelum pengujian.


### 4.23 Penempatan Tombol Hapus Langsung pada Form Edit

- **Tanggal:** 2026-10-07
- **Status:** Implemented / Vercel deployment pending
- **Commit Web UI:** `0011e1c86ca79abdee8e99a21e2b8ff3ebc755d4`

#### Temuan

Pada pengujian browser, Admin sudah dapat membuka form **Edit Jadwal**, tetapi tombol **Hapus Jadwal** tidak terlihat di dalam form tersebut.

Penyebabnya bukan kegagalan RLS atau database. Implementasi sebelumnya hanya menempatkan tombol hapus pada **Detail Jadwal**.

#### Perbaikan

Tombol **Hapus Jadwal** sekarang ditampilkan langsung di form **Edit Jadwal**.

Aturan:
- hanya muncul ketika form berada dalam mode Edit;
- tidak muncul pada form Tambah Jadwal;
- meminta konfirmasi sebelum DELETE;
- menggunakan operasi DELETE Admin yang sudah ada;
- setelah berhasil, jadwal dihapus dan tabel dimuat ulang.

#### Verifikasi

Commit sudah masuk branch `main`. Status Vercel untuk commit ini masih **Pending** dan perlu diverifikasi setelah deployment selesai.
