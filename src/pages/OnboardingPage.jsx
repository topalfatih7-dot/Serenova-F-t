import { useEffect, useState, useRef } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check, Sparkles,
  User, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle,
  Dumbbell, HeartPulse, ArrowRight,
} from 'lucide-react'
import FormField from '../components/ui/FormField'
import LegalConsentCheckbox from '../components/ui/LegalConsentCheckbox'
import PhoneField from '../components/ui/PhoneField'
import BrandLogo from '../components/ui/BrandLogo'
import AuthFormShell, { AuthFormCard } from '../components/auth/AuthFormShell'
import SocialAuthButtons from '../components/auth/SocialAuthButtons'
import FormErrorModal from '../components/ui/FormErrorModal'
import GenderSelect from '../components/ui/GenderSelect'
import { isValidMemberGender } from '../data/genders'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { BRAND } from '../config/brand'
import { ALL_PLANS, isSellablePlanId, RECOMMENDED_PLAN } from '../data/membershipPlans'
import { DEFAULT_COUNTRY_ISO, isValidNationalNumber, toE164 } from '../data/countryCodes'
import { PASSWORD_RULES, isPasswordValid } from '../services/password'
import { trackGa4Event } from '../utils/ga4Loader'
import { isValidEmailAddress, sanitizeEmailInput } from '../utils/emailAddress'
import { displayNameFromAuthUser, isSocialAuthUser, hasRegisteredMember } from '../utils/memberProfile'
import { supabase } from '../services/supabaseClient'
import TurnstileWidget from '../components/security/TurnstileWidget'
import { useTurnstile } from '../hooks/useTurnstile'

const DRAFT_KEY = 'yf-onboarding-draft'
/** Remount sonrası /plans flash’ını engeller — profilde temizlenir. */
const JUST_REGISTERED_KEY = 'yf-just-registered'

/** Eski URL plan parametrelerini güncel plan id'lerine eşler (`free` ücretsiz kayıt olarak kalır) */
const LEGACY_PLAN_MAP = {
  eko: 'eko_diyet',
  gumus: 'eko_diyet',
  altin: 'doktor',
  platinum: 'vip',
  premium: 'vip',
  kurucu: 'doktor',
  basic: RECOMMENDED_PLAN,
}

function resolvePlanFromQuery(raw, plans) {
  if (!raw || raw === 'free') return 'free'
  const mapped = LEGACY_PLAN_MAP[raw] || raw
  return isSellablePlanId(mapped, plans) ? mapped : 'free'
}

const BENEFITS = [
  { icon: Dumbbell, text: 'Kişiye özel antrenman & beslenme programları' },
  { icon: HeartPulse, text: 'Uzman koç ve diyetisyen desteği' },
]

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      phoneCountry: typeof parsed.phoneCountry === 'string' ? parsed.phoneCountry : DEFAULT_COUNTRY_ISO,
      gender: typeof parsed.gender === 'string' ? parsed.gender : '',
      termsAccepted: Boolean(parsed.termsAccepted),
    }
  } catch {
    return null
  }
}

