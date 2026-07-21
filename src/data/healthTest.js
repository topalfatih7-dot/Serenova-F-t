// Detaylı sağlık testi — tüm bölümler herkese; yalnızca genderOnly (women/men) filtrelenir.
// audience: bölüm kategorisi etiketi (paket kilidi değil) — 'shared' | 'coach' | 'dietitian'

import { HEALTH_SECTIONS } from './healthTestSections'

export { HEALTH_SECTIONS }

export const HEALTH_AUDIENCE_META = {
  shared: { label: 'Genel', chip: 'bg-amber-100 text-amber-800 ring-amber-200', border: 'border-amber-100 bg-amber-50/50' },
  coach: { label: 'Hareket', chip: 'bg-brand-100 text-brand-800 ring-brand-200', border: 'border-brand-100 bg-brand-50/40' },
  dietitian: { label: 'Beslenme', chip: 'bg-sage-100 text-sage-800 ring-sage-200', border: 'border-sage-100 bg-sage-50/40' },
}

function emptyValueForType(type) {
  if (type === 'multi' || type === 'file') return []
  return ''
}

function registerQuestionKeys(obj, q) {
  if (!q?.key) return
  obj[q.key] = emptyValueForType(q.type)
  if (q.detail) obj[q.detail.key] = ''
  ;(q.followUps || []).forEach((fu) => registerQuestionKeys(obj, fu))
}

// Boş test nesnesi (tüm anahtarlar tanımlı olsun ki kontrollü inputlar uyarı vermesin).
export const EMPTY_HEALTH_TEST = (() => {
  const obj = {}
  HEALTH_SECTIONS.forEach((s) => {
    s.questions.forEach((q) => registerQuestionKeys(obj, q))
  })
  return obj
})()

/** Koşullu detay / follow-up gösterilsin mi? */
export function isDetailVisible(detail, parentValue) {
  if (!detail) return false
  const when = detail.when
  if (when == null) return true
  if (Array.isArray(parentValue)) {
    if (Array.isArray(when)) return when.some((w) => parentValue.includes(w))
    return parentValue.includes(when)
  }
  if (Array.isArray(when)) return when.includes(parentValue)
  return parentValue === when
}

export function isFollowUpVisible(followUp, parentValue) {
  return isDetailVisible(followUp, parentValue)
}

/** Koşullu detay alanı doldurulmuş mu? */
export function isDetailFilled(detail, healthTest) {
  if (!detail) return true
  const val = healthTest?.[detail.key]
  return typeof val === 'string' && val.trim().length > 0
}

function isFollowUpFilled(followUp, healthTest) {
  if (!followUp) return true
  return hasStoredAnswer(followUp, healthTest)
    && isQuestionFullyAnswered(followUp, healthTest)
}

/** Soft uyarı mesajı (bloklamaz). */
export function getSoftWarningMessage(q, healthTest) {
  const sw = q?.softWarning
  if (!sw?.message) return null
  const ht = healthTest || {}

  if (typeof sw.when === 'function') {
    return sw.when(ht) ? sw.message : null
  }

  const rules = sw.requireAll || []
  const ok = rules.every((rule) => {
    const val = ht[rule.key]
    if (rule.equals != null) return val === rule.equals
    if (Array.isArray(rule.includes)) {
      if (!Array.isArray(val)) return false
      return rule.includes.some((v) => val.includes(v))
    }
    return false
  })
  return ok ? sw.message : null
}

/** Soru (ve varsa koşullu detay / follow-up) geçerli şekilde cevaplanmış mı? */
export function isQuestionFullyAnswered(q, healthTest) {
  if (!q) return false
  const parentVal = healthTest?.[q.key]
  const detailVisible = q.detail && isDetailVisible(q.detail, parentVal)
  const visibleFollowUps = (q.followUps || []).filter((fu) => isFollowUpVisible(fu, parentVal))

  const dependentsOk = () => {
    if (detailVisible && !isDetailFilled(q.detail, healthTest)) return false
    for (const fu of visibleFollowUps) {
      if (fu.required === false) {
        if (hasStoredAnswer(fu, healthTest) && !isFollowUpFilled(fu, healthTest)) return false
        continue
      }
      if (!isFollowUpFilled(fu, healthTest)) return false
    }
    return true
  }

  if (!q.required) {
    if (!hasStoredAnswer(q, healthTest)) return true
    return dependentsOk()
  }

  if (!hasStoredAnswer(q, healthTest)) return false
  return dependentsOk()
}

