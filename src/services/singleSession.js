/**
 * Tek aktif oturum — yeni girişte diğer cihaz/tarayıcı oturumları kapatılır.
 */
import { supabase } from './supabaseClient'
import { clearAllAuthTokens } from './authStorage'
import { getApiAuthHeaders } from './apiAuth'

export const SESSION_REVOKED_KEY = 'nf-session-revoked'
export const SESSION_REVOKED_MESSAGE = 'Hesabınız başka bir cihazdan açıldı. Güvenlik için bu oturum sonlandırıldı.'

/** JWT payload'dan session_id / app_metadata okur (yerel, ağ yok). */
function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** Yerel JWT ile aktif oturum kontrolü — API çağrısı yok. */
export function isActiveSessionLocal(accessToken) {
  const payload = parseJwtPayload(accessToken)
  if (!payload) return true
  const activeId = payload.app_metadata?.active_session_id
  if (!activeId) return true
  const sessionId = payload.session_id
  if (!sessionId) return false
  return sessionId === activeId
}

/** Yeni giriş — sunucuda aktif oturumu işaretle, diğerlerini kapat. */
export async function registerActiveSession() {
  if (!supabase) return { ok: false }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ action: 'claim-active-session' }),
    })
    const json = await res.json().catch(() => ({}))
    return { ok: Boolean(json.ok), sessionId: json.sessionId || null }
  } catch {
    return { ok: false }
  }
}

/**
 * Mevcut oturum hâlâ geçerli mi?
 * forceRemote=true: TOKEN_REFRESHED sonrası sunucu doğrulaması.
 * Aksi halde yalnızca yerel JWT karşılaştırması.
 */
export async function verifyActiveSession({ forceRemote = false } = {}) {
  if (!supabase) return true

  let { data } = await supabase.auth.getSession()
  if (!data?.session?.access_token) {
    await supabase.auth.getUser()
    ;({ data } = await supabase.auth.getSession())
  }
  if (!data?.session?.access_token) return true

  if (!forceRemote) {
    return isActiveSessionLocal(data.session.access_token)
  }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ action: 'verify-active-session' }),
    })
    const json = await res.json().catch(() => ({}))
    if (!json.ok) return true
    return json.valid !== false
  } catch {
    return true
  }
}

let verifyInFlight = null

/** Geçersiz oturumda çıkış yap ve login mesajı bırak. */
export async function verifyActiveSessionOrSignOut({ forceRemote = false } = {}) {
  if (!supabase) return true
  if (verifyInFlight) return verifyInFlight

  verifyInFlight = (async () => {
    const valid = await verifyActiveSession({ forceRemote })
    if (valid) return true

    try {
      sessionStorage.setItem(SESSION_REVOKED_KEY, '1')
    } catch { /* ignore */ }

    await supabase.auth.signOut()
    clearAllAuthTokens()
    return false
  })()

  try {
    return await verifyInFlight
  } finally {
    verifyInFlight = null
  }
}

export function consumeSessionRevokedMessage() {
  try {
    if (sessionStorage.getItem(SESSION_REVOKED_KEY) !== '1') return null
    sessionStorage.removeItem(SESSION_REVOKED_KEY)
    return SESSION_REVOKED_MESSAGE
  } catch {
    return null
  }
}
