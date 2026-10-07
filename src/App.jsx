import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx-js-style'

const DAYS = ['MG', 'SN', 'SL', 'RB', 'KM', 'JM', 'SB']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

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


function buildExportMatrix(rows, dateRange, includeJob) {
  const header = [
    ...(includeJob ? ['JOB'] : []),
    'Nama Karyawan',
    ...dateRange.map(({ day, dayName }) => `${day} ${dayName}`),
  ]

  const body = rows.map((row) => [
    ...(includeJob ? [row.job || ''] : []),
    row.name,
    ...dateRange.map(({ value }) => row.codes?.[value] || ''),
  ])

  return [header, ...body]
}

function exportExcel(rows, dateRange, department, includeJob, startDate, endDate) {
  if (!rows.length || !dateRange.length) return

  const title = [
    ['Jadwal Karyawan'],
    ['Departemen: ' + department],
    ['Periode: ' + startDate + ' s/d ' + endDate],
    [],
  ]
  const matrix = [...title, ...buildExportMatrix(rows, dateRange, includeJob)]
  const worksheet = XLSX.utils.aoa_to_sheet(matrix)
  const headerRow = title.length
  const lastColumn = (includeJob ? 2 : 1) + dateRange.length
  const lastColumnLetter = XLSX.utils.encode_col(lastColumn - 1)
  const border = {
    top: { style: 'thin', color: { rgb: 'D7DEE9' } },
    bottom: { style: 'thin', color: { rgb: 'D7DEE9' } },
    left: { style: 'thin', color: { rgb: 'D7DEE9' } },
    right: { style: 'thin', color: { rgb: 'D7DEE9' } },
  }
  const codeFill = { P: 'C9F2CF', S: 'CBE2FB', M: 'FFE9A8', L: 'FFD0D0', CT: 'DED0FF' }

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumn - 1 } },
  ]
  worksheet['!cols'] = [
    ...(includeJob ? [{ wch: 22 }] : []),
    { wch: 30 },
    ...dateRange.map(() => ({ wch: 10 })),
  ]
  worksheet['!rows'] = [
    { hpt: 24 }, { hpt: 20 }, { hpt: 20 }, { hpt: 8 }, { hpt: 28 },
    ...rows.map(() => ({ hpt: 22 })),
  ]
  worksheet['!freeze'] = { xSplit: includeJob ? 2 : 1, ySplit: headerRow }
  worksheet['!autofilter'] = { ref: 'A' + (headerRow + 1) + ':' + lastColumnLetter + (headerRow + rows.length + 1) }
  worksheet['!pageSetup'] = { orientation: 'landscape', paperSize: 8, fitToWidth: 1, fitToHeight: 0 }
  worksheet['!printHeader'] = [(headerRow + 1) + ':' + (headerRow + 1)]

  const titleStyle = {
    font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '142033' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  const metaStyle = {
    font: { name: 'Calibri', sz: 11, color: { rgb: '68758A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  const headerStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '142033' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'EEF3F8' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border,
  }
  const nameStyle = {
    font: { name: 'Calibri', sz: 10, color: { rgb: '142033' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border,
  }
  const codeStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '142033' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border,
  }

  worksheet.A1.s = titleStyle
  worksheet.A2.s = metaStyle
  worksheet.A3.s = metaStyle

  for (let col = 0; col < lastColumn; col += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c: col })]
    if (cell) cell.s = headerStyle
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const sheetRow = headerRow + 1 + rowIndex
    for (let col = 0; col < lastColumn; col += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: sheetRow, c: col })]
      if (!cell) continue
      const isCodeCell = col >= (includeJob ? 2 : 1)
      if (isCodeCell) {
        const code = String(cell.v || '')
        cell.s = {
          ...codeStyle,
          fill: codeFill[code] ? { patternType: 'solid', fgColor: { rgb: codeFill[code] } } : undefined,
        }
      } else {
        cell.s = nameStyle
      }
    }
  }

  const workbook = XLSX.utils.book_new()
  workbook.Props = { Title: 'Jadwal Karyawan', Subject: 'Jadwal ' + department, Author: 'Jadwal Karyawan Web UI' }
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal')
  XLSX.writeFile(workbook, 'jadwal-karyawan-' + startDate + '-' + endDate + '.xlsx')
}

