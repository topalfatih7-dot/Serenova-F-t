/** Su takibi — hedef varsayılanı, ml sınırları, gün toplamı. Bardak sayısı yok. */

export const DEFAULT_WATER_GOAL_ML = 2000
export const WATER_AMOUNT_MIN = 1
export const WATER_AMOUNT_MAX = 1000
export const WATER_GOAL_MIN = 500
export const WATER_GOAL_MAX = 5000
export const WATER_GLASS_INFO_ML = 200

export const WATER_COPY = {
  title: 'Su takibi',
  goalSuffix: 'ml hedef',
  add: 'Ekle',
  undo: 'Son kaydı geri al',
  glassHint: 'Ortalama bir su bardağı yaklaşık 200 ml’dir.',
  medicalHint: 'Hedef öneridir, tıbbi tavsiye değildir. Böbrek veya kalp hastalığınız varsa hekiminize danışın.',
  goalByDietitian: 'Hedefi diyetisyeniniz belirledi',
  goalReached: 'Hedef doldu',
  amountInvalid: '1–1000 ml girin',
  goalInvalid: 'Hedef 500–5000 ml olmalı',
  added: 'Su kaydı eklendi',
  undone: 'Son kayıt geri alındı',
  goalSaved: 'Günlük su hedefi güncellendi',
  goalNotifyTitle: 'Günlük su hedefiniz güncellendi',
  unit: 'ml',
  placeholder: 'ml',
  remainingPrefix: 'Hedefe',
  remainingSuffix: 'ml kaldı',
  defaultGoalBody: 'Günlük hedef 2000 ml.',
}

export function localDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function resolveDailyGoalMl(waterTracking) {
  const n = Number(waterTracking?.dailyGoalMl)
  if (!Number.isFinite(n)) return DEFAULT_WATER_GOAL_ML
  return Math.min(WATER_GOAL_MAX, Math.max(WATER_GOAL_MIN, Math.round(n)))
}

export function isGoalCustomized(waterTracking) {
  return Boolean(waterTracking?.goalUpdatedBy?.id)
}

export function clampAmountMl(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < WATER_AMOUNT_MIN || rounded > WATER_AMOUNT_MAX) return null
  return rounded
}

export function clampGoalMl(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < WATER_GOAL_MIN || rounded > WATER_GOAL_MAX) return null
  return rounded
}

export function sumMlForDate(logs, dateStr) {
  if (!dateStr || !Array.isArray(logs)) return 0
  return logs.reduce((sum, log) => (log?.localDate === dateStr ? sum + (Number(log.amountMl) || 0) : sum), 0)
}

export function lastLogForDate(logs, dateStr) {
  if (!dateStr || !Array.isArray(logs)) return null
  const day = logs.filter((log) => log?.localDate === dateStr)
  if (!day.length) return null
  return day.reduce((latest, log) => {
    if (!latest) return log
    const a = String(log.loggedAt || '')
    const b = String(latest.loggedAt || '')
    return a > b ? log : latest
  }, null)
}

export function fillPercent(todayMl, goalMl) {
  const goal = goalMl > 0 ? goalMl : DEFAULT_WATER_GOAL_ML
  const ml = Math.max(0, Number(todayMl) || 0)
  return Math.min(100, Math.round((ml / goal) * 100))
}

export function goalReached(todayMl, goalMl) {
  return fillPercent(todayMl, goalMl) >= 100
}

export function remainingMl(todayMl, goalMl) {
  const goal = goalMl > 0 ? goalMl : DEFAULT_WATER_GOAL_ML
  return Math.max(0, goal - (Number(todayMl) || 0))
}

export function lastNDates(n, from = new Date()) {
  const out = []
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = n - 1; i >= 0; i -= 1) {
    const day = new Date(d)
    day.setDate(d.getDate() - i)
    out.push(localDateStr(day))
  }
  return out
}

export function mapWaterLogRow(row) {
  if (!row) return null
  return {
    id: row.id,
    memberId: row.member_id,
    localDate: row.local_date,
    amountMl: row.amount_ml,
    loggedAt: row.logged_at,
    source: row.source || 'member',
  }
}
