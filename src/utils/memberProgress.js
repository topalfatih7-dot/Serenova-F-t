import {
  format, subDays, startOfDay, startOfWeek, endOfWeek,
  eachDayOfInterval, subWeeks, isAfter, getISOWeek, getISOWeekYear,
} from 'date-fns'
import {
  getProgramEntriesForDate,
  completionKey,
  groupEntriesByMeal,
  isMealCompleted,
  splitEntriesByType,
} from './programSchedule'

function dayFullyComplete(date, programs, completedActivities, member = null) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const entries = getProgramEntriesForDate(programs, date, member)
  if (entries.length === 0) return false

  const { workout, nutrition } = splitEntriesByType(entries)
  const keys = completedActivities[dateStr] || []
  const mealGroups = groupEntriesByMeal(nutrition)

  const workoutOk = workout.length === 0 || workout.every((e) => keys.includes(completionKey(dateStr, e.id)))
  const mealsOk = mealGroups.length === 0 || mealGroups.every((g) =>
    isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)
  )

  return workoutOk && mealsOk
}

/** Kesintisiz tamamlanan gün serisi */
export function computeStreak(programs, completedActivities, today = new Date(), member = null) {
  let streak = 0
  let cursor = startOfDay(today)

  const todayComplete = dayFullyComplete(cursor, programs, completedActivities, member)
  if (!todayComplete) {
    cursor = subDays(cursor, 1)
  }

  while (true) {
    const entries = getProgramEntriesForDate(programs, cursor, member)
    if (entries.length === 0) {
      cursor = subDays(cursor, 1)
      if (format(cursor, 'yyyy-MM-dd') < '2020-01-01') break
      continue
    }
    if (!dayFullyComplete(cursor, programs, completedActivities, member)) break
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
export function buildWorkoutProgress(programs, completedActivities, existing = [], member = null) {
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
    const entries = getProgramEntriesForDate(programs, date, member)
    const workoutEntries = entries.filter((e) => e.programType === 'workout')
    if (workoutEntries.length === 0) return

    const keys = completedActivities[dateStr] || []
    const completed = workoutEntries.filter((e) => keys.includes(completionKey(dateStr, e.id))).length

    const prev = map.get(wk) || { week: wk, completed: 0, planned: 0 }
    prev.planned += workoutEntries.length
    prev.completed += completed
    map.set(wk, prev)
  })

  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-12)
}

/** Haftalık öğün tamamlama grafiği (beslenme listeleri) */
export function buildMealProgress(programs, completedActivities, existing = [], member = null) {
  const map = new Map((existing || []).map((r) => [r.week, { ...r }]))

  const allDates = new Set(Object.keys(completedActivities || {}))
  programs.forEach((p) => {
    if (p.type !== 'nutrition') return
    ;(p.entries || []).forEach((e) => {
      if (e.date) allDates.add(e.date)
    })
  })

  allDates.forEach((dateStr) => {
    const date = new Date(`${dateStr}T12:00:00`)
    const wk = weekKey(date)
    const entries = getProgramEntriesForDate(programs, date, member)
    const nutrition = entries.filter((e) => e.programType === 'nutrition' || e.mealType)
    const mealGroups = groupEntriesByMeal(nutrition)
    if (mealGroups.length === 0) return

    const completed = mealGroups.filter((g) =>
      isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)
    ).length

    const prev = map.get(wk) || { week: wk, completed: 0, planned: 0 }
    prev.planned += mealGroups.length
    prev.completed += completed
    map.set(wk, prev)
  })

  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-12)
}

export function buildProgressPatch(programs, completedActivities, currentProgress = {}, member = null) {
  return {
    streak: computeStreak(programs, completedActivities, new Date(), member),
    progress: {
      weight: currentProgress.weight || [],
      mood: currentProgress.mood || [],
      workouts: buildWorkoutProgress(programs, completedActivities, currentProgress.workouts, member),
      meals: buildMealProgress(programs, completedActivities, currentProgress.meals, member),
    },
  }
}

/**
 * Bir hafta aralığı için gün gün antrenman/öğün planlanan+tamamlanan sayıları.
 * @returns {{ start, end, days: Array, workout: {planned,done}, meal: {planned,done} }}
 */
function weekAdherence(programs, completedActivities, weekStart, member, now) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end }).map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isFuture = isAfter(startOfDay(date), startOfDay(now))
    const entries = getProgramEntriesForDate(programs, date, member)
    const { workout, nutrition } = splitEntriesByType(entries)
    const mealGroups = groupEntriesByMeal(nutrition)
    const keys = completedActivities[dateStr] || []
    const workoutDone = workout.filter((e) => keys.includes(completionKey(dateStr, e.id))).length
    const mealDone = mealGroups.filter((g) =>
      isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)).length
    return {
      dateStr,
      date,
      isFuture,
      workout: { planned: workout.length, done: workoutDone },
      meal: { planned: mealGroups.length, done: mealDone },
    }
  })
  const sum = (sel) => days.reduce((acc, d) => {
    acc.planned += sel(d).planned
    acc.done += sel(d).done
    return acc
  }, { planned: 0, done: 0 })
  return { start, end, days, workout: sum((d) => d.workout), meal: sum((d) => d.meal) }
}

/** Önceki hafta + bu hafta antrenman/öğün takibi. */
export function buildWeeklyAdherence(programs, completedActivities = {}, member = null, now = new Date()) {
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const prevWeekStart = subWeeks(thisWeekStart, 1)
  return {
    thisWeek: weekAdherence(programs, completedActivities, thisWeekStart, member, now),
    prevWeek: weekAdherence(programs, completedActivities, prevWeekStart, member, now),
  }
}