function exportPdf(rows, dateRange, department, includeJob, startDate, endDate) {
  if (!rows.length || !dateRange.length) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  const margin = 10
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const titleHeight = 18
  const headerHeight = 12
  const rowHeight = 8.5
  const nameWidth = includeJob ? 68 : 76
  const jobWidth = includeJob ? 28 : 0
  const datesPerPage = 16
  const dateChunks = []
  for (let index = 0; index < dateRange.length; index += datesPerPage) {
    dateChunks.push(dateRange.slice(index, index + datesPerPage))
  }

  const codeFill = {
    P: [201, 242, 207],
    S: [203, 226, 251],
    M: [255, 233, 168],
    L: [255, 208, 208],
    CT: [222, 208, 255],
  }

  const rowsPerPage = Math.max(1, Math.floor((pageHeight - (margin * 2) - titleHeight - headerHeight - 14) / rowHeight))
  const rowChunks = []
  for (let index = 0; index < rows.length; index += rowsPerPage) {
    rowChunks.push(rows.slice(index, index + rowsPerPage))
  }

  const totalPages = dateChunks.length * rowChunks.length
  let pageNumber = 0

  for (const dateChunk of dateChunks) {
    const dateWidth = Math.max(14, Math.min(18, (pageWidth - (margin * 2) - nameWidth - jobWidth) / dateChunk.length))
    const tableWidth = nameWidth + jobWidth + (dateWidth * dateChunk.length)
    const left = (pageWidth - tableWidth) / 2

    for (const rowChunk of rowChunks) {
      if (pageNumber > 0) pdf.addPage('a3', 'landscape')
      pageNumber += 1

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Jadwal Karyawan', margin, margin + 3)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('Departemen: ' + department + ' | Periode: ' + startDate + ' s/d ' + endDate, margin, margin + 10)
      pdf.text('Tanggal ' + dateChunk[0].day + '–' + dateChunk[dateChunk.length - 1].day + ' | Halaman ' + pageNumber + '/' + totalPages, pageWidth - margin, margin + 10, { align: 'right' })

      let y = margin + titleHeight
      let x = left
      pdf.setFillColor(239, 244, 250)
      pdf.rect(x, y, tableWidth, headerHeight, 'F')
      pdf.setDrawColor(210, 218, 228)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7.5)

      if (includeJob) {
        pdf.rect(x, y, jobWidth, headerHeight)
        pdf.text('JOB', x + jobWidth / 2, y + 7.5, { align: 'center' })
        x += jobWidth
      }

      pdf.rect(x, y, nameWidth, headerHeight)
      pdf.text('Nama Karyawan', x + nameWidth / 2, y + 7.5, { align: 'center' })
      x += nameWidth

      for (const item of dateChunk) {
        pdf.rect(x, y, dateWidth, headerHeight)
        pdf.text(String(item.day), x + dateWidth / 2, y + 5.2, { align: 'center' })
        pdf.setFontSize(5.8)
        pdf.text(item.dayName, x + dateWidth / 2, y + 9.2, { align: 'center' })
        pdf.setFontSize(7.5)
        x += dateWidth
      }

      y += headerHeight
      pdf.setFontSize(7.2)

      for (const row of rowChunk) {
        x = left
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(20, 32, 51)

        if (includeJob) {
          pdf.rect(x, y, jobWidth, rowHeight)
          pdf.text(String(row.job || ''), x + 2, y + 5.8, { maxWidth: jobWidth - 4 })
          x += jobWidth
        }

        pdf.rect(x, y, nameWidth, rowHeight)
        pdf.text(String(row.name || ''), x + 2, y + 5.8, { maxWidth: nameWidth - 4 })
        x += nameWidth

        for (const item of dateChunk) {
          const code = row.codes?.[item.value] || ''
          const fill = codeFill[code]
          if (fill) {
            pdf.setFillColor(...fill)
            pdf.rect(x, y, dateWidth, rowHeight, 'F')
          }
          pdf.rect(x, y, dateWidth, rowHeight)
          if (code) {
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(code.length > 1 ? 6.8 : 7.8)
            pdf.text(code, x + dateWidth / 2, y + 5.8, { align: 'center' })
            pdf.setFontSize(7.2)
          }
          x += dateWidth
        }
        y += rowHeight
      }
    }
  }

  pdf.save('jadwal-karyawan-' + startDate + '-' + endDate + '.pdf')
}

