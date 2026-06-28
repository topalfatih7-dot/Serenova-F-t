import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, ArrowLeft, Loader2, Eye, EyeOff,
  CheckCircle2, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { useToast } from '../../context/ToastContext'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { BRAND } from '../../config/brand'

/* ── şifre güç göstergesi ── */
function PasswordStrength({ password }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const total  = PASSWORD_RULES.length
  const pct    = total ? (passed / total) * 100 : 0

  const bar   = pct === 0 ? 'bg-cream-200' : pct <= 40 ? 'bg-red-400' : pct <= 70 ? 'bg-amber-400' : pct < 100 ? 'bg-brand-400' : 'bg-sage-500'
  const label = pct === 0 ? '' : pct <= 40 ? 'Çok zayıf' : pct <= 70 ? 'Orta' : pct < 100 ? 'İyi' : 'Güçlü'

  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-100">
          <div className={`h-full rounded-full transition-all duration-300 ${bar}`} style={{ width: `${pct}%` }} />
        </div>
        {label && <span className="text-xs font-medium text-cream-800/60">{label}</span>}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password)
          return (
            <li key={r.label} className={`flex items-center gap-1 text-xs transition-colors ${ok ? 'text-sage-600' : 'text-cream-800/40'}`}>
              <span className="text-base leading-none">{ok ? '✓' : '·'}</span>
              {r.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ── şifre alanı (göz ikonu ile) ── */
function PasswordField({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-cream-200 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-cream-800/70"
        tabIndex={-1}
        aria-label={show ? 'Gizle' : 'Göster'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Ana bileşen
══════════════════════════════════════════════════════════ */
export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [status, setStatus]     = useState('loading') // loading | ready | done | invalid
  const [loading, setLoading]   = useState(false)
  const { toast } = useToast()
  const navigate  = useNavigate()

  /* ── oturum kurma ── */
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) { setStatus('invalid'); return undefined }

    let cancelled = false
    let settled   = false
    const markReady = () => { if (!cancelled && !settled) { settled = true; setStatus('ready') } }
    const markInvalid = () => { if (!cancelled && !settled) { settled = true; setStatus('invalid') } }

    // PASSWORD_RECOVERY eventi → oturum hazır
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') markReady()
    })

    async function init() {
      const tokenHash    = searchParams.get('token_hash')
      const recoveryType = searchParams.get('type') || 'recovery'

      // 1) token_hash varsa → verifyOtp ile oturum kur (en sağlıklı yol)
      if (tokenHash) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: recoveryType,
          })
          if (!cancelled) {
            if (!error && data?.session) {
              // Token işlendi — URL'den temizle (AuthRedirectHandler döngüsünü önle)
              window.history.replaceState({}, '', '/reset-password')
              markReady()
              return
            }
            // token hatalıysa aşağı devam et (mevcut oturumu dene)
          }
        } catch { /* devam */ }
      }

      if (cancelled || settled) return

      // 2) Mevcut oturum var mı? (aynı sekmede navigate ile geldiyse)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !cancelled) { markReady(); return }
      } catch { /* devam */ }

      if (cancelled || settled) return

      // 3) Kısa bekleme (Supabase async oturum işlemi için)
      for (let i = 0; i < 10; i++) {
        if (cancelled || settled) return
        await new Promise((r) => setTimeout(r, 400))
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && !cancelled) { markReady(); return }
        } catch { /* devam */ }
      }

      markInvalid()
    }

    init()
    return () => { cancelled = true; subscription?.unsubscribe() }
  }, [searchParams])

  /* ── şifre güncelleme ── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!isPasswordValid(password)) { toast('Şifre tüm kuralları karşılamalı', 'error'); return }
    if (password !== confirm)       { toast('Şifreler eşleşmiyor', 'error'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setStatus('done')
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      toast(err.message || 'Şifre güncellenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }, [password, confirm, navigate, toast])

  if (!isSupabaseEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-cream-800/60">Supabase yapılandırması gerekli.</p>
      </div>
    )
  }

  /* ── durum içerikleri ── */
  const phaseMap = {
    loading: {
      icon: (
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500" />
          <ShieldCheck className="h-8 w-8 text-brand-500" />
        </motion.div>
      ),
      title: 'Bağlantı doğrulanıyor…',
      body: 'Güvenli oturum kuruluyor, lütfen bekleyin.',
    },
    invalid: {
      icon: (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <AlertCircle className="h-10 w-10" />
        </div>
      ),
      title: 'Bağlantı geçersiz',
      body: 'Sıfırlama bağlantısının süresi dolmuş veya zaten kullanılmış. Yeni bağlantı isteyin.',
    },
    done: {
      icon: (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-emerald-600 text-white shadow-lg shadow-sage-500/40"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
      ),
      title: 'Şifreniz güncellendi!',
      body: 'Yeni şifreniz kaydedildi. Birkaç saniye içinde giriş sayfasına yönlendiriliyorsunuz…',
    },
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 px-4 py-10">
      {/* arka plan orb'lar */}
      <div aria-hidden className="pointer-events-none absolute left-[8%] top-[12%] h-56 w-56 rounded-full bg-brand-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-[6%] top-[20%] h-72 w-72 rounded-full bg-sage-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[10%] left-[30%] h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

      {/* logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 flex items-center gap-3"
      >
        <img src={BRAND.assets.mark} alt="" className="h-12 w-12 rounded-2xl shadow-lg ring-2 ring-white/20" />
        <img src={BRAND.assets.logo} alt={BRAND.name} className="h-8 brightness-0 invert" />
      </motion.div>

      {/* kart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-sage-500 to-violet-500" />

        <AnimatePresence mode="wait">
          {/* ── yükleme / hata / başarı durumları ── */}
          {status !== 'ready' ? (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center">
                {phaseMap[status]?.icon}
              </div>
              <h1 className="mt-6 font-display text-2xl font-bold text-cream-900">
                {phaseMap[status]?.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-cream-800/65">
                {phaseMap[status]?.body}
              </p>
              {status === 'invalid' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-8 flex flex-col gap-2.5"
                >
                  <Link
                    to="/forgot-password"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                  >
                    Yeni Sıfırlama Bağlantısı İste
                  </Link>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-white py-3.5 text-sm font-semibold text-cream-800 transition hover:bg-cream-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Giriş Yap
                  </Link>
                </motion.div>
              )}
              {status === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8"
                >
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                  >
                    Giriş Yap
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ── form ── */
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                to="/login"
                className="mb-6 inline-flex items-center gap-1 text-sm text-cream-800/60 hover:text-brand-600"
              >
                <ArrowLeft className="h-4 w-4" /> Girişe dön
              </Link>
              <h1 className="font-display text-2xl font-bold text-cream-900">Yeni Şifre Belirle</h1>
              <p className="mt-2 text-sm text-cream-800/65">Hesabınız için güçlü bir şifre oluşturun.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* yeni şifre */}
                <div>
                  <PasswordField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Yeni şifre"
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={password} />
                </div>

                {/* tekrar */}
                <div>
                  <PasswordField
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Yeni şifre (tekrar)"
                    autoComplete="new-password"
                  />
                  {confirm && password !== confirm && (
                    <p className="mt-1 text-xs text-red-500">Şifreler eşleşmiyor</p>
                  )}
                  {confirm && password === confirm && isPasswordValid(password) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-sage-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Şifreler eşleşiyor
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid(password) || password !== confirm}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105 disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…</>
                    : <><ShieldCheck className="h-4 w-4" /> Şifremi Güncelle</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="relative mt-8 text-center text-xs text-white/40">© {new Date().getFullYear()} {BRAND.name}</p>
    </div>
  )
}
