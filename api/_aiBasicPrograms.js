/**
 * Basic + Eko AI program yardımcıları (sunucu).
 * Basic süre: bugün → freeTrialExpiresAt (48s deneme).
 */

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

export function estimateDailyCalories(profile = {}) {
  const w = parseFloat(profile.weight) || 70
  const h = parseFloat(profile.height) || 170
  const a = parseFloat(profile.age) || 30
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
  if (goals.some((g) => g === 'weight' || g === 'fatburn')) {
    return { maintenance: total, recommended: total - 300, goal: 'Kilo verme' }
  }
  if (goals.some((g) => g === 'muscle' || g === 'tone')) {
    return { maintenance: total, recommended: total + 200, goal: 'Kas kazanımı' }
  }
  return { maintenance: total, recommended: total, goal: 'Form koruma' }
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
    : ['habit']

  return {
    ...memberData,
    weight,
    height,
    age: Math.round(age),
    fitnessLevel,
    goals,
    nutritionPrefs: memberData.nutritionPrefs || [],
    gender: memberData.gender || '',
  }
}

export function buildHealthTestSummary(healthTest = {}, maxLen = 6000) {
  if (!healthTest || typeof healthTest !== 'object') return ''
  const lines = Object.entries(healthTest)
    .filter(([k, v]) => {
      if (k === 'bloodWorkFiles') return false
      if (v == null || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'object') return false
      return true
    })
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
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

/**
 * AI program JSON çıktısını doğrula; kütüphaneden hydrate et; program data payload’ları üret.
 */
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
    const sessionDuration = Math.min(90, Math.max(20, Number(workoutRaw.sessionDuration) || 30))
    const sessionStart = /^\d{2}:\d{2}$/.test(String(workoutRaw.sessionStart || ''))
      ? workoutRaw.sessionStart
      : '09:00'
    const sessionEnd = addMinutesToTime(sessionStart, sessionDuration)

    let exerciseSpecs = (Array.isArray(workoutRaw.exercises) ? workoutRaw.exercises : [])
      .map((e) => ({
        exerciseId: String(e.exerciseId || e.id || '').trim(),
        amountType: e.amountType === 'duration' ? 'duration' : 'reps',
        amount: Math.min(120, Math.max(1, Number(e.amount) || (e.amountType === 'duration' ? 30 : 12))),
        durationUnit: e.durationUnit === 'dk' ? 'dk' : 'sn',
        note: String(e.note || '').slice(0, 120),
      }))
      .filter((e) => e.exerciseId && (candidateIds.has(e.exerciseId) || exercisesById[e.exerciseId]))

    if (exerciseSpecs.length < 4) {
      const fallbackIds = [...candidateIds].slice(0, 6)
      const have = new Set(exerciseSpecs.map((e) => e.exerciseId))
      for (const id of fallbackIds) {
        if (have.has(id)) continue
        exerciseSpecs.push({
          exerciseId: id,
          amountType: 'reps',
          amount: 12,
          durationUnit: 'sn',
          note: '',
        })
        if (exerciseSpecs.length >= 6) break
      }
    }
    exerciseSpecs = exerciseSpecs.slice(0, 10)

    const baseEntries = exerciseSpecs.map((spec, i) => {
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
        start: sessionStart,
        end: sessionEnd,
        order: i,
      }
    }).filter(Boolean)

    if (baseEntries.length < 4) {
      throw new Error('Geçerli kütüphane hareketi yetersiz')
    }

    const hasAvail = memberHasWorkoutAvailability(availability)
    let workoutEntries
    let cycleSameDaily

    if (hasAvail) {
      cycleSameDaily = false
      workoutEntries = []
      eachDateInCycle(cycleStartDate, len).forEach((d) => {
        if (!isWorkoutAllowedOnDate(d, availability)) return
        const dateStr = toDateStr(d)
        baseEntries.forEach((base, i) => {
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

    const workoutTitle = String(workoutRaw.title || '').trim()
      || `${memberName} — ${len} Günlük Antrenman`
    const workoutDesc = [
      String(workoutRaw.description || '').trim(),
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
    }
  }

  if (buildNutrition) {
    const mealByType = new Map()
    ;(Array.isArray(nutritionRaw.meals) ? nutritionRaw.meals : []).forEach((m) => {
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
      breakfast: 'Yulaf ezmesi, 1 yumurta, domates-salatalık, bitki çayı',
      lunch: 'Izgara tavuk veya mercimek, salata, tam buğday ekmek',
      dinner: 'Sebzeli ızgara balık veya yoğurtlu sebze yemeği, salata',
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

    const nutritionEntries = MEAL_TYPE_IDS
      .filter((id) => id !== 'note' && mealByType.has(id))
      .map((id) => {
        const m = mealByType.get(id)
        return {
          id: uid('n'),
          mealType: m.mealType,
          name: m.name,
          note: m.note,
          start: m.start,
        }
      })

    const nutritionTitle = String(nutritionRaw.title || '').trim()
      || `${memberName} — ${len} Günlük Beslenme Listesi`
    const nutritionDesc = [
      calLine,
      previousDietSummary ? 'Önceki liste dikkate alındı.' : '',
      String(nutritionRaw.description || '').trim(),
      DISCLAIMER,
    ].filter(Boolean).join(' ')

    nutritionPayload = {
      type: 'nutrition',
      memberName: memberName || '',
      staffName: STAFF_NAME,
      title: nutritionTitle.slice(0, 120),
      description: nutritionDesc.slice(0, 800),
      scheduleType: 'dateRange',
      cycleStartDate,
      cycleLength: len,
      cycleLoop: false,
      cycleSameDaily: true,
      entries: nutritionEntries,
      items: nutritionEntries.map((e) => mealDisplayText(e, len)),
      source,
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
  return {
    member_id: memberId,
    staff_id: null,
    data: {
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
    },
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
