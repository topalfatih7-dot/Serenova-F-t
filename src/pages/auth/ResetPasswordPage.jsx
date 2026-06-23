import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { useToast } from '../../context/ToastContext'
import { isPasswordValid } from '../../services/password'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    const hash = window.location.hash || ''
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setReady(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isPasswordValid(password)) {
      toast('Şifre en az 8 karakter, büyük/küçük harf ve rakam içermeli', 'error')
      return
    }
    if (password !== confirm) {
      toast('Şifreler eşleşmiyor', 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast('Şifreniz güncellendi', 'success')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      toast(err.message || 'Şifre güncellenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseEnabled) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <p className="text-sm text-cream-800/60">Supabase yapılandırması gerekli.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-cream-800/60 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Girişe dön
        </Link>
        <h1 className="font-display text-2xl font-bold text-cream-900">Yeni Şifre Belirle</h1>
        <p className="mt-2 text-sm text-cream-800/60">Hesabınız için yeni bir şifre oluşturun.</p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-sage-200 bg-sage-50 p-6 text-center">
            <p className="font-medium text-sage-700">Şifreniz kaydedildi!</p>
            <p className="mt-2 text-sm text-cream-800/60">Giriş sayfasına yönlendiriliyorsunuz…</p>
          </div>
        ) : !ready ? (
          <div className="mt-8 rounded-2xl border border-cream-200 bg-white p-6 text-center">
            <p className="text-sm text-cream-800/70">Geçersiz veya süresi dolmuş bağlantı.</p>
            <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
              Yeni sıfırlama bağlantısı iste
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-cream-200 bg-white p-6">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-cream-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
                placeholder="Yeni şifre"
                autoComplete="new-password"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-cream-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
                placeholder="Yeni şifre (tekrar)"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Şifreyi Kaydet
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
