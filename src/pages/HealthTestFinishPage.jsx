import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { HeartPulse, Loader2, Sparkles } from 'lucide-react'
import PanelPageHeader, { PanelBackLink, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { isHealthTestComplete } from '../data/healthTest'
import { isBasicAutoProgramEligible, syncMemberHealthAssets } from '../services/memberHealthSync'
import { PANEL_IMAGES } from '../utils/panelImages'

export default function HealthTestFinishPage() {
  const navigate = useNavigate()
  const { user, packageConfig, updateProfile, createProgram, exercises, myPrograms, membership } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const isBasic = isBasicAutoProgramEligible(membership || user?.membership)

  const handleComplete = useCallback(async () => {
    setSaving(true)
    try {
      const result = await syncMemberHealthAssets({
        user,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
      if (result.synced) {
        toast(
          isBasic
            ? 'Sağlık profiliniz kaydedildi ve 15 günlük programlarınız hazırlandı.'
            : 'Sağlık profiliniz kaydedildi.',
          'success',
        )
      } else {
        toast('Sağlık profiliniz kaydedildi.', 'success')
      }
      navigate('/health-test')
    } finally {
      setSaving(false)
    }
  }, [user, updateProfile, createProgram, exercises, myPrograms, toast, navigate, isBasic])

  if (!user?.id) return <Navigate to="/login" replace />

  if (!user.healthAck || !user.disclaimer) {
    return <Navigate to="/health-test" replace />
  }

  const sectionsComplete = isHealthTestComplete(user.healthTest, user.gender, packageConfig)
  if (!sectionsComplete) return <Navigate to="/health-test" replace />

  if (user.healthAnalysis) return <Navigate to="/health-test" replace />

  return (
    <PanelPageShell>
      <div className="mb-5">
        <PanelBackLink to="/health-test">Tüm testlere dön</PanelBackLink>
      </div>
      <PanelPageHeader
        title="Son Adım"
        subtitle={
          isBasic
            ? 'Tüm testleri tamamladınız — Basic 15 günlük programlarınızı hazırlayın'
            : 'Tüm testleri tamamladınız — sağlık özetinizi kaydedin'
        }
        icon={HeartPulse}
        accent="brand"
        image={PANEL_IMAGES.healthTest}
      />
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 rounded-2xl border border-sage-200 bg-sage-50/60 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-500 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-cream-900">Profiliniz hazırlanmaya hazır</p>
            <p className="mt-1 text-sm leading-relaxed text-cream-800/70">
              {isBasic
                ? 'Cevaplarınıza göre AI sağlık özeti ve 15 günlük antrenman + beslenme programları oluşturulacak. Antrenman hareketleri yalnızca kütüphaneden seçilir.'
                : 'Cevaplarınıza göre sağlık özeti oluşturulacak. Antrenman ve beslenme programlarını koç / diyetisyeniniz hazırlar.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleComplete}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Hazırlanıyor…' : 'Profili Kaydet'}
        </button>
      </div>
    </PanelPageShell>
  )
}
