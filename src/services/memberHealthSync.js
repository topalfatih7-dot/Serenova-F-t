import { generateHealthAnalysis, isHealthAnalysisStale } from './aiAnalysis'
import { isHealthTestComplete } from '../data/healthTest'
import { enrichProfileForAnalysis } from '../utils/healthProfile'
import { fetchAiNutritionTips } from './aiNutritionTips'

export function profileReadyForAnalysis(profile) {
  return isHealthTestComplete(profile?.healthTest, profile?.gender)
}

function buildHealthTestSummary(insights = []) {
  return (insights || []).slice(0, 10).join('\n')
}

export async function createAutoProgramsForMember({ memberId, memberName, healthAnalysis, createProgram }) {
  if (!memberId || !healthAnalysis) return

  const dayRotation = [1, 3, 5]
  const exList = (healthAnalysis.coachRecommendations?.exercises || [])
    .filter((ex) => ex?.id && String(ex.name || '').trim())
  if (exList.length === 0) return

  const workoutEntries = exList.map((ex, i) => ({
    id: `auto-${Date.now()}-${i}`,
    day: dayRotation[i % dayRotation.length],
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
  }))
  await createProgram({
    type: 'workout',
    memberId,
    memberName,
    staffId: null,
    staffName: 'Yeni Form',
    title: 'Otomatik Antrenman Programı',
    description: healthAnalysis.coachRecommendations?.message || '',
    entries: workoutEntries,
    items: workoutEntries.map((e) => `${e.exerciseName} · ${e.amount} tekrar`),
  })
}

export async function syncMemberHealthAssets({
  user,
  exercises,
  updateProfile,
  createProgram,
  myPrograms = [],
}) {
  if (!user?.id) return { synced: false }
  if (!isHealthTestComplete(user.healthTest, user.gender)) return { synced: false, reason: 'test' }
  if (!profileReadyForAnalysis(user)) return { synced: false, reason: 'profile' }

  const enriched = enrichProfileForAnalysis(user)
  const healthAnalysis = generateHealthAnalysis(enriched, exercises || [])

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

  const shouldCreatePrograms = (myPrograms || []).length === 0
  if (shouldCreatePrograms) {
    await createAutoProgramsForMember({
      memberId: user.id,
      memberName: user.name,
      healthAnalysis,
      createProgram,
    })
  }

  return { synced: true, refreshed: isHealthAnalysisStale(user.healthAnalysis, (exercises || []).length) }
}
