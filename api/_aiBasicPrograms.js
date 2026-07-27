/**
 * Basic + Eko AI program yardımcıları (sunucu).
 * Basic süre: bugün → freeTrialExpiresAt (48s deneme).
 */

import { guardNutritionMeals, guardNutritionDayPlans } from './_coaching/nutritionGuard.js'

export const AI_BASIC_SOURCE = 'ai_basic'
export const AI_EKO_SOURCE = 'ai_eko'
export const STAFF_NAME = 'Yeni Form'
export const EKO_DIET_DAYS = 15
export const EKO_WORKOUT_DAYS = 30

export const MEAL_TYPE_IDS = [
  'breakfast',
  'snack_morning',
  'lunch',
  'snack_afternoon',
  'dinner',
  'snack_evening',
  'note',
]

const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  snack_morning: '10:30',
  lunch: '13:00',
  snack_afternoon: '16:00',
  dinner: '19:00',
  snack_evening: '21:30',
  note: '12:00',
}

const DISCLAIMER =
  'Bu program genel bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez. Sağlık sorununuz varsa uzmana danışın.'

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function toDateStr(value) {
  if (!value) return null
  if (typeof value === 'string') {
    if (value.includes('T')) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) return toDateStr(d)
    }
    const slice = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
  }
  return null
}

export function parseLocalDate(str) {
  const s = toDateStr(str)
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function addDaysLocal(date, days) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

export function diffCalendarDays(startStr, endStr) {
  const a = parseLocalDate(startStr)
  const b = parseLocalDate(endStr)
  if (!a || !b) return 0
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
}

/** Deneme bitiş tarihi geçmişse veya yoksa pencere kapalı */
export function isBasicProgramWindowOpen(freeTrialExpiresAt, today = new Date()) {
  if (!freeTrialExpiresAt) return false
  const exp = new Date(freeTrialExpiresAt)
  if (Number.isNaN(exp.getTime())) return false
  return exp.getTime() > today.getTime()
}

/**
 * Bugünden freeTrialExpiresAt gününe (dahil) kaç takvim günü.
 * @returns {{ startStr: string, endStr: string, cycleLength: number } | null}
 */
export function resolveBasicCycleWindow(freeTrialExpiresAt, today = new Date()) {
  if (!isBasicProgramWindowOpen(freeTrialExpiresAt, today)) return null
  const startStr = toDateStr(today)
  const endStr = toDateStr(freeTrialExpiresAt)
  if (!startStr || !endStr) return null
  if (diffCalendarDays(startStr, endStr) < 0) return null
  const cycleLength = Math.max(1, diffCalendarDays(startStr, endStr) + 1)
  return { startStr, endStr, cycleLength }
}

export function getWorkoutWeekdays(availability = {}) {
  return Object.entries(availability || {})
    .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
    .map(([day]) => Number(day))
    .filter((d) => !Number.isNaN(d))
}

export function memberHasWorkoutAvailability(availability) {
  return getWorkoutWeekdays(availability).length > 0
}

export function isWorkoutAllowedOnDate(date, availability) {
  const workoutDays = getWorkoutWeekdays(availability)
  if (!workoutDays.length) return false
  return workoutDays.includes(date.getDay())
}

export function eachDateInCycle(startStr, length) {
  const start = parseLocalDate(startStr)
  const len = Math.max(1, Number(length) || 1)
  if (!start) return []
  const out = []
  for (let i = 0; i < len; i++) out.push(addDaysLocal(start, i))
  return out
}

const DAY_LABELS = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
}

const HEALTH_PRIORITY_FIELDS = [
  ['chronicConditions', 'Kronik durumlar'],
  ['chronicConditionsDetail', 'Kronik durum detayı'],
  ['injuries', 'Yaralanmalar'],
  ['injuriesDetail', 'Yaralanma detayı'],
  ['painAreas', 'Ağrı bölgeleri'],
  ['painScale', 'Ağrı şiddeti'],
  ['exerciseContraindications', 'Egzersiz kontrendikasyonları'],
  ['exerciseContraindicationsDetail', 'Kontrendikasyon detayı'],
  ['medications', 'İlaç kullanımı'],
  ['medicationsDetail', 'İlaç detayı'],
  ['foodAllergies', 'Besin alerjileri'],
  ['foodAllergiesDetail', 'Alerji detayı'],
  ['dietFoodAllergiesDetail', 'Diyet alerji notu'],
  ['eatingHabits', 'Yeme alışkanlıkları'],
  ['activityFrequency', 'Aktivite sıklığı'],
  ['sittingHours', 'Günlük oturma süresi'],
  ['trainingLocation', 'Antrenman yeri'],
  ['equipmentAccess', 'Ekipman erişimi'],
  ['currentActivityTypes', 'Mevcut aktivite türleri'],
  ['sessionDurationGoal', 'Hedef antrenman süresi'],
  ['performanceGoal', 'Performans hedefi'],
  ['sleepQuality', 'Uyku kalitesi'],
  ['goalBelief', 'Hedefe inanma'],
  ['primaryGoalReason', 'Hedef nedeni'],
  ['stressLevel', 'Stres seviyesi'],
  ['energy', 'Enerji'],
  ['wellbeing', 'Genel iyilik hali'],
  ['motivation', 'Motivasyon'],
  ['lifeQuality', 'Yaşam kalitesi'],
  ['readinessToChange', 'Değişime hazırlık'],
  ['biggestBarrier', 'En büyük engel'],
  ['pregnancy', 'Gebelik'],
  ['doctorClearance', 'Doktor kısıtlaması'],
  ['bloodPressureIssues', 'Tansiyon sorunları'],
  ['digestiveDisorders', 'Sindirim sorunları'],
  ['thyroidStatus', 'Tiroid durumu'],
  ['currentComplaints', 'Güncel şikayetler'],
  ['supplements', 'Takviyeler'],
  ['supplementsDetail', 'Takviye detayı'],
  ['targetWeight', 'Hedef kilo'],
  ['weight', 'Test kilosu'],
  ['height', 'Test boyu'],
  ['weightChange', 'Kilo değişimi'],
  ['weightChangeDetail', 'Kilo değişim detayı'],
]

