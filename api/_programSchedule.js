/**
 * Sunucu tarafı program takvimi — src/utils/programSchedule.js'in habit
 * hatırlatma cron'u için gereken çekirdeği. Bağımsız (date-fns yok) ve
 * bundle-güvenli. Türkiye 2016'dan beri kalıcı UTC+3 (DST yok) → tek offset.
 *
 * Paket kapsamı (isProgramVisibleOnDate) SUNUCUDA UYGULANMAZ: aktif ücretli
 * üyeye atanmış program zaten paket penceresindedir; kenar durumda en fazla
 * fazladan bir hatırlatma olur (yanlış içerik değil).
 */

export const ISTANBUL_OFFSET_MIN = 180 // UTC+3
export const CYCLE_PLAN_LENGTH = 14

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Kahvaltı', short: 'Kahvaltı' },
  { id: 'snack_morning', label: 'Sabah–Öğle Arası Ara Öğün', short: 'Sabah ara öğün' },
  { id: 'lunch', label: 'Öğle Yemeği', short: 'Öğle yemeği' },
  { id: 'snack_afternoon', label: 'Öğle–Akşam Arası Ara Öğün', short: 'İkindi ara öğün' },
  { id: 'dinner', label: 'Akşam Yemeği', short: 'Akşam yemeği' },
  { id: 'snack_evening', label: 'Akşam Sonrası Ara Öğün', short: 'Gece ara öğün' },
  { id: 'note', label: 'Dikkat / Not', short: 'Not' },
]

const MEAL_ORDER = MEAL_TYPES.map((m) => m.id)

export function normalizeMealType(mealType) {
  if (mealType === 'snack') return 'snack_morning'
  return mealType || 'note'
}

export function mealShortLabel(mealType) {
  const row = MEAL_TYPES.find((m) => m.id === normalizeMealType(mealType))
  return row?.short || row?.label || 'Öğün'
}

