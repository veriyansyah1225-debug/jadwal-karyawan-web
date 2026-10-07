import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')

const supabasePublic = createClient(SUPABASE_URL, publishableKeys.default ?? '', {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const supabaseAdmin = createClient(SUPABASE_URL, secretKeys.default ?? '', {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const allowedRoles = new Set(['admin','supervisor_farm','supervisor_hatchery','hrd','manager','external'])

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Sesi login tidak ditemukan.' }, 401)
    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await supabasePublic.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Sesi login tidak valid.' }, 401)

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('user_profiles').select('user_id,role,aktif').eq('user_id', authData.user.id).maybeSingle()
    if (callerError || !caller || caller.role !== 'admin' || !caller.aktif) {
      return json({ error: 'Hanya Admin aktif yang dapat membuat akun pengguna.' }, 403)
    }

    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const nama = String(body.nama ?? '').trim()
    const role = String(body.role ?? '').trim()
    const employeeId = body.employee_id ? Number(body.employee_id) : null
    const scopeDepartmentIds = Array.isArray(body.scope_department_ids)
      ? [...new Set(body.scope_department_ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0))]
      : []

    if (!email || !email.includes('@')) return json({ error: 'Email pengguna wajib diisi dengan benar.' }, 400)
    if (!nama) return json({ error: 'Nama pengguna wajib diisi.' }, 400)
    if (!allowedRoles.has(role)) return json({ error: 'Role pengguna tidak valid.' }, 400)
    if ((role === 'supervisor_farm' || role === 'supervisor_hatchery' || role === 'external') && scopeDepartmentIds.length === 0) {
      return json({ error: 'Scope departemen wajib ditentukan untuk role ini.' }, 400)
    }

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { nama } })
    if (inviteError || !invited.user) return json({ error: inviteError?.message ?? 'Gagal membuat undangan akun.' }, 400)

    const userId = invited.user.id
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      user_id: userId, nama, email, role, aktif: true, employee_id: employeeId,
    })
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return json({ error: profileError.message }, 400)
    }

    if (scopeDepartmentIds.length > 0) {
      const { error: scopeError } = await supabaseAdmin.from('user_access_scopes').insert(
        scopeDepartmentIds.map((department_id: number) => ({ user_id: userId, department_id }))
      )
      if (scopeError) {
        await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return json({ error: scopeError.message }, 400)
      }
    }

    return json({ ok: true, user_id: userId, message: 'Undangan akun berhasil dikirim ke email pengguna.' })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server.' }, 500)
  }
})