function formatHealthValue(v, key = '') {
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object' && v != null) return JSON.stringify(v)
  const s = String(v)
  if (key === 'pregnancy') {
    const map = {
      yes: 'Evet',
      no: 'Hayır',
      suspect: 'Hamile olduğumu düşünüyorum',
      prefer_not: 'Belirtmek istemiyor (gebelik varsayılmamalı)',
    }
    return map[s] || s
  }
  if (key === 'breastfeeding') {
    const map = {
      yes: 'Evet',
      no: 'Hayır',
      prefer_not: 'Belirtmek istemiyor',
    }
    return map[s] || s
  }
  if (key === 'trainingLocation') {
    const map = { home: 'Evde', gym: 'Spor salonunda', office: 'Ofiste', outdoor: 'Evde', mixed: 'Karışık' }
    return map[s] || s
  }
  return s
}

function hasHealthValue(v) {
  if (v == null || v === '') return false
  if (Array.isArray(v)) return v.length > 0
  return true
}

function inferGoalsFromHealthTest(ht = {}) {
  const goals = new Set()
  const habits = Array.isArray(ht.eatingHabits) ? ht.eatingHabits : []
  if (habits.includes('fast_food') || habits.includes('night_snack') || habits.includes('skip_meals')) {
    goals.add('weight')
    goals.add('habit')
  }
  if (
    ht.stressLevel === 'high'
    || ht.sleepQuality === 'poor'
    || ht.sleepQuality === 'very_poor'
  ) {
    goals.add('sleep')
  }
  const goalReasons = Array.isArray(ht.primaryGoalReason)
    ? ht.primaryGoalReason
    : (ht.primaryGoalReason ? [ht.primaryGoalReason] : [])
  if (goalReasons.includes('weight_loss')) goals.add('weight')
  if (goalReasons.includes('muscle')) goals.add('muscle')
  if (goalReasons.includes('sport')) goals.add('performance')
  if (ht.activityFrequency === 'sedentary' || ht.sittingHours === '8+') {
    goals.add('habit')
    goals.add('heart')
  }
  if (ht.activityFrequency === 'active' || ht.activityFrequency === 'moderate') goals.add('endurance')
  const chronic = Array.isArray(ht.chronicConditions) ? ht.chronicConditions : []
  if (chronic.includes('heart') || chronic.includes('hypertension')) goals.add('heart')
  if (chronic.includes('diabetes')) goals.add('weight')
  if (ht.performanceGoal === 'muscle' || ht.performanceGoal === 'strength') goals.add('muscle')
  if (ht.performanceGoal === 'fat_loss' || ht.performanceGoal === 'weight_loss') goals.add('weight')
  if (goals.size === 0) goals.add('habit')
  return [...goals]
}

function inferNutritionPrefsFromHealthTest(ht = {}) {
  const prefs = []
  const allergyText = [
    Array.isArray(ht.foodAllergies) ? ht.foodAllergies.join(' ') : ht.foodAllergies,
    ht.foodAllergiesDetail,
    ht.dietFoodAllergiesDetail,
  ].filter(Boolean).join(' ').toLowerCase()
  if (allergyText.includes('gluten')) prefs.push('gluten-free')
  if (allergyText.includes('laktoz') || allergyText.includes('süt') || allergyText.includes('sut')) prefs.push('lactose-aware')
  if (allergyText.includes('vejet') || allergyText.includes('vegan')) prefs.push('plant-based')
  const habits = Array.isArray(ht.eatingHabits) ? ht.eatingHabits : []
  if (habits.includes('regular')) prefs.push('balanced')
  if (prefs.length === 0) prefs.push('balanced')
  return prefs
}

function calcBmi(weight, height) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h < 50) return null
  const bmi = w / ((h / 100) ** 2)
  return Math.round(bmi * 10) / 10
}

function bmiCategory(bmi) {
  if (bmi == null) return ''
  if (bmi < 18.5) return 'zayıf'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'fazla kilolu'
  return 'obezite aralığı'
}

