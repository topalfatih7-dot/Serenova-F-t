import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, LayoutDashboard, LogIn, Sparkles } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { markEmailVerified, confirmEmailVerificationByEvt } from '../../services/authVerification'
import { BRAND } from '../../config/brand'
import { getPostLoginPath } from '../../services/platformStats'
import { establishAuthSessionFromUrl } from '../../services/authSessionFromUrl'
import { recordSocialLogin, resolveQuickPostLoginPath } from '../../services/supabaseDb'
import {
  applyOAuthPendingToParams,
  clearOAuthPending,
  peekOAuthPending,
} from '../../services/oauthAuth'
import { useApp } from '../../context/AppContext'

const AUTO_REDIRECT_SECONDS = 10
const REFRESH_TIMEOUT_MS = 4000
const OAUTH_SAFETY_TIMEOUT_MS = 12000

/** StrictMode çift finish: OAuth navigate tek kez. */
let oauthNavigateLock = false

function readCallbackParams() {
  const params = new URLSearchParams(window.location.search)
  const hashRaw = (window.location.hash || '').replace(/^#/, '')
  const hashParams = new URLSearchParams(hashRaw)
  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })
  applyOAuthPendingToParams(params)
  return params
}

function isOAuthCallbackParams(params) {
  const flow = params.get('flow')
  if (flow === 'login' || flow === 'signup') return true
  // Site URL köküne ?code= düşüp flow kaybolursa yine OAuth say
  return Boolean(params.get('code'))
}

function refreshWithTimeout(refresh, ms = REFRESH_TIMEOUT_MS) {
  return Promise.race([
    Promise.resolve(refresh()).catch(() => null),
    new Promise((resolve) => { setTimeout(() => resolve(null), ms) }),
  ])
}

