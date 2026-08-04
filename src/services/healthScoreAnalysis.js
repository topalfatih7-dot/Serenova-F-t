import { describeHealthTest } from '../data/healthTest'
import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_FETCH_TIMEOUT_MS = 45_000

/** Staff sağlık analizi şema sürümü (fingerprint ile birlikte). */
export const HEALTH_SCORE_ANALYSIS_VERSION = 11

export const HEALTH_SCORE_KEYS = [
  'general',
  'nutrition',
  'movement',
  'sleep',
  'stress',
  'lifestyle',
  'motivation',
  'readiness',
]

export const HEALTH_SCORE_META = {
  general: { label: 'Genel Sağlık', emoji: '❤️', color: 'brand' },
  nutrition: { label: 'Beslenme', emoji: '🍎', color: 'sage' },
  movement: { label: 'Hareket', emoji: '🏋️', color: 'amber' },
  sleep: { label: 'Uyku', emoji: '🌙', color: 'sky' },
  stress: { label: 'Stres', emoji: '🧘', color: 'violet' },
  lifestyle: { label: 'Yaşam Tarzı', emoji: '🌿', color: 'emerald' },
  motivation: { label: 'Motivasyon', emoji: '🔥', color: 'orange' },
  readiness: { label: 'Hazır Oluş', emoji: '🚦', color: 'rose' },
}

export const STAFF_BRIEF_KEYS = ['general', 'nutrition', 'movement', 'risks', 'actions']

export const STAFF_BRIEF_META = {
  general: { label: 'Genel durum' },
  nutrition: { label: 'Beslenme' },
  movement: { label: 'Hareket' },
  risks: { label: 'Riskler' },
  actions: { label: 'Aksiyon' },
}

export const MEMBER_BRIEF_KEYS = ['strengths', 'focus', 'planPitch']

export const HEALTH_SCORE_HISTORY_MAX = 24

/** Analiz sonrası sağlık testi yeniden çözme aralığı (gün). */
export const HEALTH_TEST_RETAKE_DAYS = 14

/** healthTest içindeki meta alanlar — cevap fingerprint'ine dahil edilmez. */
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

/** Kilit sayacı: opsiyonel bitiş → legacy analiz zamanı. */
export function getHealthTestLockTimestamp({ optionalCompletedAt = null, healthAnalysis = null } = {}) {
  return (
    parseTimestamp(optionalCompletedAt)
    || parseTimestamp(healthAnalysis?.questionsLockedAt)
    || getAnalysisTimestamp(healthAnalysis)
  )
}

/**
 * Cevap fingerprint'i için healthTest meta alanlarını ayıklar.
 * api/_healthScoreAnalysis.js ile aynı.
 */
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
 * 14 günlük kilit durumu.
 * - Kilit yalnızca tüm opsiyoneller bitince (detailedComplete) veya stage=detailed iken başlar
 * - fullLock: kilitliyken tüm sorular kapalı
 * - canRetake: süre dolmuş → sıfırdan yeniden çözülebilir
 */
