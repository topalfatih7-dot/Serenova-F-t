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

  const appMeta = user.app_metadata || {}
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

  const { error: signOutErr } = await admin.auth.admin.signOut(user.id, 'others')
  if (signOutErr) {
    return { ok: false, error: signOutErr.message || 'Diğer oturumlar kapatılamadı.' }
  }

  return { ok: true, sessionId }
}

/**
 * Login/signup yanıtında tek tur: claim + refresh_token ile güncel JWT.
 * Başarısızsa orijinal session döner (istemci arka planda claim edebilir).
 */
export async function claimAndRefreshSession(admin, session, {
  supabaseUrl,
  anonKey,
} = {}) {
  if (!session?.access_token || !admin) {
    return { ok: false, session: session || null, sessionId: null }
  }

  const { data: userData, error: userErr } = await admin.auth.getUser(session.access_token)
  if (userErr || !userData?.user) {
    return { ok: false, session, sessionId: null }
  }

  const claimed = await claimActiveSession(admin, userData.user, session.access_token)
  if (!claimed.ok) {
    return { ok: false, session, sessionId: null, error: claimed.error }
  }

  const refreshToken = session.refresh_token
  if (!refreshToken || !supabaseUrl || !anonKey) {
    return { ok: true, session, sessionId: claimed.sessionId, refreshed: false }
  }

  try {
    const res = await fetch(`${String(supabaseUrl).replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json?.access_token) {
      return {
        ok: true,
        sessionId: claimed.sessionId,
        refreshed: true,
        session: {
          access_token: json.access_token,
          refresh_token: json.refresh_token || refreshToken,
          expires_in: json.expires_in,
          expires_at: json.expires_at,
          token_type: json.token_type || 'bearer',
        },
      }
    }
  } catch {
    /* refresh yoksa claim yine de sunucuda tamamlandı */
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
