import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Sparkles, Leaf, Crown,
  Scale, HeartPulse, Repeat, Smile,
  Sprout, Flame, Trophy,
  Salad, Carrot, Wheat, Drumstick, WheatOff,
} from 'lucide-react'
import Stepper from '../components/ui/Stepper'
import DisclaimerBox from '../components/ui/DisclaimerBox'
import PackageBuilder from '../components/package/PackageBuilder'
import SupportScheduler, { DEFAULT_SUPPORT_SCHEDULE } from '../components/package/SupportScheduler'
import PaymentForm from '../components/payment/PaymentForm'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { DEFAULT_PACKAGE, FREE_PLAN, PREMIUM_PLAN } from '../data/membershipPlans'
import { calculatePackagePrice } from '../services/packagePricing'

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

const STEPS = ['Kişisel', 'Hedefler', 'Fitness', 'Beslenme', 'Sağlık', 'Üyelik', 'Paket', 'Tarihler']

const GENDERS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
  { value: 'other', label: 'Belirtmek istemiyorum' },
]

const GOALS = [
  { value: 'weight', label: 'Kilo Yönetimi', desc: 'Sağlıklı kilo verme veya alma', icon: Scale },
  { value: 'tone', label: 'Formda Kalmak', desc: 'Vücudunuzu sıkılaştırın', icon: HeartPulse },
  { value: 'habit', label: 'Sağlıklı Alışkanlık', desc: 'Kalıcı rutinler oluşturun', icon: Repeat },
  { value: 'confidence', label: 'Özgüven', desc: 'Kendinizi daha iyi hissedin', icon: Smile },
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç', desc: 'Yeni başlıyorum veya uzun aradan sonra dönüyorum', icon: Sprout },
  { value: 'intermediate', label: 'Orta Seviye', desc: 'Düzenli olarak hareket ediyorum', icon: Flame },
  { value: 'advanced', label: 'İleri Seviye', desc: 'Aktif ve deneyimli sporcuyum', icon: Trophy },
]

const NUTRITION_PREFS = [
  { value: 'balanced', label: 'Dengeli Beslenme', icon: Salad },
  { value: 'vegetarian', label: 'Vejetaryen', icon: Carrot },
  { value: 'low-carb', label: 'Düşük Karbonhidrat', icon: Wheat },
  { value: 'no-pork', label: 'Domuz Eti Yok', icon: Drumstick },
  { value: 'gluten-free', label: 'Glutensiz', icon: WheatOff },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [data, setData] = useState({
    name: '', email: '', password: '', confirmPassword: '', age: '', city: '',
    gender: '', weight: '', height: '',
    goals: [], fitnessLevel: 'beginner',
    nutritionPrefs: [], healthAck: false, disclaimer: false,
    membership: 'free', packageConfig: { ...DEFAULT_PACKAGE },
    supportSchedule: { ...DEFAULT_SUPPORT_SCHEDULE },
  })
  const { register, registerWithPayment } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()

  const update = (patch) => setData((d) => ({ ...d, ...patch }))

  const canNext = () => {
    switch (step) {
      case 0:
        return data.name && data.email.includes('@') && data.age && data.gender &&
          data.weight && data.height &&
          data.password?.length >= 6 && data.password === data.confirmPassword
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

  const finishFree = () => {
    const result = register({
      name: data.name,
      email: data.email,
      password: data.password,
      age: data.age,
      gender: data.gender,
      weight: data.weight,
      height: data.height,
      city: data.city,
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
  }

  const handlePremiumPayment = () => {
    setPaying(true)
    setTimeout(() => {
      const result = registerWithPayment({
        name: data.name,
        email: data.email,
        password: data.password,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        city: data.city,
        goals: data.goals,
        fitnessLevel: data.fitnessLevel,
        nutritionPrefs: data.nutritionPrefs,
        supportSchedule: data.supportSchedule,
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
    setStep((s) => s + 1)
  }

  const pricing = data.membership === 'premium' ? calculatePackagePrice(data.packageConfig) : null

  return (
    <div className={`mx-auto px-4 py-10 sm:px-6 ${step === 6 ? 'max-w-6xl' : 'max-w-3xl'}`}>
      <h1 className="text-center font-display text-2xl font-bold text-cream-900">Hoş Geldiniz</h1>
      <p className="mt-2 text-center text-sm text-cream-800/60">Profilinizi oluşturun ve üyeliğinizi seçin</p>
      <div className="mt-8">
        <Stepper steps={data.membership === 'premium' ? STEPS : STEPS.slice(0, 6)} currentStep={step} />
      </div>

      <div className="mt-10 rounded-2xl border border-cream-200 bg-white p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Kişisel Bilgiler & Hesap</h2>
                <input placeholder="Ad Soyad" value={data.name} onChange={(e) => update({ name: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                <input placeholder="E-posta" type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Şifre (min. 6)" type="password" value={data.password} onChange={(e) => update({ password: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <input placeholder="Şifre tekrar" type="password" value={data.confirmPassword} onChange={(e) => update({ confirmPassword: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                </div>
                {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
                  <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Yaş" type="number" value={data.age} onChange={(e) => update({ age: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <input placeholder="Şehir" value={data.city} onChange={(e) => update({ city: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="Kilo (kg)" type="number" value={data.weight} onChange={(e) => update({ weight: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <input placeholder="Boy (cm)" type="number" value={data.height} onChange={(e) => update({ height: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <select value={data.gender} onChange={(e) => update({ gender: e.target.value })} className={`rounded-xl border border-cream-200 px-3 py-3 text-sm ${data.gender ? 'text-cream-900' : 'text-cream-800/40'}`}>
                    <option value="">Cinsiyet</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value} className="text-cream-900">{g.label}</option>
                    ))}
                  </select>
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
                <h2 className="font-display text-lg font-bold text-cream-900">Mevcut fitness seviyeniz</h2>
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
              <div>
                <h2 className="font-display text-lg font-bold text-cream-900">Destek tarihlerinizi seçin</h2>
                <p className="mt-1 text-sm text-cream-800/60">Paketinize göre koç ve diyetisyen görüşmelerinizi ne zaman almak istersiniz?</p>
                <div className="mt-5">
                  <SupportScheduler
                    schedule={data.supportSchedule}
                    packageConfig={data.packageConfig}
                    onChange={(s) => update({ supportSchedule: s })}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-sm font-medium text-cream-800 disabled:opacity-30">
            Geri
          </button>
          <button type="button" onClick={next} disabled={!canNext()} className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {step === 5 && data.membership === 'free' ? 'Kayıt Ol' :
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
