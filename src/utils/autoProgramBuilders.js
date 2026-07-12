/**
 * Otomatik antrenman / diyet programı payload yardımcıları (takvim uyumlu).
 * Koç hareketleri YALNIZCA exercises kütüphanesinden (exerciseId zorunlu).
 */
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'

/** Basic / AI otomatik plan süresi (gün) */
export const AUTO_PLAN_LENGTH = 15

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

function autoPlanWindow() {
  const start = format(new Date(), 'yyyy-MM-dd')
  const end = format(addDays(new Date(`${start}T12:00:00`), AUTO_PLAN_LENGTH - 1), 'yyyy-MM-dd')
  return { startDate: start, endDate: end, cycleLength: AUTO_PLAN_LENGTH }
}

function formatRangeLabel(startDate, endDate) {
  const a = format(new Date(`${startDate}T12:00:00`), 'd MMM', { locale: tr })
  const b = format(new Date(`${endDate}T12:00:00`), 'd MMM yyyy', { locale: tr })
  return `${a} – ${b}`
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

/**
 * AI çıktısından koç programı — yalnızca exerciseById’de bulunan kütüphane hareketleri.
 */
export function buildWorkoutProgramFromAi({ memberId, memberName, workout, exerciseById }) {
  const { startDate, endDate, cycleLength } = autoPlanWindow()
  const entries = []
  let order = 0
  for (const slot of workout?.days || []) {
    const day = Number(slot.day)
    if (!Number.isFinite(day) || day < 0 || day > 6) continue
    for (const ex of slot.exercises || []) {
      const id = String(ex?.id || '').trim()
      const lib = id ? exerciseById.get(id) : null
      if (!lib?.id || !String(lib.name || '').trim()) continue
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

  const range = formatRangeLabel(startDate, endDate)
  return {
    type: 'workout',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: `15 Günlük Otomatik Antrenman Programı (${range})`,
    description: workout?.message || 'Kütüphaneden seçilmiş kişisel antrenman programı',
    scheduleType: 'dateRange',
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    cycleSameDaily: false,
    source: 'auto_ai',
    entries,
    items: entries.map((e) => {
      const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
      return `${e.exerciseName} · ${amount}`
    }),
  }
}

/** Kural tabanlı yedek — yine yalnızca kütüphane id’leri */
export function buildWorkoutProgramFromLibrary({ memberId, memberName, exercises, message, fitnessLevel }) {
  const days = workoutDaysForLevel(fitnessLevel)
  const list = (exercises || []).filter((ex) => ex?.id && String(ex.name || '').trim())
  if (list.length === 0) return null

  const { startDate, endDate, cycleLength } = autoPlanWindow()
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

  const range = formatRangeLabel(startDate, endDate)
  return {
    type: 'workout',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: `15 Günlük Otomatik Antrenman Programı (${range})`,
    description: message || 'Kütüphaneden seçilmiş başlangıç antrenman programı',
    scheduleType: 'dateRange',
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    cycleSameDaily: false,
    source: 'auto_rules',
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

  const { startDate, endDate, cycleLength } = autoPlanWindow()
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

  const range = formatRangeLabel(startDate, endDate)
  return {
    type: 'nutrition',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: `15 Günlük Otomatik Beslenme Listesi (${range})`,
    description: focus || (aiGenerated ? 'AI destekli kişisel beslenme listesi' : 'Profilinize göre hazırlanan başlangıç menüsü'),
    scheduleType: 'dateRange',
    cycleStartDate: startDate,
    cycleLength,
    cycleLoop: false,
    cycleSameDaily: true,
    source: aiGenerated ? 'auto_ai' : 'auto_rules',
    entries,
    items: entries.map((e) => `${e.start} ${e.mealType}: ${e.name}`),
  }
}

export function isAutoSystemProgram(program) {
  if (!program) return false
  if (program.source === 'auto_ai' || program.source === 'auto_rules') return true
  if (program.staffId) return false
  const title = String(program.title || '')
  return /otomatik/i.test(title) || program.staffName === 'Yeni Form'
}
