import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Sparkles, Leaf, Crown, Star, Award,
  Scale, HeartPulse, Repeat, Smile,
  Sprout, Flame, Trophy, Activity, Dumbbell, Moon, Heart, TrendingUp,
  Salad, Carrot, Wheat, Drumstick, WheatOff, Apple,
  User, UserRound, Mail, Lock, CalendarDays, Ruler, Loader2, Phone,
} from 'lucide-react'
import Stepper from '../components/ui/Stepper'
import DisclaimerBox from '../components/ui/DisclaimerBox'
import PaymentForm from '../components/payment/PaymentForm'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { isPaidMembership, ALL_PLANS } from '../data/membershipPlans'
import { CITY_NAMES, getDistricts } from '../data/turkeyCities'
import { PASSWORD_RULES, isPasswordValid } from '../services/password'
import { generateHealthAnalysis } from '../services/aiAnalysis'

const STEPS = ['Kişisel', 'Hedefler', 'Spor', 'Beslenme', 'Sağlık', 'Üyelik', 'Ödeme']

const GENDERS = [
  { value: 'female', label: 'Kadın', icon: UserRound },
  { value: 'male', label: 'Erkek', icon: User },
]

const GOALS = [
  { value: 'weight', label: 'Kilo Yönetimi', desc: 'Sağlıklı kilo verme veya alma', icon: Scale },
  { value: 'fatburn', label: 'Yağ Yakımı', desc: 'Vücut yağ oranını azaltın', icon: Flame },
  { value: 'muscle', label: 'Kas Kazanımı', desc: 'Güç ve kas kütlesi geliştirin', icon: Dumbbell },
  { value: 'tone', label: 'Formda Kalmak', desc: 'Vücudunuzu sıkılaştırın', icon: HeartPulse },
  { value: 'endurance', label: 'Dayanıklılık', desc: 'Kondisyon ve dayanıklılık artışı', icon: Activity },
  { value: 'habit', label: 'Sağlıklı Alışkanlık', desc: 'Kalıcı rutinler oluşturun', icon: Repeat },
  { value: 'sleep', label: 'Daha İyi Uyku', desc: 'Uyku ve toparlanma kalitesi', icon: Moon },
  { value: 'heart', label: 'Kalp Sağlığı', desc: 'Genel sağlığınızı güçlendirin', icon: Heart },
  { value: 'performance', label: 'Performans', desc: 'Sportif performansınızı yükseltin', icon: TrendingUp },
  { value: 'confidence', label: 'Özgüven', desc: 'Kendinizi daha iyi hissedin', icon: Smile },
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç', desc: 'Yeni başlıyorum veya uzun aradan sonra dönüyorum', icon: Sprout },
  { value: 'intermediate', label: 'Orta Seviye', desc: 'Düzenli olarak hareket ediyorum', icon: Flame },
  { value: 'advanced', label: 'İleri Seviye', desc: 'Aktif ve deneyimli sporcuyum', icon: Trophy },
]

const NUTRITION_PREFS = [
  { value: 'balanced', label: 'Dengeli Beslenme', icon: Salad },
  { value: 'high-protein', label: 'Yüksek Protein', icon: Dumbbell },
  { value: 'vegetarian', label: 'Vejetaryen', icon: Carrot },
  { value: 'vegan', label: 'Vegan', icon: Sprout },
  { value: 'low-carb', label: 'Düşük Karbonhidrat', icon: Wheat },
  { value: 'keto', label: 'Ketojenik', icon: Flame },
  { value: 'mediterranean', label: 'Akdeniz Tipi', icon: Apple },
  { value: 'gluten-free', label: 'Glutensiz', icon: WheatOff },
  { value: 'no-pork', label: 'Domuz Eti Yok', icon: Drumstick },
  { value: 'intermittent', label: 'Aralıklı Oruç', icon: Moon },
]

