/**
 * Admin sepet göndericisi — telefon bildirimi XOR e-posta.
 * GET: token listesi + geçmiş
 * POST: { channel, title, message, recipients: [{ audience, id }] }
 */

import { setCorsHeaders, handleOptions, requireAdmin } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { sendExpoPushToMember, sendExpoPushToStaff } from './_expoPush.js'
import { sendMail, adminBroadcastEmail, isMailConfigured } from './_mailer.js'

export const config = { maxDuration: 60 }

const CORS_METHODS = 'GET, POST, OPTIONS'
const MAX_RECIPIENTS = 50
const MAX_TITLE = 80
const MAX_BODY = 1500
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseBody(req) {
  if (req.body == null || req.body === '') return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

function trimStr(v, max) {
  return String(v || '').trim().slice(0, max)
}

function isUuid(v) {
  return UUID_RE.test(String(v || ''))
}

function notifId() {
  return `n-announcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    adminEmail: row.admin_email,
    channel: row.channel,
    title: row.title,
    body: row.body,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    skipCount: row.skip_count,
    failCount: row.fail_count,
    results: Array.isArray(row.results) ? row.results : [],
    createdAt: row.created_at,
  }
}

async function handleGet(admin, res) {
  const [{ data: tokens, error: tokErr }, { data: messages, error: histErr }] = await Promise.all([
    admin.from('device_push_tokens').select('user_id'),
    admin
      .from('admin_outbound_messages')
      .select('id, admin_email, channel, title, body, recipient_count, sent_count, skip_count, fail_count, results, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (tokErr) {
    return res.status(500).json({ ok: false, error: tokErr.message || 'Token listesi alınamadı' })
  }

  const tokenUserIds = [...new Set((tokens || []).map((t) => String(t.user_id)))]
  const history = histErr ? [] : (messages || []).map(mapHistoryRow)
  if (histErr) {
    console.warn('[admin-broadcast] history', histErr.message)
  }

  return res.status(200).json({
    ok: true,
    tokenUserIds,
    mailConfigured: isMailConfigured(),
    maxRecipients: MAX_RECIPIENTS,
    messages: history,
  })
}

async function loadRecipients(admin, rawList) {
  const cleaned = []
  const seen = new Set()
  for (const item of rawList) {
    const audience = item?.audience === 'staff' ? 'staff' : item?.audience === 'member' ? 'member' : null
    const id = String(item?.id || '').trim()
    if (!audience || !isUuid(id)) continue
    const key = `${audience}:${id}`
    if (seen.has(key)) continue
    seen.add(key)
    cleaned.push({ audience, id })
    if (cleaned.length >= MAX_RECIPIENTS) break
  }

  if (!cleaned.length) {
    return { ok: false, status: 400, error: 'Sepete en az bir geçerli alıcı ekleyin.' }
  }

  const memberIds = cleaned.filter((r) => r.audience === 'member').map((r) => r.id)
  const staffIds = cleaned.filter((r) => r.audience === 'staff').map((r) => r.id)

  const [memberRes, staffRes] = await Promise.all([
    memberIds.length
      ? admin.from('members').select('id, name, email').in('id', memberIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length
      ? admin.from('staff').select('id, name, email').in('id', staffIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (memberRes.error) return { ok: false, status: 500, error: memberRes.error.message }
  if (staffRes.error) return { ok: false, status: 500, error: staffRes.error.message }

  const membersById = new Map((memberRes.data || []).map((r) => [r.id, r]))
  const staffById = new Map((staffRes.data || []).map((r) => [r.id, r]))

  const resolved = cleaned.map((r) => {
    const row = r.audience === 'staff' ? staffById.get(r.id) : membersById.get(r.id)
    if (!row) {
      return { ...r, name: '', email: '', missing: true }
    }
    return {
      ...r,
      name: String(row.name || '').trim(),
      email: String(row.email || '').trim().toLowerCase(),
      missing: false,
    }
  })

  return { ok: true, recipients: resolved }
}

async function sendPushOne(admin, recipient, notification) {
  if (recipient.missing) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'skipped',
      reason: 'not_found',
      inbox: false,
    }
  }

  const { error: inboxErr } = await admin.rpc('append_outbound_notification', {
    p_audience: recipient.audience,
    p_user_id: recipient.id,
    p_notification: notification,
  })
  if (inboxErr) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'failed',
      reason: null,
      inbox: false,
      error: inboxErr.message,
    }
  }

  const pushFn = recipient.audience === 'staff' ? sendExpoPushToStaff : sendExpoPushToMember
  let expo
  try {
    expo = await pushFn(admin, recipient.id, notification)
  } catch (e) {
    expo = { ok: false, error: e?.message || 'Expo gönderilemedi' }
  }

  if (!expo?.ok) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'failed',
      reason: null,
      inbox: true,
      error: expo?.error || 'Expo gönderilemedi',
    }
  }

  if (expo.skipped) {
    const reason = expo.reason === 'push_prefs_off' ? 'push_prefs_off' : 'no_token'
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'skipped',
      reason,
      inbox: true,
    }
  }

  return {
    id: recipient.id,
    audience: recipient.audience,
    name: recipient.name,
    email: recipient.email,
    status: 'sent',
    reason: null,
    inbox: true,
  }
}

async function sendEmailOne(recipient, title, message) {
  if (recipient.missing) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'skipped',
      reason: 'not_found',
      inbox: false,
    }
  }
  if (!recipient.email.includes('@')) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'skipped',
      reason: 'no_email',
      inbox: false,
    }
  }

  const tpl = adminBroadcastEmail({
    name: recipient.name,
    title,
    body: message,
  })
  const mailed = await sendMail({ to: recipient.email, ...tpl })
  if (!mailed.ok) {
    return {
      id: recipient.id,
      audience: recipient.audience,
      name: recipient.name,
      email: recipient.email,
      status: 'failed',
      reason: null,
      inbox: false,
      error: mailed.error || 'E-posta gönderilemedi',
    }
  }
  return {
    id: recipient.id,
    audience: recipient.audience,
    name: recipient.name,
    email: recipient.email,
    status: 'sent',
    reason: null,
    inbox: false,
  }
}

async function handlePost(admin, req, res, auth) {
  const rl = await enforceRateLimit({
    req,
    prefix: 'admin-broadcast',
    limit: 20,
    windowMs: 60 * 60 * 1000,
    extraKey: auth.user.id,
  })
  applyRateLimitHeaders(res, rl)
  if (!rl.ok) {
    return res.status(429).json({ ok: false, error: rl.error || 'Çok fazla gönderim. Biraz bekleyin.' })
  }

  const body = parseBody(req)
  const channel = body.channel === 'email' ? 'email' : body.channel === 'push' ? 'push' : null
  if (!channel) {
    return res.status(400).json({ ok: false, error: 'Kanal seçin: telefon bildirimi veya e-posta.' })
  }

  const title = trimStr(body.title, MAX_TITLE)
  const message = trimStr(body.message, MAX_BODY)
  if (!title) {
    return res.status(400).json({ ok: false, error: 'Başlık gerekli.' })
  }
  if (!message) {
    return res.status(400).json({ ok: false, error: 'Mesaj gerekli.' })
  }

  if (channel === 'email' && !isMailConfigured()) {
    return res.status(503).json({ ok: false, error: 'E-posta servisi yapılandırılmamış (RESEND_API_KEY).' })
  }

  const rawRecipients = Array.isArray(body.recipients) ? body.recipients : []
  if (rawRecipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({ ok: false, error: `En fazla ${MAX_RECIPIENTS} alıcı.` })
  }

  const loaded = await loadRecipients(admin, rawRecipients)
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error })
  }

  const notification = {
    id: notifId(),
    type: 'announcement',
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  }

  const results = []
  for (const recipient of loaded.recipients) {
    if (channel === 'push') {
      results.push(await sendPushOne(admin, recipient, notification))
    } else {
      results.push(await sendEmailOne(recipient, title, message))
    }
  }

  const sentCount = results.filter((r) => r.status === 'sent').length
  const skipCount = results.filter((r) => r.status === 'skipped').length
  const failCount = results.filter((r) => r.status === 'failed').length

  const audit = {
    admin_email: String(auth.user.email || '').toLowerCase(),
    channel,
    title,
    body: message,
    recipient_count: results.length,
    sent_count: sentCount,
    skip_count: skipCount,
    fail_count: failCount,
    results,
  }

  const { error: auditErr } = await admin.from('admin_outbound_messages').insert(audit)
  if (auditErr) {
    console.warn('[admin-broadcast] audit insert', auditErr.message)
  }

  return res.status(200).json({
    ok: true,
    channel,
    sentCount,
    skipCount,
    failCount,
    results,
  })
}

export default async function handler(req, res) {
  if (handleOptions(req, res, CORS_METHODS)) return
  setCorsHeaders(res, CORS_METHODS, 'Content-Type, Authorization', req)

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase yapılandırması eksik' })
  }

  const admin = getSupabaseAdmin()
  try {
    if (req.method === 'GET') return await handleGet(admin, res)
    return await handlePost(admin, req, res, auth)
  } catch (err) {
    console.error('[admin-broadcast]', err?.message || err)
    return res.status(500).json({ ok: false, error: err?.message || 'Gönderim hatası' })
  }
}