function formatAvailabilitySummary(availability = {}) {
  const days = getWorkoutWeekdays(availability)
  if (!days.length) return 'belirtilmemiş'
  return days
    .map((d) => {
      const hours = Array.isArray(availability[d]) ? availability[d].join(', ') : ''
      return hours ? `${DAY_LABELS[d] || d} (${hours})` : (DAY_LABELS[d] || String(d))
    })
    .join('; ')
}

function summarizeHealthAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') return ''
  const parts = []
  if (analysis.bmi != null) parts.push(`BMI ${analysis.bmi}${analysis.bmiCategory ? ` (${analysis.bmiCategory})` : ''}`)
  if (analysis.priorityGoal) parts.push(`öncelik: ${analysis.priorityGoal}`)
  if (analysis.fitnessScore != null) parts.push(`fitness skoru: ${analysis.fitnessScore}`)
  if (Array.isArray(analysis.healthTestInsights) && analysis.healthTestInsights.length) {
    parts.push(analysis.healthTestInsights.slice(0, 6).join(' | '))
  }
  const tips = analysis.dietitianRecommendations?.tips
  if (Array.isArray(tips) && tips.length) parts.push(`beslenme odağı: ${tips.slice(0, 2).join('; ')}`)
  return parts.join('. ').slice(0, 600)
}

/**
 * Mifflin–St Jeor BMR → TDEE → hedef kcal + P/F/C (LLM’e güvenilmez).
 * @returns {{
 *   bmr: number, maintenance: number, recommended: number, goal: string,
 *   proteinG: number, fatG: number, carbG: number, method: string,
 *   activityMultiplier: number, safety?: object,
 * }}
 */
export function estimateDailyCalories(profile = {}, safety = null) {
  const w = parseFloat(profile.weight) || 70
  const h = parseFloat(profile.height) || 170
  const a = parseFloat(profile.age) || 30
  const isMale = profile.gender === 'male'
  // Mifflin–St Jeor
  const bmr = isMale
    ? (10 * w) + (6.25 * h) - (5 * a) + 5
    : (10 * w) + (6.25 * h) - (5 * a) - 161

  const htActivity = profile.rawHealthTest?.activityFrequency
    || profile.healthTest?.activityFrequency
    || null
  const activityFromHt = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }
  const activityFromFitness = { beginner: 1.375, intermediate: 1.55, advanced: 1.725 }
  const multiplier = activityFromHt[htActivity]
    || activityFromFitness[profile.fitnessLevel]
    || 1.375

  const maintenance = Math.round(bmr * multiplier)
  const roundedBmr = Math.round(bmr)
  const floorKcal = Math.max(roundedBmr, isMale ? 1500 : 1200)
  const goals = profile.goals || []
  const wantFatLoss = goals.some((g) => g === 'weight' || g === 'fatburn')
  const wantMuscle = goals.some((g) => g === 'muscle' || g === 'tone')
  const blockDeficit = Boolean(safety?.blockDeficit || safety?.softMaintenanceOnly)
  const bmi = profile.bmi != null ? Number(profile.bmi) : null

  let recommended = maintenance
  let goal = 'Form koruma'
  if (wantFatLoss && !blockDeficit && !(bmi != null && bmi < 18.5)) {
    // %15–20 açık (orta nokta ~%17.5)
    recommended = Math.round(maintenance * 0.825)
    goal = 'Kilo verme'
  } else if (wantMuscle && !safety?.softMaintenanceOnly) {
    recommended = Math.round(maintenance * 1.08)
    goal = 'Kas kazanımı'
  } else if (wantFatLoss && blockDeficit) {
    recommended = maintenance
    goal = 'Form koruma (güvenli)'
  }

  recommended = Math.max(floorKcal, recommended)

  // Protein bandı (g/kg) — deficit / yüksek BMI üst banda
  let proteinPerKg = 1.6
  if (goal.startsWith('Kilo verme') || (bmi != null && bmi >= 27 && wantFatLoss)) {
    proteinPerKg = 2.1
  } else if (wantMuscle) {
    proteinPerKg = 1.9
  } else if (a >= 65) {
    proteinPerKg = 1.8
  }
  proteinPerKg = Math.max(1.6, Math.min(2.4, proteinPerKg))
  const proteinG = Math.round(w * proteinPerKg)

  // Yağ ≥ 0.6 g/kg
  const fatPerKg = Math.max(0.6, wantFatLoss ? 0.7 : 0.8)
  const fatG = Math.round(w * fatPerKg)
  const proteinKcal = proteinG * 4
  const fatKcal = fatG * 9
  const carbKcal = Math.max(0, recommended - proteinKcal - fatKcal)
  const carbG = Math.round(carbKcal / 4)

  return {
    bmr: roundedBmr,
    maintenance,
    recommended,
    goal,
    proteinG,
    fatG,
    carbG,
    method: 'mifflin',
    activityMultiplier: multiplier,
    safety: safety
      ? { flags: safety.flags || [], messagesTR: safety.messagesTR || [] }
      : null,
  }
}

