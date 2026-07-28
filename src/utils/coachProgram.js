import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CYCLE_PLAN_LENGTH } from './programSchedule'
import { cycleLengthFromRange } from './memberAvailability'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'

export const COACH_DURATION_PRESETS = [20, 30, 45, 60, 75, 90]

export const DEFAULT_SESSION_TIME = { start: '09:00', end: '10:00' }

export const COACH_SESSION_TIME_OPTIONS = (() => {
  const out = []
  for (let h = 5; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

export function weekdayShortLabel(day) {
  return AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(day))?.short || String(day)
}

export function weekdayFullLabel(day) {
  return AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(day))?.label || String(day)
}

export function entryToDisplayText(e) {
  const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
  const day = e.day != null && e.day !== '' ? `${weekdayShortLabel(e.day)} · ` : ''
  return `${day}${e.exerciseName} · ${amount}${e.note ? ` (${e.note})` : ''}`
}

/** Workout programlarındaki benzersiz exerciseId listesi (koç + AI). */
export function collectProgramExerciseIds(programs = []) {
  const ids = new Set()
  for (const program of programs || []) {
    if (program?.type && program.type !== 'workout') continue
    const entries = Array.isArray(program?.entries) ? program.entries : []
    for (const entry of entries) {
      const id = entry?.exerciseId
      if (id && typeof id === 'string') ids.add(id)
    }
  }
  return [...ids]
}

export function buildCoachProgramTitle(memberName, startStr, endStr, mode = 'weekly') {
  const startFmt = format(parseISO(`${startStr}T12:00:00`), 'd MMM yyyy', { locale: tr })
  const endFmt = format(parseISO(`${endStr}T12:00:00`), 'd MMM yyyy', { locale: tr })
  if (mode === 'fixed14') {
    return `${memberName} — 14 Günlük Antrenman (${startFmt} – ${endFmt})`
  }
  if (mode === 'weekly') {
    return `${memberName} — Haftalık Antrenman (${startFmt} – ${endFmt})`
  }
  return `${memberName} — Antrenman (${startFmt} – ${endFmt})`
}

function normalizeCartEntry(e, i, { day, start, end }) {
  return {
    id: e.id || `e-${Date.now()}-${day ?? 'x'}-${i}`,
    exerciseId: e.exerciseId,
    exerciseName: e.exerciseName,
    videoUrl: e.videoUrl || '',
    description: e.description || '',
    amountType: e.amountType || 'reps',
    amount: e.amount ?? 12,
    durationUnit: e.durationUnit || 'sn',
    note: e.note || '',
    start,
    end,
    order: i,
    ...(day != null ? { day: Number(day) } : {}),
  }
}

/** Sepet satırlarını yeni id’lerle kopyala (gün kopyalama / tüm günlere uygula). */
export function cloneCartEntries(entries = []) {
  const stamp = Date.now()
  return (entries || []).map((e, i) => ({
    ...e,
    id: `e-${stamp}-${i}-${Math.random().toString(36).slice(2, 6)}`,
  }))
}

export function filledWeekdaysFromDayCarts(dayCarts = {}) {
  return Object.keys(dayCarts)
    .map(Number)
    .filter((d) => !Number.isNaN(d) && (dayCarts[d] || []).length > 0)
    .sort((a, b) => a - b)
}

/** programs.entries → dayCarts hydrate (admin/staff edit). */
export function hydrateDayCartsFromEntries(entries = []) {
  const carts = {}
  for (const e of entries || []) {
    if (e?.day == null || e.day === '') continue
    const day = Number(e.day)
    if (Number.isNaN(day)) continue
    if (!carts[day]) carts[day] = []
    carts[day].push({
      id: e.id || `e-${day}-${carts[day].length}-${Date.now()}`,
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      videoUrl: e.videoUrl || '',
      videoPending: Boolean(e.videoPending),
      description: e.description || '',
      amountType: e.amountType || 'reps',
      amount: e.amount ?? 12,
      durationUnit: e.durationUnit || 'sn',
      note: e.note || '',
    })
  }
  return carts
}

export function countDayCartExercises(dayCarts = {}) {
  return filledWeekdaysFromDayCarts(dayCarts).reduce(
    (sum, d) => sum + (dayCarts[d]?.length || 0),
    0,
  )
}

/**
 * Gün bazlı haftalık şablon → programs.data payload.
 * cycleSameDaily yazılmaz (legacy cycleDay rotasyonuna düşmesin).
 */
export function buildWeeklyCoachProgramPayload({
  dayCarts = {},
  daySessionTimes = {},
  startDate,
  endDate,
  description = '',
  sessionDuration = 45,
  memberName,
  titleMode = 'weekly',
}) {
  const cycleLength = cycleLengthFromRange(startDate, endDate)
  const filledDays = filledWeekdaysFromDayCarts(dayCarts)
  const entries = []

  filledDays.forEach((day) => {
    const time = daySessionTimes[day] || DEFAULT_SESSION_TIME
    const cart = dayCarts[day] || []
    cart.forEach((e, i) => {
      entries.push(normalizeCartEntry(e, i, {
        day,
        start: time.start,
        end: time.end,
      }))
    })
  })

  return {
    title: buildCoachProgramTitle(memberName, startDate, endDate, titleMode),
    description: String(description || '').trim(),
    sessionDuration,
    scheduleType: 'weekly',
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    entries,
    items: entries.map(entryToDisplayText),
  }
}

/** @deprecated Eski tek-sepet + cycleSameDaily; kısayol modalı dayCarts’a yazar. */
export function buildCoachProgramPayload({
  cartEntries,
  startDate,
  endDate,
  description = '',
  sessionDuration,
  sessionTime,
  memberName,
  dateMode = 'fixed14',
}) {
  const cycleLength = dateMode === 'fixed14'
    ? CYCLE_PLAN_LENGTH
    : cycleLengthFromRange(startDate, endDate)

  const time = sessionTime || DEFAULT_SESSION_TIME
  const ordered = (cartEntries || []).map((e, i) => normalizeCartEntry(e, i, {
    start: time.start,
    end: time.end,
  }))

  const title = buildCoachProgramTitle(memberName, startDate, endDate, dateMode)

  return {
    title,
    description: String(description || '').trim(),
    sessionDuration,
    scheduleType: dateMode === 'fixed14' ? 'cycle14' : 'dateRange',
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    cycleSameDaily: true,
    entries: ordered,
    items: ordered.map(entryToDisplayText),
  }
}
