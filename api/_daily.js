/**
 * Daily.co REST + webhook imza doğrulama.
 */
import crypto from 'node:crypto'

export const DAILY_API = 'https://api.daily.co/v1'

export function getDailyDomain() {
  return (process.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function getDailyRoomPrefix() {
  return process.env.VITE_DAILY_ROOM_PREFIX || 'donusum'
}

export function buildDailyRoomName(sessionType, sessionId) {
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '')
  const type = sessionType === 'dietitian' ? sessionType : 'coach'
  return `${getDailyRoomPrefix()}-${type}-${safeId}`.toLowerCase()
}

export function parseDailyRoomName(roomName) {
  const raw = String(roomName || '').trim().toLowerCase()
  const prefix = `${getDailyRoomPrefix().toLowerCase()}-`
  if (!raw.startsWith(prefix)) return null
  const rest = raw.slice(prefix.length)
  const m = rest.match(/^(coach|dietitian)-(.+)$/)
  if (!m) return null
  return { sessionType: m[1], sessionId: m[2] }
}

export function encodeDailyUserId(kind, id) {
  const k = kind === 'staff' || kind === 'admin' ? kind : 'member'
  return `${k}:${id}`
}

export function decodeDailyUserId(userId) {
  const s = String(userId || '')
  const i = s.indexOf(':')
  if (i < 1) return null
  const kind = s.slice(0, i)
  const id = s.slice(i + 1).trim()
  if (!id || !['member', 'staff', 'admin'].includes(kind)) return null
  return { kind, id }
}

export function isDailyWebhookConfigured() {
  return Boolean(String(process.env.DAILY_WEBHOOK_SECRET || '').trim())
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

/** Daily HMAC: base64-decoded secret, SHA256(`${timestamp}.${rawBody}`) → base64. */
export function verifyDailyWebhookSignature({ rawBody, signature, timestamp, secret }) {
  const hmacSecret = String(secret || process.env.DAILY_WEBHOOK_SECRET || '').trim()
  if (!hmacSecret || signature == null || timestamp == null || rawBody == null) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const ageSec = Math.abs(Date.now() / 1000 - ts)
  if (ageSec > 5 * 60) return false
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)
  let decoded
  try {
    decoded = Buffer.from(hmacSecret, 'base64')
  } catch {
    return false
  }
  if (!decoded.length) return false
  const computed = crypto
    .createHmac('sha256', decoded)
    .update(`${timestamp}.${body}`)
    .digest('base64')
  return timingSafeEqualString(computed, signature)
}

export async function dailyApi(path, { method, body } = {}) {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY yok')
  const verb = method || (body ? 'POST' : 'GET')
  const res = await fetch(`${DAILY_API}${path}`, {
    method: verb,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (res.status === 404) {
    const err = new Error(`Daily API 404: ${path}`)
    err.status = 404
    throw err
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Daily API ${res.status}: ${text.slice(0, 200)}`)
  }
  if (res.status === 204) return null
  const text = await res.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function ensureDailyRoom(roomName, expUnix) {
  const properties = {
    exp: expUnix,
    eject_at_room_exp: true,
    max_participants: 4,
    enable_screenshare: true,
    enable_chat: true,
    start_video_off: false,
    start_audio_off: false,
  }
  try {
    await dailyApi(`/rooms/${roomName}`)
    try {
      await dailyApi(`/rooms/${roomName}`, {
        method: 'POST',
        body: { properties: { exp: expUnix, eject_at_room_exp: true } },
      })
    } catch {
      /* mevcut oda: exp güncellenemese de token verilir */
    }
    return { name: roomName, updated: true }
  } catch (e) {
    if (e?.status !== 404) throw e
  }
  return dailyApi('/rooms', {
    method: 'POST',
    body: { name: roomName, privacy: 'private', properties },
  })
}

export async function deleteDailyRoom(roomName) {
  if (!roomName) return { ok: true, skipped: true }
  try {
    await dailyApi(`/rooms/${encodeURIComponent(roomName)}`, { method: 'DELETE' })
    return { ok: true }
  } catch (e) {
    if (e?.status === 404) return { ok: true, missing: true }
    return { ok: false, error: e?.message || String(e) }
  }
}

export function unixToIso(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString()
  const ms = n > 1e12 ? n : n * 1000
  return new Date(ms).toISOString()
}

export async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
