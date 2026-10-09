# Audit Awal Rekonsiliasi GitHub–Supabase — Jadwal Karyawan

Tanggal audit: 2026-10-09
Status: audit awal berbasis konektor; belum menyatakan seluruh schema drift selesai diperiksa.

## 1. Cakupan

Repository: `veriyansyah1225-debug/jadwal-karyawan-web`
Branch utama: `main`
Supabase project: `database-jadwal-karyawan`
Project ref: `gmrlzkowbotnuatqwqtt`
Frontend saat ini: React 19, Vite 7, Supabase JS
Prototype desain baseline: `prototype/index-v2.html`

Referensi:
- README.md
- docs/Dokumentasi_Progres_Web_UI_Jadwal_Karyawan.md
- docs/Dokumentasi_Keamanan_Database_dan_Integrasi_ReadOnly.md
- docs/Dokumentasi_Perubahan_dan_Audit_Web_UI.md
- docs/LOG_PERUBAHAN_2026-10-08.md

## 2. Temuan kritis

### 2.1 Ketidaksesuaian migration GitHub dengan history remote

Daftar migration remote dari `supabase_migrations.schema_migrations`/Supabase migration tool berisi 14 versi berikut:

- 20261006102351 create_employee_schedule_and_attendance_v1
- 20261006110922 refine_departments_and_schedule_structure
- 20261006111631 create_schedule_view
- 20261006154244 extend_schedule_view_with_master_job
- 20261006230359 allow_public_read_schedule_view_data
- 20261007052010 create_admin_users_role_table
- 20261007054134 admin_write_employee_schedules
- 20261007055212 allow_authenticated_read_public_schedule_data
- 20261007104601 add_employee_master_fields_and_admin_policies
- 20261007104705 add_employee_updated_at_trigger
- 20261007142059 security_hardening_admin_rpc_and_policies
- 20261007223352 add_user_profile_email_for_admin_management
- 20261009114906 atomic_monthly_schedule_save
- 20261009115514 protect_job_assignment_on_monthly_schedule_upsert

Namun, recursive Git tree di branch `main` menunjukkan hanya satu file pada `supabase/migrations/`:
`20261008052500_add_user_profile_email_for_admin_management.sql`.

Ini adalah mismatch yang konkret. Migration 12 `add_user_profile_email_for_admin_management` juga memakai timestamp berbeda pada remote (20261007223352) dan di GitHub (20261008052500). Migration untuk 11 versi lainnya tidak terlihat di direktori tersebut di `main`.

Catatan: konektor GitHub berhasil membaca tree, README, dokumentasi, dan file migration yang terlihat; upaya membaca file migration lama melalui endpoint file menghasilkan 404. Sebelum melakukan perbaikan, daftar file harus diverifikasi kembali di repository branch yang tepat. Jangan menganggap remote history otomatis sama dengan file SQL di GitHub.

### 2.2 Snapshot tabel dan jumlah row saat audit

| Tabel | Row |
|---|---:|
| employees | 58 |
| employee_schedules | 586 |
| departments | 2 |
| jobs | 11 |
| schedule_codes | 6 |
| attendance_records | 0 |
| employee_position_history | 0 |
| user_profiles | 2 |
| user_access_scopes | 1 |
| admin_users | 1 |

Tabel dan view yang terlihat dalam schema public: 10 tabel di atas dan view `v_jadwal_karyawan`.

Jumlah data dapat berubah karena aplikasi operasional berjalan.

### 2.3 Objek database lain yang diketahui

- RLS aktif di semua sepuluh tabel yang diperiksa.
- View `public.v_jadwal_karyawan` tersedia.
- Function `save_employee_monthly_schedule(p_employee_id bigint, p_month_start date, p_month_end date, p_rows jsonb)` adalah SECURITY DEFINER dan dapat dieksekusi oleh authenticated/service_role.
- Function `transfer_employee_position(p_employee_id bigint, p_department_id bigint, p_job_id bigint, p_tanggal_efektif date, p_keterangan text)` adalah SECURITY DEFINER dan dapat dieksekusi oleh authenticated/service_role.
- Extension `btree_gist` berada di schema public.
- Unique index `employee_schedules_employee_date_unique` ada; beberapa index employee_schedules tampak duplikat.
- Edge Functions aktif: `admin-create-user` (v2), `admin-resend-user-invite` (v2), `admin-delete-user` (v1), semuanya `verify_jwt=true`.

## 3. Advisor findings untuk ditindaklanjuti (belum diperbaiki)

Security Advisor:
1. RLS pada `attendance_records` aktif tanpa policy. Ini bisa disengaja karena modul absensi belum aktif; jangan menambahkan policy sebelum akses absensi disepakati.
2. Dua function SECURITY DEFINER di schema public dapat dieksekusi oleh authenticated. Perlu review isi function dan maksud akses terlebih dahulu, bukan mencabut akses secara membabi buta.
3. Leaked password protection Supabase Auth nonaktif; tinjau pengaturan Auth.
4. Extension `btree_gist` pada schema public perlu ditinjau.

Performance Advisor:
1. FK `employee_schedules.schedule_code_id` belum memiliki covering index.
2. Terdapat beberapa index potensial duplikat pada `employee_schedules` dan `employees`.
3. Ada advisory RLS initplan serta multiple permissive policies pada `user_profiles` dan `user_access_scopes`.
4. Beberapa index belum terpakai menurut statistik; jangan menghapus index sebelum workload dan constraint ditinjau.

## 4. Keputusan aman sementara

- Tidak menghapus atau mengubah data operasional.
- Tidak menjalankan `db reset`, `db push`, atau destructive DDL di project utama selama rekonsiliasi.
- Tidak membuat migration baseline lalu menjalankannya terhadap production sebelum hasil dump/schema dibandingkan.
- Database remote tetap menjadi sumber fakta saat ini; GitHub perlu dipulihkan menjadi riwayat migration yang dapat direproduksi.
- UI baru dibuat pada branch/repository terpisah setelah baseline dan aturan migration jelas.
- Simpan data produksi di luar source control; gunakan seed sintetis untuk dev/test.

## 5. Rencana berikut

1. Ambil schema dump remote yang direview secara aman dan bandingkan objek tabel, view, policy, function, trigger, index, grant, dan extension dengan file SQL yang tersedia.
2. Rekonstruksi SQL migration yang hilang dari dokumentasi/riwayat perubahan atau ambil schema baseline lengkap. Tandai baseline remote sebagai sudah diterapkan dengan prosedur resmi—jangan reapply ke database yang ada.
3. Audit function SECURITY DEFINER dan RLS; pertahankan perilaku bisnis sambil menutup celah yang tervalidasi melalui migration baru.
4. Buat branch development dan uji recreate database dari migration + seed sintetis.
5. Baru mulai pembangunan UI baru berdasarkan prototype v2.

## 6. Catatan tentang angka karyawan/jadwal

Dokumentasi progres lama menyebut 60 karyawan dan 522 jadwal, sedangkan snapshot database saat audit menunjukkan 58 karyawan dan 586 jadwal. Angka historis tersebut kemungkinan berasal dari waktu audit yang berbeda atau perubahan data. Ini perlu diperlakukan sebagai discrepancy yang harus dijelaskan, bukan langsung dianggap sebagai kehilangan/korupsi data.
