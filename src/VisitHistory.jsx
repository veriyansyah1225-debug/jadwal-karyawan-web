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

export default function VisitHistory({ trackingOnly = false, trackVisits = true } = {}) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(inputDate(new Date()))
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
    if (!trackVisits) return undefined
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
  }, [trackVisits, session?.user?.id, profile?.user_id, profile?.aktif])

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

  if (trackingOnly || !isAdmin || !profile?.aktif) return null

  return (
    <section className="card">
      <div className="title">
        <div>
          <h2>Histori Kunjungan User</h2>
          <div className="meta">Kunjungan dicatat saat aplikasi dibuka atau pengguna kembali setelah tidak aktif 30 menit.</div>
        </div>
      </div>
      <div className="filters login-history-filters">
        <div>
          <label htmlFor="visit-date-from">Dari Tanggal</label>
          <input id="visit-date-from" type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div>
          <label htmlFor="visit-date-to">Sampai Tanggal</label>
          <input id="visit-date-to" type="date" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <div className="login-history-filter-action">
          <label>&nbsp;</label>
          <button type="button" className="focus-toggle" onClick={() => void loadHistory()} disabled={loading || !dateFrom || !dateTo || dateFrom > dateTo}>{loading ? 'Memuat...' : 'Terapkan Filter'}</button>
        </div>
        <div className="login-history-filter-action">
          <label>&nbsp;</label>
          <button type="button" className="focus-toggle" onClick={() => void loadHistory()} disabled={loading}>{loading ? 'Memuat...' : 'Muat Ulang'}</button>
        </div>
      </div>
      {error && <div className="state error">{error}</div>}
      {loading && <div className="state">Memuat histori kunjungan...</div>}
      {!loading && !loaded && !error && <div className="state">Pilih rentang tanggal lalu klik Terapkan Filter untuk memuat histori kunjungan.</div>}
      {!loading && loaded && rows.length === 0 && <div className="state">Belum ada histori kunjungan pada rentang tanggal tersebut.</div>}
      {!loading && loaded && rows.length > 0 && (
        <>
          <div className="meta">Menampilkan {rows.length} catatan terbaru (maksimal 500) · {new Set(rows.map((item) => item.user_id)).size} pengguna unik.</div>
          <div className="wrap">
            <table>
              <thead><tr><th>Waktu Kunjungan</th><th>Nama Pengguna</th><th>Email</th><th>Jenis Kunjungan</th></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.visited_at).toLocaleString('id-ID')}</td>
                    <td>{item.nama}</td>
                    <td>{item.email}</td>
                    <td>{item.visit_source === 'return_after_inactivity' ? 'Kembali setelah tidak aktif' : 'Membuka aplikasi'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
