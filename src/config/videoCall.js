/**
 * Video görüşme yapılandırması — bağlantı bilgilerini .env dosyasına ekleyin.
 *
 * Daily.co hesabı: https://dashboard.daily.co
 * Domain örneği: yourteam.daily.co
 *
 * Katılma pencereleri (varsayılan): koç 10/20 · diyetisyen 15/30 · doktor 15/30
 * api/_videoJoinWindows.js ile aynı sayılar.
 */

import { getApiAuthHeaders } from '../services/apiAuth.js'
import { normalizeSessionType } from '../utils/staffRoles'

const JOIN_WINDOW_DEFAULTS = {
  coach: { before: 10, after: 20 },
  dietitian: { before: 15, after: 30 },
  doctor: { before: 15, after: 30 },
}

function envMinutes(name, fallback) {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export const VIDEO_CALL_CONFIG = {
  /** Daily.co subdomain (https://DOMAIN/room-name) */
  domain: (import.meta.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  /** Oda adı öneki: {prefix}-{coach|dietitian|doctor}-{sessionId} */
  roomPrefix: import.meta.env.VITE_DAILY_ROOM_PREFIX || 'donusum',
}

/** Sektöre göre katılma penceresi (dk önce / süre bitiminden sonra) */
export function getJoinWindowMinutes(sessionType) {
  const type = normalizeSessionType(sessionType)
  const base = JOIN_WINDOW_DEFAULTS[type] || JOIN_WINDOW_DEFAULTS.coach
  const suffix = type.toUpperCase()
  return {
    before: envMinutes(`VITE_VIDEO_JOIN_BEFORE_${suffix}`, base.before),
    after: envMinutes(`VITE_VIDEO_JOIN_AFTER_${suffix}`, base.after),
  }
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
 * Sunucu: oda + token. Yetki + join penceresi api/daily-room’da doğrulanır.
 * @returns {Promise<{ token: string|null, error?: string, code?: string }>}
 */
export async function getDailyToken(sessionType, sessionId, userName) {
  try {
    const res = await fetch('/api/daily-room', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ sessionType, sessionId, userName }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.ok && data.token) {
      return { token: data.token, roomUrl: data.roomUrl || null }
    }
    const code = data.code || (res.status === 403 ? 'forbidden' : 'error')
    return {
      token: null,
      error: data.error || 'Görüşme odasına bağlanılamadı.',
      code,
    }
  } catch {
    return { token: null, error: 'Bağlantı hatası. Tekrar deneyin.', code: 'network' }
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
  doctor: {
    label: 'Doktor Görüşmesi',
    roleLabel: 'Doktor',
    memberLabel: 'Danışan',
    accent: 'amber',
    gradient: 'from-amber-600 to-orange-800',
    lightBg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
}
