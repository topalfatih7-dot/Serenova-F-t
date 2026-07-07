import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, HeartPulse, Loader2 } from 'lucide-react'
import DisclaimerBox from '../components/ui/DisclaimerBox'
import PanelPageHeader, { PanelBackLink, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { isHealthTestComplete } from '../data/healthTest'
import { syncMemberHealthAssets } from '../services/memberHealthSync'
import { PANEL_IMAGES } from '../utils/panelImages'

export default function HealthTestFinishPage() {
  const { user, packageConfig, updateProfile, createProgram, exercises, myPrograms } = useApp()
  const { toast } = useToast()
  const [healthAck, setHealthAck] = useState(!!user?.healthAck)
  const [disclaimer, setDisclaimer] = useState(!!user?.disclaimer)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!user?.id) return <Navigate to="/login" replace />

  const sectionsComplete = isHealthTestComplete(user.healthTest, user.gender, packageConfig)
  if (!sectionsComplete) return <Navigate to="/health-test" replace />

  const fullyComplete = sectionsComplete && user.healthAck && user.disclaimer
  if (fullyComplete) return <Navigate to="/health-test" replace />

  const handleComplete = useCallback(async () => {
    if (!healthAck || !disclaimer) {
      setShowErrors(true)
      return
    }
    setSaving(true)
    try {
      await updateProfile({ healthAck, disclaimer })
      const merged = { ...user, healthAck, disclaimer }
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
        toast('Sağlık profiliniz kaydedildi.', 'success')
      }
    } finally {
      setSaving(false)
    }
  }, [healthAck, disclaimer, user, updateProfile, createProgram, exercises, myPrograms, toast])

  return (
    <PanelPageShell>
      <div className="mb-5">
        <PanelBackLink to="/health-test">Tüm testlere dön</PanelBackLink>
      </div>
      <PanelPageHeader
        title="Son Adım"
        subtitle="Tüm testleri tamamladınız — profilinizi kaydetmek için onayları işaretleyin"
        icon={HeartPulse}
        accent="brand"
        image={PANEL_IMAGES.healthTest}
      />
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-sm">
        <DisclaimerBox variant="prominent" />
        {[
          { key: 'healthAck', checked: healthAck, set: setHealthAck, text: 'Sağlık durumumu doğru bildirdim ve gerekli durumlarda doktoruma danıştım.' },
          { key: 'disclaimer', checked: disclaimer, set: setDisclaimer, text: 'Bu hizmetin tıbbi teşhis veya tedavi olmadığını kabul ediyorum.' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => item.set(!item.checked)}
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
              item.checked ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200' : 'border-cream-200 bg-white'
            }`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
              item.checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300'
            }`}>
              {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="text-sm leading-snug text-cream-800/80">{item.text}</span>
          </button>
        ))}
        {showErrors && (!healthAck || !disclaimer) && (
          <p className="text-xs font-medium text-red-600">Lütfen tüm onayları işaretleyin.</p>
        )}
        <button
          type="button"
          onClick={handleComplete}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Kaydediliyor…' : 'Profili Kaydet'}
        </button>
      </div>
    </PanelPageShell>
  )
}
