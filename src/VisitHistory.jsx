import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'

const INACTIVITY_LIMIT = 30 * 60 * 1000

function inputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0
    return (character === 'x' ? random : (random & 0x3 | 0x8)).toString(16)
  })
}

export default function VisitHistory() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(inputDate(new Date(Date.now() - 6 * 86400000)))
  const [dateTo, setDateTo] = useState(inputDate(new Date()))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined
    let cancelled = false
    const applySession = (nextSession) => {
      if (!cancelled) setSession(nextSession || null)
    }
    supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession))
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setProfile(null)
    setIsAdmin(false)
    if (!supabase || !session?.user?.id) return undefined

    supabase
      .from('user_profiles')
      .select('user_id,nama,email,role,aktif')
      .eq('user_id', session.user.id)
      .eq('aktif', true)
      .maybeSingle()
      .then(({ data, error: profileError }) => {
        if (cancelled) return
        if (profileError || !data) {
          setProfile(null)
          setIsAdmin(false)
          return
        }
        setProfile(data)
        setIsAdmin(data.role === 'admin')
      })

    return () => { cancelled = true }
  }, [session?.user?.id])

  useEffect(() => {
    const userId = session?.user?.id
    if (!supabase || !userId || profile?.user_id !== userId || !profile?.aktif) return undefined

    const sessionKey = `jadwal_visit_session_${userId}`
    const activityKey = `jadwal_visit_last_activity_${userId}`
    let visitSessionId = ''
    let lastActivityAt = 0
    let recording = false

    const saveActivity = (timestamp) => {
      lastActivityAt = timestamp
      try { window.sessionStorage.setItem(activityKey, String(timestamp)) } catch {}
    }

    const recordVisit = async (source) => {
      if (recording) return
      recording = true
      visitSessionId = createUuid()
      try { window.sessionStorage.setItem(sessionKey, visitSessionId) } catch {}
      saveActivity(Date.now())
      try {
        const { error: insertError } = await supabase.from('user_visit_history').insert({
          user_id: userId,
          session_id: visitSessionId,
          visit_source: source,
        })
        if (insertError) console.warn('Histori kunjungan tidak berhasil dicatat.')
      } catch {
        console.warn('Histori kunjungan tidak berhasil dicatat.')
      } finally {
        recording = false
      }
    }

    try {
      visitSessionId = window.sessionStorage.getItem(sessionKey) || ''
      lastActivityAt = Number(window.sessionStorage.getItem(activityKey) || 0)
    } catch {}

    const now = Date.now()
    if (!visitSessionId || !lastActivityAt || now - lastActivityAt >= INACTIVITY_LIMIT) {
      void recordVisit(visitSessionId ? 'return_after_inactivity' : 'app_open')
    } else {
      saveActivity(now)
    }

    const handleActivity = () => {
      const timestamp = Date.now()
      if (lastActivityAt && timestamp - lastActivityAt >= INACTIVITY_LIMIT) {
        void recordVisit('return_after_inactivity')
      } else {
        saveActivity(timestamp)
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleActivity()
    }

    window.addEventListener('pointerdown', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [session?.user?.id, profile?.user_id, profile?.aktif])

  async function loadHistory() {
    if (!isAdmin || !session?.user?.id) {
      setError('Histori kunjungan hanya dapat diakses oleh Admin.')
      return
    }
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError('Rentang tanggal tidak valid.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const start = new Date(dateFrom + 'T00:00:00')
      const end = new Date(dateTo + 'T00:00:00')
      end.setDate(end.getDate() + 1)
      const { data: history, error: historyError } = await supabase
        .from('user_visit_history')
        .select('id,user_id,visited_at,visit_source')
        .gte('visited_at', start.toISOString())
        .lt('visited_at', end.toISOString())
        .order('visited_at', { ascending: false })
        .limit(500)
      if (historyError) throw historyError

      const userIds = [...new Set((history || []).map((item) => item.user_id).filter(Boolean))]
      let profilesById = {}
      if (userIds.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id,nama,email')
          .in('user_id', userIds)
        if (profilesError) throw profilesError
        profilesById = Object.fromEntries((profiles || []).map((item) => [item.user_id, item]))
      }
      setRows((history || []).map((item) => ({
        ...item,
        nama: profilesById[item.user_id]?.nama || 'Nama tidak tersedia',
        email: profilesById[item.user_id]?.email || '—',
      })))
      setLoaded(true)
    } catch (loadError) {
      setError(loadError.message || 'Gagal mengambil histori kunjungan.')
      setLoaded(false)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin || !profile?.aktif) return null

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); if (!loaded) void loadHistory() }}
        style={{ position: 'fixed', right: 18, bottom: 82, zIndex: 1000, border: 0, borderRadius: 10, padding: '11px 15px', background: '#174a35', color: '#fff', boxShadow: '0 4px 18px #0002', cursor: 'pointer', fontWeight: 600 }}
      >
        Histori Kunjungan
      </button>
      {open && (
        <div role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#10182899', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <section role="dialog" aria-modal="true" aria-labelledby="visit-history-title" style={{ background: '#fff', color: '#172b22', width: 'min(1100px, 100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 14, padding: 22, boxShadow: '0 18px 60px #0003' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div>
                <h2 id="visit-history-title" style={{ margin: 0 }}>Histori Kunjungan User</h2>
                <p style={{ margin: '6px 0 0', color: '#667085', fontSize: 13 }}>Kunjungan dicatat saat aplikasi dibuka atau pengguna kembali setelah tidak aktif 30 menit.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup histori kunjungan" style={{ border: 0, background: 'transparent', fontSize: 26, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', margin: '18px 0' }}>
              <label style={{ display: 'grid', gap: 5, fontSize: 13 }}>Dari tanggal<input type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <label style={{ display: 'grid', gap: 5, fontSize: 13 }}>Sampai tanggal<input type="date" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} /></label>
              <button type="button" onClick={() => void loadHistory()} disabled={loading || !dateFrom || !dateTo || dateFrom > dateTo} style={{ border: 0, borderRadius: 8, padding: '10px 14px', background: '#174a35', color: '#fff', cursor: 'pointer' }}>{loading ? 'Memuat...' : 'Terapkan Filter'}</button>
              <button type="button" onClick={() => void loadHistory()} disabled={loading} style={{ border: '1px solid #d0d5dd', borderRadius: 8, padding: '9px 13px', background: '#fff', cursor: 'pointer' }}>Muat Ulang</button>
            </div>
            {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
            {loading && <p>Memuat histori kunjungan...</p>}
            {!loading && !loaded && !error && <p>Pilih rentang tanggal lalu terapkan filter.</p>}
            {!loading && loaded && rows.length === 0 && <p>Belum ada histori kunjungan pada rentang tanggal tersebut.</p>}
            {!loading && loaded && rows.length > 0 && (
              <>
                <p style={{ color: '#667085', fontSize: 13 }}>Menampilkan {rows.length} catatan terbaru (maksimal 500) · {new Set(rows.map((item) => item.user_id)).size} pengguna unik.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['Waktu Kunjungan', 'Nama Pengguna', 'Email', 'Jenis Kunjungan'].map((heading) => <th key={heading} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #d0d5dd', whiteSpace: 'nowrap' }}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {rows.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: 10, borderBottom: '1px solid #eaecf0', whiteSpace: 'nowrap' }}>{new Date(item.visited_at).toLocaleString('id-ID')}</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #eaecf0' }}>{item.nama}</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #eaecf0' }}>{item.email}</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #eaecf0' }}>{item.visit_source === 'return_after_inactivity' ? 'Kembali setelah tidak aktif' : 'Membuka aplikasi'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
