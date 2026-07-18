/**
 * Turnstile sonrası kısa ömürlü form oturumu (çoklu belge yükleme).
 * HMAC imzalı; secret yalnızca sunucuda.
 */
import crypto from 'node:crypto'

const TTL_MS = 30 * 60 * 1000

function getSecret() {
  return (
    process.env.FORM_SESSION_SECRET ||
    process.env.TELEGRAM_NOTIFY_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

function sign(payload) {
  const secret = getSecret()
  if (!secret) return ''
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export function issueFormSession({ ip, kind = 'staff' }) {
  const secret = getSecret()
  if (!secret) {
    /* local: sabit geçici oturum */
    const exp = Date.now() + TTL_MS
    return Buffer.from(JSON.stringify({ kind, ip: ip || '', exp, sig: 'dev' }), 'utf8').toString('base64url')
  }
  const exp = Date.now() + TTL_MS
  const base = `${kind}|${ip || ''}|${exp}`
  const sig = sign(base)
  return Buffer.from(JSON.stringify({ kind, ip: ip || '', exp, sig }), 'utf8').toString('base64url')
}

export function verifyFormSession(token, { ip: _ip, kind = 'staff' } = {}) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Form oturumu gerekli' }
  }
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const data = JSON.parse(raw)
    if (!data?.exp || data.exp < Date.now()) {
      return { ok: false, error: 'Form oturumu süresi doldu. Doğrulamayı yenileyin.' }
    }
    if (data.kind && kind && data.kind !== kind) {
      return { ok: false, error: 'Geçersiz form oturumu' }
    }
    const secret = getSecret()
    if (!secret) {
      return data.sig === 'dev' ? { ok: true, session: data } : { ok: false, error: 'Geçersiz form oturumu' }
    }
    const base = `${data.kind}|${data.ip || ''}|${data.exp}`
    const expected = sign(base)
    const got = String(data.sig || '')
    if (expected.length !== got.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))) {
      return { ok: false, error: 'Geçersiz form oturumu' }
    }
    /* IP değişimi (mobil ağ) için esnek: imza zaten ip içeriyor; eşleşmezse yine de süre+sig geçerliyse kabul et */
    return { ok: true, session: data }
  } catch {
    return { ok: false, error: 'Geçersiz form oturumu' }
  }
}
