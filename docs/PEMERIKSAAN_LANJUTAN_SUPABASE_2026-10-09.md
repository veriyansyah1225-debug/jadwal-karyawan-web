# Pemeriksaan Lanjutan Supabase — 2026-10-09

Project: gmrlzkowbotnuatqwqtt
Branch: chore/database-reconciliation

## Status
Pemeriksaan dilakukan secara baca-saja. Tidak ada perubahan schema/data Supabase dan tidak ada migration yang diterapkan.

## Konfirmasi tambahan
- Extension `btree_gist` terpasang di schema `public` versi 1.7. Security Advisor menyarankan meninjau penempatan extension ini.
- Edge Functions aktif dan memerlukan JWT:
  - `admin-create-user` v2
  - `admin-resend-user-invite` v2
  - `admin-delete-user` v1
- Security Advisor menemukan `attendance_records` RLS aktif tanpa policy; perlindungan password bocor Auth nonaktif; dua fungsi SECURITY DEFINER dapat dieksekusi oleh role authenticated.
- Performance Advisor menemukan foreign key `employee_schedules.schedule_code_id` tanpa index penutup, sembilan temuan RLS initplan, beberapa index duplikat, lima index belum digunakan, dan dua kasus multiple permissive policies.

## Tindakan yang tidak dilakukan
Tidak ada policy yang ditambahkan atau dicabut, tidak ada index yang dihapus/ditambahkan, tidak ada extension yang dipindahkan, dan tidak ada pengaturan Auth yang diubah. Setiap temuan memerlukan evaluasi desain dan pengujian terlebih dahulu.

## Batas inventaris
Metadata lengkap view `v_jadwal_karyawan`, predicate semua policy, definisi semua index, serta grants belum seluruhnya dapat dikumpulkan karena beberapa query metadata terhalang safety checks konektor. Karena itu, belum dibuat baseline SQL final.

## Langkah berikut
1. Ambil schema-only dump melalui Supabase CLI atau backup tepercaya.
2. Cari sumber migration historis yang hilang dari GitHub.
3. Bandingkan dump dengan migration history dan aplikasi.
4. Uji rekonsiliasi di lingkungan non-produksi sebelum perubahan dipertimbangkan untuk produksi.
