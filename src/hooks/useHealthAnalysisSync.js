import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isDetailedHealthTestComplete } from '../data/healthTest'
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '../data/coreHealthTest'
import {
  appendHealthScoreHistory,
  needsDetailedHealthAnalysis,
  needsInitialHealthAnalysis,
  resolveAnalysisStage,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'
import { trackGa4Event } from '../utils/ga4Loader'

/**
 * Çekirdek test bitince 1. analiz; opsiyonel sorular bitince 2. (detaylı) analiz.
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

  const coreComplete = Boolean(
    user?.id
    && user?.healthAck
    && user?.disclaimer
    && user?.gender
    && isCoreHealthTestComplete(user.healthTest, user.gender),
  )

  const coreKeys = user?.gender ? getCoreHealthTestKeySet(user.gender) : new Set()
  const detailedComplete = Boolean(
    coreComplete
    && isDetailedHealthTestComplete(
      user?.healthTest,
      user?.gender,
      packageConfig,
      coreKeys,
    ),
  )

  const analysisStage = resolveAnalysisStage(analysis, detailedComplete)

  const runSync = useCallback(async ({ force = false, stage = null } = {}) => {
    if (!user?.id || !coreComplete) return null
    if (runningRef.current) return analysis

    const targetStage = stage
      || (needsDetailedHealthAnalysis(analysis, detailedComplete)
        ? 'detailed'
        : 'core')

    if (targetStage === 'core' && !force && !needsInitialHealthAnalysis(analysis)) {
      // Çekirdek analiz var; detaylı gerekmiyorsa çık
      if (!needsDetailedHealthAnalysis(analysis, detailedComplete)) {
        return analysis
      }
    }
    if (targetStage === 'detailed' && !force && !needsDetailedHealthAnalysis(analysis, detailedComplete)) {
      return analysis
    }
    if (targetStage === 'detailed' && !detailedComplete) return analysis

    const key = `${user.id}:${targetStage}`
    if (!force && lastKeyRef.current === key && analysis?.overallScore != null
      && (targetStage !== 'detailed' || analysis?.analysisStage === 'detailed')) {
      return analysis
    }

    runningRef.current = true
    setLoading(true)
    setError(null)
    try {
      // force yalnızca açıkça istenirse (personel). Ücretsiz üyede API 403 verir.
      // Detaylı aşamada yeni cevaplar fingerprint'i değiştirir → force gerekmez.
      // Eski kayıt + zaten dolu HT (fingerprint aynı) → unchanged → stage etiketle.
      const next = await resolveHealthScoreAnalysis({
        ...user,
        packageConfig,
      }, {
        force: force === true,
        analysisStage: targetStage,
      })

      const healthScoreHistory = appendHealthScoreHistory(user.healthScoreHistory, next)
      await updateProfile({ healthAnalysis: next, healthScoreHistory })
      lastKeyRef.current = key
      if (!analysis?.overallScore || targetStage === 'detailed') {
        trackGa4Event('health_test_complete', {
          has_scores: next?.overallScore != null,
          stage: targetStage,
          trial: false,
          unpaid: Boolean(isUnpaidMember),
        })
      }
      return next
    } catch (e) {
      // Fingerprint değişmediyse (geriye dönük tam kayıt) yalnızca stage etiketle
      if (
        (e?.code === 'health_analysis_unchanged' || /değişmedi/i.test(e?.message || ''))
        && targetStage === 'detailed'
        && analysis
        && !needsInitialHealthAnalysis(analysis)
      ) {
        const patched = { ...analysis, analysisStage: 'detailed' }
        try {
          await updateProfile({ healthAnalysis: patched })
          lastKeyRef.current = key
          return patched
        } catch {
          /* fall through */
        }
      }
      setError(e?.message || 'Skor hesaplanamadı')
      return null
    } finally {
      runningRef.current = false
      setLoading(false)
    }
  }, [
    user, packageConfig, coreComplete, detailedComplete, analysis,
    updateProfile, isUnpaidMember,
  ])

  // Çekirdek (1.) analiz otomatik değil — kullanıcı "Analizi Başlat" tuşuna basmalı.
  // Detaylı (2.) analiz opsiyonel sorular bitince otomatik tetiklenir.
  useEffect(() => {
    if (!coreComplete) return
    if (needsInitialHealthAnalysis(analysis)) return
    if (needsDetailedHealthAnalysis(analysis, detailedComplete)) {
      runSync({ stage: 'detailed' })
    }
  }, [coreComplete, detailedComplete, analysis, runSync])

  // Eski kayıtlarda analysisStage yoksa bir kez etiketle (AI çağrısı yok)
  useEffect(() => {
    if (!user?.id || !analysis || needsInitialHealthAnalysis(analysis)) return
    if (analysis.analysisStage === 'core' || analysis.analysisStage === 'detailed') return
    const inferred = resolveAnalysisStage(analysis, detailedComplete)
    if (!inferred) return
    updateProfile({ healthAnalysis: { ...analysis, analysisStage: inferred } }).catch(() => {})
  }, [user?.id, analysis, detailedComplete, updateProfile])

  return {
    analysis,
    history,
    loading,
    error,
    complete: coreComplete,
    coreComplete,
    detailedComplete,
    analysisStage,
    runSync,
  }
}