export function enrichProfileBasics(memberData = {}) {
  const ht = memberData.healthTest || {}
  const weight = parseFloat(memberData.weight) || parseFloat(ht.weight) || 70
  const height = parseFloat(memberData.height) || parseFloat(ht.height) || 170
  let age = parseFloat(memberData.age)
  if (!age && memberData.birthDate) {
    const birth = parseLocalDate(memberData.birthDate)
    if (birth) {
      const ms = Date.now() - birth.getTime()
      age = Math.max(16, ms / (365.25 * 24 * 60 * 60 * 1000))
    }
  }
  if (!age) age = parseFloat(ht.age) || 30

  const fitnessMap = {
    sedentary: 'beginner',
    light: 'beginner',
    moderate: 'intermediate',
    active: 'advanced',
  }
  const fitnessLevel = memberData.fitnessLevel
    || fitnessMap[ht.activityFrequency]
    || 'beginner'

  const goals = Array.isArray(memberData.goals) && memberData.goals.length
    ? memberData.goals
    : inferGoalsFromHealthTest(ht)

  const nutritionPrefs = Array.isArray(memberData.nutritionPrefs) && memberData.nutritionPrefs.length
    ? memberData.nutritionPrefs
    : inferNutritionPrefsFromHealthTest(ht)

  const bmi = calcBmi(weight, height)
  const targetWeight = parseFloat(memberData.targetWeight) || parseFloat(ht.targetWeight) || null
  const availability = memberData.availability || {}

  return {
    ...memberData,
    weight,
    height,
    age: Math.round(age),
    fitnessLevel,
    goals,
    nutritionPrefs,
    gender: memberData.gender || '',
    bmi,
    bmiCategory: bmiCategory(bmi),
    targetWeight: targetWeight || null,
    availabilitySummary: formatAvailabilitySummary(availability),
    healthAnalysisSummary: summarizeHealthAnalysis(memberData.healthAnalysis),
    trainingLocation: ht.trainingLocation || ht.preferredExercisePlace || memberData.trainingLocation || '',
    equipmentAccess: Array.isArray(ht.equipmentAccess) ? ht.equipmentAccess.join(', ') : (ht.equipmentAccess || ''),
    sessionDurationGoal: ht.sessionDurationGoal || '',
    performanceGoal: ht.performanceGoal || '',
  }
}

/** Yapılandırılmış sağlık testi özeti — öncelikli alanlar Türkçe etiketli. */
export function buildHealthTestSummary(healthTest = {}, maxLen = 3800) {
  if (!healthTest || typeof healthTest !== 'object') return ''

  const ht = { ...healthTest }
  if (!ht.trainingLocation && ht.preferredExercisePlace) {
    const place = ht.preferredExercisePlace
    if (place === 'home' || place === 'gym' || place === 'office') ht.trainingLocation = place
    else if (place === 'outdoor') ht.trainingLocation = 'home'
  }

  const used = new Set(['preferredExercisePlace'])
  const lines = []

  for (const [key, label] of HEALTH_PRIORITY_FIELDS) {
    const v = ht[key]
    if (!hasHealthValue(v)) continue
    used.add(key)
    lines.push(`${label}: ${formatHealthValue(v, key)}`)
  }

  for (const [key, v] of Object.entries(ht)) {
    if (used.has(key) || !hasHealthValue(v)) continue
    lines.push(`${key}: ${formatHealthValue(v, key)}`)
  }

  let out = lines.join('\n')
  if (out.length > maxLen) out = `${out.slice(0, maxLen)}\n…`
  return out
}

