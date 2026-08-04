import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, Shield, Loader2, Sparkles, ArrowRight,
  HeartPulse, Dumbbell,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { BRAND } from '../../config/brand'
import { getRememberMe } from '../../services/authStorage'
import { consumeSessionRevokedMessage } from '../../services/singleSession'
import BrandLogo from '../../components/ui/BrandLogo'
import FormField from '../../components/ui/FormField'
import SocialAuthButtons from '../../components/auth/SocialAuthButtons'
import FormErrorModal from '../../components/ui/FormErrorModal'
import AuthFormShell, { AuthFormCard } from '../../components/auth/AuthFormShell'
import { sanitizeEmailInput, isValidEmailAddress } from '../../utils/emailAddress'
import { resolvePostLoginPath, clearIntentionalLogout } from '../../utils/authRedirect'
import TurnstileWidget from '../../components/security/TurnstileWidget'
import { useTurnstile } from '../../hooks/useTurnstile'

const FEATURES = [
  { icon: Dumbbell, text: 'Kişiye özel antrenman programları' },
  { icon: HeartPulse, text: 'Uzman koç ve diyetisyen desteği' },
  { icon: Shield, text: 'KVKK uyumlu güvenli platform' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(() => getRememberMe())
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorModal, setErrorModal] = useState({ open: false, message: '' })
  const { enabled: turnstileEnabled, widgetRef, setToken: setTurnstileToken, getTokenForSubmit, reset: resetTurnstile } = useTurnstile()
  const { login, isAuthenticated, isAdmin, isStaff } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from || null
  const msgShownRef = useRef(false)

  useEffect(() => {
    clearIntentionalLogout()

    const revokedMsg = consumeSessionRevokedMessage()
    if (revokedMsg && !msgShownRef.current) {
      msgShownRef.current = true
      toast(revokedMsg, 'warning', 7000)
    }

    const msg = location.state?.message
    if (msg && !msgShownRef.current) {
      msgShownRef.current = true
      toast(msg, 'info')
      navigate(location.pathname + (location.search || ''), {
        replace: true,
        state: { ...location.state, message: undefined },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const role = isAdmin ? 'admin' : isStaff ? 'staff' : 'member'
    navigate(resolvePostLoginPath(redirectTo, role), { replace: true })
  }, [isAuthenticated, isAdmin, isStaff, redirectTo, navigate])

  const showFormError = (message) => {
    setErrorModal({ open: true, message })
    toast(message, 'error', 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = sanitizeEmailInput(email)
    if (cleanEmail !== email) setEmail(cleanEmail)
    const fieldErrors = {}
    if (!isValidEmailAddress(cleanEmail)) fieldErrors.email = 'Geçerli e-posta girin'
    if (password.length < 6) fieldErrors.password = 'En az 6 karakter'
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) {
      const msg = fieldErrors.email
        || fieldErrors.password
        || 'Lütfen formu kontrol edin.'
      showFormError(msg)
      return
    }
    setLoading(true)
    try {
      let captchaToken = ''
      try {
        captchaToken = await getTokenForSubmit()
      } catch (err) {
        showFormError(err?.message || 'Bot doğrulamasını tamamlayın.')
        resetTurnstile()
        return
      }
      const result = await login(cleanEmail, password, remember, captchaToken)
      if (!result.success) {
        resetTurnstile()
        showFormError(result.error || 'Giriş başarısız. E-posta veya şifreyi kontrol edin.')
        return
      }
      toast('Hoş geldiniz!', 'success')
      navigate(resolvePostLoginPath(redirectTo, result.role), { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] overflow-x-hidden">
      {/* Sol panel — marka (yalnız laptop+; tablet tek kolon) */}
      <div className="relative hidden w-[40%] overflow-hidden lg:flex lg:flex-col lg:justify-between xl:w-[45%]">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster="/hero-poster.webp"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(0.45) saturate(1.15)' }}
        >
          <source src="https://assets.mixkit.co/active_storage/video_items/100526/1725383305/100526-video-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-800/85 to-sage-900/80" />
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl"
        />

        <div className="relative z-10 p-8 xl:p-14">
          <BrandLogo size="lg" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-10 max-w-md xl:mt-16"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur xl:px-4 xl:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
              {BRAND.tagline}
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white xl:mt-6 xl:text-[2.75rem]">
              Dönüşüm yolculuğunuza{' '}
              <span className="bg-gradient-to-r from-brand-200 to-sage-200 bg-clip-text text-transparent">
                kaldığınız yerden
              </span>{' '}
              devam edin
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70 xl:mt-4 xl:text-base">
              Programlarınız, randevularınız ve ilerlemeniz tek panelde sizi bekliyor.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-2.5 p-8 xl:space-y-3 xl:p-14">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 backdrop-blur-md xl:px-4 xl:py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium leading-snug text-white/90">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gradient-to-br from-cream-50 via-white to-brand-50/40 px-3 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-w-0 max-w-[440px]"
        >
          <AuthFormShell>
          <AuthFormCard className="bg-white/90 shadow-brand-900/[0.06]">
            <h2 className="font-display text-xl font-bold leading-tight text-cream-900 sm:text-2xl md:text-[1.75rem]">Tekrar hoş geldiniz</h2>
            <p className="mt-2 text-sm text-cream-800/60 sm:text-base">Hesabınıza giriş yapın</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FormField
                large
                emphasis
                label="E-posta"
                icon={Mail}
                type="email"
                placeholder="ornek@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail(sanitizeEmailInput(email))}
                error={errors.email}
              />

              <div>
                <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-cream-800">Şifre</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cream-700" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-2xl border py-4 pl-12 pr-12 text-base text-cream-900 outline-none transition placeholder:text-cream-800/55 ${
                      errors.password
                        ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-cream-400 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
                    }`}
                    placeholder="••••••••"
                    autoComplete={remember ? 'current-password' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500"
                  >
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 block text-sm font-medium text-red-500">{errors.password}</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex min-w-0 select-none items-center gap-2 text-sm font-medium text-cream-800/80 sm:gap-2.5 sm:text-base"
                  aria-pressed={remember}
                >
                  <span className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${remember ? 'bg-brand-500' : 'bg-cream-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${remember ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                  </span>
                  Beni hatırla
                </button>
                <Link to="/forgot-password" className="shrink-0 text-sm font-semibold text-brand-600 hover:underline sm:text-base">
                  Şifremi unuttum
                </Link>
              </div>

              {turnstileEnabled && (
                <TurnstileWidget
                  ref={widgetRef}
                  onToken={setTurnstileToken}
                />
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </motion.button>
            </form>

            <div className="mt-6">
              <SocialAuthButtons flow="login" remember={remember} position="bottom" />
            </div>

            <p className="mt-6 text-center text-sm text-cream-800/60 sm:text-base">
              Hesabınız yok mu?{' '}
              <Link to="/onboarding" className="font-semibold text-brand-600 hover:underline">
                Kayıt olun
              </Link>
            </p>
          </AuthFormCard>
          </AuthFormShell>
        </motion.div>
      </div>

      <FormErrorModal
        open={errorModal.open}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, message: '' })}
      />
    </div>
  )
}
