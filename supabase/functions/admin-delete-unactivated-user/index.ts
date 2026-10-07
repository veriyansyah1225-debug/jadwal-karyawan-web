import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')

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
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData.user) {
      return json({ error: 'Sesi login tidak valid.' }, 401)
    }

    const callerId = authData.user.id
    const { data: caller, error: callerError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id,role,aktif')
      .eq('user_id', callerId)
      .maybeSingle()

    if (callerError || !caller || caller.role !== 'admin' || !caller.aktif) {
      return json({ error: 'Hanya Admin aktif yang dapat menghapus akun percobaan.' }, 403)
    }

    const body = await req.json()
    const targetUserId = String(body.user_id ?? '').trim()

    if (!targetUserId) {
      return json({ error: 'User ID pengguna wajib ditentukan.' }, 400)
    }

    if (targetUserId === callerId) {
      return json({ error: 'Akun Admin yang sedang digunakan tidak dapat dihapus.' }, 400)
    }

    const { data: targetData, error: targetError } =
      await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (targetError || !targetData.user) {
      return json({ error: 'Akun Auth pengguna tidak ditemukan.' }, 404)
    }

    const target = targetData.user
    if (target.email_confirmed_at || target.confirmed_at) {
      return json({
        error: 'Akun sudah diaktivasi. Gunakan Nonaktifkan, bukan Hapus Akun.',
      }, 400)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id,nama,email,role')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (profileError || !profile) {
      return json({ error: 'Profil pengguna tidak ditemukan.' }, 404)
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) {
      return json({ error: deleteError.message }, 400)
    }

    return json({
      ok: true,
      deleted_user_id: targetUserId,
      message: 'Akun yang belum diaktivasi berhasil dihapus.',
    })
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server.',
    }, 500)
  }
})
