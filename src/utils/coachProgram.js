import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CYCLE_PLAN_LENGTH } from './programSchedule'
import { cycleLengthFromRange } from './memberAvailability'

export const COACH_DURATION_PRESETS = [20, 30, 45, 60, 75, 90]

export const COACH_SESSION_TIME_OPTIONS = (() => {
  const out = []
  for (let h = 5; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

export function entryToDisplayText(e) {
  const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
  const time = e.start ? `${e.start}${e.end ? `–${e.end}` : ''} ` : ''
  return `${time}${e.exerciseName} · ${amount}${e.note ? ` (${e.note})` : ''}`
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

export function buildCoachProgramTitle(memberName, startStr, endStr, mode = 'fixed14') {
  const startFmt = format(parseISO(`${startStr}T12:00:00`), 'd MMM yyyy', { locale: tr })
  const endFmt = format(parseISO(`${endStr}T12:00:00`), 'd MMM yyyy', { locale: tr })
  if (mode === 'fixed14') {
    return `${memberName} — 14 Günlük Antrenman (${startFmt} – ${endFmt})`
  }
  return `${memberName} — Antrenman (${startFmt} – ${endFmt})`
}

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

  const ordered = cartEntries.map((e, i) => ({
    id: e.id,
    exerciseId: e.exerciseId,
    exerciseName: e.exerciseName,
    videoUrl: e.videoUrl || '',
    description: e.description || '',
    amountType: e.amountType || 'reps',
    amount: e.amount ?? 12,
    durationUnit: e.durationUnit || 'sn',
    note: e.note || '',
    start: sessionTime.start,
    end: sessionTime.end,
    order: i,
  }))

  const title = buildCoachProgramTitle(memberName, startDate, endDate, dateMode)

  return {
    title,
    description: description.trim(),
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
