# Rencana Pemulihan Baseline Schema GitHub–Supabase

Tanggal: 2026-10-10
Status: **Tahap persiapan — belum ada perubahan pada database produksi**

## Lingkup

- Repository: `veriyansyah1225-debug/jadwal-karyawan-web`
- Branch kerja: `chore/reconcile-supabase-migrations`
- Branch sumber: `main`
- Supabase project ref: `gmrlzkowbotnuatqwqtt`

## Temuan terverifikasi

Remote Supabase mencatat 14 versi migrasi:

| Versi | Nama |
|---|---|
| 20261006102351 | create_employee_schedule_and_attendance_v1 |
| 20261006110922 | refine_departments_and_schedule_structure |
| 20261006111631 | create_schedule_view |
| 20261006154244 | extend_schedule_view_with_master_job |
| 20261006230359 | allow_public_read_schedule_view_data |
| 20261007052010 | create_admin_users_role_table |
| 20261007054134 | admin_write_employee_schedules |
| 20261007055212 | allow_authenticated_read_public_schedule_data |
| 20261007104601 | add_employee_master_fields_and_admin_policies |
| 20261007104705 | add_employee_updated_at_trigger |
| 20261007142059 | security_hardening_admin_rpc_and_policies |
| 20261007223352 | add_user_profile_email_for_admin_management |
| 20261009114906 | atomic_monthly_schedule_save |
| 20261009115514 | protect_job_assignment_on_monthly_schedule_upsert |

Pada branch `main`, folder `supabase/migrations/` yang terlihat hanya berisi
`20261008052500_add_user_profile_email_for_admin_management.sql`. Timestamp file ini berbeda dengan versi remote `20261007223352`.

Snapshot data saat audit:
- employees: 58
- employee_schedules: 586 (September 73, Oktober 513)
- departments: 2
- jobs: 11
- schedule_codes: 6
- attendance_records: 0
- employee_position_history: 0
- user_profiles: 2
- user_access_scopes: 1
- admin_users: 1
- view: `public.v_jadwal_karyawan`

Jumlah row bersifat dinamis dan bukan definisi schema.

## Keputusan keselamatan

1. **Jangan** menjalankan `supabase db reset --linked`, `DROP`, atau migrasi hasil rekonstruksi pada production selama rekonsiliasi.
2. **Jangan** menganggap file migrasi lama aman dijalankan ulang hanya karena remote sudah mencatat versinya.
3. Jangan memasukkan data produksi, email pengguna, kredensial, atau secret ke repository.
4. Ambil backup yang bisa dipulihkan sebelum perubahan berikutnya.
5. Baseline harus mencerminkan schema remote aktual dan diuji di project/database terpisah.

## Mengapa baseline SQL lengkap belum ditambahkan di commit ini

Konektor yang tersedia dapat membaca daftar tabel, kolom, relasi, row count, dan history migrasi, tetapi tidak memberikan dump schema lengkap yang tervalidasi untuk semua objek. Informasi tersebut belum cukup untuk menyusun baseline yang aman: definisi RLS policies, seluruh fungsi dan body-nya, trigger, index/constraint, grants, view SQL, extension, sequence, serta detail tipe/default perlu diperoleh dan dibandingkan.

Membuat file baseline dari daftar tabel saja akan menghasilkan migration yang tidak lengkap dan dapat memberi rasa aman palsu. Karena itu, branch ini hanya menyiapkan rencana pemulihan dan tidak mengubah production.

## Langkah kerja berikutnya

### A. Ambil baseline remote dengan Supabase CLI pada mesin kerja yang terotorisasi

Pastikan backup tersedia dan project ref sudah diverifikasi. Jalankan dari clone repository:

```bash
supabase login
supabase link --project-ref gmrlzkowbotnuatqwqtt
supabase migration list
supabase db pull
```

Periksa semua SQL yang dihasilkan oleh `db pull` sebelum commit. Perintah tersebut dapat menghasilkan statement yang tidak diharapkan; jangan langsung menerapkannya ke production.

### B. Rekonsiliasi history migrasi

```bash
supabase migration list
```

Bandingkan versi lokal dengan remote. Pulihkan file migrasi historis dari commit/backup yang dapat dipercaya bila tersedia. Jika tidak, gunakan baseline schema remote yang sudah diverifikasi, lalu lakukan prosedur baseline/repair resmi sesuai keadaan history. Jangan mengarang isi migrasi lama.

### C. Verifikasi di lingkungan terpisah

1. Buat project/staging database terpisah.
2. Terapkan baseline/migrasi pada database kosong.
3. Bandingkan tabel, kolom, PK/FK, constraint, index, sequence, view, fungsi, trigger, policy RLS, grants, dan extension.
4. Jalankan tes baca jadwal, simpan jadwal bulanan, pemeriksaan benturan assignment, login/invitation, dan hak akses role.
5. Baru setelah hasil lulus, sepakati rencana deployment untuk production.

### D. Alur perubahan ke depan

1. Semua perubahan schema ditulis sebagai migration file dalam repository.
2. Review SQL dan uji dari database kosong sebelum merge.
3. Terapkan ke staging dahulu.
4. Production hanya menerima migration yang sudah direview, backup tersedia, dan rencana rollback jelas.
5. Jangan melakukan perubahan schema langsung di Dashboard tanpa membuat migration yang merekam perubahan itu.

## Kriteria selesai

- [ ] Backup production telah diverifikasi dapat dipulihkan.
- [ ] Baseline remote lengkap tersedia di repository.
- [ ] Perbedaan history lokal dan remote dijelaskan dan direkonsiliasi.
- [ ] Database kosong berhasil dibangun dari repository.
- [ ] Hasil schema comparison cocok untuk objek yang masuk cakupan.
- [ ] Tes aplikasi dan hak akses lulus.
- [ ] Tidak ada perubahan data produksi yang tidak direncanakan.

## Referensi

- Supabase Database Migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase CLI db pull: https://supabase.com/docs/reference/cli/supabase-db-pull
- Supabase CLI migration list: https://supabase.com/docs/reference/cli/supabase-migration-list
- Supabase CLI migration repair: https://supabase.com/docs/reference/cli/supabase-migration-repair
