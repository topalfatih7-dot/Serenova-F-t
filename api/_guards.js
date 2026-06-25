/**
 * API route guard yardımcıları — kimlik doğrulama ve yetkilendirme.
 */
import { getUserFromRequest, getBearerToken } from './_apiAuth.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

const DEFAULT_ADMIN_EMAIL = 'admin@serenova.fit'

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase()
}

export function setCorsHeaders(res, methods = 'POST, OPTIONS', extraHeaders = 'Content-Type, Authorization') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', extraHeaders)
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}

export async function requireAuth(req) {
  const { user, error } = await getUserFromRequest(req)
  if (!user) {
    return { ok: false, status: 401, error: error || 'Oturum bulunamadı.' }
  }
  return { ok: true, user }
}

export async function requireAdmin(req) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth

  const email = (auth.user.email || '').toLowerCase()
  if (email === getAdminEmail()) {
    return { ok: true, user: auth.user, isAdmin: true }
  }

  const admin = getSupabaseAdmin()
  if (admin) {
    const { data } = await admin
      .from('members')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (data?.role === 'admin') {
      return { ok: true, user: auth.user, isAdmin: true }
    }
  }

  return { ok: false, status: 403, error: 'Bu işlem için admin yetkisi gerekli.' }
}

/**
 * Telegram / iletişim endpoint'leri — production'da secret zorunlu.
 */
export function requireNotifySecret(req) {
  const secret = process.env.TELEGRAM_NOTIFY_SECRET
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (!secret) {
    if (isProd) {
      return { ok: false, status: 503, error: 'TELEGRAM_NOTIFY_SECRET production ortamında zorunludur.' }
    }
    return { ok: true, skipped: true }
  }

  const header = req.headers['x-notify-secret']
  if (header !== secret) {
    return { ok: false, status: 401, error: 'Yetkisiz istek' }
  }
  return { ok: true }
}

/**
 * Vercel Cron veya manuel tetikleme — CRON_SECRET ile korunur.
 * Vercel otomatik olarak Authorization: Bearer <CRON_SECRET> gönderir.
 */
export function requireCronSecret(req) {
  const secret = process.env.CRON_SECRET
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (!secret) {
    if (isProd) {
      return { ok: false, status: 503, error: 'CRON_SECRET production ortamında zorunludur.' }
    }
    return { ok: true, skipped: true }
  }

  const auth = req.headers.authorization || ''
  if (auth === `Bearer ${secret}`) return { ok: true }

  const header = req.headers['x-cron-secret']
  if (header === secret) return { ok: true }

  return { ok: false, status: 401, error: 'Yetkisiz cron isteği' }
}

export { getBearerToken, getUserFromRequest }
