import { format, getDay, parseISO, isValid } from 'date-fns'

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Kahvaltı', short: 'Kahvaltı' },
  { id: 'snack_morning', label: 'Sabah–Öğle Arası Ara Öğün', short: 'Sabah Ara' },
  { id: 'lunch', label: 'Öğle Yemeği', short: 'Öğle' },
  { id: 'snack_afternoon', label: 'Öğle–Akşam Arası Ara Öğün', short: 'Öğle Ara' },
  { id: 'dinner', label: 'Akşam Yemeği', short: 'Akşam' },
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

/** Girdi belirli bir takvim gününe mi ait? (date veya haftalık day) */
export function entryMatchesDate(entry, date) {
  if (!entry || !date) return false
  const dateStr = format(date, 'yyyy-MM-dd')
  if (entry.date) return entry.date === dateStr
  if (entry.day != null && entry.day !== '') {
    return Number(entry.day) === getDay(date)
  }
  return false
}

export function getProgramEntriesForDate(programs, date) {
  const result = []
  ;(programs || []).forEach((prog) => {
    if (!prog.entries?.length) return
    prog.entries.forEach((entry) => {
      if (entryMatchesDate(entry, date)) {
        result.push({
          ...entry,
          programId: prog.id,
          programTitle: prog.title,
          programType: prog.type,
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

export function getDatesWithEntries(programs, daysInRange) {
  const set = new Set()
  daysInRange.forEach((day) => {
    if (getProgramEntriesForDate(programs, day).length > 0) {
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
    workout: (entries || []).filter((e) => e.programType === 'workout'),
    nutrition: (entries || []).filter((e) => e.programType === 'nutrition'),
  }
}

export function formatEntrySchedule(entry) {
  if (entry.date) {
    try {
      const d = parseISO(entry.date)
      if (isValid(d)) return format(d, 'd MMM yyyy')
    } catch { /* yoksay */ }
    return entry.date
  }
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  const n = Number(entry.day)
  if (!Number.isNaN(n) && days[n]) return `Her ${days[n]}`
  return ''
}
