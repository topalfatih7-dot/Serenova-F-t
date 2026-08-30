/**
 * Üye / personel outbound Expo push.
 * Formlar /api/contact kullanır.
 *
 * POST { audience: 'staff', staffId, notification } → Expo to staff device
 * POST { memberId, notification } → Expo to member
 * Chat Expo never targets the authenticated sender (self-echo).
 */

import { setCorsHeaders, handleOptions, requireAuth, getAdminEmail } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { sendExpoPushToMember, sendExpoPushToStaff } from './_expoPush.js'

export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    // Vite local API middleware (ve bazı host’lar) body’yi önceden parse eder
    if (req.body != null && typeof req.on !== 'function') {
      const b = req.body
      if (Buffer.isBuffer(b)) return resolve(b)
      if (typeof b === 'string') return resolve(Buffer.from(b))
      return resolve(Buffer.from(JSON.stringify(b)))
    }
    if (req.readableEnded && req.body != null) {
      const b = req.body
      if (Buffer.isBuffer(b)) return resolve(b)
      if (typeof b === 'string') return resolve(Buffer.from(b))
      return resolve(Buffer.from(JSON.stringify(b)))
    }
    const chunks = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseJsonBody(raw) {
  if (!raw || !raw.length) return {}
  try {
    return JSON.parse(raw.toString('utf8') || '{}')
  } catch {
    return {}
  }
}

async function isAdminUser(admin, user) {
  const email = (user?.email || '').toLowerCase()
  if (email && email === getAdminEmail()) return true
  const { data } = await admin.from('members').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'admin'
}

async function canNotifyStaff(admin, authUser, staffId, hint = {}) {
  if (!staffId || !authUser?.id) return false
  if (authUser.id === staffId) return true
  if (await isAdminUser(admin, authUser)) return true

  const threadId = hint.threadId || null
  if (threadId) {
    const { data: collab } = await admin
      .from('staff_collab_threads')
      .select('coach_id, dietitian_id, doctor_id')
      .eq('id', threadId)
      .maybeSingle()
    if (collab) {
      const party = [collab.coach_id, collab.dietitian_id, collab.doctor_id]
        .filter(Boolean)
        .map((id) => String(id))
      if (party.includes(String(authUser.id)) && party.includes(String(staffId))) {
        return true
      }
    }
  }

  const { data: member } = await admin
    .from('members')
    .select('assigned_coach_id, assigned_dietitian_id, assigned_doctor_id')
    .eq('id', authUser.id)
    .maybeSingle()
  if (member) {
    if (
      member.assigned_coach_id === staffId
      || member.assigned_dietitian_id === staffId
      || member.assigned_doctor_id === staffId
    ) {
      return true
    }
    if (threadId) {
      const { data: thread } = await admin
        .from('chat_threads')
        .select('member_id, staff_id')
        .eq('id', threadId)
        .maybeSingle()
      if (thread?.member_id === authUser.id && thread?.staff_id === staffId) return true
    }
  }

  const { data: callerStaff } = await admin
    .from('staff')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle()
  if (!callerStaff) return false
  const { data: target } = await admin
    .from('staff')
    .select('id')
    .eq('id', staffId)
    .maybeSingle()
  return Boolean(target)
}

async function canNotifyMember(admin, authUser, memberId, hint = {}) {
  if (!memberId || !authUser?.id) return false
  if (authUser.id === memberId) return true
  if (await isAdminUser(admin, authUser)) return true

  const { data: staff } = await admin
    .from('staff')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle()
  if (!staff) return false

  const { data: member } = await admin
    .from('members')
    .select('assigned_coach_id, assigned_dietitian_id, assigned_doctor_id')
    .eq('id', memberId)
    .maybeSingle()
  if (!member) return false

  if (
    member.assigned_coach_id === authUser.id
    || member.assigned_dietitian_id === authUser.id
    || member.assigned_doctor_id === authUser.id
  ) {
    return true
  }

  const threadId = hint.threadId || null
  if (threadId) {
    const { data: thread } = await admin
      .from('chat_threads')
      .select('member_id, staff_id')
      .eq('id', threadId)
      .maybeSingle()
    if (thread?.member_id === memberId && thread?.staff_id === authUser.id) return true
  }

  const { data: anyThread } = await admin
    .from('chat_threads')
    .select('id')
    .eq('member_id', memberId)
    .eq('staff_id', authUser.id)
    .limit(1)
    .maybeSingle()
  if (anyThread) return true

  const { data: anyProgram } = await admin
    .from('programs')
    .select('id')
    .eq('member_id', memberId)
    .eq('staff_id', authUser.id)
    .limit(1)
    .maybeSingle()
  return Boolean(anyProgram)
}

