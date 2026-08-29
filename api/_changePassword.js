/**
 * Oturum açıkken şifre değiştirme — mevcut şifre service-role grant ile doğrulanır.
 * Client `signInWithPassword` kullanmaz (Turnstile / tek oturum).
 */
import { getUserFromRequest } from './_apiAuth.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { userHasPasswordProvider, verifyAccountPassword } from './_deleteAccount.js'
import { formatPasswordAuthError, isPasswordValid, passwordRequirementsMessage } from './_password.js'
import { applyRateLimitHeaders, enforceRateLimit } from './_rateLimit.js'

export function validatePasswordChangeFields({ currentPassword, newPassword, confirmPassword }) {
  const current = String(currentPassword || '')
  const next = String(newPassword || '')
  const confirm = String(confirmPassword || '')

  if (!current) return { ok: false, status: 400, error: 'Mevcut şifrenizi girin.' }
  if (!next) return { ok: false, status: 400, error: 'Yeni şifrenizi girin.' }
  if (!confirm) return { ok: false, status: 400, error: 'Yeni şifrenizi tekrar girin.' }
  if (next !== confirm) return { ok: false, status: 400, error: 'Yeni şifreler eşleşmiyor.' }
  if (current === next) {
    return { ok: false, status: 400, error: 'Yeni şifre mevcut şifreden farklı olmalı.' }
  }
  if (!isPasswordValid(next)) {
    return { ok: false, status: 400, error: passwordRequirementsMessage() }
  }
  return { ok: true, currentPassword: current, newPassword: next }
}

export async function handlePasswordChange(req, res, body) {
  const { user, error: authErr } = await getUserFromRequest(req)
  if (authErr || !user) {
    return res.status(401).json({ ok: false, error: 'Oturum bulunamadı. Lütfen giriş yapın.' })
  }

  const rl = await enforceRateLimit({
    req,
    prefix: 'auth-password-change',
    limit: 12,
    windowMs: 60 * 60 * 1000,
    extraKey: user.id,
  })
  applyRateLimitHeaders(res, rl.headers)
  if (!rl.ok) {
    return res.status(rl.status).json({ ok: false, error: rl.error })
  }

  if (!userHasPasswordProvider(user)) {
    return res.status(400).json({
      ok: false,
      code: 'NO_PASSWORD',
      error: 'Bu hesap Google veya Facebook ile açıldı. Şifre yok — e-posta ile şifre belirlemek için “Şifremi unuttum” kullanın.',
    })
  }

  const fields = validatePasswordChangeFields({
    currentPassword: body.currentPassword || body.oldPassword,
    newPassword: body.newPassword || body.password,
    confirmPassword: body.confirmPassword || body.passwordConfirm,
  })
  if (!fields.ok) {
    return res.status(fields.status).json({ ok: false, error: fields.error })
  }

  const email = String(user.email || '').trim()
  if (!email) {
    return res.status(400).json({ ok: false, error: 'Hesap e-postası bulunamadı.' })
  }

  const check = await verifyAccountPassword(email, fields.currentPassword)
  if (!check.ok || (check.userId && check.userId !== user.id)) {
    return res.status(401).json({ ok: false, error: check.error || 'Mevcut şifre hatalı.' })
  }

  const admin = getSupabaseAdmin()
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: fields.newPassword,
  })
  if (updateErr) {
    return res.status(400).json({
      ok: false,
      error: formatPasswordAuthError(updateErr.message) || 'Şifre güncellenemedi.',
    })
  }

  return res.status(200).json({ ok: true })
}
