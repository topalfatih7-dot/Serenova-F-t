/**
 * Public form kapısı — Turnstile + rate limit + service-role DB yazımı + Telegram.
 * action: contact | staff_application | corporate_application | staff_doc_upload
 *
 * Client asla notify secret göndermez; Telegram yalnızca bu route içinden tetiklenir.
 */

import { setCorsHeaders, handleOptions } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { verifyTurnstile } from './_turnstile.js'
import { enforceRateLimit, applyRateLimitHeaders, getClientIp } from './_rateLimit.js'
import {
  notifyContactTelegram,
  notifyStaffApplicationTelegram,
  notifyCorporateApplicationTelegram,
} from './_formNotify.js'
import { issueFormSession, verifyFormSession } from './_formSession.js'
import { reportFormAttack, mapGuardToAttackReason } from './_attackAlert.js'

const MAX_MESSAGE = 2000
const MAX_NAME = 120
const MAX_DOC_BYTES = 8 * 1024 * 1024
const ALLOWED_DOC_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp'])
const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
}

function trimStr(v, max = 500) {
  return String(v || '').trim().slice(0, max)
}

/**
 * @returns {{ ok: true, formSessionToken: string } | { ok: false, status: number, error: string }}
 */
async function guardBotAndRate(req, { prefix, limit, email = '', kind = 'public', allowFormSession = false }) {
  const ip = getClientIp(req)
  let formSessionToken = req._formSessionToken || ''

  if (allowFormSession && formSessionToken) {
    const session = verifyFormSession(formSessionToken, { ip, kind })
    if (!session.ok) {
      return { ok: false, status: 403, error: session.error }
    }
  } else {
    const turnstile = await verifyTurnstile(req._formTurnstileToken, ip)
    if (!turnstile.ok) {
      return { ok: false, status: turnstile.status, error: turnstile.error }
    }
    formSessionToken = issueFormSession({ ip, kind })
  }

  const rl = await enforceRateLimit({ req, prefix, limit, extraKey: email.toLowerCase() })
  if (!rl.ok) {
    return {
      ok: false,
      status: rl.status,
      error: rl.error,
      headers: rl.headers,
    }
  }
  return { ok: true, formSessionToken, headers: rl.headers }
}

function applyGuardFailure(res, guard, req, action) {
  applyRateLimitHeaders(res, guard.headers)
  const reason = mapGuardToAttackReason(guard)
  if (reason) {
    reportFormAttack(req, {
      action,
      reason,
      status: guard.status,
      path: '/api/contact',
    }).catch(() => {})
  }
  return res.status(guard.status).json({ ok: false, error: guard.error })
}

async function handleContact(req, res, body) {
  if (body.website || body.company_url || body.hp) {
    reportFormAttack(req, {
      action: 'contact',
      reason: 'honeypot',
      status: 200,
      email: trimStr(body.email, 80),
      path: '/api/contact',
    }).catch(() => {})
    return res.status(200).json({ ok: true })
  }

  const name = trimStr(body.name, MAX_NAME)
  const email = trimStr(body.email, 200).toLowerCase()
  const phone = trimStr(body.phone, 40)
  const subject = trimStr(body.subject || 'general', 40)
  const message = trimStr(body.message, MAX_MESSAGE)
  const source = trimStr(body.source || 'landing', 40)

  if (!name || !email.includes('@') || message.length < 10) {
    return res.status(400).json({ ok: false, error: 'Zorunlu alanlar eksik' })
  }

  const guard = await guardBotAndRate(req, { prefix: 'form-contact', limit: 5, email, kind: 'contact' })
  if (!guard.ok) return applyGuardFailure(res, guard, req, 'contact')
  applyRateLimitHeaders(res, guard.headers)

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.rpc('submit_contact_inquiry', {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_subject: subject,
    p_message: message,
    p_source: source,
  })
  if (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Mesaj kaydedilemedi' })
  }

  notifyContactTelegram({ name, email, phone, subject, message }).catch(() => {})
  return res.status(200).json({ ok: true, id: data })
}

