import { supabase } from './supabaseClient'

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  } catch {
    return null
  }
}

/** Video join/leave → attendance + hakediş (best-effort). */
export async function reportSessionAttendance({ sessionId, sessionType, event, keepalive = false }) {
  const token = await getAccessToken()
  if (!token || !sessionId || !event) return { ok: false }

  const body = JSON.stringify({
    action: 'session-attendance',
    sessionId,
    sessionType,
    event,
  })

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
      keepalive: Boolean(keepalive),
    })
    if (keepalive) return { ok: res.ok }
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && json?.ok !== false, ...json }
  } catch {
    return { ok: false }
  }
}