function uid(prefix = 'e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function addMinutesToTime(start, minutes) {
  const [h, m] = String(start || '09:00').split(':').map(Number)
  const total = (h || 0) * 60 + (m || 0) + (Number(minutes) || 30)
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${pad2(eh)}:${pad2(em)}`
}

function entryDisplayText(e) {
  const amount = e.amountType === 'duration'
    ? `${e.amount} ${e.durationUnit || 'sn'}`
    : `${e.amount} tekrar`
  const time = e.start ? `${e.start}${e.end ? `–${e.end}` : ''} ` : ''
  return `${time}${e.exerciseName} · ${amount}${e.note ? ` (${e.note})` : ''}`
}

function mealDisplayText(e, cycleLength) {
  const days = cycleLength || ''
  return `${days} gün boyunca her gün ${e.start || ''} ${e.mealType}: ${e.name}${e.note ? ` (${e.note})` : ''}`
}

export function toCandidateRows(exercises = []) {
  return exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    bodyPart: ex.body_part || ex.bodyPart || ex.category || '',
    difficulty: ex.difficulty || 'beginner',
    equipment: ex.equipment || '',
    targetMuscle: ex.target_muscle || ex.targetMuscle || '',
    locations: Array.isArray(ex.locations) ? ex.locations : [],
  }))
}

function normalizeExerciseSpecs(rawList, exercisesById, candidateIds) {
  return (Array.isArray(rawList) ? rawList : [])
    .map((e) => ({
      exerciseId: String(e.exerciseId || e.id || '').trim(),
      amountType: e.amountType === 'duration' ? 'duration' : 'reps',
      amount: Math.min(120, Math.max(1, Number(e.amount) || (e.amountType === 'duration' ? 30 : 12))),
      durationUnit: e.durationUnit === 'dk' ? 'dk' : 'sn',
      note: String(e.note || '').slice(0, 120),
      block: e.block || '',
      pattern: e.pattern || '',
    }))
    .filter((e) => e.exerciseId && (candidateIds.has(e.exerciseId) || exercisesById[e.exerciseId]))
    .slice(0, 10)
}

function hydrateEntries(specs, exercisesById, sessionStart, sessionEnd) {
  return specs.map((spec, i) => {
    const ex = exercisesById[spec.exerciseId]
    if (!ex) return null
    return {
      id: uid('w'),
      exerciseId: ex.id,
      exerciseName: ex.name,
      videoUrl: ex.video_url || ex.videoUrl || '',
      description: ex.description || '',
      amountType: spec.amountType,
      amount: spec.amount,
      durationUnit: spec.durationUnit,
      note: spec.note,
      block: spec.block || undefined,
      pattern: spec.pattern || undefined,
      start: sessionStart,
      end: sessionEnd,
      order: i,
    }
  }).filter(Boolean)
}

function isDateAllowedForWorkout(d, availability, workoutWeekdays) {
  if (memberHasWorkoutAvailability(availability)) {
    return isWorkoutAllowedOnDate(d, availability)
  }
  if (Array.isArray(workoutWeekdays) && workoutWeekdays.length) {
    return workoutWeekdays.includes(d.getDay())
  }
  return true
}

/**
 * AI program JSON çıktısını doğrula; kütüphaneden hydrate et; program data payload’ları üret.
 * `coachedWorkout` varsa egzersiz seçimi Coaching Engine’den gelir (LLM seçmez).
 */
function normalizeMealList(rawMeals = []) {
  const mealByType = new Map()
  ;(Array.isArray(rawMeals) ? rawMeals : []).forEach((m) => {
    const mealType = MEAL_TYPE_IDS.includes(m.mealType) ? m.mealType : null
    if (!mealType || mealType === 'note') return
    const name = String(m.name || '').trim()
    if (!name) return
    mealByType.set(mealType, {
      mealType,
      name: name.slice(0, 400),
      note: String(m.note || '').slice(0, 200),
      start: /^\d{2}:\d{2}$/.test(String(m.start || '')) ? m.start : (DEFAULT_MEAL_TIMES[mealType] || '12:00'),
    })
  })
  const defaults = {
    breakfast: 'Yulaf ezmesi, 1 yumurta, domates-salatalık, bitki çayı (~320 kcal)',
    lunch: 'Izgara tavuk veya mercimek, salata, pirinç (~450 kcal)',
    dinner: 'Sebzeli ızgara balık veya yoğurtlu sebze yemeği, salata (~420 kcal)',
  }
  ;['breakfast', 'lunch', 'dinner'].forEach((mt) => {
    if (!mealByType.has(mt)) {
      mealByType.set(mt, {
        mealType: mt,
        name: defaults[mt],
        note: '',
        start: DEFAULT_MEAL_TIMES[mt],
      })
    }
  })
  return MEAL_TYPE_IDS
    .filter((id) => id !== 'note' && mealByType.has(id))
    .map((id) => mealByType.get(id))
}

export function buildValidatedProgramPayloads({
  aiJson,
  exercisesById,
  candidateIds,
  memberName,
  cycleStartDate,
  cycleLength,
  availability,
  dailyCalories,
  source = AI_BASIC_SOURCE,
  buildNutrition = true,
  buildWorkout = true,
  previousDietSummary = '',
  coachedWorkout = null,
  healthTest = null,
  foodIndex = null,
  weeklyNutrition = false,
}) {
  const len = Math.max(1, Number(cycleLength) || 1)
  const cal = dailyCalories?.recommended || dailyCalories?.maintenance || null
  const calLine = cal
    ? `Hedef ~${cal} kcal/gün (${dailyCalories?.goal || 'Form koruma'}).`
    : ''

  const workoutRaw = aiJson?.workout || {}
  const nutritionRaw = aiJson?.nutrition || {}

  let workoutPayload = null
  let nutritionPayload = null
  const endStr = toDateStr(addDaysLocal(parseLocalDate(cycleStartDate), len - 1))

  if (buildWorkout) {
    const sessionDuration = Math.min(
      90,
      Math.max(20, Number(coachedWorkout?.sessionDuration || workoutRaw.sessionDuration) || 30),
    )
    const sessionStart = /^\d{2}:\d{2}$/.test(String(coachedWorkout?.sessionStart || workoutRaw.sessionStart || ''))
      ? String(coachedWorkout?.sessionStart || workoutRaw.sessionStart)
      : '09:00'
    const sessionEnd = addMinutesToTime(sessionStart, sessionDuration)
    const workoutWeekdays = Array.isArray(coachedWorkout?.workoutWeekdays)
      ? coachedWorkout.workoutWeekdays
      : getWorkoutWeekdays(availability)

    /** @type {Map<string, object[]>} */
    const templateEntries = new Map()
    const templates = Array.isArray(coachedWorkout?.templates) ? coachedWorkout.templates : []
    const mapping = Array.isArray(coachedWorkout?.mapping) ? coachedWorkout.mapping : []

    if (templates.length) {
      for (const tpl of templates) {
        const specs = normalizeExerciseSpecs(tpl.exercises, exercisesById, candidateIds)
        const entries = hydrateEntries(specs, exercisesById, sessionStart, sessionEnd)
        if (entries.length) templateEntries.set(tpl.id, entries)
      }
    }

    let primarySpecs = normalizeExerciseSpecs(
      coachedWorkout?.exercises || workoutRaw.exercises,
      exercisesById,
      candidateIds,
    )
    // Not polish from LLM for same ids
    if (coachedWorkout?.exercises?.length && Array.isArray(workoutRaw.exerciseNotes)) {
      const noteById = new Map(
        workoutRaw.exerciseNotes
          .filter((n) => n?.exerciseId && n?.note)
          .map((n) => [String(n.exerciseId), String(n.note).slice(0, 120)]),
      )
      primarySpecs = primarySpecs.map((s) => ({
        ...s,
        note: noteById.get(s.exerciseId) || s.note,
      }))
    }

    const baseEntries = templateEntries.size
      ? (templateEntries.get(templates[0]?.id) || hydrateEntries(primarySpecs, exercisesById, sessionStart, sessionEnd))
      : hydrateEntries(primarySpecs, exercisesById, sessionStart, sessionEnd)

    if (baseEntries.length < 4) {
      throw new Error('Geçerli kütüphane hareketi yetersiz — coaching havuzu veya seçim başarısız')
    }

    const weekdayToTemplate = new Map(
      mapping.map((m) => [Number(m.weekday), m.templateId]),
    )

    const canDateFilter = memberHasWorkoutAvailability(availability)
      || (Array.isArray(workoutWeekdays) && workoutWeekdays.length > 0)

    let workoutEntries
    let cycleSameDaily

    if (canDateFilter) {
      cycleSameDaily = false
      workoutEntries = []
      eachDateInCycle(cycleStartDate, len).forEach((d) => {
        if (!isDateAllowedForWorkout(d, availability, workoutWeekdays)) return
        const dateStr = toDateStr(d)
        const tplId = weekdayToTemplate.get(d.getDay()) || templates[0]?.id
        const dayEntries = (tplId && templateEntries.get(tplId)) || baseEntries
        dayEntries.forEach((base, i) => {
          workoutEntries.push({
            ...base,
            id: uid('w'),
            date: dateStr,
            order: i,
          })
        })
      })
      if (!workoutEntries.length) {
        cycleSameDaily = true
        workoutEntries = baseEntries
      }
    } else {
      cycleSameDaily = true
      workoutEntries = baseEntries
    }

    const hintDesc = coachedWorkout?.descriptionHints || ''
    const workoutTitle = String(workoutRaw.title || coachedWorkout?.title || '').trim()
      || `${memberName} — ${len} Günlük Antrenman`
    const workoutDesc = [
      String(workoutRaw.description || '').trim() || hintDesc,
      DISCLAIMER,
    ].filter(Boolean).join(' ')

    workoutPayload = {
      type: 'workout',
      memberName: memberName || '',
      staffName: STAFF_NAME,
      title: workoutTitle.slice(0, 120),
      description: workoutDesc.slice(0, 800),
      sessionDuration,
      scheduleType: 'dateRange',
      cycleStartDate,
      cycleLength: len,
      cycleLoop: false,
      cycleSameDaily,
      entries: workoutEntries,
      items: (cycleSameDaily ? baseEntries : workoutEntries.slice(0, baseEntries.length)).map(entryDisplayText),
      source,
      coaching: coachedWorkout ? {
        splitType: coachedWorkout.splitType || null,
        riskLevel: coachedWorkout.riskLevel || null,
        poolSize: coachedWorkout.poolSize || null,
        adaptationMode: coachedWorkout.adaptationMode || null,
        adherenceRate: coachedWorkout.adherenceRate ?? null,
        volumeScale: coachedWorkout.volumeScale ?? null,
        deload: coachedWorkout.deload ?? false,
        explain: coachedWorkout.explain || null,
      } : null,
    }
  }

  if (buildNutrition) {
    const useWeekly = weeklyNutrition || source === AI_EKO_SOURCE
    const rawDayPlans = Array.isArray(nutritionRaw.mealDays) ? nutritionRaw.mealDays : []
    const parsedDayPlans = rawDayPlans
      .map((d, i) => ({
        dayIndex: Number.isFinite(Number(d.dayIndex)) ? Number(d.dayIndex) : i,
        meals: normalizeMealList(d.meals),
      }))
      .filter((d) => d.meals.length >= 3)
      .slice(0, 7)

    const baseMeals = normalizeMealList(nutritionRaw.meals)
    const guardOpts = {
      healthTest: healthTest || {},
      dailyCalories,
      foodIndex,
    }

    let nutritionEntries
    let cycleSameDaily
    let guardedMeta

    if (useWeekly && parsedDayPlans.length >= 3) {
      const {
        dayPlans,
        explain,
        allergyFlags,
        groundingCoverage,
        estimatedFatG,
        estimatedCarbG,
        estimatedProteinG,
      } = guardNutritionDayPlans(parsedDayPlans, guardOpts)
      const byIndex = new Map(dayPlans.map((d) => [d.dayIndex % 7, d.meals]))
      // Eksik günleri ilk güne doldur
      const fallback = dayPlans[0]?.meals || baseMeals
      nutritionEntries = []
      eachDateInCycle(cycleStartDate, len).forEach((d, offset) => {
        const dateStr = toDateStr(d)
        const meals = byIndex.get(offset % 7) || byIndex.get(d.getDay()) || fallback
        meals.forEach((m, i) => {
          nutritionEntries.push({
            id: uid('n'),
            mealType: m.mealType,
            name: m.name,
            note: m.note,
            start: m.start,
            date: dateStr,
            order: i,
          })
        })
      })
      cycleSameDaily = false
      const avgKcal = Math.round(
        dayPlans.reduce((s, d) => s + (d.dailyKcal || 0), 0) / Math.max(1, dayPlans.length),
      )
      guardedMeta = {
        dailyKcal: avgKcal || null,
        targetKcal: dailyCalories?.recommended || dailyCalories?.maintenance || null,
        inBand: dayPlans.every((d) => d.inBand !== false),
        allergyFlags: allergyFlags || [],
        estimatedProteinG: estimatedProteinG ?? dailyCalories?.proteinG ?? null,
        estimatedFatG: estimatedFatG ?? null,
        estimatedCarbG: estimatedCarbG ?? null,
        groundingCoverage: groundingCoverage ?? null,
        weeklyDays: dayPlans.length,
        explain,
      }
    } else {
      const guarded = guardNutritionMeals(baseMeals, guardOpts)
      nutritionEntries = guarded.meals.map((m) => ({
        id: uid('n'),
        mealType: m.mealType,
        name: m.name,
        note: m.note,
        start: m.start,
      }))
      cycleSameDaily = true
      guardedMeta = {
        dailyKcal: guarded.dailyKcal || null,
        targetKcal: guarded.targetKcal || null,
        inBand: guarded.inBand,
        allergyFlags: guarded.allergyFlags || [],
        estimatedProteinG: guarded.estimatedProteinG || null,
        estimatedFatG: guarded.estimatedFatG ?? null,
        estimatedCarbG: guarded.estimatedCarbG ?? null,
        groundingCoverage: guarded.groundingCoverage ?? null,
        proteinOk: guarded.proteinOk,
        explain: guarded.explain,
      }
    }

    const nutritionTitle = String(nutritionRaw.title || '').trim()
      || `${memberName} — ${len} Günlük Beslenme Listesi`
    const kcalNote = guardedMeta.targetKcal && guardedMeta.dailyKcal
      ? `Günlük tahmini ~${guardedMeta.dailyKcal} kcal (hedef ~${guardedMeta.targetKcal}).`
      : ''
    const proteinHint = (coachedWorkout?.proteinGDay || dailyCalories?.proteinG)
      ? `Protein hedefi ~${coachedWorkout?.proteinGDay || dailyCalories.proteinG} g/gün.`
      : ''
    const macroHint = dailyCalories?.fatG != null
      ? `Makro ~ P${dailyCalories.proteinG}/Y${dailyCalories.fatG}/K${dailyCalories.carbG} g.`
      : ''
    const safetyHint = (dailyCalories?.safety?.messagesTR || []).slice(0, 1).join(' ')
    const nutritionDesc = [
      calLine || kcalNote,
      proteinHint,
      macroHint,
      cycleSameDaily ? '' : '7 günlük menü rotasyonu uygulandı.',
      previousDietSummary ? 'Önceki liste dikkate alındı.' : '',
      guardedMeta.allergyFlags?.length ? 'Alerji/kısıtlara göre öğünler güvenli alternatiflerle uyumlu hale getirildi.' : '',
      safetyHint,
      String(nutritionRaw.description || '').trim(),
      DISCLAIMER,
    ].filter(Boolean).join(' ')

    nutritionPayload = {
      type: 'nutrition',
      memberName: memberName || '',
      staffName: STAFF_NAME,
      title: nutritionTitle.slice(0, 120),
      description: nutritionDesc.slice(0, 900),
      scheduleType: 'dateRange',
      cycleStartDate,
      cycleLength: len,
      cycleLoop: false,
      cycleSameDaily,
      entries: nutritionEntries,
      items: (cycleSameDaily
        ? nutritionEntries
        : nutritionEntries.filter((e) => e.date === cycleStartDate)
      ).map((e) => mealDisplayText(e, len)),
      source,
      nutritionGuard: {
        dailyKcal: guardedMeta.dailyKcal || null,
        targetKcal: guardedMeta.targetKcal || null,
        inBand: guardedMeta.inBand,
        allergyFlags: guardedMeta.allergyFlags || [],
        estimatedProteinG: guardedMeta.estimatedProteinG || null,
        estimatedFatG: guardedMeta.estimatedFatG ?? null,
        estimatedCarbG: guardedMeta.estimatedCarbG ?? null,
        groundingCoverage: guardedMeta.groundingCoverage ?? null,
        proteinOk: guardedMeta.proteinOk,
        weeklyDays: guardedMeta.weeklyDays || null,
        calorieMethod: dailyCalories?.method || null,
        macros: dailyCalories?.proteinG != null
          ? {
            proteinG: dailyCalories.proteinG,
            fatG: dailyCalories.fatG,
            carbG: dailyCalories.carbG,
          }
          : null,
        safetyFlags: dailyCalories?.safety?.flags || null,
        explain: (guardedMeta.explain || []).slice(0, 12),
      },
    }
  }

  return {
    workoutPayload,
    nutritionPayload,
    endStr,
    cycleLength: len,
    dailyCalories: dailyCalories || null,
  }
}

export function programInsertRow(memberId, payload) {
  const data = {
    type: payload.type,
    memberName: payload.memberName || '',
    staffName: payload.staffName || STAFF_NAME,
    title: payload.title,
    description: payload.description || '',
    items: payload.items || [],
    entries: payload.entries || [],
    scheduleType: payload.scheduleType || null,
    cycleStartDate: payload.cycleStartDate || null,
    cycleLength: payload.cycleLength || null,
    cycleLoop: payload.cycleLoop ?? null,
    cycleSameDaily: payload.cycleSameDaily ?? null,
    sessionDuration: payload.sessionDuration || null,
    source: payload.source || AI_BASIC_SOURCE,
    createdAt: new Date().toISOString(),
  }
  // Opsiyonel motor meta — UI kırılmaz; progresyon/debug için
  if (payload.coaching) data.coaching = payload.coaching
  if (payload.nutritionGuard) data.nutritionGuard = payload.nutritionGuard
  return {
    member_id: memberId,
    staff_id: null,
    data,
  }
}

export async function deleteProgramsBySources(admin, memberId, sources = []) {
  if (!admin || !memberId || !sources.length) return { deleted: 0 }
  const { data: rows } = await admin
    .from('programs')
    .select('id, data')
    .eq('member_id', memberId)
  const ids = (rows || [])
    .filter((r) => sources.includes(r.data?.source))
    .map((r) => r.id)
  if (!ids.length) return { deleted: 0 }
  const { error } = await admin.from('programs').delete().in('id', ids)
  if (error) throw new Error(error.message || 'Programlar silinemedi')
  return { deleted: ids.length }
}

export async function deleteProgramsBySourceAndType(admin, memberId, source, type) {
  if (!admin || !memberId || !source || !type) return { deleted: 0 }
  const { data: rows } = await admin
    .from('programs')
    .select('id, data')
    .eq('member_id', memberId)
  const ids = (rows || [])
    .filter((r) => r.data?.source === source && r.data?.type === type)
    .map((r) => r.id)
  if (!ids.length) return { deleted: 0 }
  const { error } = await admin.from('programs').delete().in('id', ids)
  if (error) throw new Error(error.message || 'Programlar silinemedi')
  return { deleted: ids.length }
}

export async function appendProgramNotifications(admin, memberId, programs) {
  if (!admin || !memberId || !programs?.length) return
  const { data: row } = await admin.from('members').select('data').eq('id', memberId).maybeSingle()
  const data = { ...(row?.data || {}) }
  const existing = Array.isArray(data.notifications) ? data.notifications : []
  const now = new Date().toISOString()
  const added = programs.map((p, idx) => {
    const typeLabel = p.type === 'nutrition' ? 'Beslenme' : 'Antrenman'
    return {
      id: `n-program-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'program',
      title: `Yeni ${typeLabel} Programı`,
      message: `${STAFF_NAME} size "${p.title}" programını hazırladı. Programlarım bölümünden inceleyebilirsiniz.`,
      programId: p.id || null,
      programType: p.type || 'workout',
      read: false,
      createdAt: now,
    }
  })
  data.notifications = [...added, ...existing].slice(0, 80)
  await admin.from('members').update({ data }).eq('id', memberId)
}