/**
 * Personel telefon bildirimi. Top-level memberId asla Expo hedefi değildir
 * (danışan id’si oraya yazılırsa gönderen kendi mesajının push’unu alır).
 */
async function handleStaffOutbound(admin, body, auth, res) {
  const staffId = body.staffId
  const notification = body.notification
  if (!staffId || !notification?.title) {
    return res.status(400).json({ ok: false, error: 'staffId + notification.title gerekli' })
  }

  if (auth.role !== 'cron') {
    const allowed = await canNotifyStaff(admin, auth.user, staffId, {
      threadId: notification.threadId || body.threadId || null,
      memberId: notification.memberId || null,
    })
    if (!allowed) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
  }

  const actorId = auth.user?.id || null
  /**
   * Receiver-side fallback (staff app sees unread bump, notifies itself).
   * Echo-guard must use the *message author*, not the JWT actor — otherwise
   * collab/admin-chat self-notify is skipped as self_sender and the phone
   * never gets Expo (admin web sender hid this; collab has no web-admin path).
   */
  const isSelfNotify = Boolean(actorId && String(actorId) === String(staffId))
  const echoSenderId = isSelfNotify
    ? (notification.senderId || body.senderId || null)
    : actorId
  let expoPush = null
  if (body.expoPush !== false) {
    expoPush = await sendExpoPushToStaff(admin, staffId, {
      ...notification,
      audience: 'staff',
    }, { senderId: echoSenderId })
  }

  return res.status(200).json({ ok: true, expoPush })
}

/** In-app bildirim sonrası Expo fan-out. */
async function handleMemberOutbound(admin, body, auth, res) {
  const memberId = body.memberId
  const notification = body.notification
  if (!notification?.title) {
    return res.status(400).json({ ok: false, error: 'notification.title gerekli' })
  }

  if (auth.role !== 'cron') {
    const hint = {
      threadId: notification.threadId || body.threadId || null,
    }
    const allowed = await canNotifyMember(admin, auth.user, memberId, hint)
    if (!allowed) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
  }

  const actorId = auth.user?.id || null
  const isSelfChat =
    String(notification.type || '') === 'chat'
    && auth.role !== 'cron'
    && actorId
    && String(actorId) === String(memberId)

  let expoPush = null
  if (isSelfChat) {
    expoPush = { ok: true, skipped: true, reason: 'self_chat' }
  } else if (body.expoPush !== false) {
    expoPush = await sendExpoPushToMember(admin, memberId, notification, {
      senderId: actorId,
    })
  }

  return res.status(200).json({ ok: true, expoPush })
}

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, POST, OPTIONS', 'Content-Type, Authorization')) return
  setCorsHeaders(res, 'GET, POST, OPTIONS', 'Content-Type, Authorization', req)

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST bekleniyor' })
  }

  let raw
  try {
    raw = await readRawBody(req)
  } catch {
    return res.status(400).json({ ok: false, error: 'Gövde okunamadı' })
  }

  const body = parseJsonBody(raw)

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırılmadı' })
  }
  const admin = getSupabaseAdmin()

  if (body.action === 'whatsapp-event') {
    return res.status(410).json({ ok: false, error: 'WhatsApp bildirimi kaldırıldı.' })
  }

  const isStaffOutbound = body.audience === 'staff' && body.staffId && body.notification
  if (!isStaffOutbound && (!body.memberId || !body.notification)) {
    return res.status(410).json({
      ok: false,
      error: 'Formlar /api/contact; bildirim için memberId + notification.',
    })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const rl = await enforceRateLimit({
    req,
    prefix: 'notify-outbound',
    limit: 120,
    windowMs: 60 * 60 * 1000,
    extraKey: auth.user.id,
  })
  applyRateLimitHeaders(res, rl)
  if (!rl.ok) {
    return res.status(429).json({ ok: false, error: 'Çok fazla istek. Lütfen sonra tekrar deneyin.' })
  }

  try {
    if (isStaffOutbound) {
      return await handleStaffOutbound(admin, body, auth, res)
    }
    return await handleMemberOutbound(admin, body, auth, res)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Notify hatası' })
  }
}
