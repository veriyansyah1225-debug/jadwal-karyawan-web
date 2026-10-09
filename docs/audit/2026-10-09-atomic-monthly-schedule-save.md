# Penyimpanan Jadwal Bulanan Atomik

Tanggal: 2026-10-09  
Severity: Risiko integritas data potensial  
Status: Perbaikan SQL lanjutan diterapkan; pengujian end-to-end belum selesai

## Masalah awal

`handleBulkScheduleSave()` sebelumnya menghapus jadwal lama dan menyimpan jadwal baru melalui dua permintaan terpisah. Jika permintaan kedua gagal setelah penghapusan berhasil, data dapat berada dalam keadaan parsial.

## Perubahan yang dibuat

- Menambahkan fungsi PostgreSQL `public.save_employee_monthly_schedule(bigint, date, date, jsonb)` melalui migration `20261009120000_atomic_monthly_schedule_save.sql`.
- Fungsi memvalidasi admin aktif, rentang satu bulan, tanggal dan kode jadwal, duplikasi tanggal, serta konflik dengan penugasan pekerjaan.
- Penghapusan jadwal berkode yang tidak lagi diminta dan upsert jadwal baru dijalankan dalam satu transaksi database.
- Hak EXECUTE dicabut dari PUBLIC dan anon, lalu diberikan kepada authenticated. Fungsi menggunakan SECURITY DEFINER dengan search_path tetap dan pemeriksaan admin eksplisit.
- Mengubah `src/App.jsx` pada branch `fix/atomic-monthly-schedule-save` agar Metode 2 memanggil RPC tersebut.
- Metode input langsung per tanggal dan tampilan formulir tidak diubah.
- Review lanjutan menemukan risiko konkurensi pada klausa upsert yang sebelumnya menetapkan `job_id = NULL`. Baris itu dihapus dari definisi fungsi melalui migration `protect_job_assignment_on_monthly_schedule_upsert` (tersimpan di repository sebagai `20261009123000_protect_job_assignment_on_monthly_schedule_upsert.sql`). Jika terjadi konflik unik bersamaan, transaksi tidak lagi secara eksplisit mengosongkan `job_id` pada upsert.

## Verifikasi

- Kedua migration tercatat pada proyek Supabase.
- Definisi fungsi terkini sudah diperiksa dan tidak lagi memiliki `job_id = NULL` pada klausa `ON CONFLICT`.
- Hak EXECUTE: authenticated = true; anon = false; PUBLIC = false.
- Jumlah data setelah perubahan tetap 586 baris: 541 baris jadwal berkode dan 45 baris penugasan pekerjaan.
- Baris tidak valid = 0; duplikasi pasangan karyawan-tanggal = 0.
- Migration mengubah definisi fungsi, bukan data jadwal karyawan. Tidak ada data jadwal yang sengaja diubah selama perbaikan ini.

## Batasan dan risiko yang masih harus diuji

- Belum dilakukan pengujian end-to-end melalui sesi admin pada aplikasi.
- Perubahan `src/App.jsx` berada di branch terpisah dan belum digabungkan ke `main`; UI produksi belum menggunakan RPC dari branch ini.
- Belum dibuktikan melalui tes runtime bahwa payload `jsonb_to_recordset` dari RPC cocok dengan data aplikasi.
- Perlu menguji rollback dengan kegagalan yang disengaja di lingkungan uji, validasi hak akses non-admin, pemindahan kode libur, seluruh kolom kode kosong, konflik dengan penugasan pekerjaan, dan regression check.

## Pemulihan

- Sebelum UI branch ini digabungkan, fungsi RPC baru belum dipanggil oleh UI produksi berdasarkan perubahan aplikasi yang sedang ditinjau.
- Jika perlu membatalkan perubahan fungsi, gunakan migration rollback terpisah setelah memeriksa bahwa tidak ada pemanggil aktif. Jangan menghapus fungsi tanpa memastikan penggunaan saat ini.
- Jangan menggabungkan branch ke `main` sebelum pengujian dan review selesai.

## Status

Perbaikan SQL lanjutan diterapkan dan diverifikasi secara read-only setelahnya. Implementasi aplikasi tetap pada branch `fix/atomic-monthly-schedule-save`. Pengujian end-to-end dan keputusan merge/deploy masih tertunda.
