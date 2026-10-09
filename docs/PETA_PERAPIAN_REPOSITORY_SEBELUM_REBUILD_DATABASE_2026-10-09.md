# Peta Perapian Repository sebelum Rebuild Database
Tanggal pemeriksaan: 2026-10-09
Branch kerja: `chore/database-reconciliation`

## Jawaban dan batas pekerjaan
Ya, repository GitHub perlu dirapikan lebih dulu pada sisi **dokumentasi, migration source, konfigurasi proyek, dan penandaan status**. Namun GitHub bukan sumber data operasional karyawan. Data aktual tetap berada di Supabase dan tidak boleh disalin ke repository publik untuk sekadar membuat repo tampak lengkap.

Perapian awal harus bersifat non-destruktif: tidak menghapus aplikasi/prototype atau dokumen historis secara massal, tidak mengubah database produksi, dan tidak memasukkan dump produksi yang berisi data pribadi.

## Temuan yang sudah diverifikasi

1. Repository publik: `veriyansyah1225-debug/jadwal-karyawan-web`; branch utama `main`.
2. Branch kerja rekonsiliasi tersedia: `chore/database-reconciliation`.
3. Stack yang dinyatakan `package.json`: React 19, Vite 7, `@supabase/supabase-js`, jsPDF, dan xlsx-js-style.
4. `supabase/functions/` berisi fungsi administrasi; audit Supabase mencatat tiga Edge Functions aktif dengan `verify_jwt=true`. Cocokkan nama dan versi deploy dengan source sebelum mengubah atau menghapus apa pun.
5. `supabase/migrations/` pada branch `main` hanya memuat satu file: `20261008052500_add_user_profile_email_for_admin_management.sql`.
6. Migration history Supabase yang diperiksa memiliki 14 entri. Artinya migration source di Git belum merupakan rangkaian lengkap.
7. README lama berisi paragraf yang saling tidak konsisten tentang read-only, login, dan aksi Admin. README pada branch kerja telah diperbarui untuk menyatakan status dengan lebih hati-hati dan menjelaskan batas rekonstruksi.
8. Audit sebelumnya mendapati 10 tabel aplikasi dengan RLS aktif, view `public.v_jadwal_karyawan`, fungsi database untuk penyimpanan jadwal bulanan/perpindahan posisi, serta temuan Security/Performance Advisor. Detailnya ada di dokumen pemeriksaan Supabase.

## Urutan perapian yang disarankan

### P0 — Hindari kebocoran atau perubahan tak sengaja
- Periksa isi repository dan riwayat commit untuk memastikan tidak ada service-role/secret key, password, token, atau dump data personal.
- Pertahankan `.env.local`, `.env.*.local`, `node_modules/`, dan `dist/` di `.gitignore`; pastikan `.env.example` hanya berisi placeholder.
- Jangan commit data karyawan atau dump produksi ke repository publik.

### P1 — Buat satu sumber dokumentasi status
- README menjadi pintu masuk yang menyebut status saat ini dan link dokumentasi penting.
- Dokumen audit historis tetap disimpan; jangan menghapus catatan lama untuk menutupi perubahan.
- Tandai dengan jelas mana kondisi yang diverifikasi, mana snapshot tanggal tertentu, dan mana yang belum diverifikasi.
- Hindari mengubah dokumen progres besar sekaligus sebelum isinya dibandingkan dengan kode dan database.

### P2 — Rapikan pengelolaan schema
- Ambil schema-only dump melalui Supabase CLI/backup tepercaya.
- Lengkapi definisi view, policy predicates, grants, index, function, trigger, extension, dan constraint.
- Buat baseline migration baru berdasarkan schema aktual yang telah diverifikasi; beri catatan jelas bahwa baseline adalah hasil rekonstruksi, bukan sejarah migration asli.
- Jangan menimpa migration lama atau melakukan replay/reset pada produksi.
- Uji migration di database kosong/non-produksi terlebih dahulu.

### P3 — Verifikasi integrasi
- Bandingkan source Edge Functions dengan fungsi dan konfigurasi yang benar-benar terdeploy.
- Jalankan build frontend dan pengujian jalur baca jadwal serta aksi Admin.
- Verifikasi RLS/authorization secara eksplisit. Jangan mengubah policy hanya untuk menghilangkan advisor warning.
- Setelah validasi, buat PR untuk review; perubahan belum boleh dianggap selesai hanya karena sudah berada di branch.

## Kriteria siap membuat baseline
Baseline baru belum siap diterapkan ke database mana pun sampai:
- dump schema berhasil diambil dan disimpan secara aman;
- semua objek yang diperlukan aplikasi telah diinventarisasi;
- tipe kolom, relasi, constraint, view, fungsi, trigger, index, RLS, policy, dan grants sudah diperiksa;
- strategi data test dan identitas Auth telah ditentukan tanpa menaruh data personal ke Git;
- migration berhasil membangun database uji kosong dan hasilnya telah diverifikasi.

## Status perubahan saat catatan ini dibuat
- README pada branch kerja diperbarui.
- Dokumen ini merupakan checklist, bukan bukti semua perapian sudah selesai.
- Tidak ada migration diterapkan ke Supabase.
- Tidak ada DDL/DML, data karyawan, policy, index, extension, atau setting Auth yang diubah.
- Tidak ada perubahan di-merge ke `main`; belum ada PR.
