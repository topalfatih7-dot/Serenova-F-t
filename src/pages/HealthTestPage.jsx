import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestHub from '../components/onboarding/HealthTestHub'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PANEL_IMAGES } from '../utils/panelImages'
import { useHealthAnalysisSync } from '../hooks/useHealthAnalysisSync'
import { needsInitialHealthAnalysis } from '../services/healthScoreAnalysis'
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '../data/coreHealthTest'
import { isDetailedHealthTestComplete } from '../data/healthTest'
import { hasCompleteAnalysisProfile } from '../utils/healthProfile'

export default function HealthTestPage() {
  const { user, packageConfig, updateProfile, isUnpaidMember } = useApp()
  const { toast } = useToast()
  const [consentSaving, setConsentSaving] = useState(false)
  const [profileGateSaving, setProfileGateSaving] = useState(false)
  const { analysis, loading: analysisLoading, runSync } = useHealthAnalysisSync()
  const analysisReady = Boolean(analysis && !needsInitialHealthAnalysis(analysis))

  const coreComplete = Boolean(
    user?.gender && isCoreHealthTestComplete(user.healthTest, user.gender),
  )
  const detailedComplete = Boolean(
    user?.gender
    && isDetailedHealthTestComplete(
      user.healthTest,
      user.gender,
      packageConfig,
      getCoreHealthTestKeySet(user.gender),
    ),
  )
  const analysisStage = analysis?.analysisStage
    || (analysisReady && detailedComplete ? 'detailed' : (analysisReady ? 'core' : null))

  const handleStartCoreAnalysis = useCallback(async () => {
    try {
      const next = await runSync({ stage: 'core' })
      if (next?.overallScore != null || next?.overallScore === 0) {
        toast('Sağlık analiziniz hazır.', 'success')
      } else {
        toast('Analiz başlatılamadı. Lütfen tekrar deneyin.', 'error')
      }
    } catch (err) {
      toast(err?.message || 'Analiz başlatılamadı.', 'error')
    }
  }, [runSync, toast])

  const handleConsentSave = useCallback(async ({ healthAck, disclaimer }) => {
    setConsentSaving(true)
    try {
      await updateProfile({ healthAck, disclaimer })
      toast('Onaylar kaydedildi. Analize başlayabilirsiniz.', 'success')
    } catch (err) {
      toast(err?.message || 'Onaylar kaydedilemedi.', 'error')
    } finally {
      setConsentSaving(false)
    }
  }, [updateProfile, toast])

  const handleProfileGateSave = useCallback(async (patch) => {
    setProfileGateSaving(true)
    try {
      await updateProfile(patch)
      toast('Profil bilgileriniz kaydedildi. Teste devam edebilirsiniz.', 'success')
    } catch (err) {
      toast(err?.message || 'Bilgiler kaydedilemedi.', 'error')
    } finally {
      setProfileGateSaving(false)
    }
  }, [updateProfile, toast])

  if (!user?.id) return <Navigate to="/login" replace />

  const profileReady = hasCompleteAnalysisProfile(user)
  const needsConsent = !user.healthAck || !user.disclaimer

  let subtitle = 'Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz'
  if (!profileReady) {
    subtitle = 'Boy, kilo ve yaş bilgilerinizi girerek başlayın'
  } else if (needsConsent) {
    subtitle = 'Analize başlamadan önce onayları işaretleyin'
  } else if (!coreComplete) {
    subtitle = 'Genel Sağlık Testini tamamlayın — ardından analizi başlatın'
  } else if (!analysisReady) {
    subtitle = 'Test tamamlandı — skorlarınız için Analizi Başlat’a tıklayın'
  } else if (isUnpaidMember) {
    subtitle = 'Opsiyonel kategorilerle analizi derinleştirin — uzman raporu paketle açılır'
  } else if (!detailedComplete) {
    subtitle = 'Temel analiziniz hazır — opsiyonel kategorilerle detaylı analiz alın'
  } else {
    subtitle = 'Detaylı sağlık analiziniz hazır — kategorileri istediğiniz zaman güncelleyebilirsiniz'
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Kişisel Sağlık Analizi"
        subtitle={subtitle}
        icon={HeartPulse}
        accent="brand"
        image={PANEL_IMAGES.healthTest}
      />
      <HealthTestHub
        gender={user.gender || ''}
        packageConfig={packageConfig}
        healthTest={user.healthTest}
        healthAck={user.healthAck}
        disclaimer={user.disclaimer}
        onConsentSave={handleConsentSave}
        consentSaving={consentSaving}
        profile={user}
        onProfileGateSave={handleProfileGateSave}
        profileGateSaving={profileGateSaving}
        analysisReady={analysisReady}
        analysisLoading={analysisLoading}
        analysisStage={analysisStage}
        detailedComplete={detailedComplete}
        scoresOnly={isUnpaidMember}
        onStartCoreAnalysis={handleStartCoreAnalysis}
      />
    </PanelPageShell>
  )
}
