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

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Analiz zaman damgası (aiAttemptedAt → generatedAt). */
export function getAnalysisTimestamp(analysis) {
  const raw = analysis?.aiAttemptedAt || analysis?.generatedAt || null
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : null
}

/**
 * Detaylı analiz için 14 günlük sunucu kilidi.
 * force / core aşaması yükseltmesi muaf tutulur (handler tarafında).
 */
export function getHealthTestLockState(analysis) {
  if (!isCompleteHealthAnalysis(analysis)) {
    return {
      locked: false,
      lockedUntil: null,
      daysLeft: 0,
      canRetake: false,
      fullLock: false,
    }
  }

  const ts = getAnalysisTimestamp(analysis)
  if (!ts) {
    return {
      locked: false,
      lockedUntil: null,
      daysLeft: 0,
      canRetake: true,
      fullLock: false,
    }
  }

  const lockedUntilMs = ts + (HEALTH_TEST_RETAKE_DAYS * MS_PER_DAY)
  const lockedUntil = new Date(lockedUntilMs)
  const now = Date.now()
  const locked = now < lockedUntilMs
  const daysLeft = locked
    ? Math.max(1, Math.ceil((lockedUntilMs - now) / MS_PER_DAY))
    : 0
  const canRetake = !locked
  const fullLock = locked && analysis?.analysisStage === 'detailed'

  return {
    locked,
    lockedUntil,
    daysLeft,
    canRetake,
    fullLock,
  }
}

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
