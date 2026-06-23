import { format, subDays, startOfDay, getISOWeek, getISOWeekYear } from 'date-fns'
import { getProgramEntriesForDate, completionKey } from './programSchedule'

function dayFullyComplete(date, programs, completedActivities) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const entries = getProgramEntriesForDate(programs, date)
  if (entries.length === 0) return false
  const keys = completedActivities[dateStr] || []
  return entries.every((e) => keys.includes(completionKey(dateStr, e.id)))
}

/** Kesintisiz tamamlanan gün serisi */
export function computeStreak(programs, completedActivities, today = new Date()) {
  let streak = 0
  let cursor = startOfDay(today)

  const todayComplete = dayFullyComplete(cursor, programs, completedActivities)
  if (!todayComplete) {
    cursor = subDays(cursor, 1)
  }

  while (true) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const entries = getProgramEntriesForDate(programs, cursor)
    if (entries.length === 0) {
      cursor = subDays(cursor, 1)
      if (format(cursor, 'yyyy-MM-dd') < '2020-01-01') break
      continue
    }
    if (!dayFullyComplete(cursor, programs, completedActivities)) break
    streak += 1
    cursor = subDays(cursor, 1)
    if (streak > 365) break
  }
  return streak
}

function weekKey(date) {
  const y = getISOWeekYear(date)
  const w = getISOWeek(date)
  return `${y}-W${String(w).padStart(2, '0')}`
}

/** Haftalık antrenman grafiği verisi */
export function buildWorkoutProgress(programs, completedActivities, existing = []) {
  const map = new Map((existing || []).map((r) => [r.week, { ...r }]))

  const allDates = new Set([
    ...Object.keys(completedActivities || {}),
  ])

  programs.forEach((p) => {
    (p.entries || []).forEach((e) => {
      if (e.date) allDates.add(e.date)
    })
  })

  allDates.forEach((dateStr) => {
    const date = new Date(`${dateStr}T12:00:00`)
    const wk = weekKey(date)
    const entries = getProgramEntriesForDate(programs, date)
    const workoutEntries = entries.filter((e) => e.programType === 'workout')
    if (workoutEntries.length === 0) return

    const keys = completedActivities[dateStr] || []
    const completed = workoutEntries.filter((e) => keys.includes(completionKey(dateStr, e.id))).length

    const prev = map.get(wk) || { week: wk, completed: 0, planned: 0 }
    prev.planned = Math.max(prev.planned, workoutEntries.length)
    prev.completed = Math.max(prev.completed, completed)
    map.set(wk, prev)
  })

  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-12)
}

export function buildProgressPatch(programs, completedActivities, currentProgress = {}) {
  return {
    streak: computeStreak(programs, completedActivities),
    progress: {
      weight: currentProgress.weight || [],
      mood: currentProgress.mood || [],
      workouts: buildWorkoutProgress(programs, completedActivities, currentProgress.workouts),
    },
  }
}
