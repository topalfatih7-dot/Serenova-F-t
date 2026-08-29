/** Analiz sonrası sağlık testi yeniden çözme aralığı (gün). */
export const HEALTH_TEST_RETAKE_DAYS = 14

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

/** Kilit sayacı: opsiyonel bitiş → legacy analiz zamanı. */
export function getHealthTestLockTimestamp({ optionalCompletedAt = null, healthAnalysis = null } = {}) {
  return (
    parseTimestamp(optionalCompletedAt)
    || parseTimestamp(healthAnalysis?.questionsLockedAt)
    || getAnalysisTimestamp(healthAnalysis)
  )
}

/**
 * "Testi Yeniden Çöz" eski kilit döngüsünü kapatır.
 * retakeAt, kilit başlangıcından (veya zaman damgası yokken) sonra ise yeni döngü.
 */
export function isRetakeAfterLockStart(retakeAt, lockTs) {
  const retakeTs = parseTimestamp(retakeAt)
  if (!retakeTs) return false
  return !lockTs || retakeTs >= lockTs
}

/**
 * Retake, son analiz damgasından sonra ise çekirdek skorlar yeniden üretilmeli.
 * Eski skorlar duruyor olsa bile (Şenol tipi leftover) true döner.
 */
export function needsCoreAnalysisAfterRetake(healthAnalysis, { retakeAt = null } = {}) {
  if (!retakeAt) return false
  return isRetakeAfterLockStart(retakeAt, getAnalysisTimestamp(healthAnalysis))
}

/** Retake sonrası canlı skorları düşürür; healthScoreHistory korunur. */
export function buildRetakeHealthAnalysisReset(retakeAt) {
  return {
    analysisStage: 'core',
    retakePending: true,
    resetAt: retakeAt || new Date().toISOString(),
  }
}

/**
 * Opsiyoneller bitince yazılacak kilit zamanı.
 * Retake sonrası eski detailed analiz damgası kullanılmaz.
 */
export function resolveOptionalCompletedAtTimestamp({
  existing = null,
  retakeAt = null,
  healthAnalysis = null,
  nowIso = null,
} = {}) {
  if (existing) return existing
  const fromAnalysis = healthAnalysis?.analysisStage === 'detailed'
    ? (healthAnalysis?.aiAttemptedAt || healthAnalysis?.generatedAt || null)
    : null
  const analysisTs = parseTimestamp(fromAnalysis)
  if (fromAnalysis && !isRetakeAfterLockStart(retakeAt, analysisTs)) {
    return fromAnalysis
  }
  return nowIso || new Date().toISOString()
}

function unlockedLockState() {
  return {
    locked: false,
    lockedUntil: null,
    daysLeft: 0,
    canRetake: false,
    fullLock: false,
  }
}

/**
 * 14 günlük kilit durumu.
 * - Kilit yalnızca tüm opsiyoneller bitince (detailedComplete / optionalCompletedAt) veya stage=detailed iken başlar
 * - fullLock: kilitliyken tüm sorular kapalı
 * - canRetake: süre dolmuş → sıfırdan yeniden çözülebilir
 * - retakeAt kilit başlangıcından sonraysa yeni döngü: kilit yok (eski detailed stage kalsa bile)
 */
export function getHealthTestLockState({
  healthAnalysis,
  detailedComplete = false,
  optionalCompletedAt = null,
  retakeAt = null,
} = {}) {
  const stage = healthAnalysis?.analysisStage
  const questionsDone = detailedComplete === true || stage === 'detailed' || Boolean(optionalCompletedAt)

  if (!questionsDone) return unlockedLockState()

  const ts = getHealthTestLockTimestamp({ optionalCompletedAt, healthAnalysis })
  if (isRetakeAfterLockStart(retakeAt, ts)) return unlockedLockState()

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
