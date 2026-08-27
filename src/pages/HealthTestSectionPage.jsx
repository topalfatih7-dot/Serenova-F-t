import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestFlow from '../components/onboarding/HealthTestFlow'
import PanelPageHeader, { PanelBackLink, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  getApplicableSections,
  getRemainingSectionQuestions,
  isDetailedHealthTestComplete,
  isQuestionFullyAnswered,
  isSectionStrictlyComplete,
} from '../data/healthTest'
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '../data/coreHealthTest'
import { hasCompleteAnalysisProfile } from '../utils/healthProfile'
import { PANEL_IMAGES } from '../utils/panelImages'
import {
  getHealthTestLockState,
  needsInitialHealthAnalysis,
} from '../services/healthScoreAnalysis'

export default function HealthTestSectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const { user, packageConfig, saveHealthTestProgress } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const isCoreRoute = sectionId === 'core'
  const coreKeys = user?.gender ? getCoreHealthTestKeySet(user.gender) : new Set()

  const section = user?.id && !isCoreRoute
    ? getApplicableSections(user.gender, packageConfig).find((s) => s.id === sectionId)
    : null

  const analysis = user?.healthAnalysis || null
  const analysisReady = Boolean(analysis && !needsInitialHealthAnalysis(analysis))
  const detailedComplete = Boolean(
    user?.gender
    && isDetailedHealthTestComplete(
      user.healthTest,
      user.gender,
      packageConfig,
      coreKeys,
    ),
  )
  const lockState = getHealthTestLockState({
    healthAnalysis: analysis,
    detailedComplete,
    optionalCompletedAt: user?.healthTest?.optionalCompletedAt || null,
    retakeAt: user?.healthTest?.retakeAt || null,
  })
  const coreComplete = Boolean(
    user?.gender && isCoreHealthTestComplete(user.healthTest, user.gender),
  )
  const awaitingRetake = Boolean(lockState.canRetake && coreComplete && analysisReady)

  const handleProgressSave = useCallback(async ({ healthTest }) => {
    if (saving) return
    try {
      await saveHealthTestProgress(healthTest)
    } catch {
      /* sessiz */
    }
  }, [saveHealthTestProgress, saving])

  const handleCoreComplete = useCallback(async ({ healthTest }) => {
    if (!isCoreHealthTestComplete(healthTest, user.gender)) {
      toast('Lütfen tüm soruları eksiksiz cevaplayın.', 'error')
      return
    }
    setSaving(true)
    try {
      await saveHealthTestProgress(healthTest)
      toast('Genel Sağlık Testi tamamlandı. Analizi başlatmak için butona tıklayın.', 'success')
      navigate('/health-test')
    } finally {
      setSaving(false)
    }
  }, [saveHealthTestProgress, user, toast, navigate])

  const handleSectionComplete = useCallback(async ({ healthTest }) => {
    if (!section) {
      toast('Bölüm bulunamadı.', 'error')
      return
    }
    const remaining = getRemainingSectionQuestions(section.id, user.gender, coreKeys)
    const incompleteDependents = remaining.some((q) => !isQuestionFullyAnswered(q, healthTest))
    if (incompleteDependents) {
      toast('Lütfen açık bıraktığınız açıklama alanlarını tamamlayın.', 'error')
      return
    }

    setSaving(true)
    try {
      await saveHealthTestProgress(healthTest)
      const allDetailed = isDetailedHealthTestComplete(
        healthTest,
        user.gender,
        packageConfig,
        coreKeys,
      )
      const sectionDone = isSectionStrictlyComplete(section, healthTest, {
        coreKeys,
        exemptOptionalText: true,
      })
      if (allDetailed) {
        toast(`${section.title} kaydedildi. Detaylı analiz hazırlanıyor…`, 'success')
      } else if (sectionDone) {
        toast(`${section.title} tamamlandı.`, 'success')
      } else {
        toast(`${section.title} kaydedildi. İstediğiniz zaman devam edebilirsiniz.`, 'success')
      }
      navigate('/health-test')
    } finally {
      setSaving(false)
    }
  }, [saveHealthTestProgress, user, packageConfig, section, toast, navigate, coreKeys])

  if (!user?.id) return <Navigate to="/login" replace />

  if (!hasCompleteAnalysisProfile(user)) {
    return <Navigate to="/health-test" replace />
  }

  if (!user.healthAck || !user.disclaimer) {
    return <Navigate to="/health-test" replace />
  }

  if (lockState.fullLock || awaitingRetake) {
    return <Navigate to="/health-test" replace />
  }

  if (isCoreRoute) {
    if (isCoreHealthTestComplete(user.healthTest, user.gender)) {
      return <Navigate to="/health-test" replace />
    }
    return (
      <PanelPageShell>
        <div className="mb-5">
          <PanelBackLink to="/health-test">Sağlık testine dön</PanelBackLink>
        </div>
        <PanelPageHeader
          title="Genel Sağlık Testi"
          subtitle="Temel sorular — tamamlandığında skorlarınız hesaplanır"
          icon={HeartPulse}
          accent="brand"
          image={PANEL_IMAGES.healthTest}
        />
        <HealthTestFlow
          key="core"
          layout="page"
          open
          mode="core"
          gender={user.gender || ''}
          packageConfig={packageConfig}
          initialHealthTest={user.healthTest}
          onProgressSave={handleProgressSave}
          onCoreComplete={handleCoreComplete}
          saving={saving}
          flowTitle="Genel Sağlık Testi"
        />
      </PanelPageShell>
    )
  }

  if (!section) return <Navigate to="/health-test" replace />

  if (!isCoreHealthTestComplete(user.healthTest, user.gender)) {
    return <Navigate to="/health-test" replace />
  }

  return (
    <PanelPageShell>
      <div className="mb-5">
        <PanelBackLink to="/health-test">Sağlık testine dön</PanelBackLink>
      </div>
      <PanelPageHeader
        title={section.title}
        subtitle={`${section.subtitle} (opsiyonel)`}
        icon={HeartPulse}
        accent="brand"
        image={PANEL_IMAGES.healthTest}
      />
      <HealthTestFlow
        key={sectionId}
        layout="page"
        open
        mode="remaining"
        sectionId={sectionId}
        gender={user.gender || ''}
        packageConfig={packageConfig}
        initialHealthTest={user.healthTest}
        onProgressSave={handleProgressSave}
        onSectionComplete={handleSectionComplete}
        saving={saving}
      />
    </PanelPageShell>
  )
}
