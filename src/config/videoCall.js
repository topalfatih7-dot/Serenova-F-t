/**
 * Video görüşme yapılandırması — bağlantı bilgilerini .env dosyasına ekleyin.
 *
 * Daily.co hesabı: https://dashboard.daily.co
 * Domain örneği: yourteam.daily.co
 */

export const VIDEO_CALL_CONFIG = {
  /** Daily.co subdomain (https://DOMAIN/room-name) */
  domain: (import.meta.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  /** Oda adı öneki: {prefix}-{coach|dietitian}-{sessionId} */
  roomPrefix: import.meta.env.VITE_DAILY_ROOM_PREFIX || 'donusum',
  /** İsteğe bağlı — REST API ile oda oluşturmak için (ileride backend) */
  apiKey: import.meta.env.VITE_DAILY_API_KEY || '',
  /** Randevudan kaç dakika önce katılıma izin verilsin */
  joinMinutesBefore: Number(import.meta.env.VITE_VIDEO_JOIN_MINUTES_BEFORE) || 15,
  /** Randevu süresinden kaç dakika sonra oda kapanır */
  joinMinutesAfter: Number(import.meta.env.VITE_VIDEO_JOIN_MINUTES_AFTER) || 30,
}

export function isVideoCallConfigured() {
  return Boolean(VIDEO_CALL_CONFIG.domain)
}

export function buildRoomName(sessionType, sessionId) {
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '')
  return `${VIDEO_CALL_CONFIG.roomPrefix}-${sessionType}-${safeId}`.toLowerCase()
}

export function buildRoomUrl(sessionType, sessionId) {
  if (!isVideoCallConfigured()) return null
  const room = buildRoomName(sessionType, sessionId)
  return `https://${VIDEO_CALL_CONFIG.domain}/${room}`
}

/** Üye paneli görüşme yolu */
export function memberCallPath(sessionType, sessionId) {
  return `/call/${sessionType}/${sessionId}`
}

/** Koç / diyetisyen paneli görüşme yolu */
export function staffCallPath(sessionType, sessionId) {
  return `/staff/call/${sessionType}/${sessionId}`
}

/**
 * Sunucu tarafından oda oluştur + toplantı tokeni al (production güvenli mod).
 * DAILY_API_KEY Vercel'de tanımlı değilse 503 döner → uygulama public modda çalışır.
 * @returns {Promise<string|null>} token string veya null
 */
export async function getDailyToken(roomName, userName, isOwner = false) {
  try {
    const res = await fetch('/api/daily-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, userName, isOwner }),
    })
    const data = await res.json().catch(() => ({}))
    return data.ok ? (data.token || null) : null
  } catch {
    return null
  }
}

export const SESSION_TYPE_META = {
  coach: {
    label: 'Koç Görüşmesi',
    roleLabel: 'Koç',
    memberLabel: 'Danışan',
    accent: 'brand',
    gradient: 'from-brand-600 to-brand-800',
    lightBg: 'bg-brand-50',
    text: 'text-brand-700',
    ring: 'ring-brand-200',
    btn: 'bg-brand-500 hover:bg-brand-600',
  },
  dietitian: {
    label: 'Diyetisyen Görüşmesi',
    roleLabel: 'Diyetisyen',
    memberLabel: 'Danışan',
    accent: 'sage',
    gradient: 'from-sage-600 to-emerald-800',
    lightBg: 'bg-sage-50',
    text: 'text-sage-700',
    ring: 'ring-sage-200',
    btn: 'bg-sage-500 hover:bg-sage-600',
  },
}
