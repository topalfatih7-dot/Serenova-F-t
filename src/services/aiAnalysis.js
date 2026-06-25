// Kural Tabanlı Analiz Servisi — Kişiselleştirilmiş sağlık analizi
// Basic paket üyelerine kayıt sonrası otomatik olarak uygulanır.

import { describeHealthTest } from '../data/healthTest'
import { enrichProfileForAnalysis } from '../utils/healthProfile'

/** healthAnalysis şema sürümü — eski özetler otomatik yenilenir */
export const HEALTH_ANALYSIS_VERSION = 5

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
  if (analysis.dietitianRecommendations?.hydration != null) return true
  if ((analysis.dietitianRecommendations?.mealPlan || []).length > 0) return true
  if (!analysis.dietitianRecommendations?.aiGenerated) return true

  const weekly = analysis.coachRecommendations?.weeklyPlan || []
  if (weekly.some((day) => isGenericWeeklyPlanDay(day))) return true

  if (libraryCount > 0) {
    const hasLibraryNames = weekly.some((day) => day.exerciseNames?.length > 0)
    if (!hasLibraryNames) return true
  }

  return false
}

export function generateHealthAnalysis(profile, exercises = []) {
  const enriched = enrichProfileForAnalysis(profile)
  const bmi = calculateBmi(enriched.weight, enriched.height)
  const bmiCategory = getBmiCategory(bmi)
  const goalCategories = mapGoalsToCategories(enriched.goals || [])
  const healthTestInsights = buildHealthTestInsights(enriched.healthTest, enriched.gender)
  const coachRecommendations = generateCoachList(enriched, exercises, goalCategories, healthTestInsights)
  const dietitianRecommendations = { tips: [], focus: '', aiGenerated: false }

  return {
    version: HEALTH_ANALYSIS_VERSION,
    generatedAt: new Date().toISOString().split('T')[0],
    bmi: bmi ? Math.round(bmi * 10) / 10 : null,
    bmiCategory,
    idealWeightRange: getIdealWeightRange(enriched.height, enriched.gender),
    dailyCalories: estimateDailyCalories(enriched),
    coachRecommendations,
    dietitianRecommendations,
    fitnessScore: calculateFitnessScore(enriched),
    priorityGoal: getPriorityGoal(enriched.goals || []),
    healthTestInsights,
    estimatedMetrics: enriched.estimatedMetrics === true,
  }
}

function buildHealthTestInsights(healthTest = {}, gender) {
  if (!healthTest || typeof healthTest !== 'object') return []
  return describeHealthTest(healthTest, gender)
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

  const ht = profile.healthTest || {}
  if (ht.wellbeing >= 4) score += 5
  if (ht.energy === 'high') score += 5
  if (ht.sleepQuality === 'good') score += 5
  if (ht.stressLevel === 'low') score += 5
  if (ht.injuries === 'yes' || ht.painAreas?.length) score -= 8
  if (ht.chronicConditions?.length) score -= 5
  if (ht.teaCoffee === 'high') score -= 3
  if (ht.substanceUse === 'regular') score -= 10
  if (ht.substanceUse === 'occasional') score -= 5
  if (ht.travelFrequency === 'weekly') score -= 2

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
    description: ex.description || '',
    sportType: ex.sportType || '',
  }
}

function generateCoachList(profile, exercises, goalCategories, healthTestInsights = []) {
  const library = pickLibraryExercises(exercises)
  const ht = profile.healthTest || {}
  const lowImpactOnly = ht.injuries === 'yes' || (ht.painAreas || []).length > 0

  const scored = library.map((ex) => {
    let score = 0
    const cat = String(ex.category || ex.bodyPart || '').toLowerCase()
    const sport = String(ex.sportType || '').toLowerCase()
    const name = String(ex.name || '').toLowerCase()

    goalCategories.forEach((goalCat) => {
      const g = goalCat.toLowerCase()
      if (cat.includes(g) || g.includes(cat) || sport.includes(g) || name.includes(g)) score += 12
    })

    if (ht.activityFrequency === 'sedentary' && (cat.includes('yoga') || cat.includes('esneklik') || sport.includes('yoga'))) score += 8
    if (ht.stressLevel === 'high' && (name.includes('nefes') || cat.includes('yoga'))) score += 6
    if (ht.sleepQuality === 'poor' && cat.includes('esneklik')) score += 5
    if (ht.teaCoffee === 'high' && (cat.includes('esneklik') || name.includes('nefes') || cat.includes('yoga'))) score += 4
    if (ht.travelFrequency === 'weekly' && (sport.includes('ev') || name.includes('vücut') || cat.includes('tüm vücut'))) score += 6
    if (ht.travelFrequency === 'monthly' && sport.includes('ev')) score += 3
    if ((ht.substanceUse === 'regular' || ht.substanceUse === 'occasional') && (cat.includes('esneklik') || cat.includes('kardiyo'))) score += 3

    if (lowImpactOnly && (name.includes('hiit') || name.includes('sprint') || sport.includes('hiit'))) score -= 15
    if (lowImpactOnly && (cat.includes('kardiyo') || sport.includes('koşu'))) score -= 4

    return { ex, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const selected = (scored.filter((s) => s.score > 0).length > 0 ? scored.filter((s) => s.score > 0) : scored)
    .slice(0, 6)
    .map((s) => normalizeLibraryExercise(s.ex))

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
