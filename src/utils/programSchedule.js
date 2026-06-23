import { format, getDay, parseISO, isValid } from 'date-fns'

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Kahvaltı', short: 'Kah' },
  { id: 'lunch', label: 'Öğle Yemeği', short: 'Öğle' },
  { id: 'dinner', label: 'Akşam Yemeği', short: 'Akşam' },
  { id: 'snack', label: 'Ara Öğün', short: 'Ara' },
  { id: 'note', label: 'Dikkat / Not', short: 'Not' },
]

export const mealLabel = (id) => MEAL_TYPES.find((m) => m.id === id)?.label || id || ''

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
    const mealOrder = MEAL_TYPES.findIndex((m) => m.id === a.mealType) - MEAL_TYPES.findIndex((m) => m.id === b.mealType)
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
