import { describeHealthTest } from '../data/healthTest'
import { HEALTH_ANALYSIS_VERSION } from './aiAnalysis'
import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_FETCH_TIMEOUT_MS = 15_000

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

  return {
    version: HEALTH_ANALYSIS_VERSION,
    generatedAt: new Date().toISOString().split('T')[0],
    scores,
    overallScore,
    summary: 'Cevaplarınıza göre kişisel sağlık skorunuz hesaplandı. Düzenli güncellemelerle skoru yükseltebilirsiniz.',
    aiGenerated: false,
    aiAttemptedAt: new Date().toISOString(),
  }
}

export function needsHealthScoreRefresh(analysis, healthTest) {
  if (!analysis?.overallScore && analysis?.overallScore !== 0) return true
  if (!analysis?.scores || typeof analysis.scores !== 'object') return true
  if ((analysis.version || 0) < HEALTH_ANALYSIS_VERSION) return true
  for (const key of HEALTH_SCORE_KEYS) {
    if (analysis.scores[key] == null) return true
  }
  // Eski radar şeması kalıntısı
  if (analysis.radarScores && !analysis.scores) return true
  if (!healthTest || typeof healthTest !== 'object') return false
  return false
}

export async function fetchAiHealthScore({ profile, categorySummaries }) {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        task: 'health-score',
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          height: profile?.height,
          weight: profile?.weight,
          goals: profile?.goals || [],
          fitnessLevel: profile?.fitnessLevel,
        },
        categorySummaries,
      }),
    })
    if (!res.ok || !data.ok) {
      return { ok: false, error: formatAiError(data.error || res.statusText) }
    }
    return {
      ok: true,
      version: HEALTH_ANALYSIS_VERSION,
      generatedAt: new Date().toISOString().split('T')[0],
      scores: data.scores,
      overallScore: data.overallScore,
      summary: data.summary || '',
      aiGenerated: true,
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

/** AI dene; başarısızsa yedek skor döndür. */
export async function resolveHealthScoreAnalysis(profile) {
  const categorySummaries = buildCategorySummaries(
    profile?.healthTest,
    profile?.gender,
    profile?.packageConfig,
  )
  const ai = await fetchAiHealthScore({ profile, categorySummaries })
  if (ai.ok) {
    return {
      ...ai,
      // BMI vb. eski alanlar korunabilir (admin görünümü)
      bmi: profile?.healthAnalysis?.bmi ?? null,
      bmiCategory: profile?.healthAnalysis?.bmiCategory ?? null,
      dailyCalories: profile?.healthAnalysis?.dailyCalories ?? null,
      fitnessScore: profile?.healthAnalysis?.fitnessScore ?? null,
      coachRecommendations: profile?.healthAnalysis?.coachRecommendations,
      dietitianRecommendations: profile?.healthAnalysis?.dietitianRecommendations,
    }
  }
  const fallback = computeFallbackHealthScores(profile)
  return {
    ...fallback,
    bmi: profile?.healthAnalysis?.bmi ?? null,
    bmiCategory: profile?.healthAnalysis?.bmiCategory ?? null,
    dailyCalories: profile?.healthAnalysis?.dailyCalories ?? null,
    fitnessScore: profile?.healthAnalysis?.fitnessScore ?? null,
    coachRecommendations: profile?.healthAnalysis?.coachRecommendations,
    dietitianRecommendations: profile?.healthAnalysis?.dietitianRecommendations,
    fallbackReason: ai.error || 'AI skor üretilemedi',
  }
}
