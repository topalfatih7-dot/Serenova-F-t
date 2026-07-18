/**
 * POST /api/auth
 * Birleşik auth API (Vercel Hobby 12 fonksiyon limiti).
 *
 * action: signup | unlock-signup | email-send | email-confirm | password-reset | book-session | exercise-video-url | exercise-video-urls | ga4-report | ai-usage-report | claim-active-session | verify-active-session
 * Geriye dönük: { email, password } → unlock-signup; { evt } → email-confirm
 */
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin, getSupabaseUrl, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { getAppUrl } from './_appUrl.js'
import { getBearerToken, getUserFromRequest } from './_apiAuth.js'
import { bookSessionForMember } from './_bookSession.js'
import { handleGa4Report } from './_ga4Report.js'
import { handleAiUsageReport } from './_aiUsageReport.js'
import { claimActiveSession, isActiveSession } from './_singleSession.js'
import { isPasswordValid, passwordRequirementsMessage, formatPasswordAuthError } from './_password.js'
import { setCorsHeaders, handleOptions } from './_guards.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'

const nowISO = () => new Date().toISOString()

function getAnonKey() {
  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
}

function resolveAction(body, req) {
  if (body.action) return body.action
  if (body.evt) return 'email-confirm'
  if (body.email && body.password) return 'unlock-signup'
  if (getBearerToken(req)) return 'email-send'
  return ''
}

async function sendOtpEmail(email, redirectTo) {
  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  })
  if (!error) return { ok: true }

  const url = getSupabaseUrl()
  const anonKey = getAnonKey()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return { ok: false, error: error.message || 'Doğrulama e-postası gönderilemedi.' }
  }

  const res = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email, create_user: false, email_redirect_to: redirectTo }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    return {
      ok: false,
      error: payload?.msg || payload?.error_description || error.message || 'Doğrulama e-postası gönderilemedi.',
    }
  }
  return { ok: true }
}

