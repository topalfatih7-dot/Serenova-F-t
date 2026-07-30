/**
 * Üye bildirimleri — Expo Push (mobil) + WhatsApp (Meta Cloud API).
 * Eski başvuru notify yolu kapatıldı; formlar /api/contact kullanır.
 *
 * Multiplex:
 * - GET  → Meta webhook verify
 * - POST Meta (X-Hub-Signature-256) → delivery status
 * - POST { action: 'whatsapp-event', ... } → auth’lu olay fan-out
 * - POST { memberId, notification } → Expo (+ optional WA from notification type)
 */

import { setCorsHeaders, handleOptions, requireAuth, requireCronSecret } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import {
  isExpoPushToken,
  notificationToPushData,
  sendExpoPushMessages,
} from './_expoPush.js'
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

async function handleExpoPush(admin, body, res) {
  const memberId = body.memberId
  const notification = body.notification
  if (!notification?.title) {
    return res.status(400).json({ ok: false, error: 'notification.title gerekli' })
  }

  const { data: row, error } = await admin
    .from('members')
    .select('data')
    .eq('id', memberId)
    .maybeSingle()

  if (error) return res.status(500).json({ ok: false, error: error.message })

  const data = row?.data || {}
  const settings = data.settings || {}
  let expoResult = { ok: true, skipped: true, reason: 'pushNotifs or token' }

  if (settings.pushNotifs !== false) {
    const token = data.pushToken
    if (isExpoPushToken(token)) {
      const pushData = notificationToPushData(notification)
      expoResult = await sendExpoPushMessages([
        {
          to: token,
          title: String(notification.title).slice(0, 80),
          body: String(notification.message || notification.title).slice(0, 200),
          sound: 'default',
          data: pushData,
          channelId: 'default',
        },
      ])
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

  if (expoResult?.ok === false) {
    return res.status(502).json({ ok: false, error: expoResult.error, whatsapp: waResult })
  }
  return res.status(200).json({
    ok: true,
    sent: expoResult?.sent || 0,
    skipped: expoResult?.skipped,
    whatsapp: waResult,
  })
}

async function handleWhatsAppEvent(admin, body, auth, res) {
  const event = String(body.event || '')
  const userId = auth.user?.id

  if (event === 'appt_cancelled') {
    const actor = body.actor === 'staff' ? 'staff' : 'member'
    if (actor === 'member' && body.memberId && body.memberId !== userId) {
      return res.status(403).json({ ok: false, error: 'Yetkisiz' })
    }
    const result = await notifyAppointmentCancelled(admin, {
      memberId: body.memberId || userId,
      staffId: body.staffId || null,
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
    const result = await notifyAppointmentRescheduled(admin, {
      memberId: body.memberId || userId,
      staffId: body.staffId || null,
      sessionType: body.sessionType,
      oldStartsAt: body.oldStartsAt,
      newStartsAt: body.newStartsAt,
      sessionId: body.sessionId,
      actor,
    })
    return res.status(200).json(result)
  }

  if (event === 'program_ready') {
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
    if (!isParticipant && auth.role !== 'cron') {
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
    return handleWhatsAppEvent(admin, body, auth, res)
  }

  // Expo path (legacy + mobile)
  if (!body.memberId || !body.notification) {
    return res.status(410).json({
      ok: false,
      error: 'Formlar /api/contact; push için memberId + notification; WA için action=whatsapp-event.',
    })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  try {
    return await handleExpoPush(admin, body, res)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Notify hatası' })
  }
}
