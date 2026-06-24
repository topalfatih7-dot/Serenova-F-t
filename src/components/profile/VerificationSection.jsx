import { useEffect, useState } from 'react'
import { Mail, Phone, ShieldCheck, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import PhoneField from '../ui/PhoneField'
import ProfileSectionCard from './ProfileSectionCard'
import { DEFAULT_COUNTRY_ISO } from '../../data/countryCodes'

const phoneVerifyViaEmail = import.meta.env.VITE_PHONE_VERIFY_VIA_EMAIL === 'true'
// Telefon doğrulama şimdilik kapalı (Twilio kurulumu tamamlanınca açılacak).
const phoneVerifyEnabled = import.meta.env.VITE_PHONE_VERIFY_ENABLED === 'true'

function StatusBadge({ verified }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Doğrulandı
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <AlertCircle className="h-3.5 w-3.5" /> Doğrulanmadı
    </span>
  )
}

export default function VerificationSection({
  user,
  verificationStatus,
  onSendEmailVerification,
  onConfirmEmailVerification,
  onSendPhoneVerification,
  onConfirmPhoneVerification,
  onRefresh,
  onRefreshStatus,
}) {
  const { toast } = useToast()
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO)
  const [emailStep, setEmailStep] = useState(false)
  const [showEmailCode, setShowEmailCode] = useState(false)
  const [phoneStep, setPhoneStep] = useState(false)
  const [phoneViaEmail, setPhoneViaEmail] = useState(false)
  const [pendingPhone, setPendingPhone] = useState('')
  const [loading, setLoading] = useState(null)

  useEffect(() => {
    setPhone(user?.phone || '')
  }, [user?.phone])

  const status = verificationStatus || {
    email: user?.email,
    phone: user?.phone,
    emailVerified: Boolean(user?.emailVerifiedAt),
    phoneVerified: Boolean(user?.phoneVerifiedAt),
  }

  const handleSendEmail = async () => {
    setLoading('email-send')
    try {
      const res = await onSendEmailVerification()
      if (res?.success === false) {
        toast(res.error || 'E-posta gönderilemedi', 'error')
        return
      }
      setEmailStep(true)
      toast(res?.message || 'Doğrulama bağlantısı e-postanıza gönderildi', 'success')
    } finally {
      setLoading(null)
    }
  }

  const handleConfirmEmail = async () => {
    setLoading('email-confirm')
    try {
      const res = await onConfirmEmailVerification(emailCode)
      if (res?.success === false) {
        toast(res.error || 'Kod doğrulanamadı', 'error')
        return
      }
      setEmailStep(false)
      setShowEmailCode(false)
      setEmailCode('')
      toast('E-posta adresiniz doğrulandı', 'success')
      onRefresh?.()
    } finally {
      setLoading(null)
    }
  }

  const handleRefreshStatus = async () => {
    setLoading('refresh')
    try {
      const res = await (onRefreshStatus ? onRefreshStatus() : onRefresh?.())
      if (res?.success) {
        toast('Doğrulama durumu güncellendi', 'success')
      } else {
        toast(res?.error || 'Henüz doğrulanmadı. Bağlantıya tıkladıktan sonra tekrar deneyin.', 'info')
      }
    } finally {
      setLoading(null)
    }
  }

  const handleSendPhone = async () => {
    setLoading('phone-send')
    try {
      const res = await onSendPhoneVerification(phone, countryIso)
      if (res?.success === false) {
        toast(res.error || 'Kod gönderilemedi', 'error')
        return
      }
      setPendingPhone(res.phone || phone)
      setPhoneViaEmail(!!res.viaEmail)
      setPhoneStep(true)
      toast(res?.message || (res.viaEmail ? 'Bağlantı e-postanıza gönderildi' : 'SMS kodu gönderildi'), 'success')
    } finally {
      setLoading(null)
    }
  }

  const handleConfirmPhone = async () => {
    setLoading('phone-confirm')
    try {
      const res = await onConfirmPhoneVerification(phoneCode, phone, countryIso, phoneViaEmail)
      if (res?.success === false) {
        toast(res.error || 'Kod doğrulanamadı', 'error')
        return
      }
      setPhoneStep(false)
      setPhoneCode('')
      toast('Telefon numaranız doğrulandı', 'success')
      onRefresh?.()
    } finally {
      setLoading(null)
    }
  }

  return (
    <ProfileSectionCard
      icon={ShieldCheck}
      title="Hesap Doğrulama"
      subtitle="E-posta adresinizi doğrulayarak hesabınızı güvence altına alın"
      accent="sage"
      delay={0.18}
    >
      <div className="space-y-4">
        {/* E-posta */}
        <div className="rounded-2xl border border-sage-100/80 bg-gradient-to-br from-sage-50/80 to-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-cream-900">
                <Mail className="h-4 w-4 text-brand-500" /> E-posta
              </p>
              <p className="mt-0.5 truncate text-sm text-cream-800/65">{status.email}</p>
            </div>
            <StatusBadge verified={status.emailVerified} />
          </div>

          {!status.emailVerified && (
            <div className="mt-3 space-y-2">
              {!emailStep ? (
                <button
                  type="button"
                  disabled={loading === 'email-send'}
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {loading === 'email-send' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Doğrulama Bağlantısı Gönder
                </button>
              ) : (
                <div className="space-y-2.5">
                  <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-cream-800/80">
                    📧 <strong>{status.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
                    Gelen kutunuzu (ve spam klasörünü) kontrol edip bağlantıya tıklayın.
                    Onay sayfasında <strong>“Panele Git”</strong>e basın; ardından burada
                    <strong> “Durumu Yenile”</strong> ile kontrol edebilirsiniz.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={loading === 'refresh'}
                      onClick={handleRefreshStatus}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sage-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
                    >
                      {loading === 'refresh' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Durumu Yenile
                    </button>
                    <button
                      type="button"
                      disabled={loading === 'email-send'}
                      onClick={handleSendEmail}
                      className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-xs font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-60"
                    >
                      Tekrar Gönder
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailCode((v) => !v)}
                      className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
                    >
                      Kod aldıysanız buraya girin
                    </button>
                  </div>
                  {showEmailCode && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="E-postadaki 6 haneli kod"
                        className="flex-1 rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-300"
                      />
                      <button
                        type="button"
                        disabled={loading === 'email-confirm'}
                        onClick={handleConfirmEmail}
                        className="rounded-xl bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
                      >
                        {loading === 'email-confirm' ? '…' : 'Onayla'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Telefon */}
        {phoneVerifyEnabled && (
        <div className="rounded-xl border border-cream-100 bg-cream-50/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-cream-900">
                <Phone className="h-4 w-4 text-brand-500" /> Telefon
              </p>
              <p className="mt-0.5 text-sm text-cream-800/65">{status.phone || 'Numara eklenmemiş'}</p>
            </div>
            <StatusBadge verified={status.phoneVerified} />
          </div>

          {!status.phoneVerified && (
            <div className="mt-3 space-y-3">
              {!phoneStep && (
                <PhoneField
                  label=""
                  country={countryIso}
                  value={phone}
                  onValueChange={setPhone}
                  onCountryChange={setCountryIso}
                />
              )}
              {!phoneStep ? (
                <button
                  type="button"
                  disabled={loading === 'phone-send' || !phone}
                  onClick={handleSendPhone}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {loading === 'phone-send' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {phoneVerifyViaEmail ? 'Doğrulama Bağlantısı Gönder' : 'SMS Kodu Gönder'}
                </button>
              ) : phoneViaEmail ? (
                <div className="space-y-2.5">
                  <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-cream-800/80">
                    📧 SMS henüz yapılandırılmadığı için <strong>{status.email}</strong> adresine bir
                    doğrulama bağlantısı gönderdik. Bağlantıya tıklayın, ardından bu sayfaya dönüp
                    <strong> “Durumu Yenile”</strong>ye basın.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={loading === 'refresh'}
                      onClick={handleRefreshStatus}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sage-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
                    >
                      {loading === 'refresh' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Durumu Yenile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneStep(false)}
                      className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-xs font-semibold text-cream-800 hover:bg-cream-50"
                    >
                      Numarayı Değiştir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-cream-800/55">
                    Kod şu numaraya gönderildi: <strong>{pendingPhone}</strong>
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="SMS kodu"
                      className="flex-1 rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-300"
                    />
                    <button
                      type="button"
                      disabled={loading === 'phone-confirm'}
                      onClick={handleConfirmPhone}
                      className="rounded-xl bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
                    >
                      {loading === 'phone-confirm' ? '…' : 'Onayla'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </ProfileSectionCard>
  )
}