export function getHealthTestLockState({
  healthAnalysis,
  detailedComplete = false,
  optionalCompletedAt = null,
} = {}) {
  const stage = healthAnalysis?.analysisStage
  const questionsDone = detailedComplete === true || stage === 'detailed'

  if (!questionsDone) {
    return {
      locked: false,
      lockedUntil: null,
      daysLeft: 0,
      canRetake: false,
      fullLock: false,
    }
  }

  const ts = getHealthTestLockTimestamp({ optionalCompletedAt, healthAnalysis })
  if (!ts) {
    // Persist henüz yazılmadıysa şimdiden kilitle (UI); sync optionalCompletedAt yazar
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
  const canRetake = !locked

  return {
    locked,
    lockedUntil,
    daysLeft,
    canRetake,
    fullLock: locked,
  }
}

/** Deterministik fingerprint — api/_healthScoreAnalysis.js ile aynı (djb2). */
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

/**
 * Analiz eksikse ilk otomatik üretim gerekir.
 * Fingerprint değişimi burada false döner (otomatik yeniden üretim yok).
 */
export function needsInitialHealthAnalysis(analysis) {
  if (!analysis?.overallScore && analysis?.overallScore !== 0) return true
  if (!analysis?.scores || typeof analysis.scores !== 'object') return true
  for (const key of HEALTH_SCORE_KEYS) {
    if (analysis.scores[key] == null) return true
  }
  if (!normalizeStaffBrief(analysis.staffBrief)) return true
  if (analysis.radarScores && !analysis.scores) return true
  return false
}

/**
 * Çekirdek analiz var, opsiyonel sorular tamamlandı → detaylı yeniden üretim gerekir.
 * analysisStage === 'detailed' ise false.
 */
export function needsDetailedHealthAnalysis(analysis, isDetailedComplete) {
  if (!isDetailedComplete) return false
  if (needsInitialHealthAnalysis(analysis)) return false
  if (analysis?.analysisStage === 'detailed') return false
  return true
}

/** Eski kayıtlarda analysisStage yoksa çıkarım. */
export function resolveAnalysisStage(analysis, isDetailedComplete = false) {
  if (!analysis || needsInitialHealthAnalysis(analysis)) return null
  if (analysis.analysisStage === 'detailed' || analysis.analysisStage === 'core') {
    return analysis.analysisStage
  }
  // Geriye dönük: tam skorlu kayıt varsa, detaylı tamamlandıysa detailed say
  return isDetailedComplete ? 'detailed' : 'core'
}

/** HT / profil değişti; personel yeniden analiz etmeli. */
export function isHealthAnalysisStale(analysis, profile = {}) {
  if (!analysis || needsInitialHealthAnalysis(analysis)) return false
  const current = buildHealthAnalysisFingerprint(profile)
  if (!analysis.sourceFingerprint) return true
  return analysis.sourceFingerprint !== current
}

/** Skor snapshot'ını history dizisine ekler / aynı gün kaydını günceller. */
export function appendHealthScoreHistory(prevHistory, analysis) {
  if (analysis?.overallScore == null && analysis?.overallScore !== 0) return prevHistory || []
  const at = analysis?.aiAttemptedAt || new Date().toISOString()
  const day = String(at).slice(0, 10)
  const entry = {
    at,
    overallScore: analysis.overallScore,
    scores: { ...(analysis.scores || {}) },
  }
  const list = Array.isArray(prevHistory) ? [...prevHistory] : []
  const sameDayIdx = list.findIndex((h) => String(h?.at || '').slice(0, 10) === day)
  if (sameDayIdx >= 0) list[sameDayIdx] = entry
  else list.push(entry)
  list.sort((a, b) => String(a.at).localeCompare(String(b.at)))
  return list.slice(-HEALTH_SCORE_HISTORY_MAX)
}

export function buildFallbackStaffBrief(scores = {}, overallScore = 50) {
  const s = scores || {}
  const weak = HEALTH_SCORE_KEYS
    .filter((k) => (s[k] ?? 50) < 50)
    .map((k) => HEALTH_SCORE_META[k]?.label || k)
  const strong = HEALTH_SCORE_KEYS
    .filter((k) => (s[k] ?? 50) >= 70)
    .map((k) => HEALTH_SCORE_META[k]?.label || k)

  return {
    general: `Danışanın genel sağlık skoru ${overallScore}/100. ${strong.length ? `Güçlü alanlar: ${strong.join(', ')}.` : 'Belirgin bir üstün alan öne çıkmıyor.'} ${weak.length ? `Dikkat gerektiren alanlar: ${weak.join(', ')}.` : 'Kritik düşük alan görünmüyor.'} Program planlamasında bu dengeyi göz önünde bulundurun.`,
    nutrition: `Beslenme skoru ${s.nutrition ?? '—'}/100. Öğün düzeni, hidrasyon ve sebze/meyve alışkanlıkları diyetisyen görüşmelerinde önceliklendirilmelidir. Aşırı işlenmiş gıda ve atıştırmalık sıklığı varsa kademeli azaltma hedefleri koyun.`,
    movement: `Hareket skoru ${s.movement ?? '—'}/100. Antrenman yoğunluğu ve frekansı mevcut kapasiteye göre ayarlanmalı; motivasyon (${s.motivation ?? '—'}) ve hazır oluş (${s.readiness ?? '—'}) skorları progressions için rehber alınabilir.`,
    risks: `Uyku (${s.sleep ?? '—'}) ve stres yönetimi (${s.stress ?? '—'}) skorları toparlanma riskini etkiler. Yaşam tarzı skoru ${s.lifestyle ?? '—'}; sigara/alkol/ekran gibi faktörler varsa yük artışı temkinli yapılmalıdır. Tıbbi geçmişteki uyarılar varsa program öncesi netleştirin.`,
    actions: `Önümüzdeki 2–4 haftada en düşük skorlu 1–2 alana odaklanın. Koç ve diyetisyen aynı hedef dilini kullansın; kısa check-in'lerle adherence takip edin. Skor güncellemelerini sağlık testi yenilemeleriyle izleyin.`,
  }
}

function normalizeMemberBrief(raw) {
  if (!raw || typeof raw !== 'object') return null
  const out = {}
  for (const key of MEMBER_BRIEF_KEYS) {
    const text = String(raw[key] || '').trim()
    if (!text) return null
    out[key] = text.slice(0, 1200)
  }
  return out
}

/**
 * AI memberBrief üretmediyse / eski kayıtsa skorlardan üyeye dönük
 * motive edici (pazarlama tonlu) metin üretir.
 */
export function buildFallbackMemberBrief(scores = {}, overallScore = 50) {
  const s = scores || {}
  const strong = HEALTH_SCORE_KEYS
    .filter((k) => (s[k] ?? 50) >= 70)
    .map((k) => HEALTH_SCORE_META[k]?.label || k)
  const weak = HEALTH_SCORE_KEYS
    .filter((k) => (s[k] ?? 50) < 55)
    .map((k) => HEALTH_SCORE_META[k]?.label || k)

  const strengths = strong.length
    ? `Tebrikler — ${strong.join(', ').toLowerCase()} alanlarında gerçekten iyi durumdasın. Bu alışkanlıklar en büyük avantajın; doğru bir planla bunların üstüne koymak çok daha kolay.`
    : `Genel skorun ${overallScore}/100 — bu bir başlangıç noktası, etiket değil. Küçük ve düzenli adımlarla bu skorun yükseldiğini kısa sürede görebilirsin.`

  const focus = weak.length
    ? `${weak.join(', ')} tarafında gelişime açık alanların var. Bunlar irade eksikliği değil, çoğu zaman doğru plan eksikliğinden kaynaklanır — birlikte, küçük hedeflerle adım adım düzeltebiliriz.`
    : 'Belirgin bir zayıf alanın yok; şimdi hedefin mevcut dengeyi korumak ve skorlarını bir üst seviyeye taşımak olabilir.'

  const nutritionWeak = (s.nutrition ?? 50) < 55
  const movementWeak = (s.movement ?? 50) < 55
  let planPitch
  if (nutritionWeak && movementWeak) {
    planPitch = 'Hem beslenme hem hareket tarafında destek almak için Vip Paket senin için çok avantajlı: koç, diyetisyen ve doktor görüşmesi tek pakette — iki alanı aynı anda, birbirini destekleyecek şekilde toparlarsın.'
  } else if (nutritionWeak) {
    planPitch = 'Beslenme skorunu en hızlı yükseltecek şey birebir diyetisyen desteği. Diyet Paketi ile sana özel beslenme planı ve düzenli takip alırsın — tek başına deneme-yanılma yapmana gerek kalmaz.'
  } else if (movementWeak) {
    planPitch = 'Hareket tarafını toparlamak için Spor Paketi senin için ideal: antrenörün seviyene uygun kişisel program hazırlar ve seni düzenli takip eder — böylece başladığın gibi bırakmazsın.'
  } else {
    planPitch = 'Bu iyi tabloyu kalıcı hale getirmenin en kolay yolu profesyonel takip. Yeni Form paketleriyle koç ve diyetisyen desteği alarak skorlarını korur, hedeflerine daha hızlı ulaşırsın.'
  }

  return { strengths, focus, planPitch }
}

/** Kayıtlı analizden üye brief'i döndürür; yoksa skorlardan üretir. */
export function resolveMemberBrief(analysis) {
  if (!analysis) return null
  const stored = normalizeMemberBrief(analysis.memberBrief)
  if (stored) return stored
  if (analysis.overallScore == null && analysis.overallScore !== 0) return null
  return buildFallbackMemberBrief(analysis.scores, analysis.overallScore)
}

function normalizeStaffBrief(raw) {
  if (!raw || typeof raw !== 'object') return null
  const out = {}
  for (const key of STAFF_BRIEF_KEYS) {
    const text = String(raw[key] || '').trim()
    if (!text) return null
    out[key] = text.slice(0, 1200)
  }
  return out
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = AI_FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  } finally {
    clearTimeout(timer)
  }
}

