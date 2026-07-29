import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import HealthTestFlow from '../components/onboarding/HealthTestFlow'
import PanelPageHeader, { PanelBackLink, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  getApplicableSections,
  isHealthTestComplete,
  isSectionComplete,
} from '../data/healthTest'
import { PANEL_IMAGES } from '../utils/panelImages'

export default function HealthTestSectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const { user, packageConfig, saveHealthTestProgress } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const section = user?.id
    ? getApplicableSections(user.gender, packageConfig).find((s) => s.id === sectionId)
    : null

  const handleProgressSave = useCallback(async ({ healthTest }) => {
    if (saving) return
    try {
      await saveHealthTestProgress(healthTest)
    } catch {
      /* sessiz */
    }
  }, [saveHealthTestProgress, saving])

  const handleSectionComplete = useCallback(async ({ healthTest }) => {
    if (!section || !isSectionComplete(section, healthTest)) {
      toast('Lütfen tüm soruları eksiksiz cevaplayın (açıklama alanları dahil).', 'error')
      return
    }
    setSaving(true)
    try {
      await saveHealthTestProgress(healthTest)
      const allSectionsDone = isHealthTestComplete(healthTest, user.gender, packageConfig)
      if (allSectionsDone) {
        toast(`${section.title} tamamlandı. Tüm kategoriler kaydedildi.`, 'success')
        navigate('/health-test')
      } else {
        toast(`${section.title} kaydedildi.`, 'success')
        navigate('/health-test')
      }
    } finally {
      setSaving(false)
    }
  }, [saveHealthTestProgress, user, packageConfig, section, toast, navigate])

  if (!user?.id) return <Navigate to="/login" replace />

  if (!user.healthAck || !user.disclaimer) {
    return <Navigate to="/health-test" replace />
  }

  if (!section) return <Navigate to="/health-test" replace />

  return (
    <PanelPageShell>
      <div className="mb-5">
        <PanelBackLink to="/health-test">Sağlık testine dön</PanelBackLink>
      </div>
      <PanelPageHeader
        title={section.title}
        subtitle={section.subtitle}
        icon={HeartPulse}
        accent="brand"
        image={PANEL_IMAGES.healthTest}
      />
      <HealthTestFlow
        key={sectionId}
        layout="page"
        open
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
