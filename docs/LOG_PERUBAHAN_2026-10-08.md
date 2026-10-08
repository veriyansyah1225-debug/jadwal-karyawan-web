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

## Commit Perubahan

Perbaikan utama callback invitation tercatat pada commit:

```text
66d85766a77947449841179f2467b81be3496f11
```

Perubahan tersebut berada pada:

```text
src/App.jsx
```

---

## Dampak Perubahan

### Sebelum

User dapat menerima email invitation tetapi gagal masuk ke tahap aktivasi/password creation karena Web UI dapat mengarahkan kembali ke halaman login.

### Sesudah

Web UI mengenali callback invitation dengan benar dan dapat melanjutkan user ke halaman:

**Aktifkan Akun Anda**

User kemudian dapat membuat password dan melakukan login.

### Klasifikasi

**Medium — Functional / Authentication Flow Bug**

Perubahan ini bukan perbaikan terhadap vulnerability database.

Tidak ditemukan bukti bahwa masalah tersebut menyebabkan:

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
- login kembali.

---

## Catatan Audit

Perubahan ini merupakan **perbaikan aktual pada Web UI**, sedangkan hasil audit database sebelumnya tidak memerlukan perubahan database.

Dengan demikian, untuk perubahan yang tercatat pada 8 Oktober 2026:

```text
Database changes : 0
Web UI changes   : 1 area
File changed     : src/App.jsx
Main issue       : Invitation callback recognition
Status           : Fixed and Retested
```

Dokumen ini dibuat sebagai log perubahan agar riwayat perbaikan dapat ditelusuri dari repository.
