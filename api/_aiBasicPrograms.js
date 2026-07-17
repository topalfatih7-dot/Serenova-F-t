/**
 * Basic paket AI diyet + antrenman programı — sunucu yardımcıları.
 * joinedAt’ten 14 gün; availability yoksa her gün, varsa yalnızca uygun günler.
 */

export const AI_BASIC_SOURCE = 'ai_basic'
export const CYCLE_LENGTH = 14
export const STAFF_NAME = 'Yeni Form'

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
    const slice = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
  }
  return null
}

function parseLocalDate(str) {
  const s = toDateStr(str)
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function addDaysLocal(date, days) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

/** joinedAt + 13 gün < bugün → pencere kapalı */
export function isBasicProgramWindowOpen(joinedAt, today = new Date()) {
  const start = parseLocalDate(joinedAt)
  if (!start) return false
  const end = addDaysLocal(start, CYCLE_LENGTH - 1)
  const todayStart = startOfLocalDay(today)
  return end >= todayStart
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

export function eachDateInCycle(startStr, length = CYCLE_LENGTH) {
  const start = parseLocalDate(startStr)
  if (!start) return []
  const out = []
  for (let i = 0; i < length; i++) out.push(addDaysLocal(start, i))
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

export function buildHealthTestSummary(healthTest = {}, maxLen = 2800) {
  if (!healthTest || typeof healthTest !== 'object') return ''
  const lines = Object.entries(healthTest)
    .filter(([, v]) => {
      if (v == null || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      return true
    })
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
  let out = lines.join('\n')
  if (out.length > maxLen) out = out.slice(0, maxLen)
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

function mealDisplayText(e) {
  return `14 gün boyunca her gün ${e.start || ''} ${e.mealType}: ${e.name}${e.note ? ` (${e.note})` : ''}`
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
 * Gemini çıktısını doğrula; kütüphaneden hydrate et; program data payload’ları üret.
 */
export function buildValidatedProgramPayloads({
  aiJson,
  exercisesById,
  candidateIds,
  memberName,
  cycleStartDate,
  availability,
  dailyCalories,
}) {
  const cal = dailyCalories?.recommended || dailyCalories?.maintenance || null
  const calLine = cal
    ? `Hedef ~${cal} kcal/gün (${dailyCalories?.goal || 'Form koruma'}).`
    : ''

  const workoutRaw = aiJson?.workout || {}
  const nutritionRaw = aiJson?.nutrition || {}

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
    eachDateInCycle(cycleStartDate).forEach((d) => {
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

  const endDate = addDaysLocal(parseLocalDate(cycleStartDate), CYCLE_LENGTH - 1)
  const endStr = toDateStr(endDate)
  const workoutTitle = String(workoutRaw.title || '').trim()
    || `${memberName} — 14 Günlük Antrenman`
  const workoutDesc = [
    String(workoutRaw.description || '').trim(),
    DISCLAIMER,
  ].filter(Boolean).join(' ')

  const workoutPayload = {
    type: 'workout',
    memberName: memberName || '',
    staffName: STAFF_NAME,
    title: workoutTitle.slice(0, 120),
    description: workoutDesc.slice(0, 800),
    sessionDuration,
    scheduleType: 'cycle14',
    cycleStartDate,
    cycleLength: CYCLE_LENGTH,
    cycleLoop: false,
    cycleSameDaily,
    entries: workoutEntries,
    items: (cycleSameDaily ? baseEntries : workoutEntries.slice(0, baseEntries.length)).map(entryDisplayText),
    source: AI_BASIC_SOURCE,
  }

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
    || `${memberName} — 14 Günlük Beslenme Listesi`
  const nutritionDesc = [
    calLine,
    String(nutritionRaw.description || '').trim(),
    DISCLAIMER,
  ].filter(Boolean).join(' ')

  const nutritionPayload = {
    type: 'nutrition',
    memberName: memberName || '',
    staffName: STAFF_NAME,
    title: nutritionTitle.slice(0, 120),
    description: nutritionDesc.slice(0, 800),
    scheduleType: 'cycle14',
    cycleStartDate,
    cycleLength: CYCLE_LENGTH,
    cycleLoop: false,
    cycleSameDaily: true,
    entries: nutritionEntries,
    items: nutritionEntries.map(mealDisplayText),
    source: AI_BASIC_SOURCE,
  }

  return { workoutPayload, nutritionPayload, endStr, dailyCalories: dailyCalories || null }
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