function App() {
  const today = new Date()
  const [startDate, setStartDate] = useState(toInputDate(getMonthStart(today)))
  const [endDate, setEndDate] = useState(toInputDate(getMonthEnd(today)))
  const [department, setDepartment] = useState('FARM')
  const [departments, setDepartments] = useState([])
  const [job, setJob] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(supabaseConfigured)
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
    if (!supabaseConfigured) return

    let cancelled = false

    async function loadDepartments() {
      const { data, error: queryError } = await supabase
        .from('departments')
        .select('id,nama_departemen')
        .eq('aktif', true)
        .order('nama_departemen')

      if (cancelled) return

      if (queryError) {
        setError(queryError.message)
        return
      }

      const names = (data || []).map((item) => item.nama_departemen).filter(Boolean)
      setDepartments(names)

      if (names.length && !names.includes(department)) {
        setDepartment(names[0])
      }
    }

    loadDepartments()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (invalidRange) return

    if (!supabaseConfigured) {
      setRows([])
      setError('Supabase belum dikonfigurasi. Silakan periksa environment variable aplikasi.')
      setLoading(false)
      return
    }

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
        const normalizedCode = item.kode_jadwal === 'OFF' ? 'L' : item.kode_jadwal

        if (normalizedCode) {
          row.codes[dateKey] = normalizedCode
        } else if (item.nama_job) {
          row.codes[dateKey] = item.nama_job
          row.assignmentDays.add(dateKey)
        }

        row.details[dateKey] = {
          date: dateKey,
          code: normalizedCode || '',
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
            <div><label>Departemen</label><select value={department} onChange={(e) => { setDepartment(e.target.value); setJob(''); setSelectedEmployees([]) }}>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
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
              <div className="meta">{supabaseConfigured ? 'Sumber: Supabase / v_jadwal_karyawan' : 'Supabase belum dikonfigurasi'} · Export mengikuti filter yang sedang aktif.</div>
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
              <button className="secondary export-button" type="button" onClick={() => exportExcel(filteredRows, dateRange, department, showJobColumn, startDate, endDate)} disabled={loading || filteredRows.length === 0}>Excel</button>
              <button className="secondary export-button" type="button" onClick={() => exportPdf(filteredRows, dateRange, department, showJobColumn, startDate, endDate)} disabled={loading || filteredRows.length === 0}>PDF</button>
              <button className="focus-toggle" type="button" onClick={() => setFocusMode((value) => !value)}>
                {focusMode ? 'Kembalikan Tampilan' : 'Perbesar Jadwal'}
              </button>
              <button className={`employee-count-toggle${showJobColumn ? " active" : ""}`} type="button" onClick={() => setShowJobColumn((value) => !value)} title={showJobColumn ? "Sembunyikan Job" : "Tampilkan Job"}>{showJobColumn ? "Sembunyikan Job" : "Tampilkan Job"}</button>
            </div>
          </div>

          {loading && <div className="state">Memuat jadwal...</div>}
          {error && <div className="state error">Gagal memuat data Supabase: {error}</div>}
          {!loading && !error && !invalidRange && filteredRows.length === 0 && <div className="state">Tidak ada karyawan yang sesuai dengan filter.</div>}

          {!loading && !error && !invalidRange && filteredRows.length > 0 && (
            <div className="wrap">
              <table>
                <thead><tr>{showJobColumn && <th className="sticky-job">JOB</th>}<th className={showJobColumn ? "sticky-name" : "sticky-name no-job"}>Nama Karyawan</th>{dateRange.map(({ value, day, dayName }) => <th key={value} className={dayName === "MG" ? "sunday-header" : ""}>{day}<br /><span>{dayName}</span></th>)}</tr></thead>
                <tbody>{filteredRows.map((row) => <tr key={row.employeeId || row.name}>{showJobColumn && <td className="sticky-job group">{row.job || '—'}</td>}<td className={showJobColumn ? "sticky-name" : "sticky-name no-job"}>{row.name}</td>{dateRange.map(({ value }) => { const code = row.codes?.[value] || ''; const assignment = row.assignmentDays?.has(value); const detail = row.details?.[value]; return <td key={value}><button type="button" className={code ? assignment ? 'cell-button assignment' : `cell-button ${code}` : 'cell-button empty'} onClick={() => setSelectedCell({ row, date: value, detail })} title="Klik untuk melihat detail">{code || '—'}</button></td> })}</tr>)}</tbody>
              </table>
            </div>
          )}

          <div className="note">Data produksi berasal dari <b>v_jadwal_karyawan</b>. Filter tanggal, pemilihan karyawan, dan tampilan JOB hanya mengatur tampilan; jadwal tetap tersimpan per tanggal di database. Jika rentang melewati bulan, tabel dapat digeser secara horizontal.</div>
        </section>

        <section className="card">
          <h3>Legenda Kode Jadwal</h3>
          <div className="legend">{[['P','Shift Pagi'],['S','Shift Sore'],['M','Shift Malam'],['L','Libur'],['CT','Cuti']].map(([code,label]) => <div key={code}><span className={code}>{code}</span>{label}</div>)}</div>
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
