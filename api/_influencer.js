/**
 * Influencer API — /api/auth üzerinden (Hobby 12 fonksiyon limiti).
 * action: validate-code | admin-upsert | admin-delete
 */
import { getAdminEmail, requireAdmin, requireAuth } from './_guards.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { sendMail, influencerInviteEmail } from './_mailer.js'
import { getAppUrl } from './_appUrl.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import {
  lookupActiveInfluencerByCode,
  isSelfInfluencerUse,
  normalizeInfluencerCodeServer,
  isInfluencerCodeFormat,
} from './_influencerCode.js'
import {
  INFLUENCER_DISCOUNT_PERCENT,
  INFLUENCER_COMMISSION_RATE,
} from '../src/data/influencerPayouts.js'

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase()
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  const bytes = new Uint8Array(14)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  let pwd = ''
  for (let i = 0; i < bytes.length; i += 1) pwd += chars[bytes[i] % chars.length]
  return pwd
}

async function handleValidateCode(req, res, admin, body) {
  const auth = await requireAuth(req)
  if (!auth.ok) return res.status(auth.status).json({ ok: false, valid: false, error: auth.error })

  const code = normalizeInfluencerCodeServer(body.code)
  if (!isInfluencerCodeFormat(code)) {
    return res.status(200).json({
      ok: true,
      valid: false,
      error: 'Geçersiz kod.',
      discountPercent: INFLUENCER_DISCOUNT_PERCENT,
    })
  }

  const row = await lookupActiveInfluencerByCode(admin, code)
  if (!row) {
    return res.status(200).json({
      ok: true,
      valid: false,
      error: 'Geçersiz kod.',
      discountPercent: INFLUENCER_DISCOUNT_PERCENT,
    })
  }
  if (isSelfInfluencerUse(auth.user, row)) {
    return res.status(200).json({
      ok: true,
      valid: false,
      error: 'Kendi kodunuzu kullanamazsınız.',
      discountPercent: INFLUENCER_DISCOUNT_PERCENT,
    })
  }

  return res.status(200).json({
    ok: true,
    valid: true,
    discountPercent: INFLUENCER_DISCOUNT_PERCENT,
    commissionRate: INFLUENCER_COMMISSION_RATE,
  })
}

async function assertEmailAvailable(admin, email, exceptId = null) {
  const adminEmail = getAdminEmail()
  if (email === adminEmail) {
    return 'Bu e-posta kullanılamaz.'
  }

  const { data: member } = await admin.from('members').select('id').eq('email', email).maybeSingle()
  if (member && member.id !== exceptId) return 'Bu e-posta bir üye hesabına ait. Farklı bir e-posta kullanın.'

  const { data: staff } = await admin.from('staff').select('id').ilike('email', email).maybeSingle()
  if (staff) return 'Bu e-posta kadromuzda kayıtlı. Farklı bir e-posta kullanın.'

  const { data: inf } = await admin.from('influencers').select('id').eq('email', email).maybeSingle()
  if (inf && inf.id !== exceptId) return 'Bu e-posta başka bir influencer hesabına ait.'

  return null
}

