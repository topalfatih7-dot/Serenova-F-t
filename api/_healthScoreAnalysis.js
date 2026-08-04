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

export const MEMBER_BRIEF_KEYS = ['strengths', 'focus', 'planPitch']

/** Analiz sonrası sağlık testi yeniden çözme aralığı (gün). Client ile aynı. */
export const HEALTH_TEST_RETAKE_DAYS = 14

/** healthTest meta — cevap fingerprint'ine dahil edilmez. Client ile aynı. */
export const HEALTH_TEST_META_KEYS = new Set(['retakeAt', 'optionalCompletedAt'])

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Analiz zaman damgası (aiAttemptedAt → generatedAt). */
export function getAnalysisTimestamp(analysis) {
  const raw = analysis?.aiAttemptedAt || analysis?.generatedAt || null
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : null
}

function parseTimestamp(raw) {
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : null
}

export function getHealthTestLockTimestamp({ optionalCompletedAt = null, healthAnalysis = null } = {}) {
  return (
    parseTimestamp(optionalCompletedAt)
    || parseTimestamp(healthAnalysis?.questionsLockedAt)
    || getAnalysisTimestamp(healthAnalysis)
  )
}

export function stripHealthTestMeta(healthTest) {
  if (!healthTest || typeof healthTest !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(healthTest)) {
    if (HEALTH_TEST_META_KEYS.has(key)) continue
    out[key] = value
  }
  return out
}

/**
 * 14 günlük kilit — yalnızca opsiyoneller bitince / stage=detailed.
 * force / core→detailed yükseltmesi handler tarafında muaf.
 * @param {object|null} analysis
 * @param {{ detailedComplete?: boolean, optionalCompletedAt?: string|null }} [opts]
 */
export function getHealthTestLockState(analysis, opts = {}) {
  const detailedComplete = opts.detailedComplete === true
  const optionalCompletedAt = opts.optionalCompletedAt || null
  const stage = analysis?.analysisStage
  const questionsDone = detailedComplete || stage === 'detailed' || Boolean(optionalCompletedAt)

  if (!questionsDone) {
    return {
      locked: false,
      lockedUntil: null,
      daysLeft: 0,
      canRetake: false,
      fullLock: false,
    }
  }

  const ts = getHealthTestLockTimestamp({ optionalCompletedAt, healthAnalysis: analysis })
  if (!ts) {
    const lockedUntilMs = Date.now() + (HEALTH_TEST_RETAKE_DAYS * MS_PER_DAY)
    return {
      locked: true,
      lockedUntil: new Date(lockedUntilMs),
      daysLeft: HEALTH_TEST_RETAKE_DAYS,
      canRetake: false,
      fullLock: true,
    }
  }

  const lockedUntilMs = ts + (HEALTH_TEST_RETAKE_DAYS * MS_PER_DAY)
  const lockedUntil = new Date(lockedUntilMs)
  const now = Date.now()
  const locked = now < lockedUntilMs
  const daysLeft = locked
    ? Math.max(1, Math.ceil((lockedUntilMs - now) / MS_PER_DAY))
    : 0

  return {
    locked,
    lockedUntil,
    daysLeft,
    canRetake: !locked,
    fullLock: locked,
  }
}

export function clampScore(n, fallback = null) {
  const num = Number(n)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

/** Deterministik fingerprint — client ile aynı algoritma (djb2). */
export function buildHealthAnalysisFingerprint(profile = {}) {
  const ht = stripHealthTestMeta(profile.healthTest)
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

/** Tam skor + staffBrief var mı (yeniden analiz kilidi için). */
export function isCompleteHealthAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') return false
  if (analysis.overallScore == null && analysis.overallScore !== 0) return false
  if (!analysis.scores || typeof analysis.scores !== 'object') return false
  for (const key of SCORE_KEYS) {
    if (analysis.scores[key] == null) return false
  }
  const brief = analysis.staffBrief
  if (!brief || typeof brief !== 'object') return false
  for (const key of STAFF_BRIEF_KEYS) {
    if (!String(brief[key] || '').trim()) return false
  }
  return true
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

/** Üyeye dönük motive edici brief — eksikse null (istek başarısız sayılmaz). */
export function normalizeMemberBrief(parsed = {}) {
  const raw = parsed.memberBrief && typeof parsed.memberBrief === 'object'
    ? parsed.memberBrief
    : null
  if (!raw) return null
  const out = {}
  for (const key of MEMBER_BRIEF_KEYS) {
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
    memberBrief: normalizeMemberBrief(parsed),
  }
}