async function sendRecoveryEmail(email, redirectTo) {
  const url = getSupabaseUrl()
  const anonKey = getAnonKey()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return { ok: false, error: 'Sunucu yapılandırması eksik.' }
  }

  const res = await fetch(`${url}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    return {
      ok: false,
      error: payload?.msg || payload?.error_description || payload?.message || 'Sıfırlama e-postası gönderilemedi.',
    }
  }
  return { ok: true }
}

async function handleSignup(res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()

  if (!email || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Geçerli bir e-posta adresi girin.' })
  }
  if (!isPasswordValid(password)) {
    return res.status(400).json({ ok: false, error: passwordRequirementsMessage() })
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.rpc('register_email_user', {
    p_email: email,
    p_password: password,
    p_name: name,
  })

  if (error) {
    return res.status(500).json({ ok: false, error: formatPasswordAuthError(error.message) })
  }

  const payload = data && typeof data === 'object' ? data : {}
  if (!payload.ok) {
    if (payload.error === 'already_registered') {
      return res.status(409).json({ ok: false, error: 'already_registered' })
    }
    return res.status(400).json({
      ok: false,
      error: formatPasswordAuthError(payload.error) || passwordRequirementsMessage(),
    })
  }

  return res.status(200).json({ ok: true, userId: payload.user_id })
}

async function handleUnlockSignup(res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'E-posta ve şifre gerekli.' })
  }

  const url = getSupabaseUrl()
  const anonKey = getAnonKey()
  if (!url || !anonKey) {
    return res.status(503).json({ ok: false, error: 'Supabase URL veya anon anahtarı eksik.' })
  }

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: signInErr } = await anon.auth.signInWithPassword({ email, password })
  if (signInErr) {
    const unconfirmed = /not confirmed|confirm/i.test(signInErr.message)
    if (!unconfirmed) {
      return res.status(401).json({ ok: false, error: 'E-posta veya şifre hatalı.' })
    }
  } else {
    await anon.auth.signOut()
  }

  const admin = getSupabaseAdmin()
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw listErr

  const user = (listData?.users || []).find((u) => (u.email || '').toLowerCase() === email)
  if (!user) return res.status(404).json({ ok: false, error: 'Kullanıcı bulunamadı.' })

  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
  if (updateErr) throw updateErr

  return res.status(200).json({ ok: true })
}

async function handleEmailSend(req, res) {
  const { user, error: authErr } = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ ok: false, error: authErr })

  const email = (user.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ ok: false, error: 'E-posta adresi bulunamadı.' })

  const admin = getSupabaseAdmin()
  const { data: row, error: rowErr } = await admin
    .from('members')
    .select('data')
    .eq('id', user.id)
    .maybeSingle()

  if (rowErr || !row) return res.status(404).json({ ok: false, error: 'Üye kaydı bulunamadı.' })

  const evt = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const data = {
    ...(row.data || {}),
    pendingEmailVerification: { token: evt, expiresAt, email },
  }

  const { error: patchErr } = await admin
    .from('members')
    .update({ data, updated_at: nowISO() })
    .eq('id', user.id)

  if (patchErr) throw patchErr

  const redirectTo = `${getAppUrl()}/auth/callback?verify=email&evt=${evt}`
  const sent = await sendOtpEmail(email, redirectTo)
  if (!sent.ok) return res.status(500).json({ ok: false, error: sent.error })

  return res.status(200).json({
    ok: true,
    message: 'E-postanıza doğrulama bağlantısı gönderildi. Bağlantıya bir kez tıklayın.',
  })
}

async function handlePasswordReset(res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Geçerli bir e-posta girin.' })
  }

  const redirectTo = `${getAppUrl()}/auth/callback?next=reset-password`
  const sent = await sendRecoveryEmail(email, redirectTo)
  if (!sent.ok) return res.status(500).json({ ok: false, error: sent.error })

  return res.status(200).json({
    ok: true,
    message: 'Sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.',
  })
}

async function handleEmailConfirm(req, res, body) {
  const evt = String(body.evt || '').trim()
  if (!evt) return res.status(400).json({ ok: false, error: 'Doğrulama jetonu eksik.' })

  const admin = getSupabaseAdmin()
  const { data: rows, error: findErr } = await admin
    .from('members')
    .select('id, email, data')
    .filter('data->pendingEmailVerification->>token', 'eq', evt)
    .limit(1)

  if (findErr) throw findErr

  const row = rows?.[0]
  if (!row) {
    return res.status(400).json({
      ok: false,
      error: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı. Profilden yeni bağlantı isteyin.',
    })
  }

  const pending = row.data?.pendingEmailVerification
  if (!pending || pending.token !== evt) {
    return res.status(400).json({ ok: false, error: 'Doğrulama jetonu geçersiz.' })
  }

  if (pending.expiresAt && new Date(pending.expiresAt) < new Date()) {
    return res.status(400).json({
      ok: false,
      error: 'Bağlantının süresi dolmuş. Profilden yeni doğrulama bağlantısı isteyin.',
    })
  }

  const bearer = getBearerToken(req)
  if (bearer) {
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer)
    if (!userErr && userData?.user && userData.user.id !== row.id) {
      return res.status(403).json({ ok: false, error: 'Bu bağlantı başka bir hesap için.' })
    }
  }

  const nextData = {
    ...(row.data || {}),
    emailVerifiedAt: nowISO(),
    pendingEmailVerification: null,
  }

  const { error: upErr } = await admin
    .from('members')
    .update({ data: nextData, updated_at: nowISO() })
    .eq('id', row.id)

  if (upErr) throw upErr

  return res.status(200).json({ ok: true, emailVerifiedAt: nextData.emailVerifiedAt })
}

async function handleBookSession(req, res, body) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Oturum gerekli.' })

  const admin = getSupabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
  }

  const result = await bookSessionForMember(
    admin,
    userData.user.id,
    body.type,
    body.startsAt,
    body.duration,
  )
  if (!result.ok) return res.status(400).json(result)
  return res.status(200).json(result)
}

const EXERCISE_VIDEO_BUCKET = 'exercise-videos'
const EXERCISE_VIDEO_EXPIRES = 15 * 60

function isExerciseVideoPath(path) {
  return typeof path === 'string' && /^[\w.-]+$/.test(path) && !path.includes('..')
}

async function handleExerciseVideoUrl(req, res, body) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Oturum bulunamadı.' })

  const admin = getSupabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
  }

  const { path } = body
  if (!isExerciseVideoPath(path)) {
    return res.status(400).json({ ok: false, error: 'Geçersiz video yolu' })
  }

  const { data, error } = await admin.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .createSignedUrl(path, EXERCISE_VIDEO_EXPIRES)
  if (error || !data?.signedUrl) {
    return res.status(404).json({ ok: false, error: error?.message || 'Video bulunamadı' })
  }

  return res.status(200).json({
    ok: true,
    url: data.signedUrl,
    expiresAt: Date.now() + EXERCISE_VIDEO_EXPIRES * 1000,
  })
}

async function handleExerciseVideoUrls(req, res, body) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Oturum bulunamadı.' })

  const admin = getSupabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
  }

  const rawPaths = Array.isArray(body.paths) ? body.paths : []
  const paths = [...new Set(rawPaths.filter(isExerciseVideoPath))].slice(0, 30)
  if (!paths.length) {
    return res.status(400).json({ ok: false, error: 'Geçersiz video yolları' })
  }

  const expiresAt = Date.now() + EXERCISE_VIDEO_EXPIRES * 1000
  const entries = await Promise.all(paths.map(async (path) => {
    const { data, error } = await admin.storage
      .from(EXERCISE_VIDEO_BUCKET)
      .createSignedUrl(path, EXERCISE_VIDEO_EXPIRES)
    if (error || !data?.signedUrl) return null
    return [path, { url: data.signedUrl, expiresAt }]
  }))

  const urls = Object.fromEntries(entries.filter(Boolean))
  return res.status(200).json({ ok: true, urls })
}

async function handleClaimActiveSession(req, res) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Oturum gerekli.' })

  const { user, error: authErr } = await getUserFromRequest(req)
  if (authErr || !user) {
    return res.status(401).json({ ok: false, error: authErr || 'Oturum geçersiz.' })
  }

  const admin = getSupabaseAdmin()
  const result = await claimActiveSession(admin, user, token)
  if (!result.ok) {
    return res.status(500).json({ ok: false, error: result.error || 'Aktif oturum kaydedilemedi.' })
  }
  return res.status(200).json({ ok: true, sessionId: result.sessionId })
}

async function handleVerifyActiveSession(req, res) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, valid: false })

  const { user, error: authErr } = await getUserFromRequest(req)
  if (authErr || !user) return res.status(401).json({ ok: false, valid: false })

  return res.status(200).json({ ok: true, valid: isActiveSession(user, token) })
}

export default async function handler(req, res) {
  if (handleOptions(req, res, 'POST, OPTIONS', 'Content-Type, Authorization')) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY).',
    })
  }

  try {
    const body = parseBody(req)
    const action = resolveAction(body, req)

    const sensitiveAuth = new Set(['signup', 'unlock-signup', 'password-reset', 'email-send'])
    if (sensitiveAuth.has(action)) {
      const rl = await enforceRateLimit({
        req,
        prefix: `auth-${action}`,
        limit: action === 'signup' ? 8 : 15,
        windowMs: 60 * 60 * 1000,
      })
      applyRateLimitHeaders(res, rl.headers)
      if (!rl.ok) {
        return res.status(rl.status).json({ ok: false, error: rl.error })
      }
    }

    if (action === 'signup') return handleSignup(res, body)
    if (action === 'unlock-signup') return handleUnlockSignup(res, body)
    if (action === 'email-send') return handleEmailSend(req, res)
    if (action === 'email-confirm') return handleEmailConfirm(req, res, body)
    if (action === 'password-reset') return handlePasswordReset(res, body)
    if (action === 'book-session') return handleBookSession(req, res, body)
    if (action === 'exercise-video-url') return handleExerciseVideoUrl(req, res, body)
    if (action === 'exercise-video-urls') return handleExerciseVideoUrls(req, res, body)
    if (action === 'ga4-report') return handleGa4Report(req, res, body)
    if (action === 'ai-usage-report') return handleAiUsageReport(req, res, body)
    if (action === 'claim-active-session') return handleClaimActiveSession(req, res)
    if (action === 'verify-active-session') return handleVerifyActiveSession(req, res)

    return res.status(400).json({ ok: false, error: 'Geçersiz istek.' })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'İşlem başarısız.' })
  }
}