// Orb animasyonu CSS sınıflarına taşındı — JS RAF döngüsü ortadan kalktı
function FloatingOrb({ className, variant = 'a' }) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-full blur-3xl landing-orb-${variant} ${className}`}
    />
  )
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useApp()
  const [phase, setPhase] = useState('loading')
  const [hasSession, setHasSession] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [countdownPhase, setCountdownPhase] = useState(phase)
  if (phase !== countdownPhase) {
    setCountdownPhase(phase)
    setCountdown(phase === 'success' ? AUTO_REDIRECT_SECONDS : null)
  }
  const countdownRef = useRef(null)
  const dbRef = useRef(null)
  const navigatingRef = useRef(false)
  const refreshRef = useRef(refresh)

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  const isOAuthCallback =
    searchParams.get('flow') === 'login' ||
    searchParams.get('flow') === 'signup' ||
    Boolean(searchParams.get('code')) ||
    Boolean(peekOAuthPending())

  const completeOAuthSignIn = useCallback(async (session) => {
    if (oauthNavigateLock || navigatingRef.current) return
    oauthNavigateLock = true
    navigatingRef.current = true
    const params = readCallbackParams()
    const plan = params.get('plan') || 'free'
    try {
      const dest = await resolveQuickPostLoginPath(session, { plan })
        .catch(() => `/onboarding?oauth=1&plan=${encodeURIComponent(plan)}`)
      if (!dest.includes('/onboarding')) {
        recordSocialLogin().catch(() => {})
      }
      clearOAuthPending()
      const db = await refreshWithTimeout(refreshRef.current)
      dbRef.current = db
      navigate(dest, { replace: true })
    } catch {
      oauthNavigateLock = false
      navigatingRef.current = false
      throw new Error('oauth_complete_failed')
    }
  }, [navigate])

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      navigate('/login', { replace: true })
      return undefined
    }

    let active = true

    async function establishSession(isOAuthFlow) {
      return establishAuthSessionFromUrl(supabase, { waitMs: isOAuthFlow ? 4000 : 2500 })
    }

    function markSuccess(session) {
      if (!active) return
      setHasSession(Boolean(session?.user))
      setPhase('success')
      refreshWithTimeout(refreshRef.current).then((db) => { dbRef.current = db })
    }

    async function finish() {
      const params = readCallbackParams()
      const authError = params.get('error')
      const errorCode = params.get('error_code')
      const evt = params.get('evt')
      const verify = params.get('verify')
      const isOAuthFlow = isOAuthCallbackParams(params)

      const isRecovery =
        (window.location.hash || '').includes('type=recovery') ||
        params.get('type') === 'recovery' ||
        params.get('next') === 'reset-password'

      if (isRecovery) {
        const tokenHash = params.get('token_hash')
        const recoveryType = params.get('type') || 'recovery'
        if (active) {
          const dest = tokenHash
            ? `/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(recoveryType)}`
            : '/reset-password'
          navigate(dest, { replace: true })
        }
        return
      }

      if (evt) {
        const evtResult = await confirmEmailVerificationByEvt(evt)
        if (evtResult?.success) {
          const session = await establishSession(false).catch(() => null)
          markSuccess(session)
          return
        }
        if (authError || errorCode) {
          if (active) setPhase('error')
          return
        }
      }

      if (authError || errorCode === 'otp_expired') {
        if (active) setPhase('error')
        return
      }

      const session = await establishSession(isOAuthFlow).catch(() => null)

      if (verify === 'email') {
        if (session?.user) {
          await markEmailVerified({ id: session.user.id, email: session.user.email })
          markSuccess(session)
          return
        }
        if (active) {
          setHasSession(false)
          setPhase('prefetch')
        }
        return
      }

      if (session?.user && isOAuthFlow) {
        await completeOAuthSignIn(session)
        return
      }

      if (session?.user) {
        const plan = params.get('plan') || 'free'
        const dest = await resolveQuickPostLoginPath(session, { plan }).catch(() => '/profile')
        clearOAuthPending()
        await refreshWithTimeout(refreshRef.current)
        if (!active) return
        navigate(dest, { replace: true })
        return
      }

      if (active) setPhase('error')
    }

    finish().catch(() => {
      if (active) setPhase('error')
    })

    return () => { active = false }
  }, [navigate, completeOAuthSignIn])

  // OAuth: uzun süre loading'de kalırsa oturumu kontrol et ve zorla tamamla
  useEffect(() => {
    if (!isOAuthCallback || phase !== 'loading' || !supabase) return undefined

    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        try {
          await completeOAuthSignIn(session)
        } catch {
          setPhase('error')
        }
        return
      }
      setPhase('error')
    }, OAUTH_SAFETY_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [isOAuthCallback, phase, completeOAuthSignIn])

  const goPanel = useCallback(async () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (hasSession) {
      const db = dbRef.current || await refreshWithTimeout(refreshRef.current)
      navigate(getPostLoginPath(db), { replace: true })
      return
    }
    navigate('/login', { replace: true })
  }, [hasSession, navigate])

  useEffect(() => {
    if (phase !== 'success') return undefined
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c == null) return c
        if (c <= 1) {
          clearInterval(countdownRef.current)
          goPanel()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [phase, goPanel])

  const copy = {
    loading: isOAuthCallback ? {
      title: 'Giriş tamamlanıyor…',
      description: 'Google hesabınız doğrulandı, oturumunuz açılıyor.',
    } : {
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
    error: isOAuthCallback ? {
      title: 'Giriş tamamlanamadı',
      description: 'Google oturumu kurulamadı. Lütfen tekrar deneyin veya e-posta ile giriş yapın.',
    } : {
      title: 'Bağlantı doğrulanamadı',
      description: 'Bağlantının süresi dolmuş veya zaten kullanılmış olabilir. Tekrar giriş yapıp yeni bağlantı isteyin.',
    },
  }[phase]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 px-4 py-10">
      <FloatingOrb variant="a" className="left-[8%] top-[12%] h-56 w-56 bg-brand-400/30" />
      <FloatingOrb variant="b" className="right-[6%] top-[20%] h-72 w-72 bg-sage-400/25" />
      <FloatingOrb variant="c" className="bottom-[10%] left-[30%] h-64 w-64 bg-violet-400/20" />

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
                  <p className="text-xs text-cream-800/45">
                    Oturumunuz açık; {countdown} saniye içinde otomatik yönlendirileceksiniz.
                  </p>
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
                    {!isOAuthCallback && (
                      <Link
                        to="/profile"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                      >
                        Profilden Yeni Bağlantı İste
                      </Link>
                    )}
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
