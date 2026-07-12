/**
 * Otomatik antrenman + diyet programı (Gemini) — ayrı Vercel route değil.
 * Hobby 12-fn limiti: /api/ai-nutrition-tips?task=auto-programs üzerinden çağrılır.
 */

import {
  AUTO_PROGRAMS_SYSTEM,
  AUTO_PROGRAMS_CONFIG,
  AUTO_MEAL_TYPES,
  buildAutoProgramsInstruction,
} from './_ai-prompts.js'

const MAX_CANDIDATES = 80
const VALID_DAYS = new Set([0, 1, 2, 3, 4, 5, 6])
const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  snack_morning: '10:30',
  lunch: '13:00',
  snack_afternoon: '16:00',
  dinner: '19:00',
  snack_evening: '21:30',
}

function normalizeCandidates(raw) {
  const seen = new Set()
  const out = []
  for (const ex of Array.isArray(raw) ? raw : []) {
    const id = String(ex?.id || '').trim()
    const name = String(ex?.name || '').trim()
    if (!id || !name || seen.has(id)) continue
    seen.add(id)
    out.push({
      id,
      name,
      difficulty: String(ex.difficulty || '').slice(0, 40),
      equipment: String(ex.equipment || '').slice(0, 60),
      targetMuscle: String(ex.targetMuscle || '').slice(0, 60),
      movementCategory: String(ex.movementCategory || '').slice(0, 40),
    })
    if (out.length >= MAX_CANDIDATES) break
  }
  return out
}

function clampAmount(amountType, amount) {
  const n = Math.round(Number(amount) || 0)
  if (amountType === 'duration') return Math.min(600, Math.max(10, n || 30))
  return Math.min(30, Math.max(6, n || 12))
}

function normalizeTime(raw, mealType) {
  const s = String(raw || '').trim()
  if (/^\d{2}:\d{2}$/.test(s)) return s
  return DEFAULT_MEAL_TIMES[mealType] || '12:00'
}

function sanitizeWorkout(rawWorkout, catalogById, allowedDays) {
  const daysIn = Array.isArray(rawWorkout?.days) ? rawWorkout.days : []
  const usedPerDay = new Map()
  const days = []

  for (const slot of daysIn) {
    const day = Number(slot?.day)
    if (!VALID_DAYS.has(day)) continue
    if (allowedDays.length && !allowedDays.includes(day)) continue

    const seen = usedPerDay.get(day) || new Set()
    const exercises = []
    for (const ex of Array.isArray(slot?.exercises) ? slot.exercises : []) {
      const id = String(ex?.id || '').trim()
      if (!id || !catalogById.has(id) || seen.has(id)) continue
      seen.add(id)
      const amountType = ex?.amountType === 'duration' ? 'duration' : 'reps'
      exercises.push({
        id,
        amountType,
        amount: clampAmount(amountType, ex?.amount),
        note: String(ex?.note || '').trim().slice(0, 120),
        durationUnit: amountType === 'duration' ? 'sn' : undefined,
      })
      if (exercises.length >= 6) break
    }
    usedPerDay.set(day, seen)
    if (exercises.length > 0) days.push({ day, exercises })
  }

  const catalogIds = [...catalogById.keys()]
  let cursor = 0
  for (const day of allowedDays) {
    if (days.some((d) => d.day === day)) continue
    const pick = []
    const target = Math.min(4, catalogIds.length)
    for (let i = 0; i < catalogIds.length && pick.length < target; i += 1) {
      const id = catalogIds[cursor % catalogIds.length]
      cursor += 1
      if (!id || pick.includes(id)) continue
      pick.push(id)
    }
    if (pick.length) {
      days.push({
        day,
        exercises: pick.map((id) => ({
          id,
          amountType: 'reps',
          amount: 12,
          note: '',
        })),
      })
    }
  }

  days.sort((a, b) => a.day - b.day)
  return {
    message: String(rawWorkout?.message || '').trim().slice(0, 300),
    days,
  }
}

function sanitizeNutrition(rawNutrition) {
  const mealsIn = Array.isArray(rawNutrition?.meals) ? rawNutrition.meals : []
  const byType = new Map()

  for (const meal of mealsIn) {
    const mealType = String(meal?.mealType || '').trim()
    if (!AUTO_MEAL_TYPES.includes(mealType)) continue
    const name = String(meal?.name || meal?.exerciseName || '').trim().slice(0, 280)
    if (!name) continue
    byType.set(mealType, {
      mealType,
      name,
      note: String(meal?.note || '').trim().slice(0, 160),
      start: normalizeTime(meal?.start, mealType),
    })
  }

  const required = ['breakfast', 'lunch', 'dinner']
  const meals = AUTO_MEAL_TYPES.map((t) => byType.get(t)).filter(Boolean)
  const hasRequired = required.every((t) => byType.has(t))

  return {
    focus: String(rawNutrition?.focus || '').trim().slice(0, 200),
    meals,
    hasRequired,
  }
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function runAutoPrograms({ body, callGemini, parseJsonResponse }) {
  const profile = body?.profile || {}
  const healthTestSummary = String(body?.healthTestSummary || '').slice(0, 3000)
  const candidates = normalizeCandidates(body?.candidates)
  const workoutDays = (Array.isArray(body?.workoutDays) ? body.workoutDays : [1, 3, 5])
    .map((d) => Number(d))
    .filter((d) => VALID_DAYS.has(d))
  const dailyCalories = body?.dailyCalories != null ? Number(body.dailyCalories) : null

  if (candidates.length < 3) {
    return { status: 400, body: { ok: false, error: 'En az 3 aday hareket gerekli' } }
  }

  const catalogById = new Map(candidates.map((c) => [c.id, c]))
  const allowedDays = workoutDays.length ? workoutDays : [1, 3, 5]

  const instruction = buildAutoProgramsInstruction({
    profile,
    healthTestSummary,
    candidates,
    workoutDays: allowedDays,
    dailyCalories: Number.isFinite(dailyCalories) ? dailyCalories : null,
  })

  const raw = await callGemini([{ text: instruction }], AUTO_PROGRAMS_SYSTEM, AUTO_PROGRAMS_CONFIG)
  const result = parseJsonResponse(raw)

  const workout = sanitizeWorkout(result.workout, catalogById, allowedDays)
  const nutrition = sanitizeNutrition(result.nutrition)

  if (workout.days.length === 0) {
    return { status: 502, body: { ok: false, error: 'AI geçerli antrenman üretemedi' } }
  }
  if (!nutrition.hasRequired || nutrition.meals.length < 3) {
    return { status: 502, body: { ok: false, error: 'AI geçerli diyet menüsü üretemedi' } }
  }

  return {
    status: 200,
    body: {
      ok: true,
      aiGenerated: true,
      workout,
      nutrition: {
        focus: nutrition.focus,
        meals: nutrition.meals,
      },
    },
  }
}
