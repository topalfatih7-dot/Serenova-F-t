// Kural Tabanlı Analiz Servisi — Kişiselleştirilmiş sağlık analizi
// Basic paket üyelerine kayıt sonrası otomatik olarak uygulanır.

import { describeHealthTest, normalizeHealthTestForAnalysis } from '../data/healthTest'
import { enrichProfileForAnalysis } from '../utils/healthProfile'

/** healthAnalysis şema sürümü — eski özetler otomatik yenilenir */
export const HEALTH_ANALYSIS_VERSION = 7

export const RADAR_SCORE_LABELS = {
  metabolic: 'Metabolik Sağlık',
  nutrition: 'Beslenme Kalitesi',
  activity: 'Aktivite Düzeyi',
  sleep: 'Uyku Kalitesi',
  stress: 'Stres Yönetimi',
  digestion: 'Sindirim Sağlığı',
  lifestyle: 'Yaşam Tarzı Skoru',
  overall: 'Genel Değerlendirme',
}

const GENERIC_WEEKLY_FOCUS =
  /\(\d+\s*dk\)|HIIT|Full Body|Üst Vücut|Alt Vücut|Vücut Ağırlığı|Esneklik\s*&\s*Yoga|Kardiyo\s*&|İtme Hareketi|Çekme Hareketi|Olimpik/i

export function isGenericWeeklyPlanDay(day) {
  if (!day) return true
  if (Array.isArray(day.exerciseNames) && day.exerciseNames.length > 0) return false
  return GENERIC_WEEKLY_FOCUS.test(String(day.focus || ''))
}

export function isHealthAnalysisStale(analysis, libraryCount = 0) {
  if (!analysis?.generatedAt) return true
  if ((analysis.version || 0) < HEALTH_ANALYSIS_VERSION) return true
  if (analysis.radarScores?.overall == null) return true
  if (analysis.dietitianRecommendations?.hydration != null) return true
  if ((analysis.dietitianRecommendations?.mealPlan || []).length > 0) return true

  const weekly = analysis.coachRecommendations?.weeklyPlan || []
  if (weekly.some((day) => isGenericWeeklyPlanDay(day))) return true

  if (libraryCount > 0) {
    const hasLibraryNames = weekly.some((day) => day.exerciseNames?.length > 0)
    if (!hasLibraryNames) return true
  }

  return false
}

/** Gemini ipuçları henüz yok ve denenmedi mi? (sonsuz retry önleme) */
export function needsAiNutritionTips(analysis) {
  const tips = analysis?.dietitianRecommendations
  if (!tips) return true
  if (tips.aiGenerated) return false
  if (tips.aiAttemptedAt) return false
  return true
}

export function generateHealthAnalysis(profile, exercises = []) {
  const enriched = enrichProfileForAnalysis(profile)
  const bmi = calculateBmi(enriched.weight, enriched.height)
  const bmiCategory = getBmiCategory(bmi)
  const goalCategories = mapGoalsToCategories(enriched.goals || [])
  const healthTestInsights = buildHealthTestInsights(enriched.healthTest, enriched.gender, enriched.packageConfig)
  const coachRecommendations = generateCoachList(enriched, exercises, goalCategories, healthTestInsights)
  const dietitianRecommendations = { tips: [], focus: '', aiGenerated: false }

  const fitnessScore = calculateFitnessScore(enriched)
  const radarScores = calculateRadarScores(enriched, bmi, fitnessScore)

  return {
    version: HEALTH_ANALYSIS_VERSION,
    generatedAt: new Date().toISOString().split('T')[0],
    bmi: bmi ? Math.round(bmi * 10) / 10 : null,
    bmiCategory,
    idealWeightRange: getIdealWeightRange(enriched.height, enriched.gender),
    dailyCalories: estimateDailyCalories(enriched),
    coachRecommendations,
    dietitianRecommendations,
    fitnessScore,
    radarScores,
    priorityGoal: getPriorityGoal(enriched.goals || []),
    healthTestInsights,
    estimatedMetrics: enriched.estimatedMetrics === true,
  }
}

