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

export function isActiveSession(user, accessToken) {
  const activeId = user?.app_metadata?.active_session_id
  if (!activeId) return true
  const sessionId = parseSessionIdFromAccessToken(accessToken)
  /* session_id yoksa veya metadata henüz senkron değilse düşürme */
  if (!sessionId) return true
  return sessionId === activeId
}
