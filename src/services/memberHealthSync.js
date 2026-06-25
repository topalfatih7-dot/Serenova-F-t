import { generateHealthAnalysis } from './aiAnalysis'
import { isHealthTestComplete } from '../data/healthTest'

export function profileReadyForAnalysis(profile) {
  return Boolean(
    profile?.weight &&
    profile?.height &&
    profile?.age &&
    Array.isArray(profile?.goals) &&
    profile.goals.length > 0,
  )
}

export async function createAutoProgramsForMember({ memberId, memberName, healthAnalysis, createProgram }) {
  if (!memberId || !healthAnalysis) return

  const dayRotation = [1, 3, 5]
  const exList = healthAnalysis.coachRecommendations?.exercises || []
  if (exList.length > 0) {
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

  const mealPlan = healthAnalysis.dietitianRecommendations?.mealPlan || []
  if (mealPlan.length > 0) {
    await createProgram({
      type: 'nutrition',
      memberId,
      memberName,
      staffId: null,
      staffName: 'Yeni Form',
      title: 'Otomatik Beslenme Programı',
      description: healthAnalysis.dietitianRecommendations?.message || '',
      entries: [],
      items: mealPlan.map((m) => `${m.meal}: ${m.suggestion}`),
    })
  }
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

  const healthAnalysis = generateHealthAnalysis(user, exercises || [])
  await updateProfile({ healthAnalysis })

  if ((myPrograms || []).length === 0) {
    await createAutoProgramsForMember({
      memberId: user.id,
      memberName: user.name,
      healthAnalysis,
      createProgram,
    })
  }

  return { synced: true, refreshed: Boolean(user.healthAnalysis) }
}
