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