/** AI analizi ve eski kayıtlar için yeni cevapları kanonik değerlere çevirir. */
export function normalizeHealthTestForAnalysis(ht) {
  if (!ht) return {}
  const n = { ...ht }

  const wellbeingMap = { very_low: '1', low: '2', medium: '3', good: '4', excellent: '5' }
  if (wellbeingMap[n.wellbeing]) n.wellbeing = wellbeingMap[n.wellbeing]

  if (
    n.injuries === 'yes_ongoing'
    || n.injuries === 'yes_recovered'
    || n.injuries === 'yes_partial'
  ) {
    n.injuries = 'yes'
  }

  if (
    n.medications === 'regular'
    || n.medications === 'occasional'
    || n.medications === 'both'
  ) {
    n.medications = 'yes'
  }
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

  if (Array.isArray(n.familyHistory)) {
    n.familyHistory = n.familyHistory.filter((v) => v !== 'none' && v !== 'unknown')
    if (n.familyHistory.includes('heartDisease')) {
      n.familyHistory = [...new Set([...n.familyHistory.filter((v) => v !== 'heartDisease'), 'heart'])]
    }
  }

  if (n.energy === 'very_high') n.energy = 'high'

  // Eski tek seçimli cevapları çoklu diziye çevir
  for (const key of ['primaryGoalReason', 'biggestBarrier']) {
    if (typeof n[key] === 'string' && n[key]) n[key] = [n[key]]
  }

  return n
}

/** @deprecated Paket artık bölümleri kilitlemez; geriye uyumluluk için boş bağlam. */
export function getHealthPackageContext(_packageConfig = {}) {
  return { hasCoach: true, hasDietitian: true }
}

/** Yalnızca cinsiyet özel bölümleri filtreler (women / men / diet_women). */
function sectionApplies(section, gender) {
  if (section.genderOnly && section.genderOnly !== gender) return false
  return true
}

// Cinsiyete göre uygulanabilir bölümler (paket fark etmez).
export function getApplicableSections(gender, _packageConfig = null) {
  return HEALTH_SECTIONS.filter((s) => sectionApplies(s, gender))
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
  if (q.type === 'multi' || q.type === 'file') {
    if (typeof val === 'string' && val.trim()) return true
    return Array.isArray(val) && val.length > 0
  }
  if (q.type === 'scale') {
    if (val === '' || val == null) return false
    const num = Number(val)
    return Number.isFinite(num)
  }
  if (q.type === 'text' || q.type === 'time') return typeof val === 'string' && val.trim().length > 0
  return val !== '' && val != null
}

export function isQuestionAnswered(q, healthTest) {
  return isQuestionFullyAnswered(q, healthTest)
}

