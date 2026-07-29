/**
 * Vercel Serverless — Daily.co oda + katılım tokeni.
 * Yetki: ilgili üye, atanmış personel veya admin.
 * Join penceresi sektör bazlı (api/_videoJoinWindows.js).
 */

import { setCorsHeaders, handleOptions, requireAuth, getAdminEmail } from './_guards.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { findSessionContext, resolveCaller } from './_sessionAttendance.js'
import {
  getSessionJoinTiming,
  normalizeVideoSessionType,
} from './_videoJoinWindows.js'

const DAILY_API = 'https://api.daily.co/v1'

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

function getDomain() {
  return (process.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getRoomPrefix() {
  return process.env.VITE_DAILY_ROOM_PREFIX || 'donusum'
}

function buildRoomName(sessionType, sessionId) {
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '')
  return `${getRoomPrefix()}-${sessionType}-${safeId}`.toLowerCase()
}

async function dailyFetch(path, body) {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY yok')
  const res = await fetch(`${DAILY_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Daily API ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

async function ensureRoom(roomName) {
  try {
    return await dailyFetch(`/rooms/${roomName}`)
  } catch (e) {
    if (!String(e).includes('404')) throw e
  }
  return dailyFetch('/rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      exp: Math.floor(Date.now() / 1000) + 7200,
      max_participants: 4,
      enable_screenshare: true,
      enable_chat: true,
      start_video_off: false,
      start_audio_off: false,
    },
  })
}

async function createToken(roomName, userName, isOwner) {
  return dailyFetch('/meeting-tokens', {
    properties: {
      room_name: roomName,
      user_name: userName || 'Katılımcı',
      is_owner: Boolean(isOwner),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000) - 60,
    },
  })
}

async function isAdminUser(admin, user) {
  const email = String(user?.email || '').toLowerCase()
  if (email && email === getAdminEmail()) return true
  if (!admin || !user?.id) return false
  const { data } = await admin
    .from('members')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  return data?.role === 'admin'
}

async function findSessionAsAdmin(admin, sessionId, sessionType) {
  const type = normalizeVideoSessionType(sessionType)
  const key = SESSION_KEYS[type]
  const { data: members, error } = await admin
    .from('members')
    .select('id, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
    .limit(500)
  if (error) return { ok: false, error: error.message }

  for (const row of members || []) {
    const list = row.data?.[key] || []
    const idx = list.findIndex((s) => s?.id === sessionId)
    if (idx >= 0) {
      return {
        ok: true,
        memberId: row.id,
        sessionType: type,
        session: list[idx],
        memberRow: row,
      }
    }
  }
  return { ok: false, error: 'Randevu bulunamadı.' }
}

function normalizeStaffRole(role) {
  if (role === 'dietitian' || role === 'doctor') return role
  return 'coach'
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!process.env.DAILY_API_KEY) {
    return res.status(503).json({ ok: false, error: 'DAILY_API_KEY tanımlı değil', code: 'config' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(503).json({ ok: false, error: 'Veritabanı yapılandırması eksik.', code: 'config' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const sessionType = normalizeVideoSessionType(body?.sessionType)
    const sessionId = String(body?.sessionId || '').trim()
    const userName = String(body?.userName || '').trim() || 'Katılımcı'

    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'sessionId gerekli', code: 'bad_request' })
    }

    const adminUser = await isAdminUser(admin, auth.user)
    let found
    let isOwner = false

    if (adminUser) {
      found = await findSessionAsAdmin(admin, sessionId, sessionType)
      isOwner = true
    } else {
      const caller = await resolveCaller(admin, auth.user)
      if (caller.kind === 'staff') {
        const staffRole = normalizeStaffRole(caller.role)
        if (staffRole !== sessionType) {
          return res.status(403).json({
            ok: false,
            error: 'Bu görüşme türüne erişiminiz yok.',
            code: 'forbidden',
          })
        }
      }
      found = await findSessionContext(admin, sessionId, sessionType, caller)
      isOwner = caller.kind === 'staff'
    }

    if (!found?.ok) {
      return res.status(403).json({
        ok: false,
        error: found?.error || 'Bu görüşmeye erişiminiz yok.',
        code: 'forbidden',
      })
    }

    if (found.session?.status !== 'scheduled') {
      return res.status(403).json({
        ok: false,
        error: 'Bu randevu aktif değil veya iptal edilmiş.',
        code: 'inactive',
      })
    }

    const timing = getSessionJoinTiming(found.session, sessionType)
    if (timing.isBeforeWindow) {
      return res.status(403).json({
        ok: false,
        error: 'Görüşme katılma penceresi henüz açılmadı.',
        code: 'too_early',
      })
    }
    if (timing.isExpired) {
      return res.status(403).json({
        ok: false,
        error: 'Görüşme süresi doldu.',
        code: 'expired',
      })
    }

    const roomName = buildRoomName(sessionType, sessionId)
    await ensureRoom(roomName)
    const tokenData = await createToken(roomName, userName, isOwner)
    const domain = getDomain()

    return res.status(200).json({
      ok: true,
      token: tokenData.token,
      roomUrl: domain ? `https://${domain}/${roomName}` : null,
      roomName,
      isOwner,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e), code: 'error' })
  }
}
