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

function FacebookIcon() {
  return (
    <svg className="h-[22px] w-[22px] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
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
    id: 'facebook',
    label: 'Facebook ile devam et',
    Icon: FacebookIcon,
    className: 'border-cream-300 bg-white text-cream-900 hover:bg-cream-50',
    iconWrap: 'bg-transparent',
  },
]

function AuthDivider({ label, panelBg = 'bg-white' }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-cream-200" />
      </div>
      <p className={`relative mx-auto w-fit px-3 text-sm font-medium text-cream-800/50 ${panelBg}`}>
        {label}
      </p>
    </div>
  )
}

/**
 * @param {{ flow?: 'login'|'signup', plan?: string, remember?: boolean, compact?: boolean, position?: 'top'|'bottom' }} props
 */
export default function SocialAuthButtons({
  flow = 'login',
  plan,
  remember = true,
  compact = false,
  position = 'top',
}) {
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState(null)
  const [configError, setConfigError] = useState({ open: false, message: '' })
  const providersUrl = getSupabaseAuthProvidersUrl()
  const isBottom = position === 'bottom'

  const handleClick = async (provider) => {
    if (loadingId) return
    setLoadingId(provider)
    const timeout = window.setTimeout(() => {
      setLoadingId(null)
      toast('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.', 'error', 5000)
    }, 12000)
    let redirecting = false
    try {
      const result = await signInWithSocial(provider, { flow, plan, remember })
      if (result.redirecting) {
        redirecting = true
        return
      }
      if (!result.success) {
        const msg = result.error || 'Giriş başlatılamadı'
        toast(msg, 'error', 6000)
        if (result.providerNotConfigured) {
          setConfigError({ open: true, message: msg })
        }
      }
    } finally {
      window.clearTimeout(timeout)
      if (!redirecting) setLoadingId(null)
    }
  }

  const buttons = BUTTONS.map(({ id, label, Icon, className, iconWrap }) => (
    <button
      key={id}
      type="button"
      disabled={!!loadingId}
      onClick={() => handleClick(id)}
      className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3.5 text-sm font-semibold transition disabled:opacity-60 sm:gap-3 sm:px-4 sm:py-4 sm:text-base ${className}`}
    >
      {loadingId === id ? (
        <Loader2 className="h-[22px] w-[22px] shrink-0 animate-spin" />
      ) : (
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
          <Icon />
        </span>
      )}
      <span className="min-w-0 leading-snug">{label}</span>
    </button>
  ))

  return (
    <>
    <div className={compact ? 'min-w-0 space-y-2.5' : 'min-w-0 space-y-3'}>
      {!isBottom && !compact && (
        <p className="text-center text-sm leading-relaxed text-cream-800/65">
          Tek tıkla güvenli giriş — şifre yazmanıza gerek yok.
        </p>
      )}
      {!isBottom && <AuthDivider label="veya e-posta ile" />}
      {isBottom && <AuthDivider label="veya sosyal hesap ile" />}
      {buttons}
      {isBottom && !compact && (
        <p className="text-center text-xs leading-relaxed text-cream-800/50">
          Google veya Facebook hesabınızla şifresiz devam edin.
        </p>
      )}
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
