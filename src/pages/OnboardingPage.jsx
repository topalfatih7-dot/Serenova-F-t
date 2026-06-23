import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Sparkles, Leaf, Crown, Star, Award,
  User, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle,
  Dumbbell, HeartPulse, Shield, ArrowRight, ArrowLeft,
} from 'lucide-react'
import Stepper from '../components/ui/Stepper'
import PaymentForm from '../components/payment/PaymentForm'
import FormField from '../components/ui/FormField'
import PhoneField from '../components/ui/PhoneField'
import Modal from '../components/ui/Modal'
import BrandLogo from '../components/ui/BrandLogo'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { BRAND } from '../config/brand'
import { isPaidMembership, ALL_PLANS } from '../data/membershipPlans'
import { DEFAULT_COUNTRY_ISO, isValidNationalNumber, toE164 } from '../data/countryCodes'
import { PASSWORD_RULES, isPasswordValid } from '../services/password'
import { isStripeEnabled } from '../config/stripe'
import { startStripeCheckout } from '../services/stripePayment'

const STEPS = ['Hesap', 'Üyelik']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RECOMMENDED_PLAN = 'altin'

// Yüksek fiyatı küçük günlük tutara bölerek algıyı yumuşatır (fiyat parçalama).
function dailyPrice(price) {
  if (!price || price <= 0) return 0
  return Math.max(1, Math.round(price / 30))
}

const BENEFITS = [
  { icon: Dumbbell, text: 'Kişiye özel antrenman & beslenme programları' },
  { icon: HeartPulse, text: 'Uzman koç ve diyetisyen desteği' },
  { icon: Shield, text: 'KVKK uyumlu, güvenli ödeme altyapısı' },
]

function planIcon(id) {
  if (id === 'free') return <Leaf className="h-5 w-5" />
  if (id === 'gumus') return <Star className="h-5 w-5" />
  if (id === 'altin') return <Crown className="h-5 w-5" />
  if (id === 'platinum') return <Award className="h-5 w-5" />
  return <Sparkles className="h-5 w-5" />
}

function planRingColor(id, selected) {
  if (!selected) return 'border-cream-200 hover:border-cream-300'
  if (id === 'free') return 'border-sage-400 ring-2 ring-sage-200'
  if (id === 'gumus') return 'border-slate-400 ring-2 ring-slate-200'
  if (id === 'altin') return 'border-amber-400 ring-2 ring-amber-200'
  if (id === 'platinum') return 'border-brand-400 ring-2 ring-brand-200'
  return 'border-brand-400 ring-2 ring-brand-200'
}

function planIconBg(id, selected) {
  if (!selected) return 'bg-cream-100 text-cream-800/60'
  if (id === 'free') return 'bg-sage-500 text-white'
  if (id === 'gumus') return 'bg-slate-500 text-white'
  if (id === 'altin') return 'bg-amber-500 text-white'
  if (id === 'platinum') return 'bg-brand-500 text-white'
  return 'bg-brand-500 text-white'
}

function planBtnBg(id, selected) {
  if (!selected) return 'bg-cream-100 text-cream-800/70'
  if (id === 'free') return 'bg-sage-500 text-white'
  if (id === 'gumus') return 'bg-slate-500 text-white'
  if (id === 'altin') return 'bg-amber-500 text-white'
  if (id === 'platinum') return 'bg-brand-500 text-white'
  return 'bg-brand-500 text-white'
}

function planAccent(id) {
  if (id === 'free') return 'from-sage-400 to-sage-600'
  if (id === 'gumus') return 'from-slate-400 to-slate-600'
  if (id === 'altin') return 'from-amber-400 to-amber-600'
  if (id === 'platinum') return 'from-brand-400 to-brand-600'
  return 'from-brand-400 to-brand-600'
}

