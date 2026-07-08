/**
 * Tek aktif oturum — yeni girişte diğer cihaz/tarayıcı oturumları kapatılır.
 */
import { supabase } from './supabaseClient'
import { clearAllAuthTokens } from './authStorage'
import { getApiAuthHeaders } from './apiAuth'

export const SESSION_REVOKED_KEY = 'nf-session-revoked'
export const SESSION_REVOKED_MESSAGE = 'Hesabınız başka bir cihazdan açıldı. Güvenlik için bu oturum sonlandırıldı.'

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

/** Mevcut oturum hâlâ geçerli mi? false → başka yerden giriş yapılmış. */
export async function verifyActiveSession() {
  if (!supabase) return true

  let { data } = await supabase.auth.getSession()
  if (!data?.session?.access_token) {
    await supabase.auth.getUser()
    ;({ data } = await supabase.auth.getSession())
  }
  if (!data?.session?.access_token) return true

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
export async function verifyActiveSessionOrSignOut() {
  if (!supabase) return true
  if (verifyInFlight) return verifyInFlight

  verifyInFlight = (async () => {
    const valid = await verifyActiveSession()
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
