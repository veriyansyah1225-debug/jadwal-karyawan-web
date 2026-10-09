# Penyimpanan Jadwal Bulanan Atomik

Tanggal: 2026-10-09  
Severity: Risiko integritas data potensial  
Status: Implementasi awal; pengujian end-to-end belum selesai

## Masalah

`handleBulkScheduleSave()` sebelumnya menghapus jadwal lama dan menyimpan jadwal baru melalui dua permintaan terpisah. Jika permintaan kedua gagal setelah penghapusan berhasil, data dapat berada dalam keadaan parsial.

## Perubahan yang dibuat

- Menambahkan fungsi PostgreSQL `public.save_employee_monthly_schedule(bigint, date, date, jsonb)` melalui migration `20261009120000_atomic_monthly_schedule_save.sql`.
- Fungsi memvalidasi admin aktif, rentang satu bulan, tanggal dan kode jadwal, duplikasi tanggal, serta konflik dengan penugasan pekerjaan.
- Penghapusan jadwal berkode yang tidak lagi diminta dan upsert jadwal baru dijalankan dalam satu transaksi database.
- Hak EXECUTE dicabut dari PUBLIC dan anon, lalu diberikan kepada authenticated. Fungsi menggunakan SECURITY DEFINER dengan search_path tetap dan pemeriksaan admin eksplisit.
- Mengubah `src/App.jsx` pada branch `fix/atomic-monthly-schedule-save` agar Metode 2 memanggil RPC tersebut.
- Metode input langsung per tanggal dan tampilan formulir tidak diubah.

## Batasan dan risiko yang masih harus diuji

- Belum dilakukan pengujian end-to-end melalui sesi admin pada aplikasi.
- Perubahan `src/App.jsx` berada di branch terpisah dan belum digabungkan ke `main`; aplikasi produksi belum menggunakan RPC melalui UI.
- Fungsi menolak input tanggal yang bertabrakan dengan penugasan pekerjaan, tanpa mengubah penugasan itu.
- Perlu menguji rollback dengan kegagalan yang disengaja di lingkungan uji, validasi hak akses non-admin, pemindahan libur, seluruh kolom kosong, dan regression check.

## Verifikasi awal

- Migration berhasil diterapkan pada proyek Supabase `database-jadwal-karyawan`.
- Fungsi terdaftar dengan argumen yang diharapkan; privilege terverifikasi untuk `authenticated` dan tidak mencantumkan `PUBLIC` atau `anon`.
- Pemeriksaan jumlah data setelah migration: 586 baris, terdiri dari 541 baris berkode jadwal dan 45 baris penugasan pekerjaan. Migration hanya membuat fungsi; tidak menjalankan penyimpanan jadwal terhadap data karyawan.
- Hasil di atas bukan pengganti pengujian aplikasi end-to-end.

## Pemulihan

- Karena aplikasi belum menggunakan RPC dari branch ini, fungsi database yang ditambahkan belum dipanggil oleh UI produksi.
- Jika perlu membatalkan deployment database sebelum aplikasi memakai RPC, hapus fungsi dengan migration rollback terpisah setelah memeriksa tidak ada pemanggil aktif.
- Jangan menggabungkan branch ke `main` sebelum pengujian dan review selesai.

## Status

Implementasi awal tersimpan di branch `fix/atomic-monthly-schedule-save`. Perlu review dan pengujian sebelum merge/deploy aplikasi.
