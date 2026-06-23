import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, Shield, Loader2, Sparkles, ArrowRight,
  HeartPulse, Dumbbell,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ADMIN_CREDENTIALS, BRAND } from '../../config/brand'
import { getRememberMe } from '../../services/authStorage'
import BrandLogo from '../../components/ui/BrandLogo'
import FormField from '../../components/ui/FormField'

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
  const { login, isAuthenticated, isAdmin, isStaff } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from || null
  const msgShownRef = useRef(false)

  useEffect(() => {
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
    if (redirectTo && !redirectTo.startsWith('/login')) {
      navigate(redirectTo, { replace: true })
      return
    }
    if (isAdmin) navigate('/admin', { replace: true })
    else if (isStaff) navigate('/staff', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [isAuthenticated, isAdmin, isStaff, redirectTo, navigate])

  const validate = () => {
    const e = {}
    if (!email.includes('@')) e.email = 'Geçerli e-posta girin'
    if (password.length < 6) e.password = 'En az 6 karakter'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await login(email, password, remember)
      if (!result.success) {
        toast(result.error || 'Giriş başarısız', 'error')
        return
      }
      toast('Hoş geldiniz!', 'success')
      const target = redirectTo && !redirectTo.startsWith('/login')
        ? redirectTo
        : result.role === 'admin'
          ? '/admin'
          : result.role === 'staff'
            ? '/staff'
            : '/dashboard'
      navigate(target, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] overflow-hidden">
      {/* Sol panel — marka */}
      <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster="/hero-bg.png"
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

        <div className="relative z-10 p-10 xl:p-14">
          <BrandLogo variant="light" size="lg" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-16 max-w-md"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
              {BRAND.tagline}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white xl:text-[2.75rem]">
              Dönüşüm yolculuğunuza{' '}
              <span className="bg-gradient-to-r from-brand-200 to-sage-200 bg-clip-text text-transparent">
                kaldığınız yerden
              </span>{' '}
              devam edin
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Programlarınız, randevularınız ve ilerlemeniz tek panelde sizi bekliyor.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-3 p-10 xl:p-14">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-white/90">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-cream-50 via-white to-brand-50/40 px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-brand-900/[0.06] backdrop-blur-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-cream-900 sm:text-3xl">Tekrar hoş geldiniz</h2>
            <p className="mt-2 text-sm text-cream-800/60">Hesabınıza giriş yapın</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <FormField
                emphasis
                label="E-posta"
                icon={Mail}
                type="email"
                placeholder="ornek@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Şifre</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-2xl border py-3.5 pl-11 pr-12 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/55 ${
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 block text-xs font-medium text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex select-none items-center gap-2.5 text-sm font-medium text-cream-800/80"
                  aria-pressed={remember}
                >
                  <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${remember ? 'bg-brand-500' : 'bg-cream-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${remember ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                  </span>
                  Beni hatırla
                </button>
                <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">
                  Şifremi unuttum
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-cream-800/60">
              Hesabınız yok mu?{' '}
              <Link to="/onboarding" className="font-semibold text-brand-600 hover:underline">
                Ücretsiz kayıt olun
              </Link>
            </p>
          </div>

          <details className="mt-6 rounded-2xl border border-cream-200 bg-white/60">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-cream-800/70">
              <Shield className="h-4 w-4 text-brand-500" />
              Admin giriş bilgileri
            </summary>
            <div className="border-t border-cream-100 px-4 py-3 text-xs text-cream-800/60">
              <p>E-posta: <code className="rounded bg-cream-100 px-1.5 py-0.5">{ADMIN_CREDENTIALS.email}</code></p>
              <p className="mt-1">Şifre: <code className="rounded bg-cream-100 px-1.5 py-0.5">{ADMIN_CREDENTIALS.password}</code></p>
            </div>
          </details>
        </motion.div>
      </div>
    </div>
  )
}
