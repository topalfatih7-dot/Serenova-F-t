/**
 * Basic paket AI programları — client yardımcıları.
 * Sunucu mantığı: api/_aiBasicPrograms.js
 */

export const AI_BASIC_SOURCE = 'ai_basic'
export const AI_BASIC_CYCLE_LENGTH = 14

function toDateStr(value) {
  if (!value) return null
  if (typeof value === 'string') {
    const slice = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

function parseLocalDate(str) {
  const s = toDateStr(str)
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

/** Kayıt tarihinden 14 günlük pencere hâlâ açık mı? */
export function isBasicProgramWindowOpen(joinedAt, today = new Date()) {
  const start = parseLocalDate(joinedAt)
  if (!start) return false
  const end = new Date(start.getTime())
  end.setDate(end.getDate() + AI_BASIC_CYCLE_LENGTH - 1)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
  return end >= todayStart
}

export function memberHasAiBasicPrograms(programs = []) {
  return (programs || []).some((p) => p?.source === AI_BASIC_SOURCE)
}

export function resolveJoinedAt(member) {
  return toDateStr(member?.joinedAt) || toDateStr(member?.createdAt) || null
}
