export const CONTACT_SUBJECTS = [
  { value: 'general', label: 'Genel bilgi' },
  { value: 'membership', label: 'Üyelik & kayıt' },
  { value: 'premium', label: 'Premium paket' },
  { value: 'support', label: 'Teknik destek' },
  { value: 'partnership', label: 'İş birliği' },
  { value: 'other', label: 'Diğer' },
]

export const CONTACT_SUBJECT_LABELS = Object.fromEntries(
  CONTACT_SUBJECTS.map((s) => [s.value, s.label]),
)

export function contactSubjectLabel(subject) {
  const key = String(subject || '').trim()
  return CONTACT_SUBJECT_LABELS[key] || key || 'Genel bilgi'
}

export function parseContactReplies(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const body = String(item.body || item.text || '').trim()
      if (!body) return null
      return {
        id: String(item.id || item.sentAt || item.sent_at || ''),
        body,
        sentAt: item.sentAt || item.sent_at || item.createdAt || null,
        sentByName: String(item.sentByName || item.sent_by_name || 'Yeni Form').trim() || 'Yeni Form',
        mailId: item.mailId || item.mail_id || null,
      }
    })
    .filter(Boolean)
}
