/** E-posta girişini temizler — otomatik doldurma boşlukları, gizli karakterler vb. */
export function sanitizeEmailInput(raw) {
  if (raw == null) return ''
  return String(raw)
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

export const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

export function isValidEmailAddress(raw) {
  const email = sanitizeEmailInput(raw)
  if (!email || email.length > 254) return false
  if (!EMAIL_RE.test(email)) return false
  const [, domain] = email.split('@')
  if (!domain || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false
  return true
}

/** Geçerli e-posta döner; geçersizse null */
export function normalizeEmailAddress(raw) {
  const email = sanitizeEmailInput(raw)
  return isValidEmailAddress(email) ? email : null
}
