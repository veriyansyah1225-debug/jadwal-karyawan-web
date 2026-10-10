# Riwayat Log Supabase (V1)

Fitur ini menampilkan hingga 100 permintaan API Supabase yang berstatus HTTP 400 atau lebih tinggi dari 24 jam terakhir. Ini adalah log teknis untuk membantu mencari input gagal; bukan audit lengkap perubahan data.

## Environment variables di Vercel

Atur di proyek Vercel V1 (jadwal-karyawan-web) untuk environment Production dan Preview yang ingin diuji:

- VITE_SUPABASE_URL: URL Supabase V1 yang sudah dipakai aplikasi.
- VITE_SUPABASE_ANON_KEY: anon/publishable key Supabase V1 yang sudah dipakai aplikasi.
- SUPABASE_PROJECT_REF: gmrlzkowbotnuatqwqtt.
- SUPABASE_ACCESS_TOKEN: token Supabase Management API dengan izin khusus baca log analytics_logs_read untuk proyek V1.

Token Management API hanya boleh disimpan sebagai environment variable server-side di Vercel. Jangan menambahkan token ke .env.example, kode browser, atau Git. Gunakan token dengan cakupan sekecil mungkin dan rotasi bila terpapar.

## Batasan

- Endpoint hanya dapat diakses pengguna yang login dengan profil aktif ber-role admin.
- Menampilkan log edge_logs yang memiliki status HTTP 400–599, maksimum 100 baris dari 24 jam terakhir.
- Pesan log yang tersedia dapat berupa pesan umum; tidak selalu memuat payload atau nilai sebelum/sesudah perubahan.
- Riwayat lama di luar rentang waktu log yang tersedia tidak ditambahkan.
- Fitur ini tidak mengubah schema database atau data jadwal.
- Setelah variabel lingkungan disimpan, deployment perlu dibuat ulang agar fungsi server membaca konfigurasi baru.


## Verifikasi PIN sebelum melihat log

Menu Riwayat Aktivitas meminta PIN numerik 6 digit setelah login Admin. Verifikasi berlaku 10 menit melalui cookie `HttpOnly`, `Secure`, dan `SameSite=Strict`; endpoint log memvalidasi cookie di server sehingga pemeriksaan tidak hanya mengandalkan UI browser.

Tambahkan environment variable **Preview saja** di Vercel:

- `RIWAYAT_LOG_PIN`: PIN numerik 6 digit. Simpan sebagai **Secret**. Jangan gunakan PIN yang sama dengan PIN/perangkat/akun lain.
- `SUPABASE_ACCESS_TOKEN` tetap sebagai **Secret**, dengan izin hanya membaca log proyek yang diperlukan.
- `SUPABASE_PROJECT_REF` dapat bertipe **Config** dan harus berisi ref proyek V1.

Setelah menambahkan atau mengubah variabel, buat deployment Preview baru. Jangan mengaktifkan fitur di Production sebelum pengujian akses selesai.

**Batasan:** pembatasan percobaan PIN saat ini menggunakan memori proses serverless sebagai pengaman best-effort; itu bukan rate limiter terdistribusi yang persisten. Sebelum Production, tambahkan pembatasan percobaan yang persisten (misalnya Vercel Firewall/layanan rate-limit) atau gunakan autentikasi faktor kedua yang dikelola terpusat. Jangan menganggap in-memory limit cukup untuk menghadapi percobaan otomatis lintas banyak instance.