/** Kalan paket gününe göre dilim uzunluğunu kısalt */
export function clampCycleLength(desiredDays, cycleStartDate, premiumExpiresAt) {
  const desired = Math.max(1, Number(desiredDays) || 1)
  const start = parseLocalDate(cycleStartDate)
  const endCap = parseLocalDate(toDateStr(premiumExpiresAt))
  if (!start || !endCap) return desired
  const maxLen = diffCalendarDays(toDateStr(start), toDateStr(endCap)) + 1
  if (maxLen < 1) return 0
  return Math.min(desired, maxLen)
}

export function summarizeNutritionProgram(prog) {
  if (!prog?.entries?.length) return ''
  return (prog.entries || [])
    .filter((e) => e.mealType && e.name)
    .map((e) => `${e.mealType}: ${e.name}`)
    .join(' | ')
    .slice(0, 1200)
}

export function programCycleEndDate(prog) {
  if (!prog?.cycleStartDate) return null
  const len = Number(prog.cycleLength) || 1
  const start = parseLocalDate(prog.cycleStartDate)
  if (!start) return null
  return toDateStr(addDaysLocal(start, len - 1))
}

/** cycleStart + cycleLength <= today → dilim bitmiş */
export function isProgramCycleDue(prog, today = new Date()) {
  const end = programCycleEndDate(prog)
  if (!end) return true
  return diffCalendarDays(end, toDateStr(today)) >= 1
}
