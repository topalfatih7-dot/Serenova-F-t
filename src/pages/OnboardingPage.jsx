import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Sparkles, Leaf, Crown,
  Scale, HeartPulse, Repeat, Smile,
  Sprout, Flame, Trophy, Activity, Dumbbell, Moon, Heart, TrendingUp,
  Salad, Carrot, Wheat, Drumstick, WheatOff, Apple,
  User, UserRound, Mail, Lock, CalendarDays, Ruler, Loader2,
} from 'lucide-react'
import Stepper from '../components/ui/Stepper'
import DisclaimerBox from '../components/ui/DisclaimerBox'
import PackageBuilder from '../components/package/PackageBuilder'
import SupportScheduler, { DEFAULT_SUPPORT_SCHEDULE } from '../components/package/SupportScheduler'
import WeeklyAvailability from '../components/package/WeeklyAvailability'
import PaymentForm from '../components/payment/PaymentForm'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { DEFAULT_PACKAGE, FREE_PLAN, PREMIUM_PLAN } from '../data/membershipPlans'
import { calculatePackagePrice } from '../services/packagePricing'
import { CITY_NAMES, getDistricts } from '../data/turkeyCities'
import { PASSWORD_RULES, isPasswordValid } from '../services/password'

const MEMBERSHIP_OPTIONS = [
  {
    id: 'free',
    name: 'Ücretsiz',
    icon: Leaf,
    tagline: 'Yolculuğa hemen başlayın',
    price: '0₺',
    priceNote: 'süresiz',
    accent: 'sage',
    features: FREE_PLAN.features,
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    tagline: 'Birebir koçluk ve özel paket',
    price: 'Özel',
    priceNote: 'paketinize göre',
    accent: 'brand',
    badge: 'En popüler',
    features: PREMIUM_PLAN.features,
  },
]

const STEPS = ['Kişisel', 'Hedefler', 'Spor', 'Beslenme', 'Sağlık', 'Üyelik', 'Paket', 'Takvim']

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

// Mantıklı sınırlar
const LIMITS = {
  age: { min: 13, max: 100, label: 'Yaş 13 ile 100 arasında olmalı' },
  weight: { min: 30, max: 300, label: 'Kilo 30 ile 300 kg arasında olmalı' },
  height: { min: 120, max: 250, label: 'Boy 120 ile 250 cm arasında olmalı' },
  waist: { min: 40, max: 200, label: 'Bel çevresi 40 ile 200 cm arasında olmalı' },
}


// Negatif/eksik değerleri engelle, sadece pozitif sayıya izin ver
function sanitizeNumber(raw) {
  if (raw === '') return ''
  const cleaned = raw.replace(/[^\d.]/g, '')
  return cleaned
}

function rangeError(field, value) {
  if (value === '' || value == null) return ''
  const num = Number(value)
  const { min, max, label } = LIMITS[field]
  if (Number.isNaN(num)) return 'Geçerli bir sayı girin'
  if (num < min || num > max) return label
  return ''
}

