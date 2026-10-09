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
  const rowHeight = 10
  const nameWidth = includeJob ? 72 : 82
  const jobWidth = includeJob ? 30 : 0
  const datesPerPage = dateRange.length
  const dateChunks = [dateRange]

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
    const dateWidth = (pageWidth - (margin * 2) - nameWidth - jobWidth) / dateChunk.length
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
      pdf.text('A3 | Tanggal ' + dateChunk[0].day + '–' + dateChunk[dateChunk.length - 1].day + ' | Halaman ' + pageNumber + '/' + totalPages, pageWidth - margin, margin + 10, { align: 'right' })

      let y = margin + titleHeight
      let x = left
      pdf.setFillColor(239, 244, 250)
      pdf.rect(x, y, tableWidth, headerHeight, 'F')
      pdf.setDrawColor(95, 108, 125)
      pdf.setLineWidth(0.45)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9.5)

      if (includeJob) {
        pdf.rect(x, y, jobWidth, headerHeight)
        pdf.text('JOB', x + jobWidth / 2, y + 6.7, { align: 'center' })
        x += jobWidth
      }

      pdf.rect(x, y, nameWidth, headerHeight)
      pdf.text('Nama Karyawan', x + nameWidth / 2, y + 6.7, { align: 'center' })
      x += nameWidth

      for (const item of dateChunk) {
        pdf.rect(x, y, dateWidth, headerHeight)
        pdf.text(String(item.day), x + dateWidth / 2, y + 5.2, { align: 'center' })
        pdf.setFontSize(7.2)
        pdf.text(item.dayName, x + dateWidth / 2, y + 9.0, { align: 'center' })
        pdf.setFontSize(9.5)
        x += dateWidth
      }

      y += headerHeight
      pdf.setFontSize(9)

      for (const row of rowChunk) {
        x = left
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(20, 32, 51)

        if (includeJob) {
          pdf.rect(x, y, jobWidth, rowHeight)
          pdf.text(String(row.job || ''), x + 2.5, y + 6.7, { maxWidth: jobWidth - 5 })
          x += jobWidth
        }

        pdf.rect(x, y, nameWidth, rowHeight)
        pdf.text(String(row.name || ''), x + 2.5, y + 6.7, { maxWidth: nameWidth - 5 })
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
            pdf.setFontSize(code.length > 1 ? 8.5 : 10)
            pdf.text(code, x + dateWidth / 2, y + 6.7, { align: 'center' })
            pdf.setFontSize(9)
          }
          x += dateWidth
        }
        y += rowHeight
      }
    }
  }

  pdf.save('jadwal-karyawan-a3-' + startDate + '-' + endDate + '.pdf')
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
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [showJobColumn, setShowJobColumn] = useState(false)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [adminScheduleOpen, setAdminScheduleOpen] = useState(false)
  const [adminScheduleEditMode, setAdminScheduleEditMode] = useState(false)
  const [adminEmployees, setAdminEmployees] = useState([])
  const [adminScheduleCodes, setAdminScheduleCodes] = useState([])
  const [adminEmployeeId, setAdminEmployeeId] = useState('')
  const [adminScheduleDate, setAdminScheduleDate] = useState(toInputDate(today))
  const [adminScheduleCodeId, setAdminScheduleCodeId] = useState('')
  const [adminScheduleNote, setAdminScheduleNote] = useState('')
  const [adminScheduleLoading, setAdminScheduleLoading] = useState(false)
  const [adminScheduleError, setAdminScheduleError] = useState('')
  const [adminScheduleSuccess, setAdminScheduleSuccess] = useState('')
  const [scheduleRefresh, setScheduleRefresh] = useState(0)
  const [adminDeleteLoading, setAdminDeleteLoading] = useState(false)
  const [adminDeleteError, setAdminDeleteError] = useState('')
  const [activeTab, setActiveTab] = useState('schedule')
  const [employeeMasterRows, setEmployeeMasterRows] = useState([])
  const [masterDepartments, setMasterDepartments] = useState([])
  const [masterJobs, setMasterJobs] = useState([])
  const [employeeMasterSearch, setEmployeeMasterSearch] = useState('')
  const [employeeMasterStatus, setEmployeeMasterStatus] = useState('aktif')
  const [employeeMasterDepartment, setEmployeeMasterDepartment] = useState('')
  const [employeeMasterJob, setEmployeeMasterJob] = useState('')
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false)
  const [employeeFormEditMode, setEmployeeFormEditMode] = useState(false)
  const [employeeFormId, setEmployeeFormId] = useState('')
  const [employeeFormCode, setEmployeeFormCode] = useState('')
  const [employeeFormName, setEmployeeFormName] = useState('')
  const [employeeFormDepartmentId, setEmployeeFormDepartmentId] = useState('')
  const [employeeFormJobId, setEmployeeFormJobId] = useState('')
  const [employeeFormActive, setEmployeeFormActive] = useState(true)
  const [employeeFormStartDate, setEmployeeFormStartDate] = useState('')
  const [employeeFormEndDate, setEmployeeFormEndDate] = useState('')
  const [employeeFormNote, setEmployeeFormNote] = useState('')
  const [employeeFormLoading, setEmployeeFormLoading] = useState(false)
  const [employeeFormError, setEmployeeFormError] = useState('')
  const [employeeFormSuccess, setEmployeeFormSuccess] = useState('')
  const [transferFormOpen, setTransferFormOpen] = useState(false)
  const [transferEmployee, setTransferEmployee] = useState(null)
  const [transferDepartmentId, setTransferDepartmentId] = useState('')
  const [transferJobId, setTransferJobId] = useState('')
  const [transferEffectiveDate, setTransferEffectiveDate] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState('')
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [managedUsers, setManagedUsers] = useState([])
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [userFormName, setUserFormName] = useState('')
  const [userFormEmail, setUserFormEmail] = useState('')
  const [userFormRole, setUserFormRole] = useState('supervisor_farm')
  const [userFormEmployeeId, setUserFormEmployeeId] = useState('')
  const [userFormLoading, setUserFormLoading] = useState(false)
  const [userFormError, setUserFormError] = useState('')
  const [userFormSuccess, setUserFormSuccess] = useState('')
  const [userManagementLoading, setUserManagementLoading] = useState(false)
  const [userManagementError, setUserManagementError] = useState('')
  const [userResendLoadingId, setUserResendLoadingId] = useState('')
  const [userDeleteLoadingId, setUserDeleteLoadingId] = useState('')
  const [inviteActivation, setInviteActivation] = useState(false)
  const [invitePassword, setInvitePassword] = useState('')
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState('')
  const [inviteActivationLoading, setInviteActivationLoading] = useState(false)
  const [inviteActivationError, setInviteActivationError] = useState('')
  const [inviteActivationSuccess, setInviteActivationSuccess] = useState('')
  const [mobileNavHidden, setMobileNavHidden] = useState(false)
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false)
  const [bulkScheduleEmployee, setBulkScheduleEmployee] = useState(null)
  const [bulkScheduleValues, setBulkScheduleValues] = useState({})
  const [bulkScheduleLoading, setBulkScheduleLoading] = useState(false)
  const [bulkScheduleSaving, setBulkScheduleSaving] = useState(false)
  const [bulkScheduleError, setBulkScheduleError] = useState('')
  const [bulkScheduleSuccess, setBulkScheduleSuccess] = useState('')

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

  async function toggleFocusMode() {
    const nextValue = !focusMode
    setFocusMode(nextValue)

    if (window.matchMedia('(max-width: 900px)').matches && nextValue) {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape')
        }
      } catch {
        // Beberapa browser mobile tidak mengizinkan orientation lock.
        // Focus mode tetap aktif sebagai fallback.
      }
    } else if (!nextValue) {
      try {
        if (screen.orientation?.unlock) screen.orientation.unlock()
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen()
        }
      } catch {
        // Abaikan jika browser tidak menyediakan kontrol orientasi/fullscreen.
      }
    }
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return

    let cancelled = false

    async function handleInviteCallback() {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const queryType = params.get('type')
      const hashType = hashParams.get('type')
      const hashAccessToken = hashParams.get('access_token')
      const hashRefreshToken = hashParams.get('refresh_token')
      const isInviteLink = Boolean(
        queryType === 'invite' ||
        code ||
        tokenHash ||
        (hashType === 'invite' && (hashAccessToken || hashRefreshToken)),
      )

      if (!isInviteLink) {
        const pendingInvite = window.sessionStorage.getItem('jadwal_invite_activation') === '1'
        if (pendingInvite) setInviteActivation(true)
        return false
      }

      setAuthReady(false)
      setAuthError('Memproses undangan akun...')

      let authData = null
      let authError = null

      if (code) {
        // PKCE invitation callback.
        await supabase.auth.signOut()
        const result = await supabase.auth.exchangeCodeForSession(code)
        authData = result.data
        authError = result.error
      } else if (tokenHash) {
        // Legacy invitation callback.
        await supabase.auth.signOut()
        const result = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'invite',
        })
        authData = result.data
        authError = result.error
      } else {
        // Supabase dapat memproses invitation melalui URL fragment
        // (#access_token=...&refresh_token=...&type=invite) secara otomatis.
        // Pada beberapa callback, pemrosesan session berlangsung sedikit
        // setelah halaman aplikasi mulai dimuat, jadi beri Auth client
        // kesempatan menyelesaikannya sebelum menyatakan invitation gagal.
        let currentSession = await supabase.auth.getSession()

        if (!currentSession.error && !currentSession.data.session) {
          for (const delay of [100, 300, 700]) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            currentSession = await supabase.auth.getSession()
            if (currentSession.error || currentSession.data.session) break
          }
        }

        if (currentSession.error) {
          authError = currentSession.error
        } else if (currentSession.data.session) {
          authData = currentSession.data
        } else if (hashAccessToken && hashRefreshToken) {
          const result = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          })
          authData = result.data
          authError = result.error
        } else {
          authError = new Error('Sesi undangan tidak ditemukan.')
        }
      }

      if (authError || !authData?.session?.user?.id) {
        setSession(null)
        setUserProfile(null)
        setIsAdmin(false)
        setAuthError(authError?.message || 'Link undangan tidak dapat diproses.')
        setAuthReady(true)
        return true
      }

      window.sessionStorage.setItem('jadwal_invite_activation', '1')
      window.history.replaceState({}, document.title, window.location.pathname)

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id,nama,role,aktif,employee_id')
        .eq('user_id', authData.session.user.id)
        .eq('aktif', true)
        .maybeSingle()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        window.sessionStorage.removeItem('jadwal_invite_activation')
        setSession(null)
        setUserProfile(null)
        setIsAdmin(false)
        setAuthError('Undangan berhasil diproses, tetapi akun belum memiliki akses aktif. Silakan hubungi Admin.')
        setAuthReady(true)
        return true
      }

      setSession(authData.session)
      setUserProfile(profile)
      setIsAdmin(profile.role === 'admin')
      setInviteActivation(true)
      setInvitePassword('')
      setInvitePasswordConfirm('')
      setInviteActivationError('')
      setInviteActivationSuccess('')
      setAuthError('')
      setAuthReady(true)
      return true
    }

    async function loadUserAccess(userId) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id,nama,role,aktif,employee_id')
        .eq('user_id', userId)
        .eq('aktif', true)
        .maybeSingle()

      if (cancelled) return false

      if (profileError || !profile) {
        setUserProfile(null)
        setIsAdmin(false)
        setAuthError('Akun belum memiliki akses ke sistem. Silakan hubungi Admin.')
        return false
      }

      setUserProfile(profile)
      setIsAdmin(profile.role === 'admin')
      setAuthError('')
      return true
    }

    ;(async () => {
      const inviteHandled = await handleInviteCallback()
      if (cancelled || inviteHandled) return

      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(data.session || null)
      if (data.session?.user?.id) await loadUserAccess(data.session.user.id)
      if (!cancelled) setAuthReady(true)
    })()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return
      setSession(nextSession || null)
      if (nextSession?.user?.id) {
        setTimeout(() => loadUserAccess(nextSession.user.id), 0)
      } else {
        setUserProfile(null)
        setIsAdmin(false)
        setAuthError('')
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleInviteActivation(event) {
    event.preventDefault()
    if (!supabase) return

    const password = invitePassword
    const confirmation = invitePasswordConfirm

    if (password.length < 8) {
      setInviteActivationError('Password minimal 8 karakter.')
      return
    }

    if (password !== confirmation) {
      setInviteActivationError('Konfirmasi password tidak sama.')
      return
    }

    setInviteActivationLoading(true)
    setInviteActivationError('')
    setInviteActivationSuccess('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setInviteActivationError(updateError.message)
      setInviteActivationLoading(false)
      return
    }

    await supabase.auth.refreshSession()
    window.sessionStorage.removeItem('jadwal_invite_activation')
    setInvitePassword('')
    setInvitePasswordConfirm('')
    setInviteActivation(false)
    setInviteActivationSuccess('')
    await supabase.auth.signOut()
    setSession(null)
    setUserProfile(null)
    setIsAdmin(false)
    setAuthError('Password berhasil dibuat. Silakan login dengan email dan password baru Anda.')
    setInviteActivationLoading(false)
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (!supabase) return

    setAuthLoading(true)
    setAuthError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim(),
      password: adminPassword,
    })

    if (loginError) {
      setAuthError(loginError.message)
      setAuthLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id,nama,role,aktif,employee_id')
      .eq('user_id', data.user.id)
      .eq('aktif', true)
      .maybeSingle()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setUserProfile(null)
      setIsAdmin(false)
      setAuthError('Akun berhasil login, tetapi belum memiliki akses ke sistem. Silakan hubungi Admin.')
      setAuthLoading(false)
      return
    }

    setSession(data.session)
    setUserProfile(profile)
    setIsAdmin(profile.role === 'admin')
    setAdminPassword('')
    setAdminLoginOpen(false)
    setAuthLoading(false)
  }

  async function handleLogout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setUserProfile(null)
    setIsAdmin(false)
    setAdminPassword('')
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
    if (!supabaseConfigured || !supabase || !isAdmin) return

    let cancelled = false

    async function loadAdminMasterData() {
      const [{ data: employeeData, error: employeeError }, { data: codeData, error: codeError }] = await Promise.all([
        supabase
          .from('employees')
          .select('id,nama,aktif,department_id,departments(nama_departemen)')
          .eq('aktif', true)
          .order('nama'),
        supabase
          .from('schedule_codes')
          .select('id,kode,nama,keterangan')
          .eq('aktif', true)
          .order('id'),
      ])

      if (cancelled) return

      if (employeeError || codeError) {
        setAdminScheduleError(employeeError?.message || codeError?.message || 'Gagal memuat data master Admin.')
        return
      }

      setAdminEmployees(employeeData || [])
      setAdminScheduleCodes(codeData || [])
      setAdminEmployeeId(String(employeeData?.find((item) => item.departments?.nama_departemen === department)?.id || employeeData?.[0]?.id || ''))
      setAdminScheduleCodeId((current) => current || String(codeData?.find((item) => item.kode === 'L')?.id || codeData?.[0]?.id || ''))
    }

    loadAdminMasterData()

    return () => {
      cancelled = true
    }
  }, [isAdmin, department])

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return

    let cancelled = false

    async function loadEmployeeMaster() {
      const [{ data: employeeData, error: employeeError }, { data: departmentData, error: departmentError }, { data: jobData, error: jobError }] = await Promise.all([
        supabase
          .from('employees')
          .select('id,kode_karyawan,nama,aktif,department_id,job_id,tanggal_masuk,tanggal_keluar,keterangan,departments(id,nama_departemen),jobs(id,nama_job,department_id)')
          .order('nama'),
        supabase
          .from('departments')
          .select('id,nama_departemen')
          .eq('aktif', true)
          .order('nama_departemen'),
        supabase
          .from('jobs')
          .select('id,nama_job,department_id')
          .eq('aktif', true)
          .order('nama_job'),
      ])

      if (cancelled) return

      if (employeeError || departmentError || jobError) {
        setEmployeeFormError(employeeError?.message || departmentError?.message || jobError?.message || 'Gagal memuat master karyawan.')
        return
      }

      const employees = employeeData || []
      setEmployeeMasterRows(employees)
      setMasterDepartments(departmentData || [])
      setMasterJobs(jobData || [])
      setAdminEmployees(employees.filter((item) => item.aktif))

      if (!employeeFormDepartmentId && departmentData?.length) {
        setEmployeeFormDepartmentId(String(departmentData[0].id))
      }
    }

    loadEmployeeMaster()

    return () => {
      cancelled = true
    }
  }, [isAdmin, scheduleRefresh])

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !isAdmin) return
    let cancelled = false

    async function loadManagedUsers() {
      setUserManagementLoading(true)
      setUserManagementError('')
      const [{ data: profiles, error: profileError }, { data: scopes, error: scopeError }] = await Promise.all([
        supabase.from('user_profiles').select('user_id,nama,email,role,aktif,employee_id,created_at').order('created_at', { ascending: false }),
        supabase.from('user_access_scopes').select('user_id,department_id,departments(nama_departemen)').order('department_id'),
      ])

      if (cancelled) return
      if (profileError || scopeError) {
        setUserManagementError(profileError?.message || scopeError?.message || 'Gagal memuat pengguna.')
        setUserManagementLoading(false)
        return
      }

      const scopeMap = new Map()
      for (const item of scopes || []) {
        const current = scopeMap.get(item.user_id) || []
        current.push(item.departments?.nama_departemen || String(item.department_id))
        scopeMap.set(item.user_id, current)
      }

      setManagedUsers((profiles || []).map((profile) => ({
        ...profile,
        scopeNames: scopeMap.get(profile.user_id) || [],
      })))
      setUserManagementLoading(false)
    }

    loadManagedUsers()
    return () => { cancelled = true }
  }, [isAdmin, userManagementOpen, scheduleRefresh])

  const employeeMasterFilterJobs = useMemo(() => masterJobs.filter((item) => !employeeMasterDepartment || !item.department_id || String(item.department_id) === String(employeeMasterDepartment)).sort((a, b) => String(a.nama_job || '').localeCompare(String(b.nama_job || ''))), [masterJobs, employeeMasterDepartment])

  const filteredEmployeeMasterRows = useMemo(() => {
    const query = employeeMasterSearch.trim().toLowerCase()
    return employeeMasterRows
      .filter((employee) => employeeMasterStatus === 'semua' || (employeeMasterStatus === 'aktif' ? employee.aktif : !employee.aktif))
      .filter((employee) => !employeeMasterDepartment || String(employee.department_id || '') === String(employeeMasterDepartment))
      .filter((employee) => !employeeMasterJob || String(employee.job_id || '') === String(employeeMasterJob))
      .filter((employee) => !query || [employee.nama, employee.kode_karyawan, employee.departments?.nama_departemen, employee.jobs?.nama_job].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')))
  }, [employeeMasterRows, employeeMasterStatus, employeeMasterDepartment, employeeMasterJob, employeeMasterSearch])

  const employeeFormJobs = useMemo(
    () => masterJobs.filter((item) => !employeeFormDepartmentId || !item.department_id || String(item.department_id) === String(employeeFormDepartmentId)),
    [masterJobs, employeeFormDepartmentId],
  )

  function openEmployeeForm(employee = null) {
    if (!isAdmin) return

    setEmployeeFormEditMode(Boolean(employee))
    setEmployeeFormId(employee ? String(employee.id) : '')
    setEmployeeFormCode(employee?.kode_karyawan || '')
    setEmployeeFormName(employee?.nama || '')
    setEmployeeFormDepartmentId(employee ? String(employee.department_id || '') : String(masterDepartments[0]?.id || ''))
    setEmployeeFormJobId(employee?.job_id ? String(employee.job_id) : '')
    setEmployeeFormActive(employee ? Boolean(employee.aktif) : true)
    setEmployeeFormStartDate(employee?.tanggal_masuk || '')
    setEmployeeFormEndDate(employee?.tanggal_keluar || '')
    setEmployeeFormNote(employee?.keterangan || '')
    setEmployeeFormError('')
    setEmployeeFormSuccess('')
    setEmployeeFormOpen(true)
  }

  function openTransferForm(employee) {
    if (!isAdmin || !employee) return
    setTransferEmployee(employee)
    setTransferDepartmentId(String(employee.department_id || ''))
    setTransferJobId(String(employee.job_id || ''))
    setTransferEffectiveDate('')
    setTransferNote('')
    setTransferError('')
    setTransferSuccess('')
    setTransferFormOpen(true)
  }

  const transferFormJobs = useMemo(
    () => masterJobs.filter((item) => !transferDepartmentId || !item.department_id || String(item.department_id) === String(transferDepartmentId)),
    [masterJobs, transferDepartmentId],
  )

  function openUserForm() {
    if (!isAdmin) return
    setUserFormName('')
    setUserFormEmail('')
    setUserFormRole('supervisor_farm')
    setUserFormEmployeeId('')
    setUserFormError('')
    setUserFormSuccess('')
    setUserFormOpen(true)
  }

  function getUserScopeDepartmentIds(role) {
    if (role === 'supervisor_farm') {
      const item = masterDepartments.find((departmentItem) => departmentItem.nama_departemen === 'FARM')
      return item ? [Number(item.id)] : []
    }
    if (role === 'supervisor_hatchery') {
      const item = masterDepartments.find((departmentItem) => departmentItem.nama_departemen === 'HATCHERY')
      return item ? [Number(item.id)] : []
    }
    if (role === 'external') {
      return masterDepartments.map((item) => Number(item.id))
    }
    return []
  }

  async function handleUserFormSave(event) {
    event.preventDefault()
    if (!supabase || !isAdmin) return

    const nama = userFormName.trim()
    const email = userFormEmail.trim().toLowerCase()
    if (!nama || !email) {
      setUserFormError('Nama dan email wajib diisi.')
      return
    }

    const scopeDepartmentIds = getUserScopeDepartmentIds(userFormRole)
    if ((userFormRole === 'supervisor_farm' || userFormRole === 'supervisor_hatchery' || userFormRole === 'external') && scopeDepartmentIds.length === 0) {
      setUserFormError('Departemen untuk scope role belum tersedia.')
      return
    }

    setUserFormLoading(true)
    setUserFormError('')
    setUserFormSuccess('')

    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshedSession.session) {
      setUserFormError('Sesi Admin sudah berakhir. Silakan login kembali.')
      setUserFormLoading(false)
      return
    }
    setSession(refreshedSession.session)

    const { data, error: functionError } = await supabase.functions.invoke('admin-create-user', {
      body: {
        nama,
        email,
        role: userFormRole,
        employee_id: userFormEmployeeId ? Number(userFormEmployeeId) : null,
        scope_department_ids: scopeDepartmentIds,
      },
    })

    if (functionError) {
      let detail = ''
      try {
        const body = await functionError.context?.json?.()
        detail = body?.error || ''
      } catch {
        // Abaikan jika response bukan JSON.
      }
      setUserFormError(detail || functionError.message || 'Gagal membuat akun pengguna.')
      setUserFormLoading(false)
      return
    }

    if (data?.error) {
      setUserFormError(data.error)
      setUserFormLoading(false)
      return
    }

    setUserFormSuccess(data?.message || 'Undangan akun berhasil dikirim.')
    setUserFormLoading(false)
    setScheduleRefresh((value) => value + 1)
    setTimeout(() => setUserFormOpen(false), 900)
  }

  async function toggleManagedUser(user) {
    if (!supabase || !isAdmin || !user) return
    const nextActive = !user.aktif
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ aktif: nextActive, updated_at: new Date().toISOString() })
      .eq('user_id', user.user_id)

    if (updateError) {
      setUserManagementError(updateError.message)
      return
    }

    setManagedUsers((current) => current.map((item) => item.user_id === user.user_id ? { ...item, aktif: nextActive } : item))
  }

  async function deleteManagedUser(user) {
    if (!supabase || !isAdmin || !user || user.user_id === session?.user?.id) return

    const confirmed = window.confirm(
      'Hapus akun percobaan ini secara permanen?\\n\\n' +
      'Nama: ' + (user.nama || '—') + '\\n' +
      'Email: ' + (user.email || '—') + '\\n\\n' +
      'Untuk fase testing, akun yang sudah diaktivasi juga dapat dihapus.'
    )
    if (!confirmed) return

    setUserDeleteLoadingId(user.user_id)
    setUserManagementError('')

    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshedSession.session) {
      setUserManagementError('Sesi Admin sudah berakhir. Silakan login kembali.')
      setUserDeleteLoadingId('')
      return
    }
    setSession(refreshedSession.session)

    const { data, error: functionError } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: user.user_id },
    })

    if (functionError) {
      let detail = ''
      try {
        const body = await functionError.context?.json?.()
        detail = body?.error || ''
      } catch {
        // Abaikan jika response bukan JSON.
      }
      setUserManagementError(detail || functionError.message || 'Gagal menghapus akun.')
      setUserDeleteLoadingId('')
      return
    }

    if (data?.error) {
      setUserManagementError(data.error)
      setUserDeleteLoadingId('')
      return
    }

    setUserDeleteLoadingId('')
    setScheduleRefresh((value) => value + 1)
    setUserManagementError('')
    window.alert(data?.message || 'Akun berhasil dihapus.')
  }

  async function resendManagedUserInvite(user) {
    if (!supabase || !isAdmin || !user || user.user_id === session?.user?.id) return

    setUserResendLoadingId(user.user_id)
    setUserManagementError('')

    // Pastikan token Admin yang dikirim ke Edge Function masih segar.
    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshedSession.session) {
      setUserManagementError('Sesi Admin sudah berakhir. Silakan login kembali.')
      setUserResendLoadingId('')
      return
    }
    setSession(refreshedSession.session)

    const { data, error: functionError } = await supabase.functions.invoke('admin-resend-user-invite', {
      body: { user_id: user.user_id },
    })

    if (functionError) {
      let detail = ''
      try {
        const body = await functionError.context?.json?.()
        detail = body?.error || ''
      } catch {
        // Abaikan jika response bukan JSON.
      }
      setUserManagementError(detail || functionError.message || 'Gagal mengirim ulang undangan.')
      setUserResendLoadingId('')
      return
    }

    if (data?.error) {
      setUserManagementError(data.error)
      setUserResendLoadingId('')
      return
    }

    setUserManagementError('')
    setUserResendLoadingId('')
    setUserManagementOpen(true)
    setScheduleRefresh((value) => value + 1)
    window.alert(data?.message || 'Undangan baru berhasil dikirim.')
  }

  async function handleTransferSave(event) {
    event.preventDefault()
    if (!supabase || !isAdmin || !transferEmployee) return

    if (!transferDepartmentId || !transferEffectiveDate) {
      setTransferError('Departemen baru dan tanggal efektif wajib diisi.')
      return
    }

    if (String(transferDepartmentId) === String(transferEmployee.department_id || '') && String(transferJobId || '') === String(transferEmployee.job_id || '')) {
      setTransferError('Departemen dan JOB baru harus berbeda dari posisi saat ini.')
      return
    }

    setTransferLoading(true)
    setTransferError('')
    setTransferSuccess('')

    const { error: transferSaveError } = await supabase.rpc('transfer_employee_position', {
      p_employee_id: Number(transferEmployee.id),
      p_department_id: Number(transferDepartmentId),
      p_job_id: transferJobId ? Number(transferJobId) : null,
      p_tanggal_efektif: transferEffectiveDate,
      p_keterangan: transferNote.trim() || null,
    })

    if (transferSaveError) {
      setTransferError(transferSaveError.message)
      setTransferLoading(false)
      return
    }

    setTransferSuccess('Perpindahan jabatan berhasil disimpan.')
    setTransferLoading(false)
    setTransferFormOpen(false)
    setScheduleRefresh((value) => value + 1)
  }

  async function handleEmployeeFormSave(event) {
    event.preventDefault()
    if (!supabase || !isAdmin) return

    const name = employeeFormName.trim()
    if (!name) {
      setEmployeeFormError('Nama karyawan wajib diisi.')
      return
    }

    if (!employeeFormDepartmentId) {
      setEmployeeFormError('Departemen wajib dipilih.')
      return
    }

    if (!employeeFormActive && !employeeFormEndDate) {
      setEmployeeFormError('Tanggal berhenti wajib diisi untuk karyawan nonaktif.')
      return
    }

    if (employeeFormStartDate && employeeFormEndDate && employeeFormEndDate < employeeFormStartDate) {
      setEmployeeFormError('Tanggal berhenti tidak boleh lebih awal dari tanggal masuk.')
      return
    }

    setEmployeeFormLoading(true)
    setEmployeeFormError('')
    setEmployeeFormSuccess('')

    const payload = {
      kode_karyawan: employeeFormCode.trim() || null,
      nama: name,
      department_id: Number(employeeFormDepartmentId),
      job_id: employeeFormJobId ? Number(employeeFormJobId) : null,
      aktif: employeeFormActive,
      tanggal_masuk: employeeFormStartDate || null,
      tanggal_keluar: employeeFormActive ? null : (employeeFormEndDate || null),
      keterangan: employeeFormNote.trim() || null,
    }

    const result = employeeFormEditMode
      ? await supabase.from('employees').update(payload).eq('id', Number(employeeFormId))
      : await supabase.from('employees').insert(payload)

    if (result.error) {
      setEmployeeFormError(result.error.message)
      setEmployeeFormLoading(false)
      return
    }

    setEmployeeFormSuccess(employeeFormEditMode ? 'Data karyawan berhasil diperbarui.' : 'Karyawan baru berhasil ditambahkan.')
    setEmployeeFormLoading(false)
    setScheduleRefresh((value) => value + 1)
    setEmployeeFormOpen(false)
  }

  async function handleAdminScheduleSave(event) {
    event.preventDefault()
    if (!supabase || !isAdmin) return

    if (!adminEmployeeId || !adminScheduleDate || !adminScheduleCodeId) {
      setAdminScheduleError('Karyawan, tanggal, dan kode jadwal wajib diisi.')
      return
    }

    setAdminScheduleLoading(true)
    setAdminScheduleError('')
    setAdminScheduleSuccess('')

    const { error: saveError } = await supabase
      .from('employee_schedules')
      .upsert(
        {
          employee_id: Number(adminEmployeeId),
          tanggal: adminScheduleDate,
          schedule_code_id: Number(adminScheduleCodeId),
          keterangan: adminScheduleNote.trim() || null,
        },
        { onConflict: 'employee_id,tanggal' },
      )

    if (saveError) {
      setAdminScheduleError(saveError.message)
      setAdminScheduleLoading(false)
      return
    }

    setAdminScheduleSuccess(adminScheduleEditMode ? 'Jadwal berhasil diperbarui.' : 'Jadwal berhasil disimpan.')
    setAdminScheduleNote('')
    setScheduleRefresh((value) => value + 1)
    setAdminScheduleLoading(false)
  }

  function openAdminScheduleEditor(row, date, detail) {
    if (!isAdmin) return

    const codeId = adminScheduleCodes.find((item) => item.kode === detail?.code)?.id
    setAdminScheduleEditMode(Boolean(detail?.code))
    setAdminEmployeeId(String(row.employeeId))
    setAdminScheduleDate(date)
    setAdminScheduleCodeId(codeId ? String(codeId) : '')
    setAdminScheduleNote(detail?.note || '')
    setAdminScheduleError('')
    setAdminScheduleSuccess('')
    setSelectedCell(null)
    setAdminScheduleOpen(true)
  }

  async function openBulkScheduleEditor(row) {
    if (!supabase || !isAdmin) return

    const monthDate = new Date(startDate + 'T00:00:00')
    const monthStart = toInputDate(getMonthStart(monthDate))
    const monthEnd = toInputDate(getMonthEnd(monthDate))
    setBulkScheduleEmployee(row)
    setBulkScheduleValues({})
    setBulkScheduleError('')
    setBulkScheduleSuccess('')
    setBulkScheduleOpen(true)
    setBulkScheduleLoading(true)

    try {
      const { data, error: queryError } = await supabase
        .from('employee_schedules')
        .select('tanggal,schedule_code_id,keterangan,schedule_codes(kode)')
        .eq('employee_id', Number(row.employeeId))
        .gte('tanggal', monthStart)
        .lte('tanggal', monthEnd)
        .not('schedule_code_id', 'is', null)
        .order('tanggal')

      if (queryError) throw new Error(queryError.message)

      const grouped = {}
      for (const item of data || []) {
        const code = item.schedule_codes?.kode
        if (!code) continue
        const normalizedCode = code === 'OFF' ? 'L' : code
        if (!grouped[normalizedCode]) grouped[normalizedCode] = []
        grouped[normalizedCode].push(Number(String(item.tanggal).slice(-2)))
      }

      const values = {}
      for (const item of adminScheduleCodes) {
        values[item.kode] = (grouped[item.kode] || []).join(', ')
      }
      setBulkScheduleValues(values)
    } catch (queryError) {
      setBulkScheduleError(queryError.message || 'Gagal memuat jadwal karyawan.')
    } finally {
      setBulkScheduleLoading(false)
    }
  }

  function updateBulkScheduleValue(code, value) {
    setBulkScheduleValues((current) => ({ ...current, [code]: value }))
  }

  function parseBulkScheduleDates(value, monthStart, monthEnd) {
    const daysInMonth = Number(monthEnd.slice(-2))
    const values = String(value || '')
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
    const dates = []
    for (const item of values) {
      if (!/^\d{1,2}$/.test(item)) {
        throw new Error('Tanggal harus berupa nomor 1 sampai ' + daysInMonth + '.')
      }
      const day = Number(item)
      if (day < 1 || day > daysInMonth) {
        throw new Error('Tanggal ' + day + ' tidak ada pada bulan yang dipilih.')
      }
      const date = monthStart.slice(0, 8) + String(day).padStart(2, '0')
      if (!dates.includes(date)) dates.push(date)
    }
    return dates.sort()
  }

  async function handleBulkScheduleSave(event) {
    event.preventDefault()
    if (!supabase || !isAdmin || !bulkScheduleEmployee) return

    setBulkScheduleSaving(true)
    setBulkScheduleError('')
    setBulkScheduleSuccess('')

    try {
      const monthDate = new Date(startDate + 'T00:00:00')
      const monthStart = toInputDate(getMonthStart(monthDate))
      const monthEnd = toInputDate(getMonthEnd(monthDate))
      const desiredByDate = new Map()

      for (const code of adminScheduleCodes) {
        const dates = parseBulkScheduleDates(bulkScheduleValues[code.kode], monthStart, monthEnd)
        const codeId = Number(code.id)
        for (const date of dates) {
          if (desiredByDate.has(date) && desiredByDate.get(date).code !== code.kode) {
            throw new Error('Tanggal ' + Number(date.slice(-2)) + ' dimasukkan ke lebih dari satu kode jadwal.')
          }
          desiredByDate.set(date, { code: code.kode, codeId })
        }
      }

      const rows = [...desiredByDate.entries()].map(([date, item]) => ({
        date,
        codeId: item.codeId,
      }))

      const { error: saveError } = await supabase.rpc('save_employee_monthly_schedule', {
        p_employee_id: Number(bulkScheduleEmployee.employeeId),
        p_month_start: monthStart,
        p_month_end: monthEnd,
        p_rows: rows,
      })
      if (saveError) throw new Error(saveError.message)

      setBulkScheduleSuccess('Jadwal ' + bulkScheduleEmployee.name + ' untuk ' + MONTHS[monthDate.getMonth()] + ' ' + monthDate.getFullYear() + ' berhasil diperbarui.')
      setScheduleRefresh((value) => value + 1)
    } catch (saveError) {
      setBulkScheduleError(saveError.message || 'Gagal menyimpan jadwal.')
    } finally {
      setBulkScheduleSaving(false)
    }
  }

  async function deleteAdminSchedule(employeeId, date, employeeName) {
    if (!supabase || !isAdmin) return false

    const confirmed = window.confirm(
      `Hapus jadwal ${employeeName} pada ${formatDisplayDate(date)}? Tindakan ini tidak dapat dibatalkan.`,
    )
    if (!confirmed) return false

    setAdminDeleteLoading(true)
    setAdminDeleteError('')

    const { error: deleteError } = await supabase
      .from('employee_schedules')
      .delete()
      .eq('employee_id', Number(employeeId))
      .eq('tanggal', date)

    if (deleteError) {
      setAdminDeleteError(deleteError.message)
      setAdminDeleteLoading(false)
      return false
    }

    setAdminDeleteLoading(false)
    setAdminScheduleOpen(false)
    setSelectedCell(null)
    setScheduleRefresh((value) => value + 1)
    return true
  }

  async function handleAdminScheduleDelete() {
    if (!selectedCell?.detail?.code) return
    await deleteAdminSchedule(selectedCell.row.employeeId, selectedCell.date, selectedCell.row.name)
  }

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    function handleScroll() {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const delta = currentScrollY - lastScrollY

        if (currentScrollY <= 12) {
          setMobileNavHidden(false)
        } else if (delta > 4) {
          setMobileNavHidden(true)
        } else if (delta < -4) {
          setMobileNavHidden(false)
        }

        lastScrollY = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (invalidRange) return

    if (!session) {
      setRows([])
      setLoading(false)
      return
    }

    if (!supabaseConfigured || !supabase) {
      setRows([])
      setError('Supabase belum dikonfigurasi. Silakan periksa environment variable aplikasi.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadSchedule() {
      setLoading(true)
      setError('')

      const [{ data: employeeData, error: employeeError }, { data: scheduleData, error: scheduleError }] = await Promise.all([
        supabase
          .from('employees')
          .select('id,nama,aktif,departments(nama_departemen),jobs(nama_job)')
          .eq('aktif', true)
          .order('nama'),
        supabase
          .from('v_jadwal_karyawan')
          .select('employee_id,tanggal,nama_departemen,nama_job,nama_job_master,nama_karyawan,kode_jadwal,keterangan')
          .gte('tanggal', startDate)
          .lte('tanggal', endDate)
          .eq('nama_departemen', department)
          .order('nama_karyawan')
          .order('tanggal'),
      ])

      if (cancelled) return

      if (employeeError || scheduleError) {
        setError(employeeError?.message || scheduleError?.message || 'Gagal memuat data jadwal.')
        setLoading(false)
        return
      }

      const employees = (employeeData || []).filter(
        (item) => item.departments?.nama_departemen === department,
      )

      const grouped = new Map()

      for (const employee of employees) {
        const masterJob = employee.jobs?.nama_job || ''
        grouped.set(String(employee.id), {
          department,
          employeeId: employee.id,
          job: masterJob,
          jobs: new Set(masterJob ? [masterJob] : []),
          name: employee.nama,
          codes: {},
          details: {},
          assignmentDays: new Set(),
        })
      }

      for (const item of scheduleData || []) {
        const key = String(item.employee_id)
        const row = grouped.get(key)

        // Jadwal pada view dibatasi ke departemen yang sedang dipilih.
        // Jika master employee tidak ditemukan, abaikan record agar UI
        // tetap mengikuti master karyawan aktif.
        if (!row) continue

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
  }, [session?.user?.id, department, startDate, endDate, invalidRange, scheduleRefresh])

  useEffect(() => {
    const validIds = new Set(rows.map((row) => String(row.employeeId)))
    setSelectedEmployees((current) => current.filter((id) => validIds.has(id)))
  }, [rows])


  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="modal-kicker">Jadwal Karyawan</div>
          <h1>Memuat sistem...</h1>
          <p>Memeriksa sesi pengguna.</p>
        </div>
      </div>
    )
  }

  if (inviteActivation && session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="modal-kicker">Aktivasi Akun</div>
            <h1>Aktifkan Akun Anda</h1>
            <p>
              Selamat datang{userProfile?.nama ? ', ' + userProfile.nama : ''}.
              Silakan buat password untuk menyelesaikan aktivasi akun.
            </p>
          </div>
          <form className="admin-login-form" onSubmit={handleInviteActivation}>
            <label>Password Baru
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                minLength={8}
                required
              />
            </label>
            <label>Konfirmasi Password
              <input
                type="password"
                value={invitePasswordConfirm}
                onChange={(e) => setInvitePasswordConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Ulangi password"
                minLength={8}
                required
              />
            </label>
            {inviteActivationError && <div className="state error">{inviteActivationError}</div>}
            <button className="focus-toggle auth-submit" type="submit" disabled={inviteActivationLoading}>
              {inviteActivationLoading ? 'Mengaktifkan...' : 'Aktifkan Akun'}
            </button>
          </form>
          <p className="auth-help">Hak akses akun sudah ditentukan oleh sistem. Anda tidak perlu memilih posisi atau role.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="modal-kicker">Sistem Informasi</div>
            <h1>Jadwal Libur Karyawan</h1>
            <p>Silakan masuk untuk mengakses jadwal dan data sesuai hak akses Anda.</p>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>Email
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} autoComplete="username" placeholder="nama@perusahaan.com" required />
            </label>
            <label>Password
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoComplete="current-password" placeholder="Masukkan password" required />
            </label>
            {authError && <div className="state error">{authError}</div>}
            {!supabaseConfigured && <div className="state error">Konfigurasi Supabase belum tersedia.</div>}
            <button className="focus-toggle auth-submit" type="submit" disabled={authLoading || !supabaseConfigured}>{authLoading ? 'Memeriksa...' : 'Masuk ke Sistem'}</button>
          </form>
          <p className="auth-help">Belum memiliki akun? Hubungi Admin untuk mendapatkan akses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`app${focusMode ? ' focus-mode' : ''}`}>
      <aside className="side">
        <div className="brand">▣ Jadwal Karyawan<small>Database Jadwal & Absensi</small></div>
        <nav className="nav">
          <button type="button" className={activeTab === 'schedule' ? 'nav-settings active' : 'nav-settings'} onClick={() => setActiveTab('schedule')}>⌂ &nbsp; Jadwal Karyawan</button>
          <button type="button" className={activeTab === 'employees' ? 'nav-settings active' : 'nav-settings'} onClick={() => setActiveTab('employees')}>♟ &nbsp; Karyawan</button>
          <div>▦ &nbsp; Departemen</div>
          <div>▣ &nbsp; JOB</div>
          <div>☷ &nbsp; Kode Jadwal</div>
          <div>◷ &nbsp; Absensi</div>
          <div>▥ &nbsp; Laporan</div>
          <button type="button" className={settingsOpen ? "nav-settings active" : "nav-settings"} onClick={() => setSettingsOpen(true)}>⚙ &nbsp; Pengaturan</button>
        </nav>
      </aside>
      <header className="mobile-header">
        <div className="mobile-brand">
          <strong>Jadwal Karyawan</strong>
          <span>{activeTab === 'employees' ? 'Master Karyawan' : department}</span>
        </div>
        <button className="mobile-header-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Buka pengaturan">⚙</button>
      </header>

      <main className="main">
        <h1>{activeTab === 'employees' ? 'Master Karyawan' : 'Jadwal Karyawan'}</h1>
        <p className="sub">{activeTab === 'employees' ? 'Kelola data master karyawan dan status kepegawaian.' : 'Frontend awal berdasarkan Prototype UI v2'}</p>

        {activeTab === 'employees' ? (
          <section className="card employee-master-card">
            <div className="title">
              <div>
                <h2>Data Karyawan</h2>
                <div className="meta">{filteredEmployeeMasterRows.length} data ditampilkan</div>
              </div>
              {isAdmin && <button className="focus-toggle" type="button" onClick={() => openEmployeeForm()}>+ Tambah Karyawan</button>}
            </div>

            <div className="filters employee-master-filters">
              <div>
                <label>Cari Karyawan</label>
                <input value={employeeMasterSearch} onChange={(e) => setEmployeeMasterSearch(e.target.value)} placeholder="Nama atau kode karyawan..." />
              </div>
              <div>
                <label>Status</label>
                <select value={employeeMasterStatus} onChange={(e) => setEmployeeMasterStatus(e.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Berhenti / Nonaktif</option>
                  <option value="semua">Semua</option>
                </select>
              </div>
              <div>
                <label>Departemen</label>
                <select value={employeeMasterDepartment} onChange={(e) => { setEmployeeMasterDepartment(e.target.value); setEmployeeMasterJob('') }}>
                  <option value="">Semua</option>
                  {masterDepartments.map((item) => <option key={item.id} value={item.id}>{item.nama_departemen}</option>)}
                </select>
              </div>
              <div>
                <label>JOB</label>
                <select value={employeeMasterJob} onChange={(e) => setEmployeeMasterJob(e.target.value)}>
                  <option value="">Semua JOB</option>
                  {employeeMasterFilterJobs.map((item) => <option key={item.id} value={item.id}>{item.nama_job}</option>)}
                </select>
              </div>
            </div>

            {employeeFormError && !employeeFormOpen && <div className="state error">{employeeFormError}</div>}

            <div className="wrap employee-master-table-wrap">
              <table className="employee-master-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th className="employee-master-name">Nama Karyawan</th>
                    <th>Departemen</th>
                    <th>JOB</th>
                    <th>Tanggal Masuk</th>
                    <th>Tanggal Berhenti</th>
                    <th>Status</th>
                    {isAdmin && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployeeMasterRows.length === 0 && (
                    <tr><td colSpan={isAdmin ? 8 : 7}><div className="state">Tidak ada data karyawan yang sesuai.</div></td></tr>
                  )}
                  {filteredEmployeeMasterRows.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.kode_karyawan || '—'}</td>
                      <td className="employee-master-name">{employee.nama}</td>
                      <td>{employee.departments?.nama_departemen || '—'}</td>
                      <td>{employee.jobs?.nama_job || '—'}</td>
                      <td>{employee.tanggal_masuk || '—'}</td>
                      <td>{employee.tanggal_keluar || '—'}</td>
                      <td><span className={employee.aktif ? 'employee-status active' : 'employee-status inactive'}>{employee.aktif ? 'Aktif' : 'Berhenti'}</span></td>
                      {isAdmin && (
                        <td>
                          <div className="table-action-group">
                            <button className="table-action-button" type="button" onClick={() => openEmployeeForm(employee)}>Edit</button>
                            {employee.aktif && (
                              <button className="table-action-button transfer-action-button" type="button" onClick={() => openTransferForm(employee)}>Pindah Jabatan</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <>
        <section className="card">
          <div className="filters">
            <div><label>Dari Tanggal</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label>Sampai Tanggal</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div className="month-picker filter-month-picker">
              <label>Pilih Bulan</label>
              <button className="employee-picker-trigger" type="button" onClick={() => setMonthPickerOpen((open) => !open)}>
                {MONTHS[new Date(startDate + 'T00:00:00').getMonth()]} {startDate.slice(0, 4)}
                <span>⌄</span>
              </button>
              {monthPickerOpen && (
                <div className="month-picker-menu">
                  {MONTHS.map((month, index) => (
                    <button type="button" key={month} className={new Date(startDate + 'T00:00:00').getMonth() === index ? 'month-option active' : 'month-option'} onClick={() => selectMonth(index)}>{month}</button>
                  ))}
                </div>
              )}
            </div>
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
                      )                    })}
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
            </div>
            <div className="title-actions">
              <div className="download-menu">
                <button className="secondary download-trigger" type="button" onClick={() => setDownloadMenuOpen((open) => !open)} disabled={loading || filteredRows.length === 0}>
                  Download Jadwal <span>⌄</span>
                </button>
                {downloadMenuOpen && (
                  <div className="download-menu-list">
                    <button type="button" onClick={() => { exportExcel(filteredRows, dateRange, department, showJobColumn, startDate, endDate); setDownloadMenuOpen(false) }}>Excel</button>
                    <button type="button" onClick={() => { exportPdf(filteredRows, dateRange, department, showJobColumn, startDate, endDate); setDownloadMenuOpen(false) }}>PDF</button>
                  </div>
                )}
              </div>
              <button className="focus-toggle" type="button" onClick={toggleFocusMode}>
                {focusMode ? 'Kecilkan Jadwal' : 'Perbesar Jadwal'}
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
                <tbody>{filteredRows.map((row) => <tr key={row.employeeId || row.name}>{showJobColumn && <td className="sticky-job group">{row.job || '—'}</td>}<td className={showJobColumn ? "sticky-name" : "sticky-name no-job"}>{isAdmin ? <button type="button" className="schedule-name-button" onClick={() => openBulkScheduleEditor(row)} title="Atur jadwal bulanan">{row.name}</button> : row.name}</td>{dateRange.map(({ value }) => { const code = row.codes?.[value] || ''; const assignment = row.assignmentDays?.has(value); const detail = row.details?.[value]; return <td key={value}><button type="button" className={code ? assignment ? 'cell-button assignment' : `cell-button ${code}` : 'cell-button empty'} onClick={() => setSelectedCell({ row, date: value, detail })} title="Klik untuk melihat detail">{code || '—'}</button></td> })}</tr>)}</tbody>
              </table>
            </div>
          )}

        </section>

        <section className="card">
          <h3>Legenda Kode Jadwal</h3>
          <div className="legend">{[['P','Shift Pagi'],['S','Shift Sore'],['M','Shift Malam'],['L','Libur'],['CT','Cuti']].map(([code,label]) => <div key={code}><span className={code}>{code}</span>{label}</div>)}</div>
        </section>
          </>
        )}
      </main>

      <nav className={`mobile-bottom-nav${mobileNavHidden ? " hidden" : ""}`} aria-label="Navigasi utama">
        <button type="button" className={activeTab === 'schedule' ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setActiveTab('schedule')}>
          <span>⌂</span><small>Jadwal</small>
        </button>
        <button type="button" className={activeTab === 'employees' ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setActiveTab('employees')}>
          <span>♟</span><small>Karyawan</small>
        </button>
        <button type="button" className={settingsOpen ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setSettingsOpen(true)}>
          <span>⚙</span><small>Pengaturan</small>
        </button>
      </nav>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Konfigurasi Sistem</div>
                <h2 id="settings-title">Pengaturan</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setSettingsOpen(false)} aria-label="Tutup">×</button>
            </div>
            <div className="settings-section">
              <div>
                <strong>Pengelolaan Jadwal</strong>
                <p>Admin dapat menambah atau memperbarui jadwal karyawan berdasarkan tanggal.</p>
              </div>
              {isAdmin && (
                <button className="focus-toggle" type="button" onClick={() => {
                  setAdminScheduleEditMode(false)
                  setAdminScheduleError('')
                  setAdminScheduleSuccess('')
                  setAdminScheduleOpen(true)
                  setSettingsOpen(false)
                }}>Tambah Jadwal</button>
              )}
            </div>
            {isAdmin && (
              <div className="settings-section">
                <div>
                  <strong>Manajemen Pengguna</strong>
                  <p>Admin membuat akun, menentukan role, dan menentukan hak akses pengguna.</p>
                </div>
                <button className="focus-toggle" type="button" onClick={() => {
                  setUserManagementError('')
                  setUserManagementOpen(true)
                  setSettingsOpen(false)
                }}>Kelola Pengguna</button>
              </div>
            )}
            <div className="settings-section">
              <div>
                <strong>Akun Pengguna</strong>
                <p>{userProfile?.nama || session?.user?.email || 'Pengguna'} · {session?.user?.email || ''}</p>
              </div>
              <button className="admin-status-button" type="button" onClick={handleLogout}>Keluar</button>
            </div>
          </div>
        </div>
      )}

            {userManagementOpen && (
        <div className="modal-backdrop" onClick={() => !userFormLoading && setUserManagementOpen(false)}>
          <div className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="user-management-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Akses Sistem</div>
                <h2 id="user-management-title">Manajemen Pengguna</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setUserManagementOpen(false)} aria-label="Tutup">×</button>
            </div>

            <div className="settings-section">
              <div>
                <strong>Pengguna Sistem</strong>
                <p>Role dan scope ditentukan oleh Admin. User tidak memilih role sendiri.</p>
              </div>
              <button className="focus-toggle" type="button" onClick={openUserForm}>Tambah Pengguna</button>
            </div>

            {userManagementError && <div className="state error">{userManagementError}</div>}
            {userManagementLoading && <div className="state">Memuat pengguna...</div>}

            {!userManagementLoading && managedUsers.length === 0 && (
              <div className="state">Belum ada pengguna lain.</div>
            )}

            {!userManagementLoading && managedUsers.length > 0 && (
              <div className="wrap">
                <table>
                  <thead>
                    <tr><th>Nama</th><th>Email</th><th>Role</th><th>Scope</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {managedUsers.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.nama || '—'}</td>
                        <td>{user.email || '—'}</td>
                        <td>{user.role}</td>
                        <td>{user.scopeNames.length ? user.scopeNames.join(', ') : 'Semua departemen'}</td>
                        <td>{user.aktif ? 'Aktif' : 'Nonaktif'}</td>
                        <td>
                          {user.user_id !== session?.user?.id && (
                            <div className="detail-actions-group">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => resendManagedUserInvite(user)}
                                disabled={userResendLoadingId === user.user_id}
                              >
                                {userResendLoadingId === user.user_id ? 'Mengirim...' : 'Kirim Ulang Undangan'}
                              </button>
                              <button type="button" className="secondary" onClick={() => toggleManagedUser(user)}>
                                {user.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                type="button"
                                className="secondary danger"
                                onClick={() => deleteManagedUser(user)}
                                disabled={userResendLoadingId === user.user_id || userDeleteLoadingId === user.user_id}
                                title="Penghapusan akun testing"
                              >
                                {userDeleteLoadingId === user.user_id ? 'Menghapus...' : 'Hapus Akun'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {userFormOpen && (
        <div className="modal-backdrop" onClick={() => !userFormLoading && setUserFormOpen(false)}>
          <div className="modal admin-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Pembuatan Akun</div>
                <h2 id="user-form-title">Tambah Pengguna</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => !userFormLoading && setUserFormOpen(false)} aria-label="Tutup">×</button>
            </div>
            <form className="admin-schedule-form" onSubmit={handleUserFormSave}>
              <label>Nama Lengkap
                <input value={userFormName} onChange={(e) => setUserFormName(e.target.value)} placeholder="Nama pengguna" required />
              </label>
              <label>Email
                <input type="email" value={userFormEmail} onChange={(e) => setUserFormEmail(e.target.value)} placeholder="email@perusahaan.com" required />
              </label>
              <label>Role
                <select value={userFormRole} onChange={(e) => setUserFormRole(e.target.value)} required>
                  <option value="supervisor_farm">Supervisor Farm</option>
                  <option value="supervisor_hatchery">Supervisor Hatchery</option>
                  <option value="hrd">HRD</option>
                  <option value="manager">Manager</option>
                  <option value="external">External</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>Karyawan terkait
                <select value={userFormEmployeeId} onChange={(e) => setUserFormEmployeeId(e.target.value)}>
                  <option value="">Tidak terkait karyawan</option>
                  {employeeMasterRows.filter((item) => item.aktif).map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}{item.kode_karyawan ? ' — ' + item.kode_karyawan : ''}</option>
                  ))}
                </select>
              </label>
              <div className="state">
                <strong>Scope akses:</strong>{' '}
                {userFormRole === 'supervisor_farm' && 'FARM'}
                {userFormRole === 'supervisor_hatchery' && 'HATCHERY'}
                {userFormRole === 'external' && 'FARM + HATCHERY'}
                {(userFormRole === 'admin' || userFormRole === 'hrd' || userFormRole === 'manager') && 'Semua departemen'}
              </div>
              <div className="state">Setelah dibuat, undangan akan dikirim ke email pengguna untuk menyelesaikan pembuatan password.</div>
              {userFormError && <div className="state error">{userFormError}</div>}
              {userFormSuccess && <div className="admin-schedule-success">{userFormSuccess}</div>}
              <div className="admin-login-actions">
                <button className="secondary" type="button" onClick={() => setUserFormOpen(false)} disabled={userFormLoading}>Batal</button>
                <button className="focus-toggle" type="submit" disabled={userFormLoading}>{userFormLoading ? 'Membuat...' : 'Buat & Kirim Undangan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkScheduleOpen && (
        <div className="modal-backdrop" onClick={() => !bulkScheduleSaving && setBulkScheduleOpen(false)}>
          <div className="modal bulk-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-schedule-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Pengaturan Jadwal Bulanan</div>
                <h2 id="bulk-schedule-title">{bulkScheduleEmployee?.name || 'Karyawan'}</h2>
                <div className="bulk-schedule-period">{MONTHS[Number(startDate.slice(5, 7)) - 1]} {startDate.slice(0, 4)}</div>
              </div>
              <button className="modal-close" type="button" onClick={() => !bulkScheduleSaving && setBulkScheduleOpen(false)} aria-label="Tutup">×</button>
            </div>
            {bulkScheduleLoading ? (
              <div className="state">Memuat jadwal...</div>
            ) : (
              <form className="bulk-schedule-form" onSubmit={handleBulkScheduleSave}>
                <div className="bulk-schedule-help">
                  Isi nomor tanggal dipisahkan koma. Contoh: <strong>L = 1, 6, 9, 10</strong> atau <strong>M = 2, 3, 4, 10, 12, 13</strong>. Tanggal yang tidak masuk ke kode mana pun akan dikosongkan sehingga karyawan dianggap masuk kerja.
                </div>
                <div className="bulk-schedule-grid">
                  {adminScheduleCodes.map((item) => (
                    <label className="bulk-schedule-field" key={item.id}>
                      <span><b className={'schedule-code-badge ' + item.kode}>{item.kode}</b>{item.nama}</span>
                      <input
                        value={bulkScheduleValues[item.kode] || ''}
                        onChange={(e) => updateBulkScheduleValue(item.kode, e.target.value)}
                        placeholder="Contoh: 1, 6, 9, 10"
                        inputMode="numeric"
                      />
                    </label>
                  ))}
                </div>
                {bulkScheduleError && <div className="state error">{bulkScheduleError}</div>}
                {bulkScheduleSuccess && <div className="bulk-schedule-success">{bulkScheduleSuccess}</div>}
                <div className="bulk-schedule-actions">
                  <button className="secondary" type="button" onClick={() => setBulkScheduleOpen(false)} disabled={bulkScheduleSaving}>Tutup</button>
                  <button className="focus-toggle" type="submit" disabled={bulkScheduleSaving}>{bulkScheduleSaving ? 'Menyimpan...' : 'Simpan Jadwal Bulan Ini'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {adminLoginOpen && (
        <div className="modal-backdrop" onClick={() => !authLoading && setAdminLoginOpen(false)}>
          <div className="modal admin-login-modal" role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Akses Terbatas</div>
                <h2 id="admin-login-title">Masuk ke Sistem</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => !authLoading && setAdminLoginOpen(false)} aria-label="Tutup">×</button>
            </div>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <label>Email<input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} autoComplete="username" required /></label>
              <label>Password<input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoComplete="current-password" required /></label>
              {authError && <div className="state error">{authError}</div>}
              <div className="admin-login-actions">
                <button className="secondary" type="button" onClick={() => setAdminLoginOpen(false)} disabled={authLoading}>Batal</button>
                <button className="focus-toggle" type="submit" disabled={authLoading}>{authLoading ? 'Memeriksa...' : 'Login'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adminScheduleOpen && (
        <div className="modal-backdrop" onClick={() => !adminScheduleLoading && setAdminScheduleOpen(false)}>
          <div className="modal admin-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="admin-schedule-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Pengelolaan Jadwal</div>
                <h2 id="admin-schedule-title">{adminScheduleEditMode ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => !adminScheduleLoading && setAdminScheduleOpen(false)} aria-label="Tutup">×</button>
            </div>
            <form className="admin-schedule-form" onSubmit={handleAdminScheduleSave}>
              <label>Karyawan
                <select value={adminEmployeeId} onChange={(e) => setAdminEmployeeId(e.target.value)} required>
                  <option value="">Pilih karyawan</option>
                  {adminEmployees
                    .filter((item) => !department || item.departments?.nama_departemen === department)
                    .map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                </select>
              </label>
              <label>Tanggal
                <input type="date" value={adminScheduleDate} onChange={(e) => setAdminScheduleDate(e.target.value)} required />
              </label>
              <label>Kode Jadwal
                <select value={adminScheduleCodeId} onChange={(e) => setAdminScheduleCodeId(e.target.value)} required>
                  <option value="">Pilih kode jadwal</option>
                  {adminScheduleCodes.map((item) => <option key={item.id} value={item.id}>{item.kode} — {item.nama}</option>)}
                </select>
              </label>
              <label>Keterangan
                <textarea value={adminScheduleNote} onChange={(e) => setAdminScheduleNote(e.target.value)} placeholder="Opsional" rows="3" />
              </label>
              {adminScheduleError && <div className="state error">{adminScheduleError}</div>}
              {adminScheduleSuccess && <div className="admin-schedule-success">{adminScheduleSuccess}</div>}
              <div className="admin-login-actions">
                {adminScheduleEditMode && (
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => {
                      const employee = adminEmployees.find((item) => String(item.id) === String(adminEmployeeId))
                      deleteAdminSchedule(adminEmployeeId, adminScheduleDate, employee?.nama || 'Karyawan')
                    }}
                    disabled={adminScheduleLoading || adminDeleteLoading}
                  >
                    {adminDeleteLoading ? 'Menghapus...' : 'Hapus Jadwal'}
                  </button>
                )}
                <button className="secondary" type="button" onClick={() => setAdminScheduleOpen(false)} disabled={adminScheduleLoading}>Batal</button>
                <button className="focus-toggle" type="submit" disabled={adminScheduleLoading}>{adminScheduleLoading ? 'Menyimpan...' : 'Simpan Jadwal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeeFormOpen && (
        <div className="modal-backdrop" onClick={() => !employeeFormLoading && setEmployeeFormOpen(false)}>
          <div className="modal employee-form-modal" role="dialog" aria-modal="true" aria-labelledby="employee-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Master Karyawan</div>
                <h2 id="employee-form-title">{employeeFormEditMode ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => !employeeFormLoading && setEmployeeFormOpen(false)} aria-label="Tutup">×</button>
            </div>

            <form className="employee-form" onSubmit={handleEmployeeFormSave}>
              <div className="employee-form-grid">
                <label>Kode / ID Karyawan
                  <input value={employeeFormCode} onChange={(e) => setEmployeeFormCode(e.target.value)} placeholder="Contoh: EMP001" />
                </label>
                <label>Nama Lengkap *
                  <input value={employeeFormName} onChange={(e) => setEmployeeFormName(e.target.value)} placeholder="Nama karyawan" required />
                </label>
                <label>Departemen *
                  <select value={employeeFormDepartmentId} onChange={(e) => { setEmployeeFormDepartmentId(e.target.value); setEmployeeFormJobId('') }} required>
                    <option value="">Pilih departemen</option>
                    {masterDepartments.map((item) => <option key={item.id} value={item.id}>{item.nama_departemen}</option>)}
                  </select>
                </label>
                <label>JOB
                  <select value={employeeFormJobId} onChange={(e) => setEmployeeFormJobId(e.target.value)}>
                    <option value="">Belum ditentukan</option>
                    {employeeFormJobs.map((item) => <option key={item.id} value={item.id}>{item.nama_job}</option>)}
                  </select>
                </label>
                <label>Tanggal Masuk
                  <input type="date" value={employeeFormStartDate} onChange={(e) => setEmployeeFormStartDate(e.target.value)} />
                </label>
                <label>Tanggal Berhenti
                  <input type="date" value={employeeFormEndDate} onChange={(e) => setEmployeeFormEndDate(e.target.value)} disabled={employeeFormActive} />
                </label>
              </div>

              <div className="employee-status-editor">
                <div>
                  <label>Status Karyawan</label>
                  <div className="employee-status-toggle">
                    <button type="button" className={employeeFormActive ? 'status-choice active' : 'status-choice'} onClick={() => { setEmployeeFormActive(true); setEmployeeFormEndDate('') }}>Aktif</button>
                    <button type="button" className={!employeeFormActive ? 'status-choice inactive' : 'status-choice'} onClick={() => setEmployeeFormActive(false)}>Berhenti / Nonaktif</button>
                  </div>
                </div>
              </div>

              <label>Keterangan
                <textarea value={employeeFormNote} onChange={(e) => setEmployeeFormNote(e.target.value)} placeholder="Catatan internal karyawan (opsional)" rows="3" />
              </label>

              {employeeFormError && <div className="state error">{employeeFormError}</div>}
              {employeeFormSuccess && <div className="employee-form-success">{employeeFormSuccess}</div>}

              <div className="admin-login-actions">
                <button className="secondary" type="button" onClick={() => setEmployeeFormOpen(false)} disabled={employeeFormLoading}>Batal</button>
                <button className="focus-toggle" type="submit" disabled={employeeFormLoading}>{employeeFormLoading ? 'Menyimpan...' : 'Simpan Karyawan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferFormOpen && transferEmployee && (
        <div className="modal-backdrop" onClick={() => !transferLoading && setTransferFormOpen(false)}>
          <div className="modal employee-form-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-kicker">Mutasi Karyawan</div>
                <h2 id="transfer-form-title">Pindah Jabatan</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => !transferLoading && setTransferFormOpen(false)} aria-label="Tutup">×</button>
            </div>

            <form className="employee-form" onSubmit={handleTransferSave}>
              <div className="transfer-current-position">
                <div><span>Karyawan</span><strong>{transferEmployee.nama}</strong></div>
                <div><span>Posisi Saat Ini</span><strong>{transferEmployee.departments?.nama_departemen || '—'} / {transferEmployee.jobs?.nama_job || '—'}</strong></div>
              </div>

              <div className="employee-form-grid">
                <label>Departemen Baru *
                  <select value={transferDepartmentId} onChange={(e) => { setTransferDepartmentId(e.target.value); setTransferJobId('') }} required>
                    <option value="">Pilih departemen</option>
                    {masterDepartments.map((item) => <option key={item.id} value={item.id}>{item.nama_departemen}</option>)}
                  </select>
                </label>
                <label>JOB Baru
                  <select value={transferJobId} onChange={(e) => setTransferJobId(e.target.value)}>
                    <option value="">Belum ditentukan</option>
                    {transferFormJobs.map((item) => <option key={item.id} value={item.id}>{item.nama_job}</option>)}
                  </select>
                </label>
                <label>Tanggal Efektif *
                  <input type="date" value={transferEffectiveDate} onChange={(e) => setTransferEffectiveDate(e.target.value)} required />
                </label>
                <label>Keterangan
                  <input value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="Contoh: Mutasi internal" />
                </label>
              </div>

              <div className="state transfer-info">
                Jadwal sebelum tanggal efektif tetap menjadi riwayat posisi lama. Jadwal mulai tanggal efektif akan mengikuti Departemen dan JOB baru.
              </div>

              {transferError && <div className="state error">{transferError}</div>}
              {transferSuccess && <div className="employee-form-success">{transferSuccess}</div>}

              <div className="admin-login-actions">
                <button className="secondary" type="button" onClick={() => setTransferFormOpen(false)} disabled={transferLoading}>Batal</button>
                <button className="focus-toggle" type="submit" disabled={transferLoading}>{transferLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            {isAdmin && (
              <div className="detail-actions">
                <div className="detail-actions-group">
                  <button
                    className="focus-toggle"
                    type="button"
                    onClick={() => openAdminScheduleEditor(selectedCell.row, selectedCell.date, selectedCell.detail)}
                  >
                    {selectedCell.detail?.code ? 'Edit Jadwal' : 'Tambah Jadwal'}
                  </button>
                  {selectedCell.detail?.code && (
                    <button
                      className="danger-button"
                      type="button"
                      onClick={handleAdminScheduleDelete}
                      disabled={adminDeleteLoading}
                    >
                      {adminDeleteLoading ? 'Menghapus...' : 'Hapus Jadwal'}
                    </button>
                  )}
                </div>
                {adminDeleteError && <div className="state error detail-action-error">{adminDeleteError}</div>}
              </div>
            )}
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