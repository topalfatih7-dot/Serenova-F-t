/**
 * Staff sağlık skoru — sunucu tarafı normalize / fingerprint.
 */

export const SCORE_KEYS = [
  'general',
  'nutrition',
  'movement',
  'sleep',
  'stress',
  'lifestyle',
  'motivation',
  'readiness',
]

export const STAFF_BRIEF_KEYS = ['general', 'nutrition', 'movement', 'risks', 'actions']

export function clampScore(n, fallback = null) {
  const num = Number(n)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

/** Deterministik fingerprint — client ile aynı algoritma (djb2). */
export function buildHealthAnalysisFingerprint(profile = {}) {
  const ht = profile.healthTest && typeof profile.healthTest === 'object' ? profile.healthTest : {}
  const payload = JSON.stringify({
    ht,
    age: profile.age ?? null,
    gender: profile.gender ?? null,
    height: profile.height ?? null,
    weight: profile.weight ?? null,
  })
  let hash = 5381
  for (let i = 0; i < payload.length; i += 1) {
    hash = ((hash << 5) + hash) ^ payload.charCodeAt(i)
  }
  return `v1:${(hash >>> 0).toString(36)}`
}

export function normalizeStaffBrief(parsed = {}) {
  const raw = parsed.staffBrief && typeof parsed.staffBrief === 'object'
    ? parsed.staffBrief
    : (parsed && typeof parsed === 'object' && STAFF_BRIEF_KEYS.every((k) => k in parsed) ? parsed : null)
  if (!raw) return null
  const out = {}
  for (const key of STAFF_BRIEF_KEYS) {
    const text = String(raw[key] || '').trim()
    if (!text) return null
    out[key] = text.slice(0, 1200)
  }
  return out
}

export function normalizeHealthScores(parsed = {}) {
  const rawScores = parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : parsed
  const scores = {}
  for (const key of SCORE_KEYS) {
    const v = clampScore(rawScores?.[key])
    if (v == null) return null
    scores[key] = v
  }
  let overall = clampScore(parsed.overallScore ?? parsed.overall)
  if (overall == null) {
    overall = Math.round(SCORE_KEYS.reduce((s, k) => s + scores[k], 0) / SCORE_KEYS.length)
  }
  return {
    scores,
    overallScore: overall,
    summary: String(parsed.summary || '').trim().slice(0, 400),
    staffBrief: normalizeStaffBrief(parsed),
  }
}
