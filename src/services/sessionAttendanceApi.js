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
export async function reportSessionAttendance({ sessionId, sessionType, event }) {
  const token = await getAccessToken()
  if (!token || !sessionId || !event) return { ok: false }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action: 'session-attendance',
        sessionId,
        sessionType,
        event,
      }),
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && json?.ok !== false, ...json }
  } catch {
    return { ok: false }
  }
}
