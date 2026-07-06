import { getApiAuthHeaders } from './apiAuth.js'

export async function reportSessionAttendance({ sessionType, sessionId, event }) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        action: 'session-attendance',
        sessionType,
        sessionId,
        event,
      }),
    })
    const data = await res.json().catch(() => ({}))
    return data.ok ? data : null
  } catch {
    return null
  }
}

export async function fetchSessionRecordings({ sessionId, limit } = {}) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: await getApiAuthHeaders(),
    body: JSON.stringify({
      action: 'session-recordings-list',
      sessionId,
      limit,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) throw new Error(data.error || 'Kayıtlar yüklenemedi.')
  return data.recordings || []
}

export async function getSessionRecordingPlaybackUrl(recordingId) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: await getApiAuthHeaders(),
    body: JSON.stringify({
      action: 'session-recording-url',
      recordingId,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) throw new Error(data.error || 'Oynatma linki alınamadı.')
  return data.downloadUrl
}

export function formatRecordingDuration(seconds) {
  const sec = Number(seconds) || 0
  const mins = Math.floor(sec / 60)
  const rem = sec % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    return `${hrs} sa ${m} dk`
  }
  return `${mins}:${String(rem).padStart(2, '0')}`
}
