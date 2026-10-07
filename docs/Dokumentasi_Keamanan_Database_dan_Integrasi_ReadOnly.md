# Dokumentasi Keamanan Database & Integrasi Read-Only — Jadwal Karyawan

**Status:** Aktif / Living Document  
**Tanggal:** 2026-10-07  
**Repository:** `veriyansyah1225-debug/jadwal-karyawan-web`  
**Database:** `database-jadwal-karyawan` / PostgreSQL 17 / Supabase

---

## 1. Tujuan

Dokumen ini mencatat pekerjaan yang telah dilakukan pada sisi **database, keamanan akses, dan integrasi read-only** Web UI Jadwal Karyawan.

Dokumen ini melengkapi dokumentasi progres Web UI yang sudah ada. Fokusnya adalah perubahan yang benar-benar sudah diterapkan dan diverifikasi pada database.

Pada tahap ini sistem **belum menggunakan login pengguna dan belum menyediakan edit data dari Web UI**.

---

## 2. Kondisi Target Tahap Ini

Arsitektur yang dipilih untuk tahap awal:

```
Pengguna tanpa login
        |
        v
     Web UI
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

Hak akses publik pada tahap ini hanya untuk **membaca data jadwal**.

Belum ada akses publik untuk:

- INSERT
- UPDATE
- DELETE

Login, role Admin/User, dan pengelolaan data melalui Web UI ditunda sampai pondasi sistem lebih stabil.

---

## 3. Perubahan Keamanan View

### 3.1 View yang digunakan

Web UI menggunakan:

`public.v_jadwal_karyawan`

View ini menjadi sumber data jadwal yang dibaca oleh frontend.

### 3.2 Security Invoker

Pada 2026-10-07, konfigurasi View diubah menjadi:

```sql
ALTER VIEW public.v_jadwal_karyawan
SET (security_invoker = true);
```

Perubahan tersebut dijalankan melalui Supabase SQL Editor dan kemudian diverifikasi langsung ke database.

Hasil verifikasi:

```
v_jadwal_karyawan
security_invoker = true
```

### 3.3 Tujuan

`security_invoker = true` memastikan akses melalui View mengikuti hak akses dan RLS dari user yang sedang mengakses, bukan hanya hak akses pemilik View.

Perubahan ini **tidak mengubah isi data jadwal**.

---

## 4. RLS pada Tabel Database

RLS telah aktif pada tabel:

| Tabel | RLS |
|---|---:|
| departments | Aktif |
| employees | Aktif |
| jobs | Aktif |
| schedule_codes | Aktif |
| employee_schedules | Aktif |
| attendance_records | Aktif |

Untuk kebutuhan Web UI read-only saat ini, policy SELECT dibuat pada lima tabel yang menjadi sumber data jadwal:

- `departments`
- `employees`
- `jobs`
- `schedule_codes`
- `employee_schedules`

Policy tersebut diberikan kepada role:

`anon`

dengan operasi:

`SELECT`

dan kondisi baca:

`using (true)`

Artinya pengguna tanpa login dapat membaca data yang diperlukan untuk menampilkan jadwal.

---

## 5. Hak Akses Saat Ini

Model akses tahap awal:

| Operasi | Pengguna tanpa login |
|---|---:|
| Melihat jadwal | Ya |
| Membaca data master yang diperlukan View | Ya |
| Menambah jadwal | Tidak |
| Mengubah jadwal | Tidak |
| Menghapus jadwal | Tidak |
| Login | Belum digunakan |
| Role Admin | Belum dibuat |

Kebijakan ini sengaja dibuat sederhana untuk tahap stabilisasi awal.

---

## 6. Verifikasi Integrasi Web

Setelah policy read-only diterapkan, Web UI berhasil membaca data aktual dari Supabase/PostgreSQL.

Pengujian browser menunjukkan:

- halaman Jadwal Karyawan dapat dibuka;
- sumber data ditampilkan sebagai `Supabase / v_jadwal_karyawan`;
- data jadwal aktual tampil;
- filter periode dapat digunakan;
- data departemen dan JOB tampil;
- tabel jadwal berhasil dibentuk dari data database.

Contoh validasi dilakukan terhadap karyawan **Ahmadi**, Departemen FARM, periode 1–15 Oktober 2026.

Data yang tampil di Web UI sesuai dengan data pada `v_jadwal_karyawan`, termasuk kode:

```
1  M
2  S
3  S
4  OFF
5  M
6  M
7  M
8  S
9  OFF
10 M
11 M
12 M
13 S
14 S
15 M
```

Dengan demikian jalur:

```
PostgreSQL
   ↓
Supabase
   ↓
v_jadwal_karyawan
   ↓
Supabase Client
   ↓
