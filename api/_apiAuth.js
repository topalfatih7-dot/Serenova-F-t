import { getSupabaseAdmin } from './_supabaseAdmin.js'

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

export async function getUserFromRequest(req) {
  const token = getBearerToken(req)
  if (!token) return { user: null, error: 'Oturum bulunamadı.' }

  const admin = getSupabaseAdmin()
  if (!admin) return { user: null, error: 'Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY).' }

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) {
    return { user: null, error: 'Oturum doğrulanamadı.' }
  }
  return { user: data.user, error: null }
}
