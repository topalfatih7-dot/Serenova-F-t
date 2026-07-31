import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isHealthTestComplete } from '../data/healthTest'
import {
  appendHealthScoreHistory,
  needsInitialHealthAnalysis,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'
import { trackGa4Event } from '../utils/ga4Loader'

/**
 * Sağlık testi tamamlandığında skor + analiz üretir.
 * Ücretsiz ve ücretli üyelikte çalışır; üye UI'si skor-only gösterebilir.
 */
export function useHealthAnalysisSync() {
  const { user, packageConfig, updateProfile, isUnpaidMember } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const runningRef = useRef(false)
  const lastKeyRef = useRef('')

  const analysis = user?.healthAnalysis || null
  const history = user?.healthScoreHistory || []
  const complete = Boolean(
    user?.id
    && user?.healthAck
    && user?.disclaimer
    && isHealthTestComplete(user.healthTest, user.gender, packageConfig),
  )

  const runSync = useCallback(async ({ force = false } = {}) => {
    if (!user?.id || !complete) return null
    if (runningRef.current) return analysis
    if (!force && !needsInitialHealthAnalysis(analysis)) {
      return analysis
    }

    const key = `${user.id}:initial`
    if (!force && lastKeyRef.current === key && analysis?.overallScore != null) {
      return analysis
    }

    runningRef.current = true
    setLoading(true)
    setError(null)
    try {
      const next = await resolveHealthScoreAnalysis({
        ...user,
        packageConfig,
      }, { force })
      const healthScoreHistory = appendHealthScoreHistory(user.healthScoreHistory, next)
      await updateProfile({ healthAnalysis: next, healthScoreHistory })
      lastKeyRef.current = key
      if (!analysis?.overallScore) {
        trackGa4Event('health_test_complete', {
          has_scores: next?.overallScore != null,
          trial: false,
          unpaid: Boolean(isUnpaidMember),
        })
      }
      return next
    } catch (e) {
      setError(e?.message || 'Skor hesaplanamadı')
      return null
    } finally {
      runningRef.current = false
      setLoading(false)
    }
  }, [user, packageConfig, complete, analysis, updateProfile, isUnpaidMember])

  useEffect(() => {
    if (!complete) return
    if (!needsInitialHealthAnalysis(analysis)) return
    runSync()
  }, [complete, analysis, runSync])

  return {
    analysis,
    history,
    loading,
    error,
    complete,
    runSync,
  }
}
