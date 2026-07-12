import { useEffect, useRef } from 'react'
import { isHealthTestComplete } from '../data/healthTest'
import { isHealthAnalysisStale } from '../services/aiAnalysis'
import { fetchExercisesForAi } from '../services/exerciseLibrary'
import { syncMemberHealthAssets } from '../services/memberHealthSync'

function programType(p) {
  return p?.type || (p?.entries?.some((e) => e.mealType) ? 'nutrition' : 'workout')
}

function needsAutoPrograms(myPrograms = []) {
  const list = myPrograms || []
  const hasWorkout = list.some((p) => programType(p) === 'workout')
  const hasNutrition = list.some((p) => programType(p) === 'nutrition')
  return !hasWorkout || !hasNutrition
}

/** Sağlık testi tamam ama özet yoksa, eski şemadaysa veya otomatik program eksikse üretir. */
export function useHealthAnalysisSync({ user, exerciseCount = 0, myPrograms, updateProfile, createProgram }) {
  const syncing = useRef(false)
  const libraryCount = exerciseCount

  useEffect(() => {
    if (!user?.id || syncing.current) return
    if (!isHealthTestComplete(user.healthTest, user.gender, user.packageConfig)) return

    const hasSummary =
      user.healthAnalysis?.generatedAt &&
      user.healthAnalysis?.dietitianRecommendations?.aiGenerated &&
      (user.healthAnalysis?.coachRecommendations?.exercises?.length ||
        user.healthAnalysis?.dietitianRecommendations?.tips?.length)

    const stale = isHealthAnalysisStale(user.healthAnalysis, libraryCount)
    const missingPrograms = needsAutoPrograms(myPrograms)

    if (hasSummary && !stale && !missingPrograms) return

    syncing.current = true
    ;(async () => {
      const exercises = await fetchExercisesForAi()
      await syncMemberHealthAssets({
        user,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
    })().finally(() => {
      syncing.current = false
    })
  }, [
    user,
    libraryCount,
    myPrograms,
    updateProfile,
    createProgram,
  ])
}
