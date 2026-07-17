/**
 * Basic / Eko AI programları — client yardımcıları.
 */

export const AI_BASIC_SOURCE = 'ai_basic'
export const AI_EKO_SOURCE = 'ai_eko'

function toDateStr(value) {
  if (!value) return null
  if (typeof value === 'string') {
    if (value.includes('T')) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
    }
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

/** 48s deneme hâlâ açık mı? */
export function isBasicProgramWindowOpen(freeTrialExpiresAt, today = new Date()) {
  if (!freeTrialExpiresAt) return false
  const exp = new Date(freeTrialExpiresAt)
  if (Number.isNaN(exp.getTime())) return false
  return exp.getTime() > today.getTime()
}

export function memberHasAiBasicPrograms(programs = []) {
  return (programs || []).some((p) => p?.source === AI_BASIC_SOURCE)
}

export function memberHasAiEkoPrograms(programs = []) {
  return (programs || []).some((p) => p?.source === AI_EKO_SOURCE)
}

export function resolveFreeTrialExpiresAt(member) {
  return member?.freeTrialExpiresAt || null
}

export function resolvePremiumExpiresAt(member) {
  return member?.premiumExpiresAt || null
}
