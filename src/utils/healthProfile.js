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
  if (ht.stressLevel === 'high' || ht.sleepQuality === 'poor') {
    goals.add('sleep')
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
  const allergies = String(ht.foodAllergies || '').toLowerCase()
  if (allergies.includes('gluten')) prefs.push('gluten-free')
  if (allergies.includes('laktoz') || allergies.includes('süt')) prefs.push('balanced')
  if ((ht.eatingHabits || []).includes('regular')) prefs.push('balanced')
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