const LIMITS = {
  age:    { min: 13, max: 100, label: 'Yaş 13 ile 100 arasında olmalı' },
  weight: { min: 30, max: 300, label: 'Kilo 30 ile 300 kg arasında olmalı' },
  height: { min: 120, max: 250, label: 'Boy 120 ile 250 cm arasında olmalı' },
  waist:  { min: 40, max: 200, label: 'Bel çevresi 40 ile 200 cm arasında olmalı' },
}

function sanitizeNumber(raw) {
  if (raw === '') return ''
  return raw.replace(/[^\d.]/g, '')
}

function rangeError(field, value) {
  if (value === '' || value == null) return ''
  const num = Number(value)
  const { min, max, label } = LIMITS[field]
  if (Number.isNaN(num)) return 'Geçerli bir sayı girin'
  if (num < min || num > max) return label
  return ''
}

function planIcon(id) {
  if (id === 'free')     return <Leaf className="h-5 w-5" />
  if (id === 'gumus')    return <Star className="h-5 w-5" />
  if (id === 'altin')    return <Crown className="h-5 w-5" />
  if (id === 'platinum') return <Award className="h-5 w-5" />
  return <Sparkles className="h-5 w-5" />
}

function planRingColor(id, selected) {
  if (!selected) return 'border-cream-200 hover:border-cream-300'
  if (id === 'free')     return 'border-sage-400 ring-2 ring-sage-200'
  if (id === 'gumus')    return 'border-slate-400 ring-2 ring-slate-200'
  if (id === 'altin')    return 'border-amber-400 ring-2 ring-amber-200'
  if (id === 'platinum') return 'border-brand-400 ring-2 ring-brand-200'
  return 'border-brand-400 ring-2 ring-brand-200'
}

function planIconBg(id, selected) {
  if (!selected) return 'bg-cream-100 text-cream-800/60'
  if (id === 'free')     return 'bg-sage-500 text-white'
  if (id === 'gumus')    return 'bg-slate-500 text-white'
  if (id === 'altin')    return 'bg-amber-500 text-white'
  if (id === 'platinum') return 'bg-brand-500 text-white'
  return 'bg-brand-500 text-white'
}

