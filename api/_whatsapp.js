/**
 * WhatsApp Business Cloud API (Meta) — template send + webhook helpers.
 * Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN
 */

import crypto from 'crypto'

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0'
const TEMPLATE_LANG = 'tr'

/** Approved utility template names (must match Meta WhatsApp Manager). */
export const WA_TEMPLATES = {
  appt_confirmed_member: 'appt_confirmed_member',
  appt_confirmed_staff: 'appt_confirmed_staff',
  appt_reminder_24h: 'appt_reminder_24h',
  appt_reminder_1h: 'appt_reminder_1h',
  appt_cancelled: 'appt_cancelled',
  appt_rescheduled: 'appt_rescheduled',
  program_ready: 'program_ready',
  new_chat_message: 'new_chat_message',
}

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

/** E.164 / loose phone → digits only (Meta `to` field). */
export function toWhatsAppDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return digits
}

export function hashPhone(digits) {
  if (!digits) return null
  return crypto.createHash('sha256').update(digits).digest('hex').slice(0, 32)
}

export function formatWhenTr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const ROLE_LABELS = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
}

export function sessionTypeLabel(type) {
  return ROLE_LABELS[String(type || '').toLowerCase()] || 'Uzman'
}

export function siteUrl() {
  return String(process.env.APP_URL || process.env.VITE_SITE_URL || 'https://www.yeniform.com').replace(/\/$/, '')
}

function bodyParams(texts = []) {
  return [{
    type: 'body',
    parameters: texts.map((t) => ({
      type: 'text',
      text: String(t || '—').slice(0, 1024) || '—',
    })),
  }]
}

export function buildTemplateComponents(templateKey, params = {}) {
  switch (templateKey) {
    case 'appt_confirmed_member':
      return bodyParams([params.name, params.when, params.roleLabel])
    case 'appt_confirmed_staff':
      return bodyParams([params.memberName, params.when, params.roleLabel])
    case 'appt_reminder_24h':
    case 'appt_reminder_1h':
      return bodyParams([params.name, params.roleLabel, params.when])
    case 'appt_cancelled':
      return bodyParams([params.subjectName, params.when])
    case 'appt_rescheduled':
      return bodyParams([params.subjectName, params.oldWhen, params.newWhen])
    case 'program_ready':
      return bodyParams([params.memberName, params.staffName, params.programTitle])
    case 'new_chat_message':
      return bodyParams([params.recipientName, params.senderLabel])
    default:
      return bodyParams([])
  }
}

export function verifyWhatsAppWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return { ok: false, error: 'WHATSAPP_APP_SECRET eksik' }
  const expected = signatureHeader || ''
  const match = /^sha256=(.+)$/i.exec(expected)
  if (!match) return { ok: false, error: 'İmza başlığı yok' }
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(digest, 'utf8')
  const b = Buffer.from(match[1], 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'İmza geçersiz' }
  }
  return { ok: true }
}

export function verifyWhatsAppSubscribe(query = {}) {
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  const expected = process.env.WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' && expected && token === expected && challenge != null) {
    return { ok: true, challenge: String(challenge) }
  }
  return { ok: false }
}

async function insertLog(admin, row) {
  if (!admin) return
  try {
    await admin.from('whatsapp_delivery_log').insert(row)
  } catch {
    /* audit must not break send path */
  }
}

/**
 * Send an approved utility template.
 * @returns {{ ok: boolean, skipped?: boolean, reason?: string, messageId?: string, error?: string }}
 */
export async function sendWhatsAppTemplate(admin, {
  templateKey,
  toPhone,
  params = {},
  recipientRole = null,
  recipientId = null,
  event = null,
  settings = null,
} = {}) {
  if (!isWhatsAppConfigured()) {
    return { ok: true, skipped: true, reason: 'whatsapp_not_configured' }
  }

  if (settings && settings.whatsappNotifs === false) {
    await insertLog(admin, {
      recipient_role: recipientRole || 'member',
      recipient_id: recipientId || null,
      phone_hash: null,
      template: templateKey,
      status: 'skipped',
      error: 'opt_out',
      event,
    })
    return { ok: true, skipped: true, reason: 'opt_out' }
  }

  const templateName = WA_TEMPLATES[templateKey] || templateKey
  const digits = toWhatsAppDigits(toPhone)
  if (!digits) {
    await insertLog(admin, {
      recipient_role: recipientRole || 'member',
      recipient_id: recipientId || null,
      phone_hash: null,
      template: templateName,
      status: 'skipped',
      error: 'no_phone',
      event,
    })
    return { ok: true, skipped: true, reason: 'no_phone' }
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_TOKEN
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`
  const payload = {
    messaging_product: 'whatsapp',
    to: digits,
    type: 'template',
    template: {
      name: templateName,
      language: { code: TEMPLATE_LANG },
      components: buildTemplateComponents(templateKey, params),
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    const messageId = body?.messages?.[0]?.id || null

    if (!res.ok) {
      const errMsg = body?.error?.message || `WhatsApp HTTP ${res.status}`
      await insertLog(admin, {
        recipient_role: recipientRole || 'member',
        recipient_id: recipientId || null,
        phone_hash: hashPhone(digits),
        template: templateName,
        meta_message_id: messageId,
        status: 'failed',
        error: errMsg.slice(0, 500),
        event,
      })
      return { ok: false, error: errMsg }
    }

    await insertLog(admin, {
      recipient_role: recipientRole || 'member',
      recipient_id: recipientId || null,
      phone_hash: hashPhone(digits),
      template: templateName,
      meta_message_id: messageId,
      status: 'sent',
      event,
    })
    return { ok: true, messageId }
  } catch (err) {
    const errMsg = err?.message || 'WhatsApp send error'
    await insertLog(admin, {
      recipient_role: recipientRole || 'member',
      recipient_id: recipientId || null,
      phone_hash: hashPhone(digits),
      template: templateName,
      status: 'failed',
      error: errMsg.slice(0, 500),
      event,
    })
    return { ok: false, error: errMsg }
  }
}

/** Update delivery log rows when Meta sends status webhooks. */
export async function applyWhatsAppStatusUpdate(admin, statusObj) {
  const messageId = statusObj?.id
  const status = statusObj?.status
  if (!messageId || !status || !admin) return
  const error = statusObj?.errors?.[0]?.title || statusObj?.errors?.[0]?.message || null
  try {
    await admin
      .from('whatsapp_delivery_log')
      .update({
        status: String(status).slice(0, 40),
        ...(error ? { error: String(error).slice(0, 500) } : {}),
      })
      .eq('meta_message_id', messageId)
  } catch {
    /* ignore */
  }
}

export function memberPhoneFromData(data = {}) {
  return data.phone || ''
}

export function staffPhoneFromData(data = {}) {
  return data.phone || ''
}

export function memberWhatsAppSettings(data = {}) {
  return data.settings || {}
}

export function staffWhatsAppSettings(data = {}) {
  return data.settings || {}
}
