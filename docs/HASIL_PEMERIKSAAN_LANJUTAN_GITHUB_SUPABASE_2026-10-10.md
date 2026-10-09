# Hasil Pemeriksaan Lanjutan GitHub–Supabase
Tanggal pemeriksaan: 2026-10-10
Project Supabase: `gmrlzkowbotnuatqwqtt`
Repository: `veriyansyah1225-debug/jadwal-karyawan-web`
Branch pemeriksaan: `chore/reconcile-supabase-migrations`

## Ringkasan

Pemeriksaan ini hanya membaca metadata, definisi katalog, dan hasil advisor; tidak melakukan perubahan pada database produksi.

### 1. Riwayat migrasi masih tidak selaras

Supabase mencatat 14 migrasi:

- `20261006102351_create_employee_schedule_and_attendance_v1`
- `20261006110922_refine_departments_and_schedule_structure`
- `20261006111631_create_schedule_view`
- `20261006154244_extend_schedule_view_with_master_job`
- `20261006230359_allow_public_read_schedule_view_data`
- `20261007052010_create_admin_users_role_table`
- `20261007054134_admin_write_employee_schedules`
- `20261007055212_allow_authenticated_read_public_schedule_data`
- `20261007104601_add_employee_master_fields_and_admin_policies`
- `20261007104705_add_employee_updated_at_trigger`
- `20261007142059_security_hardening_admin_rpc_and_policies`
- `20261007223352_add_user_profile_email_for_admin_management`
- `20261009114906_atomic_monthly_schedule_save`
- `20261009115514_protect_job_assignment_on_monthly_schedule_upsert`

Folder `supabase/migrations/` pada branch pemeriksaan masih hanya menampilkan satu file: `20261008052500_add_user_profile_email_for_admin_management.sql`. Timestamp file tersebut juga berbeda dari versi yang tercatat di database. Karena itu, repository belum dapat mereproduksi database dari riwayat migrasi yang tersedia.

## 2. Inventaris tabel dan jumlah baris

| Tabel | Baris |
|---|---:|
| departments | 2 |
| jobs | 11 |
| employees | 58 |
| schedule_codes | 6 |
| employee_schedules | 586 |
| attendance_records | 0 |
| employee_position_history | 0 |
| user_profiles | 2 |
| user_access_scopes | 1 |
| admin_users | 1 |

View `public.v_jadwal_karyawan` juga tersedia.

Catatan: angka di atas adalah hitungan saat pemeriksaan, bukan jaminan backup. Jangan gunakan jumlah baris saja sebagai validasi integritas penuh.

## 3. Definisi penting yang berhasil diperiksa

- View `v_jadwal_karyawan` menggabungkan jadwal, karyawan, departemen, master pekerjaan, dan kode jadwal.
- `employee_schedules` memiliki unique index pada `(employee_id, tanggal)`.
- Fungsi `save_employee_monthly_schedule` memvalidasi bahwa pemanggil adalah admin aktif, memvalidasi rentang bulan dan baris payload, serta menolak benturan dengan tanggal yang sudah memiliki penugasan pekerjaan.
- Fungsi `transfer_employee_position` adalah `SECURITY DEFINER` dan melakukan pemeriksaan admin di dalam fungsi.
- Terdapat trigger pembaruan `updated_at` untuk tabel `employees` dan `employee_position_history`.
- Beberapa indeks terlihat tumpang tindih, termasuk indeks pada pasangan kolom yang sama di `employee_schedules` dan `employees`. Jangan menghapus indeks sebelum memastikan pemakaian query dan constraint.

Snapshot katalog bukan pengganti dump penuh yang dibuat oleh Supabase CLI; khususnya, output konektor dapat tidak mencakup seluruh detail role/grant, konfigurasi Auth, extension dependency, dan objek internal.

## 4. Temuan Security Advisor

1. **INFO — RLS aktif tanpa policy pada `public.attendance_records`.** Saat ini tabel tersebut memiliki 0 baris, tetapi akses tetap harus dirancang sebelum fitur absensi dipakai. Tentukan role yang boleh membaca/menulis; jangan menambahkan policy terbuka hanya untuk menghilangkan peringatan.
   Dokumentasi: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

2. **WARN — extension `btree_gist` berada di schema `public`.** Periksa dependency dan prosedur pemindahan extension sebelum perubahan. Jangan memindahkan extension langsung di produksi tanpa uji.
   Dokumentasi: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

3. **WARN — dua fungsi `SECURITY DEFINER` dapat dipanggil role `authenticated`:**
   - `save_employee_monthly_schedule(bigint, date, date, jsonb)`
   - `transfer_employee_position(bigint, bigint, bigint, date, text)`

   Kedua fungsi yang diperiksa memiliki pemeriksaan admin di dalam body. Namun, tetap perlu menilai kebutuhan pemanggilan RPC, privilege `EXECUTE`, dan pengujian akses sebagai admin/non-admin sebelum memutuskan revoke atau perubahan mode keamanan.
   Dokumentasi: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

4. **WARN — perlindungan kata sandi yang bocor belum aktif** di konfigurasi Supabase Auth. Ini pengaturan Auth dashboard, bukan migrasi SQL.
   Dokumentasi: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 5. Rencana aman berikutnya

1. Ambil backup/dump schema dari project yang benar dengan Supabase CLI yang sudah terautentikasi.
2. Simpan salinan lokal yang aman; jangan commit data karyawan, dump data, kredensial, atau secret ke GitHub.
3. Jalankan `supabase migration list` dan `supabase db pull` dari working copy bersih. Tinjau hasil generated migration; jangan menganggap hasilnya otomatis benar.
4. Bandingkan definisi tabel, constraints, indexes, policies, grants, triggers, functions, views, dan extensions dengan objek produksi.
5. Susun baseline/riwayat migrasi yang dapat diuji pada database pengembangan terisolasi terlebih dahulu.
6. Baru setelah pengujian dan backup diverifikasi, buat pull request untuk perubahan repository. Jangan menjalankan `db reset --linked`, migration repair, atau migrasi destruktif terhadap produksi sebagai langkah rekonsiliasi awal.

## Status

- Pemeriksaan metadata dan katalog: selesai sebagian.
- Rekonsiliasi migrasi: belum selesai.
- Baseline lengkap yang dapat membangun ulang schema: belum dibuat.
- Perubahan produksi: tidak dilakukan.
