import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isHealthTestComplete } from '../data/healthTest'
import {
  appendHealthScoreHistory,
  needsInitialHealthAnalysis,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'

/**
 * Kişisel sağlık analizi tamamlandığında staff-only skor + brief üretir (bir kez).
 * Otomatik yeniden üretim yok — fingerprint değişiminde personel butonu kullanılır.
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
