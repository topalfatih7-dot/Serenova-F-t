// Sağlık testi — şema CMS veya seed (30 soru). Cinsiyet / paket filtresi yok.

import { HEALTH_SECTIONS } from './healthTestSections.js'
import {
  buildEmptyHealthTestFromSections,
  resolveHealthSections,
} from './healthTestSchema.js'

export { HEALTH_SECTIONS }
export {
  DEFAULT_HEALTH_TEST_SCHEMA,
  normalizeHealthTestSchema,
  resolveHealthSections,
  buildDefaultHealthTestSchema,
} from './healthTestSchema.js'

export const HEALTH_AUDIENCE_META = {
  shared: { label: 'Genel', chip: 'bg-amber-100 text-amber-800 ring-amber-200', border: 'border-amber-100 bg-amber-50/50' },
  coach: { label: 'Koç', chip: 'bg-brand-100 text-brand-800 ring-brand-200', border: 'border-brand-100 bg-brand-50/40' },
  dietitian: { label: 'Diyetisyen', chip: 'bg-sage-100 text-sage-800 ring-sage-200', border: 'border-sage-100 bg-sage-50/40' },
}

function isEmptyValue(v) {
  if (v == null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  return false
}

/**
 * Eski form key'lerini yeni 30 soruluk sete taşır (yalnızca hedef boşsa).
 * Yeni kayıtları bozmaz; eski üyelerin cevaplarını korur.
 */
export function migrateLegacyHealthTestKeys(healthTest = {}) {
  if (!healthTest || typeof healthTest !== 'object') return {}
  const out = { ...healthTest }

  const copyIfEmpty = (fromKey, toKey, transform) => {
    if (!isEmptyValue(out[toKey]) || isEmptyValue(out[fromKey])) return
    out[toKey] = typeof transform === 'function' ? transform(out[fromKey]) : out[fromKey]
  }

  copyIfEmpty('dietSmoking', 'smoking', (v) => {
    if (v === 'yes') return 'daily'
    if (v === 'no') return 'never'
    return v
  })
  copyIfEmpty('dietAlcohol', 'alcohol', (v) => {
    if (v === 'yes') return 'weekly'
    if (v === 'no') return 'none'
    return v
  })
  copyIfEmpty('dietSleepQuality', 'sleepQuality')
  copyIfEmpty('dietStressLevel', 'stressLevel')
  copyIfEmpty('dietWaterIntake', 'waterIntake')
  copyIfEmpty('dietMealsPerDay', 'mealsPerDay')
  copyIfEmpty('dietBreakfast', 'breakfastHabit')
  copyIfEmpty('dietEatOut', 'eatOutFrequency')
  copyIfEmpty('dietSweetIntake', 'sweetIntake')
  copyIfEmpty('dietFoodAllergies', 'foodAllergies')
  copyIfEmpty('dietFoodAllergiesDetail', 'foodAllergiesDetail')
  copyIfEmpty('dietGoal', 'primaryGoal')
  copyIfEmpty('performanceGoal', 'primaryGoal')

  if (isEmptyValue(out.stressLevel)) {
    if (out.dailyStressImpact === 'high' || out.anxiety === 'high') out.stressLevel = 'high'
    else if (out.dailyStressImpact === 'moderate' || out.anxiety === 'moderate') out.stressLevel = 'moderate'
    else if (out.dailyStressImpact === 'low' || out.dailyStressImpact === 'none' || out.anxiety === 'mild' || out.anxiety === 'none') {
      out.stressLevel = 'low'
    }
  }

  if (isEmptyValue(out.nightOrEmotionalEating)) {
    const night = out.dietNightEating === 'yes'
    const emotional = out.dietEmotionalEating === 'yes'
    if (night && emotional) out.nightOrEmotionalEating = 'both'
    else if (night) out.nightOrEmotionalEating = 'night'
    else if (emotional) out.nightOrEmotionalEating = 'emotional'
    else if (out.dietNightEating === 'no' && out.dietEmotionalEating === 'no') {
      out.nightOrEmotionalEating = 'none'
    }
  }

  return out
}

function withMigrated(healthTest) {
  return migrateLegacyHealthTestKeys(healthTest || {})
}

/** Seed tabanlı boş nesne (geriye dönük). Dinamik için emptyHealthTest(schema) kullanın. */
export const EMPTY_HEALTH_TEST = buildEmptyHealthTestFromSections(resolveHealthSections(null))

export function emptyHealthTest(schema = null) {
  return buildEmptyHealthTestFromSections(resolveHealthSections(schema))
}

function blankFor(schema) {
  return emptyHealthTest(schema)
}

/** Koşullu detay alanı gösterilsin mi? */
export function isDetailVisible(detail, parentValue) {
  if (!detail) return false
  const when = detail.when
  if (Array.isArray(parentValue)) {
    if (Array.isArray(when)) return when.some((w) => parentValue.includes(w))
    return parentValue.includes(when)
  }
  if (Array.isArray(when)) return when.includes(parentValue)
  return parentValue === when
}

/** Koşullu detay alanı doldurulmuş mu? */
export function isDetailFilled(detail, healthTest) {
  if (!detail) return true
  const val = healthTest?.[detail.key]
  return typeof val === 'string' && val.trim().length > 0
}

/** Soru (ve varsa koşullu detay) geçerli şekilde cevaplanmış mı? */
export function isQuestionFullyAnswered(q, healthTest) {
  if (!q) return false
  const parentVal = healthTest?.[q.key]
  const detailVisible = q.detail && isDetailVisible(q.detail, parentVal)

  if (!q.required) {
    if (!hasStoredAnswer(q, healthTest)) return true
    if (detailVisible) return isDetailFilled(q.detail, healthTest)
    return true
  }

  if (!hasStoredAnswer(q, healthTest)) return false
  if (detailVisible) return isDetailFilled(q.detail, healthTest)
  return true
}

/** AI analizi ve eski kayıtlar için yeni cevapları kanonik değerlere çevirir. */
export function normalizeHealthTestForAnalysis(ht) {
  if (!ht) return {}
  const n = { ...migrateLegacyHealthTestKeys(ht) }

  const wellbeingMap = { very_low: '1', low: '2', medium: '3', good: '4', excellent: '5' }
  if (wellbeingMap[n.wellbeing]) n.wellbeing = wellbeingMap[n.wellbeing]

  if (n.injuries === 'yes_ongoing' || n.injuries === 'yes_recovered') n.injuries = 'yes'

  if (n.medications === 'regular' || n.medications === 'occasional') n.medications = 'yes'
  if (n.medications === 'none') n.medications = 'no'

  const activityMap = { '0': 'sedentary', '1_2': 'light', '3_4': 'moderate', '5_plus': 'active' }
  if (activityMap[n.activityFrequency]) n.activityFrequency = activityMap[n.activityFrequency]

  const sittingMap = { under_4: '<4', '4_6': '4-8', '7_9': '8+', '10_plus': '8+' }
  if (sittingMap[n.sittingHours]) n.sittingHours = sittingMap[n.sittingHours]

  const smokeMap = { never: 'no', daily: 'yes', former: 'quit', occasional: 'yes' }
  if (smokeMap[n.smoking]) n.smoking = smokeMap[n.smoking]

  const alcoholMap = { none: 'never', monthly: 'rarely', weekly: 'regularly', frequent: 'regularly' }
  if (alcoholMap[n.alcohol]) n.alcohol = alcoholMap[n.alcohol]

  if (Array.isArray(n.chronicConditions)) {
    n.chronicConditions = n.chronicConditions.filter((v) => v !== 'none')
    if (n.chronicConditions.includes('heartDisease')) {
      n.chronicConditions = [...new Set([...n.chronicConditions.filter((v) => v !== 'heartDisease'), 'heart'])]
    }
  }

  if (Array.isArray(n.cvRiskFlags)) {
    n.cvRiskFlags = n.cvRiskFlags.filter((v) => v !== 'none')
  }

  // Legacy aliases for older AI helpers
  if (!n.eatingHabits) {
    const habits = []
    if (n.nightOrEmotionalEating === 'night' || n.nightOrEmotionalEating === 'both') habits.push('night_snack')
    if (n.nightOrEmotionalEating === 'emotional' || n.nightOrEmotionalEating === 'both') habits.push('emotional')
    if (n.breakfastHabit === 'no') habits.push('skip_meals')
    if (n.eatOutFrequency === '3_5' || n.eatOutFrequency === '5_plus') habits.push('fast_food')
    if (habits.length) n.eatingHabits = habits
  }

  return n
}

/** @deprecated Paket filtresi kaldırıldı; geriye dönük API için tutuluyor. */
export function getHealthPackageContext() {
  return { hasCoach: true, hasDietitian: true }
}

/** Herkese tüm bölümler. schema: site_content health_test_schema veya null (seed). */
export function getApplicableSections(_gender, _packageConfig = null, schema = null) {
  return resolveHealthSections(schema)
}

export function getApplicableQuestions(gender, packageConfig = null, schema = null) {
  return getApplicableSections(gender, packageConfig, schema).flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIcon: section.icon,
      audience: section.audience || 'shared',
    })),
  )
}

