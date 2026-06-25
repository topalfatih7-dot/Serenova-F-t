import { useEffect, useRef } from 'react'
import { isHealthTestComplete } from '../data/healthTest'
import { syncMemberHealthAssets } from '../services/memberHealthSync'

/** Sağlık testi tamam ama özet yoksa otomatik üretir. */
export function useHealthAnalysisSync({ user, exercises, myPrograms, updateProfile, createProgram }) {
  const syncing = useRef(false)

  useEffect(() => {
    if (!user?.id || syncing.current) return
    if (!isHealthTestComplete(user.healthTest, user.gender)) return
    const hasSummary =
      user.healthAnalysis?.generatedAt &&
      (user.healthAnalysis?.coachRecommendations?.exercises?.length ||
        user.healthAnalysis?.dietitianRecommendations?.mealPlan?.length)
    if (hasSummary) return

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
  }, [user?.id, user?.healthTest, user?.healthAnalysis, exercises?.length, myPrograms?.length, updateProfile, createProgram])
}