function buildHealthTestInsights(healthTest = {}, gender, packageConfig = null) {
  if (!healthTest || typeof healthTest !== 'object') return []
  return describeHealthTest(healthTest, gender, packageConfig)
    .flatMap((section) => section.items.map((item) => `${item.label}: ${item.value}`))
    .filter((line) => !/su\s*tüketim|günlük\s*su|water\s*intake/i.test(line))
    .slice(0, 12)
}

function calculateBmi(weight, height) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h < 50) return null
  const hm = h / 100
  return w / (hm * hm)
}

function getBmiCategory(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Zayıf', color: 'blue', advice: 'Kilo almanız ve kas geliştirmeniz önerilir.' }
  if (bmi < 25) return { label: 'Normal', color: 'green', advice: 'Sağlıklı kilonuzu koruyun.' }
  if (bmi < 30) return { label: 'Fazla Kilolu', color: 'amber', advice: 'Düzenli egzersiz ve dengeli beslenme önerilir.' }
  return { label: 'Obez', color: 'red', advice: 'Sağlık uzmanı desteğiyle kilo yönetimi önerilir.' }
}

function getIdealWeightRange(height, gender) {
  const h = parseFloat(height)
  if (!h) return null
  const base = gender === 'male' ? h - 100 : h - 105
  return { min: Math.round(base * 0.9), max: Math.round(base * 1.1) }
}

// Harris-Benedict formülü
function estimateDailyCalories(profile) {
  const w = parseFloat(profile.weight)
  const h = parseFloat(profile.height)
  const a = parseFloat(profile.age)
  if (!w || !h || !a) return null

  let bmr
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a)
  } else {
    bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a)
  }

  const activityMultiplier = { beginner: 1.375, intermediate: 1.55, advanced: 1.725 }
  const multiplier = activityMultiplier[profile.fitnessLevel] || 1.375
  const total = Math.round(bmr * multiplier)

  const goals = profile.goals || []
  const weightGoals = ['weight', 'fatburn']
  const muscleGoals = ['muscle', 'tone']

  if (goals.some((g) => weightGoals.includes(g))) {
    return { maintenance: total, recommended: total - 300, goal: 'Kilo verme' }
  }
  if (goals.some((g) => muscleGoals.includes(g))) {
    return { maintenance: total, recommended: total + 200, goal: 'Kas kazanımı' }
  }
  return { maintenance: total, recommended: total, goal: 'Form koruma' }
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function scaleMap(value, map, fallback = 50) {
  if (value == null || value === '') return fallback
  if (Object.prototype.hasOwnProperty.call(map, value)) return map[value]
  return fallback
}