async function handleAdminUpsert(req, res, admin, body) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error })

  const email = normalizeEmail(body.email)
  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const code = normalizeInfluencerCodeServer(body.code)
  const active = body.active !== false
  const id = body.id ? String(body.id) : null
  const instagram = String(body.instagram || '').trim()

  if (name.length < 2) return res.status(400).json({ ok: false, error: 'Ad gerekli.' })
  if (!email.includes('@')) return res.status(400).json({ ok: false, error: 'Geçerli e-posta gerekli.' })
  if (!isInfluencerCodeFormat(code)) {
    return res.status(400).json({ ok: false, error: 'Kod 4–20 karakter, yalnızca harf ve rakam olmalı.' })
  }

  const emailErr = await assertEmailAvailable(admin, email, id)
  if (emailErr) return res.status(400).json({ ok: false, error: emailErr })

  const { data: codeRow } = await admin.from('influencers').select('id').eq('code', code).maybeSingle()
  if (codeRow && String(codeRow.id) !== String(id || '')) {
    return res.status(400).json({ ok: false, error: 'Bu kod başka bir influencer’a ait.' })
  }

  let tempPassword = String(body.password || '')
  let created = false
  let userId = id

  if (!id) {
    if (!tempPassword || tempPassword.length < 8) tempPassword = generateTempPassword()
    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, influencer: true },
    })
    if (createErr || !createdUser?.user?.id) {
      const msg = String(createErr?.message || '')
      if (/already|registered|exists/i.test(msg)) {
        return res.status(400).json({ ok: false, error: 'Bu e-posta mevcut bir hesaba ait. Farklı bir e-posta kullanın.' })
      }
      return res.status(500).json({ ok: false, error: createErr?.message || 'Hesap oluşturulamadı.' })
    }
    userId = createdUser.user.id
    created = true
    await admin.from('members').delete().eq('id', userId)
  } else {
    const { data: existing } = await admin.from('influencers').select('id, data').eq('id', id).maybeSingle()
    if (!existing) return res.status(404).json({ ok: false, error: 'Influencer bulunamadı.' })
    const patch = { email, email_confirm: true, user_metadata: { name, influencer: true } }
    if (tempPassword) patch.password = tempPassword
    const { error: updAuth } = await admin.auth.admin.updateUserById(id, patch)
    if (updAuth) return res.status(500).json({ ok: false, error: updAuth.message })
  }

  const { data: current } = await admin.from('influencers').select('data').eq('id', userId).maybeSingle()
  const nextData = {
    ...(current?.data || {}),
    instagram,
    ...(created ? { tempPasswordIssued: true } : {}),
    ...(tempPassword && id ? { tempPasswordIssued: true } : {}),
  }

  const row = {
    id: userId,
    email,
    name,
    phone,
    code,
    active,
    data: nextData,
    updated_at: new Date().toISOString(),
  }

  const { error: upErr } = await admin.from('influencers').upsert(row, { onConflict: 'id' })
  if (upErr) {
    if (created) {
      await admin.auth.admin.deleteUser(userId).catch(() => {})
    }
    return res.status(500).json({ ok: false, error: upErr.message })
  }

  await admin.from('members').delete().eq('id', userId)

  let emailSent = false
  if (created || body.sendInvite) {
    try {
      const mail = influencerInviteEmail({
        name,
        email,
        tempPassword: tempPassword || undefined,
        code,
        loginUrl: `${getAppUrl()}/login`,
      })
      await sendMail({ to: email, ...mail })
      emailSent = true
    } catch (e) {
      console.warn('[influencer] invite email', e.message)
    }
  }

  return res.status(200).json({
    ok: true,
    id: userId,
    created,
    emailSent,
    tempPassword: created ? tempPassword : undefined,
    code,
  })
}

async function handleAdminDelete(req, res, admin, body) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error })
  const id = String(body.id || '')
  if (!id) return res.status(400).json({ ok: false, error: 'id gerekli.' })

  const { error: delErr } = await admin.from('influencers').delete().eq('id', id)
  if (delErr) return res.status(500).json({ ok: false, error: delErr.message })
  const { error: authErr } = await admin.auth.admin.deleteUser(id)
  if (authErr) console.warn('[influencer] delete auth user', authErr.message)
  return res.status(200).json({ ok: true })
}

export async function handleInfluencerRequest(req, res, body) {
  const admin = getSupabaseAdmin()
  const action = String(body.action || '')

  const rl = await enforceRateLimit({
    req,
    prefix: `influencer-${action || 'x'}`,
    limit: action === 'validate-code' ? 60 : 40,
    windowMs: 60 * 60 * 1000,
  })
  applyRateLimitHeaders(res, rl.headers)
  if (!rl.ok) {
    return res.status(rl.status || 429).json({ ok: false, error: rl.error || 'Çok fazla istek. Lütfen sonra tekrar deneyin.' })
  }

  if (action === 'validate-code') return handleValidateCode(req, res, admin, body)
  if (action === 'admin-upsert') return handleAdminUpsert(req, res, admin, body)
  if (action === 'admin-delete') return handleAdminDelete(req, res, admin, body)
  return res.status(400).json({ ok: false, error: 'Geçersiz işlem.' })
}
