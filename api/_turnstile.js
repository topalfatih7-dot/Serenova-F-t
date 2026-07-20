/**
 * Cloudflare Turnstile doğrulama.
 * Production'da TURNSTILE_SECRET_KEY zorunlu.
 * Localhost / Vite dev'de atlanır (Supabase CAPTCHA için service-role login kullanılır).
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
}

/** Vite / vercel dev / localhost — production dışı test. */
export function isLocalDevAuth(req) {
  if (process.env.ALLOW_LOCAL_AUTH_BYPASS === '1') return true
  if (process.env.ALLOW_LOCAL_AUTH_BYPASS === '0') return false

  const host = String(req?.headers?.host || req?.headers?.Host || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return true

  // Vercel prod / preview: asla otomatik bypass
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) return false
  if (process.env.NODE_ENV === 'production') return false

  return true
}

export async function verifyTurnstile(token, remoteip, req) {
  if (isLocalDevAuth(req)) {
    return { ok: true, skipped: true, reason: 'local-dev' }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (!secret) {
    if (isProd) {
      return { ok: false, status: 503, error: 'TURNSTILE_SECRET_KEY production ortamında zorunludur.' }
    }
    return { ok: true, skipped: true }
  }

  if (!token || typeof token !== 'string' || token.length < 10) {
    return { ok: false, status: 400, error: 'Bot doğrulaması gerekli. Sayfayı yenileyip tekrar deneyin.' }
  }

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (remoteip) body.set('remoteip', remoteip)

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json().catch(() => ({}))
    if (!data?.success) {
      return { ok: false, status: 403, error: 'Bot doğrulaması başarısız. Lütfen tekrar deneyin.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, status: 502, error: 'Bot doğrulama servisine ulaşılamadı.' }
  }
}
