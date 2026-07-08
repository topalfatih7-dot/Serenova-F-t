/**
 * Sohbet / destek mesajlarında platform dışı iletişim bilgisi paylaşımını
 * (telefon, e-posta, WhatsApp/Telegram/Instagram vb.) tespit eder.
 * Amaç: üye ↔ koç/diyetisyen/doktor iletişiminin uygulama dışına taşınmasını
 * zorlaştırmak (bkz. güvenlik denetimi 2026-07-08).
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

// En az 9 haneli, ayraçlarla (boşluk/nokta/tire/parantez) yazılabilen telefon benzeri diziler.
const PHONE_CANDIDATE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g

const EXTERNAL_APP_KEYWORDS = [
  'whatsapp', 'wa.me', 'telegram', 't.me/', 'instagram', 'i̇nstagram',
  'snapchat', 'discord', 'skype', 'messenger', 'facebook.com', 'fb.com/',
  'twitter.com/', 'x.com/', 'linkedin.com/in',
]

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function hasPhoneNumber(text) {
  const matches = text.match(PHONE_CANDIDATE_RE) || []
  return matches.some((m) => digitsOnly(m).length >= 9)
}

function hasEmail(text) {
  return EMAIL_RE.test(text)
}

function hasExternalAppMention(text) {
  const normalized = text.toLowerCase().replace(/i̇/g, 'i')
  return EXTERNAL_APP_KEYWORDS.some((kw) => normalized.includes(kw))
}

/**
 * @param {string} text
 * @returns {{ blocked: boolean, reason: string }}
 */
export function detectExternalContactInfo(text) {
  const value = String(text || '')
  if (!value.trim()) return { blocked: false, reason: '' }

  if (hasEmail(value)) {
    return { blocked: true, reason: 'e-posta adresi' }
  }
  if (hasExternalAppMention(value)) {
    return { blocked: true, reason: 'sosyal medya / harici uygulama bağlantısı' }
  }
  if (hasPhoneNumber(value)) {
    return { blocked: true, reason: 'telefon numarası' }
  }
  return { blocked: false, reason: '' }
}

export const CONTACT_INFO_BLOCK_MESSAGE =
  'Güvenliğiniz için mesajınızda paylaşım algılandı. Tüm iletişim uygulama içinden yürütülmelidir; lütfen iletişim bilgisi paylaşmadan tekrar yazın.'