export default function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const preselectedPlan = searchParams.get('plan') === 'premium' ? 'premium' : 'free'
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    name: '', email: '', password: '', confirmPassword: '', age: '', city: '', district: '',
    gender: '', weight: '', height: '', waist: '', photo: null,
    goals: [], fitnessLevel: 'beginner',
    nutritionPrefs: [], healthAck: false, disclaimer: false,
    membership: preselectedPlan, packageConfig: { ...DEFAULT_PACKAGE },
    supportSchedule: { ...DEFAULT_SUPPORT_SCHEDULE },
    availability: {},
  })
  const { register, registerWithPayment } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()

  const update = (patch) => setData((d) => ({ ...d, ...patch }))

  const districts = getDistricts(data.city)

  const errors = {
    age: rangeError('age', data.age),
    weight: rangeError('weight', data.weight),
    height: rangeError('height', data.height),
    waist: rangeError('waist', data.waist),
    password: data.password && !isPasswordValid(data.password) ? 'Şifre gereksinimleri karşılanmıyor' : '',
    confirmPassword: data.password && data.confirmPassword && data.password !== data.confirmPassword ? 'Şifreler eşleşmiyor' : '',
  }

  const canNext = () => {
    switch (step) {
      case 0:
        return (
          data.name.trim() &&
          data.email.includes('@') &&
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
      case 5: return data.membership
      case 6: return data.membership === 'free' || true
      case 7: return true
      default: return true
    }
  }

  const goToStep = (target) => {
    if (target <= maxReached) setStep(target)
  }

  const finishFree = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await register({
        name: data.name,
        email: data.email,
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
      }, 'free')

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

  const handlePremiumPayment = () => {
    setPaying(true)
    setTimeout(async () => {
      const result = await registerWithPayment({
        name: data.name,
        email: data.email,
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
        supportSchedule: data.supportSchedule,
        availability: data.availability,
      }, data.packageConfig)

      setPaying(false)
      if (!result.success) {
        toast(result.error, 'error')
        return
      }
      setPaymentOpen(false)
      toast('Premium üyeliğiniz aktif! Ödeme başarılı.', 'success')
      navigate('/dashboard')
    }, 1200)
  }

  const finish = () => {
    if (data.membership === 'premium') {
      setPaymentOpen(true)
    } else {
      finishFree()
    }
  }

  const next = () => {
    if (step === 5 && data.membership === 'free') {
      finishFree()
      return
    }
    if (step === 7 && data.membership === 'premium') {
      finish()
      return
    }
    setStep((s) => {
      const n = s + 1
      setMaxReached((m) => Math.max(m, n))
      return n
    })
  }

  const pricing = data.membership === 'premium' ? calculatePackagePrice(data.packageConfig) : null

  return (
    <div className={`mx-auto px-4 py-10 sm:px-6 ${step === 6 ? 'max-w-6xl' : 'max-w-3xl'}`}>
      <h1 className="text-center font-display text-2xl font-bold text-cream-900">Hoş Geldiniz</h1>
      <p className="mt-2 text-center text-sm text-cream-800/60">Profilinizi oluşturun ve üyeliğinizi seçin</p>
      <div className="mt-8">
        <Stepper
          steps={data.membership === 'premium' ? STEPS : STEPS.slice(0, 6)}
          currentStep={step}
          maxReached={maxReached}
          onStepClick={goToStep}
        />
      </div>

      <div className="mt-10 rounded-2xl border border-cream-200 bg-white p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Kişisel Bilgiler & Hesap</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Size en uygun planı hazırlayabilmemiz için temel bilgiler</p>
                </div>

                <FormField label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" value={data.name} onChange={(e) => update({ name: e.target.value })} />
                <FormField label="E-posta" icon={Mail} type="email" placeholder="ornek@email.com" value={data.email} onChange={(e) => update({ email: e.target.value })} />

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
                      hint="Koçunuz ve diyetisyeniniz başlangıç durumunuzu değerlendirebilir. Dilerseniz daha sonra profilinizden ekleyebilirsiniz."
                    />
                  </div>
                </div>
              </div>
            )}
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
            {step === 5 && (
              <div>
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold text-cream-900">Size uygun üyeliği seçin</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Dilediğiniz zaman yükseltebilir veya değiştirebilirsiniz</p>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {MEMBERSHIP_OPTIONS.map((m) => {
                    const selected = data.membership === m.id
                    const isPremium = m.accent === 'brand'
                    const ring = selected
                      ? isPremium ? 'border-brand-400 ring-2 ring-brand-200' : 'border-sage-400 ring-2 ring-sage-200'
                      : 'border-cream-200 hover:border-cream-300'
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => update({ membership: m.id })}
                        className={`relative flex flex-col rounded-3xl border bg-white p-6 text-left shadow-sm transition-all hover:shadow-md ${ring}`}
                      >
                        {m.badge && (
                          <span className="absolute -top-3 right-5 flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                            <Sparkles className="h-3 w-3" />
                            {m.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isPremium ? 'bg-brand-500 text-white' : 'bg-sage-100 text-sage-600'}`}>
                            <m.icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-display text-lg font-bold text-cream-900">{m.name}</p>
                            <p className="text-xs text-cream-800/60">{m.tagline}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-end gap-1.5">
                          <span className="font-display text-3xl font-bold text-cream-900">{m.price}</span>
                          <span className="mb-1 text-xs text-cream-800/50">{m.priceNote}</span>
                        </div>

                        <div className="mt-5 space-y-2.5 border-t border-cream-100 pt-5">
                          {m.features.slice(0, 6).map((f) => (
                            <div key={f.text} className="flex items-start gap-2.5">
                              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${f.included ? (isPremium ? 'bg-brand-100 text-brand-600' : 'bg-sage-100 text-sage-600') : 'bg-cream-100 text-cream-800/30'}`}>
                                {f.included ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                              </span>
                              <span className={`text-xs leading-snug ${f.included ? 'text-cream-800/80' : 'text-cream-800/35 line-through'}`}>
                                {f.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className={`mt-6 rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                          selected
                            ? (isPremium ? 'bg-brand-500 text-white' : 'bg-sage-500 text-white')
                            : 'bg-cream-100 text-cream-800/70'
                        }`}>
                          {selected ? 'Seçildi' : 'Seç'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {step === 6 && data.membership === 'premium' && (
              <PackageBuilder
                config={data.packageConfig}
                onChange={(cfg) => update({ packageConfig: cfg })}
                userProfile={{ fitnessLevel: data.fitnessLevel }}
              />
            )}
            {step === 7 && data.membership === 'premium' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Görüşme tarihlerinizi seçin</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Paketinizdeki her görüşme için tercih ettiğiniz gün ve saati belirleyin.</p>
                  <div className="mt-5">
                    <SupportScheduler
                      schedule={data.supportSchedule}
                      packageConfig={data.packageConfig}
                      onChange={(s) => update({ supportSchedule: s })}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-lg font-bold text-cream-900">Haftalık müsaitliğiniz</h2>
                  <p className="mt-1 text-sm text-cream-800/60">Her gün için hangi saat aralığında uygun olduğunuzu belirtin. Koçunuz ve diyetisyeniniz bu bilgiyi görerek görüşmelerinizi planlar.</p>
                  <div className="mt-5">
                    <WeeklyAvailability value={data.availability} onChange={(a) => update({ availability: a })} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-sm font-medium text-cream-800 disabled:opacity-30">
            Geri
          </button>
          <button type="button" onClick={next} disabled={!canNext() || submitting} className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 5 && data.membership === 'free' ? (submitting ? 'Kaydediliyor…' : 'Kayıt Ol') :
              step === 7 ? 'Ödeme Yap' : 'İleri'}
          </button>
        </div>
      </div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title="Premium Ödeme" size="md">
        <PaymentForm
          amount={pricing?.total}
          loading={paying}
          onCancel={() => setPaymentOpen(false)}
          onSubmit={handlePremiumPayment}
        />
      </Modal>
    </div>
  )
}
