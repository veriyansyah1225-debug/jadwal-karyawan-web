# Jadwal Karyawan Web

Web UI untuk sistem **Jadwal & Absensi Karyawan** berbasis PostgreSQL/Supabase.

## Status

- Prototype UI v1: selesai
- Prototype UI v2: selesai dan menjadi baseline desain sementara
- Frontend React/Vite: fondasi awal dibuat
- Supabase client: fondasi konfigurasi dibuat
- Integrasi data: fondasi query ke `v_jadwal_karyawan` sudah disiapkan
- Authentication, input/edit jadwal, absensi, laporan, dan deployment: belum diimplementasikan

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
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` bila ingin mengaktifkan koneksi Supabase.
5. Jalankan `npm run dev`.

Jika environment Supabase belum tersedia, aplikasi tetap dapat dijalankan menggunakan data demo.

## Keamanan

Jangan commit file `.env.local` atau secret/service-role key ke repository. Repository ini bersifat publik.

## Catatan

Prototype tetap dipertahankan sebagai riwayat desain. Struktur aplikasi produksi masih dapat berubah sesuai kebutuhan operasional.
