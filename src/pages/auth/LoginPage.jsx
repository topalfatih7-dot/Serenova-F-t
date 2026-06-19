import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ADMIN_CREDENTIALS } from '../../config/brand'
import { getRememberMe } from '../../services/authStorage'

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

  // Yönlendirme mesajını yalnızca bir kez göster ve state'i temizle
  useEffect(() => {
    const msg = location.state?.message
    if (msg && !msgShownRef.current) {
      msgShownRef.current = true
      toast(msg, 'info')
      // Mesajı state'ten temizle — tekrar görünmesin
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

  const fieldVariants = {
    hidden: { opacity: 0, x: -16 },
    show: (i) => ({ opacity: 1, x: 0, transition: { delay: 0.25 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
  }

  return (
    <div className="flex min-h-[calc(100svh-64px)] items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      {/* Ortalanmış giriş formu */}
      <div className="flex w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Başlık */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h1 className="font-display text-3xl font-bold text-cream-900">Tekrar hoş geldiniz</h1>
            <p className="mt-2 text-sm text-cream-800/55">Hesabınıza giriş yapın</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* E-posta */}
            <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={0}>
              <label className="mb-1.5 block text-sm font-medium text-cream-900">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35 transition" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-2xl border bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${errors.email ? 'border-red-300 bg-red-50/30' : 'border-cream-200'}`}
                  placeholder="ornek@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-red-500">
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Şifre */}
            <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={1}>
              <label className="mb-1.5 block text-sm font-medium text-cream-900">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-2xl border bg-white py-3.5 pl-10 pr-11 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${errors.password ? 'border-red-300 bg-red-50/30' : 'border-cream-200'}`}
                  placeholder="••••••••"
                  autoComplete={remember ? 'current-password' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-cream-800/35 transition hover:text-brand-500"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-red-500">
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Beni hatırla + Şifremi unuttum */}
            <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={2} className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRemember((v) => !v)}
                className="flex select-none items-center gap-2.5 text-sm font-medium text-cream-800/80"
                aria-pressed={remember}
              >
                <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ${remember ? 'bg-brand-500' : 'bg-cream-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${remember ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                </span>
                <span className={remember ? 'text-cream-900' : ''}>Beni hatırla</span>
              </button>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
                Şifremi unuttum
              </Link>
            </motion.div>

            {/* Giriş Yap butonu */}
            <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={3}>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </motion.button>
            </motion.div>

            <motion.p
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              custom={4}
              className="text-center text-sm text-cream-800/55"
            >
              Hesabınız yok mu?{' '}
              <Link to="/onboarding" className="font-semibold text-brand-600 hover:underline">
                Ücretsiz kayıt olun
              </Link>
            </motion.p>
          </form>

          {/* Admin bilgi kartı */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 rounded-2xl border border-cream-100 bg-cream-50 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-cream-900">
              <Shield className="h-4 w-4 text-brand-500" />
              Admin Girişi
            </div>
            <p className="mt-2 text-xs text-cream-800/60">
              E-posta: <code className="rounded-md bg-white px-1.5 py-0.5 text-cream-800">{ADMIN_CREDENTIALS.email}</code>
            </p>
            <p className="mt-1 text-xs text-cream-800/60">
              Şifre: <code className="rounded-md bg-white px-1.5 py-0.5 text-cream-800">{ADMIN_CREDENTIALS.password}</code>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