function saveDraft(fields) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      name: fields.name || '',
      email: fields.email || '',
      phone: fields.phone || '',
      phoneCountry: fields.phoneCountry || DEFAULT_COUNTRY_ISO,
      gender: fields.gender || '',
      termsAccepted: Boolean(fields.termsAccepted),
    }))
  } catch {
    /* quota / private mode */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export default function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const rawPlan = searchParams.get('plan') || 'free'
  const {
    plans,
    register,
    completeOAuthMember,
    isAuthenticated,
    isAdmin,
    isStaff,
    membership: currentMembership,
    user,
    authUser,
    loading,
  } = useApp()
  const catalogPlans = plans?.length ? plans : ALL_PLANS
  const preselectedPlan = resolvePlanFromQuery(rawPlan, catalogPlans)

  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(() => loadDraft()?.termsAccepted || false)
  const [errorModal, setErrorModal] = useState({ open: false, message: '' })

  const [data, setData] = useState(() => {
    const draft = loadDraft()
    return {
      name: draft?.name || '',
      email: draft?.email || '',
      phone: draft?.phone || '',
      phoneCountry: draft?.phoneCountry || DEFAULT_COUNTRY_ISO,
      gender: draft?.gender || '',
      password: '',
      confirmPassword: '',
    }
  })
  const {
    enabled: turnstileEnabled,
    widgetRef,
    setToken: setTurnstileToken,
    getTokenForSubmit,
    reset: resetTurnstile,
  } = useTurnstile()

  const { toast } = useToast()
  const navigate = useNavigate()
  const isExistingMember = isAuthenticated && !isAdmin && !isStaff && hasRegisteredMember(user)
  const isOAuthFlow = isAuthenticated && isSocialAuthUser(authUser) && !hasRegisteredMember(user)
  const oauthPrefilledRef = useRef(false)
  const justRegisteredRef = useRef(false)

  useEffect(() => {
    if (searchParams.get('oauth') !== '1' || isAuthenticated || loading) return
    let cancelled = false
    ;(async () => {
      if (!supabase) return
      for (let i = 0; i < 20; i += 1) {
        if (cancelled) return
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) return
        await new Promise((r) => setTimeout(r, 250))
      }
      if (!cancelled) {
        navigate('/login', {
          replace: true,
          state: { message: 'Sosyal hesap bağlantısı için önce giriş yapın.' },
        })
      }
    })()
    return () => { cancelled = true }
  }, [searchParams, isAuthenticated, loading, navigate])

  useEffect(() => {
    if (!isOAuthFlow || !isAuthenticated || oauthPrefilledRef.current) return
    oauthPrefilledRef.current = true
    const name = user?.name || displayNameFromAuthUser(authUser) || ''
    const email = user?.email || authUser?.email || ''
    setData((d) => {
      const next = {
        ...d,
        name: d.name || name,
        email: d.email || email,
      }
      saveDraft({ ...next, termsAccepted })
      return next
    })
  }, [isOAuthFlow, isAuthenticated, user, authUser, termsAccepted])

  useEffect(() => {
    if (!isExistingMember && searchParams.get('payment') === 'cancelled') {
      toast('Ödeme iptal edildi. Bir paket seçerek tekrar deneyebilirsiniz.', 'info')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isExistingMember && !isOAuthFlow) {
    let justRegistered = justRegisteredRef.current
    try {
      justRegistered = justRegistered || sessionStorage.getItem(JUST_REGISTERED_KEY) === '1'
    } catch {
      /* ignore */
    }
    // İlk kayıt / yeni üye → her zaman profil (planlar arka planda görünmesin)
    if (justRegistered) {
      return <Navigate to="/profile" replace state={{ welcome: true }} />
    }
    // Mevcut üye ücretli plan CTA ile geldiyse paket seçimine
    if (preselectedPlan && preselectedPlan !== 'free' && preselectedPlan !== currentMembership) {
      return <Navigate to={`/plans?plan=${encodeURIComponent(preselectedPlan)}`} replace />
    }
    return <Navigate to="/profile" replace />
  }

  const persistDraft = (nextData, nextTerms = termsAccepted) => {
    saveDraft({ ...nextData, termsAccepted: nextTerms })
  }

  const update = (patch) => {
    setData((d) => {
      const next = { ...d, ...patch }
      persistDraft(next)
      return next
    })
  }

  const handleTermsChange = (accepted) => {
    setTermsAccepted(accepted)
    persistDraft(data, accepted)
  }

  const showFormError = (message) => {
    setErrorModal({ open: true, message })
    toast(message, 'error', 5000)
  }

  const getValidationError = () => {
    if (!data.name.trim()) return 'Ad soyad alanını doldurun.'
    if (!isOAuthFlow && !isValidEmailAddress(data.email)) {
      return 'Geçerli bir e-posta adresi girin (ör. ad@site.com).'
    }
    if (!data.phone?.trim() || !isValidNationalNumber(data.phoneCountry, data.phone)) {
      return 'Geçerli bir cep telefonu numarası girin.'
    }
    if (!isValidMemberGender(data.gender)) {
      return 'Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.'
    }
    if (!isOAuthFlow && !isPasswordValid(data.password)) {
      return 'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.'
    }
    if (!isOAuthFlow && data.password !== data.confirmPassword) {
      return 'Şifreler eşleşmiyor — iki alanı da aynı yazın.'
    }
    if (!termsAccepted) {
      return 'Devam etmek için kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.'
    }
    return 'Lütfen eksik veya hatalı alanları düzeltin.'
  }

  const errors = {
    email: data.email && !isValidEmailAddress(data.email) ? 'Geçerli bir e-posta adresi girin (ör. ad@site.com)' : '',
    phone: data.phone && !isValidNationalNumber(data.phoneCountry, data.phone) ? 'Geçerli bir cep telefonu numarası girin' : '',
    gender: showErrors && !isValidMemberGender(data.gender) ? 'Kadın veya Erkek seçin' : '',
    password: data.password && !isPasswordValid(data.password) ? 'Şifre gereksinimleri karşılanmıyor' : '',
    confirmPassword: data.password && data.confirmPassword && data.password !== data.confirmPassword ? 'Şifreler eşleşmiyor' : '',
  }

  const canSubmit = () => {
    const baseOk = (
      data.name.trim() &&
      isValidNationalNumber(data.phoneCountry, data.phone) &&
      isValidMemberGender(data.gender) &&
      termsAccepted
    )
    if (isOAuthFlow) return baseOk
    return (
      baseOk &&
      isValidEmailAddress(data.email) &&
      isPasswordValid(data.password) &&
      data.password === data.confirmPassword
    )
  }

  const buildProfile = (captchaToken = '') => ({
    name: data.name.trim(),
    email: sanitizeEmailInput(isOAuthFlow ? (user?.email || authUser?.email || data.email) : data.email),
    phone: toE164(data.phoneCountry, data.phone),
    phoneCountry: data.phoneCountry,
    gender: data.gender,
    password: isOAuthFlow ? undefined : data.password,
    turnstileToken: isOAuthFlow ? undefined : captchaToken,
    fitnessLevel: 'beginner',
    goals: [],
    nutritionPrefs: [],
  })

  const finishFreeRegister = async () => {
    if (submitting) return
    if (!canSubmit()) {
      setShowErrors(true)
      showFormError(getValidationError())
      return
    }
    justRegisteredRef.current = true
    setSubmitting(true)
    let captchaToken = ''
    if (!isOAuthFlow && turnstileEnabled) {
      try {
        captchaToken = await getTokenForSubmit()
      } catch (err) {
        justRegisteredRef.current = false
        showFormError(err?.message || 'Bot doğrulamasını tamamlayın.')
        resetTurnstile()
        setSubmitting(false)
        return
      }
    }
    const profile = buildProfile(captchaToken)
    const r = isOAuthFlow
      ? await completeOAuthMember(profile, 'free')
      : await register(profile, 'free')
    if (!r.success) {
      justRegisteredRef.current = false
      resetTurnstile()
      showFormError(r.error || 'Kayıt oluşturulamadı.')
      setSubmitting(false)
      return
    }
    clearDraft()
    try {
      sessionStorage.setItem(JUST_REGISTERED_KEY, '1')
    } catch {
      /* ignore */
    }
    const oauthMethod = authUser?.app_metadata?.provider
      || authUser?.identities?.find((i) => i.provider && i.provider !== 'email')?.provider
      || 'social'
    trackGa4Event('sign_up', {
      method: isOAuthFlow ? oauthMethod : 'email',
      plan: 'free',
      trial: true,
    })
    navigate('/profile', { replace: true, state: { welcome: true } })
  }

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] overflow-hidden">
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
                bugün başlayın
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70 xl:mt-4 xl:text-base">
              Ücretsiz hesabınızı oluşturun; paket seçimini panelden istediğiniz zaman yapın.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-2.5 p-8 xl:space-y-3 xl:p-14">
          {BENEFITS.map(({ icon: Icon, text }, i) => (
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

      {/* Sağ panel — kayıt formu */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-cream-50 via-white to-brand-50/40 px-5 py-10 sm:px-8 md:px-12 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <AuthFormShell>
          <AuthFormCard>
            <h2 className="font-display text-2xl font-bold leading-tight text-cream-900 sm:text-[1.75rem]">
              {isOAuthFlow ? 'Son bir adım kaldı' : 'Hesabınızı oluşturun'}
            </h2>
            <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-r from-sage-300 via-brand-300 to-teal-300" />

            <div className="mt-5 space-y-3.5">
              {showErrors && !canSubmit() && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">
                    {isOAuthFlow
                      ? 'Lütfen ad soyad ve telefon numaranızı kontrol edin; koşulları kabul ettiğinizden emin olun.'
                      : 'Lütfen tüm alanları eksiksiz ve doğru doldurun.'}
                  </p>
                </div>
              )}

              {isOAuthFlow && (user?.email || authUser?.email) && (
                <div className="rounded-2xl border border-sage-200 bg-sage-50/80 px-4 py-3 text-sm text-sage-900">
                  <span className="font-semibold">Bağlı hesap:</span>{' '}
                  {user?.email || authUser?.email}
                </div>
              )}

              <FormField emphasis label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" value={data.name} onChange={(e) => update({ name: e.target.value })} />

              {!isOAuthFlow && (
                <FormField emphasis label="E-posta" icon={Mail} type="email" placeholder="ornek@email.com" value={data.email} onChange={(e) => update({ email: e.target.value })} onBlur={() => update({ email: sanitizeEmailInput(data.email) })} error={errors.email} />
              )}

              <PhoneField
                emphasis
                country={data.phoneCountry}
                value={data.phone}
                onCountryChange={(iso) => update({ phoneCountry: iso, phone: '' })}
                onValueChange={(phone) => update({ phone })}
                error={errors.phone}
                hint="İletişim ve destek için kullanılır."
              />

              <GenderSelect
                value={data.gender}
                onChange={(gender) => update({ gender })}
                error={errors.gender}
              />

              {!isOAuthFlow && (
              <>
              <div className="space-y-3">
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-cream-800">Şifre</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-700" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={data.password}
                      onChange={(e) => update({ password: e.target.value })}
                      className="w-full rounded-xl border border-cream-400 bg-white py-2.5 pl-9 pr-10 text-xs text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-cream-800">Şifre tekrar</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-700" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={data.confirmPassword}
                      onChange={(e) => update({ confirmPassword: e.target.value })}
                      className="w-full rounded-xl border border-cream-400 bg-white py-2.5 pl-9 pr-10 text-xs text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {data.password && (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {PASSWORD_RULES.map((r) => {
                    const ok = r.test(data.password)
                    return (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-sage-600' : 'text-cream-800/45'}`}>
                        <Check className={`h-3.5 w-3.5 ${ok ? '' : 'opacity-30'}`} strokeWidth={3} />
                        {r.label}
                      </li>
                    )
                  })}
                </ul>
              )}
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
              </>
              )}
            </div>

            <LegalConsentCheckbox
              className="mt-5"
              accepted={termsAccepted}
              onChange={handleTermsChange}
              error={showErrors && !termsAccepted}
            />

            {!isOAuthFlow && turnstileEnabled && (
              <div className="mt-4 flex justify-center">
                <TurnstileWidget
                  ref={widgetRef}
                  onToken={setTurnstileToken}
                />
              </div>
            )}

            <div className="mt-4">
              <motion.button
                type="button"
                onClick={finishFreeRegister}
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.99 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Kaydediliyor…' : 'Ücretsiz Üye Ol'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </div>

            {!isOAuthFlow && (
              <div className="mt-6">
                <SocialAuthButtons flow="signup" plan={preselectedPlan} remember position="bottom" />
              </div>
            )}

          <p className="mt-6 text-center text-sm text-cream-800/60">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Giriş yapın
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