/** 360° sağlık boyut skorları — mevcut healthTest + profil üzerinden. */
export function calculateRadarScores(profile, bmi = null, fitnessScore = null) {
  const raw = profile?.healthTest || {}
  const ht = normalizeHealthTestForAnalysis(raw)
  const bmiVal = bmi ?? calculateBmi(profile?.weight, profile?.height)

  let metabolic = 62
  if (bmiVal) {
    if (bmiVal >= 18.5 && bmiVal < 25) metabolic += 18
    else if (bmiVal >= 25 && bmiVal < 30) metabolic += 4
    else if (bmiVal < 18.5) metabolic -= 8
    else metabolic -= 16
  }
  const chronic = Array.isArray(ht.chronicConditions) ? ht.chronicConditions : []
  metabolic -= Math.min(24, chronic.length * 5)
  if (raw.lastBloodWork === 'last_3_months') metabolic += 8
  else if (raw.lastBloodWork === '3_12_months') metabolic += 3
  else if (raw.lastBloodWork === 'never' || raw.lastBloodWork === 'over_year') metabolic -= 6
  if (raw.weightChange === 'stable') metabolic += 4
  else if (raw.weightChange === 'gained' || raw.weightChange === 'lost') metabolic -= 2

  let nutrition = 58
  nutrition += scaleMap(raw.dietMealsPerDay, { '1_2': -8, '3': 6, '4_5': 10, '6_plus': 2 }, 0)
  nutrition += scaleMap(raw.dietSweetIntake, { rarely: 10, sometimes: 4, often: -8, daily: -14 }, 0)
  nutrition += scaleMap(raw.dietEmotionalEating, { never: 8, rarely: 4, sometimes: -2, often: -10 }, 0)
  nutrition += scaleMap(raw.dietWaterIntake, { under_1: -8, '1_2': 0, '2_3': 6, over_3: 10 }, 0)
  const supplements = Array.isArray(raw.supplements) ? raw.supplements.filter((v) => v !== 'none') : []
  if (supplements.length > 0 && supplements.length <= 4) nutrition += 4
  if ((profile?.nutritionPrefs || []).length >= 1) nutrition += 6

  let activity = 55
  activity += scaleMap(ht.activityFrequency, {
    sedentary: -18, light: -4, moderate: 12, active: 22,
  }, 0)
  activity += scaleMap(raw.trainingHistoryYears, {
    none: -8, under_6m: 0, '6m_2y': 8, '2y_plus': 14,
  }, 0)
  activity += scaleMap(raw.dailySteps, {
    under_3000: -10, '3000_6000': 0, '6000_9000': 8, '9000_plus': 14,
  }, 0)
  if (ht.injuries === 'yes') activity -= 10
  if (raw.injuryLimitation === 'severe') activity -= 8
  else if (raw.injuryLimitation === 'moderate') activity -= 4

  let sleep = 60
  sleep += scaleMap(raw.dietSleepQuality, {
    poor: -20, fair: -6, good: 12, excellent: 18,
  }, 0)
  sleep += scaleMap(raw.dietSleepHours, {
    under_5: -16, '5_6': -6, '6_7': 4, '7_8': 14, over_8: 10,
  }, 0)
  if (raw.shiftWork === 'yes') sleep -= 10
  else if (raw.shiftWork === 'sometimes') sleep -= 4
  if (chronic.includes('sleep_apnea')) sleep -= 12

  let stress = 58
  stress += scaleMap(raw.anxiety, {
    never: 14, rarely: 8, sometimes: 0, often: -12, always: -20,
    none: 14, mild: 6, moderate: -4, high: -16,
  }, 0)
  stress += scaleMap(raw.dailyStressImpact, {
    none: 14, low: 8, moderate: 0, high: -12, very_high: -18,
  }, 0)
  stress += scaleMap(raw.stressCoping, {
    always: 14, often: 8, sometimes: 0, rarely: -10, never: -16,
  }, 0)
  stress += scaleMap(raw.socialSupport, {
    strong: 10, partial: 4, limited: -4, none: -10,
  }, 0)
  stress += scaleMap(raw.dietStressLevel, {
    low: 10, moderate: 0, high: -12, very_high: -18,
  }, 0)

  let digestion = 68
  const digSymptoms = Array.isArray(raw.digestiveSymptoms)
    ? raw.digestiveSymptoms.filter((v) => v !== 'none')
    : []
  digestion -= Math.min(36, digSymptoms.length * 8)
  if (raw.digestiveDisorders && raw.digestiveDisorders !== 'no') digestion -= 12
  const digDiet = Array.isArray(raw.dietDigestiveSymptoms)
    ? raw.dietDigestiveSymptoms.filter((v) => v !== 'none' && v !== 'yok')
    : []
  digestion -= Math.min(20, digDiet.length * 5)
  if (chronic.includes('ibs') || chronic.includes('reflux') || chronic.includes('celiac')) {
    digestion -= 10
  }

  let lifestyle = 55
  lifestyle += scaleMap(raw.wellbeing, {
    very_low: -16, low: -8, medium: 0, good: 10, excellent: 16,
    '1': -16, '2': -8, '3': 0, '4': 10, '5': 16,
  }, 0)
  lifestyle += scaleMap(raw.energy, {
    very_low: -12, low: -6, moderate: 2, high: 10, very_high: 14,
  }, 0)
  const motivation = Number(raw.motivation)
  if (Number.isFinite(motivation)) lifestyle += Math.round((motivation - 5) * 2.2)
  lifestyle += scaleMap(raw.lifeQuality, {
    '1': -14, '2': -6, '3': 2, '4': 10, '5': 16,
  }, 0)
  lifestyle += scaleMap(raw.readinessToChange, {
    not_ready: -10, thinking: -2, ready: 6, started: 12, maintaining: 16,
  }, 0)
  lifestyle += scaleMap(raw.smoking, {
    never: 8, former: 2, occasional: -8, daily: -16,
  }, 0)
  lifestyle += scaleMap(raw.alcohol, {
    none: 6, monthly: 2, weekly: -4, frequent: -12,
  }, 0)
  if (raw.biggestBarrier === 'time' || raw.biggestBarrier === 'motivation') lifestyle -= 4

  const dims = {
    metabolic: clampScore(metabolic),
    nutrition: clampScore(nutrition),
    activity: clampScore(activity),
    sleep: clampScore(sleep),
    stress: clampScore(stress),
    digestion: clampScore(digestion),
    lifestyle: clampScore(lifestyle),
  }
  const avg = Object.values(dims).reduce((a, b) => a + b, 0) / Object.keys(dims).length
  const fit = fitnessScore != null ? fitnessScore : calculateFitnessScore(profile)
  const overall = clampScore(avg * 0.7 + fit * 0.3)

  return { ...dims, overall }
}

