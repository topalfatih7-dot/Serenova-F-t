import { useEffect, useRef } from 'react'
import { isHealthTestComplete } from '../data/healthTest'
import { isHealthAnalysisStale } from '../services/aiAnalysis'
import { fetchExercisesForAi } from '../services/exerciseLibrary'
import { syncMemberHealthAssets } from '../services/memberHealthSync'

/** Sağlık testi tamam ama özet yoksa veya eski şemadaysa otomatik üretir. */
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

    if (hasSummary && !stale) return

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
