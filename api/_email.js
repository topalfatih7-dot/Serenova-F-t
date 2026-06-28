/** Sunucu tarafı e-posta normalizasyonu (Stripe / Supabase admin) */

export function sanitizeEmailInput(raw) {
  if (raw == null) return ''
  return String(raw)
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

export function normalizeEmailAddress(raw) {
  const email = sanitizeEmailInput(raw)
  if (!email || email.length > 254) return null
  if (!EMAIL_RE.test(email)) return null
  const [, domain] = email.split('@')
  if (!domain || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return null
  return email
}
