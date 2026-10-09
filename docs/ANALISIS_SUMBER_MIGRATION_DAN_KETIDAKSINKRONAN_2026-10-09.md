# Analisis Sumber Migration dan Ketidaksinkronan Dokumentasi — 2026-10-09

## Tujuan dan batas
Analisis ini melanjutkan rekonsiliasi GitHub–Supabase. Pemeriksaan repository dilakukan pada branch `main` untuk file aplikasi/dokumentasi dan branch `chore/database-reconciliation` untuk catatan audit. Pemeriksaan database sebelumnya bersifat read-only. Dokumen ini tidak mengklaim schema dump lengkap dan tidak mengusulkan replay migration ke produksi.

## Temuan repository yang dapat diverifikasi

### 1. Rantai migration di GitHub tidak lengkap
File migration yang berhasil ditemukan pada repository adalah:

- `supabase/migrations/20261008052500_add_user_profile_email_for_admin_management.sql`

Isi migration tersebut:
- menambah kolom `email` pada `public.user_profiles` bila belum ada;
- mengisi email dari `auth.users` ketika email profil kosong;
- membuat unique index berbasis `lower(email)` untuk email non-null.

Audit Supabase mencatat 14 migration dalam tabel migration history, termasuk perubahan struktur tabel jadwal, view, role admin, policy, hardening, dan penyimpanan jadwal bulanan. File migration historis yang bersesuaian belum ditemukan dalam repository yang diperiksa. Ini adalah ketidaklengkapan sumber, bukan bukti bahwa migration tidak pernah diterapkan.

**Implikasi:** jangan membangun ulang database, menjalankan reset, atau memutar ulang migration dari direktori saat ini pada project produksi. Satu file yang ada bukan baseline lengkap.

### 2. Dokumentasi lama tidak sepenuhnya mencerminkan keadaan saat ini
README menyebut login Admin sudah tersedia dan fitur tambah/edit jadwal sudah diimplementasikan, tetapi beberapa paragraf arsitektur/keamanan di README dan dokumen progres lama masih menyatakan sistem read-only, belum login, atau fitur write belum dibangun. Dokumen keamanan juga memuat beberapa status yang berasal dari tahap sebelumnya.

Audit Supabase terbaru menunjukkan keberadaan `admin_users`, `user_profiles`, `user_access_scopes`, fungsi `save_employee_monthly_schedule` dan `transfer_employee_position`, serta Edge Functions administrasi. Dengan demikian, dokumentasi lama harus diperlakukan sebagai catatan historis dan tidak menjadi satu-satunya sumber kebenaran untuk keputusan keamanan saat ini.

### 3. Baseline aplikasi
`package.json` mengonfirmasi aplikasi React 19 + Vite 7 menggunakan `@supabase/supabase-js`. `src/lib/supabase.js` membuat client Supabase normal dan client publik terpisah dengan persistensi sesi dinonaktifkan untuk query publik. README menyebut `public.v_jadwal_karyawan` sebagai jalur baca utama. Audit read-only juga mengonfirmasi view tersebut tersedia.

### 4. Status data dan schema yang diketahui dari audit
Audit read-only terbaru mencatat 10 tabel aplikasi dengan RLS aktif. Data yang teramati saat audit: 2 departemen, 11 jobs, 58 karyawan, 6 kode jadwal, 586 record jadwal, 0 record absensi, 0 riwayat posisi, 1 admin, 2 profil user, dan 1 access scope. Angka ini adalah snapshot saat pemeriksaan, bukan jaminan jumlah data terkini.

Foreign key, constraints, fungsi SECURITY DEFINER, advisor findings, dan daftar 14 migration dirinci dalam dokumen:
`docs/PEMERIKSAAN_LANJUTAN_SUPABASE_2026-10-09.md` beserta hasil audit sebelumnya.

## Risiko yang perlu diselesaikan sebelum baseline final
1. Tidak ada schema-only dump lengkap yang berhasil diperoleh dalam sesi pemeriksaan ini.
2. Sebagian metadata view, policy predicates, index definitions, dan grants belum dapat diverifikasi penuh melalui konektor.
3. Riwayat migration Supabase lebih lengkap daripada file migration yang tersimpan di GitHub.
4. Dokumentasi progres dan README memuat status historis yang saling bertentangan.
5. Security Advisor memunculkan temuan yang perlu keputusan eksplisit; jangan otomatis mengubah policy, grants, extension, Auth setting, atau index hanya untuk menghapus warning.

## Langkah rekonsiliasi yang disarankan
1. Ambil schema-only dump dari project Supabase melalui Supabase CLI/backup tepercaya dan simpan sebagai artefak audit yang aksesnya dibatasi.
2. Dapatkan kembali file migration historis dari sumber aslinya (riwayat lokal pengembang, backup, atau repository lain yang dipercaya). Cocokkan nama, timestamp, dan isi dengan migration history Supabase.
3. Bandingkan dump dengan seluruh migration historis dan struktur yang dibutuhkan aplikasi; tandai setiap perbedaan sebagai `confirmed`, `unverified`, atau `needs decision`.
4. Uji pemulihan dan replay hanya pada project non-produksi baru yang kosong, setelah urutan migration lengkap dan sumbernya diverifikasi.
5. Setelah itu baru siapkan PR untuk mengembalikan migration historis dan memperbarui dokumentasi living document. Jangan mengubah database produksi selama rekonstruksi sumber.

## Status tindakan
- Tidak ada SQL DDL/DML dijalankan dalam langkah ini.
- Tidak ada migration diterapkan.
- Tidak ada policy, index, grants, extension, atau Auth setting yang diubah.
- Tidak ada merge atau PR dibuat.
