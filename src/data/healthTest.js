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

/** Yarım kalan testte soru indeksi ve onay fazını döndürür. */
export function getHealthTestResumeState(healthTest, gender, packageConfig = null, opts = {}) {
  const questions = getApplicableQuestions(gender, packageConfig)
  if (!questions.length) return { questionIndex: 0, phase: 'questions' }

  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }

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
    if (!opts.healthAck || !opts.disclaimer) {
      return { questionIndex: Math.max(0, questions.length - 1), phase: 'ack' }
    }
    return { questionIndex: 0, phase: 'questions' }
  }

  const nextIndex = Math.min(lastAnsweredIndex + 1, questions.length - 1)
  return { questionIndex: Math.max(0, nextIndex), phase: 'questions' }
}

export function hasHealthTestProgress(healthTest, gender, packageConfig = null) {
  const questions = getApplicableQuestions(gender, packageConfig)
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }
  return questions.some((q) => hasStoredAnswer(q, ht))
}

// Bir bölümün tüm soruları (koşullu detaylar dahil) geçerli mi?
export function isSectionComplete(section, healthTest) {
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }
  return section.questions.every((q) => isQuestionFullyAnswered(q, ht))
}

/** Tek bölümün sorularını akış formatında döndürür. */
export function getSectionQuestions(sectionId, gender, packageConfig = null) {
  const section = getApplicableSections(gender, packageConfig).find((s) => s.id === sectionId)
  if (!section) return []
  return section.questions.map((q) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    audience: section.audience || 'shared',
  }))
}

/** Bölüm tamamlanma ilerlemesi. */
export function getSectionProgress(section, healthTest) {
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }
  const required = section.questions.filter((q) => q.required)
  const requiredAnswered = required.filter((q) => isQuestionFullyAnswered(q, ht)).length
  const started = section.questions.some((q) => hasStoredAnswer(q, ht)
    || (q.detail && isDetailFilled(q.detail, ht)))
  const complete = isSectionComplete(section, ht)
  return {
    requiredTotal: required.length,
    requiredAnswered,
    complete,
    started,
    percent: required.length
      ? Math.round((requiredAnswered / required.length) * 100)
      : (complete ? 100 : 0),
  }
}

/** Bölüm içinde kaldığı yerden devam indeksi. */
export function getSectionResumeState(section, healthTest) {
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }
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

/** Hub görünümü — uygulanabilir bölümler + ilerleme. */
export function getHealthTestHubSections(gender, packageConfig = null, healthTest = {}) {
  return getApplicableSections(gender, packageConfig).map((section) => ({
    section,
    progress: getSectionProgress(section, healthTest),
  }))
}

export function countCompletedSections(healthTest, gender, packageConfig = null) {
  return getApplicableSections(gender, packageConfig).filter((s) => isSectionComplete(s, healthTest)).length
}

export function getOverallHealthTestProgress(healthTest, gender, packageConfig = null) {
  const sections = getApplicableSections(gender, packageConfig)
  if (!sections.length) return { completed: 0, total: 0, percent: 0 }
  const completed = countCompletedSections(healthTest, gender, packageConfig)
  return {
    completed,
    total: sections.length,
    percent: Math.round((completed / sections.length) * 100),
  }
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
