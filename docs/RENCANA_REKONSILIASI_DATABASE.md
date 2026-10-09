# Rencana Kerja Rekonsiliasi Database

Tanggal: 2026-10-09  
Repository: `veriyansyah1225-debug/jadwal-karyawan-web`  
Branch kerja: `chore/database-reconciliation`

## Tujuan

Merapikan dan merekonsiliasi definisi schema Supabase dengan repository GitHub tanpa mencampur pekerjaan dengan versi utama aplikasi, tanpa menghapus file lama, dan tanpa mengubah database produksi sebelum ada verifikasi serta persetujuan.

## Batas aman

- Pekerjaan rekonsiliasi dilakukan di branch ini, bukan langsung di `main`.
- File lama tidak dihapus atau ditimpa kecuali perubahan spesifik sudah diperiksa.
- File baseline schema (jika dibuat nanti) harus dipisahkan dari migration incremental yang pernah diterapkan.
- Jangan menjalankan reset database, replay migration historis, atau DDL produksi berdasarkan asumsi.
- Tidak menambahkan policy RLS atau mengubah grants sebelum kebutuhan akses dan dampaknya dikonfirmasi.
- Perubahan baru harus direview sebelum pull request digabungkan ke `main`.

## Temuan awal

1. Supabase mencatat 14 migration sampai 9 Oktober 2026, sementara repository saat ini hanya memiliki satu file di `supabase/migrations/`.
2. File migration yang tersimpan adalah `20261008052500_add_user_profile_email_for_admin_management.sql`. Commit GitHub yang memperkenalkannya adalah `cf310fc7d2447621704a204b4a1b7b05250924aa`.
3. Dua trigger terdeteksi dalam schema public:
   - `employees_set_updated_at` pada `employees`
   - `trg_employee_position_history_updated_at` pada `employee_position_history`
4. Security Advisor sebelumnya melaporkan RLS aktif tanpa policy pada `attendance_records`, perlindungan password bocor nonaktif, dan fungsi SECURITY DEFINER yang dapat dieksekusi role authenticated. Temuan ini memerlukan peninjauan desain akses, bukan perbaikan otomatis.

## Tahapan

### Tahap A — Inventaris baca-saja
- Kumpulkan definisi tabel, kolom, constraint, index, view, policy, function, trigger, grants, dan extension.
- Simpan hasil inventaris sebagai dokumentasi, bukan sebagai migration yang langsung diterapkan.
- Tandai data atau definisi yang belum dapat diverifikasi.

### Tahap B — Rekonsiliasi migration
- Telusuri commit, backup, atau sumber deployment untuk SQL historis yang hilang.
- Cocokkan urutan dan isi migration dengan migration history Supabase.
- Jangan menulis ulang migration historis berdasarkan perkiraan.

### Tahap C — Baseline terpisah
- Jika definisi schema aktual sudah cukup lengkap, buat baseline di lokasi yang jelas berbeda dari migration incremental.
- Tandai baseline sebagai belum layak bootstrap sampai diuji pada database pengembangan kosong.
- Pertahankan folder migration agar riwayat yang benar dapat dipulihkan tanpa menimpa file yang sudah ada.

### Tahap D — Review dan validasi
- Uji pada lingkungan pengembangan atau branch database terisolasi.
- Periksa schema diff, RLS, grants, fungsi, dan hasil build aplikasi bila kode aplikasi terdampak.
- Buat pull request untuk review sebelum merge ke `main`.

### Tahap E — Produksi
- Produksi hanya disentuh setelah backup yang sesuai, rencana rollback, validasi, dan persetujuan eksplisit.
- Tidak ada perubahan database produksi yang termasuk dalam pekerjaan dokumentasi ini.

## Status

- [x] Branch kerja dibuat dari `main`.
- [x] Temuan awal dicatat pada dokumen ini.
- [ ] Inventaris schema lengkap.
- [ ] Sumber migration historis direkonsiliasi.
- [ ] Baseline terpisah disusun dan diverifikasi.
- [ ] Pengujian pada lingkungan non-produksi.
- [ ] Pull request ditinjau dan disetujui.

Dokumen ini adalah rencana kerja dan catatan temuan, bukan SQL untuk diterapkan ke database.
