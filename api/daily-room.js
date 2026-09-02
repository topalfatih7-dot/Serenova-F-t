/**
 * Vercel Serverless — Daily.co oda + katılım tokeni + (imzalı) webhook.
 * Yetki: ilgili üye, atanmış personel veya admin.
 * Join penceresi sektör bazlı (api/_videoJoinWindows.js).
 * Webhook: X-Webhook-Signature varsa participant.joined/left ve meeting.ended.
 */

import { setCorsHeaders, handleOptions, requireAuth, getAdminEmail } from './_guards.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { findSessionContext, resolveCaller, recordDailyPresenceEvent } from './_sessionAttendance.js'
import {
  getSessionJoinTiming,
  normalizeVideoSessionType,
} from './_videoJoinWindows.js'
import { VIDEO_ACTIVE_STATUSES } from '../src/utils/sessionCancelRules.js'
import {
  buildDailyRoomName,
  dailyApi,
  decodeDailyUserId,
  encodeDailyUserId,
  ensureDailyRoom,
  getDailyDomain,
  isDailyWebhookConfigured,
  parseDailyRoomName,
  readRawBody,
  unixToIso,
  verifyDailyWebhookSignature,
} from './_daily.js'

export const config = { api: { bodyParser: false } }

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
}

async function createToken(roomName, { userName, isOwner, userId, expUnix }) {
  const tokenExp = Math.min(
    Math.floor(Date.now() / 1000) + 3600,
    Number(expUnix) || Math.floor(Date.now() / 1000) + 3600,
  )
  return dailyApi('/meeting-tokens', {
    method: 'POST',
    body: {
      properties: {
        room_name: roomName,
        user_name: userName || 'Katılımcı',
        is_owner: Boolean(isOwner),
        user_id: userId || undefined,
        exp: tokenExp,
        nbf: Math.floor(Date.now() / 1000) - 60,
        eject_at_token_exp: true,
      },
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
    .select('id, assigned_coach_id, assigned_dietitian_id, data')
    .limit(500)
  if (error) return { ok: false, error: error.message }

  for (const row of members || []) {
    const list = row.data?.[key] || []
    const idx = list.findIndex((s) => String(s?.id || '').toLowerCase() === String(sessionId || '').toLowerCase())
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
  if (role === 'dietitian') return role
  return 'coach'
}

function header(req, name) {
  const direct = req.headers[name]
  if (direct) return Array.isArray(direct) ? direct[0] : direct
  const lower = req.headers[name.toLowerCase()]
  return Array.isArray(lower) ? lower[0] : lower
}

function parseJsonBuffer(raw) {
  try {
    return JSON.parse(raw.toString('utf8') || '{}')
  } catch {
    return null
  }
}

async function handleDailyWebhook(req, res, raw) {
  const payload = parseJsonBuffer(raw)
  if (payload?.test) {
    return res.status(200).json({ ok: true, test: true })
  }

  if (!isDailyWebhookConfigured()) {
    return res.status(503).json({ ok: false, error: 'Daily webhook gizli anahtarı yok.', code: 'config' })
  }

  const okSig = verifyDailyWebhookSignature({
    rawBody: raw,
    signature: header(req, 'x-webhook-signature'),
    timestamp: header(req, 'x-webhook-timestamp'),
    secret: process.env.DAILY_WEBHOOK_SECRET,
  })
  if (!okSig) {
    return res.status(401).json({ ok: false, error: 'Geçersiz Daily imzası.', code: 'bad_signature' })
  }

  const type = String(payload?.type || '')
  const data = payload?.payload || {}
  const parsed = parseDailyRoomName(data.room)
  if (!parsed) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'unknown-room' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(503).json({ ok: false, error: 'Veritabanı yapılandırması eksik.', code: 'config' })
  }

  if (type === 'meeting.ended') {
    const result = await recordDailyPresenceEvent(admin, {
      sessionId: parsed.sessionId,
      sessionType: parsed.sessionType,
      event: 'end',
      at: unixToIso(data.end_ts || payload.event_ts),
      endRoom: true,
    })
    return res.status(result.ok ? 200 : 400).json(result)
  }

  if (type !== 'participant.joined' && type !== 'participant.left') {
    return res.status(200).json({ ok: true, skipped: true, type })
  }

  const decoded = decodeDailyUserId(data.user_id)
  if (decoded?.kind === 'admin') {
    return res.status(200).json({ ok: true, skipped: true, reason: 'admin' })
  }
  let role = decoded?.kind === 'staff' ? 'staff' : decoded?.kind === 'member' ? 'member' : null
  if (!role) role = data.owner ? 'staff' : 'member'

  const event = type === 'participant.joined' ? 'join' : 'leave'
  const at = event === 'join'
    ? unixToIso(data.joined_at || payload.event_ts)
    : unixToIso(
      (Number(data.joined_at) > 0 && Number(data.duration) > 0)
        ? Number(data.joined_at) + Number(data.duration)
        : (payload.event_ts || Date.now() / 1000),
    )

  const result = await recordDailyPresenceEvent(admin, {
    sessionId: parsed.sessionId,
    sessionType: parsed.sessionType,
    role,
    event,
    at,
    dailySessionId: data.session_id || null,
    endRoom: false,
  })
  return res.status(result.ok ? 200 : 400).json(result)
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization, X-Webhook-Signature, X-Webhook-Timestamp', req)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  let raw
  try {
    raw = await readRawBody(req)
  } catch {
    return res.status(400).json({ ok: false, error: 'Gövde okunamadı.', code: 'bad_request' })
  }

  if (header(req, 'x-webhook-signature') || header(req, 'x-webhook-timestamp')) {
    return handleDailyWebhook(req, res, raw)
  }

  const parsedBody = parseJsonBuffer(raw)
  if (parsedBody?.test) {
    return res.status(200).json({ ok: true, test: true })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const rl = await enforceRateLimit({
    req,
    prefix: 'daily-room',
    limit: 60,
    windowMs: 60 * 60 * 1000,
    extraKey: auth.user.id,
  })
  applyRateLimitHeaders(res, rl)
  if (!rl.ok) {
    return res.status(429).json({ ok: false, error: 'Çok fazla istek. Lütfen sonra tekrar deneyin.', code: 'rate_limit' })
  }

  if (!process.env.DAILY_API_KEY) {
    return res.status(503).json({ ok: false, error: 'DAILY_API_KEY tanımlı değil', code: 'config' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(503).json({ ok: false, error: 'Veritabanı yapılandırması eksik.', code: 'config' })
  }

  try {
    const body = parsedBody || {}
    const sessionType = normalizeVideoSessionType(body?.sessionType)
    const sessionId = String(body?.sessionId || '').trim()
    const userName = String(body?.userName || '').trim() || 'Katılımcı'

    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'sessionId gerekli', code: 'bad_request' })
    }

    const adminUser = await isAdminUser(admin, auth.user)
    let found
    let isOwner = false
    let dailyUserId = ''

    if (adminUser) {
      found = await findSessionAsAdmin(admin, sessionId, sessionType)
      isOwner = true
      dailyUserId = encodeDailyUserId('admin', auth.user.id)
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
        dailyUserId = encodeDailyUserId('staff', caller.staffId)
      } else {
        dailyUserId = encodeDailyUserId('member', caller.memberId)
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

    const joinStatus = found.session?.status || 'scheduled'
    if (!VIDEO_ACTIVE_STATUSES.includes(joinStatus)) {
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

    const roomName = buildDailyRoomName(sessionType, sessionId)
    const expUnix = Math.max(
      Math.floor(timing.windowEnd.getTime() / 1000),
      Math.floor(Date.now() / 1000) + 60,
    )
    await ensureDailyRoom(roomName, expUnix)
    const tokenData = await createToken(roomName, {
      userName,
      isOwner,
      userId: dailyUserId,
      expUnix,
    })
    const domain = getDailyDomain()

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
