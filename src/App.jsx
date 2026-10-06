import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS = ['MG', 'SN', 'SL', 'RB', 'KM', 'JM', 'SB']

const demoEmployees = [
  { department: 'FARM', job: 'SECURITY', jobs: ['SECURITY'], name: 'Yusuf', codes: ['S','OFF','M','S','M','S','S','M','S','OFF','M','S','S','M','OFF','M','S','OFF','M','S','M','S','OFF','M','S','M','S','OFF','M','S','M'] },
  { department: 'FARM', job: 'SECURITY', jobs: ['SECURITY'], name: 'Ahmadi', codes: ['M','S','S','OFF','M','M','S','M','OFF','M','S','S','M','OFF','S','M','S','OFF','M','S','M','S','OFF','M','S','M','S','OFF','M','S','S'] },
  { department: 'FARM', job: 'POS 1', jobs: ['POS 1'], name: 'Alvi', codes: ['OFF','S','P','S','P','S','OFF','P','S','P','S','P','S','P','S','P','S','OFF','P','S','P','S','OFF','P','S','P','S','OFF','P','S','OFF'] },
  { department: 'FARM', job: 'MEKANIK', jobs: ['MEKANIK'], name: 'Wasto', codes: ['','','','OFF','','','','','','','OFF','','','','','OFF','','','','','OFF','','','','','OFF','','','','','OFF','',''] },
  { department: 'FARM', job: 'LONDRY', jobs: ['LONDRY'], name: 'Anisah', codes: ['','','','OFF','OFF','OFF','OFF','OFF','OFF','OFF','OFF','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT'] },
]

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function App() {
  const [month, setMonth] = useState(10)
  const [year, setYear] = useState(2026)
  const [department, setDepartment] = useState('FARM')
  const [job, setJob] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState(demoEmployees)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalDays = useMemo(() => daysInMonth(month, year), [month, year])

  function changeMonth(offset) {
    const next = new Date(year, month - 1 + offset, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
    setJob('')
  }

  function goToCurrentMonth() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setJob('')
  }

  const jobs = useMemo(
    () => [...new Set(rows.flatMap((row) => row.jobs || (row.job ? [row.job] : [])))].sort(),
    [rows],
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) =>
      (!department || row.department === department) &&
      (!job || (row.jobs || []).includes(job)) &&
      (!q || row.name.toLowerCase().includes(q)),
    )
  }, [rows, department, job, search])

  useEffect(() => {
    if (!supabaseConfigured) return

    let cancelled = false

    async function loadSchedule() {
      setLoading(true)
      setError('')

      const start = formatDate(year, month, 1)
      const end = formatDate(year, month, totalDays)

      const { data, error: queryError } = await supabase
        .from('v_jadwal_karyawan')
        .select('employee_id,tanggal,nama_departemen,nama_job,nama_job_master,nama_karyawan,kode_jadwal,keterangan')
        .gte('tanggal', start)
        .lte('tanggal', end)
        .eq('nama_departemen', department)
        .order('nama_karyawan')
        .order('tanggal')

      if (cancelled) return

      if (queryError) {
        setError(queryError.message)
        setLoading(false)
        return
      }

      if (!data?.length) {
        setRows([])
        setLoading(false)
        return
      }

      const grouped = new Map()

      for (const item of data) {
        const key = String(item.employee_id)

        if (!grouped.has(key)) {
          grouped.set(key, {
            department: item.nama_departemen,
            job: item.nama_job_master || '',
            jobs: new Set(item.nama_job_master ? [item.nama_job_master] : []),
            name: item.nama_karyawan,
            codes: Array(totalDays).fill(''),
            assignmentDays: new Set(),
          })
        }

        const row = grouped.get(key)
        if (item.nama_job) row.jobs.add(item.nama_job)

        const day = Number(String(item.tanggal).slice(-2))
        if (day >= 1 && day <= totalDays) {
          if (item.kode_jadwal) {
            row.codes[day - 1] = item.kode_jadwal
          } else if (item.nama_job) {
            row.codes[day - 1] = item.nama_job
            row.assignmentDays.add(day - 1)
          }
        }
      }

      const normalized = [...grouped.values()].map((row) => {
        const jobsArray = [...row.jobs].sort()
        return {
          ...row,
          jobs: jobsArray,
          job: row.job || jobsArray.join(' / '),
        }
      })

      setRows(normalized)
      setLoading(false)
    }

    loadSchedule()

    return () => {
      cancelled = true
    }
  }, [department, month, year, totalDays])

  function resetToDemo() {
    setRows(demoEmployees)
    setError('')
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">▣ Jadwal Karyawan<small>Database Jadwal & Absensi</small></div>
        <nav className="nav">
          <div className="active">⌂ &nbsp; Jadwal Karyawan</div>
          <div>♟ &nbsp; Karyawan</div>
          <div>▦ &nbsp; Departemen</div>
          <div>▣ &nbsp; JOB</div>
          <div>☷ &nbsp; Kode Jadwal</div>
          <div>◷ &nbsp; Absensi</div>
          <div>▥ &nbsp; Laporan</div>
          <div className="nav-settings">⚙ &nbsp; Pengaturan</div>
        </nav>
      </aside>

      <main className="main">
        <h1>Jadwal Karyawan</h1>
        <p className="sub">Frontend awal berdasarkan Prototype UI v2</p>

        <section className="card">
          <div className="filters">
            <div><label>Bulan</label><select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></div>
            <div><label>Tahun</label><select value={year} onChange={(e) => setYear(Number(e.target.value))}><option>2026</option><option>2027</option></select></div>
            <div><label>Departemen</label><select value={department} onChange={(e) => { setDepartment(e.target.value); setJob('') }}><option>FARM</option><option>HATCHERY</option></select></div>
            <div><label>JOB</label><select value={job} onChange={(e) => setJob(e.target.value)}><option value="">Semua</option>{jobs.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label>Cari Karyawan</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama karyawan..." /></div>
            <div className="filter-actions"><label>&nbsp;</label><button type="button" onClick={() => setSearch(search.trim())}>Tampilkan</button></div>
          </div>
        </section>

        <section className="card">
          <div className="title">
            <div>
              <h2>Jadwal {department} — {MONTHS[month - 1]} {year}</h2>
              <div className="meta">{supabaseConfigured ? 'Sumber: Supabase / v_jadwal_karyawan' : 'Mode demo — Supabase belum dikonfigurasi'}</div>
            </div>
            <div className="title-actions">
              <button className="secondary nav-month" type="button" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya">‹</button>
              <button className="secondary today" type="button" onClick={goToCurrentMonth}>Bulan Ini</button>
              <button className="secondary nav-month" type="button" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya">›</button>
              <div className="badge">Total Karyawan: {filteredRows.length}</div>
            </div>
          </div>

          {loading && <div className="state">Memuat jadwal...</div>}
          {error && <div className="state error">Gagal memuat data Supabase: {error}<button className="secondary" onClick={resetToDemo}>Gunakan data demo</button></div>}
          {!loading && !error && filteredRows.length === 0 && <div className="state">Tidak ada karyawan yang sesuai dengan filter.</div>}

          {!loading && !error && filteredRows.length > 0 && (
            <div className="wrap">
              <table>
                <thead><tr><th className="sticky-job">JOB</th><th className="sticky-name">Nama Karyawan</th>{Array.from({ length: totalDays }, (_, i) => { const date = new Date(year, month - 1, i + 1); return <th key={i}>{i + 1}<br /><span>{DAYS[date.getDay()]}</span></th> })}</tr></thead>
                <tbody>{filteredRows.map((row) => <tr key={row.name}><td className="sticky-job group">{row.job || '—'}</td><td className="sticky-name">{row.name}</td>{row.codes.slice(0, totalDays).map((code, i) => { const assignment = row.assignmentDays?.has(i); return <td key={i} className={code ? assignment ? 'cell assignment' : `cell ${code}` : 'empty'}>{code || '—'}</td> })}</tr>)}</tbody>
              </table>
            </div>
          )}

          <div className="note">Data produksi berasal dari <b>v_jadwal_karyawan</b>. Jika pada tanggal tertentu terdapat penempatan JOB, JOB tersebut ditampilkan pada sel tanggal.</div>
        </section>

        <section className="card">
          <h3>Legenda Kode Jadwal</h3>
          <div className="legend">{[['P','Shift Pagi'],['S','Shift Sore'],['M','Shift Malam'],['L','Libur'],['OFF','Libur'],['CT','Cuti']].map(([code,label]) => <div key={code}><span className={code}>{code}</span>{label}</div>)}</div>
        </section>
      </main>
    </div>
  )
}

export default App