/** Soruda kayıtlı bir cevap var mı? (isteğe bağlı sorular dahil) */
export function hasStoredAnswer(q, healthTest) {
  if (!q) return false
  const val = healthTest?.[q.key]
  if (q.type === 'multi') return Array.isArray(val) && val.length > 0
  if (q.type === 'text' || q.type === 'time') return typeof val === 'string' && val.trim().length > 0
  return val !== '' && val != null
}

export function isQuestionAnswered(q, healthTest) {
  return isQuestionFullyAnswered(q, healthTest)
}

/** Yarım kalan testte soru indeksi ve onay fazını döndürür. Onay yoksa önce ack. */
export function getHealthTestResumeState(healthTest, gender, packageConfig = null, opts = {}) {
  const schema = opts.schema ?? null
  const questions = getApplicableQuestions(gender, packageConfig, schema)
  if (!questions.length) return { questionIndex: 0, phase: 'questions' }

  if (!opts.healthAck || !opts.disclaimer) {
    return { questionIndex: 0, phase: 'ack' }
  }

  const ht = { ...blankFor(schema), ...withMigrated(healthTest) }

  let lastAnsweredIndex = -1
  for (let i = 0; i < questions.length; i++) {
    if (hasStoredAnswer(questions[i], ht)) lastAnsweredIndex = i
  }

  const firstRequiredGap = questions.findIndex((q) => !isQuestionFullyAnswered(q, ht))
  if (firstRequiredGap >= 0) {
    return { questionIndex: firstRequiredGap, phase: 'questions' }
  }

  const allPass = questions.every((q) => isQuestionAnswered(q, ht))
  if (allPass) {
    return { questionIndex: 0, phase: 'questions' }
  }

  const nextIndex = Math.min(lastAnsweredIndex + 1, questions.length - 1)
  return { questionIndex: Math.max(0, nextIndex), phase: 'questions' }
}

