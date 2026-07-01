// Detaylı sağlık testi — paket (koç/diyetisyen) + cinsiyete göre filtrelenir.
// audience: 'shared' | 'coach' | 'dietitian'

import { packageIncludesCoach, packageIncludesDietitian } from './membershipPlans'
import { HEALTH_SECTIONS } from './healthTestSections'

export { HEALTH_SECTIONS }

export const HEALTH_AUDIENCE_META = {
  shared: { label: 'Genel', chip: 'bg-amber-100 text-amber-800 ring-amber-200', border: 'border-amber-100 bg-amber-50/50' },
  coach: { label: 'Koç', chip: 'bg-brand-100 text-brand-800 ring-brand-200', border: 'border-brand-100 bg-brand-50/40' },
  dietitian: { label: 'Diyetisyen', chip: 'bg-sage-100 text-sage-800 ring-sage-200', border: 'border-sage-100 bg-sage-50/40' },
}

// Boş test nesnesi (tüm anahtarlar tanımlı olsun ki kontrollü inputlar uyarı vermesin).
export const EMPTY_HEALTH_TEST = (() => {
  const obj = {}
  HEALTH_SECTIONS.forEach((s) => {
    s.questions.forEach((q) => {
      obj[q.key] = q.type === 'multi' ? [] : ''
      if (q.detail) obj[q.detail.key] = ''
    })
  })
  return obj
})()

/** Koşullu detay alanı gösterilsin mi? */
export function isDetailVisible(detail, parentValue) {
  if (!detail) return false
  if (Array.isArray(detail.when)) return detail.when.includes(parentValue)
  return parentValue === detail.when
}

/** AI analizi ve eski kayıtlar için yeni cevapları kanonik değerlere çevirir. */
export function normalizeHealthTestForAnalysis(ht) {
  if (!ht) return {}
  const n = { ...ht }

  const wellbeingMap = { very_low: '1', low: '2', medium: '3', good: '4', excellent: '5' }
  if (wellbeingMap[n.wellbeing]) n.wellbeing = wellbeingMap[n.wellbeing]

  if (n.injuries === 'yes_ongoing' || n.injuries === 'yes_recovered') n.injuries = 'yes'

  if (n.medications === 'regular' || n.medications === 'occasional') n.medications = 'yes'
  if (n.medications === 'none') n.medications = 'no'

  const activityMap = { '0': 'sedentary', '1_2': 'light', '3_4': 'moderate', '5_plus': 'active' }
  if (activityMap[n.activityFrequency]) n.activityFrequency = activityMap[n.activityFrequency]

  const sittingMap = { under_4: '<4', '4_6': '4-8', '7_9': '8+', '10_plus': '8+' }
  if (sittingMap[n.sittingHours]) n.sittingHours = sittingMap[n.sittingHours]

  const teaMap = { '0_1': 'low', '2_3': 'moderate', '4_5': 'moderate', '6_plus': 'high' }
  if (teaMap[n.teaCoffee]) n.teaCoffee = teaMap[n.teaCoffee]

  const substanceMap = { no: 'none', yes: 'regular' }
  if (substanceMap[n.substanceUse]) n.substanceUse = substanceMap[n.substanceUse]

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

  if (Array.isArray(n.familyHistory) && n.familyHistory.includes('heartDisease')) {
    n.familyHistory = [...new Set([...n.familyHistory.filter((v) => v !== 'heartDisease'), 'heart'])]
  }

  return n
}

export function getHealthPackageContext(packageConfig = {}) {
  return {
    hasCoach: packageIncludesCoach(packageConfig),
    hasDietitian: packageIncludesDietitian(packageConfig),
  }
}

function sectionApplies(section, gender, ctx) {
  if (section.genderOnly && section.genderOnly !== gender) return false
  const aud = section.audience || 'shared'
  if (aud === 'shared') return true
  if (aud === 'coach') return ctx.hasCoach
  if (aud === 'dietitian') return ctx.hasDietitian
  return true
}

// Cinsiyet + pakete göre uygulanabilir bölümler.
export function getApplicableSections(gender, packageConfig = null) {
  const ctx = getHealthPackageContext(packageConfig || {})
  return HEALTH_SECTIONS.filter((s) => sectionApplies(s, gender, ctx))
}

// Tüm soruları düz liste olarak döndürür (kayıt akışında soru-soru gösterim için).
export function getApplicableQuestions(gender, packageConfig = null) {
  return getApplicableSections(gender, packageConfig).flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIcon: section.icon,
      audience: section.audience || 'shared',
    })),
  )
}

export function isQuestionAnswered(q, healthTest) {
  if (!q) return false
  const val = healthTest?.[q.key]
  if (q.type === 'multi') {
    if (!q.required) return true
    return Array.isArray(val) && val.length > 0
  }
  if (q.type === 'text') {
    if (!q.required) return true
    return typeof val === 'string' && val.trim().length > 0
  }
  if (q.type === 'time') {
    if (!q.required) return true
    return typeof val === 'string' && val.trim().length > 0
  }
  if (!q.required) return true
  return val !== '' && val != null
}

// Bir bölümün zorunlu soruları cevaplanmış mı?
export function isSectionComplete(section, healthTest) {
  return section.questions.every((q) => {
    if (!q.required) return true
    const val = healthTest?.[q.key]
    if (q.type === 'multi') return Array.isArray(val) && val.length > 0
    return val !== '' && val != null
  })
}

// Tüm zorunlu sorular cevaplanmış mı? (cinsiyet + paket)
export function isHealthTestComplete(healthTest, gender, packageConfig = null) {
  return getApplicableSections(gender, packageConfig).every((s) => isSectionComplete(s, healthTest))
}

// Admin/panel görünümü — cevaplanmış sorular; pakette olmayan bölümler de yanıt varsa gösterilir.
export function describeHealthTest(healthTest, gender, packageConfig = null) {
  if (!healthTest) return []
  const ctx = getHealthPackageContext(packageConfig || {})
  const sections = HEALTH_SECTIONS.filter((section) => {
    if (section.genderOnly && section.genderOnly !== gender) return false
    if (sectionApplies(section, gender, ctx)) return true
    return section.questions.some((q) => {
      const v = healthTest[q.key]
      if (q.type === 'multi') return Array.isArray(v) && v.length > 0
      return v !== '' && v != null
    })
  })
  return sections
    .map((section) => {
      const items = []
      section.questions.forEach((q) => {
        const v = healthTest[q.key]
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
        if (q.detail && isDetailVisible(q.detail, v) && healthTest[q.detail.key]) {
          items.push({ label: 'Açıklama', value: healthTest[q.detail.key] })
        }
      })
      return { id: section.id, title: section.title, audience: section.audience || 'shared', items }
    })
    .filter((s) => s.items.length > 0)
}
