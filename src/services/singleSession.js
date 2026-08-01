/**
 * Tek aktif oturum — yeni girişte diğer cihaz/tarayıcı oturumları kapatılır.
 *
 * Önemli: access token içindeki app_metadata, claimActiveSession sonrası
 * yenilenene kadar ESKİ active_session_id taşır. Yerel JWT mismatch = iptal
 * kanıtı değildir; yalnızca eşleşme "kesin geçerli" sayılır.
 */
import { supabase } from './supabaseClient'
import { clearAllAuthTokens } from './authStorage'
import { getApiAuthHeaders } from './apiAuth'

export const SESSION_REVOKED_KEY = 'nf-session-revoked'
export const SESSION_REVOKED_MESSAGE = 'Hesabınız başka bir cihazdan açıldı. Güvenlik için bu oturum sonlandırıldı.'

/** claim tamamlandıktan sonra kısa süre verify atlanır (TOKEN_REFRESHED yarışı). */
const CLAIM_GRACE_MS = 15_000

let claimInFlight = null
let lastClaimOkAt = 0

/** JWT payload'dan session_id / app_metadata okur (yerel, ağ yok). */
function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

/**
 * Yerel kontrol:
 * - true: JWT'de active_session_id yok veya session ile eşleşiyor
 * - 'stale': metadata eski olabilir — asla tek başına çıkış nedeni olmaz
 */
export function isActiveSessionLocal(accessToken) {
  const payload = parseJwtPayload(accessToken)
  if (!payload) return true
  const activeId = payload.app_metadata?.active_session_id
  if (!activeId) return true
  const sessionId = payload.session_id
  if (!sessionId) return true
  if (sessionId === activeId) return true
  return 'stale'
}

/** password-login/signup zaten claim ettiyse istemci grace işaretler (ekstra POST yok). */
export function markSessionClaimedLocally() {
  lastClaimOkAt = Date.now()
}

/** Yeni giriş — sunucuda aktif oturumu işaretle, diğerlerini kapat, JWT yenile. */
export async function registerActiveSession() {
  if (!supabase) return { ok: false }
  if (claimInFlight) return claimInFlight
  if (lastClaimOkAt && Date.now() - lastClaimOkAt < CLAIM_GRACE_MS) {
    return { ok: true, sessionId: null, skipped: true }
  }

  claimInFlight = (async () => {
    try {
      /* password-login finalizeLoginSession JWT'yi zaten claim ettiyse POST atlama */
      const { data: sessData } = await supabase.auth.getSession()
      const token = sessData?.session?.access_token
      if (token && isActiveSessionLocal(token) === true) {
        const payload = parseJwtPayload(token)
        if (payload?.app_metadata?.active_session_id) {
          lastClaimOkAt = Date.now()
          return {
            ok: true,
            sessionId: payload.app_metadata.active_session_id,
            skipped: true,
          }
        }
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: await getApiAuthHeaders(),
        body: JSON.stringify({ action: 'claim-active-session' }),
      })
      const json = await res.json().catch(() => ({}))
      if (json.ok) {
        lastClaimOkAt = Date.now()
        /* JWT app_metadata'yı güncelle — aksi halde yerel mismatch false-positive üretir */
        try {
          await supabase.auth.refreshSession()
        } catch {
          /* yenileme başarısız olsa da claim sunucuda tamamlandı */
        }
      }
      return { ok: Boolean(json.ok), sessionId: json.sessionId || null }
    } catch {
      return { ok: false }
    } finally {
      claimInFlight = null
    }
  })()

  return claimInFlight
}

/**
 * Mevcut oturum hâlâ geçerli mi?
 * forceRemote=true: sunucu doğrulaması (TOKEN_REFRESHED).
 * Yerel mismatch tek başına false dönmez.
 */
export async function verifyActiveSession({ forceRemote = false } = {}) {
  if (!supabase) return true

  if (claimInFlight) {
    await claimInFlight
  }
  if (lastClaimOkAt && Date.now() - lastClaimOkAt < CLAIM_GRACE_MS) {
    return true
  }

  let { data } = await supabase.auth.getSession()
  if (!data?.session?.access_token) {
    await supabase.auth.getUser()
    ;({ data } = await supabase.auth.getSession())
  }
  if (!data?.session?.access_token) return true

  if (!forceRemote) {
    const local = isActiveSessionLocal(data.session.access_token)
    /* stale → arka planda sunucuya sorma (interval spam yok); güvenli taraf: geçerli say */
    return local === true || local === 'stale'
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
