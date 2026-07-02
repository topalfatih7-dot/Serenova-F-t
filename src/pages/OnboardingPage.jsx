import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Sparkles,
  User, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle,
  Dumbbell, HeartPulse, ArrowRight, ArrowLeft,
} from 'lucide-react'
import Stepper from '../components/ui/Stepper'
import PaymentForm from '../components/payment/PaymentForm'
import FormField from '../components/ui/FormField'
import LegalConsentCheckbox from '../components/ui/LegalConsentCheckbox'
import PhoneField from '../components/ui/PhoneField'
import Modal from '../components/ui/Modal'
import BrandLogo from '../components/ui/BrandLogo'
import AuthFormShell, { AuthFormCard } from '../components/auth/AuthFormShell'
import WelcomeSuccessModal from '../components/auth/WelcomeSuccessModal'
import SocialAuthButtons from '../components/auth/SocialAuthButtons'
import FormErrorModal from '../components/ui/FormErrorModal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { BRAND } from '../config/brand'
import { isPaidMembership, ALL_PLANS, getTierPrice, PLAN_IDS, sortPlansForDisplay, getDefaultPackageForPlan } from '../data/membershipPlans'
import { DEFAULT_COUNTRY_ISO, isValidNationalNumber, toE164 } from '../data/countryCodes'
import { PASSWORD_RULES, isPasswordValid } from '../services/password'
import { isStripeEnabled } from '../config/stripe'
import { startStripeCheckout } from '../services/stripePayment'
import MembershipPlanCard from '../components/membership/MembershipPlanCard'
import MembershipDurationPicker from '../components/membership/MembershipDurationPicker'
const STEPS = ['Hesap', 'Üyelik']
import { isValidEmailAddress, sanitizeEmailInput } from '../utils/emailAddress'
import { memberNeedsProfileCompletion, displayNameFromAuthUser, isSocialAuthUser } from '../utils/memberProfile'
import { supabase } from '../services/supabaseClient'
const VALID_PLANS = [...PLAN_IDS, 'gumus', 'altin', 'platinum', 'premium']

const BENEFITS = [
  { icon: Dumbbell, text: 'Kişiye özel antrenman & beslenme programları' },
  { icon: HeartPulse, text: 'Uzman koç ve diyetisyen desteği' },
]

function PlanChangeView({ plans, currentMembership, preselectedPlan, changePlan, userEmail }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = preselectedPlan && preselectedPlan !== currentMembership ? preselectedPlan : currentMembership
  const [selected, setSelected] = useState(initial)
  const [durationMonths, setDurationMonths] = useState(1)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selected) || plans[0]
  const selectedPrice = isPaidMembership(selected) ? getTierPrice(selected, durationMonths) : 0
  const isPaid = isPaidMembership(selected)
  const isCurrent = selected === currentMembership

  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast('Ödeme iptal edildi. Planınız değişmedi.', 'info')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyChange = async (price = 0) => {
    setSaving(true)
    const r = await changePlan(selected, price, durationMonths)
    setSaving(false)
    if (!r?.success) { toast(r?.error || 'Plan değiştirilemedi', 'error'); return false }
    return true
  }

  const handleConfirm = async () => {
    if (isCurrent) return
    if (isPaid) {
      if (isStripeEnabled()) {
        setSaving(true)
        const r = await startStripeCheckout(selected, 'change', durationMonths, userEmail)
        if (!r.success) { setSaving(false); toast(r.error || 'Ödeme başlatılamadı', 'error') }
        return
      }
      setPaymentOpen(true)
      return
    }
    if (await applyChange(0)) {
      toast('Planınız güncellendi.', 'success')
      navigate('/profile')
    }
  }

  const handlePaid = () => {
    setPaying(true)
    setTimeout(async () => {
      const ok = await applyChange(selectedPrice)
      setPaying(false)
      if (ok) {
        setPaymentOpen(false)
        toast(`${selectedPlan?.name} planınız aktif! Ödeme başarılı.`, 'success')
        navigate('/profile')
      }
    }, 1200)
  }

  return (
    <div className="auth-page-bg">
      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <span className="section-badge mx-auto block w-fit">Plan Değiştir</span>
        <h1 className="mt-4 text-center font-display text-2xl font-bold text-cream-900 sm:text-3xl">Üyelik Planını Değiştir</h1>
        <p className="mt-2 text-center text-sm text-cream-800/65">
          Mevcut hesabınızın planını güncelleyin — yeni hesap oluşturulmaz.
        </p>

        <div className="mt-8 rounded-3xl border border-cream-200 bg-white/95 p-5 shadow-lg shadow-brand-900/5 backdrop-blur sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((m, idx) => (
              <MembershipPlanCard
                key={m.id}
                plan={m}
                index={idx}
                selected={selected === m.id}
                onSelect={setSelected}
                current={m.id === currentMembership}
                compact
              />
            ))}
          </div>

          <MembershipDurationPicker planId={selected} value={durationMonths} onChange={setDurationMonths} />

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => navigate('/profile')} className="rounded-xl px-4 py-2.5 text-sm font-medium text-cream-800 hover:bg-cream-50">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCurrent || saving}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                isCurrent ? 'bg-cream-300' : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCurrent
                ? 'Zaten bu plandasınız'
                : isPaid
                  ? `${selectedPlan?.name} · ${selectedPrice.toLocaleString('tr-TR')}₺ ile Geç`
                  : 'Ücretsiz Plana Geç'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title={`${selectedPlan?.name} Ödeme`} size="md">
        <PaymentForm amount={selectedPrice} loading={paying} onCancel={() => setPaymentOpen(false)} onSubmit={handlePaid} />
      </Modal>
    </div>
  )
}

