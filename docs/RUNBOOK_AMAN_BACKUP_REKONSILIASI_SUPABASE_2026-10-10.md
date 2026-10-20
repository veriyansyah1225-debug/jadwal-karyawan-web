# Runbook Aman: Backup dan Rekonsiliasi Migrasi Supabase
Tanggal: 2026-10-10
Project ref: `gmrlzkowbotnuatqwqtt`
Repository: `veriyansyah1225-debug/jadwal-karyawan-web`
Branch: `chore/reconcile-supabase-migrations`

## Tujuan

Menghasilkan artefak backup dan bukti CLI yang dibutuhkan untuk membangun baseline migrasi yang benar tanpa mengubah data atau schema produksi pada tahap awal.

## Peringatan

- Jangan jalankan `supabase db reset --linked` atau `supabase db push` selama audit ini.
- Jangan jalankan `supabase migration repair` sebelum seluruh SQL dan status objek diverifikasi.
- `supabase db pull` dapat menawarkan untuk menulis catatan baru ke tabel riwayat migrasi remote. Pada project ini, jangan menyetujui perubahan history sebelum hasilnya ditinjau.
- Jangan unggah file dump data, password, connection string, access token, atau secret ke GitHub/chat. Simpan backup di penyimpanan privat yang terenkripsi.
- Jalankan perintah dari working copy bersih pada branch `chore/reconcile-supabase-migrations`, bukan langsung pada `main`.

## A. Siapkan working copy

Gunakan terminal komputer yang memiliki Git, Docker, dan Supabase CLI. Pastikan CLI mutakhir dan baca help versi yang terpasang:

```bash
git clone https://github.com/veriyansyah1225-debug/jadwal-karyawan-web.git
cd jadwal-karyawan-web
git fetch origin
git switch chore/reconcile-supabase-migrations
supabase --version
supabase --help
supabase db dump --help
supabase db pull --help
supabase migration list --help
```

Jika repo sudah tersedia secara lokal, gunakan `git status` dan pastikan tidak ada perubahan kerja yang belum disimpan sebelum berpindah branch.

## B. Login dan tautkan project

```bash
supabase login
supabase link --project-ref gmrlzkowbotnuatqwqtt
```

Masukkan password database hanya pada prompt resmi CLI. Jangan menaruh password langsung di perintah atau file yang akan masuk Git.

## C. Simpan metadata migrasi sebelum melakukan pull

```bash
supabase migration list
```

Simpan output terminal di lokasi privat untuk audit. Output ini membantu membandingkan timestamp lokal dan remote; ia tidak membuktikan bahwa isi SQL migrasi lokal identik dengan schema remote.

## D. Backup schema dan data secara terpisah

Buat direktori privat di luar repo, misalnya `../supabase-private-backup-2026-10-10/`. Pastikan direktori tersebut tidak disinkronkan ke GitHub.

```bash
mkdir -p ../supabase-private-backup-2026-10-10

# Dump schema yang dikelola project (tanpa data)
supabase db dump --linked -f ../supabase-private-backup-2026-10-10/schema.sql

# Dump data secara terpisah; simpan sangat privat karena berisi data karyawan
supabase db dump --linked --data-only -f ../supabase-private-backup-2026-10-10/data.sql

# Simpan definisi role bila diperlukan untuk pemulihan di project terpisah
supabase db dump --linked --role-only -f ../supabase-private-backup-2026-10-10/roles.sql
```

Periksa `supabase db dump --help` pada CLI terpasang sebelum menjalankan perintah. Dump standar mengecualikan schema yang dikelola Supabase dan tidak menyertakan data atau role secara default. Ini berarti backup tersebut bukan satu-satunya artefak yang diperlukan untuk merekonstruksi semua konfigurasi Auth/Storage.

Setelah file dibuat, catat ukuran dan checksum di lokasi privat. Jangan mengirim isi dump data ke chat. Bila backup gagal, hentikan proses rekonsiliasi dan perbaiki backup dahulu.

## E. Jangan jalankan `db pull` pada working tree ini sebelum review

Folder migrasi lokal saat ini belum mewakili 14 versi yang tercatat remote. Menjalankan `db pull` pada working tree ini dapat membandingkan schema remote dengan baseline lokal yang tidak lengkap dan menghasilkan diff yang tidak tepat untuk dijadikan sejarah migrasi.

Setelah dump dan metadata tersedia, pilihan yang lebih aman adalah:
1. membuat working copy/temp project terpisah untuk eksperimen baseline;
2. menghasilkan baseline di lingkungan lokal/terisolasi;
3. meninjau SQL hasil baseline secara manual, khususnya RLS, grants, fungsi `SECURITY DEFINER`, trigger, view, extension, dan objek pada schema Supabase-managed;
4. membuktikan bahwa baseline dapat dibangun dari database lokal kosong dan bahwa hasil schema setara dengan target;
5. baru menyepakati prosedur untuk history remote. Tidak boleh ada perubahan history remote tanpa review dan persetujuan terpisah.

## F. Artefak yang dibutuhkan untuk langkah selanjutnya

Kumpulkan hanya:
- output `supabase --version`;
- output `supabase migration list` (redaksi informasi sensitif bila ada);
- daftar nama file di `supabase/migrations/`;
- hasil sukses/gagal dari dump beserta nama file dan ukuran, bukan isi data;
- bila diperlukan, schema-only dump yang sudah diperiksa agar tidak memuat rahasia atau data.

Jangan kirim password, database URL dengan kredensial, access token, anon/service-role key, dump data, atau data pribadi karyawan.

## Referensi resmi

- Database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- CLI reference: https://supabase.com/docs/reference/cli/supabase-migration-list
- CLI workflows: https://supabase.com/docs/guides/local-development/cli-workflows
- Backup/restore CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## Status

Runbook ini hanya dokumentasi. Tidak ada backup yang dibuat dari mesin pengguna dan tidak ada perubahan schema/data/history remote yang dilakukan oleh langkah dokumentasi ini.
