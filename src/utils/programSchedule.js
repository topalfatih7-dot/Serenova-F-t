import { format, getDay, parseISO, isValid, differenceInCalendarDays, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { isProgramVisibleOnDate } from './programPackageScope'
import { isWorkoutAllowedOnDate } from './memberAvailability'

export const CYCLE_PLAN_LENGTH = 14

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Kahvaltı', short: 'Kahvaltı' },
  { id: 'snack_morning', label: 'Sabah–Öğle Arası Ara Öğün', short: 'Sabah Ara' },
  { id: 'lunch', label: 'Öğle Yemeği', short: 'Öğle' },
  { id: 'snack_afternoon', label: 'Öğle–Akşam Arası Ara Öğün', short: 'Öğle Ara' },
  { id: 'dinner', label: 'Akşam Yemeği', short: 'Akşam' },
  { id: 'snack_evening', label: 'Akşam Sonrası Ara Öğün', short: 'Gece Ara' },
  { id: 'note', label: 'Dikkat / Not', short: 'Not' },
]

/** Eski kayıtlar için snack → sabah ara öğün */
export function normalizeMealType(mealType) {
  if (mealType === 'snack') return 'snack_morning'
  return mealType || 'note'
}

export const mealLabel = (id) => {
  const normalized = normalizeMealType(id)
  return MEAL_TYPES.find((m) => m.id === normalized)?.label || id || ''
}

/** Öğün grubunun birleşik içerik metni */
export function mealContentText(entries = []) {
  if (!entries.length) return ''
  const parts = entries.map((e) => e.name || e.exerciseName).filter(Boolean)
  return parts.join(', ')
}

/** Sabit süreli plan (başlangıç + süre). Haftalık şablon ve 14 günlük planlar dahil. */
export function isFixedDurationPlan(program) {
  if (!program) return false
  return program.scheduleType === 'cycle14'
    || program.scheduleType === 'dateRange'
    || program.scheduleType === 'weekly'
    || Boolean(program.cycleStartDate && program.cycleLength)
}

/** 14 günlük plan: her gün aynı menü (varsayılan / eski kayıtlar). */
export function isCycle14SameDaily(program) {
  if (!program || program.scheduleType !== 'cycle14') return false
  if (usesLegacyCycleDayRotation(program)) return false
  return program.cycleSameDaily !== false
}

/** 14 günlük plan: haftanın gününe göre şablon (her Pzt aynı, her Salı aynı…). */
export function isCycle14ByWeekday(program) {
  if (!program || program.scheduleType !== 'cycle14') return false
  if (usesLegacyCycleDayRotation(program)) return false
  return program.cycleSameDaily === false
}

/** Eski model: her gün farklı menü (cycleDay 0–13). Haftalık entry.day şablonu legacy değildir. */
export function usesLegacyCycleDayRotation(program) {
  if (!program) return false
  if (program.scheduleType === 'weekly') return false
  if (program.cycleSameDaily === true) return false
  // Haftanın günü şablonu (entry.day) legacy cycleDay rotasyonu değildir
  const hasDayTagged = (program.entries || []).some((e) => e.day != null && e.day !== '')
  const hasCycleDay = (program.entries || []).some((e) => e.cycleDay != null && e.cycleDay !== '')
  if (hasDayTagged && !hasCycleDay) {
    return false
  }
  // cycleSameDaily:false + cycleDay → eski 14 slot rotasyonu
  if (program.cycleSameDaily === false && hasCycleDay) return true
  const days = new Set(
    (program.entries || [])
      .filter((e) => e.cycleDay != null && e.cycleDay !== '')
      .map((e) => Number(e.cycleDay)),
  )
  return days.size > 1
}

/** Tarih, programın sabit süresi içinde mi? (14 gün boyunca her gün aynı menü) */
export function isDateWithinProgramDuration(date, program) {
  if (!isFixedDurationPlan(program)) return true
  const startRaw = program.cycleStartDate || program.createdAt?.slice?.(0, 10)
  if (!startRaw) return true
  const start = startOfDay(parseISO(startRaw))
  const target = startOfDay(date)
  if (!isValid(start) || !isValid(target)) return false
  const diff = differenceInCalendarDays(target, start)
  if (diff < 0) return false
  const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
  if (program.cycleLoop === true) return true
  return diff < len
}