export function hasHealthTestProgress(healthTest, gender, packageConfig = null, schema = null) {
  const questions = getApplicableQuestions(gender, packageConfig, schema)
  const ht = { ...blankFor(schema), ...withMigrated(healthTest) }
  return questions.some((q) => hasStoredAnswer(q, ht))
}

export function isSectionComplete(section, healthTest, schema = null) {
  if (!section?.questions?.length) return false
  const ht = { ...blankFor(schema), ...withMigrated(healthTest) }
  const required = section.questions.filter((q) => q.required)

  if (required.length === 0) {
    return section.questions.every((q) => hasStoredAnswer(q, ht) && isQuestionFullyAnswered(q, ht))
  }

  return section.questions.every((q) => isQuestionFullyAnswered(q, ht))
}

export function getSectionQuestions(sectionId, gender, packageConfig = null, schema = null) {
  const section = getApplicableSections(gender, packageConfig, schema).find((s) => s.id === sectionId)
  if (!section) return []
  return section.questions.map((q) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    audience: section.audience || 'shared',
  }))
}

export function getSectionProgress(section, healthTest, schema = null) {
  const ht = { ...blankFor(schema), ...withMigrated(healthTest) }
  const required = section.questions.filter((q) => q.required)
  const tracked = required.length > 0 ? required : section.questions
  const requiredAnswered = tracked.filter((q) => (
    required.length > 0
      ? isQuestionFullyAnswered(q, ht)
      : hasStoredAnswer(q, ht)
  )).length
  const started = section.questions.some((q) => hasStoredAnswer(q, ht)
    || (q.detail && isDetailFilled(q.detail, ht)))
  const complete = isSectionComplete(section, ht, schema)
  return {
    requiredTotal: tracked.length,
    requiredAnswered,
    complete,
    started,
    percent: tracked.length
      ? Math.round((requiredAnswered / tracked.length) * 100)
      : 0,
  }
}

