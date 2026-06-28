import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, LayoutDashboard, LogIn, Sparkles } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { markEmailVerified, confirmEmailVerificationByEvt } from '../../services/authVerification'
import { BRAND } from '../../config/brand'
import { getPostLoginPath } from '../../services/platformStats'
import { useApp } from '../../context/AppContext'

function FloatingOrb({ className, delay = 0 }) {
  return (
    <motion.div
      aria-hidden
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{ y: [0, -18, 0], x: [0, 12, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

function stripAuthCodeFromUrl() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('code')) return
  params.delete('code')
  const qs = params.toString()
  const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}`
  window.history.replaceState({}, '', clean)
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useApp()
  const [phase, setPhase] = useState('loading')
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      navigate('/login', { replace: true })
      return undefined
    }

    let active = true

    async function establishSession() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.session) {
          stripAuthCodeFromUrl()
          return data.session
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) return session

      const started = Date.now()
      while (Date.now() - started < 6000) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s?.user) return s
        await new Promise((r) => setTimeout(r, 350))
      }
      return null
    }

    // Doğrulama başarıya ulaştığında UI'ı hemen günceller; oturum yenileme arka planda
    // yapılır ki refresh yavaşlasa/hata verse bile ekran "doğrulanıyor"da takılmaz.
    function markSuccess(session) {
      if (!active) return
      setHasSession(Boolean(session?.user))
      setPhase('success')
      Promise.resolve(refresh()).catch(() => { /* arka plan; UI'ı bloklama */ })
    }

    async function finish() {
      const hash = window.location.hash || ''
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
      const authError = searchParams.get('error') || hashParams.get('error')
      const errorCode = searchParams.get('error_code') || hashParams.get('error_code')
      const evt = searchParams.get('evt') || hashParams.get('evt')

      const isRecovery =
        hash.includes('type=recovery') ||
        searchParams.get('type') === 'recovery' ||
        searchParams.get('next') === 'reset-password'

      if (isRecovery) {
        const session = await establishSession()
        if (session && active) {
          navigate('/reset-password', { replace: true })
        } else if (active) {
          setPhase('error')
        }
        return
      }

      const verify = searchParams.get('verify')

      // evt jetonu varsa (e-posta bağlantısı) öncelikli ve en güvenilir yol.
      if (evt) {
        const evtResult = await confirmEmailVerificationByEvt(evt)
        if (evtResult?.success) {
          const session = await establishSession().catch(() => null)
          markSuccess(session)
          return
        }
        // evt başarısız oldu (süresi dolmuş/kullanılmış). Hata kodu varsa hata göster.
        if (authError || errorCode) {
          if (active) setPhase('error')
          return
        }
      }

      if (authError || errorCode === 'otp_expired') {
        if (active) setPhase('error')
        return
      }

      const session = await establishSession().catch(() => null)

      if (verify === 'email') {
        if (session?.user) {
          const marked = await markEmailVerified({ id: session.user.id, email: session.user.email })
          if (marked?.success === false && active) {
            // Profil kaydı güncellenemese bile oturum açık; yine de başarı göster.
            markSuccess(session)
            return
          }
          markSuccess(session)
          return
        }
        if (active) {
          setHasSession(false)
          setPhase('prefetch')
        }
        return
      }

      if (session?.user) {
        const db = await refresh().catch(() => null)
        if (active) navigate(getPostLoginPath(db), { replace: true })
        return
      }

      if (active) setPhase('error')
    }

    finish().catch(() => {
      // Beklenmeyen hata: ekranı asla "doğrulanıyor"da bırakma.
      if (active) setPhase('error')
    })

    return () => { active = false }
  }, [navigate, searchParams, refresh])

  const goPanel = async () => {
    if (hasSession) {
      const db = await refresh().catch(() => null)
      navigate(getPostLoginPath(db), { replace: true })
      return
    }
    navigate('/login', { replace: true })
  }

  const copy = {
    loading: {
      title: 'E-postanız doğrulanıyor…',
      description: 'Lütfen bekleyin, işleminiz güvenli bir şekilde tamamlanıyor.',
    },
    success: {
      title: 'E-posta adresiniz onaylandı!',
      description: 'Doğrulama başarıyla tamamlandı. Panele geçerek hesabınızı kullanmaya devam edebilirsiniz.',
    },
    prefetch: {
      title: 'Doğrulama bağlantısı işlendi',
      description:
        'Oturum bu cihazda açılamadı. Giriş yapıp profilinizden tekrar “Doğrulama Bağlantısı Gönder” ile deneyin.',
    },
    error: {
      title: 'Bağlantı doğrulanamadı',
      description: 'Bağlantının süresi dolmuş veya zaten kullanılmış olabilir. Tekrar giriş yapıp yeni bağlantı isteyin.',
    },
  }[phase]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 px-4 py-10">
      <FloatingOrb className="left-[8%] top-[12%] h-56 w-56 bg-brand-400/30" delay={0} />
      <FloatingOrb className="right-[6%] top-[20%] h-72 w-72 bg-sage-400/25" delay={1.2} />
      <FloatingOrb className="bottom-[10%] left-[30%] h-64 w-64 bg-violet-400/20" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 flex items-center gap-3"
      >
        <img src={BRAND.assets.mark} alt="" className="h-12 w-12 rounded-2xl shadow-lg ring-2 ring-white/20" />
        <img src={BRAND.assets.logo} alt={BRAND.name} className="h-8 brightness-0 invert" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-sage-500 to-violet-500" />

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center">
              {phase === 'loading' && (
                <motion.div
                  className="relative flex h-20 w-20 items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500" />
                  <Loader2 className="h-8 w-8 text-brand-500" />
                </motion.div>
              )}
              {phase === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-emerald-600 text-white shadow-lg shadow-sage-500/40"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.div>
              )}
              {phase === 'prefetch' && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/40">
                  <Sparkles className="h-9 w-9" />
                </div>
              )}
              {phase === 'error' && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                  <AlertCircle className="h-9 w-9" />
                </div>
              )}
            </div>

            <h1 className="mt-6 font-display text-2xl font-bold text-cream-900">{copy?.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-cream-800/65">{copy?.description}</p>

            {phase !== 'loading' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex flex-col gap-2.5"
              >
                {(phase === 'success' || phase === 'prefetch') && (
                  <button
                    type="button"
                    onClick={goPanel}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {hasSession ? 'Panele Git' : 'Giriş Yap'}
                  </button>
                )}
                {phase === 'success' && (
                  <p className="text-xs text-cream-800/45">Oturumunuz açık; panele yönlendirileceksiniz.</p>
                )}
                {phase === 'prefetch' && (
                  <Link
                    to="/login"
                    className="text-center text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Giriş sayfasına git
                  </Link>
                )}
                {phase === 'error' && (
                  <>
                    <Link
                      to="/profile"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                    >
                      Profilden Yeni Bağlantı İste
                    </Link>
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-white py-3.5 text-sm font-semibold text-cream-800 transition hover:bg-cream-50"
                    >
                      <LogIn className="h-4 w-4" /> Giriş Yap
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="relative mt-8 text-center text-xs text-white/40">© {new Date().getFullYear()} {BRAND.name}</p>
    </div>
  )
}
