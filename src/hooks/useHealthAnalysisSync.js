import { useEffect, useRef } from 'react'
import { isHealthTestComplete } from '../data/healthTest'
import { isHealthAnalysisStale } from '../services/aiAnalysis'
import { syncMemberHealthAssets } from '../services/memberHealthSync'

/** Sağlık testi tamam ama özet yoksa veya eski şemadaysa otomatik üretir. */
export function useHealthAnalysisSync({ user, exercises, myPrograms, updateProfile, createProgram }) {
  const syncing = useRef(false)
  const libraryCount = exercises?.length ?? 0

  useEffect(() => {
    if (!user?.id || syncing.current) return
    if (!isHealthTestComplete(user.healthTest, user.gender)) return

    const hasSummary =
      user.healthAnalysis?.generatedAt &&
      user.healthAnalysis?.dietitianRecommendations?.aiGenerated &&
      (user.healthAnalysis?.coachRecommendations?.exercises?.length ||
        user.healthAnalysis?.dietitianRecommendations?.tips?.length)

    const stale = isHealthAnalysisStale(user.healthAnalysis, libraryCount)

    if (hasSummary && !stale) return

    syncing.current = true
    syncMemberHealthAssets({
      user,
      exercises,
      updateProfile,
      createProgram,
      myPrograms,
    })
      .catch(() => {})
      .finally(() => {
        syncing.current = false
      })
  }, [
    user?.id,
    user?.healthTest,
    user?.healthAnalysis,
    user?.healthAnalysis?.version,
    libraryCount,
    myPrograms?.length,
    updateProfile,
    createProgram,
  ])
}
