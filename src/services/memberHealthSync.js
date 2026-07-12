import { generateHealthAnalysis, isHealthAnalysisStale, selectExerciseCandidates } from './aiAnalysis'
import { isHealthTestComplete } from '../data/healthTest'
import { enrichProfileForAnalysis } from '../utils/healthProfile'
import { fetchAiNutritionTips } from './aiNutritionTips'
import { fetchAiAutoPrograms } from './aiAutoPrograms'
import { fetchExercisesForAi } from './exerciseLibrary'
import {
  workoutDaysForLevel,
  buildFallbackNutritionMeals,
  buildWorkoutProgramFromAi,
  buildWorkoutProgramFromLibrary,
  buildNutritionProgramFromMeals,
} from '../utils/autoProgramBuilders'

export function profileReadyForAnalysis(profile) {
  return isHealthTestComplete(profile?.healthTest, profile?.gender, profile?.packageConfig)
}

function buildHealthTestSummary(insights = []) {
  return (insights || []).slice(0, 10).join('\n')
}

function programType(p) {
  return p?.type || (p?.entries?.some((e) => e.mealType) ? 'nutrition' : 'workout')
}

/**
 * Basic / otomatik: antrenman + diyet programlarını oluşturur.
 * Gemini başarılıysa katalog kısıtlı plan; değilse kural + şablon yedek.
 * Eksik tarafı tamamlar (çift workout üretmez).
 */
export async function createAutoProgramsForMember({
  memberId,
  memberName,
  healthAnalysis,
  createProgram,
  myPrograms = [],
  exercises = [],
  profile = null,
}) {
  if (!memberId || !healthAnalysis) return { created: [] }

  const existing = myPrograms || []
  const needsWorkout = !existing.some((p) => programType(p) === 'workout')
  const needsNutrition = !existing.some((p) => programType(p) === 'nutrition')
  if (!needsWorkout && !needsNutrition) return { created: [] }

  const enriched = profile || {}
  const fitnessLevel = enriched.fitnessLevel || 'beginner'
  const workoutDays = workoutDaysForLevel(fitnessLevel)
  const dailyCalories = healthAnalysis.dailyCalories?.recommended || null
  const candidates = selectExerciseCandidates(enriched, exercises, 60)
  const exerciseById = new Map(
    (exercises || [])
      .filter((ex) => ex?.id)
      .map((ex) => [ex.id, ex]),
  )
  candidates.forEach((ex) => {
    if (!exerciseById.has(ex.id)) exerciseById.set(ex.id, ex)
  })

  let aiWorkout = null
  let aiNutrition = null

  if (candidates.length >= 3) {
    const ai = await fetchAiAutoPrograms({
      profile: {
        age: enriched.age,
        gender: enriched.gender,
        height: enriched.height,
        weight: enriched.weight,
        goals: enriched.goals,
        nutritionPrefs: enriched.nutritionPrefs,
        fitnessLevel,
      },
      healthTestSummary: buildHealthTestSummary(healthAnalysis.healthTestInsights),
      candidates: candidates.map((ex) => ({
        id: ex.id,
        name: ex.name,
        difficulty: ex.difficulty,
        equipment: ex.equipment,
        targetMuscle: ex.targetMuscle,
        movementCategory: ex.movementCategory,
      })),
      workoutDays,
      dailyCalories,
    })
    if (ai.ok) {
      aiWorkout = ai.workout
      aiNutrition = ai.nutrition
    }
  }

  const created = []

  if (needsWorkout) {
    let workoutPayload = aiWorkout
      ? buildWorkoutProgramFromAi({
        memberId,
        memberName,
        workout: aiWorkout,
        exerciseById,
      })
      : null

    if (!workoutPayload) {
      const exList = (healthAnalysis.coachRecommendations?.exercises || [])
        .filter((ex) => ex?.id && String(ex.name || '').trim())
      workoutPayload = buildWorkoutProgramFromLibrary({
        memberId,
        memberName,
        exercises: exList,
        message: healthAnalysis.coachRecommendations?.message || '',
        fitnessLevel,
      })
    }

    if (workoutPayload) {
      const p = await createProgram(workoutPayload)
      if (p) created.push(p)
    }
  }

  if (needsNutrition) {
    const meals = aiNutrition?.meals?.length >= 3
      ? aiNutrition.meals
      : buildFallbackNutritionMeals(enriched, dailyCalories)

    const nutritionPayload = buildNutritionProgramFromMeals({
      memberId,
      memberName,
      meals,
      focus: aiNutrition?.focus || '',
      aiGenerated: Boolean(aiNutrition?.meals?.length >= 3),
    })

    if (nutritionPayload) {
      const p = await createProgram(nutritionPayload)
      if (p) created.push(p)
    }
  }

  return { created, aiGenerated: Boolean(aiWorkout && aiNutrition) }
}

export async function syncMemberHealthAssets({
  user,
  exercises,
  updateProfile,
  createProgram,
  myPrograms = [],
}) {
  if (!user?.id) return { synced: false }
  if (!isHealthTestComplete(user.healthTest, user.gender, user.packageConfig)) return { synced: false, reason: 'test' }
  if (!profileReadyForAnalysis(user)) return { synced: false, reason: 'profile' }

  const enriched = enrichProfileForAnalysis(user)
  const exList = exercises?.length ? exercises : await fetchExercisesForAi()
  const healthAnalysis = generateHealthAnalysis(enriched, exList)

  const aiNutrition = await fetchAiNutritionTips({
    profile: {
      age: enriched.age,
      gender: enriched.gender,
      height: enriched.height,
      weight: enriched.weight,
      goals: enriched.goals,
      nutritionPrefs: enriched.nutritionPrefs,
      fitnessLevel: enriched.fitnessLevel,
    },
    healthTestSummary: buildHealthTestSummary(healthAnalysis.healthTestInsights),
  })

  if (aiNutrition.ok) {
    healthAnalysis.dietitianRecommendations = {
      tips: aiNutrition.tips,
      focus: aiNutrition.focus,
      aiGenerated: true,
    }
  }

  await updateProfile({ healthAnalysis })

  await createAutoProgramsForMember({
    memberId: user.id,
    memberName: user.name,
    healthAnalysis,
    createProgram,
    myPrograms,
    exercises: exList,
    profile: enriched,
  })

  return { synced: true, refreshed: isHealthAnalysisStale(user.healthAnalysis, (exList || []).length) }
}
