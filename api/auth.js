/**
 * POST /api/auth
 * Birleşik auth API (Vercel Hobby 12 fonksiyon limiti).
 *
 * action: signup | unlock-signup | password-login | email-send | email-confirm | password-reset | book-session | session-attendance | exercise-video-url | exercise-video-urls | ga4-report | ai-usage-report | claim-active-session | verify-active-session
 * Geriye dönük: { evt } → email-confirm
 */
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin, getSupabaseUrl, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { getAppUrl } from './_appUrl.js'
import { getBearerToken, getUserFromRequest } from './_apiAuth.js'
import { bookSessionForMember } from './_bookSession.js'
import { recordSessionAttendance } from './_sessionAttendance.js'
import { handleGa4Report } from './_ga4Report.js'
import { handleAiUsageReport } from './_aiUsageReport.js'
import { claimActiveSession, isActiveSession } from './_singleSession.js'
import { isPasswordValid, passwordRequirementsMessage, formatPasswordAuthError } from './_password.js'
import { setCorsHeaders, handleOptions } from './_guards.js'
import { enforceRateLimit, applyRateLimitHeaders, getClientIp } from './_rateLimit.js'
import { reportFormAttack, mapGuardToAttackReason } from './_attackAlert.js'
import { verifyTurnstile, isLocalDevAuth } from './_turnstile.js'
import { isDisposableEmail, disposableEmailError } from './_disposableEmail.js'
import { issueFormSession, verifyFormSession } from './_formSession.js'

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
  /* email+password artık otomatik unlock değil — botlar bu yolu suistimal ediyordu */
  if (getBearerToken(req)) return 'email-send'
  return ''
}

async function requireTurnstile(req, token) {
  const result = await verifyTurnstile(token, getClientIp(req), req)
  if (result.ok) return { ok: true }
  return {
    ok: false,
    status: result.status || 403,
    code: result.code || 'TURNSTILE_INVALID',
    error: result.error || 'Bot doğrulaması gerekli.',
  }
}

function readCaptchaToken(body) {
  return String(body.turnstileToken || body.cfTurnstileResponse || body.captchaToken || '').trim()
}

/**
 * Turnstile koruması.
 * deferToSupabaseCaptcha: token’ı Cloudflare’de BİZ doğrulamayız (tek kullanımlık);
 * Supabase /token CAPTCHA’sına iletilir. Aksi halde siteverify burada yapılır.
 * Localhost: zorunluluk yok (Supabase CAPTCHA için service-role login kullanılır).
 */
async function requireBotGuard(req, body, { allowAuthSession = false, deferToSupabaseCaptcha = false } = {}) {
  const ip = getClientIp(req)
  if (allowAuthSession && body.authSessionToken) {
    const session = verifyFormSession(body.authSessionToken, { ip, kind: 'auth-signup' })
    if (session.ok) return { ok: true, via: 'auth-session' }
  }
  if (isLocalDevAuth(req)) {
    return { ok: true, via: 'local-dev', captchaToken: readCaptchaToken(body) }
  }
  const token = readCaptchaToken(body)
  if (deferToSupabaseCaptcha) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    if ((!token || token.length < 10) && (isProd || process.env.TURNSTILE_SECRET_KEY)) {
      return {
        ok: false,
        status: 400,
        code: 'TURNSTILE_REQUIRED',
        error: 'Bot doğrulaması gerekli. Lütfen tekrar deneyin.',
      }
    }
    return { ok: true, via: 'supabase-captcha', captchaToken: token }
  }
  return requireTurnstile(req, token)
}

/** Localhost / kayıt oturumu: anon CAPTCHA engelini service-role password grant ile aş. */
async function passwordGrant(email, password, captchaToken, { localBypass = false } = {}) {
  const url = getSupabaseUrl()
  const anonKey = getAnonKey()
  if (!url || !anonKey) {
    return { ok: false, status: 503, error: 'Supabase URL veya anon anahtarı eksik.' }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const tryServiceGrant = async () => {
    if (!serviceKey) return null
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json?.access_token) {
      return {
        ok: true,
        session: {
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          expires_in: json.expires_in,
          expires_at: json.expires_at,
          token_type: json.token_type || 'bearer',
        },
      }
    }
    const svcMsg = String(json?.error_description || json?.msg || json?.error || '')
    if (/not confirmed|confirm/i.test(svcMsg)) {
      return { ok: false, status: 401, error: svcMsg, unconfirmed: true }
    }
    if (res.status === 400 || res.status === 401) {
      return { ok: false, status: 401, error: 'E-posta veya şifre hatalı.' }
    }
    return { ok: false, status: res.status || 500, error: formatPasswordAuthError(svcMsg) || 'Giriş başarısız.' }
  }

  /* Kayıt sonrası auth-session: Turnstile zaten signup’ta doğrulandı (tek kullanımlık). */
  if (localBypass && serviceKey && (!captchaToken || captchaToken.length < 10)) {
    const granted = await tryServiceGrant()
    if (granted) return granted
  }

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error: signInErr } = await anon.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  })
  if (!signInErr && data?.session) {
    return { ok: true, session: data.session }
  }

  const msg = String(signInErr?.message || '')
  const captchaBlocked = /captcha/i.test(msg)
  const unconfirmed = /not confirmed|confirm/i.test(msg)

  if (localBypass && serviceKey && (captchaBlocked || !captchaToken || unconfirmed)) {
    const granted = await tryServiceGrant()
    if (granted) return granted
  }

  if (unconfirmed) {
    return { ok: false, status: 401, error: msg, unconfirmed: true }
  }
  if (captchaBlocked) {
    return {
      ok: false,
      status: 403,
      code: 'TURNSTILE_INVALID',
      error: 'Bot doğrulaması başarısız. Lütfen tekrar deneyin.',
    }
  }
  return { ok: false, status: 401, error: 'E-posta veya şifre hatalı.' }
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

