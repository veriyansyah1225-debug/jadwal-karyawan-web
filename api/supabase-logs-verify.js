import crypto from 'node:crypto';

const attemptsByIp = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SESSION_SECONDS = 10 * 60;

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return ip || req.headers['x-real-ip'] || 'unknown';
}

function getSignedSession(accessToken, expiryText) {
  return crypto.createHmac('sha256', accessToken).update('riwayat-log:' + expiryText).digest('hex');
}

function hasValidSession(req, accessToken) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('riwayat_log_access='));
  if (!cookie) return false;
  let value;
  try {
    value = decodeURIComponent(cookie.slice('riwayat_log_access='.length));
  } catch {
    return false;
  }
  const [expiryText, signature] = value.split('.');
  const expiry = Number(expiryText);
  if (!Number.isInteger(expiry) || expiry <= Math.floor(Date.now() / 1000) || !signature) return false;
  const expected = Buffer.from(getSignedSession(accessToken, expiryText), 'hex');
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function requireAdmin(req, res, supabaseUrl, anonKey) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Silakan login kembali.' });
    return false;
  }

  const userResponse = await fetch(supabaseUrl + '/auth/v1/user', {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + match[1] },
  });
  if (!userResponse.ok) {
    res.status(401).json({ error: 'Sesi login tidak valid atau sudah berakhir.' });
    return false;
  }

  const user = await userResponse.json();
  if (!user?.id) {
    res.status(401).json({ error: 'Pengguna tidak terverifikasi.' });
    return false;
  }

  const profileUrl = new URL(supabaseUrl + '/rest/v1/user_profiles');
  profileUrl.searchParams.set('select', 'role,aktif');
  profileUrl.searchParams.set('user_id', 'eq.' + user.id);
  profileUrl.searchParams.set('limit', '1');
  const profileResponse = await fetch(profileUrl, {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + match[1] },
  });
  if (!profileResponse.ok) {
    res.status(403).json({ error: 'Tidak dapat memverifikasi hak akses admin.' });
    return false;
  }
  const profiles = await profileResponse.json();
  if (!profiles?.some((profile) => profile.role === 'admin' && profile.aktif === true)) {
    res.status(403).json({ error: 'Verifikasi kode hanya tersedia untuk Admin aktif.' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const pin = process.env.RIWAYAT_LOG_PIN;

  if (!supabaseUrl || !anonKey || !accessToken || !projectRef || !/^\d{6}$/.test(pin || '')) {
    return res.status(503).json({ error: 'Konfigurasi verifikasi belum lengkap. Admin perlu memeriksa environment variable Preview.' });
  }

  try {
    if (!(await requireAdmin(req, res, supabaseUrl, anonKey))) return;

    if (req.method === 'GET') {
      return res.status(200).json({ verified: hasValidSession(req, accessToken) });
    }

    const clientKey = getClientKey(req);
    const now = Date.now();
    const record = attemptsByIp.get(clientKey);
    if (record && now - record.startedAt >= WINDOW_MS) attemptsByIp.delete(clientKey);
    const activeRecord = attemptsByIp.get(clientKey);
    if (activeRecord && activeRecord.count >= MAX_ATTEMPTS && now - activeRecord.startedAt < WINDOW_MS) {
      return res.status(429).json({ error: 'Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba lagi.' });
    }

    const suppliedPin = String(req.body?.pin || '');
    const expected = Buffer.from(pin);
    const supplied = Buffer.from(suppliedPin);
    const valid = /^\d{6}$/.test(suppliedPin) && supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

    if (!valid) {
      const next = attemptsByIp.get(clientKey);
      if (!next || now - next.startedAt >= WINDOW_MS) attemptsByIp.set(clientKey, { startedAt: now, count: 1 });
      else next.count += 1;
      return res.status(401).json({ error: 'Kode salah. Periksa kembali dan coba lagi.' });
    }

    attemptsByIp.delete(clientKey);
    const expiryText = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
    const signature = getSignedSession(accessToken, expiryText);
    const cookieValue = encodeURIComponent(expiryText + '.' + signature);
    res.setHeader('Set-Cookie', 'riwayat_log_access=' + cookieValue + '; Path=/api/; Max-Age=' + SESSION_SECONDS + '; HttpOnly; Secure; SameSite=Strict');
    return res.status(200).json({ verified: true, expiresIn: SESSION_SECONDS });
  } catch (error) {
    console.error('Supabase log verification error', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi kode.' });
  }
}
