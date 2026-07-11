/** Sunucu tarafı e-posta normalizasyonu (Stripe / Supabase admin) */

export function sanitizeEmailInput(raw) {
  if (raw == null) return ''
  let out = ''
  for (const ch of String(raw)) {
    const cp = ch.codePointAt(0)
    if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f)) continue
    if (cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0xfeff) continue
    out += ch
  }
  return out.trim().toLowerCase()
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