React Web UI
```

telah berhasil diverifikasi.

---

## 7. Hasil Security Advisor

Setelah RLS dan policy read-only diterapkan, Security Advisor diperiksa kembali.

Hasil saat ini hanya menyisakan satu informasi:

> `public.attendance_records` memiliki RLS aktif tetapi belum memiliki policy.

Hal tersebut **disengaja untuk tahap sekarang** karena modul Absensi belum digunakan dan aturan siapa yang boleh membaca/mengelola data absensi belum ditentukan.

Tidak dibuat policy asal-asalan hanya untuk menghilangkan peringatan tersebut.

---

## 8. Catatan Performance Advisor

Pemeriksaan Performance Advisor menemukan beberapa catatan:

### 8.1 Foreign key belum memiliki covering index

`employee_schedules_schedule_code_id_fkey`

belum memiliki index khusus pada kolom foreign key tersebut.

Untuk ukuran data saat ini hal ini belum dianggap sebagai hambatan operasional.

### 8.2 Duplicate index

Ditemukan dua index identik pada `employee_schedules`:

```
idx_employee_schedules_employee_date
idx_employee_schedules_employee_tanggal
```

Salah satunya dapat dirapikan pada tahap optimasi berikutnya.

### 8.3 Unused index

Beberapa index saat ini belum terpakai menurut statistik Advisor.

Index tersebut **belum dihapus**, karena proyek masih dalam tahap awal dan pola query dapat berubah.

Keputusan saat ini: **jangan melakukan optimasi index hanya untuk menghilangkan warning** sebelum kebutuhan query lebih stabil.

---

## 9. Data Tidak Diubah oleh Perubahan Keamanan

Perubahan yang dilakukan pada tahap ini adalah konfigurasi keamanan dan policy.

Tidak dilakukan perubahan terhadap:

- nama karyawan;
- departemen;
- JOB;
- kode jadwal;
- tanggal jadwal;
- isi record jadwal.

Database tetap menggunakan data jadwal yang sudah ada.

---

## 10. Keputusan Pengembangan

Untuk tahap sekarang diputuskan:

### Tidak membuat login dulu

Web dapat dibuka tanpa login agar proses validasi tampilan dan pembacaan jadwal lebih sederhana.

### Tidak membuat edit dari Web UI dulu

Admin belum diberi fitur:

- tambah jadwal;
- edit jadwal;
- hapus jadwal;
- edit karyawan;
- edit JOB.

Fitur tersebut akan dirancang setelah pondasi database dan Web UI lebih stabil.

### Pondasi RLS Admin mulai dibuat

Authentication dan role Admin mulai dikembangkan. Tabel `public.admin_users` sudah dibuat dengan RLS: user authenticated hanya dapat membaca role miliknya sendiri yang aktif. Hak insert/update/delete terhadap tabel role tidak diberikan kepada client.

---

## 11. Status Tahap Database Saat Ini

| Pekerjaan | Status |
|---|---:|
| Struktur database jadwal | Selesai untuk tahap saat ini |
| View `v_jadwal_karyawan` | Selesai |
| `security_invoker=true` | Selesai & terverifikasi |
| RLS tabel utama | Aktif |
| Policy read-only jadwal | Selesai |
| Akses Web UI ke database | Berhasil |
| Verifikasi data Web vs database | Berhasil |
| Login | Pondasi mulai diterapkan |
| Admin CRUD | Belum dimulai |
| RLS final Admin/User | Bertahap; role Admin sudah memiliki pondasi |
| Modul Absensi | Ditunda |
| Optimasi index | Ditunda |

---

## 12. Langkah Berikutnya

Setelah tahap database read-only ini selesai, fokus pengembangan berpindah ke **stabilisasi Web UI**.

Urutan besar yang disepakati:

1. Stabilisasi Web UI dan integrasi data.
2. Validasi aturan bisnis jadwal.
3. Penyempurnaan database/view jika memang diperlukan.
4. Authentication dan Login Admin.
5. RLS final berdasarkan role.
6. Admin CRUD jadwal.
7. Master data.
8. Modul Absensi.
9. Laporan dan export.
10. Audit dan operasional.

Tidak ada kebutuhan untuk membongkar konfigurasi read-only yang sudah dibuat ketika fitur Admin ditambahkan nanti. Policy dan role dapat diperluas sesuai desain authentication/RLS yang disepakati.

---

## 13. Catatan Keamanan

Repository Web UI dapat berisi konfigurasi frontend seperti Supabase URL dan publishable/anon key.

Yang **tidak boleh** dimasukkan ke repository atau frontend:

- service-role key;
- secret key;
- password database;
- credential pribadi;
- token rahasia.

Publishable/anon key **bukan pengganti RLS**. Keamanan data tetap bergantung pada policy RLS yang benar.

---

## 14. Ringkasan Milestone

**Milestone:** Database Read-Only + Web UI Integration

**Status:** Selesai untuk tahap awal.

Sistem sekarang sudah memiliki fondasi:

```
PostgreSQL
    ↓
Supabase
    ↓
RLS Read-Only
    ↓
v_jadwal_karyawan
    ↓
React Web UI
    ↓
Pengguna dapat melihat jadwal
```

Fitur perubahan data dan authentication sengaja belum dibangun agar pondasi sistem dapat divalidasi terlebih dahulu.

## 15. Perluasan RLS untuk Admin

Pada 2026-10-07, sistem mulai beralih dari read-only murni ke model **publik read-only + Admin write**.

### 15.1 Policy employee_schedules

`public.employee_schedules` sekarang memiliki policy:

| Policy | Role | Operasi |
|---|---|---|
| `anon_read_employee_schedules` | anon | SELECT |
| `admin_insert_employee_schedules` | authenticated | INSERT |
| `admin_update_employee_schedules` | authenticated | UPDATE |
| `admin_delete_employee_schedules` | authenticated | DELETE |

Policy write hanya mengizinkan user authenticated yang memiliki record aktif dengan `role = 'admin'` pada `public.admin_users`.

### 15.2 Unique jadwal per karyawan per tanggal

Database sudah memiliki unique index:

`employee_schedules_employee_date_unique`

pada:

`(employee_id, tanggal)`

Tujuannya menjaga aturan dasar bahwa satu karyawan memiliki paling banyak satu record jadwal pada satu tanggal.

### 15.3 Status keamanan

Model akses saat ini menjadi:
- pengguna publik: membaca jadwal;
- Admin terautentikasi: dapat menulis jadwal;
- akun authenticated biasa yang tidak terdaftar sebagai Admin: tidak memperoleh policy write;
- `admin_users` tetap tidak dapat ditulis oleh client.

Pengujian end-to-end penyimpanan dari browser masih menjadi langkah verifikasi berikutnya.