function calculateFitnessScore(profile) {
  let score = 50
  const bmi = calculateBmi(profile.weight, profile.height)
  if (bmi) {
    if (bmi >= 18.5 && bmi < 25) score += 20
    else if (bmi >= 25 && bmi < 30) score += 5
  }
  if (profile.fitnessLevel === 'intermediate') score += 10
  if (profile.fitnessLevel === 'advanced') score += 20
  if ((profile.goals || []).length >= 2) score += 10
  if ((profile.nutritionPrefs || []).length >= 1) score += 10

  const ht = normalizeHealthTestForAnalysis(profile.healthTest || {})
  if (Number(ht.wellbeing) >= 4) score += 5
  if (ht.energy === 'high') score += 5
  if (ht.sleepQuality === 'good' || ht.dietSleepQuality === 'good') score += 5
  if (ht.stressLevel === 'low' || ht.dietStressLevel === 'low') score += 5
  if (ht.injuries === 'yes' || ht.painAreas?.length) score -= 8
  if (ht.chronicConditions?.length) score -= 5
  if (ht.teaCoffee === 'high') score -= 3
  if (ht.substanceUse === 'regular') score -= 10
  if (ht.substanceUse === 'occasional') score -= 5
  if (ht.travelFrequency === 'weekly') score -= 2

  const pain = Number(ht.painScale ?? profile.healthTest?.painScale)
  if (Number.isFinite(pain) && pain >= 7) score -= 6

  return Math.max(0, Math.min(100, score))
}

function getPriorityGoal(goals) {
  const priority = ['fatburn', 'muscle', 'weight', 'tone', 'endurance', 'heart', 'habit', 'sleep', 'performance', 'confidence']
  for (const p of priority) {
    if (goals.includes(p)) return p
  }
  return goals[0] || 'habit'
}

// Hedefleri egzersiz kategorileriyle eşleştir
function mapGoalsToCategories(goals) {
  const map = {
    weight:      ['Kardiyo', 'HIIT', 'Yürüyüş', 'Bisiklet'],
    fatburn:     ['HIIT', 'Kardiyo', 'Tabata', 'Circuit Training'],
    muscle:      ['Güç Antrenmanı', 'Vücut Ağırlığı', 'Dambıl', 'Barbell'],
    tone:        ['Pilates', 'Yoga', 'Vücut Ağırlığı', 'Esneklik'],
    endurance:   ['Koşu', 'Kardiyo', 'Bisiklet', 'Yüzme'],
    habit:       ['Genel', 'Esneklik', 'Yoga', 'Meditasyon'],
    sleep:       ['Yoga', 'Nefes Egzersizleri', 'Esneklik', 'Meditasyon'],
    heart:       ['Kardiyo', 'Yürüyüş', 'Koşu', 'Bisiklet'],
    performance: ['HIIT', 'Güç Antrenmanı', 'Fonksiyonel', 'Pliometri'],
    confidence:  ['Yoga', 'Pilates', 'Genel', 'Esneklik'],
  }
  const categories = new Set()
  goals.forEach((g) => (map[g] || ['Genel']).forEach((c) => categories.add(c)))
  return [...categories]
}

// Egzersiz kütüphanesinden hedeflere uygun videolar seç (yalnızca geçerli id + isim)
function pickLibraryExercises(exercises = []) {
  return (exercises || []).filter((ex) => ex?.id && String(ex.name || '').trim())
}

