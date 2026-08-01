/** JWT access token içinden Supabase session_id çıkarır. */
export function parseSessionIdFromAccessToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    )
    return payload.session_id || null
  } catch {
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8'),
      )
      return payload.session_id || null
    } catch {
      return null
    }
  }
}

export async function claimActiveSession(admin, user, accessToken) {
  const sessionId = parseSessionIdFromAccessToken(accessToken)
  if (!sessionId) {
    return { ok: false, error: 'Oturum kimliği alınamadı.' }
  }
  if (!accessToken) {
    return { ok: false, error: 'Access token gerekli.' }
  }

  const appMeta = user.app_metadata || {}
  /* Zaten bu session claim’liyse metadata yazmayı atla */
  if (appMeta.active_session_id !== sessionId) {
    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...appMeta,
        active_session_id: sessionId,
        active_session_at: new Date().toISOString(),
      },
    })
    if (updateErr) {
      return { ok: false, error: updateErr.message || 'Aktif oturum kaydedilemedi.' }
    }
  }

  /*
   * GoTrueAdminApi.signOut(jwt, scope) — ilk argüman user.id DEĞİL, access token.
   * Diğer cihazları kapatmayı login kritik yolunda beklemeyiz (metadata zaten yazıldı).
   */
  void admin.auth.admin.signOut(accessToken, 'others').catch(() => {})

  return { ok: true, sessionId }
}

/**
 * Login/signup yanıtında tek tur: claim + refresh_token ile güncel JWT.
 * Başarısızsa orijinal session döner (istemci arka planda claim edebilir).
 */
function userFromSessionOrJwt(session) {
  if (session?.user?.id) return session.user
  const token = session?.access_token
  if (!token) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    if (!payload?.sub) return null
    return {
      id: payload.sub,
      app_metadata: payload.app_metadata || {},
      user_metadata: payload.user_metadata || {},
      email: payload.email || null,
    }
  } catch {
    return null
  }
}

export async function claimAndRefreshSession(admin, session, {
  supabaseUrl,
  anonKey,
} = {}) {
  if (!session?.access_token || !admin) {
    return { ok: false, session: session || null, sessionId: null }
  }

  /* getUser ağ turunu atla — grant session.user veya JWT sub yeterli */
  let user = userFromSessionOrJwt(session)
  if (!user?.id) {
    const { data: userData, error: userErr } = await admin.auth.getUser(session.access_token)
    if (userErr || !userData?.user) {
      return { ok: false, session, sessionId: null }
    }
    user = userData.user
  }

  const claimed = await claimActiveSession(admin, user, session.access_token)
  if (!claimed.ok) {
    return { ok: false, session, sessionId: null, error: claimed.error }
  }

  /*
   * Login kritik yolu: refresh_token ile JWT yenilemeyi BEKLEME (~0.5–1s).
   * İstemci sessionClaimed grace + markSessionClaimedLocally kullanır;
   * app_metadata bir sonraki doğal refresh’te gelir.
   */
  const refreshToken = session.refresh_token
  if (refreshToken && supabaseUrl && anonKey) {
    const base = String(supabaseUrl).replace(/\/$/, '')
    void fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {})
  }

  return { ok: true, session, sessionId: claimed.sessionId, refreshed: false }
}

export function isActiveSession(user, accessToken) {
  const activeId = user?.app_metadata?.active_session_id
  if (!activeId) return true
  const sessionId = parseSessionIdFromAccessToken(accessToken)
  /* session_id yoksa veya metadata henüz senkron değilse düşürme */
  if (!sessionId) return true
  return sessionId === activeId
}