function clamp(n, fallback = 50) {
  const num = Number(n)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

function scaleMap(value, map, fallback = 0) {
  if (value == null || value === '') return fallback
  if (Object.prototype.hasOwnProperty.call(map, value)) return map[value]
  return fallback
}

/** describeHealthTest çıktısını kategori özetlerine çevirir. */
export function buildCategorySummaries(healthTest, gender, packageConfig = null) {
  const sections = describeHealthTest(healthTest, gender, packageConfig)
  const buckets = {
    general: [],
    medical: [],
    nutrition: [],
    physical: [],
    lifestyle: [],
    special: [],
  }

  for (const sec of sections) {
    const lines = (sec.items || []).map((it) => `${it.label}: ${it.value}`)
    if (sec.id === 'general') buckets.general.push(...lines)
    else if (sec.id === 'medical') buckets.medical.push(...lines)
    else if (sec.id === 'nutrition') buckets.nutrition.push(...lines)
    else if (sec.id === 'physical') buckets.physical.push(...lines)
    else if (sec.id === 'lifestyle') buckets.lifestyle.push(...lines)
    else if (sec.id === 'women' || sec.id === 'men') buckets.special.push(...lines)
  }

  const join = (arr) => (arr.length ? arr.slice(0, 24).join('\n') : '—')
  return {
    general: join(buckets.general),
    medical: join(buckets.medical),
    nutrition: join(buckets.nutrition),
    physical: join(buckets.physical),
    lifestyle: join(buckets.lifestyle),
    special: join(buckets.special),
  }
}

/** AI başarısız olursa yeni soru anahtarlarından deterministik skor. */
export function computeFallbackHealthScores(profile = {}) {
  const ht = profile.healthTest || {}
  let general = 55
  general += scaleMap(ht.wellbeing, {
    very_low: -20, low: -10, medium: 0, good: 12, excellent: 18,
  })
  general += scaleMap(ht.energy, {
    very_low: -14, low: -8, moderate: 2, high: 10, very_high: 14,
  })
  general += scaleMap(ht.anxiety, {
    never: 12, rarely: 6, sometimes: 0, often: -10, always: -16,
  })
  general += scaleMap(ht.lifeQuality, {
    '1': -14, '2': -6, '3': 2, '4': 10, '5': 16,
  })

  let nutrition = 55
  nutrition += scaleMap(ht.nutritionSelfRating, {
    very_poor: -22, needs_work: -12, moderate: 0, good: 12, excellent: 18,
  })
  nutrition += scaleMap(ht.nutritionWaterIntake, {
    under_1l: -12, '1_1_5l': -4, '1_5_2l': 4, '2_3l': 10, over_3l: 12,
  })
  nutrition += scaleMap(ht.nutritionVegetables, {
    very_low: -10, insufficient: -6, moderate: 2, sufficient: 8, excellent: 12,
  })
  nutrition += scaleMap(ht.nutritionFruit, {
    very_low: -6, insufficient: -3, moderate: 2, sufficient: 6, excellent: 8,
  })
  nutrition += scaleMap(ht.nutritionSweets, {
    never: 8, '1_week': 4, '2_3_week': -4, almost_daily: -12,
  })
  nutrition += scaleMap(ht.nutritionFastFood, {
    never: 8, '1_2_month': 4, '1_week': -2, '2_3_week': -8, '4_plus_week': -14,
  })

  let movement = 52
  movement += scaleMap(ht.movementFeel, {
    very_sedentary: -18, mostly_sitting: -10, occasional: 0, mostly_active: 12, very_active: 18,
  })
  movement += scaleMap(ht.activitySelfRating, {
    very_low: -16, low: -8, moderate: 2, good: 12, excellent: 16,
  })
  movement += scaleMap(ht.stairsCapacity, {
    easily: 10, mild: 2, hard: -10, need_help: -16,
  })
  movement += scaleMap(ht.briskWalk30, {
    easily: 10, with_effort: 2, '10_15_only': -8, cannot: -14,
  })
  movement += scaleMap(ht.exerciseWillingness, {
    very_willing: 10, willing: 6, unsure: 0, not_much: -6, not_at_all: -12,
  })
  const pains = Array.isArray(ht.painAreas) ? ht.painAreas.filter((v) => v !== 'none') : []
  movement -= Math.min(16, pains.length * 3)

  let sleep = 55
  sleep += scaleMap(ht.dailySleepQuality || ht.sleepQuality, {
    very_poor: -22, poor: -14, fair: -2, good: 12, excellent: 18,
  })
  sleep += scaleMap(ht.sleepHours, {
    under_5: -18, '5_6': -8, '6_7': 2, '7_8': 14, '8_9': 10, over_9: 4,
  })
  sleep += scaleMap(ht.morningRested, {
    never: -14, rarely: -8, sometimes: 0, often: 8, always: 14,
  })
  sleep += scaleMap(ht.fallAsleepDifficulty, {
    never: 10, rarely: 6, sometimes: 0, often: -10, every_night: -16,
  })
  sleep += scaleMap(ht.nightWaking, {
    no: 10, rarely: 4, sometimes: -2, often: -10, every_night: -16,
  })

  let stress = 55
  stress += scaleMap(ht.dailyStressImpact, {
    none: 16, low: 8, moderate: 0, high: -12, very_high: -18,
  })
  stress += scaleMap(ht.stressCoping, {
    always: 14, often: 8, sometimes: 0, rarely: -10, never: -16,
  })
  stress += scaleMap(ht.anxiety, {
    never: 12, rarely: 6, sometimes: 0, often: -10, always: -16,
  })

  let lifestyle = 55
  lifestyle += scaleMap(ht.smoking, {
    never: 10, former: 4, occasional: -8, daily: -16,
  })
  lifestyle += scaleMap(ht.alcohol, {
    none: 8, monthly: 2, '1_2_week': -4, '3_plus_week': -10, daily: -16,
  })
  lifestyle += scaleMap(ht.screenTime, {
    under_2: 8, '2_4': 4, '4_6': 0, '6_8': -6, over_8: -12,
  })
  lifestyle += scaleMap(ht.workSchedule, {
    regular_day: 6, shift: -6, night: -10, irregular: -8, not_working: 2,
  })
  lifestyle += scaleMap(ht.lifeQualityOverall, {
    very_poor: -16, poor: -8, fair: 0, good: 10, excellent: 16,
  })

  let motivation = 50
  const mot = Number(ht.motivation)
  if (Number.isFinite(mot)) motivation = clamp(mot * 10)
  motivation += scaleMap(ht.goalBelief, {
    none: -16, low: -8, unsure: 0, believe: 10, certain: 16,
  })

  let readiness = 50
  readiness += scaleMap(ht.readinessToChange, {
    not_ready: -18, thinking: -6, ready: 8, started: 14, maintaining: 18,
  })
  readiness += scaleMap(ht.exerciseWillingness, {
    very_willing: 8, willing: 4, unsure: 0, not_much: -6, not_at_all: -12,
  })

  const scores = {
    general: clamp(general),
    nutrition: clamp(nutrition),
    movement: clamp(movement),
    sleep: clamp(sleep),
    stress: clamp(stress),
    lifestyle: clamp(lifestyle),
    motivation: clamp(motivation),
    readiness: clamp(readiness),
  }
  const overallScore = clamp(
    HEALTH_SCORE_KEYS.reduce((s, k) => s + scores[k], 0) / HEALTH_SCORE_KEYS.length,
  )

  const staffBrief = buildFallbackStaffBrief(scores, overallScore)
  return {
    version: HEALTH_SCORE_ANALYSIS_VERSION,
    generatedAt: new Date().toISOString().split('T')[0],
    scores,
    overallScore,
    summary: 'Cevaplarınıza göre kişisel sağlık skorunuz hesaplandı. Düzenli güncellemelerle skoru yükseltebilirsiniz.',
    staffBrief,
    memberBrief: buildFallbackMemberBrief(scores, overallScore),
    aiGenerated: false,
    aiAttemptedAt: new Date().toISOString(),
  }
}

export async function fetchAiHealthScore({ profile, categorySummaries, memberId = null, force = false }) {
  try {
    const body = {
      profile: {
        age: profile?.age,
        gender: profile?.gender,
        height: profile?.height,
        weight: profile?.weight,
        goals: profile?.goals || [],
        fitnessLevel: profile?.fitnessLevel,
      },
      categorySummaries,
      force: Boolean(force),
    }
    if (memberId) body.memberId = memberId

    const { res, data } = await fetchJsonWithTimeout('/api/ai-health-analysis', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        unchanged: data.unchanged === true || res.status === 409,
        locked: data.locked === true || res.status === 423,
        lockedUntil: data.lockedUntil || null,
        error: formatAiError(
          data.error
          || (res.status === 423
            ? 'Sağlık testi 14 gün boyunca kilitli; süre dolunca yeniden çözebilirsiniz'
            : res.statusText),
        ),
      }
    }
    const staffBrief = normalizeStaffBrief(data.staffBrief)
      || buildFallbackStaffBrief(data.scores, data.overallScore)
    const memberBrief = normalizeMemberBrief(data.memberBrief)
      || buildFallbackMemberBrief(data.scores, data.overallScore)
    const sourceFingerprint = data.sourceFingerprint
      || buildHealthAnalysisFingerprint(profile)
    return {
      ok: true,
      version: HEALTH_SCORE_ANALYSIS_VERSION,
      generatedAt: new Date().toISOString().split('T')[0],
      scores: data.scores,
      overallScore: data.overallScore,
      summary: data.summary || '',
      staffBrief,
      memberBrief,
      aiGenerated: data.aiGenerated !== false,
      model: data.model || null,
      promptTokens: Number(data.promptTokens ?? data.usage?.promptTokens) || 0,
      completionTokens: Number(data.completionTokens ?? data.usage?.completionTokens) || 0,
      costUsd: Number(data.costUsd) || 0,
      sourceFingerprint,
      aiAttemptedAt: new Date().toISOString(),
    }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'timeout' : e.message),
    }
  }
}