async function handleSignup(req, res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()

  if (!email || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Geçerli bir e-posta adresi girin.' })
  }
  if (isDisposableEmail(email)) {
    try {
      await reportFormAttack(req, {
        action: 'signup',
        reason: 'disposable_email',
        status: 400,
        email,
        path: '/api/auth',
      })
    } catch {
      /* ignore */
    }
    return res.status(400).json({ ok: false, error: disposableEmailError() })
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

  const authSessionToken = issueFormSession({ ip: getClientIp(req), kind: 'auth-signup' })
  return res.status(200).json({ ok: true, userId: payload.user_id, authSessionToken })
}

async function handlePasswordLogin(req, res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'E-posta ve şifre gerekli.' })
  }
  if (isDisposableEmail(email)) {
    return res.status(400).json({ ok: false, error: disposableEmailError() })
  }

  const captchaToken = readCaptchaToken(body)
  /* Signup siteverify token’ı yakar; auth-session ile service-role grant kullanılır. */
  const authSession = body.authSessionToken
    ? verifyFormSession(body.authSessionToken, { ip: getClientIp(req), kind: 'auth-signup' })
    : { ok: false }

  /* Captcha spam (yanık token retry) credential 12/saat kotasını yakmasın */
  const captchaRl = await enforceRateLimit({
    req,
    prefix: 'auth-login-captcha',
    limit: 40,
    windowMs: 60 * 60 * 1000,
  })
  applyRateLimitHeaders(res, captchaRl.headers)
  if (!captchaRl.ok) {
    try {
      await reportFormAttack(req, {
        action: 'password-login',
        reason: 'auth_rate_limit',
        status: captchaRl.status,
        email: email.slice(0, 80),
        path: '/api/auth',
      })
    } catch {
      /* ignore */
    }
    return res.status(captchaRl.status).json({ ok: false, error: captchaRl.error })
  }

  const result = await passwordGrant(email, password, captchaToken, {
    localBypass: isLocalDevAuth(req) || authSession.ok,
  })
  if (!result.ok) {
    if (result.code === 'TURNSTILE_INVALID' || result.code === 'TURNSTILE_REQUIRED') {
      return res.status(result.status || 403).json({
        ok: false,
        code: result.code,
        error: result.error || 'Bot doğrulaması başarısız. Lütfen tekrar deneyin.',
      })
    }
    /* Yalnızca kimlik bilgisi hataları credential limitine sayılır */
    const credRl = await enforceRateLimit({
      req,
      prefix: 'auth-password-login',
      limit: 12,
      windowMs: 60 * 60 * 1000,
      extraKey: email,
    })
    applyRateLimitHeaders(res, credRl.headers)
    if (!credRl.ok) {
      try {
        await reportFormAttack(req, {
          action: 'password-login',
          reason: 'auth_rate_limit',
          status: credRl.status,
          email: email.slice(0, 80),
          path: '/api/auth',
        })
      } catch {
        /* ignore */
      }
      return res.status(credRl.status).json({ ok: false, error: credRl.error })
    }
    return res.status(result.status || 401).json({
      ok: false,
      error: formatPasswordAuthError(result.error) || result.error,
    })
  }

  const session = result.session
  return res.status(200).json({
    ok: true,
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type || 'bearer',
    },
  })
}

