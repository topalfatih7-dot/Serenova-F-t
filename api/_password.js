/**
 * Sunucu tarafı şifre kuralları — istemci `src/services/password.js` ile aynı.
 * En az 8 karakter + küçük + büyük + rakam + özel karakter.
 */

export function isPasswordValid(password) {
  const v = String(password || '')
  return (
    v.length >= 8
    && /[a-z]/.test(v)
    && /[A-Z]/.test(v)
    && /\d/.test(v)
    && /[^A-Za-z0-9]/.test(v)
  )
}

export function passwordRequirementsMessage() {
  return 'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.'
}

/** Supabase Auth / HIBP ve diğer şifre hatalarını Türkçe’ye çevirir. */
export function formatPasswordAuthError(raw) {
  const msg = String(raw || '')
  if (/captcha/i.test(msg)) {
    return 'Bot doğrulaması gerekli. Kutuyu yenileyip tekrar deneyin.'
  }
  if (/known to be weak|easy to guess|pwned|leaked|hibp/i.test(msg)) {
    return passwordRequirementsMessage()
  }
  if (/weak.?password|password.?should|at least one character/i.test(msg)) {
    return passwordRequirementsMessage()
  }
  return msg
}
