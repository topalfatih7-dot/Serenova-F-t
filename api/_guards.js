/**
 * API route guard yardımcıları — kimlik doğrulama ve yetkilendirme.
 */
import { getUserFromRequest, getBearerToken } from './_apiAuth.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { getAppUrl } from './_appUrl.js'

/** Canonical default — DB `platform_settings.admin_email` ile aynı tutulmalı. */
const DEFAULT_ADMIN_EMAIL = 'admin@yeniform.com'

/**
 * API admin e-postası.
 * Öncelik: ADMIN_EMAIL env → varsayılan. RLS `is_admin()` DB `platform_settings` okur;
 * env değiştirirseniz `platform_settings.admin_email` satırını da güncelleyin.
 */
export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase()
}

function isPrivateLanHostname(host) {
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  return false
}

/** Vite / Expo Metro (8081) / LAN IP — credential'sız POST; Turnstile veya mobil key hâlâ zorunlu. */
function isLocalSpaOrigin(origin) {
  try {
    const u = new URL(origin)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return isPrivateLanHostname(u.hostname)
  } catch {
    return false
  }
}

function allowedCorsOrigins() {
  const origins = new Set()
  try {
    origins.add(new URL(getAppUrl()).origin)
  } catch {
    /* ignore */
  }
  const extra = process.env.CORS_ALLOWED_ORIGINS || ''
  for (const part of extra.split(',')) {
    const o = part.trim().replace(/\/$/, '')
    if (o) origins.add(o)
  }
  // Yerel geliştirme: Vite (5173) + Next (3000) + Expo web (8081).
  // Not: yalnızca Origin yansıtılır; credential'sız POST + Turnstile hâlâ zorunlu.
  for (const origin of [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ]) {
    origins.add(origin)
  }
  return origins
}

export function setCorsHeaders(res, methods = 'POST, OPTIONS', extraHeaders = 'Content-Type, Authorization', req = null) {
  const origins = allowedCorsOrigins()
  const requestOrigin = String(req?.headers?.origin || '').trim()
  const allowOrigin =
    requestOrigin && (origins.has(requestOrigin) || isLocalSpaOrigin(requestOrigin))
      ? requestOrigin
      : [...origins][0] || getAppUrl()

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', extraHeaders)
}

export function handleOptions(req, res, methods = 'POST, OPTIONS', extraHeaders = 'Content-Type, Authorization') {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, methods, extraHeaders, req)
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
