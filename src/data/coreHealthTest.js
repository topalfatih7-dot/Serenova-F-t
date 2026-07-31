/**
 * Çekirdek "Genel Sağlık Testi" — kategori göstermeden sorulan sabit soru seti.
 * Erkek: 25, Kadın: 26 soru. Kendi required bayrakları değiştirilmez;
 * bu akışta hepsi zorunlu sayılır.
 */

import { HEALTH_SECTIONS } from './healthTestSections'
import {
  hasStoredAnswer,
  isDetailFilled,
  isDetailVisible,
  isFollowUpVisible,
} from './healthTest'

/** Serbest metin "İsteğe bağlı" alanları — 2. analiz katı tamamlanmasından muaf. */
export const OPTIONAL_TEXT_EXEMPT_KEYS = new Set([
  'nutritionExtraNotes',
  'movementExtraNotes',
  'lifestyleExtraNotes',
  'womenExtraNotes',
  'menExtraNotes',
  'currentComplaints',
])

/** Bölüm sırasına göre çekirdek soru anahtarları (cinsiyet özel ayrı). */
export const CORE_HEALTH_TEST_KEYS = [
  // Genel Sağlık 1,3,10,12
  'wellbeing',
  'energy',
  'primaryGoalReason',
  'motivation',
  // Tıbbi Geçmiş 1,2,6,10
  'chronicConditions',
  'medications',
  'lastBloodWork',
  'doctorClearance',
  // Beslenme 6,13,15,16,20,27,28
  'nutritionMainMeals',
  'nutritionWaterIntake',
  'nutritionMealPreparer',
  'nutritionFastFood',
  'nutritionSweets',
  'nutritionBiggestChallenge',
  'nutritionSelfRating',
  // Hareket 3,11,15,19,20,23
  'sittingHours',
  'painAreas',
  'pastRegularExercise',
  'exerciseWillingness',
  'trainingLocation',
  'exerciseExpectations',
  // Günlük Yaşam 1,6,7
  'sleepHours',
  'smoking',
  'alcohol',
]

export const CORE_GENDER_KEYS = {
  male: ['testosteroneConcerns'],
  female: ['pregnancy', 'breastfeeding'],
}

const QUESTION_BY_KEY = (() => {
  const map = new Map()
  for (const section of HEALTH_SECTIONS) {
    for (const q of section.questions || []) {
      if (q?.key) {
        map.set(q.key, {
          question: q,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIcon: section.icon,
          audience: section.audience || 'shared',
        })
      }
    }
  }
  return map
})()

export function getCoreHealthTestKeys(gender) {
  const genderKeys = CORE_GENDER_KEYS[gender] || []
  return [...CORE_HEALTH_TEST_KEYS, ...genderKeys]
}

export function getCoreHealthTestKeySet(gender) {
  return new Set(getCoreHealthTestKeys(gender))
}

/**
 * Çekirdek soruları sırayla döndürür (HEALTH_SECTIONS'tan tam nesne).
 * required bayrağını değiştirmez; akış tarafı zorunlu sayar.
 */
export function getCoreHealthTestQuestions(gender) {
  return getCoreHealthTestKeys(gender)
    .map((key) => {
      const entry = QUESTION_BY_KEY.get(key)
      if (!entry) return null
      return {
        ...entry.question,
        sectionId: entry.sectionId,
        sectionTitle: entry.sectionTitle,
        sectionIcon: entry.sectionIcon,
        audience: entry.audience,
        /** Çekirdek akışta zorunlu (orijinal required korunur, bu bayrak eklenir). */
        coreRequired: true,
      }
    })
    .filter(Boolean)
}

/** Çekirdek bağlamında soru + görünür detay/follow-up dolu mu? (required bayrağından bağımsız) */
export function isCoreQuestionAnswered(q, healthTest) {
  if (!q) return false
  const ht = healthTest || {}
  const parentVal = ht[q.key]
  if (!hasStoredAnswer(q, ht)) return false

  if (q.detail && isDetailVisible(q.detail, parentVal) && !isDetailFilled(q.detail, ht)) {
    return false
  }

  for (const fu of q.followUps || []) {
    if (!isFollowUpVisible(fu, parentVal)) continue
    if (fu.required === false) {
      if (hasStoredAnswer(fu, ht) && !isCoreQuestionAnswered(fu, ht)) return false
      continue
    }
    if (!isCoreQuestionAnswered(fu, ht)) return false
  }
  return true
}

export function isCoreHealthTestComplete(healthTest, gender) {
  const questions = getCoreHealthTestQuestions(gender)
  if (!questions.length) return false
  const ht = healthTest || {}
  return questions.every((q) => isCoreQuestionAnswered(q, ht))
}

export function getCoreHealthTestProgress(healthTest, gender) {
  const questions = getCoreHealthTestQuestions(gender)
  const ht = healthTest || {}
  const answered = questions.filter((q) => isCoreQuestionAnswered(q, ht)).length
  const total = questions.length
  return {
    answered,
    total,
    percent: total ? Math.round((answered / total) * 100) : 0,
    complete: total > 0 && answered === total,
    started: questions.some((q) => hasStoredAnswer(q, ht)),
  }
}

export function getCoreHealthTestResumeIndex(healthTest, gender) {
  const questions = getCoreHealthTestQuestions(gender)
  const ht = healthTest || {}
  const gap = questions.findIndex((q) => !isCoreQuestionAnswered(q, ht))
  if (gap >= 0) return gap
  return Math.max(0, questions.length - 1)
}
