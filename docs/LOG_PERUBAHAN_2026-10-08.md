# Log Perubahan Web UI — 8 Oktober 2026

## Proyek

DIVISI PERBAIKAN DATABASE

## Repository

`veriyansyah1225-debug/jadwal-karyawan-web`

## Tanggal

**8 Oktober 2026**

## Tujuan Log

Dokumen ini mencatat perubahan yang telah dilakukan pada repository sebagai bagian dari proses audit dan perbaikan sistem. Log ini berfokus pada perubahan yang benar-benar dilakukan, bukan sekadar hasil pemeriksaan atau rekomendasi.

---

## Perubahan #1 — Perbaikan Callback Invitation User

### Bagian yang diubah

**File:**
`src/App.jsx`

**Area:**
Handler `handleInviteCallback()` pada alur autentikasi/invitation.

### Masalah sebelum perubahan

Invitation dari Supabase berhasil dikirim ke email, tetapi ketika link invitation dibuka, Web UI dapat menganggap callback tersebut bukan sebagai invitation.

Format callback yang ditemukan antara lain menggunakan:

```text
/auth/v1/verify?token=...&type=invite&redirect_to=...
```

Sebelum perbaikan, pengenalan invitation di Web UI terlalu bergantung pada pola callback tertentu sehingga parameter `type=invite` pada query dapat tidak dikenali.

Akibatnya:

```text
Email Invitation
      ↓
Klik Link
      ↓
Supabase memproses callback
      ↓
Web UI tidak mengenali sebagai invitation
      ↓
Halaman Login
```

User baru kemudian tidak dapat langsung melanjutkan ke halaman pembuatan password.

### Perubahan yang dilakukan

Pengenalan invitation diperluas sehingga query parameter:

```text
type=invite
```

juga dianggap sebagai callback invitation.

Perubahan inti:

```js
const isInviteLink = Boolean(
  queryType === 'invite' ||
  code ||
  tokenHash ||
  (hashType === 'invite' && (hashAccessToken || hashRefreshToken)),
)
```

Selain itu, proses pengambilan session diberi retry singkat agar aplikasi memberi waktu kepada Supabase Auth menyelesaikan pemrosesan session setelah callback.

Retry yang ditambahkan menggunakan jeda:

```text
100 ms
300 ms
700 ms
```

Jalur callback yang sudah ada untuk `code`, `token_hash`, dan token pada fragment tetap dipertahankan.

### Bagian yang TIDAK diubah

Perubahan ini tidak mengubah:

- database;
- RLS;
- role user;
- access scope;
- policy permission;
- Edge Function;
- struktur tabel;
- business rule akses user.

Perubahan hanya dilakukan pada integrasi Web UI dengan callback Supabase Auth.

---

## Perubahan #2 — Retest Invitation

Setelah perubahan pada `src/App.jsx`, dilakukan pengujian ulang alur invitation.

Hasil:

```text
Admin invite
    ↓
Email invitation
    ↓
Klik link
    ↓
Verifikasi Supabase
    ↓
Halaman "Aktifkan Akun Anda"
    ↓
Buat password
    ↓
Login
```

**Hasil: BERHASIL**

---

## Perubahan #3 — Retest Re-Invitation Setelah Delete

Dilakukan pengujian tambahan terhadap akun testing:

```text
Akun testing dibuat
    ↓
Invitation digunakan
    ↓
Password dibuat
    ↓
Login berhasil
    ↓
Admin menghapus akun
    ↓
Email yang sama di-invite kembali
    ↓
Invitation baru diterima
    ↓
Halaman "Aktifkan Akun Anda"
    ↓
Password baru dibuat
    ↓
Login berhasil
```

**Hasil: BERHASIL**

Pengujian tersebut membuktikan bahwa email yang sebelumnya digunakan dapat digunakan kembali setelah Auth user dihapus dan invitation baru dibuat.

---

## Perubahan #4 — Perbaikan Resend Invitation Agar Tidak Menghapus Akun Terlebih Dahulu

### Bagian yang diubah

**File:**
`supabase/functions/admin-resend-user-invite/index.ts`

**Area:**
Edge Function `admin-resend-user-invite`.

### Masalah sebelum perubahan

Sebelum perbaikan, proses resend invitation melakukan urutan:

```text
Admin klik Resend
      ↓
Auth user lama dihapus
      ↓
Invite user baru dibuat
      ↓
Profile dan scope dibuat kembali
```

Masalahnya, jika pengiriman invitation baru gagal, misalnya karena:

```text
email rate limit exceeded
```

maka akun lama sudah terlanjur dihapus.

Pengujian langsung membuktikan dampaknya:

```text
Resend invitation
      ↓
Email rate limit exceeded
      ↓
Auth user hilang
      ↓
user_profiles hilang
      ↓
user_access_scopes hilang
```

Ini merupakan risiko kehilangan akun/access state yang nyata.

### Perubahan yang dilakukan

Proses resend diubah agar **tidak lagi menghapus Auth user lama**.

Bagian berikut dihapus dari alur resend:

- penghapusan Auth user lama;
- pembuatan Auth user pengganti;
- penghapusan/reinsert `user_profiles`;
- penghapusan/reinsert `user_access_scopes`.

