import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (location.state?.message) {
      toast(location.state.message, 'info')
    }
  }, [location.state?.message, toast])

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
    <div className="auth-page-bg flex items-center justify-center px-4 py-12">
      <div aria-hidden className="wellness-orb left-[10%] top-[15%] h-48 w-48 bg-brand-300/30" />
      <div aria-hidden className="wellness-orb right-[5%] bottom-[10%] h-56 w-56 bg-sage-300/25" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-cream-900">Tekrar hoş geldiniz</h1>
          <p className="mt-2 text-cream-800/60">Kayıtlı hesabınızla giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card-solid mt-8 p-6 sm:p-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-300 ${errors.email ? 'border-red-300' : 'border-cream-200'}`}
                  placeholder="kayit@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none focus:border-brand-300 ${errors.password ? 'border-red-300' : 'border-cream-200'}`}
                  placeholder="••••••••"
                  autoComplete={remember ? 'current-password' : 'password'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRemember((v) => !v)}
              className="group flex select-none items-center gap-2.5 text-sm font-medium text-cream-800/80"
              aria-pressed={remember}
            >
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
                  remember ? 'bg-brand-500' : 'bg-cream-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    remember ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                  }`}
                />
              </span>
              <span className={remember ? 'text-cream-900' : ''}>Beni hatırla</span>
            </button>
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Şifremi unuttum</Link>
          </div>
          <p className="mt-3 text-xs text-cream-800/45">
            {remember
              ? 'Oturumunuz bu cihazda kalıcı olarak saklanır.'
              : 'Oturum yalnızca bu sekme açıkken geçerlidir; tarayıcıyı kapattığınızda tekrar giriş gerekir.'}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:brightness-105 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          <p className="mt-6 text-center text-sm text-cream-800/60">
            Hesabınız yok mu?{' '}
            <Link to="/onboarding" className="font-medium text-brand-600 hover:underline">Kayıt olun</Link>
          </p>
        </form>

        <div className="mt-6 rounded-xl border border-cream-200 bg-cream-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-cream-900">
            <Shield className="h-4 w-4 text-brand-500" />
            Admin Girişi
          </div>
          <p className="mt-2 text-xs text-cream-800/60">
            E-posta: <code className="rounded bg-white px-1.5 py-0.5">{ADMIN_CREDENTIALS.email}</code>
          </p>
          <p className="mt-1 text-xs text-cream-800/60">
            Şifre: <code className="rounded bg-white px-1.5 py-0.5">{ADMIN_CREDENTIALS.password}</code>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
