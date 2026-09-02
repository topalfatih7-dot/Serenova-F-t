/**
 * Video katılma pencereleri — sektör bazlı (api + client aynı varsayılanlar).
 * Client: src/config/videoCall.js getJoinWindowMinutes
 */

const DEFAULTS = {
  coach: { before: 10, after: 20 },
  dietitian: { before: 15, after: 30 },
}

function envInt(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function normalizeVideoSessionType(sessionType) {
  if (sessionType === 'dietitian') return sessionType
  return 'coach'
}

/** @returns {{ before: number, after: number }} */
export function getJoinWindowMinutes(sessionType) {
  const type = normalizeVideoSessionType(sessionType)
  const base = DEFAULTS[type] || DEFAULTS.coach
  const suffix = type.toUpperCase()
  return {
    before: envInt(`VIDEO_JOIN_BEFORE_${suffix}`, envInt(`VITE_VIDEO_JOIN_BEFORE_${suffix}`, base.before)),
    after: envInt(`VIDEO_JOIN_AFTER_${suffix}`, envInt(`VITE_VIDEO_JOIN_AFTER_${suffix}`, base.after)),
  }
}

export function getSessionJoinTiming(session, sessionType, now = new Date()) {
  const start = new Date(session?.date)
  const durationMin = Number(session?.duration) || 30
  const { before, after } = getJoinWindowMinutes(sessionType)
  const windowStart = new Date(start.getTime() - before * 60_000)
  const sessionEnd = new Date(start.getTime() + durationMin * 60_000)
  const windowEnd = new Date(start.getTime() + (durationMin + after) * 60_000)

  return {
    start,
    sessionEnd,
    windowStart,
    windowEnd,
    before,
    after,
    isExpired: now > windowEnd,
    isBeforeWindow: now < windowStart,
    isInJoinWindow: now >= windowStart && now <= windowEnd,
    isLive: now >= start && now <= sessionEnd,
  }
}
