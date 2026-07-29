import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestHub from '../components/onboarding/HealthTestHub'
import UnpaidMemberGate from '../components/membership/UnpaidMemberGate'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PANEL_IMAGES } from '../utils/panelImages'
import { useHealthAnalysisSync } from '../hooks/useHealthAnalysisSync'
import { needsInitialHealthAnalysis } from '../services/healthScoreAnalysis'

export default function HealthTestPage() {
  const { user, packageConfig, updateProfile, isUnpaidMember } = useApp()
  const { toast } = useToast()
  const [consentSaving, setConsentSaving] = useState(false)
  const { analysis, loading: analysisLoading } = useHealthAnalysisSync()
  const analysisReady = Boolean(analysis && !needsInitialHealthAnalysis(analysis))

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

  if (!user?.id) return <Navigate to="/login" replace />

  if (isUnpaidMember) {
    return (
      <PanelPageShell>
        <UnpaidMemberGate />
      </PanelPageShell>
    )
  }

  const needsConsent = !user.healthAck || !user.disclaimer

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Kişisel Sağlık Analizi"
        subtitle={
          needsConsent
            ? 'Analize başlamadan önce onayları işaretleyin'
            : 'Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz'
        }
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
        analysisReady={analysisReady}
        analysisLoading={analysisLoading}
      />
    </PanelPageShell>
  )
}