async function handleUnlockSignup(req, res, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'E-posta ve şifre gerekli.' })
  }
  if (isDisposableEmail(email)) {
    return res.status(400).json({ ok: false, error: disposableEmailError() })
  }

  const admin = getSupabaseAdmin()
  const authSession = body.authSessionToken
    ? verifyFormSession(body.authSessionToken, { ip: getClientIp(req), kind: 'auth-signup' })
    : { ok: false }

  /* Kayıt sonrası kısa oturum: şifre zaten register_email_user ile doğrulandı */
  if (!authSession.ok) {
    const captchaToken = readCaptchaToken(body)
    const grant = await passwordGrant(email, password, captchaToken, {
      localBypass: isLocalDevAuth(req),
    })
    if (!grant.ok && !grant.unconfirmed) {
      return res.status(grant.status || 401).json({
        ok: false,
        code: grant.code || undefined,
        error: grant.error,
      })
    }
  }

  const userIdHint = String(body.userId || '').trim()
  let user = null
  if (userIdHint) {
    const { data: byId, error: byIdErr } = await admin.auth.admin.getUserById(userIdHint)
    if (!byIdErr && byId?.user && (byId.user.email || '').toLowerCase() === email) {
      user = byId.user
    }
  }
  if (!user) user = await findAuthUserByEmail(admin, email)
  if (!user) return res.status(404).json({ ok: false, error: 'Kullanıcı bulunamadı.' })

  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
  if (updateErr) throw updateErr

  return res.status(200).json({ ok: true })
}

/** E-posta ile auth kullanıcısı — listUsers(1000) taraması yerine. */
async function findAuthUserByEmail(admin, email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return null

  const base = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (base && key) {
    try {
      const url = `${base.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(normalized)}`
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
      })
      if (resp.ok) {
        const payload = await resp.json().catch(() => ({}))
        const users = Array.isArray(payload?.users) ? payload.users : []
        const match = users.find((u) => (u.email || '').toLowerCase() === normalized)
        if (match) return match
        if (payload?.id && (payload.email || '').toLowerCase() === normalized) return payload
      }
    } catch {
      /* yedek yok — çağıran 404 döner */
    }
  }

  return null
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

async function handleSessionAttendance(req, res, body) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Oturum gerekli.' })

  const admin = getSupabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
  }

  const result = await recordSessionAttendance(admin, userData.user, {
    sessionId: body.sessionId,
    sessionType: body.sessionType,
    event: body.event,
  })
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

    const botGuarded = new Set(['signup', 'unlock-signup', 'password-login', 'password-reset'])
    if (botGuarded.has(action)) {
      const guard = await requireBotGuard(req, body, {
        allowAuthSession: action === 'password-login' || action === 'unlock-signup',
        /* login/unlock: token Supabase CAPTCHA’ya gider; çift doğrulama token’ı yakar */
        deferToSupabaseCaptcha: action === 'password-login' || action === 'unlock-signup',
      })
      if (!guard.ok) {
        const reason = mapGuardToAttackReason(guard) || 'turnstile_failed'
        try {
          await reportFormAttack(req, {
            action,
            reason,
            status: guard.status,
            email: String(body.email || '').slice(0, 80),
            path: '/api/auth',
          })
        } catch {
          /* ignore */
        }
        return res.status(guard.status).json({
          ok: false,
          code: guard.code || undefined,
          error: guard.error,
        })
      }
    }

    /* password-login credential limiti handlePasswordLogin içinde (captcha fail kotayı yakmaz) */
    const sensitiveAuth = new Set(['signup', 'unlock-signup', 'password-reset', 'email-send'])
    if (sensitiveAuth.has(action)) {
      const emailKey = String(body.email || '').trim().toLowerCase()
      const limits = {
        signup: 3,
        'unlock-signup': 5,
        'password-reset': 5,
        'email-send': 10,
      }
      const rl = await enforceRateLimit({
        req,
        prefix: `auth-${action}`,
        limit: limits[action] ?? 8,
        windowMs: 60 * 60 * 1000,
        extraKey: emailKey && ['signup', 'password-reset', 'unlock-signup'].includes(action)
          ? emailKey
          : '',
      })
      applyRateLimitHeaders(res, rl.headers)
      if (!rl.ok) {
        try {
          await reportFormAttack(req, {
            action,
            reason: 'auth_rate_limit',
            status: rl.status,
            email: emailKey.slice(0, 80),
            path: '/api/auth',
          })
        } catch {
          /* ignore */
        }
        return res.status(rl.status).json({ ok: false, error: rl.error })
      }
    }

    if (action === 'signup') return handleSignup(req, res, body)
    if (action === 'unlock-signup') return handleUnlockSignup(req, res, body)
    if (action === 'password-login') return handlePasswordLogin(req, res, body)
    if (action === 'email-send') return handleEmailSend(req, res)
    if (action === 'email-confirm') return handleEmailConfirm(req, res, body)
    if (action === 'password-reset') return handlePasswordReset(res, body)
    if (action === 'book-session') return handleBookSession(req, res, body)
    if (action === 'session-attendance') return handleSessionAttendance(req, res, body)
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
