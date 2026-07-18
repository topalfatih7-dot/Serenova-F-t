/**
 * Tek kullanımlık / bot e-posta alan adları — kayıt engeli.
 * Tam eşleşme (domain) + yaygın alt desenler.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'mailinator.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'throwaway.email',
  'yopmail.com',
  'trashmail.com',
  'trashmail.me',
  'getnada.com',
  'maildrop.cc',
  'dispostable.com',
  'mailnesia.com',
  'fakeinbox.com',
  'emailondeck.com',
  'mintemail.com',
  'moakt.com',
  'tmpmail.org',
  'tmpmail.net',
  'nonexistent.xyz',
])

const DISPOSABLE_SUFFIXES = [
  '.mailinator.com',
  '.guerrillamail.com',
  '.yopmail.com',
]

export function isDisposableEmail(email) {
  const normalized = String(email || '').trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at < 1) return false
  const domain = normalized.slice(at + 1)
  if (!domain || domain.includes(' ')) return false
  if (DISPOSABLE_DOMAINS.has(domain)) return true
  return DISPOSABLE_SUFFIXES.some((suffix) => domain.endsWith(suffix))
}

export function disposableEmailError() {
  return 'Bu e-posta sağlayıcısı kabul edilmiyor. Lütfen kalıcı bir e-posta adresi kullanın.'
}