export function getSectionResumeState(section, healthTest, schema = null) {
  const ht = { ...blankFor(schema), ...withMigrated(healthTest) }
  const mapped = section.questions.map((q) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    audience: section.audience || 'shared',
  }))

  const firstRequiredGap = mapped.findIndex((q) => !isQuestionFullyAnswered(q, ht))
  if (firstRequiredGap >= 0) return { questionIndex: firstRequiredGap, phase: 'questions' }

  const allPass = mapped.every((q) => isQuestionAnswered(q, ht))
  if (allPass) return { questionIndex: Math.max(0, mapped.length - 1), phase: 'questions' }

  let lastAnsweredIndex = -1
  for (let i = 0; i < mapped.length; i++) {
    if (hasStoredAnswer(mapped[i], ht)) lastAnsweredIndex = i
  }
  return { questionIndex: Math.max(0, lastAnsweredIndex + 1), phase: 'questions' }
}

export function getHealthTestHubSections(gender, packageConfig = null, healthTest = {}, schema = null) {
  return getApplicableSections(gender, packageConfig, schema).map((section) => ({
    section,
    progress: getSectionProgress(section, healthTest, schema),
  }))
}

export function countCompletedSections(healthTest, gender, packageConfig = null, schema = null) {
  return getApplicableSections(gender, packageConfig, schema).filter((s) => isSectionComplete(s, healthTest, schema)).length
}

export function getOverallHealthTestProgress(healthTest, gender, packageConfig = null, schema = null) {
  const sections = getApplicableSections(gender, packageConfig, schema)
  if (!sections.length) return { completed: 0, total: 0, percent: 0 }
  const completed = countCompletedSections(healthTest, gender, packageConfig, schema)
  return {
    completed,
    total: sections.length,
    percent: Math.round((completed / sections.length) * 100),
  }
}

export function isHealthTestComplete(healthTest, gender, packageConfig = null, schema = null) {
  return getApplicableSections(gender, packageConfig, schema).every((s) => isSectionComplete(s, healthTest, schema))
}

export function describeHealthTest(healthTest, gender, packageConfig = null, schema = null) {
  if (!healthTest) return []
  const migrated = withMigrated(healthTest)
  const allSections = getApplicableSections(gender, packageConfig, schema)
  const sections = allSections.filter((section) =>
    section.questions.some((q) => {
      const v = migrated[q.key]
      if (q.type === 'multi') return Array.isArray(v) && v.length > 0
      return v !== '' && v != null
    }),
  )
  return sections
    .map((section) => {
      const items = []
      section.questions.forEach((q) => {
        const v = migrated[q.key]
        let display
        if (q.type === 'multi') {
          if (!Array.isArray(v) || v.length === 0) return
          display = v.map((val) => q.options.find((o) => o.value === val)?.label || val).join(', ')
        } else if (q.type === 'text' || q.type === 'time') {
          if (!v) return
          display = q.type === 'time' ? v.replace(':', '.') : v
        } else {
          if (v === '' || v == null) return
          display = q.options?.find((o) => o.value === v)?.label || v
        }
        items.push({ label: q.label, value: display })
        if (q.detail && isDetailVisible(q.detail, v) && migrated[q.detail.key]) {
          items.push({ label: 'Açıklama', value: migrated[q.detail.key] })
        }
      })
      return { id: section.id, title: section.title, audience: section.audience || 'shared', items }
    })
    .filter((s) => s.items.length > 0)
}
