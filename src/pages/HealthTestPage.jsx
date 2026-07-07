import { useCallback, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestHub from '../components/onboarding/HealthTestHub'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { PANEL_IMAGES } from '../utils/panelImages'

export default function HealthTestPage() {
  const { user, packageConfig } = useApp()

  if (!user?.id) return <Navigate to="/login" replace />

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Sağlık Testleri"
        subtitle="Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz"
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
      />
    </PanelPageShell>
  )
}
