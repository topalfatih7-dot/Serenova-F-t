/**
 * Üye outbound bildirimleri — WhatsApp (Meta Cloud API) + in-app fan-out yardımcısı.
 * Formlar /api/contact kullanır.
 *
 * Multiplex:
 * - GET  → Meta webhook verify
 * - POST Meta (X-Hub-Signature-256) → delivery status
 * - POST { action: 'whatsapp-event', ... } → auth’lu olay fan-out
 * - POST { memberId, notification } → WhatsApp (program/chat tipleri)
 */

import { setCorsHeaders, handleOptions, requireAuth, requireCronSecret, getAdminEmail } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import {
  verifyWhatsAppSubscribe,
  verifyWhatsAppWebhookSignature,
  applyWhatsAppStatusUpdate,
} from './_whatsapp.js'
import {
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyProgramReady,
  notifyNewChatMessage,
} from './_whatsappEvents.js'

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

async function assertStaffActor(admin, auth, memberId) {
  if (auth.role === 'cron') return { ok: true }
  if (await isAdminUser(admin, auth.user)) return { ok: true }
  const { data: staff } = await admin
    .from('staff')
    .select('id')
    .eq('id', auth.user.id)
    .maybeSingle()
  if (!staff) return { ok: false, status: 403, error: 'Yalnızca personel' }
  if (memberId) {
    const allowed = await canNotifyMember(admin, auth.user, memberId)
    if (!allowed) return { ok: false, status: 403, error: 'Yetkisiz' }
  }
  return { ok: true }
}

/** In-app bildirim sonrası WhatsApp fan-out (program / chat). */
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

  let waResult = null
  if (body.whatsapp !== false) {
    const type = notification.type
    if (type === 'program') {
      waResult = await notifyProgramReady(admin, {
        memberId,
        staffName: body.staffName || null,
        title: body.programTitle || notification.message,
        programType: notification.programType || body.programType,
      })
    } else if (type === 'chat') {
      waResult = await notifyNewChatMessage(admin, {
        threadId: notification.threadId || body.threadId,
        senderType: 'staff',
        memberId,
        staffRole: notification.staffRole || body.staffRole,
      })
    }
  }

  return res.status(200).json({ ok: true, whatsapp: waResult })
}

async function handleWhatsAppEvent(admin, body, auth, res) {
  const event = String(body.event || '')
  const userId = auth.user?.id

  if (event === 'appt_cancelled') {
    const actor = body.actor === 'staff' ? 'staff' : 'member'
    if (actor === 'member' && body.memberId && body.memberId !== userId) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
    if (actor === 'staff') {
      const gate = await assertStaffActor(admin, auth, body.memberId || userId)
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error })
    }
    const result = await notifyAppointmentCancelled(admin, {
      memberId: body.memberId || userId,
      staffId: body.staffId || (actor === 'staff' ? userId : null),
      sessionType: body.sessionType,
      startsAt: body.startsAt,
      sessionId: body.sessionId,
      actor,
    })
    return res.status(200).json(result)
  }

  if (event === 'appt_rescheduled') {
    const actor = body.actor === 'staff' ? 'staff' : 'member'
    if (actor === 'member' && body.memberId && body.memberId !== userId) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
    if (actor === 'staff') {
      const gate = await assertStaffActor(admin, auth, body.memberId || userId)
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error })
    }
    const result = await notifyAppointmentRescheduled(admin, {
      memberId: body.memberId || userId,
      staffId: body.staffId || (actor === 'staff' ? userId : null),
      sessionType: body.sessionType,
      oldStartsAt: body.oldStartsAt,
      newStartsAt: body.newStartsAt,
      sessionId: body.sessionId,
      actor,
    })
    return res.status(200).json(result)
  }

  if (event === 'program_ready') {
    const gate = await assertStaffActor(admin, auth, body.memberId)
    if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error })
    if (!body.memberId) {
      return res.status(400).json({ ok: false, error: 'memberId gerekli' })
    }
    const result = await notifyProgramReady(admin, {
      memberId: body.memberId,
      staffName: body.staffName,
      title: body.title,
      programType: body.programType,
    })
    return res.status(200).json(result)
  }

  if (event === 'new_chat_message') {
    const threadId = body.threadId
    if (!threadId) return res.status(400).json({ ok: false, error: 'threadId gerekli' })
    const { data: thread } = await admin.from('chat_threads').select('member_id, staff_id').eq('id', threadId).maybeSingle()
    if (!thread) return res.status(404).json({ ok: false, error: 'thread yok' })
    const isParticipant = thread.member_id === userId || thread.staff_id === userId
    if (!isParticipant && auth.role !== 'cron' && !(await isAdminUser(admin, auth.user))) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
    const result = await notifyNewChatMessage(admin, {
      threadId,
      senderType: body.senderType,
      memberId: body.memberId || thread.member_id,
      staffId: body.staffId || thread.staff_id,
      staffRole: body.staffRole,
    })
    return res.status(200).json(result)
  }

  return res.status(400).json({ ok: false, error: 'Geçersiz whatsapp event' })
}

