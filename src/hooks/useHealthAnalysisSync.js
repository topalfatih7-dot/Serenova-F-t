import { useEffect, useRef } from 'react'
import { isHealthTestComplete } from '../data/healthTest'
import { isHealthAnalysisStale, needsAiNutritionTips } from '../services/aiAnalysis'
import { fetchExercisesForAi } from '../services/exerciseLibrary'
import { isBasicAutoProgramEligible, syncMemberHealthAssets } from '../services/memberHealthSync'

function programType(p) {
  return p?.type || (p?.entries?.some((e) => e.mealType) ? 'nutrition' : 'workout')
}

function needsAutoPrograms(myPrograms = []) {
  const list = myPrograms || []
  const hasWorkout = list.some((p) => programType(p) === 'workout')
  const hasNutrition = list.some((p) => programType(p) === 'nutrition')
  return !hasWorkout || !hasNutrition
}

/** Sağlık özeti / Basic program eksikse arka planda üretir — UI’yi kilitlemez. */
export function useHealthAnalysisSync({ user, exerciseCount = 0, myPrograms, updateProfile, createProgram }) {
  const syncing = useRef(false)
  const libraryCount = exerciseCount

  useEffect(() => {
    if (!user?.id || syncing.current) return
    if (!isHealthTestComplete(user.healthTest, user.gender, user.packageConfig)) return

    const hasCoreSummary = Boolean(user.healthAnalysis?.generatedAt)
    const stale = isHealthAnalysisStale(user.healthAnalysis, libraryCount)
    const wantsAiTips = needsAiNutritionTips(user.healthAnalysis)
    const basicEligible = isBasicAutoProgramEligible(user)
    const missingPrograms = basicEligible && needsAutoPrograms(myPrograms)

    if (hasCoreSummary && !stale && !missingPrograms && !wantsAiTips) return

    syncing.current = true
    ;(async () => {
      const exercises = await fetchExercisesForAi()
      // Özet varsa yalnızca eksik parçayı doldur; ölçü/AI spam’ini azalt
      const skipAi = hasCoreSummary && !wantsAiTips && !stale
      const skipPrograms = !missingPrograms
      await syncMemberHealthAssets({
        user,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
        skipAi,
        skipPrograms,
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
