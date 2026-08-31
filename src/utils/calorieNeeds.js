/** Mifflin–St Jeor BMR + Harris-style aktivite çarpanı. Tıbbi tanı değildir. */

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Hareketsiz — masa başı, az yürüyüş', factor: 1.2 },
  { id: 'light', label: 'Hafif — haftada 1–3 antrenman', factor: 1.375 },
  { id: 'moderate', label: 'Orta — haftada 3–5 antrenman', factor: 1.55 },
  { id: 'active', label: 'Aktif — haftada 6–7 antrenman', factor: 1.725 },
  { id: 'very', label: 'Çok aktif — fiziksel iş veya günde 2 seans', factor: 1.9 },
]

export const GOALS = [
  { id: 'maintain', label: 'Korumak', delta: 0 },
  { id: 'lose', label: 'Hafif açık (~300 kcal)', delta: -300 },
  { id: 'gain', label: 'Hafif fazla (~200 kcal)', delta: 200 },
]

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

export function validateCalorieInputs({ sex, kg, cm, age }) {
  const w = num(kg)
  const h = num(cm)
  const a = num(age)
  if (sex !== 'female' && sex !== 'male') return 'Cinsiyet seçin.'
  if (!(a >= 18 && a <= 80)) return 'Yaş 18–80 arasında olmalı.'
  if (!(h >= 120 && h <= 220)) return 'Boy 120–220 cm arasında olmalı.'
  if (!(w >= 35 && w <= 250)) return 'Kilo 35–250 kg arasında olmalı.'
  return null
}

/** @returns {number|null} */
export function calcBmrMifflin({ sex, kg, cm, age }) {
  if (validateCalorieInputs({ sex, kg, cm, age })) return null
  const base = 10 * num(kg) + 6.25 * num(cm) - 5 * num(age)
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export function calcTdee(bmr, activityId) {
  const level = ACTIVITY_LEVELS.find((l) => l.id === activityId)
  if (!bmr || !level) return null
  return Math.round(bmr * level.factor)
}

export function calcGoalCalories(tdee, bmr, goalId) {
  const goal = GOALS.find((g) => g.id === goalId) || GOALS[0]
  if (!tdee) return null
  const raw = tdee + goal.delta
  if (goal.delta < 0 && bmr) return Math.max(bmr, raw)
  return raw
}
