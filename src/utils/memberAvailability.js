import { addDays, differenceInCalendarDays, format, getDay, isValid, parseISO, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'

/** Üyenin antrenman için işaretlediği haftanın günleri (0=Pazar … 6=Cumartesi). */
export function getWorkoutWeekdays(availability = {}) {
  return Object.entries(availability || {})
    .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
    .map(([day]) => Number(day))
    .filter((d) => !Number.isNaN(d))
}

/** Danışan en az bir antrenman günü/saati belirtmiş mi? */
export function memberHasWorkoutAvailability(availability) {
  return getWorkoutWeekdays(availability).length > 0
}

/**
 * Antrenman programı bu takvim gününe yazılabilir mi?
 * Yalnızca danışanın işaretlediği antrenman günleri geçerlidir.
 */
export function isWorkoutAllowedOnDate(date, availability) {
  if (!date) return false
  const workoutDays = getWorkoutWeekdays(availability)
  if (!workoutDays.length) return false
  return workoutDays.includes(getDay(date))
}

export function workoutWeekdayLabels(availability) {
  return getWorkoutWeekdays(availability)
    .map((v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === v)?.label)
    .filter(Boolean)
}

export function weekdayLabelFromDate(date) {
  const dow = getDay(date)
  return AVAILABILITY_WEEKDAYS.find((d) => d.value === dow)?.label || ''
}

function parseDateStr(str) {
  const d = startOfDay(parseISO(
    String(str).includes('T') ? str : `${str}T12:00:00`,
  ))
  return isValid(d) ? d : null
}

/** Başlangıç–bitiş aralığındaki takvim günleri. */
export function eachDateInRange(startStr, endStr) {
  const start = parseDateStr(startStr)
  const end = parseDateStr(endStr)
  if (!start || !end || end < start) return []

  const out = []
  let cur = start
  while (cur <= end) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

/** Seçilen dönemde antrenman yazılabilecek / yazılamayacak gün özeti. */
export function summarizeRangeAvailability(startStr, endStr, availability) {
  const dates = eachDateInRange(startStr, endStr)
  const hasWorkoutDays = memberHasWorkoutAvailability(availability)
  const skippedDates = []
  const activeDates = []

  dates.forEach((d) => {
    if (isWorkoutAllowedOnDate(d, availability)) activeDates.push(d)
    else skippedDates.push(d)
  })

  const skippedWeekdays = [...new Set(skippedDates.map((d) => getDay(d)))]
    .map((v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === v)?.label)
    .filter(Boolean)

  return {
    totalDays: dates.length,
    activeCount: activeDates.length,
    blockedCount: skippedDates.length,
    blockedWeekdays: skippedWeekdays,
    blockedDates: skippedDates,
    activeDates,
    hasWorkoutDays,
    workoutWeekdays: workoutWeekdayLabels(availability),
  }
}

export function cycleLengthFromRange(startStr, endStr) {
  const start = parseDateStr(startStr)
  const end = parseDateStr(endStr)
  if (!start || !end) return 0
  return differenceInCalendarDays(end, start) + 1
}

export function formatRangeSummary(startStr, endStr) {
  const start = parseDateStr(startStr)
  const end = parseDateStr(endStr)
  if (!start || !end) return ''
  return `${format(start, 'd MMM yyyy', { locale: tr })} – ${format(end, 'd MMM yyyy', { locale: tr })}`
}
