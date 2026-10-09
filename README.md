# Jadwal Karyawan Web

Web UI **Jadwal Karyawan** berbasis React, Vite, dan Supabase/PostgreSQL.

## Status aplikasi

- Prototype UI v1 dan v2 tersedia; prototype dipertahankan sebagai arsip desain.
- Frontend React/Vite aktif dikembangkan.
- Integrasi baca jadwal menggunakan view `public.v_jadwal_karyawan`.
- Login Admin tersedia pada aplikasi.
- Pengelolaan master karyawan dan input/edit jadwal untuk Admin telah diimplementasikan; verifikasi perilaku dan hak akses tetap perlu dilakukan sebagai bagian dari pengujian.
- Edge Functions untuk pengelolaan akun Admin tersedia di repository.
- Modul absensi dan beberapa kebutuhan laporan/audit lanjutan belum dianggap selesai.
- Deployment yang dicatat saat ini: https://jadwal-karyawan-web.vercel.app

## Struktur utama

```
.
├── docs/                  # Dokumentasi progres, keamanan, audit, dan rekonsiliasi
├── prototype/             # Referensi desain UI
├── src/                   # Aplikasi React/Vite
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/       # SQL migration yang tersimpan di Git
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

## Menjalankan secara lokal

1. Install Node.js.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` menggunakan nilai proyek yang sesuai.
5. Jalankan `npm run dev`.

Gunakan data demo hanya untuk pengembangan bila environment Supabase belum tersedia.

## Arsitektur ringkas

Browser menjalankan React/Vite dan memakai Supabase Client. Pembacaan jadwal memanfaatkan `public.v_jadwal_karyawan`. Aksi Admin menggunakan jalur database dan Edge Functions yang ditujukan untuk kebutuhan administrasi. Detail otorisasi tetap ditentukan oleh Auth, RLS, policy, grants, dan validasi server/database—bukan oleh tampilan frontend saja.

## Rekonsiliasi GitHub–Supabase

**Status penting per 2026-10-09:** migration history Supabase berisi 14 entri, sedangkan pada `supabase/migrations/` di GitHub hanya satu file migration yang berhasil diverifikasi. Karena itu, folder migration Git saat ini belum cukup untuk membangun ulang keseluruhan database.

- Jangan jalankan reset atau replay migration dari repo saat ini terhadap project produksi.
- Rencana rekonsiliasi dan catatan pemeriksaan ditempatkan pada branch `chore/database-reconciliation`.
- Langkah berikutnya adalah mengambil schema-only dump yang tepercaya, melengkapi inventaris objek database, menyusun baseline migration di branch kerja, lalu menguji rebuild pada lingkungan non-produksi.
- Jangan menaruh dump data produksi, data pribadi karyawan, credential, database password, service-role key, atau secret ke repository publik.

Dokumen terkait:
- [Rencana Rekonsiliasi Database](docs/RENCANA_REKONSILIASI_DATABASE.md)
- [Audit Awal GitHub–Supabase](docs/AUDIT_AWAL_REKONSILIASI_GITHUB_SUPABASE_2026-10-09.md)
- [Pemeriksaan Lanjutan Supabase](docs/PEMERIKSAAN_LANJUTAN_SUPABASE_2026-10-09.md)
- [Analisis Sumber Migration dan Ketidaksinkronan Dokumentasi](docs/ANALISIS_SUMBER_MIGRATION_DAN_KETIDAKSINKRONAN_2026-10-09.md)

## Keamanan repository

Repository bersifat publik. Jangan commit file `.env.local`, service-role/secret key, password database, token rahasia, dump data produksi, ataupun data personal yang tidak diperlukan.

Publishable/anon key bukan pengganti RLS. Tabel pada schema yang diekspos tetap perlu hak akses dan policy yang sesuai.

## Catatan dokumentasi

Dokumen progres dan audit lama mungkin merekam tahapan historis yang statusnya telah berubah. Untuk keputusan rekonsiliasi, gunakan temuan audit terbaru dan verifikasi langsung ke Supabase. Perbedaan antara dokumentasi historis dan kondisi aktual harus dicatat lalu diperbaiki secara bertahap, bukan diasumsikan otomatis.