async function handleMetaWebhook(admin, raw, res) {
  const body = parseJsonBody(raw)
  if (body.object !== 'whatsapp_business_account') {
    return res.status(200).json({ ok: true, ignored: true })
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {}
      for (const st of value.statuses || []) {
        await applyWhatsAppStatusUpdate(admin, st)
      }
    }
  }
  return res.status(200).json({ ok: true })
}

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, POST, OPTIONS', 'Content-Type, Authorization, X-Hub-Signature-256, X-Cron-Secret')) return
  setCorsHeaders(res, 'GET, POST, OPTIONS', 'Content-Type, Authorization, X-Hub-Signature-256, X-Cron-Secret', req)

  if (req.method === 'GET') {
    const sub = verifyWhatsAppSubscribe(req.query || {})
    if (sub.ok) {
      res.status(200).send(sub.challenge)
      return
    }
    return res.status(403).json({ ok: false, error: 'Webhook doğrulama başarısız' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST bekleniyor' })
  }

  let raw
  try {
    raw = await readRawBody(req)
  } catch {
    return res.status(400).json({ ok: false, error: 'Gövde okunamadı' })
  }

  const hubSig = req.headers['x-hub-signature-256']
  if (hubSig) {
    const verified = verifyWhatsAppWebhookSignature(raw, hubSig)
    if (!verified.ok) {
      return res.status(401).json({ ok: false, error: verified.error })
    }
    if (!isSupabaseAdminConfigured()) {
      return res.status(200).json({ ok: true })
    }
    const admin = getSupabaseAdmin()
    return handleMetaWebhook(admin, raw, res)
  }

  const body = parseJsonBody(raw)

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırılmadı' })
  }
  const admin = getSupabaseAdmin()

  if (body.action === 'whatsapp-event') {
    const cron = requireCronSecret(req)
    if (cron.ok) {
      return handleWhatsAppEvent(admin, body, { user: { id: body.memberId }, role: 'cron' }, res)
    }
    const auth = await requireAuth(req)
    if (!auth.ok) {
      return res.status(auth.status).json({ ok: false, error: auth.error })
    }
    const rl = await enforceRateLimit({
      req,
      prefix: 'notify-wa-event',
      limit: 60,
      windowMs: 60 * 60 * 1000,
      extraKey: auth.user.id,
    })
    applyRateLimitHeaders(res, rl)
    if (!rl.ok) {
      return res.status(429).json({ ok: false, error: 'Çok fazla istek. Lütfen sonra tekrar deneyin.' })
    }
    return handleWhatsAppEvent(admin, body, auth, res)
  }

  if (!body.memberId || !body.notification) {
    return res.status(410).json({
      ok: false,
      error: 'Formlar /api/contact; bildirim için memberId + notification; WA için action=whatsapp-event.',
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
    return await handleMemberOutbound(admin, body, auth, res)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Notify hatası' })
  }
}
