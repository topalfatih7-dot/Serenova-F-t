/**
 * Daily.co REST API yardımcıları (sunucu tarafı).
 */

export const DAILY_API = 'https://api.daily.co/v1'

export function getDailyDomain() {
  return (process.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export async function dailyFetch(path, body, method = body ? 'POST' : 'GET') {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY yok')
  const res = await fetch(`${DAILY_API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Daily API ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

export function parseRoomName(roomName) {
  const parts = String(roomName || '').split('-')
  if (parts.length < 3) return null
  const sessionType = parts[1]
  if (!['coach', 'dietitian', 'doctor'].includes(sessionType)) return null
  return {
    sessionType,
    sessionId: parts.slice(2).join('-'),
  }
}

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

/** Oda adından üye + seans bilgisini bul */
export async function resolveSessionFromRoom(admin, roomName) {
  const parsed = parseRoomName(roomName)
  if (!parsed) return null

  const { data: rows, error } = await admin.from('members').select('id, name, data')
  if (error || !rows?.length) return null

  const key = SESSION_KEYS[parsed.sessionType]
  for (const row of rows) {
    const sessions = row.data?.[key] || []
    const session = sessions.find((s) => s.id === parsed.sessionId)
    if (session) {
      return {
        memberId: row.id,
        memberName: row.name || '',
        staffName: session.coach || '',
        session,
        ...parsed,
      }
    }
  }
  return { ...parsed, memberId: null, memberName: '', staffName: '', session: null }
}

export async function getRecordingAccessLink(recordingId) {
  return dailyFetch(`/recordings/${recordingId}/access-link`)
}

export async function stopRoomRecording(roomName) {
  try {
    return await dailyFetch(`/rooms/${roomName}/recordings/stop`, {})
  } catch (e) {
    if (String(e).includes('404') || String(e).includes('not-recording')) return null
    throw e
  }
}