/** Yarım kalan testte soru indeksi ve onay fazını döndürür. Onay yoksa önce ack. */
export function getHealthTestResumeState(healthTest, gender, packageConfig = null, opts = {}) {
  const questions = getApplicableQuestions(gender, packageConfig)
  if (!questions.length) return { questionIndex: 0, phase: 'questions' }

  if (!opts.healthAck || !opts.disclaimer) {
    return { questionIndex: 0, phase: 'ack' }
  }

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
  if (!section?.questions?.length) return false
  const ht = { ...EMPTY_HEALTH_TEST, ...healthTest }
  const required = section.questions.filter((q) => q.required)

  // Zorunlu soru yoksa: bölüm ancak tüm sorular açıkça cevaplanınca tamamlanır.
  // (Aksi halde her opsiyonel soru boşken "tamamlandı" görünür — 0/0 bug.)
  if (required.length === 0) {
    return section.questions.every((q) => hasStoredAnswer(q, ht) && isQuestionFullyAnswered(q, ht))
  }

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
  // Zorunlu yoksa tüm soruları ilerleme paydası yap (0/0 gösterme).
  const tracked = required.length > 0 ? required : section.questions
  const requiredAnswered = tracked.filter((q) => (
    required.length > 0
      ? isQuestionFullyAnswered(q, ht)
      : hasStoredAnswer(q, ht)
  )).length
  const started = section.questions.some((q) => hasStoredAnswer(q, ht)
    || (q.detail && isDetailFilled(q.detail, ht))
    || (q.followUps || []).some((fu) => hasStoredAnswer(fu, ht)))
  const complete = isSectionComplete(section, ht)
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

function formatAnswerDisplay(q, v, healthTest) {
  if (q.type === 'multi') {
    if (!Array.isArray(v) || v.length === 0) return null
    return v.map((val) => q.options?.find((o) => o.value === val)?.label || val).join(', ')
  }
  if (q.type === 'file') {
    if (!Array.isArray(v) || v.length === 0) return null
    return `${v.length} dosya yüklendi`
  }
  if (q.type === 'scale') {
    if (v === '' || v == null) return null
    return `${v} / 10`
  }
  if (q.type === 'text' || q.type === 'time') {
    if (!v) return null
    return q.type === 'time' ? String(v).replace(':', '.') : v
  }
  if (v === '' || v == null) return null
  return q.options?.find((o) => o.value === v)?.label || String(v)
}

// Admin/panel görünümü — cevaplanmış sorular (cinsiyet filtresi + dolu yanıtlar).
export function describeHealthTest(healthTest, gender, _packageConfig = null) {
  if (!healthTest) return []
  const sections = HEALTH_SECTIONS.filter((section) => {
    if (!sectionApplies(section, gender)) return false
    return section.questions.some((q) => {
      const v = healthTest[q.key]
      if (q.type === 'multi' || q.type === 'file') return Array.isArray(v) && v.length > 0
      return v !== '' && v != null
    })
  })
  return sections
    .map((section) => {
      const items = []
      section.questions.forEach((q) => {
        const v = healthTest[q.key]
        const display = formatAnswerDisplay(q, v, healthTest)
        if (display == null) return
        items.push({ label: q.label, value: display })
        if (q.detail && isDetailVisible(q.detail, v) && healthTest[q.detail.key]) {
          items.push({ label: 'Açıklama', value: healthTest[q.detail.key] })
        }
        ;(q.followUps || []).forEach((fu) => {
          if (!isFollowUpVisible(fu, v)) return
          const fuDisplay = formatAnswerDisplay(fu, healthTest[fu.key], healthTest)
          if (fuDisplay == null) return
          items.push({ label: fu.label, value: fuDisplay })
          if (fu.detail && isDetailVisible(fu.detail, healthTest[fu.key]) && healthTest[fu.detail.key]) {
            items.push({ label: 'Açıklama', value: healthTest[fu.detail.key] })
          }
        })
      })
      return { id: section.id, title: section.title, audience: section.audience || 'shared', items }
    })
    .filter((s) => s.items.length > 0)
}

/** Exclusive multi seçenekleri temizler (örn. Yok). */
export function toggleExclusiveMulti(current, value, options = []) {
  const arr = Array.isArray(current)
    ? current
    : (typeof current === 'string' && current ? [current] : [])
  const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value)
  const isExclusive = exclusiveValues.includes(value)

  if (arr.includes(value)) {
    return arr.filter((x) => x !== value)
  }
  if (isExclusive) return [value]
  return [...arr.filter((x) => !exclusiveValues.includes(x)), value]
}

/** Follow-up alanlarını parent görünür değilse temizle. */
export function clearHiddenFollowUps(q, parentValue, patch = {}) {
  const next = { ...patch }
  ;(q.followUps || []).forEach((fu) => {
    if (!isFollowUpVisible(fu, parentValue)) {
      next[fu.key] = emptyValueForType(fu.type)
      if (fu.detail) next[fu.detail.key] = ''
      Object.assign(next, clearHiddenFollowUps(fu, next[fu.key] ?? '', {}))
    }
  })
  if (q.detail && !isDetailVisible(q.detail, parentValue)) {
    next[q.detail.key] = ''
  }
  return next
}