function PlanChangeView({ plans, currentMembership, preselectedPlan, changePlan }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = preselectedPlan && preselectedPlan !== currentMembership ? preselectedPlan : currentMembership
  const [selected, setSelected] = useState(initial)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selected) || plans[0]
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
    const r = await changePlan(selected, price)
    setSaving(false)
    if (!r?.success) { toast(r?.error || 'Plan değiştirilemedi', 'error'); return false }
    return true
  }

  const handleConfirm = async () => {
    if (isCurrent) return
    if (isPaid) {
      if (isStripeEnabled()) {
        setSaving(true)
        const r = await startStripeCheckout(selected, 'change')
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
      const ok = await applyChange(selectedPlan?.price || 0)
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
            {plans.map((m) => {
              const selectedCard = selected === m.id
              const current = m.id === currentMembership
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(m.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition-all ${planRingColor(m.id, selectedCard)} ${selectedCard ? 'shadow-md' : 'hover:shadow-md'}`}
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${planAccent(m.id)}`} />
                  <div className="flex flex-col p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {current && (
                        <span className="rounded-full bg-cream-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          Mevcut Plan
                        </span>
                      )}
                      {m.badge && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow ${
                          m.id === 'altin' ? 'bg-amber-500' : 'bg-brand-500'
                        }`}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${planIconBg(m.id, selectedCard)}`}>
                        {planIcon(m.id)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold text-cream-900">{m.name}</p>
                        <p className="flex items-baseline gap-0.5">
                          <span className="font-display text-lg font-extrabold text-cream-900">
                            {m.price === 0 ? 'Ücretsiz' : `${m.price?.toLocaleString('tr-TR')}₺`}
                          </span>
                          {m.price > 0 && <span className="text-[11px] font-medium text-cream-800/55">/ay</span>}
                        </p>
                      </div>
                      {selectedCard && (
                        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-1.5 border-t border-cream-100 pt-4">
                      {(m.features || []).slice(0, 5).map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            f.included
                              ? selectedCard ? planIconBg(m.id, true) : 'bg-sage-100 text-sage-600'
                              : 'bg-cream-100 text-cream-800/30'
                          }`}>
                            {f.included
                              ? <Check className="h-2.5 w-2.5" strokeWidth={3} />
                              : <X className="h-2.5 w-2.5" strokeWidth={3} />}
                          </span>
                          <span className={`text-xs leading-snug ${f.included ? 'text-cream-800/80' : 'text-cream-800/35 line-through'}`}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 rounded-xl py-2 text-center text-xs font-semibold transition-colors ${planBtnBg(m.id, selectedCard)}`}>
                      {selectedCard ? 'Seçildi ✓' : 'Seç'}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

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
                  ? `${selectedPlan?.name} · ${selectedPlan?.price?.toLocaleString('tr-TR')}₺ ile Geç`
                  : 'Ücretsiz Plana Geç'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title={`${selectedPlan?.name} Ödeme`} size="md">
        <PaymentForm amount={selectedPlan?.price} loading={paying} onCancel={() => setPaymentOpen(false)} onSubmit={handlePaid} />
      </Modal>
    </div>
  )
}

export default function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const rawPlan = searchParams.get('plan') || 'free'
  const preselectedPlan = ['free', 'gumus', 'altin', 'platinum', 'premium'].includes(rawPlan) ? rawPlan : 'free'

  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCountry: DEFAULT_COUNTRY_ISO,
    password: '',
    confirmPassword: '',
    membership: preselectedPlan,
  })

  const { register, registerWithPlan, plans, changePlan, isAuthenticated, isAdmin, isStaff, membership: currentMembership } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const isExistingMember = isAuthenticated && !isAdmin && !isStaff

  useEffect(() => {
    if (!isExistingMember && searchParams.get('payment') === 'cancelled') {
      toast('Ödeme iptal edildi. Ücretsiz üye olarak devam edebilir veya tekrar deneyebilirsiniz.', 'info')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isExistingMember) {
    return (
      <PlanChangeView
        plans={plans?.length ? plans : ALL_PLANS}
        currentMembership={currentMembership}
        preselectedPlan={preselectedPlan}
        changePlan={changePlan}
      />
    )
  }

  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const displayPlans = plans?.length ? plans : ALL_PLANS
  const selectedPlan = displayPlans.find((p) => p.id === data.membership) || displayPlans[0]
  const isPaid = isPaidMembership(data.membership)

  const errors = {
    email: data.email && !EMAIL_RE.test(data.email.trim()) ? 'Geçerli bir e-posta adresi girin (ör. ad@site.com)' : '',
    phone: data.phone && !isValidNationalNumber(data.phoneCountry, data.phone) ? 'Geçerli bir cep telefonu numarası girin' : '',
    password: data.password && !isPasswordValid(data.password) ? 'Şifre gereksinimleri karşılanmıyor' : '',
    confirmPassword: data.password && data.confirmPassword && data.password !== data.confirmPassword ? 'Şifreler eşleşmiyor' : '',
  }

  const canNext = () => {
    if (step === 0) {
      return (
        data.name.trim() &&
        EMAIL_RE.test(data.email.trim()) &&
        isValidNationalNumber(data.phoneCountry, data.phone) &&
        isPasswordValid(data.password) &&
        data.password === data.confirmPassword
      )
    }
    if (step === 1) return !!data.membership
    return true
  }

  const buildProfile = () => ({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: toE164(data.phoneCountry, data.phone),
    phoneCountry: data.phoneCountry,
    password: data.password,
    fitnessLevel: 'beginner',
    goals: [],
    nutritionPrefs: [],
  })

  const finishFree = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await register(buildProfile(), 'free')
      if (!result.success) {
        toast(result.error, 'error')
        return
      }
      toast('Kayıt tamamlandı! Hoş geldiniz.', 'success')
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaidPayment = () => {
    setPaying(true)
    setTimeout(async () => {
      const result = await registerWithPlan(buildProfile(), data.membership, selectedPlan?.price || 0)
      setPaying(false)
      if (!result.success) {
        toast(result.error, 'error')
        return
      }
      setPaymentOpen(false)
      toast(`${selectedPlan?.name} üyeliğiniz aktif! Ödeme başarılı.`, 'success')
      navigate('/dashboard')
    }, 1200)
  }

  // Stripe akışı: önce hesabı (ücretsiz) oluştur → Stripe Checkout'a yönlendir.
  // Üyelik, ödeme onaylanınca webhook ile aktifleşir.
  const startStripeRegister = async () => {
    if (submitting) return
    setSubmitting(true)
    const reg = await register(buildProfile(), 'free')
    if (!reg.success) {
      toast(reg.error, 'error')
      setSubmitting(false)
      return
    }
    const r = await startStripeCheckout(data.membership, 'register')
    if (!r.success) {
      setSubmitting(false)
      toast(`${r.error} Ücretsiz üye olarak kaydınız tamamlandı; planı profilinizden yükseltebilirsiniz.`, 'warning')
      navigate('/dashboard')
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
    if (!canNext()) { setShowErrors(true); return }
    setShowErrors(false)
    if (step === 1) {
      finish()
      return
    }
    setStep(1)
    setMaxReached(1)
  }

  const back = () => {
    setShowErrors(false)
    setStep(0)
  }

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] overflow-hidden">
      {/* Sol panel — marka & avantajlar */}
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
            <h2 className="font-display text-2xl font-bold text-cream-900 sm:text-3xl">
              {step === 0 ? 'Hesap oluşturun' : 'Planınızı seçin'}
            </h2>
            <p className="mt-2 text-sm text-cream-800/60">
              {step === 0 ? 'Birkaç bilgiyle ücretsiz başlayın' : 'Size en uygun üyeliği seçin'}
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
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <p className="text-xs text-red-700">Lütfen tüm alanları eksiksiz ve doğru doldurun.</p>
                        </div>
                      )}

                      <FormField emphasis label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" value={data.name} onChange={(e) => update({ name: e.target.value })} />
                      <FormField emphasis label="E-posta" icon={Mail} type="email" placeholder="ornek@email.com" value={data.email} onChange={(e) => update({ email: e.target.value })} error={errors.email} />

                      <PhoneField
                        emphasis
                        country={data.phoneCountry}
                        value={data.phone}
                        onCountryChange={(iso) => update({ phoneCountry: iso, phone: '' })}
                        onValueChange={(phone) => update({ phone })}
                        error={errors.phone}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Şifre</span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={data.password}
                              onChange={(e) => update({ password: e.target.value })}
                              className="w-full rounded-2xl border border-cream-400 bg-white py-3.5 pl-11 pr-10 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Tekrar</span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={data.confirmPassword}
                              onChange={(e) => update({ confirmPassword: e.target.value })}
                              className="w-full rounded-2xl border border-cream-400 bg-white py-3.5 pl-11 pr-10 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/55 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500">
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {data.password && (
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {PASSWORD_RULES.map((r) => {
                            const ok = r.test(data.password)
                            return (
                              <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-sage-600' : 'text-cream-800/45'}`}>
                                <Check className={`h-3 w-3 ${ok ? '' : 'opacity-30'}`} strokeWidth={3} />
                                {r.label}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-3">
                      {displayPlans.map((m, idx) => {
                        const selected = data.membership === m.id
                        const recommended = m.id === RECOMMENDED_PLAN
                        const daily = dailyPrice(m.price)
                        const includedFeatures = (m.features || []).filter((f) => f.included)
                        return (
                          <motion.button
                            key={m.id}
                            type="button"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => update({ membership: m.id })}
                            className={`group relative block w-full overflow-hidden rounded-2xl border text-left transition-all ${planRingColor(m.id, selected)} ${
                              selected
                                ? 'shadow-lg shadow-brand-500/15'
                                : recommended
                                  ? 'shadow-md shadow-amber-300/30 hover:shadow-lg'
                                  : 'shadow-sm hover:shadow-md'
                            } ${recommended && !selected ? 'border-amber-300' : ''}`}
                          >
                            {/* Önerilen plan için animasyonlu parıltı şeridi */}
                            {recommended && (
                              <motion.span
                                aria-hidden
                                initial={{ x: '-120%' }}
                                animate={{ x: '220%' }}
                                transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
                                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                              />
                            )}

                            <div className={`h-1.5 w-full bg-gradient-to-r ${planAccent(m.id)}`} />

                            {/* Üst rozet satırı */}
                            <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                              {recommended && (
                                <motion.span
                                  animate={{ scale: [1, 1.06, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-md shadow-amber-500/40"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  En Çok Tercih
                                </motion.span>
                              )}
                              {!recommended && m.badge && (
                                <span className="rounded-full bg-cream-900/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                  {m.badge}
                                </span>
                              )}
                              {selected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow">
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col p-4">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${planIconBg(m.id, selected || recommended)}`}>
                                  {planIcon(m.id)}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-display text-base font-bold text-cream-900">{m.name}</p>
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-display text-xl font-extrabold text-cream-900">
                                      {m.price === 0 ? 'Ücretsiz' : `${m.price?.toLocaleString('tr-TR')}₺`}
                                    </span>
                                    {m.price > 0 && <span className="text-[11px] font-medium text-cream-800/55">/ay</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Fiyat parçalama — günlük algı */}
                              {m.price > 0 && (
                                <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-semibold text-sage-700 ring-1 ring-sage-100">
                                  <Sparkles className="h-3 w-3" />
                                  Günde yalnızca ~{daily.toLocaleString('tr-TR')}₺
                                </p>
                              )}

                              <ul className="mt-3 grid gap-1.5 border-t border-cream-100 pt-3">
                                {includedFeatures.slice(0, recommended ? 4 : 3).map((f, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-[11px] leading-tight text-cream-800/85">
                                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-sage-600" strokeWidth={3} />
                                    <span>{f.text}</span>
                                  </li>
                                ))}
                                {includedFeatures.length > (recommended ? 4 : 3) && (
                                  <li className="text-[10px] font-medium text-brand-600/80">
                                    +{includedFeatures.length - (recommended ? 4 : 3)} özellik daha
                                  </li>
                                )}
                              </ul>

                              <div className={`mt-3.5 rounded-xl py-2 text-center text-xs font-bold transition ${planBtnBg(m.id, selected)}`}>
                                {selected ? 'Seçildi ✓' : recommended ? 'Bu Planı Seç ★' : 'Seç'}
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-2xl border border-cream-200 px-4 py-3.5 text-sm font-semibold text-cream-800 transition hover:bg-cream-50">
                  <ArrowLeft className="h-4 w-4" /> Geri
                </button>
              )}
              <motion.button
                type="button"
                onClick={next}
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.99 }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === 1
                  ? (submitting ? 'Kaydediliyor…' : isPaid ? 'Ödemeye Geç' : 'Ücretsiz Kayıt Ol')
                  : 'Devam Et'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-cream-800/60">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Giriş yapın
            </Link>
          </p>
        </motion.div>
      </div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title={`${selectedPlan?.name} Ödeme`} size="md">
        <PaymentForm amount={selectedPlan?.price} loading={paying} onCancel={() => setPaymentOpen(false)} onSubmit={handlePaidPayment} />
      </Modal>
    </div>
  )
}
