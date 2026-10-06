# Jadwal Karyawan Web

Web UI untuk sistem **Jadwal & Absensi Karyawan** berbasis PostgreSQL/Supabase.

## Status

- Prototype UI v1: selesai
- Prototype UI v2: selesai dan menjadi baseline desain sementara
- Frontend React/Vite: sudah berjalan
- Supabase client: sudah terhubung
- Integrasi data: Web UI berhasil membaca `v_jadwal_karyawan`
- Database access: read-only untuk pengguna tanpa login pada tahap saat ini
- Deployment Vercel: sudah tersedia
- Authentication: belum diimplementasikan
- Input/edit jadwal: belum diimplementasikan
- Modul absensi: belum diimplementasikan
- Laporan/export: belum diimplementasikan

Dokumentasi keamanan dan integrasi read-only tersedia di:

`docs/Dokumentasi_Keamanan_Database_dan_Integrasi_ReadOnly.md`

Dokumentasi progres Web UI tersedia di:

`docs/Dokumentasi_Progres_Web_UI_Jadwal_Karyawan.md`

## Struktur

```
.
├── docs/
├── prototype/
├── src/
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

## Menjalankan Lokal

1. Install Node.js.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
5. Jalankan `npm run dev`.

Jika environment Supabase belum tersedia, aplikasi masih dapat dijalankan menggunakan data demo untuk kebutuhan pengembangan.

## Arsitektur Saat Ini

```
Browser
   |
   v
React + Vite
   |
   v
Supabase Client
   |
   v
v_jadwal_karyawan
   |
   v
PostgreSQL / Supabase
```

Pada tahap saat ini Web UI hanya membaca data jadwal. Fitur perubahan data akan dibangun setelah authentication, role, dan RLS final dirancang.

## Keamanan

Jangan commit file `.env.local` atau secret/service-role key ke repository. Repository ini bersifat publik.

Publishable/anon key bukan pengganti RLS. Policy database tetap menjadi bagian penting dari keamanan aplikasi.

## Catatan

Prototype tetap dipertahankan sebagai riwayat desain. Struktur aplikasi produksi masih dapat berubah sesuai kebutuhan operasional.
