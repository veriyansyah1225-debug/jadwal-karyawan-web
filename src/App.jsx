import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'

const DAYS = ['MG', 'SN', 'SL', 'RB', 'KM', 'JM', 'SB']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const demoEmployees = [
  { department: 'FARM', job: 'SECURITY', jobs: ['SECURITY'], name: 'Yusuf', codes: ['S','OFF','M','S','M','S','S','M','S','OFF','M','S','S','M','OFF','M','S','OFF','M','S','M','S','OFF','M','S','M','S','OFF','M','S','M'] },
  { department: 'FARM', job: 'SECURITY', jobs: ['SECURITY'], name: 'Ahmadi', codes: ['M','S','S','OFF','M','M','S','M','OFF','M','S','S','M','OFF','S','M','S','OFF','M','S','M','S','OFF','M','S','M','S','OFF','M','S','S'] },
  { department: 'FARM', job: 'POS 1', jobs: ['POS 1'], name: 'Alvi', codes: ['OFF','S','P','S','P','S','OFF','P','S','P','S','P','S','P','S','P','S','OFF','P','S','P','S','OFF','P','S','P','S','OFF','P','S','OFF'] },
  { department: 'FARM', job: 'MEKANIK', jobs: ['MEKANIK'], name: 'Wasto', codes: ['','','','OFF','','','','','','','OFF','','','','','OFF','','','','','OFF','','','','','OFF','','','','','OFF','',''] },
  { department: 'FARM', job: 'LONDRY', jobs: ['LONDRY'], name: 'Anisah', codes: ['','','','OFF','OFF','OFF','OFF','OFF','OFF','OFF','OFF','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT','CT'] },
]

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDateRange(startDate, endDate) {
  if (!startDate || !endDate || startDate > endDate) return []

  const dates = []
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const cursor = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)

  while (cursor <= end) {
    const value = toInputDate(cursor)
    const localDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
    dates.push({
      value,
      date: localDate,
      day: localDate.getDate(),
      dayName: DAYS[localDate.getDay()],
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function App() {
  const today = new Date()
  const [startDate, setStartDate] = useState(toInputDate(getMonthStart(today)))
  const [endDate, setEndDate] = useState(toInputDate(getMonthEnd(today)))
  const [department, setDepartment] = useState('FARM')
  const [job, setJob] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false)
  const [rows, setRows] = useState(demoEmployees)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCell, setSelectedCell] = useState(null)
  const [focusMode, setFocusMode] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [showJobColumn, setShowJobColumn] = useState(false)

  const dateRange = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate])
  const invalidRange = Boolean(startDate && endDate && startDate > endDate)

  const jobs = useMemo(
    () => [...new Set(rows.flatMap((row) => row.jobs || (row.job ? [row.job] : [])))].sort(),
    [rows],
  )

  const availableEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase()
    return rows
      .filter((row) => !job || (row.jobs || []).includes(job))
      .filter((row) => !q || row.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rows, job, employeeSearch])

  const selectedEmployeeSet = useMemo(() => new Set(selectedEmployees), [selectedEmployees])

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      (!department || row.department === department) &&
      (!job || (row.jobs || []).includes(job)) &&
      (selectedEmployees.length === 0 || selectedEmployeeSet.has(String(row.employeeId))),
    )
  }, [rows, department, job, selectedEmployees, selectedEmployeeSet])

  function toggleEmployee(employeeId) {
    const key = String(employeeId)
    setSelectedEmployees((current) =>
      current.includes(key) ? current.filter((id) => id !== key) : [...current, key],
    )
  }

  function selectAllEmployees() {
    setSelectedEmployees(availableEmployees.map((row) => String(row.employeeId)))
  }

  function clearSelectedEmployees() {
    setSelectedEmployees([])
  }

  function selectMonth(monthIndex) {
    const year = Number(startDate.slice(0, 4))
    const selectedDate = new Date(year, monthIndex, 1)
    setStartDate(toInputDate(getMonthStart(selectedDate)))
    setEndDate(toInputDate(getMonthEnd(selectedDate)))
    setJob('')
    setSelectedEmployees([])
    setMonthPickerOpen(false)
  }

  useEffect(() => {
    if (!supabaseConfigured || invalidRange) return

    let cancelled = false

    async function loadSchedule() {
      setLoading(true)
      setError('')

      const { data, error: queryError } = await supabase
        .from('v_jadwal_karyawan')
        .select('employee_id,tanggal,nama_departemen,nama_job,nama_job_master,nama_karyawan,kode_jadwal,keterangan')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
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
            employeeId: item.employee_id,
            job: item.nama_job_master || '',
            jobs: new Set(item.nama_job_master ? [item.nama_job_master] : []),
            name: item.nama_karyawan,
            codes: {},
            details: {},
            assignmentDays: new Set(),
          })
        }

        const row = grouped.get(key)
        if (item.nama_job) row.jobs.add(item.nama_job)

        const dateKey = String(item.tanggal)
        if (item.kode_jadwal) {
          row.codes[dateKey] = item.kode_jadwal
        } else if (item.nama_job) {
          row.codes[dateKey] = item.nama_job
          row.assignmentDays.add(dateKey)
        }

        row.details[dateKey] = {
          date: dateKey,
          code: item.kode_jadwal || '',
          assignment: item.nama_job || '',
          note: item.keterangan || '',
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
  }, [department, startDate, endDate, invalidRange])

  useEffect(() => {
    const validIds = new Set(rows.map((row) => String(row.employeeId)))
    setSelectedEmployees((current) => current.filter((id) => validIds.has(id)))
  }, [rows])

  function resetToDemo() {
    setRows(demoEmployees.map((row, index) => ({ ...row, employeeId: `demo-${index}` })))
    setError('')
  }

  return (
    <div className={`app${focusMode ? ' focus-mode' : ''}`}>
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
            <div><label>Dari Tanggal</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label>Sampai Tanggal</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div><label>Departemen</label><select value={department} onChange={(e) => { setDepartment(e.target.value); setJob(''); setSelectedEmployees([]) }}><option>FARM</option><option>HATCHERY</option></select></div>
            <div><label>JOB</label><select value={job} onChange={(e) => { setJob(e.target.value); setSelectedEmployees([]) }}><option value="">Semua</option>{jobs.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="employee-filter">
              <label>Pilih Karyawan</label>
              <button type="button" className="employee-picker-trigger" onClick={() => setEmployeePickerOpen((open) => !open)}>
                {selectedEmployees.length ? `${selectedEmployees.length} karyawan dipilih` : 'Semua karyawan'}
                <span>⌄</span>
              </button>
              {employeePickerOpen && (
                <div className="employee-picker">
                  <div className="employee-picker-head">
                    <input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="Cari nama..." />
                  </div>
                  <div className="employee-picker-actions">
                    <button type="button" className="picker-action" onClick={selectAllEmployees}>Pilih Semua</button>
                    <button type="button" className="picker-action" onClick={clearSelectedEmployees}>Hapus Semua</button>
                  </div>
                  <div className="employee-picker-list">
                    {availableEmployees.length === 0 && <div className="employee-empty">Tidak ada nama yang cocok.</div>}
                    {availableEmployees.map((row) => {
                      const key = String(row.employeeId)
                      return (
                        <label className="employee-option" key={key}>
                          <input type="checkbox" checked={selectedEmployeeSet.has(key)} onChange={() => toggleEmployee(key)} />
                          <span>{row.name}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="employee-picker-footer">
                    {selectedEmployees.length ? `${selectedEmployees.length} karyawan dipilih` : 'Semua karyawan ditampilkan'}
                  </div>
                </div>
              )}
            </div>
          </div>
          {invalidRange && <div className="state error date-error">Tanggal awal tidak boleh lebih besar dari tanggal akhir.</div>}
        </section>

        <section className="card">
          <div className="title">
            <div>
              <h2>Jadwal {department} — {formatDisplayDate(startDate)}{startDate !== endDate ? ` – ${formatDisplayDate(endDate)}` : ''}</h2>
              <div className="meta">{supabaseConfigured ? 'Sumber: Supabase / v_jadwal_karyawan' : 'Mode demo — Supabase belum dikonfigurasi'}</div>
            </div>
            <div className="title-actions">
              <div className="month-picker">
                <button className="secondary today" type="button" onClick={() => setMonthPickerOpen((open) => !open)}>Pilih Bulan ▾</button>
                {monthPickerOpen && (
                  <div className="month-picker-menu">
                    {MONTHS.map((month, index) => (
                      <button
                        type="button"
                        key={month}
                        className={new Date(`${startDate}T00:00:00`).getMonth() === index ? 'month-option active' : 'month-option'}
                        onClick={() => selectMonth(index)}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="focus-toggle" type="button" onClick={() => setFocusMode((value) => !value)}>
                {focusMode ? 'Kembalikan Tampilan' : 'Perbesar Jadwal'}
              </button>
              <button className={`employee-count-toggle${showJobColumn ? " active" : ""}`} type="button" onClick={() => setShowJobColumn((value) => !value)} title={showJobColumn ? "Sembunyikan Job" : "Tampilkan Job"}>{showJobColumn ? "Sembunyikan Job" : "Tampilkan Job"}</button>
            </div>
          </div>

          {loading && <div className="state">Memuat jadwal...</div>}
          {error && <div className="state error">Gagal memuat data Supabase: {error}<button className="secondary" onClick={resetToDemo}>Gunakan data demo</button></div>}
          {!loading && !error && !invalidRange && filteredRows.length === 0 && <div className="state">Tidak ada karyawan yang sesuai dengan filter.</div>}

          {!loading && !error && !invalidRange && filteredRows.length > 0 && (
            <div className="wrap">
              <table>
                <thead><tr>{showJobColumn && <th className="sticky-job">JOB</th>}<th className={showJobColumn ? "sticky-name" : "sticky-name no-job"}>Nama Karyawan</th>{dateRange.map(({ value, day, dayName }) => <th key={value}>{day}<br /><span>{dayName}</span></th>)}</tr></thead>
                <tbody>{filteredRows.map((row) => <tr key={row.employeeId || row.name}>{showJobColumn && <td className="sticky-job group">{row.job || '—'}</td>}<td className={showJobColumn ? "sticky-name" : "sticky-name no-job"}>{row.name}</td>{dateRange.map(({ value }) => { const code = row.codes?.[value] || ''; const assignment = row.assignmentDays?.has(value); const detail = row.details?.[value]; return <td key={value}><button type="button" className={code ? assignment ? 'cell-button assignment' : `cell-button ${code}` : 'cell-button empty'} onClick={() => setSelectedCell({ row, date: value, detail })} title="Klik untuk melihat detail">{code || '—'}</button></td> })}</tr>)}</tbody>
              </table>
            </div>
          )}

          <div className="note">Data produksi berasal dari <b>v_jadwal_karyawan</b>. Filter tanggal, pemilihan karyawan, dan tampilan JOB hanya mengatur tampilan; jadwal tetap tersimpan per tanggal di database. Jika rentang melewati bulan, tabel dapat digeser secara horizontal.</div>
        </section>

        <section className="card">
          <h3>Legenda Kode Jadwal</h3>
          <div className="legend">{[['P','Shift Pagi'],['S','Shift Sore'],['M','Shift Malam'],['L','Libur'],['OFF','Libur'],['CT','Cuti']].map(([code,label]) => <div key={code}><span className={code}>{code}</span>{label}</div>)}</div>
        </section>
      </main>

      {selectedCell && (
        <div className="modal-backdrop" onClick={() => setSelectedCell(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Detail Jadwal</div>
                <h2 id="detail-title">{selectedCell.row.name}</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setSelectedCell(null)} aria-label="Tutup">×</button>
            </div>
            <div className="detail-grid">
              <div><span>Departemen</span><strong>{selectedCell.row.department}</strong></div>
              <div><span>JOB</span><strong>{selectedCell.row.job || '—'}</strong></div>
              <div><span>Tanggal</span><strong>{selectedCell.detail?.date || selectedCell.date}</strong></div>
              <div><span>Status / Kode</span><strong>{selectedCell.detail?.code || selectedCell.detail?.assignment || 'Tidak ada jadwal'}</strong></div>
              <div className="detail-wide"><span>Tugas / Penempatan</span><strong>{selectedCell.detail?.assignment || '—'}</strong></div>
              <div className="detail-wide"><span>Keterangan</span><strong>{selectedCell.detail?.note || '—'}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
