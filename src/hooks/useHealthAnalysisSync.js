import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isDetailedHealthTestComplete } from '../data/healthTest'
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '../data/coreHealthTest'
import {
  appendHealthScoreHistory,
  buildHealthAnalysisFingerprint,
  isHealthAnalysisStale,
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
  /** 423 kilit — aynı fingerprint için tekrar AI çağrısı yok */
  const lockedFingerprintRef = useRef('')

  const analysis = user?.healthAnalysis || null
  const history = user?.healthScoreHistory || []
  const userId = user?.id || null
  const gender = user?.gender || null
  const healthAck = Boolean(user?.healthAck)
  const disclaimer = Boolean(user?.disclaimer)
  const analysisFingerprint = analysis?.sourceFingerprint || ''
  const analysisOverall = analysis?.overallScore
  const analysisStageRaw = analysis?.analysisStage || ''

  const healthTest = user?.healthTest
  const birthDate = user?.birthDate
  const weight = user?.weight
  const height = user?.height
  const goals = user?.goals
  const fitnessLevel = user?.fitnessLevel
  const nutritionPrefs = user?.nutritionPrefs

  const profileFingerprint = useMemo(() => {
    if (!userId) return ''
    return buildHealthAnalysisFingerprint({
      healthTest,
      birthDate,
      weight,
      height,
      goals,
      fitnessLevel,
      nutritionPrefs,
      gender,
    })
  }, [
    userId,
    gender,
    healthTest,
    birthDate,
    weight,
    height,
    goals,
    fitnessLevel,
    nutritionPrefs,
  ])

  const coreComplete = Boolean(
    userId
    && healthAck
    && disclaimer
    && gender
    && isCoreHealthTestComplete(user?.healthTest, gender),
  )

  const coreKeys = gender ? getCoreHealthTestKeySet(gender) : new Set()
  const detailedComplete = Boolean(
    coreComplete
    && isDetailedHealthTestComplete(
      user?.healthTest,
      gender,
      packageConfig,
      coreKeys,
    ),
  )

  const analysisStage = resolveAnalysisStage(analysis, detailedComplete)

  const runSync = useCallback(async ({ force = false, stage = null } = {}) => {
    if (!userId || !coreComplete || !user) return null
    if (runningRef.current) return analysis

    const stale = isHealthAnalysisStale(analysis, user)
    const targetStage = stage
      || (needsDetailedHealthAnalysis(analysis, detailedComplete)
        ? 'detailed'
        : (stale && detailedComplete ? 'detailed' : 'core'))

    if (targetStage === 'core' && !force && !needsInitialHealthAnalysis(analysis) && !stale) {
      // Çekirdek analiz var; detaylı gerekmiyorsa çık
      if (!needsDetailedHealthAnalysis(analysis, detailedComplete)) {
        return analysis
      }
    }
    if (
      targetStage === 'detailed'
      && !force
      && !needsDetailedHealthAnalysis(analysis, detailedComplete)
      && !stale
    ) {
      return analysis
    }
    if (targetStage === 'detailed' && !detailedComplete) return analysis

    const currentFp = profileFingerprint || analysisFingerprint || 'none'
    if (!force && lockedFingerprintRef.current && lockedFingerprintRef.current === currentFp) {
      return analysis
    }

    const key = `${userId}:${targetStage}:${analysisFingerprint || 'none'}`
    if (
      !force
      && !stale
      && lastKeyRef.current === key
      && analysisOverall != null
      && (targetStage !== 'detailed' || analysisStageRaw === 'detailed')
    ) {
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
      lockedFingerprintRef.current = ''
      if (!analysis?.overallScore || targetStage === 'detailed' || stale) {
        trackGa4Event('health_test_complete', {
          has_scores: next?.overallScore != null,
          stage: targetStage,
          trial: false,
          unpaid: Boolean(isUnpaidMember),
        })
      }
      return next
    } catch (e) {
      if (e?.code === 'health_analysis_locked') {
        lockedFingerprintRef.current = currentFp
        lastKeyRef.current = key
        setError(e.message || 'Sağlık testi kilitli')
        return null
      }
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
    user, userId, packageConfig, coreComplete, detailedComplete, analysis,
    profileFingerprint, analysisFingerprint, analysisOverall, analysisStageRaw,
    updateProfile, isUnpaidMember,
  ])

  // Çekirdek (1.) analiz otomatik değil — kullanıcı "Analizi Başlat" tuşuna basmalı.
  // Detaylı (2.) analiz opsiyonel sorular bitince otomatik tetiklenir.
  // Retake sonrası fingerprint stale ise detaylı tamamlanınca yeniden üretir.
  useEffect(() => {
    if (!coreComplete || !userId) return
    if (needsInitialHealthAnalysis(analysis)) return
    const stale = Boolean(
      profileFingerprint
      && analysisFingerprint
      && profileFingerprint !== analysisFingerprint,
    ) || (analysis && !analysisFingerprint)
    if (lockedFingerprintRef.current
      && lockedFingerprintRef.current === (profileFingerprint || analysisFingerprint || 'none')) {
      return undefined
    }
    let cancelled = false
    const kick = () => {
      queueMicrotask(() => {
        if (cancelled) return
        void runSync({ stage: 'detailed' })
      })
    }
    if (needsDetailedHealthAnalysis(analysis, detailedComplete)) {
      kick()
      return () => { cancelled = true }
    }
    if (detailedComplete && stale) {
      kick()
      return () => { cancelled = true }
    }
    return undefined
  }, [
    coreComplete,
    detailedComplete,
    userId,
    profileFingerprint,
    analysisFingerprint,
    analysisOverall,
    analysisStageRaw,
    analysis,
    runSync,
  ])

  // Eski kayıtlarda analysisStage yoksa bir kez etiketle (AI çağrısı yok)
  useEffect(() => {
    if (!userId || !analysis || needsInitialHealthAnalysis(analysis)) return
    if (analysis.analysisStage === 'core' || analysis.analysisStage === 'detailed') return
    const inferred = resolveAnalysisStage(analysis, detailedComplete)
    if (!inferred) return
    updateProfile({ healthAnalysis: { ...analysis, analysisStage: inferred } }).catch(() => {})
  }, [userId, analysis, detailedComplete, updateProfile])

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
