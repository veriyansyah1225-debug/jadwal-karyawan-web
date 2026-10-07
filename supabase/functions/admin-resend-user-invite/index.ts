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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Sesi login tidak ditemukan.' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await supabasePublic.auth.getUser(token)
    if (authError || !authData.user) {
      return json({ error: 'Sesi login tidak valid.' }, 401)
    }

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id,role,aktif')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (callerError || !caller || caller.role !== 'admin' || !caller.aktif) {
      return json({ error: 'Hanya Admin aktif yang dapat mengirim ulang undangan.' }, 403)
    }

    const body = await req.json()
    const targetUserId = String(body.user_id ?? '').trim()
    if (!targetUserId) {
      return json({ error: 'User ID pengguna wajib ditentukan.' }, 400)
    }

    if (targetUserId === authData.user.id) {
      return json({ error: 'Undangan ulang tidak dapat dilakukan untuk akun Admin yang sedang digunakan.' }, 400)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id,nama,email,role,aktif,employee_id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (profileError || !profile) {
      return json({ error: 'Data pengguna tidak ditemukan.' }, 404)
    }

    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (authUserError || !authUserData.user) {
      return json({ error: 'Akun Auth pengguna tidak ditemukan.' }, 404)
    }

    const authUser = authUserData.user
    if (authUser.email_confirmed_at || authUser.confirmed_at) {
      return json({
        error: 'Akun ini sudah dikonfirmasi. Kirim ulang undangan hanya tersedia untuk akun yang belum menyelesaikan aktivasi.',
      }, 400)
    }

    const { data: scopes, error: scopeError } = await supabaseAdmin
      .from('user_access_scopes')
      .select('department_id')
      .eq('user_id', targetUserId)

    if (scopeError) {
      return json({ error: scopeError.message }, 400)
    }

    const email = String(profile.email || authUser.email || '').trim().toLowerCase()
    if (!email) {
      return json({ error: 'Email pengguna tidak ditemukan.' }, 400)
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) {
      return json({ error: deleteError.message }, 400)
    }

    const { data: invited, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { nama: profile.nama },
        redirectTo: 'https://jadwal-karyawan-web.vercel.app',
      })

    if (inviteError || !invited.user) {
      return json({
        error: inviteError?.message ?? 'Akun lama sudah dihapus, tetapi undangan baru gagal dibuat. Silakan hubungi Admin untuk pemulihan akun.',
      }, 400)
    }

    const newUserId = invited.user.id

    const { error: newProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: newUserId,
        nama: profile.nama,
        email,
        role: profile.role,
        aktif: profile.aktif,
        employee_id: profile.employee_id,
      })

    if (newProfileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return json({ error: newProfileError.message }, 400)
    }

    if ((scopes || []).length > 0) {
      const { error: newScopeError } = await supabaseAdmin
        .from('user_access_scopes')
        .insert(
          scopes.map((scope) => ({
            user_id: newUserId,
            department_id: scope.department_id,
          }))
        )

      if (newScopeError) {
        await supabaseAdmin.from('user_profiles').delete().eq('user_id', newUserId)
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        return json({ error: newScopeError.message }, 400)
      }
    }

    return json({
      ok: true,
      old_user_id: targetUserId,
      user_id: newUserId,
      message: 'Undangan baru berhasil dikirim ke email pengguna.',
    })
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server.',
    }, 500)
  }
})