Sekarang alurnya:

```text
Admin klik Resend
      ↓
Supabase mengirim invitation ke Auth user yang sama
      ↓
Jika gagal → akun tetap ada
      ↓
Jika berhasil → user menerima invitation baru
```

Dengan demikian, kegagalan pengiriman email tidak lagi menyebabkan akun testing/pengguna terhapus.

### Commit

Perubahan tercatat pada commit:

```text
176b2d15bb835059785e67941884cb716acb9a38
```

### Deployment

Edge Function `admin-resend-user-invite` telah dideploy ke Supabase:

```text
Function : admin-resend-user-invite
Version  : 2
Status   : ACTIVE
Verify JWT : true
```

### Retest

Setelah deployment, dibuat akun testing baru dalam kondisi:

- Auth user ada;
- `email_confirmed_at` masih NULL;
- `user_profiles` ada;
- `user_access_scopes` ada.

Admin kemudian menjalankan **Resend Invitation**.

Hasil pemeriksaan database setelah resend:

```text
Auth user        : tetap ada
Auth user ID     : tetap sama
user_profiles    : tetap ada
user_access_scopes : tetap ada
email_confirmed_at : tetap NULL
```

**Hasil: BERHASIL — akun tidak lagi terhapus ketika resend gagal/terkena email rate limit.**

### Klasifikasi

**High — Account / Access Loss Risk**

Masalah ini bukan sekadar UI error karena sebelumnya dapat menyebabkan data profil, scope akses, dan akun Auth pengguna hilang akibat kegagalan pengiriman invitation.

### Status

**CLOSED — Fixed and Retested**

---

## Commit Perubahan

Perbaikan utama callback invitation tercatat pada commit:

```text
66d85766a77947449841179f2467b81be3496f11
```

Perbaikan Edge Function resend invitation tercatat pada commit:

```text
176b2d15bb835059785e67941884cb716acb9a38
```

Perubahan tersebut berada pada:

```text
src/App.jsx
supabase/functions/admin-resend-user-invite/index.ts
```

---

## Dampak Perubahan

### Callback invitation

### Sebelum

User dapat menerima email invitation tetapi gagal masuk ke tahap aktivasi/password creation karena Web UI dapat mengarahkan kembali ke halaman login.

### Sesudah

Web UI mengenali callback invitation dengan benar dan dapat melanjutkan user ke halaman:

**Aktifkan Akun Anda**

User kemudian dapat membuat password dan melakukan login.

### Resend invitation

### Sebelum

Kegagalan pengiriman invitation baru dapat terjadi setelah Auth user lama dihapus sehingga akun dan data profile/scope dapat hilang.

### Sesudah

Resend menggunakan Auth user yang sama. Kegagalan pengiriman tidak menghapus akun, profile, atau scope akses pengguna.

---

## Catatan Rate Limit Email

Pada pengujian setelah perbaikan, ditemukan bahwa Supabase dapat mengembalikan:

```text
email rate limit exceeded
```

ketika pengiriman email invitation dilakukan terlalu sering pada project yang sama.

Ini **bukan perubahan atau bug yang diperbaiki pada aplikasi** dalam perubahan #4. Yang diperbaiki adalah dampak fatal sebelumnya: akun tidak lagi dihapus ketika pengiriman invitation gagal.

Rate limit email dicatat sebagai **batasan/temuan konfigurasi provider email** dan akan dibahas terpisah pada audit, tanpa mengubah business rule aplikasi.

---

## Klasifikasi Keseluruhan Perubahan

Perubahan callback invitation:

**Medium — Functional / Authentication Flow Bug**

Perubahan resend invitation:

**High — Account / Access Loss Risk**

Tidak ditemukan bukti bahwa perubahan tersebut menyebabkan:

- kebocoran data;
- privilege escalation;
- bypass RLS;
- unauthorized write;
- account takeover.

---

## Status

**CLOSED — Fixed and Retested**

Perbaikan telah diuji dengan:

- invitation pertama;
- pembuatan password;
- login;
- delete akun testing;
- re-invite email yang sama;
- pembuatan password baru;
- login kembali;
- resend invitation;
- pemeriksaan keberadaan Auth user setelah resend;
- pemeriksaan `user_profiles` setelah resend;
- pemeriksaan `user_access_scopes` setelah resend;
- pengujian kondisi email rate limit.

---

## Catatan Audit

Perubahan ini merupakan **perbaikan aktual pada Web UI dan Edge Function**, sedangkan hasil audit database sebelumnya tidak memerlukan perubahan struktur database.

Dengan demikian, perubahan yang tercatat pada 8 Oktober 2026:

```text
Database schema changes : 0
Web UI changes          : 1 area
Edge Function changes   : 1 area
Files changed           :
  - src/App.jsx
  - supabase/functions/admin-resend-user-invite/index.ts

Main issues:
  1. Invitation callback recognition
  2. Account loss risk during resend invitation

Status:
  Fixed and Retested
```

Dokumen ini dibuat sebagai log perubahan agar riwayat perbaikan dapat ditelusuri dari repository.
