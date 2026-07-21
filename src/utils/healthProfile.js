/** Sağlık testi cevaplarından profil alanlarını türetir. */

import { ageFromBirthDate } from './birthDate'
import { normalizeHealthTestForAnalysis } from '../data/healthTest'

export function inferGoalsFromHealthTest(healthTest = {}) {
  const ht = normalizeHealthTestForAnalysis(healthTest)
  const goals = new Set()
  const habits = ht.eatingHabits || []

  if (habits.includes('fast_food') || habits.includes('night_snack') || habits.includes('skip_meals')) {
    goals.add('weight')
    goals.add('habit')
  }
  if (habits.includes('emotional')) {
    goals.add('habit')
    goals.add('confidence')
  }
  if (
    ht.stressLevel === 'high'
    || ht.sleepQuality === 'poor'
    || ht.sleepQuality === 'very_poor'
  ) {
    goals.add('sleep')
  }
  const goalReasons = Array.isArray(ht.primaryGoalReason)
    ? ht.primaryGoalReason
    : (ht.primaryGoalReason ? [ht.primaryGoalReason] : [])
  if (goalReasons.includes('weight_loss')) goals.add('weight')
  if (goalReasons.includes('muscle')) goals.add('muscle')
  if (goalReasons.includes('sport')) goals.add('performance')
  if (goalReasons.includes('energy') || goalReasons.includes('feel_better')) {
    goals.add('habit')
  }
  if (ht.activityFrequency === 'sedentary' || ht.sittingHours === '8+') {
    goals.add('habit')
    goals.add('heart')
  }
  if (ht.activityFrequency === 'active' || ht.activityFrequency === 'moderate') {
    goals.add('endurance')
  }
  if ((ht.chronicConditions || []).includes('heart') || (ht.chronicConditions || []).includes('hypertension')) {
    goals.add('heart')
  }
  if ((ht.chronicConditions || []).includes('diabetes')) {
    goals.add('weight')
  }
  if (ht.wellbeing === '1' || ht.wellbeing === '2') {
    goals.add('confidence')
    goals.add('habit')
  }
  if (ht.teaCoffee === 'high') {
    goals.add('sleep')
    goals.add('habit')
  }
  if (ht.travelFrequency === 'weekly' || ht.travelFrequency === 'monthly') {
    goals.add('habit')
  }
  if (ht.substanceUse === 'regular' || ht.substanceUse === 'occasional') {
    goals.add('habit')
    goals.add('sleep')
  }

  if (goals.size === 0) goals.add('habit')
  return [...goals]
}

export function inferFitnessLevelFromHealthTest(healthTest = {}) {
  const ht = normalizeHealthTestForAnalysis(healthTest)
  const map = {
    sedentary: 'beginner',
    light: 'beginner',
    moderate: 'intermediate',
    active: 'advanced',
  }
  return map[ht.activityFrequency] || 'beginner'
}

export function inferNutritionPrefsFromHealthTest(healthTest = {}) {
  const ht = normalizeHealthTestForAnalysis(healthTest)
  const prefs = []
  const allergyText = [
    Array.isArray(ht.foodAllergies) ? ht.foodAllergies.join(' ') : ht.foodAllergies,
    ht.foodAllergiesDetail,
    ht.dietFoodAllergiesDetail,
  ].filter(Boolean).join(' ').toLowerCase()
  if (allergyText.includes('gluten')) prefs.push('gluten-free')
  if (allergyText.includes('laktoz') || allergyText.includes('süt')) prefs.push('balanced')
  if ((ht.eatingHabits || []).includes('regular')) prefs.push('balanced')
  if (prefs.length === 0) prefs.push('balanced')
  return prefs
}

/**
 * Analiz / AI program için profilde gerçekten girilmiş olması gereken alanlar.
 * Eksikse varsayılan (70 kg / 170 cm / 30 yaş) kullanılır — bu yüzden uyarı gösterilir.
 */
export function getMissingAnalysisProfileFields(profile = {}) {
  const missing = []
  const hasAge = Boolean(profile.birthDate) || (profile.age != null && Number(profile.age) > 0)
  const weight = parseFloat(profile.weight)
  const height = parseFloat(profile.height)

  if (!hasAge) missing.push({ key: 'birthDate', label: 'Doğum tarihi' })
  if (!weight || weight < 30) missing.push({ key: 'weight', label: 'Kilo' })
  if (!height || height < 120) missing.push({ key: 'height', label: 'Boy' })
  if (!profile.gender) missing.push({ key: 'gender', label: 'Cinsiyet' })

  return missing
}

export function hasCompleteAnalysisProfile(profile) {
  return getMissingAnalysisProfileFields(profile).length === 0
}

/** Analiz için eksik profil alanlarını sağlık testinden tamamlar. */
export function enrichProfileForAnalysis(profile) {
  const ht = profile?.healthTest || {}
  const goals = profile?.goals?.length ? profile.goals : inferGoalsFromHealthTest(ht)
  const fitnessLevel =
    profile?.fitnessLevel && profile.fitnessLevel !== 'beginner'
      ? profile.fitnessLevel
      : inferFitnessLevelFromHealthTest(ht)
  const nutritionPrefs = profile?.nutritionPrefs?.length
    ? profile.nutritionPrefs
    : inferNutritionPrefsFromHealthTest(ht)

  const age = profile?.birthDate ? ageFromBirthDate(profile.birthDate) : profile?.age
  const weight = profile?.weight || 70
  const height = profile?.height || 170
  const estimatedMetrics = !hasCompleteAnalysisProfile({
    ...profile,
    age,
    weight: profile?.weight,
    height: profile?.height,
  })

  return {
    ...profile,
    goals,
    fitnessLevel,
    nutritionPrefs,
    age: age || 30,
    weight,
    height,
    estimatedMetrics,
  }
}
