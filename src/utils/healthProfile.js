/** Sağlık testi cevaplarından profil alanlarını türetir. */

import { ageFromBirthDate } from './birthDate'

export function inferGoalsFromHealthTest(healthTest = {}) {
  const goals = new Set()
  const habits = healthTest.eatingHabits || []

  if (habits.includes('fast_food') || habits.includes('night_snack') || habits.includes('skip_meals')) {
    goals.add('weight')
    goals.add('habit')
  }
  if (habits.includes('emotional')) {
    goals.add('habit')
    goals.add('confidence')
  }
  if (healthTest.stressLevel === 'high' || healthTest.sleepQuality === 'poor') {
    goals.add('sleep')
  }
  if (healthTest.activityFrequency === 'sedentary' || healthTest.sittingHours === '8+') {
    goals.add('habit')
    goals.add('heart')
  }
  if (healthTest.activityFrequency === 'active' || healthTest.activityFrequency === 'moderate') {
    goals.add('endurance')
  }
  if ((healthTest.chronicConditions || []).includes('heart') || (healthTest.chronicConditions || []).includes('hypertension')) {
    goals.add('heart')
  }
  if ((healthTest.chronicConditions || []).includes('diabetes')) {
    goals.add('weight')
  }
  if (healthTest.wellbeing === '1' || healthTest.wellbeing === '2') {
    goals.add('confidence')
    goals.add('habit')
  }
  if (healthTest.teaCoffee === 'high') {
    goals.add('sleep')
    goals.add('habit')
  }
  if (healthTest.travelFrequency === 'weekly' || healthTest.travelFrequency === 'monthly') {
    goals.add('habit')
  }
  if (healthTest.substanceUse === 'regular' || healthTest.substanceUse === 'occasional') {
    goals.add('habit')
    goals.add('sleep')
  }

  if (goals.size === 0) goals.add('habit')
  return [...goals]
}

export function inferFitnessLevelFromHealthTest(healthTest = {}) {
  const map = {
    sedentary: 'beginner',
    light: 'beginner',
    moderate: 'intermediate',
    active: 'advanced',
  }
  return map[healthTest.activityFrequency] || 'beginner'
}

export function inferNutritionPrefsFromHealthTest(healthTest = {}) {
  const prefs = []
  const allergies = String(healthTest.foodAllergies || '').toLowerCase()
  if (allergies.includes('gluten')) prefs.push('gluten-free')
  if (allergies.includes('laktoz') || allergies.includes('süt')) prefs.push('balanced')
  if ((healthTest.eatingHabits || []).includes('regular')) prefs.push('balanced')
  if (prefs.length === 0) prefs.push('balanced')
  return prefs
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
  const estimatedMetrics = !((profile?.birthDate || profile?.age) && profile?.weight && profile?.height)

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