/** "HH:MM" → { hour, minute } (geçersizse null). */
export function parseStartHM(start) {
  const m = String(start || '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

// ── Takvim yardımcıları (UTC gece yarısı = takvim günü; tz-bağımsız) ──
function calDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`)
}
export function weekdayOf(dateStr) {
  return calDate(dateStr).getUTCDay() // 0=Pazar … 6=Cumartesi
}
function dayDiff(aStr, bStr) {
  return Math.round((calDate(aStr).getTime() - calDate(bStr).getTime()) / 86400000)
}
function startDateStr(program) {
  const raw = program.cycleStartDate || (program.createdAt ? String(program.createdAt).slice(0, 10) : null)
  return raw ? String(raw).slice(0, 10) : null
}

// ── Program tipi tespiti (web parity) ──
export function isFixedDurationPlan(program) {
  if (!program) return false
  return program.scheduleType === 'cycle14'
    || program.scheduleType === 'dateRange'
    || program.scheduleType === 'weekly'
    || Boolean(program.cycleStartDate && program.cycleLength)
}

export function usesLegacyCycleDayRotation(program) {
  if (!program) return false
  if (program.scheduleType === 'weekly') return false
  if (program.cycleSameDaily === true) return false
  const entries = program.entries || []
  const hasDayTagged = entries.some((e) => e.day != null && e.day !== '')
  const hasCycleDay = entries.some((e) => e.cycleDay != null && e.cycleDay !== '')
  if (hasDayTagged && !hasCycleDay) return false
  if (program.cycleSameDaily === false && hasCycleDay) return true
  const days = new Set(
    entries.filter((e) => e.cycleDay != null && e.cycleDay !== '').map((e) => Number(e.cycleDay)),
  )
  return days.size > 1
}

export function isDateWithinProgramDuration(dateStr, program) {
  if (!isFixedDurationPlan(program)) return true
  const start = startDateStr(program)
  if (!start) return true
  const diff = dayDiff(dateStr, start)
  if (diff < 0) return false
  const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
  if (program.cycleLoop === true) return true
  return diff < len
}

export function resolveCycleDayIndex(dateStr, program) {
  const start = startDateStr(program)
  if (!start) return null
  const diff = dayDiff(dateStr, start)
  if (diff < 0) return null
  const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
  if (program.cycleLoop !== true && diff >= len) return null
  return ((diff % len) + len) % len
}

export function entryMatchesDate(entry, dateStr, program = null) {
  if (!entry || !dateStr) return false
  if (entry.date) return String(entry.date).slice(0, 10) === dateStr

  const fixedDuration = program && isFixedDurationPlan(program)
  const legacyRotate = program && usesLegacyCycleDayRotation(program)

  if (legacyRotate && entry.cycleDay != null && entry.cycleDay !== '') {
    const idx = resolveCycleDayIndex(dateStr, program)
    if (idx == null) return false
    return Number(entry.cycleDay) === idx
  }

  if (fixedDuration && !isDateWithinProgramDuration(dateStr, program)) return false

  if (entry.everyday === true) return true

  if (entry.day != null && entry.day !== '') {
    return Number(entry.day) === weekdayOf(dateStr)
  }

  if (fixedDuration && !legacyRotate) {
    return entry.cycleDay == null || entry.cycleDay === ''
  }

  return false
}

// ── Antrenman müsaitlik günü (memberAvailability parity) ──
export function getWorkoutWeekdays(availability = {}) {
  return Object.entries(availability || {})
    .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
    .map(([day]) => Number(day))
    .filter((d) => !Number.isNaN(d))
}
export function isWorkoutAllowedOnDate(dateStr, availability) {
  const days = getWorkoutWeekdays(availability)
  if (!days.length) return false
  return days.includes(weekdayOf(dateStr))
}

/**
 * Bir takvim günü (dateStr) için görünür program girdileri.
 * member.availability varsa koç workout'ları müsait günlere sınırlanır.
 */
export function getProgramEntriesForDate(programs, dateStr, member = null) {
  const result = []
  ;(programs || []).forEach((prog) => {
    if (!prog) return
    if (prog.source === 'library_catalog' || prog.fullLibraryAccess === true) return
    if (!prog.entries?.length) return
    const programType = prog.type || (prog.entries.some((e) => e.mealType) ? 'nutrition' : 'workout')
    const isCoachedWorkout = Boolean(prog.staffId)
    const hasAvailDays = Boolean(
      member?.availability
      && Object.values(member.availability).some((h) => Array.isArray(h) && h.length > 0),
    )
    if (
      member
      && programType === 'workout'
      && isCoachedWorkout
      && hasAvailDays
      && !isWorkoutAllowedOnDate(dateStr, member.availability)
    ) {
      return
    }
    prog.entries.forEach((entry) => {
      if (entryMatchesDate(entry, dateStr, prog)) {
        const entryType = prog.type || (entry.mealType ? 'nutrition' : 'workout')
        result.push({
          ...entry,
          programId: prog.id,
          programTitle: prog.title,
          programType: entryType,
        })
      }
    })
  })
  return result.sort((a, b) => {
    const mo = MEAL_ORDER.indexOf(normalizeMealType(a.mealType)) - MEAL_ORDER.indexOf(normalizeMealType(b.mealType))
    if (mo !== 0) return mo
    return String(a.start || '').localeCompare(String(b.start || ''))
  })
}

export function splitEntriesByType(entries) {
  return {
    workout: (entries || []).filter((e) => e.programType === 'workout' && !e.mealType),
    nutrition: (entries || []).filter((e) => e.programType === 'nutrition' || e.mealType),
  }
}

export function groupEntriesByMeal(entries) {
  const map = new Map()
  ;(entries || []).forEach((entry) => {
    const mt = normalizeMealType(entry.mealType)
    if (!map.has(mt)) map.set(mt, [])
    map.get(mt).push(entry)
  })
  const groups = []
  MEAL_TYPES.forEach((m) => {
    if (map.has(m.id)) groups.push({ mealType: m.id, label: m.label, entries: map.get(m.id) })
  })
  return groups
}

export function completionKey(dateStr, entryId) {
  return `${dateStr}_${entryId}`
}
export function mealCompletionKey(dateStr, mealType) {
  return `${dateStr}_meal_${mealType}`
}
export function isMealCompleted(completedActivities, dateStr, mealType, mealEntries) {
  const keys = completedActivities?.[dateStr] || []
  if (keys.includes(mealCompletionKey(dateStr, mealType))) return true
  if (!mealEntries?.length) return false
  return mealEntries.every((e) => e.id && keys.includes(completionKey(dateStr, e.id)))
}

// ── İstanbul saat yardımcıları (UTC+3 sabit) ──
/** UTC anını İstanbul bileşenlerine çevir. */
export function istanbulParts(now = new Date()) {
  const shifted = new Date(now.getTime() + ISTANBUL_OFFSET_MIN * 60000)
  const y = shifted.getUTCFullYear()
  const m = shifted.getUTCMonth() + 1
  const d = shifted.getUTCDate()
  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return {
    dateStr,
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  }
}

/** İstanbul yerel (dateStr HH:MM) → mutlak UTC ms. */
export function istanbulLocalToUtcMs(dateStr, hour, minute) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d, hour, minute) - ISTANBUL_OFFSET_MIN * 60000
}