/** AI dene; başarısızsa yedek skor döndür. Fingerprint değişmediyse hata fırlatır. */
export async function resolveHealthScoreAnalysis(profile, opts = {}) {
  const categorySummaries = buildCategorySummaries(
    profile?.healthTest,
    profile?.gender,
    profile?.packageConfig,
  )
  const fingerprint = buildHealthAnalysisFingerprint(profile)
  const analysisStage = opts.analysisStage === 'detailed' ? 'detailed' : 'core'
  const ai = await fetchAiHealthScore({
    profile,
    categorySummaries,
    memberId: opts.memberId || null,
    force: opts.force === true,
  })
  if (ai.ok) {
    return {
      ...ai,
      analysisStage,
      sourceFingerprint: ai.sourceFingerprint || fingerprint,
      bmi: profile?.healthAnalysis?.bmi ?? null,
      bmiCategory: profile?.healthAnalysis?.bmiCategory ?? null,
      dailyCalories: profile?.healthAnalysis?.dailyCalories ?? null,
      fitnessScore: profile?.healthAnalysis?.fitnessScore ?? null,
    }
  }
  if (ai.locked) {
    const err = new Error(ai.error || 'Sağlık testi 14 gün boyunca kilitli; süre dolunca yeniden çözebilirsiniz')
    err.code = 'health_analysis_locked'
    err.lockedUntil = ai.lockedUntil || null
    throw err
  }
  if (ai.unchanged) {
    // Detaylı aşamaya yükseltirken fingerprint aynı olabilir (yalnızca stage farkı) —
    // force ile gelinmediyse ve stage yükseltiliyorsa client zaten force kullanır.
    const err = new Error(ai.error || 'Sağlık testi veya profil bilgileri değişmedi; yeniden analiz yapılamaz')
    err.code = 'health_analysis_unchanged'
    throw err
  }
  const fallback = computeFallbackHealthScores(profile)
  return {
    ...fallback,
    analysisStage,
    version: HEALTH_SCORE_ANALYSIS_VERSION,
    sourceFingerprint: fingerprint,
    bmi: profile?.healthAnalysis?.bmi ?? null,
    bmiCategory: profile?.healthAnalysis?.bmiCategory ?? null,
    dailyCalories: profile?.healthAnalysis?.dailyCalories ?? null,
    fitnessScore: profile?.healthAnalysis?.fitnessScore ?? null,
    fallbackReason: ai.error || 'AI skor üretilemedi',
  }
}