async function handleStaffApplication(req, res, body) {
  if (body.website || body.hp) {
    return res.status(200).json({ ok: true })
  }

  const name = trimStr(body.name, MAX_NAME)
  const email = trimStr(body.email, 200).toLowerCase()
  const phone = trimStr(body.phone, 40)
  const role = trimStr(body.role, 20).toLowerCase()
  const roleLabel = trimStr(body.roleLabel, 60)
  const data = body.data && typeof body.data === 'object' ? body.data : {}

  if (!name || !email.includes('@') || !['coach', 'dietitian'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'Geçersiz başvuru verisi' })
  }

  const guard = await guardBotAndRate(req, {
    prefix: 'form-staff',
    limit: 3,
    email,
    kind: 'staff',
    allowFormSession: true,
  })
  if (!guard.ok) return applyGuardFailure(res, guard, req, 'staff_application')
  applyRateLimitHeaders(res, guard.headers)

  const admin = getSupabaseAdmin()
  const { data: id, error } = await admin.rpc('submit_staff_application', {
    p_role: role,
    p_email: email,
    p_name: name,
    p_phone: phone,
    p_data: data,
  })
  if (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Başvuru kaydedilemedi' })
  }

  notifyStaffApplicationTelegram({ name, email, phone, role, roleLabel }).catch(() => {})
  return res.status(200).json({ ok: true, id, formSessionToken: guard.formSessionToken })
}

async function handleCorporateApplication(req, res, body) {
  if (body.website || body.hp) {
    return res.status(200).json({ ok: true })
  }

  const companyName = trimStr(body.companyName, 200)
  const contactName = trimStr(body.contactName, MAX_NAME)
  const email = trimStr(body.email, 200).toLowerCase()
  const phone = trimStr(body.phone, 40)
  const data = body.data && typeof body.data === 'object' ? body.data : {}

  if (!companyName || !contactName || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Zorunlu alanlar eksik' })
  }

  const guard = await guardBotAndRate(req, { prefix: 'form-corporate', limit: 3, email, kind: 'corporate' })
  if (!guard.ok) return applyGuardFailure(res, guard, req, 'corporate_application')
  applyRateLimitHeaders(res, guard.headers)

  const admin = getSupabaseAdmin()
  const { data: id, error } = await admin.rpc('submit_corporate_application', {
    p_company_name: companyName,
    p_contact_name: contactName,
    p_email: email,
    p_phone: phone,
    p_data: data,
  })
  if (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Başvuru kaydedilemedi' })
  }

  notifyCorporateApplicationTelegram({ companyName, contactName, email, phone }).catch(() => {})
  return res.status(200).json({ ok: true, id })
}

async function handleStaffDocUpload(req, res, body) {
  const guard = await guardBotAndRate(req, {
    prefix: 'form-staff-doc',
    limit: 20,
    kind: 'staff',
    allowFormSession: true,
  })
  if (!guard.ok) return applyGuardFailure(res, guard, req, 'staff_doc_upload')
  applyRateLimitHeaders(res, guard.headers)

  const fileName = trimStr(body.fileName || body.name, 180)
  const contentType = trimStr(body.contentType || body.mimeType, 80).toLowerCase()
  const base64 = String(body.dataBase64 || body.base64 || '')

  if (!fileName || !base64) {
    return res.status(400).json({ ok: false, error: 'Dosya gerekli' })
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_DOC_EXT.has(ext)) {
    return res.status(400).json({ ok: false, error: 'Yalnızca PDF veya görsel yükleyebilirsiniz' })
  }
  if (contentType && !ALLOWED_DOC_MIME.has(contentType)) {
    return res.status(400).json({ ok: false, error: 'Geçersiz dosya türü' })
  }

  let buffer
  try {
    buffer = Buffer.from(base64, 'base64')
  } catch {
    return res.status(400).json({ ok: false, error: 'Dosya okunamadı' })
  }
  if (!buffer.length || buffer.length > MAX_DOC_BYTES) {
    return res.status(400).json({ ok: false, error: 'Dosya en fazla 8 MB olabilir' })
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  const admin = getSupabaseAdmin()
  const { error } = await admin.storage.from('staff-application-docs').upload(path, buffer, {
    contentType: contentType || (ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`),
    cacheControl: '3600',
    upsert: false,
  })
  if (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Yükleme başarısız' })
  }

  const { data: pub } = admin.storage.from('staff-application-docs').getPublicUrl(path)
  return res.status(200).json({
    ok: true,
    url: pub?.publicUrl,
    path,
    formSessionToken: guard.formSessionToken,
  })
}

export default async function handler(req, res) {
  if (handleOptions(req, res, 'POST, OPTIONS', 'Content-Type')) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type', req)

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Sunucu yapılandırması eksik' })
  }

  try {
    const body = parseBody(req)
    req._formTurnstileToken = body.turnstileToken || body.cfTurnstileResponse || ''
    req._formSessionToken = body.formSessionToken || ''

    const action = trimStr(body.action || 'contact', 40)
    if (action === 'contact') return handleContact(req, res, body)
    if (action === 'staff_application') return handleStaffApplication(req, res, body)
    if (action === 'corporate_application') return handleCorporateApplication(req, res, body)
    if (action === 'staff_doc_upload') return handleStaffDocUpload(req, res, body)

    return res.status(400).json({ ok: false, error: 'Geçersiz form türü' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
