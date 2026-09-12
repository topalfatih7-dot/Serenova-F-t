/** Saf e-posta kutusu yardımcıları (test edilebilir, I/O yok). */

export const MAILBOX_DOMAIN = 'yeniform.com'
export const MAX_MAIL_SUBJECT = 200
export const MAX_MAIL_BODY = 20000
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
export const MAX_ATTACHMENTS = 4

export const ALLOWED_ATTACHMENT_EXT = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'txt', 'csv', 'zip',
  'doc', 'docx', 'xls', 'xlsx',
])

export const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
])

const ANGLE_EMAIL = /<([^>]+)>/

export function extractEmailAddress(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  const angled = text.match(ANGLE_EMAIL)
  const email = (angled ? angled[1] : text).trim().toLowerCase()
  return email.includes('@') ? email : ''
}

export function extractDisplayName(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  const angled = text.match(ANGLE_EMAIL)
  if (!angled) return ''
  return text.slice(0, angled.index).trim().replace(/^"|"$/g, '')
}

export function uniqueEmails(list) {
  const out = []
  const seen = new Set()
  for (const item of Array.isArray(list) ? list : [list]) {
    const email = extractEmailAddress(item)
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export function normalizeSubject(raw) {
  let subject = String(raw || '').trim()
  for (let i = 0; i < 8; i += 1) {
    const next = subject.replace(/^(re|fw|fwd)\s*:\s*/i, '').trim()
    if (next === subject) break
    subject = next
  }
  return subject.toLowerCase().replace(/\s+/g, ' ')
}

export function isYeniformAddress(email) {
  const addr = extractEmailAddress(email)
  return addr.endsWith(`@${MAILBOX_DOMAIN}`)
}

export function pickAliasEmail(candidates, aliases) {
  const allowed = new Set(
    (aliases || [])
      .filter((row) => row?.is_active !== false)
      .map((row) => extractEmailAddress(row.email || row))
      .filter(Boolean),
  )
  for (const item of candidates || []) {
    const email = extractEmailAddress(item)
    if (allowed.has(email)) return email
  }
  return ''
}

export function snippetFromBodies({ text, html }, max = 160) {
  const fromText = String(text || '').replace(/\s+/g, ' ').trim()
  if (fromText) return fromText.slice(0, max)
  const fromHtml = String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return fromHtml.slice(0, max)
}

export function attachmentExtOk(filename) {
  const ext = String(filename || '').split('.').pop() || ''
  return ALLOWED_ATTACHMENT_EXT.has(ext.toLowerCase())
}

export function attachmentMimeOk(mime) {
  const type = String(mime || '').split(';')[0].trim().toLowerCase()
  if (!type) return true
  return ALLOWED_ATTACHMENT_MIME.has(type)
}

export function safeStorageSegment(name) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80) || 'file'
}
