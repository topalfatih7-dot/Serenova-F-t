/**
 * Otomatik antrenman / diyet programı payload yardımcıları (takvim uyumlu).
 */
import { format } from 'date-fns'
import { CYCLE_PLAN_LENGTH } from '../utils/programSchedule'

/** date-fns getDay: 0=Pazar … 6=Cumartesi */
export const AUTO_WORKOUT_DAYS_BY_LEVEL = {
  beginner: [1, 3, 5],
  intermediate: [1, 2, 4, 6],
  advanced: [1, 2, 3, 4, 6],
}

export function workoutDaysForLevel(fitnessLevel) {
  return AUTO_WORKOUT_DAYS_BY_LEVEL[fitnessLevel] || AUTO_WORKOUT_DAYS_BY_LEVEL.beginner
}

const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  snack_morning: '10:30',
  lunch: '13:00',
  snack_afternoon: '16:00',
  dinner: '19:00',
  snack_evening: '21:30',
}

/** Gemini yok / hata → basit Türk mutfağı şablon menü */
export function buildFallbackNutritionMeals(profile = {}, dailyCalories = null) {
  const prefs = (profile.nutritionPrefs || []).map((p) => String(p).toLowerCase())
  const veg = prefs.some((p) => /vejet|vegan|bitkisel/.test(p))
  const cut = dailyCalories && profile.goals?.some?.((g) => g === 'weight' || g === 'fatburn')

  const proteinBreakfast = veg ? 'Yulaf lapası, muz, badem, bitkisel protein tozu' : '2 yumurta, tam buğday ekmek, lor peyniri, domates'
  const proteinLunch = veg
    ? 'Mercimek çorbası, bulgur pilavı, salata, yoğurt'
    : cut
      ? 'Izgara tavuk, bol salata, 4 yemek kaşığı bulgur'
      : 'Izgara tavuk/balık, pilav veya patates, salata'
  const proteinDinner = veg
    ? 'Sebzeli nohut yemeği, cacık, salata'
    : cut
      ? 'Fırın balık veya hindi, buharda sebze, salata'
      : 'Etli sebze yemeği veya ızgara köfte, yoğurt, salata'

  return [
    { mealType: 'breakfast', name: proteinBreakfast, note: '', start: DEFAULT_MEAL_TIMES.breakfast },
    { mealType: 'snack_morning', name: veg ? '1 meyve + 10 badem' : '1 meyve + 1 kase yoğurt', note: '', start: DEFAULT_MEAL_TIMES.snack_morning },
    { mealType: 'lunch', name: proteinLunch, note: 'Porsiyonu tok hissettiğin kadar ayarla', start: DEFAULT_MEAL_TIMES.lunch },
    { mealType: 'snack_afternoon', name: 'Yoğurt veya kefir + 1 avuç kuruyemiş', note: '', start: DEFAULT_MEAL_TIMES.snack_afternoon },
    { mealType: 'dinner', name: proteinDinner, note: 'Akşam yemeğini yatmadan en az 2–3 saat önce bitir', start: DEFAULT_MEAL_TIMES.dinner },
  ]
}

export function buildWorkoutProgramFromAi({ memberId, memberName, workout, exerciseById }) {
  const entries = []
  let order = 0
  for (const slot of workout?.days || []) {
    const day = Number(slot.day)
    for (const ex of slot.exercises || []) {
      const lib = exerciseById.get(ex.id)
      if (!lib) continue
      const amountType = ex.amountType === 'duration' ? 'duration' : 'reps'
      entries.push({
        id: `auto-w-${Date.now()}-${order}`,
        day,
        start: '09:00',
        end: '09:45',
        exerciseId: lib.id,
        exerciseName: lib.name,
        videoUrl: lib.videoUrl || '',
        description: lib.description || '',
        amountType,
        amount: ex.amount ?? (amountType === 'duration' ? 30 : 12),
        durationUnit: amountType === 'duration' ? (ex.durationUnit || 'sn') : 'sn',
        note: ex.note || '',
        order,
      })
      order += 1
    }
  }
  if (entries.length === 0) return null

  return {
    type: 'workout',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: 'Otomatik Antrenman Programı',
    description: workout?.message || '',
    entries,
    items: entries.map((e) => {
      const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
      return `${e.exerciseName} · ${amount}`
    }),
  }
}

export function buildWorkoutProgramFromLibrary({ memberId, memberName, exercises, message, fitnessLevel }) {
  const days = workoutDaysForLevel(fitnessLevel)
  const list = (exercises || []).filter((ex) => ex?.id && String(ex.name || '').trim())
  if (list.length === 0) return null

  const entries = list.map((ex, i) => ({
    id: `auto-${Date.now()}-${i}`,
    day: days[i % days.length],
    start: '09:00',
    end: '09:30',
    exerciseId: ex.id,
    exerciseName: ex.name,
    videoUrl: ex.videoUrl || '',
    description: ex.description || '',
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    note: '',
    order: i,
  }))

  return {
    type: 'workout',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: 'Otomatik Antrenman Programı',
    description: message || '',
    entries,
    items: entries.map((e) => `${e.exerciseName} · ${e.amount} tekrar`),
  }
}

export function buildNutritionProgramFromMeals({
  memberId,
  memberName,
  meals,
  focus = '',
  aiGenerated = false,
}) {
  const list = (meals || []).filter((m) => m?.mealType && String(m.name || '').trim())
  if (list.length === 0) return null

  const startDate = format(new Date(), 'yyyy-MM-dd')
  const entries = list.map((m, i) => {
    const name = String(m.name).trim()
    return {
      id: `auto-n-${Date.now()}-${i}`,
      mealType: m.mealType,
      name,
      exerciseName: name,
      note: m.note || '',
      start: m.start || DEFAULT_MEAL_TIMES[m.mealType] || '12:00',
      order: i,
    }
  })

  return {
    type: 'nutrition',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: 'Otomatik Beslenme Programı',
    description: focus || (aiGenerated ? 'AI destekli kişisel beslenme listesi' : 'Profilinize göre hazırlanan başlangıç menüsü'),
    scheduleType: 'cycle14',
    cycleStartDate: startDate,
    cycleLength: CYCLE_PLAN_LENGTH,
    cycleLoop: false,
    cycleSameDaily: true,
    entries,
    items: entries.map((e) => `${e.start} ${e.mealType}: ${e.name}`),
  }
}
