import { useCallback, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import HealthTestFlow from '../components/onboarding/HealthTestFlow'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  getApplicableSections,
  isHealthTestComplete,
  isSectionComplete,
} from '../data/healthTest'

export default function HealthTestSectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const { user, packageConfig, saveHealthTestProgress } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  if (!user?.id) return <Navigate to="/login" replace />

  const section = getApplicableSections(user.gender, packageConfig).find((s) => s.id === sectionId)
  if (!section) return <Navigate to="/health-test" replace />

  const handleProgressSave = useCallback(async ({ healthTest }) => {
    if (saving) return
    try {
      await saveHealthTestProgress(healthTest)
    } catch {
      /* sessiz */
    }
  }, [saveHealthTestProgress, saving])

  const handleSectionComplete = useCallback(async ({ healthTest }) => {
    if (!isSectionComplete(section, healthTest)) {
      toast('Lütfen tüm soruları eksiksiz cevaplayın (açıklama alanları dahil).', 'error')
      return
    }
    setSaving(true)
    try {
      await saveHealthTestProgress(healthTest)
      const allSectionsDone = isHealthTestComplete(healthTest, user.gender, packageConfig)
      if (allSectionsDone && (!user.healthAck || !user.disclaimer)) {
        toast(`${section.title} tamamlandı. Son adım için onayları işaretleyin.`, 'success')
        navigate('/health-test/finish')
      } else {
        toast(`${section.title} testi kaydedildi.`, 'success')
        navigate('/health-test')
      }
    } finally {
      setSaving(false)
    }
  }, [saveHealthTestProgress, user, packageConfig, section.title, toast, navigate])

  const sectionDone = isSectionComplete(section, user.healthTest)

  return (
    <PanelPageShell>
      <div className="mb-4">
        <Link
          to="/health-test"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/70 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm testlere dön
        </Link>
      </div>
      <PanelPageHeader
        title={section.title}
        subtitle={section.subtitle}
        icon={HeartPulse}
        accent="brand"
      />
      {sectionDone && (
        <p className="mx-auto mb-4 max-w-2xl rounded-xl border border-sage-200 bg-sage-50/60 px-4 py-2.5 text-xs text-sage-800">
          Bu kategori daha önce tamamlanmış. Cevaplarınızı güncelleyebilir veya değiştirebilirsiniz.
        </p>
      )}
      <HealthTestFlow
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
