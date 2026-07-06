import { useCallback, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CheckCircle, HeartPulse } from 'lucide-react'
import HealthTestFlow from '../components/onboarding/HealthTestFlow'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { isHealthTestComplete } from '../data/healthTest'
import { syncMemberHealthAssets } from '../services/memberHealthSync'

export default function HealthTestPage() {
  const { user, packageConfig, updateProfile, createProgram, exercises, myPrograms } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const complete = isHealthTestComplete(user?.healthTest, user?.gender, packageConfig)

  const handleComplete = useCallback(async ({ healthTest, healthAck, disclaimer }) => {
    setSaving(true)
    try {
      await updateProfile({ healthTest, healthAck, disclaimer })
      const merged = { ...user, healthTest, healthAck, disclaimer }
      const result = await syncMemberHealthAssets({
        user: merged,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
      if (result.synced) {
        toast('Sağlık profiliniz kaydedildi ve kişisel programlarınız hazırlandı.', 'success')
      } else {
        toast('Sağlık testiniz kaydedildi. Kişisel programlar için profilinizdeki bilgileri tamamlayın.', 'success')
      }
    } finally {
      setSaving(false)
    }
  }, [user, updateProfile, createProgram, exercises, myPrograms, toast])

  if (!user?.id) return <Navigate to="/login" replace />

  if (complete) {
    return (
      <PanelPageShell>
        <PanelPageHeader
          title="Sağlık Testi"
          subtitle="Profiliniz güncel"
          icon={HeartPulse}
          accent="brand"
        />
        <div className="mx-auto max-w-lg rounded-3xl border border-sage-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-sage-500" />
          <h2 className="mt-4 font-display text-xl font-bold text-cream-900">Test tamamlandı</h2>
          <p className="mt-2 text-sm text-cream-800/65">
            Sağlık profiliniz kayıtlı. Güncellemek için testi yeniden başlatabilirsiniz.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/dashboard" className="btn-wellness inline-flex justify-center !px-6 !py-2.5 text-sm">
              Panele dön
            </Link>
            <Link to="/profile" className="inline-flex justify-center rounded-xl border border-cream-200 px-6 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-50">
              Profilim
            </Link>
          </div>
        </div>
      </PanelPageShell>
    )
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Sağlık Testi"
        subtitle="Kişisel programlarınız için birkaç dakika ayırın — istediğiniz zaman tamamlayabilirsiniz"
        icon={HeartPulse}
        accent="brand"
      />
      <HealthTestFlow
        layout="page"
        open
        gender={user.gender || ''}
        packageConfig={packageConfig}
        initialHealthTest={user.healthTest}
        onComplete={handleComplete}
        saving={saving}
      />
    </PanelPageShell>
  )
}