/** 14 günlük planda tekrarlayan günlük öğünleri tekilleştirir (görüntüleme). */
export function dedupeDailyNutritionEntries(entries = []) {
  const seen = new Set()
  const out = []
  entries.forEach((e) => {
    const key = `${normalizeMealType(e.mealType)}:${e.start || ''}:${e.name || e.exerciseName || ''}:${e.note || ''}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(e)
  })
  return out.sort((a, b) => {
    const ai = MEAL_TYPES.findIndex((m) => m.id === normalizeMealType(a.mealType))
    const bi = MEAL_TYPES.findIndex((m) => m.id === normalizeMealType(b.mealType))
    if (ai !== bi) return ai - bi
    return (a.start || '').localeCompare(b.start || '')
  })
}

/** Eski döngü modeli: takvim gününün indeksi (0–13). */
export function resolveCycleDayIndex(date, program) {
  if (!date || !program) return null
  const startRaw = program.cycleStartDate || program.createdAt?.slice?.(0, 10)
  if (!startRaw) return null
  const start = startOfDay(parseISO(startRaw))
  const target = startOfDay(date)
  if (!isValid(start) || !isValid(target)) return null
  const diff = differenceInCalendarDays(target, start)
  if (diff < 0) return null
  const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
  const shouldLoop = program.cycleLoop === true
  if (!shouldLoop && diff >= len) return null
  return diff % len
}

/** Program 14 günlük sabit süreli plan mı? */
export function isCycle14Program(program) {
  return isFixedDurationPlan(program)
}

/** Girdi belirli bir takvim gününe mi ait? */
export function entryMatchesDate(entry, date, program = null) {
  if (!entry || !date) return false
  const dateStr = format(date, 'yyyy-MM-dd')
  if (entry.date) return entry.date === dateStr

  const fixedDuration = program && isFixedDurationPlan(program)
  const legacyRotate = program && usesLegacyCycleDayRotation(program)

  // Eski model: 14 farklı günlük menü (cycleDay ile)
  if (legacyRotate && entry.cycleDay != null && entry.cycleDay !== '') {
    const idx = resolveCycleDayIndex(date, program)
    if (idx == null) return false
    return Number(entry.cycleDay) === idx
  }

  if (fixedDuration && !isDateWithinProgramDuration(date, program)) return false

  if (entry.everyday === true) return true

  if (entry.day != null && entry.day !== '') {
    return Number(entry.day) === getDay(date)
  }

  // Yeni 14 günlük plan: süre içinde, günlük tekrarlayan öğünler (cycleDay yok)
  if (fixedDuration && !legacyRotate) {
    return entry.cycleDay == null || entry.cycleDay === ''
  }

  return false
}

export function getProgramEntriesForDate(programs, date, member = null) {
  const result = []
  ;(programs || []).forEach((prog) => {
    if (!prog.entries?.length) return
    if (member && !isProgramVisibleOnDate(prog, date, member)) return
    const programType = prog.type || (prog.entries.some((e) => e.mealType) ? 'nutrition' : 'workout')
    // Koç (staffId) workout’larında müsaitlik günü filtresi.
    // availability boşsa filtre uygulanmaz (tarihli entry’ler veya cycleSameDaily akışı kalır).
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
      && !isWorkoutAllowedOnDate(date, member.availability)
    ) {
      return
    }
    prog.entries.forEach((entry) => {
      if (entryMatchesDate(entry, date, prog)) {
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
    const mealOrder = MEAL_TYPES.findIndex((m) => m.id === normalizeMealType(a.mealType))
      - MEAL_TYPES.findIndex((m) => m.id === normalizeMealType(b.mealType))
    if (mealOrder !== 0) return mealOrder
    return (a.start || '').localeCompare(b.start || '')
  })
}

export function getDatesWithEntries(programs, daysInRange, member = null) {
  const set = new Set()
  daysInRange.forEach((day) => {
    if (getProgramEntriesForDate(programs, day, member).length > 0) {
      set.add(format(day, 'yyyy-MM-dd'))
    }
  })
  return set
}

export function completionKey(dateStr, entryId) {
  return `${dateStr}_${entryId}`
}

/** Öğün bazlı tamamlama anahtarı (beslenme listeleri) */
export function mealCompletionKey(dateStr, mealType) {
  return `${dateStr}_meal_${mealType}`
}

/** Beslenme girdilerini öğün gruplarına ayırır */
export function groupEntriesByMeal(entries) {
  const map = new Map()
  ;(entries || []).forEach((entry) => {
    const mt = normalizeMealType(entry.mealType)
    if (!map.has(mt)) map.set(mt, [])
    map.get(mt).push(entry)
  })
  const groups = []
  MEAL_TYPES.forEach((m) => {
    if (map.has(m.id)) {
      groups.push({ mealType: m.id, label: m.label, entries: map.get(m.id) })
    }
  })
  return groups
}

export function isMealCompleted(completedActivities, dateStr, mealType, mealEntries) {
  const keys = completedActivities?.[dateStr] || []
  if (keys.includes(mealCompletionKey(dateStr, mealType))) return true
  if (!mealEntries?.length) return false
  return mealEntries.every((e) => keys.includes(completionKey(dateStr, e.id)))
}

export function splitEntriesByType(entries) {
  return {
    workout: (entries || []).filter((e) => e.programType === 'workout' && !e.mealType),
    nutrition: (entries || []).filter((e) => e.programType === 'nutrition' || e.mealType),
  }
}

export function formatEntrySchedule(entry, program = null) {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  if (entry.cycleDay != null && entry.cycleDay !== '' && program && usesLegacyCycleDayRotation(program)) {
    const len = Number(program?.cycleLength) || CYCLE_PLAN_LENGTH
    return `Gün ${Number(entry.cycleDay) + 1}/${len}`
  }
  if (program && isCycle14ByWeekday(program) && entry.day != null && entry.day !== '') {
    const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
    const n = Number(entry.day)
    return days[n] ? `Her ${days[n]} · ${len} gün` : `${len} gün`
  }
  if (program && isCycle14SameDaily(program)) {
    const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
    return `Her gün aynı · ${len} gün`
  }
  if (program && isFixedDurationPlan(program) && !usesLegacyCycleDayRotation(program) && program.cycleSameDaily !== false) {
    const len = Number(program.cycleLength) || CYCLE_PLAN_LENGTH
    return `Her gün aynı · ${len} gün`
  }
  if (entry.date) {
    try {
      const d = parseISO(entry.date)
      if (isValid(d)) return format(d, 'd MMM yyyy')
    } catch { /* yoksay */ }
    return entry.date
  }
  const n = Number(entry.day)
  if (!Number.isNaN(n) && days[n]) return `Her ${days[n]}`
  return ''
}

/** Danışan + zamanlama → otomatik beslenme liste başlığı (koç programı ile aynı desen) */
export function buildNutritionProgramTitle(memberName, startStr, endStr, mode = 'weekly') {
  const name = memberName || 'Danışan'
  const fmt = (s) => format(parseISO(`${s}T12:00:00`), 'd MMM yyyy', { locale: tr })
  const start = startStr ? fmt(startStr) : null
  const end = endStr ? fmt(endStr) : null

  if (mode === 'cycle14' && start && end) {
    return `${name} — 14 Günlük Beslenme (${start} – ${end})`
  }
  if (mode === 'date' && start) {
    if (end && endStr !== startStr) {
      return `${name} — Tarihe Özel Beslenme (${start} – ${end})`
    }
    return `${name} — Tarihe Özel Beslenme (${start})`
  }
  if (mode === 'weekly' && start && end) {
    return `${name} — Haftalık Beslenme (${start} – ${end})`
  }
  if (mode === 'weekly' && start) {
    return `${name} — Haftalık Beslenme (${start}+)`
  }
  return `${name} — Beslenme Listesi`
}
