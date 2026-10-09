# Penyimpanan Jadwal Bulanan Atomik

Tanggal: 2026-10-09  
Severity: Risiko integritas data potensial  
Status: Perubahan migration repository direkonsiliasi secara dokumentatif; pengujian end-to-end belum selesai

## Masalah awal

`handleBulkScheduleSave()` sebelumnya menghapus jadwal lama dan menyimpan jadwal baru melalui dua permintaan terpisah. Jika permintaan kedua gagal setelah penghapusan berhasil, data dapat berada dalam keadaan parsial.

## Perubahan yang dibuat

- Fungsi PostgreSQL `public.save_employee_monthly_schedule(bigint, date, date, jsonb)` sudah diterapkan di Supabase sebagai migration remote `20261009114906 atomic_monthly_schedule_save`.
- Fungsi memvalidasi admin aktif, rentang satu bulan, tanggal dan kode jadwal, duplikasi tanggal, serta konflik dengan penugasan pekerjaan.
- Penghapusan jadwal berkode yang tidak lagi diminta dan upsert jadwal baru dijalankan dalam satu transaksi database.
- Hak EXECUTE dicabut dari PUBLIC dan anon, lalu diberikan kepada authenticated. Fungsi menggunakan SECURITY DEFINER dengan search_path tetap dan pemeriksaan admin eksplisit.
- `src/App.jsx` pada branch `fix/atomic-monthly-schedule-save` diubah agar Metode 2 memanggil RPC tersebut. Perubahan frontend belum digabungkan ke `main`.
- Review lanjutan menemukan risiko pada upsert yang sebelumnya menetapkan `job_id = NULL`. Definisi fungsi aktif di Supabase dan migration lanjutan sama-sama tidak menetapkan `job_id` pada klausa `ON CONFLICT`.
- Migration lanjutan tercatat di Supabase sebagai `20261009115514 protect_job_assignment_on_monthly_schedule_upsert`.

## Rekonsiliasi migration repository

Filename migration di repository masih menggunakan timestamp berbeda dari remote migration history:
- Repository: `20261009120000_atomic_monthly_schedule_save.sql`
- Remote: `20261009114906 atomic_monthly_schedule_save`
- Repository: `20261009123000_protect_job_assignment_on_monthly_schedule_upsert.sql`
- Remote: `20261009115514 protect_job_assignment_on_monthly_schedule_upsert`

Pada 2026-10-09, dua file migration di branch ini diperbarui agar definisi SQL masing-masing mencerminkan versi fungsi yang relevan dan diberi komentar penjelas mengenai perbedaan timestamp. Commit yang dibuat:
- `07989dc5707e4afe3c99ca65a3d5f0377b97f326`: menyelaraskan migration pertama dengan fungsi yang sudah diterapkan.
- `210ac0d4000ff486bd56b4b64dc7911ac63ae537`: menyelaraskan migration lanjutan dengan fungsi tanpa penetapan `job_id = NULL`.

**Peringatan:** perubahan komentar dan isi file ini tidak mengubah remote migration history. Jangan langsung menjalankan file-file ini lagi terhadap produksi sebagai migration baru. Sebelum deployment melalui Supabase CLI, bandingkan migration lokal/remote secara lengkap dan tentukan strategi rekonsiliasi yang benar. Hindari `migration repair` atau menjalankan ulang migration terhadap produksi tanpa peninjauan eksplisit karena tindakan itu dapat mengubah metadata migration atau menjalankan DDL.

## Verifikasi

- Kedua migration tercatat pada proyek Supabase dengan versi remote yang ditunjukkan di atas.
- Definisi fungsi aktif sudah diperiksa dan tidak memiliki `job_id = NULL` pada klausa `ON CONFLICT`.
- Hak EXECUTE: authenticated = true; anon = false; PUBLIC = false.
- Jumlah data setelah pemeriksaan: 586 baris; 541 jadwal berkode; 45 penugasan pekerjaan; kombinasi job dan kode pada satu baris = 0.
- Tidak ada data jadwal yang sengaja diubah selama rangkaian pemeriksaan ini.
- Branch perbaikan memiliki 5 commit di atas `main` pada pemeriksaan terakhir; belum ada pull request.
- Build aplikasi belum dijalankan pada tahap ini dan belum ada klaim build berhasil.

## Batasan dan risiko yang masih harus diuji

- Belum dilakukan pengujian end-to-end melalui sesi admin pada aplikasi.
- Belum dibuktikan dengan runtime RPC terhadap fixture khusus bahwa seluruh payload aplikasi cocok.
- Belum dilakukan pengujian rollback dengan kegagalan yang disengaja, penolakan non-admin, pemindahan kode libur, pengosongan seluruh kode dalam bulan, konflik penugasan pekerjaan, dan regression test.
- Belum dilakukan deployment atau merge ke `main`.

## Pemulihan dan langkah aman

- Jangan merge branch ke `main` sebelum build, review, rekonsiliasi migration, dan pengujian fungsional selesai.
- Jika perlu membatalkan perubahan fungsi, gunakan perubahan SQL rollback yang ditinjau secara terpisah setelah memastikan tidak ada pemanggil aktif; jangan menghapus fungsi tanpa pemeriksaan.
- Pengujian yang mengubah data harus dibatasi pada fixture uji dengan persetujuan terpisah. Jangan memanggil RPC terhadap data produksi sebagai tes.

## Status

Definisi SQL di repository telah diselaraskan secara dokumentatif dengan perubahan yang sudah diterapkan. Metadata migration remote tetap menggunakan versi yang tercatat di Supabase. Implementasi frontend tetap pada branch terpisah. Pengujian, rekonsiliasi deployment, dan keputusan merge masih tertunda.
