import crypto from 'node:crypto';

function hasValidLogAccess(req, accessToken) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('riwayat_log_access='));
  if (!cookie) return false;
  let value;
  try {
    value = decodeURIComponent(cookie.slice('riwayat_log_access='.length));
  } catch {
    return false;
  }
  const [expiryText, suppliedSignature] = value.split('.');
  const expiry = Number(expiryText);
  if (!Number.isInteger(expiry) || expiry <= Math.floor(Date.now() / 1000) || !suppliedSignature) return false;
  const expectedSignature = crypto.createHmac('sha256', accessToken).update('riwayat-log:' + expiryText).digest('hex');
  const supplied = Buffer.from(suppliedSignature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function sanitizeLogMessage(value) {
  return String(value || 'Tidak ada pesan tambahan.')
    .replace(/(https?:\/\/[^\s?]+)\?[^\s]*/gi, '$1?[parameter disembunyikan]')
    .replace(/((?:access_token|refresh_token|apikey|api_key|authorization|password|token)=)[^&\s]+/gi, '$1[disembunyikan]')
    .slice(0, 500);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!supabaseUrl || !anonKey || !accessToken || !projectRef) {
    return res.status(503).json({ error: 'Konfigurasi log belum lengkap. Admin perlu mengatur environment variable di Vercel.' });
  }

  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Silakan login kembali.' });

  try {
    const userResponse = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + match[1] },
    });
    if (!userResponse.ok) return res.status(401).json({ error: 'Sesi login tidak valid atau sudah berakhir.' });

    const user = await userResponse.json();
    if (!user || !user.id) return res.status(401).json({ error: 'Pengguna tidak terverifikasi.' });

    const profileUrl = new URL(supabaseUrl + '/rest/v1/user_profiles');
    profileUrl.searchParams.set('select', 'role,aktif');
    profileUrl.searchParams.set('user_id', 'eq.' + user.id);
    profileUrl.searchParams.set('limit', '1');
    const profileResponse = await fetch(profileUrl, {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + match[1] },
    });
    if (!profileResponse.ok) return res.status(403).json({ error: 'Tidak dapat memverifikasi hak akses admin.' });

    const profiles = await profileResponse.json();
    if (!profiles || !profiles.some((profile) => profile.role === 'admin' && profile.aktif === true)) {
      return res.status(403).json({ error: 'Riwayat log hanya dapat diakses oleh Admin.' });
    }

    if (!hasValidLogAccess(req, accessToken)) {
      return res.status(403).json({ error: 'Verifikasi kode diperlukan atau sudah kedaluwarsa.' });
    }

    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const sql = [
      'SELECT timestamp, source, event_message,',
      "log_attributes['request.method'] AS method,",
      "log_attributes['request.path'] AS path,",
      "toInt32OrZero(log_attributes['response.status_code']) AS status",
      'FROM logs',
      "WHERE source = 'edge_logs'",
      "AND toInt32OrZero(log_attributes['response.status_code']) >= 400",
      'ORDER BY timestamp DESC',
      'LIMIT 100',
    ].join(' ');

    const logsUrl = new URL('https://api.supabase.com/v1/projects/' + encodeURIComponent(projectRef) + '/analytics/endpoints/logs');
    logsUrl.searchParams.set('sql', sql);
    logsUrl.searchParams.set('iso_timestamp_start', start.toISOString());
    logsUrl.searchParams.set('iso_timestamp_end', end.toISOString());

    const logsResponse = await fetch(logsUrl, { headers: { Authorization: 'Bearer ' + accessToken } });
    const payload = await logsResponse.json();
    if (!logsResponse.ok || payload?.error) {
      console.error('Supabase log query failed', logsResponse.status, payload?.error || 'Unknown error');
      return res.status(502).json({ error: 'Gagal mengambil log dari Supabase. Periksa token dan izin analytics_logs_read.' });
    }

    const logs = (Array.isArray(payload?.result) ? payload.result : []).map((log) => ({
      ...log,
      path: String(log.path || '').split('?')[0],
      event_message: sanitizeLogMessage(log.event_message),
    }));

    return res.status(200).json({
      logs,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      limit: 100,
    });
  } catch (error) {
    console.error('Supabase logs endpoint error', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil log Supabase.' });
  }
}