export default function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const rawPlan = searchParams.get('plan') || 'free'
  const preselectedPlan = VALID_PLANS.includes(rawPlan) ? rawPlan : 'free'

  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [durationMonths, setDurationMonths] = useState(1)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [welcomePaid, setWelcomePaid] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errorModal, setErrorModal] = useState({ open: false, message: '' })
  const [submitHighlight, setSubmitHighlight] = useState(false)
  const submitBtnRef = useRef(null)
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCountry: DEFAULT_COUNTRY_ISO,
    password: '',
    confirmPassword: '',
    membership: preselectedPlan,
  })

  const { register, registerWithPlan, completeOAuthMember, plans, changePlan, isAuthenticated, isAdmin, isStaff, membership: currentMembership, user, authUser, loading } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const isExistingMember = isAuthenticated && !isAdmin && !isStaff
  const isOAuthFlow = isSocialAuthUser(authUser) && (
    searchParams.get('oauth') === '1' || (isExistingMember && memberNeedsProfileCompletion(user, authUser))
  )
  const oauthPrefilledRef = useRef(false)

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
    setData((d) => ({
      ...d,
      name: d.name || name,
      email: d.email || email,
    }))
  }, [isOAuthFlow, isAuthenticated, user, authUser])

  useEffect(() => {
    if (!isExistingMember && searchParams.get('payment') === 'cancelled') {
      toast('Ödeme iptal edildi. Ücretsiz üye olarak devam edebilir veya tekrar deneyebilirsiniz.', 'info')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isExistingMember && !welcomeOpen && !isOAuthFlow) {
    return (
      <PlanChangeView
        plans={sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)}
        currentMembership={currentMembership}
        preselectedPlan={preselectedPlan}
        changePlan={changePlan}
        userEmail={user?.email}
      />
    )
  }

  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const displayPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const selectedPlan = displayPlans.find((p) => p.id === data.membership) || displayPlans[0]
  const selectedPrice = isPaidMembership(data.membership) ? getTierPrice(data.membership, durationMonths) : 0
  const isPaid = isPaidMembership(data.membership)

  const showFormError = (message) => {
    setErrorModal({ open: true, message })
    toast(message, 'error', 5000)
  }

  const getValidationError = () => {
    if (step === 0) {
      if (!data.name.trim()) return 'Ad soyad alanını doldurun.'
      if (!isOAuthFlow && !isValidEmailAddress(data.email)) {
        return 'Geçerli bir e-posta adresi girin (ör. ad@site.com).'
      }
      if (!data.phone?.trim() || !isValidNationalNumber(data.phoneCountry, data.phone)) {
        return 'Geçerli bir cep telefonu numarası girin.'
      }
      if (!isOAuthFlow && !isPasswordValid(data.password)) {
        return 'Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.'
      }
      if (!isOAuthFlow && data.password !== data.confirmPassword) {
        return 'Şifreler eşleşmiyor — iki alanı da aynı yazın.'
      }
      if (!termsAccepted) {
        return 'Devam etmek için kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.'
      }
    }
    if (step === 1 && !data.membership) return 'Kayıt için bir üyelik planı seçin.'
    return 'Lütfen eksik veya hatalı alanları düzeltin.'
  }

  const scrollToSubmit = () => {
    window.setTimeout(() => {
      submitBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handlePlanSelect = (id) => {
    update({ membership: id })
    setSubmitHighlight(true)
    scrollToSubmit()
  }

  const handleDurationChange = (months) => {
    setDurationMonths(months)
    setSubmitHighlight(true)
    scrollToSubmit()
  }

  const errors = {
    email: data.email && !isValidEmailAddress(data.email) ? 'Geçerli bir e-posta adresi girin (ör. ad@site.com)' : '',
    phone: data.phone && !isValidNationalNumber(data.phoneCountry, data.phone) ? 'Geçerli bir cep telefonu numarası girin' : '',
    password: data.password && !isPasswordValid(data.password) ? 'Şifre gereksinimleri karşılanmıyor' : '',
    confirmPassword: data.password && data.confirmPassword && data.password !== data.confirmPassword ? 'Şifreler eşleşmiyor' : '',
  }

  const canNext = () => {
    if (step === 0) {
      const baseOk = (
        data.name.trim() &&
        isValidNationalNumber(data.phoneCountry, data.phone) &&
        termsAccepted
      )
      if (isOAuthFlow) {
        return baseOk
      }
      return (
        baseOk &&
        isValidEmailAddress(data.email) &&
        isPasswordValid(data.password) &&
        data.password === data.confirmPassword
      )
    }
    if (step === 1) return !!data.membership
    return true
  }

  const buildProfile = () => ({
    name: data.name.trim(),
    email: sanitizeEmailInput(isOAuthFlow ? (user?.email || authUser?.email || data.email) : data.email),
    phone: toE164(data.phoneCountry, data.phone),
    phoneCountry: data.phoneCountry,
    password: isOAuthFlow ? undefined : data.password,
    fitnessLevel: 'beginner',
    goals: [],
    nutritionPrefs: [],
  })

  const persistRegistration = async (membership, paymentAmount = 0) => {
    const profile = buildProfile()
    const packageConfig = isPaidMembership(membership)
      ? getDefaultPackageForPlan(membership, durationMonths)
      : null
    const paymentOpts = paymentAmount ? { payment: paymentAmount } : {}

    if (isOAuthFlow) {
      return completeOAuthMember(profile, membership, packageConfig, paymentOpts)
    }
    if (isPaidMembership(membership)) {
      return registerWithPlan(profile, membership, paymentAmount, durationMonths)
    }
    return register(profile, 'free')
  }

  const finishFree = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await persistRegistration('free')
      if (!result.success) {
        showFormError(result.error || 'Kayıt tamamlanamadı.')
        return
      }
      setWelcomePaid(false)
      setWelcomeOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaidPayment = () => {
    setPaying(true)
    setTimeout(async () => {
      const result = await persistRegistration(data.membership, selectedPrice)
      setPaying(false)
      if (!result.success) {
        showFormError(result.error || 'Kayıt tamamlanamadı.')
        return
      }
      setPaymentOpen(false)
      setWelcomePaid(true)
      setWelcomeOpen(true)
    }, 1200)
  }

  // Stripe akışı: önce hesabı (ücretsiz) oluştur → Stripe Checkout'a yönlendir.
  // Üyelik, ödeme onaylanınca webhook ile aktifleşir.
  const startStripeRegister = async () => {
    if (submitting) return
    setSubmitting(true)
    const reg = isOAuthFlow
      ? await completeOAuthMember(buildProfile(), 'free')
      : await register(buildProfile(), 'free')
    if (!reg.success) {
      showFormError(reg.error || 'Kayıt tamamlanamadı.')
      setSubmitting(false)
      return
    }
    const checkoutEmail = sanitizeEmailInput(user?.email || authUser?.email || data.email)
    const r = await startStripeCheckout(data.membership, 'register', durationMonths, checkoutEmail)
    if (!r.success) {
      setSubmitting(false)
      toast(`${r.error} Ücretsiz üye olarak kaydınız tamamlandı; planı profilinizden yükseltebilirsiniz.`, 'warning')
      navigate('/profile')
    }
    // başarılıysa tarayıcı Stripe'a yönlendirilir
  }

  const finish = () => {
    if (isPaid) {
      if (isStripeEnabled()) startStripeRegister()
      else setPaymentOpen(true)
    } else {
      finishFree()
    }
  }

  const next = () => {
    if (!canNext()) {
      setShowErrors(true)
      showFormError(getValidationError())
      return
    }
    setShowErrors(false)
    if (step === 1) {
      setSubmitHighlight(false)
      finish()
      return
    }
    setStep(1)
    setMaxReached(1)
    setSubmitHighlight(Boolean(data.membership))
    window.setTimeout(scrollToSubmit, 350)
  }

  const back = () => {
    setShowErrors(false)
    setSubmitHighlight(false)
    setStep(0)
  }

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] overflow-hidden">
      {/* Sol panel — marka & avantajlar */}
      <div className="relative hidden w-[42%] overflow-hidden md:flex md:flex-col md:justify-between lg:w-[45%]">
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

        <div className="relative z-10 p-8 md:p-10 xl:p-14">
          <BrandLogo size="lg" />
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
                bugün başlayın
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Birkaç adımda hesabınızı oluşturun, size özel programlarla hedeflerinize ulaşın.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-3 p-10 xl:p-14">
          {BENEFITS.map(({ icon: Icon, text }, i) => (
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

      {/* Sağ panel — kayıt formu */}
      <div className={`flex flex-1 items-center justify-center bg-gradient-to-br from-cream-50 via-white to-brand-50/40 px-4 py-10 sm:px-8 ${step === 1 ? 'pb-36 md:pb-10' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <AuthFormShell>
          <AuthFormCard>
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-sage-300 via-brand-300 to-teal-300" />
            <h2 className="mt-5 font-display text-[1.75rem] font-bold leading-tight text-cream-900">
              {step === 0
                ? (isOAuthFlow ? 'Son bir adım kaldı' : 'Hesabınızı oluşturun')
                : 'Planınızı seçin'}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-cream-800/65">
              {step === 0
                ? (isOAuthFlow
                  ? 'Google, Apple veya Facebook ile bağlandınız. Randevu hatırlatmaları için telefon numaranızı girin.'
                  : 'Birkaç bilgi yeterli — ücretsiz başlayabilir, istediğiniz zaman yükseltebilirsiniz.')
                : 'Size en uygun paketi seçin. Gizli ücret yok, süreyi siz belirlersiniz.'}
            </p>

            <div className="mt-6">
              <Stepper steps={STEPS} currentStep={step} maxReached={maxReached} onStepClick={(t) => t <= maxReached && setStep(t)} />
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>

                  {step === 0 && (
                    <div className="space-y-4">
                      {showErrors && !canNext() && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                          <p className="text-base text-red-700">
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

                      <FormField large emphasis label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" value={data.name} onChange={(e) => update({ name: e.target.value })} />

                      {!isOAuthFlow && (
                        <FormField large emphasis label="E-posta" icon={Mail} type="email" placeholder="ornek@email.com" value={data.email} onChange={(e) => update({ email: e.target.value })} onBlur={() => update({ email: sanitizeEmailInput(data.email) })} error={errors.email} />
                      )}

                      <PhoneField
                        large
                        emphasis
                        country={data.phoneCountry}
                        value={data.phone}
                        onCountryChange={(iso) => update({ phoneCountry: iso, phone: '' })}
                        onValueChange={(phone) => update({ phone })}
                        error={errors.phone}
                        hint="Randevu ve hatırlatma mesajları bu numaraya gönderilir."
                      />

                      {!isOAuthFlow && (
                      <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-cream-800">Şifre</span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cream-700" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={data.password}
                              onChange={(e) => update({ password: e.target.value })}
                              className="w-full rounded-2xl border border-cream-400 bg-white py-4 pl-12 pr-11 text-base text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-cream-800">Tekrar</span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cream-700" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={data.confirmPassword}
                              onChange={(e) => update({ confirmPassword: e.target.value })}
                              className="w-full rounded-2xl border border-cream-400 bg-white py-4 pl-12 pr-11 text-base text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {data.password && (
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {PASSWORD_RULES.map((r) => {
                            const ok = r.test(data.password)
                            return (
                              <li key={r.label} className={`flex items-center gap-1.5 text-sm ${ok ? 'text-sage-600' : 'text-cream-800/45'}`}>
                                <Check className={`h-4 w-4 ${ok ? '' : 'opacity-30'}`} strokeWidth={3} />
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
                  )}

                  {step === 1 && (
                    <div className="max-h-[min(72vh,600px)] space-y-5 overflow-y-auto overscroll-contain scroll-smooth snap-y snap-proximity pb-12 pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                      {displayPlans.map((m, idx) => (
                        <div key={m.id} className="snap-center shrink-0 scroll-mt-2">
                          <MembershipPlanCard
                            plan={m}
                            index={idx}
                            selected={data.membership === m.id}
                            onSelect={handlePlanSelect}
                            compact
                          />
                        </div>
                      ))}
                      <div className="snap-end shrink-0 pb-2 pt-1">
                        <MembershipDurationPicker
                          planId={data.membership}
                          value={durationMonths}
                          onChange={handleDurationChange}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step === 0 && (
              <LegalConsentCheckbox
                className="mt-5"
                accepted={termsAccepted}
                onChange={setTermsAccepted}
                error={showErrors && !termsAccepted}
              />
            )}

            {step === 1 && <div className="mt-6 shrink-0 md:mt-8" aria-hidden />}

            <div
              ref={submitBtnRef}
              className={
                step === 1
                  ? 'fixed inset-x-0 bottom-0 z-40 border-t border-cream-200/80 bg-white/95 px-4 pb-4 pt-5 shadow-[0_-8px_30px_rgba(26,35,50,0.08)] backdrop-blur-md md:relative md:inset-auto md:mt-8 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0 md:shadow-none'
                  : 'mt-4'
              }
            >
            <div className="mx-auto flex max-w-[440px] items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-2xl border border-cream-200 px-4 py-4 text-base font-semibold text-cream-800 transition hover:bg-cream-50">
                  <ArrowLeft className="h-5 w-5" /> Geri
                </button>
              )}
              <motion.button
                type="button"
                onClick={next}
                disabled={submitting}
                animate={
                  step === 1 && submitHighlight
                    ? {
                      boxShadow: [
                        '0 10px 40px rgba(74, 138, 173, 0.35)',
                        '0 10px 50px rgba(95, 146, 112, 0.55)',
                        '0 10px 40px rgba(74, 138, 173, 0.35)',
                      ],
                      scale: [1, 1.02, 1],
                    }
                    : { boxShadow: '0 10px 25px rgba(74, 138, 173, 0.25)', scale: 1 }
                }
                transition={
                  step === 1 && submitHighlight
                    ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.99 }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition hover:brightness-105 disabled:opacity-60 ${
                  step === 1 && submitHighlight
                    ? 'bg-gradient-to-r from-brand-500 via-sage-500 to-brand-500 ring-4 ring-brand-300/60 ring-offset-2'
                    : 'bg-gradient-to-r from-brand-500 to-sage-500 shadow-lg shadow-brand-500/25'
                }`}
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {step === 1
                  ? (submitting
                    ? 'Kaydediliyor…'
                    : isPaid
                      ? `${selectedPlan?.name} · Ödemeye Geç`
                      : 'Ücretsiz Kayıt Ol')
                  : 'Devam Et'}
                {!submitting && <ArrowRight className="h-5 w-5" />}
              </motion.button>
            </div>
            {step === 1 && submitHighlight && (
              <p className="mx-auto mt-2 max-w-[440px] text-center text-xs font-medium text-brand-600">
                {selectedPlan?.name} seçildi — kaydı tamamlamak için butona basın
              </p>
            )}
            </div>

            {step === 0 && !isOAuthFlow && (
              <div className="mt-6">
                <SocialAuthButtons flow="signup" plan={data.membership} remember position="bottom" />
              </div>
            )}

          <p className="mt-6 text-center text-base text-cream-800/60">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Giriş yapın
            </Link>
          </p>
          </AuthFormCard>
          </AuthFormShell>
        </motion.div>
      </div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title={`${selectedPlan?.name} Ödeme`} size="md">
        <PaymentForm amount={selectedPrice} loading={paying} onCancel={() => setPaymentOpen(false)} onSubmit={handlePaidPayment} />
      </Modal>

      <FormErrorModal
        open={errorModal.open}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, message: '' })}
      />

      <WelcomeSuccessModal
        open={welcomeOpen}
        planName={selectedPlan?.name}
        isPaid={welcomePaid}
        onContinue={() => navigate('/profile')}
      />
    </div>
  )
}
