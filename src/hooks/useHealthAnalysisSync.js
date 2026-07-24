import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isHealthTestComplete } from '../data/healthTest'
import {
  appendHealthScoreHistory,
  needsHealthScoreRefresh,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'

/**
 * Kişisel sağlık analizi tamamlandığında YeniForm Sağlık Skoru üretir/kaydeder.
 */
export function useHealthAnalysisSync() {
  const { user, packageConfig, updateProfile } = useApp()
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
    if (!force && !needsHealthScoreRefresh(analysis, user.healthTest)) {
      return analysis
    }

    const key = `${user.id}:${user.healthTest ? Object.keys(user.healthTest).length : 0}`
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
      })
      const healthScoreHistory = appendHealthScoreHistory(user.healthScoreHistory, next)
      await updateProfile({ healthAnalysis: next, healthScoreHistory })
      lastKeyRef.current = key
      return next
    } catch (e) {
      setError(e?.message || 'Skor hesaplanamadı')
      return null
    } finally {
      runningRef.current = false
      setLoading(false)
    }
  }, [user, packageConfig, complete, analysis, updateProfile])

  useEffect(() => {
    if (!complete) return
    if (!needsHealthScoreRefresh(analysis, user?.healthTest)) return
    runSync()
  }, [complete, analysis, user?.healthTest, runSync])

  return {
    analysis,
    history,
    loading,
    error,
    complete,
  }
}
