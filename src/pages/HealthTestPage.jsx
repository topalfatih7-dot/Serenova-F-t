import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestHub from '../components/onboarding/HealthTestHub'
import FreeTrialExpiredGate from '../components/membership/FreeTrialExpiredGate'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PANEL_IMAGES } from '../utils/panelImages'

export default function HealthTestPage() {
  const { user, packageConfig, updateProfile, isFreeTrialExpired } = useApp()
  const { toast } = useToast()
  const [consentSaving, setConsentSaving] = useState(false)

  const handleConsentSave = useCallback(async ({ healthAck, disclaimer }) => {
    setConsentSaving(true)
    try {
      await updateProfile({ healthAck, disclaimer })
      toast('Onaylar kaydedildi. Testlere başlayabilirsiniz.', 'success')
    } finally {
      setConsentSaving(false)
    }
  }, [updateProfile, toast])

  if (!user?.id) return <Navigate to="/login" replace />

  if (isFreeTrialExpired) {
    return (
      <PanelPageShell>
        <FreeTrialExpiredGate />
      </PanelPageShell>
    )
  }

  const needsConsent = !user.healthAck || !user.disclaimer

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Sağlık Testleri"
        subtitle={
          needsConsent
            ? 'Testlere başlamadan önce onayları işaretleyin'
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
      />
    </PanelPageShell>
  )
}