function planBtnBg(id, selected) {
  if (!selected) return 'bg-cream-100 text-cream-800/70'
  if (id === 'free')     return 'bg-sage-500 text-white'
  if (id === 'gumus')    return 'bg-slate-500 text-white'
  if (id === 'altin')    return 'bg-amber-500 text-white'
  if (id === 'platinum') return 'bg-brand-500 text-white'
  return 'bg-brand-500 text-white'
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
  const [data, setData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    age: '', city: '', district: '',
    gender: '', weight: '', height: '', waist: '', photo: null,
    goals: [], fitnessLevel: 'beginner',
    nutritionPrefs: [], healthAck: false, disclaimer: false,
    membership: preselectedPlan,
  })
  const { register, registerWithPlan, createProgram, exercises, plans } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()

  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const districts = getDistricts(data.city)
  const displayPlans = plans?.length ? plans : ALL_PLANS
  const selectedPlan = displayPlans.find((p) => p.id === data.membership) || displayPlans[0]
  const isPaid = isPaidMembership(data.membership)

  const visibleSteps = isPaid ? STEPS : STEPS.slice(0, 6)

  const errors = {
    age:             rangeError('age', data.age),
    weight:          rangeError('weight', data.weight),
    height:          rangeError('height', data.height),
    waist:           rangeError('waist', data.waist),
    password:        data.password && !isPasswordValid(data.password) ? 'Şifre gereksinimleri karşılanmıyor' : '',
    confirmPassword: data.password && data.confirmPassword && data.password !== data.confirmPassword ? 'Şifreler eşleşmiyor' : '',
  }

  const canNext = () => {
    switch (step) {
      case 0:
        return (
          data.name.trim() &&
          data.email.includes('@') &&
          data.phone.replace(/\D/g, '').length >= 10 &&
          data.age && !errors.age &&
          data.gender &&
          data.city && data.district &&
          data.weight && !errors.weight &&
          data.height && !errors.height &&
          (!data.waist || !errors.waist) &&
          isPasswordValid(data.password) &&
          data.password === data.confirmPassword
        )
      case 1: return data.goals.length > 0
      case 2: return data.fitnessLevel
      case 3: return true
      case 4: return data.healthAck && data.disclaimer
      case 5: return !!data.membership
      case 6: return true
      default: return true
    }
  }

  const goToStep = (target) => {
    if (target <= maxReached) setStep(target)
  }

  const buildProfile = () => ({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    age: data.age,
    gender: data.gender,
    weight: data.weight,
    height: data.height,
    waist: data.waist,
    photo: data.photo,
    city: data.city,
    district: data.district,
    goals: data.goals,
    fitnessLevel: data.fitnessLevel,
    nutritionPrefs: data.nutritionPrefs,
  })

  const finishFree = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const profile = buildProfile()
      const healthAnalysis = generateHealthAnalysis(profile, exercises || [])
      const result = await register({ ...profile, healthAnalysis }, 'free')
      if (!result.success) {
        toast(result.error, 'error')
        return
      }
      const memberId = result.member?.id
      const memberName = result.member?.name || profile.name
      if (memberId && healthAnalysis) {
        const dayRotation = [1, 3, 5]
        const exList = healthAnalysis.coachRecommendations?.exercises || []
        if (exList.length > 0) {
          const workoutEntries = exList.map((ex, i) => ({
            id: `auto-${Date.now()}-${i}`,
            day: dayRotation[i % dayRotation.length],
            start: '09:00', end: '09:30',
            exerciseId: ex.id, exerciseName: ex.name,
            videoUrl: ex.videoUrl || '', description: ex.description || '',
            amountType: 'reps', amount: 12, durationUnit: 'sn', note: '',
          }))
          await createProgram({
            type: 'workout', memberId, memberName,
            staffId: 'system', staffName: 'Yeni Form',
            title: 'Otomatik Antrenman Programı',
            description: healthAnalysis.coachRecommendations?.message || '',
            entries: workoutEntries,
            items: workoutEntries.map((e) => `${e.exerciseName} · ${e.amount} tekrar`),
          })
        }
        const mealPlan = healthAnalysis.dietitianRecommendations?.mealPlan || []
        if (mealPlan.length > 0) {
          await createProgram({
            type: 'nutrition', memberId, memberName,
            staffId: 'system', staffName: 'Yeni Form',
            title: 'Otomatik Beslenme Programı',
            description: healthAnalysis.dietitianRecommendations?.message || '',
            entries: [],
            items: mealPlan.map((m) => `${m.meal}: ${m.suggestion}`),
          })
        }
      }
      toast('Kayıt tamamlandı! Kişisel analiziniz hazır.', 'success')
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaidPayment = () => {
    setPaying(true)
    setTimeout(async () => {
      const profile = buildProfile()
      const healthAnalysis = generateHealthAnalysis(profile, exercises || [])
      const result = await registerWithPlan({ ...profile, healthAnalysis }, data.membership, selectedPlan?.price || 0)
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

  const finish = () => {
    if (isPaid) {
      setPaymentOpen(true)
    } else {
      finishFree()
    }
  }

  const next = () => {
    if (step === 5 && !isPaid) {
      finishFree()
      return
    }
    if (step === 6 && isPaid) {
      finish()
      return
    }
    setStep((s) => {
      const n = s + 1
      setMaxReached((m) => Math.max(m, n))
      return n
    })
  }

  return (
    <div className="auth-page-bg">
      <div className={`relative mx-auto px-4 py-10 sm:px-6 max-w-3xl`}>
        <span className="section-badge mx-auto block w-fit">Kayıt</span>
        <h1 className="mt-4 text-center font-display text-2xl font-bold text-cream-900 sm:text-3xl">Hoş Geldiniz</h1>
        <p className="mt-2 text-center text-sm text-cream-800/65">Profilinizi oluşturun ve üyeliğinizi seçin — birkaç dakika sürer</p>
        <div className="mt-8">
          <Stepper
            steps={visibleSteps}
            currentStep={step}
            maxReached={maxReached}
            onStepClick={goToStep}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-cream-200 bg-white p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* ADIM 0: KİŞİSEL BİLGİLER */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-bold text-cream-900">Kişisel Bilgiler & Hesap</h2>
                    <p className="mt-1 text-sm text-cream-800/60">Size en uygun planı hazırlayabilmemiz için temel bilgiler</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" value={data.name} onChange={(e) => update({ name: e.target.value })} />
                    <FormField label="E-posta" icon={Mail} type="email" placeholder="ornek@email.com" value={data.email} onChange={(e) => update({ email: e.target.value })} />
                  </div>

                  <FormField
                    label="Telefon Numarası"
                    icon={Phone}
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={data.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    hint="Koçunuz ve diyetisyeniniz bu numara üzerinden sizinle iletişime geçecektir."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FormField
                        label="Şifre"
                        icon={Lock}
                        type="password"
                        placeholder="Güçlü bir şifre belirleyin"
                        value={data.password}
                        onChange={(e) => update({ password: e.target.value })}
                      />
                      {data.password && (
                        <ul className="mt-2 grid gap-1">
                          {PASSWORD_RULES.map((r) => {
                            const ok = r.test(data.password)
                            return (
                              <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-sage-600' : 'text-cream-800/50'}`}>
                                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${ok ? 'bg-sage-500 text-white' : 'bg-cream-200 text-transparent'}`}>
                                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                </span>
                                {r.label}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                    <FormField
                      label="Şifre tekrar"
                      icon={Lock}
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={data.confirmPassword}
                      onChange={(e) => update({ confirmPassword: e.target.value })}
                      error={errors.confirmPassword}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Yaş"
                      icon={CalendarDays}
                      type="number"
                      min={LIMITS.age.min}
                      max={LIMITS.age.max}
                      placeholder="Yaş"
                      value={data.age}
                      onChange={(e) => update({ age: sanitizeNumber(e.target.value) })}
                      error={errors.age}
                    />
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Cinsiyet</span>
                      <div className="grid grid-cols-2 gap-3">
                        {GENDERS.map((g) => {
                          const selected = data.gender === g.value
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => update({ gender: g.value })}
                              className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold transition-all ${
                                selected
                                  ? 'border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                                  : 'border-cream-200 bg-cream-50/60 text-cream-800/70 hover:border-cream-300'
                              }`}
                            >
                              <g.icon className="h-4 w-4" />
                              {g.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Şehir"
                      as="select"
                      value={data.city}
                      onChange={(e) => update({ city: e.target.value, district: '' })}
                      className={data.city ? '' : 'text-cream-800/40'}
                    >
                      <option value="">Şehir seçin</option>
                      {CITY_NAMES.map((c) => (
                        <option key={c} value={c} className="text-cream-900">{c}</option>
                      ))}
                    </FormField>
                    <FormField
                      label="İlçe"
                      as="select"
                      value={data.district}
                      onChange={(e) => update({ district: e.target.value })}
                      disabled={!data.city}
                      className={data.district ? '' : 'text-cream-800/40'}
                      hint={!data.city ? 'Önce şehir seçin' : ''}
                    >
                      <option value="">{data.city ? 'İlçe seçin' : '—'}</option>
                      {districts.map((d) => (
                        <option key={d} value={d} className="text-cream-900">{d}</option>
                      ))}
                    </FormField>
                  </div>

                  <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
                      <Ruler className="h-4 w-4 text-brand-500" /> Vücut Ölçüleri
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        label="Kilo (kg)"
                        icon={Scale}
                        type="number"
                        min={LIMITS.weight.min}
                        max={LIMITS.weight.max}
                        placeholder="örn. 72"
                        value={data.weight}
                        onChange={(e) => update({ weight: sanitizeNumber(e.target.value) })}
                        error={errors.weight}
                      />
                      <FormField
                        label="Boy (cm)"
                        icon={Ruler}
                        type="number"
                        min={LIMITS.height.min}
                        max={LIMITS.height.max}
                        placeholder="örn. 170"
                        value={data.height}
                        onChange={(e) => update({ height: sanitizeNumber(e.target.value) })}
                        error={errors.height}
                      />
                      <FormField
                        label="Bel çevresi (cm)"
                        icon={Ruler}
                        type="number"
                        min={LIMITS.waist.min}
                        max={LIMITS.waist.max}
                        placeholder="örn. 80"
                        value={data.waist}
                        onChange={(e) => update({ waist: sanitizeNumber(e.target.value) })}
                        error={errors.waist}
                        hint={!errors.waist ? 'İlerleme takibi için (opsiyonel)' : ''}
                      />
                    </div>
                    <div className="mt-4">
                      <PhotoUpload
                        value={data.photo}
                        onChange={(photo) => update({ photo })}
                        hint="Koçunuz ve diyetisyeniniz başlangıç durumunuzu değerlendirebilir."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ADIM 1: HEDEFLER */}
              {step === 1 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Hedefleriniz neler?</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Birden fazla seçebilirsiniz</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {GOALS.map((g) => {
                      const selected = data.goals.includes(g.value)
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            const goals = selected
                              ? data.goals.filter((x) => x !== g.value)
                              : [...data.goals, g.value]
                            update({ goals })
                          }}
                          className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-cream-200 bg-white hover:border-cream-300 hover:shadow-sm'
                          }`}
                        >
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            selected ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800/60'
                          }`}>
                            <g.icon className="h-5 w-5" />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-cream-900">{g.label}</p>
                            <p className="text-xs text-cream-800/60">{g.desc}</p>
                          </div>
                          {selected && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ADIM 2: SPOR SEVİYESİ */}
              {step === 2 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Mevcut spor seviyeniz</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Size en uygun planı hazırlayabilmemiz için</p>
                  <div className="mt-5 space-y-3">
                    {FITNESS_LEVELS.map((f) => {
                      const selected = data.fitnessLevel === f.value
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => update({ fitnessLevel: f.value })}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-cream-200 bg-white hover:border-cream-300 hover:shadow-sm'
                          }`}
                        >
                          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            selected ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800/60'
                          }`}>
                            <f.icon className="h-6 w-6" />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-cream-900">{f.label}</p>
                            <p className="text-xs text-cream-800/60">{f.desc}</p>
                          </div>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300'
                          }`}>
                            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ADIM 3: BESLENME TERCİHLERİ */}
              {step === 3 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Beslenme tercihleriniz</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Birden fazla seçebilir, bu adımı atlayabilirsiniz</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {NUTRITION_PREFS.map((p) => {
                      const selected = data.nutritionPrefs.includes(p.value)
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            const prefs = selected
                              ? data.nutritionPrefs.filter((x) => x !== p.value)
                              : [...data.nutritionPrefs, p.value]
                            update({ nutritionPrefs: prefs })
                          }}
                          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-sage-400 bg-sage-50 ring-2 ring-sage-200'
                              : 'border-cream-200 bg-white hover:border-cream-300 hover:shadow-sm'
                          }`}
                        >
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            selected ? 'bg-sage-500 text-white' : 'bg-cream-100 text-cream-800/60'
                          }`}>
                            <p.icon className="h-5 w-5" />
                          </span>
                          <span className="flex-1 text-sm font-semibold text-cream-900">{p.label}</span>
                          {selected && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-500 text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ADIM 4: SAĞLIK ONAYI */}
              {step === 4 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Sağlık onayı</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Güvenliğiniz için lütfen onaylayın</p>
                  <div className="mt-5 space-y-4">
                    <DisclaimerBox variant="prominent" />
                    {[
                      { key: 'healthAck', text: 'Sağlık durumumu doğru bildirdim ve gerekli durumlarda doktoruma danıştım.' },
                      { key: 'disclaimer', text: 'Bu hizmetin tıbbi teşhis veya tedavi olmadığını, koçluk ve wellness rehberliği sunduğunu kabul ediyorum.' },
                    ].map((item) => {
                      const checked = data[item.key]
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => update({ [item.key]: !checked })}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                            checked
                              ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-cream-200 bg-white hover:border-cream-300 hover:shadow-sm'
                          }`}
                        >
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                            checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300'
                          }`}>
                            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="text-sm leading-snug text-cream-800/80">{item.text}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ADIM 5: ÜYELİK SEÇİMİ */}
              {step === 5 && (
                <div>
                  <div className="text-center">
                    <h2 className="font-display text-xl font-bold text-cream-900">Size uygun üyeliği seçin</h2>
                    <p className="mt-1 text-sm text-cream-800/60">Ücretsiz başlayın veya daha fazlası için ücretli plana geçin</p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {displayPlans.map((m) => {
                      const selected = data.membership === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => update({ membership: m.id })}
                          className={`relative flex flex-col rounded-3xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${planRingColor(m.id, selected)}`}
                        >
                          {m.badge && (
                            <span className={`absolute -top-2.5 right-4 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow ${
                              m.id === 'altin' ? 'bg-amber-500 text-white' :
                              m.id === 'platinum' ? 'bg-brand-500 text-white' :
                              'bg-brand-500 text-white'
                            }`}>
                              {m.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${planIconBg(m.id, selected)}`}>
                              {planIcon(m.id)}
                            </span>
                            <div>
                              <p className="font-display text-base font-bold text-cream-900">{m.name}</p>
                              <p className="text-xs text-cream-800/55">
                                {m.price === 0 ? 'Ücretsiz · Süresiz' : `${m.price?.toLocaleString('tr-TR')}₺/ay`}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5 border-t border-cream-100 pt-4">
                            {(m.features || []).slice(0, 5).map((f, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                  f.included
                                    ? selected ? planIconBg(m.id, true) : 'bg-sage-100 text-sage-600'
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

                          <div className={`mt-4 rounded-xl py-2 text-center text-xs font-semibold transition-colors ${planBtnBg(m.id, selected)}`}>
                            {selected ? 'Seçildi ✓' : 'Seç'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ADIM 6: ÖDEME (sadece ücretli planlar) */}
              {step === 6 && isPaid && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg font-bold text-cream-900">Ödeme Bilgileri</h2>
                    <p className="mt-1 text-sm text-cream-800/60">Seçilen plan: <strong>{selectedPlan?.name}</strong></p>
                  </div>

                  {/* Plan özeti */}
                  <div className="rounded-2xl border border-cream-100 bg-cream-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${planIconBg(data.membership, true)}`}>
                          {planIcon(data.membership)}
                        </span>
                        <div>
                          <p className="font-semibold text-cream-900">{selectedPlan?.name} Planı</p>
                          <p className="text-xs text-cream-800/60">{selectedPlan?.period}</p>
                        </div>
                      </div>
                      <p className="font-display text-xl font-bold text-cream-900">
                        {selectedPlan?.price?.toLocaleString('tr-TR')}₺
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {(selectedPlan?.limits || []).map((l, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-cream-800/60">
                          <Check className="h-3 w-3 text-sage-500" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-center text-cream-800/50">
                    Ödemeyi tamamlamak için aşağıdaki butona tıklayın. Test kartı: 4242 4242 4242 4242
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* NAVİGASYON */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm font-medium text-cream-800 disabled:opacity-30"
            >
              Geri
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNext() || submitting}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === 5 && !isPaid
                ? (submitting ? 'Kaydediliyor…' : 'Kayıt Ol')
                : step === 6 && isPaid
                  ? 'Ödeme Yap'
                  : 'İleri'}
            </button>
          </div>
        </div>

        {/* ÖDEME MODAL */}
        <Modal
          open={paymentOpen}
          onClose={() => !paying && setPaymentOpen(false)}
          title={`${selectedPlan?.name} Ödeme`}
          size="md"
        >
          <PaymentForm
            amount={selectedPlan?.price}
            loading={paying}
            onCancel={() => setPaymentOpen(false)}
            onSubmit={handlePaidPayment}
          />
        </Modal>
      </div>
    </div>
  )
}