function normalizeLibraryExercise(ex) {
  return {
    id: ex.id,
    name: String(ex.name).trim(),
    category: ex.category || ex.bodyPart || '',
    videoUrl: ex.videoUrl || '',
    videoPending: ex.videoPending === true,
    description: ex.description || '',
    sportType: ex.sportType || '',
    equipment: ex.equipment || '',
    targetMuscle: ex.targetMuscle || '',
    difficulty: ex.difficulty || '',
    movementCategory: ex.movementCategory || '',
  }
}

const DIFFICULTY_RANK = { beginner: 1, intermediate: 2, advanced: 3 }
const FITNESS_LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 }

function difficultyFitScore(exDifficulty, profileLevel) {
  const exRank = DIFFICULTY_RANK[exDifficulty] || 2
  const profRank = FITNESS_LEVEL_RANK[profileLevel] || 1
  if (exRank === profRank) return 10
  if (Math.abs(exRank - profRank) === 1) return 5
  return exRank > profRank ? -8 : 2
}

/** Profil + sağlık testine göre kütüphaneden aday hareket seç (AI katalog / kural yedek). */
export function selectExerciseCandidates(profile, exercises = [], limit = 60) {
  const library = pickLibraryExercises(exercises)
  if (library.length === 0) return []

  const goalCategories = mapGoalsToCategories(profile.goals || [])
  const ht = normalizeHealthTestForAnalysis(profile.healthTest || {})
  const lowImpactOnly = ht.injuries === 'yes' || (ht.painAreas || []).length > 0
  const profileLevel = profile.fitnessLevel || 'beginner'

  const scored = library.map((ex) => {
    let score = 0
    const cat = String(ex.category || ex.bodyPart || '').toLowerCase()
    const sport = String(ex.sportType || '').toLowerCase()
    const name = String(ex.name || '').toLowerCase()
    const equipment = String(ex.equipment || '').toLowerCase()
    const target = String(ex.targetMuscle || '').toLowerCase()
    const movement = String(ex.movementCategory || '').toLowerCase()

    goalCategories.forEach((goalCat) => {
      const g = goalCat.toLowerCase()
      if (cat.includes(g) || g.includes(cat) || sport.includes(g) || name.includes(g)) score += 12
      if (equipment.includes(g) || target.includes(g) || movement.includes(g)) score += 6
    })

    score += difficultyFitScore(ex.difficulty, profileLevel)

    if (profileLevel === 'beginner' && ex.difficulty === 'beginner') score += 6
    if (profileLevel === 'advanced' && ex.difficulty === 'advanced') score += 6

    if (ht.activityFrequency === 'sedentary' && (cat.includes('yoga') || cat.includes('esneklik') || sport.includes('yoga') || movement === 'stretching')) score += 8
    if (ht.stressLevel === 'high' && (name.includes('nefes') || cat.includes('yoga') || movement === 'balance')) score += 6
    if (ht.sleepQuality === 'poor' && (cat.includes('esneklik') || movement === 'stretching')) score += 5
    if (ht.teaCoffee === 'high' && (cat.includes('esneklik') || name.includes('nefes') || cat.includes('yoga'))) score += 4
    if (ht.travelFrequency === 'weekly' && (sport.includes('ev') || name.includes('vücut') || cat.includes('tüm vücut') || equipment.includes('vücut'))) score += 6
    if (ht.travelFrequency === 'monthly' && (sport.includes('ev') || equipment.includes('vücut'))) score += 3
    if ((ht.substanceUse === 'regular' || ht.substanceUse === 'occasional') && (cat.includes('esneklik') || cat.includes('kardiyo'))) score += 3

    if (lowImpactOnly && (name.includes('hiit') || name.includes('sprint') || sport.includes('hiit') || movement === 'plyometrics')) score -= 15
    if (lowImpactOnly && (cat.includes('kardiyo') || sport.includes('koşu'))) score -= 4

    if (ex.videoPending) score -= 3

    return { ex, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const positive = scored.filter((s) => s.score > 0)
  const pool = positive.length > 0 ? positive : scored
  return pool.slice(0, Math.max(1, limit)).map((s) => normalizeLibraryExercise(s.ex))
}

function generateCoachList(profile, exercises, goalCategories, healthTestInsights = []) {
  const library = pickLibraryExercises(exercises)
  const selected = selectExerciseCandidates(profile, exercises, 6)
  const fallback = selected.length > 0 ? selected : library.slice(0, 6).map(normalizeLibraryExercise)

  const levelTips = {
    beginner:     'Başlangıç seviyeniz için düşük yoğunluklu egzersizlerle başlamanız önerilir.',
    intermediate: 'Orta seviyenize uygun karma antrenmanlar programınıza dahil edildi.',
    advanced:     'İleri seviyenize uygun yüksek yoğunluklu programlar hazırlandı.',
  }

  const goalMessages = {
    weight:    'Kilo yönetimi için kardiyovasküler egzersizler ön plana alındı.',
    fatburn:   'Yağ yakımı için HIIT ve interval antrenmanlar önerildi.',
    muscle:    'Kas gelişimi için güç antrenmanları seçildi.',
    tone:      'Vücut sıkılaştırma için fonksiyonel hareketler eklendi.',
    endurance: 'Dayanıklılık için uzun süreli kardiyo egzersizleri planlandı.',
    habit:     'Düzenli alışkanlık oluşturmak için kolay başlangıç programı hazırlandı.',
    sleep:     'Uyku kalitesi için akşam yoga ve nefes egzersizleri önerildi.',
    heart:     'Kalp sağlığı için düşük-orta yoğunluklu kardiyo seçildi.',
    performance: 'Spor performansı için fonksiyonel güç antrenmanları eklendi.',
    confidence: 'Özgüven için kişisel gelişim odaklı beden farkındalığı programı hazırlandı.',
  }

  const priorityGoal = getPriorityGoal(profile.goals || [])
  const mainMessage = goalMessages[priorityGoal] || 'Genel sağlık için dengeli program hazırlandı.'
  const levelMessage = levelTips[profile.fitnessLevel] || levelTips.beginner
  const injuryNote = healthTestInsights.some((t) => t.includes('Sakatlık') || t.includes('Ağrı'))
    ? ' Sakatlık veya ağrı bildirimi nedeniyle hareket yoğunluğu düşük tutulmalıdır.'
    : ''

  return {
    exercises: fallback,
    totalCount: library.length,
    message: `${mainMessage} ${levelMessage}${injuryNote}`,
    weeklyPlan: generateWeeklyPlan(profile, fallback),
    categories: goalCategories.slice(0, 4),
  }
}

const WEEKLY_DAY_SCHEDULE = {
  beginner: [
    { day: 'Pazartesi', intensity: 'Düşük' },
    { day: 'Çarşamba', intensity: 'Düşük' },
    { day: 'Cuma', intensity: 'Düşük' },
  ],
  intermediate: [
    { day: 'Pazartesi', intensity: 'Orta' },
    { day: 'Salı', intensity: 'Orta-Yüksek' },
    { day: 'Perşembe', intensity: 'Orta' },
    { day: 'Cumartesi', intensity: 'Orta' },
  ],
  advanced: [
    { day: 'Pazartesi', intensity: 'Yüksek' },
    { day: 'Salı', intensity: 'Yüksek' },
    { day: 'Çarşamba', intensity: 'Yüksek' },
    { day: 'Perşembe', intensity: 'Yüksek' },
    { day: 'Cumartesi', intensity: 'Yüksek' },
  ],
}

/** Haftalık plan — gün başına kütüphaneden seçilmiş hareket isimleri */
function generateWeeklyPlan(profile, libraryExercises = []) {
  const level = profile.fitnessLevel || 'beginner'
  const schedule = WEEKLY_DAY_SCHEDULE[level] || WEEKLY_DAY_SCHEDULE.beginner
  const valid = libraryExercises.filter((ex) => ex?.id && ex?.name)

  if (valid.length === 0) {
    return []
  }

  const buckets = schedule.map((slot) => ({ ...slot, items: [] }))
  valid.forEach((ex, i) => {
    buckets[i % buckets.length].items.push(ex)
  })

  return buckets.map(({ day, intensity, items }) => ({
    day,
    intensity,
    exerciseNames: items.map((ex) => ex.name),
    exercises: items.map((ex) => ({ id: ex.id, name: ex.name, category: ex.category || '' })),
    focus: items.map((ex) => ex.name).join(' · '),
  }))
}

// Beslenme ipuçları AI ile üretilir (api/ai-nutrition-tips.js → memberHealthSync)
