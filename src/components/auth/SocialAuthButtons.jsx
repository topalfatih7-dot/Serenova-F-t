import { useState } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import { signInWithSocial, getSupabaseAuthProvidersUrl } from '../../services/oauthAuth'
import { useToast } from '../../context/ToastContext'
import FormErrorModal from '../ui/FormErrorModal'

function GoogleIcon() {
  return (
    <svg className="h-[22px] w-[22px] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

/** Apple Sign In — resmi silüete yakın, beyaz logo */
function AppleIcon() {
  return (
    <svg
      className="h-[24px] w-[20px] shrink-0"
      viewBox="0 0 384 512"
      fill="#FFFFFF"
      aria-hidden
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 25 184.8 25 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.5 107.2 125.2 25-.3 42.9-18.1 75.8-18.1s46.1 18.1 73.9 17.4c31.2-.7 50.3-36.3 82.3-73.1 25.1-36.8 35.4-72.3 36-74.1-.8-.3-68.8-26.4-69.5-104.5zM246.6 96.7c27.3-33 45.8-79 39.9-124.6-38.6 1.6-85.2 25.8-112.8 58.6-25.6 30.8-47.9 80.1-41.9 127.3 44.2 3.4 89.5-20.6 114.8-61.3z" />
    </svg>
  )
}

/** Facebook — beyaz "f", mavi buton üzerinde (daire olmadan) */
function FacebookIcon() {
  return (
    <svg className="h-[22px] w-[22px] shrink-0" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden>
      <path d="M13.5 22v-8.2h2.75l.42-3.2H13.5V8.88c0-.93.26-1.56 1.59-1.56h1.7V4.14c-.29-.04-1.3-.13-2.48-.13-2.45 0-4.13 1.5-4.13 4.24v2.35H7.5v3.2h2.68V22h3.32z" />
    </svg>
  )
}

const BUTTONS = [
  {
    id: 'google',
    label: 'Google ile devam et',
    Icon: GoogleIcon,
    className: 'border-cream-300 bg-white text-cream-900 hover:bg-cream-50',
    iconWrap: 'bg-transparent',
  },
  {
    id: 'apple',
    label: 'Apple ile devam et',
    Icon: AppleIcon,
    className: 'border-black bg-black text-white hover:bg-neutral-900',
    iconWrap: 'bg-transparent',
  },
  {
    id: 'facebook',
    label: 'Facebook ile devam et',
    Icon: FacebookIcon,
    className: 'border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166FE5]',
    iconWrap: 'bg-transparent',
  },
]

/**
 * @param {{ flow?: 'login'|'signup', plan?: string, remember?: boolean, compact?: boolean }} props
 */
export default function SocialAuthButtons({ flow = 'login', plan, remember = true, compact = false }) {
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState(null)
  const [configError, setConfigError] = useState({ open: false, message: '' })
  const providersUrl = getSupabaseAuthProvidersUrl()

  const handleClick = async (provider) => {
    if (loadingId) return
    setLoadingId(provider)
    try {
      const result = await signInWithSocial(provider, { flow, plan, remember })
      if (!result.success && !result.redirecting) {
        const msg = result.error || 'Giriş başlatılamadı'
        toast(msg, 'error', 6000)
        if (result.providerNotConfigured) {
          setConfigError({ open: true, message: msg })
        }
      }
    } finally {
      if (!window.location.href.includes('accounts.google')) {
        setLoadingId(null)
      }
    }
  }

  return (
    <>
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      {!compact && (
        <p className="text-center text-sm leading-relaxed text-cream-800/65">
          Tek tıkla güvenli giriş — şifre yazmanıza gerek yok.
        </p>
      )}
      {BUTTONS.map(({ id, label, Icon, className, iconWrap }) => (
        <button
          key={id}
          type="button"
          disabled={!!loadingId}
          onClick={() => handleClick(id)}
          className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 px-4 py-4 text-base font-semibold transition disabled:opacity-60 ${className}`}
        >
          {loadingId === id ? (
            <Loader2 className="h-[22px] w-[22px] shrink-0 animate-spin" />
          ) : (
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
              <Icon />
            </span>
          )}
          {label}
        </button>
      ))}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-cream-200" />
        </div>
        <p className="relative mx-auto w-fit bg-white px-3 text-sm font-medium text-cream-800/50">
          veya e-posta ile
        </p>
      </div>
    </div>

    <FormErrorModal
      open={configError.open}
      message={configError.message}
      title="Sosyal giriş henüz kurulmamış"
      hint="Bu bir uygulama hatası değil — Supabase panelinde sağlayıcıların açılması gerekir. Şimdilik e-posta ile devam edebilirsiniz."
      onClose={() => setConfigError({ open: false, message: '' })}
      footer={
        <a
          href={providersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-brand-50 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          Supabase Providers sayfasını aç
          <ExternalLink className="h-4 w-4" />
        </a>
      }
    />
    </>
  )
}
