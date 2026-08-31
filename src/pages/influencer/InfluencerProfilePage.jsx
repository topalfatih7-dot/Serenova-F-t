import { useEffect, useState } from 'react'
import { UserCircle, Loader2 } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import PasswordChangeSection from '../../components/profile/PasswordChangeSection'
import ProfileSectionCard from '../../components/profile/ProfileSectionCard'
import PhoneField from '../../components/ui/PhoneField'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import {
  DEFAULT_COUNTRY_ISO,
  digitsOnly,
  formatNationalNumber,
  parseE164,
  toE164,
} from '../../data/countryCodes'

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

function splitStoredPhone(raw) {
  const parsed = parseE164(raw)
  if (!parsed?.national) return { iso: DEFAULT_COUNTRY_ISO, national: '' }
  return {
    iso: parsed.iso,
    national: formatNationalNumber(parsed.iso, parsed.national),
  }
}

export default function InfluencerProfilePage() {
  const { influencerUser, updateInfluencerProfile } = useApp()
  const { toast } = useToast()
  const phoneParts = splitStoredPhone(influencerUser?.phone)
  const [name, setName] = useState(influencerUser?.name || '')
  const [phoneCountry, setPhoneCountry] = useState(phoneParts.iso)
  const [phone, setPhone] = useState(phoneParts.national)
  const [instagram, setInstagram] = useState(influencerUser?.instagram || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next = splitStoredPhone(influencerUser?.phone)
    setName(influencerUser?.name || '')
    setPhoneCountry(next.iso)
    setPhone(next.national)
    setInstagram(influencerUser?.instagram || '')
  }, [influencerUser?.id, influencerUser?.name, influencerUser?.phone, influencerUser?.instagram])

  const save = async (e) => {
    e.preventDefault()
    if (!String(name).trim()) {
      toast('Ad gerekli.', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await updateInfluencerProfile({
        name,
        phone: digitsOnly(phone) ? toE164(phoneCountry, phone) : '',
        instagram,
      })
      if (r?.success === false) {
        toast(r.error || 'Kaydedilemedi.', 'error')
        return
      }
      toast('Profil güncellendi.', 'success')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Profilim"
        subtitle="Ad, iletişim ve hesap güvenliği"
        icon={UserCircle}
        accent="brand"
      />

      <ProfileSectionCard title="Hesap bilgileri" icon={UserCircle} accent="brand">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Ad soyad</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">E-posta</span>
            <input value={influencerUser?.email || ''} disabled className={`${inputCls} bg-cream-50 text-cream-800/70`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Kod</span>
            <input value={influencerUser?.code || ''} disabled className={`${inputCls} bg-cream-50 font-mono tracking-wide text-cream-800/70`} />
          </label>
          <div className="sm:col-span-2">
            <PhoneField
              label="Telefon"
              country={phoneCountry}
              value={phone}
              onCountryChange={(iso) => { setPhoneCountry(iso); setPhone('') }}
              onValueChange={setPhone}
              hint="Türkiye için 10 hane: 5XX XXX XX XX"
            />
          </div>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Instagram</span>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputCls} placeholder="@kullanici" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      </ProfileSectionCard>

      <PasswordChangeSection />
    </PanelPageShell>
  )
}
