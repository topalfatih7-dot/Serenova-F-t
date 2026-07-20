import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Ruler, Scale,
  Sparkles, Dumbbell, Salad, Check, AlertCircle,
  Flame, Heart, Zap, Leaf, Activity,
  CircleDot, Mountain, Trophy, Apple, Nut, Carrot,
} from 'lucide-react'
import FormField from '../ui/FormField'
import PhoneField from '../ui/PhoneField'
import PhotoUpload from '../ui/PhotoUpload'
import Modal from '../ui/Modal'
import { CITY_NAMES, getDistricts } from '../../data/turkeyCities'
import { DEFAULT_COUNTRY_ISO, toE164, formatE164, parseE164, formatNationalNumber } from '../../data/countryCodes'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import ProfileSectionCard from './ProfileSectionCard'
import GenderSelect from '../ui/GenderSelect'
import BirthDateField from '../ui/BirthDateField'
import { MEMBER_GENDERS, isValidMemberGender } from '../../data/genders'
import { ageFromBirthDate, birthDateError, formatBirthDate } from '../../utils/birthDate'

const GOALS = [
  { value: 'weight', label: 'Kilo Yönetimi', icon: Scale, tone: 'sky' },
  { value: 'fatburn', label: 'Yağ Yakımı', icon: Flame, tone: 'coral' },
  { value: 'muscle', label: 'Kas Kazanımı', icon: Dumbbell, tone: 'brand' },
  { value: 'tone', label: 'Formda Kalmak', icon: Heart, tone: 'rose' },
  { value: 'endurance', label: 'Dayanıklılık', icon: Zap, tone: 'amber' },
  { value: 'habit', label: 'Sağlıklı Alışkanlık', icon: Leaf, tone: 'sage' },
]

const FITNESS_LEVELS = [
  {
    value: 'beginner',
    label: 'Başlangıç',
    hint: 'Yeni başlıyorum',
    icon: CircleDot,
    tone: 'sky',
  },
  {
    value: 'intermediate',
    label: 'Orta',
    hint: 'Düzenli antrenman',
    icon: Mountain,
    tone: 'amber',
  },
  {
    value: 'advanced',
    label: 'İleri',
    hint: 'Yoğun tempo',
    icon: Trophy,
    tone: 'coral',
  },
]

const NUTRITION_PREFS = [
  { value: 'balanced', label: 'Dengeli', icon: Salad, tone: 'sage' },
  { value: 'high-protein', label: 'Yüksek Protein', icon: Dumbbell, tone: 'brand' },
  { value: 'vegetarian', label: 'Vejetaryen', icon: Carrot, tone: 'amber' },
  { value: 'vegan', label: 'Vegan', icon: Leaf, tone: 'emerald' },
  { value: 'low-carb', label: 'Düşük Karb.', icon: Nut, tone: 'rose' },
]

const TONE_STYLES = {
  sky: {
    idle: 'border-sky-200/80 bg-gradient-to-br from-sky-50 to-cyan-50/70 text-sky-900',
    active: 'border-sky-500 bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sky-200/70',
    icon: 'bg-sky-100 text-sky-600',
    iconActive: 'bg-white/20 text-white',
  },
  coral: {
    idle: 'border-orange-200/80 bg-gradient-to-br from-orange-50 to-rose-50/70 text-orange-950',
    active: 'border-orange-500 bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-orange-200/70',
    icon: 'bg-orange-100 text-orange-600',
    iconActive: 'bg-white/20 text-white',
  },
  brand: {
    idle: 'border-brand-200/80 bg-gradient-to-br from-brand-50 to-sky-50/70 text-brand-900',
    active: 'border-brand-500 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-200/70',
    icon: 'bg-brand-100 text-brand-600',
    iconActive: 'bg-white/20 text-white',
  },
  rose: {
    idle: 'border-rose-200/80 bg-gradient-to-br from-rose-50 to-pink-50/70 text-rose-950',
    active: 'border-rose-500 bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-rose-200/70',
    icon: 'bg-rose-100 text-rose-600',
    iconActive: 'bg-white/20 text-white',
  },
  amber: {
    idle: 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-yellow-50/70 text-amber-950',
    active: 'border-amber-500 bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-amber-200/70',
    icon: 'bg-amber-100 text-amber-700',
    iconActive: 'bg-white/20 text-white',
  },
  sage: {
    idle: 'border-sage-200/80 bg-gradient-to-br from-sage-50 to-emerald-50/70 text-sage-900',
    active: 'border-sage-500 bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-sage-200/70',
    icon: 'bg-sage-100 text-sage-600',
    iconActive: 'bg-white/20 text-white',
  },
  emerald: {
    idle: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/70 text-emerald-950',
    active: 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-200/70',
    icon: 'bg-emerald-100 text-emerald-600',
    iconActive: 'bg-white/20 text-white',
  },
}

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  waist: { min: 40, max: 200 },
}

function rangeError(field, value) {
  if (value === '' || value == null) return ''
  const num = Number(value)
  const { min, max } = LIMITS[field]
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`
  return ''
}

function ChoiceChip({ selected, tone, icon: Icon, label, hint, onClick }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.brand
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        selected ? `${styles.active} shadow-lg` : styles.idle
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
          selected ? styles.iconActive : styles.icon
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold leading-tight">{label}</span>
        {hint ? (
          <span className={`mt-0.5 block text-[10px] leading-tight ${selected ? 'text-white/80' : 'opacity-60'}`}>
            {hint}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  )
}

export default function PersonalInfoSection({ user }) {
  const { updateProfile } = useApp()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    phoneCountry: user.phoneCountry || DEFAULT_COUNTRY_ISO,
    birthDate: user.birthDate || '',
    gender: user.gender || '',
    city: user.city || '',
    district: user.district || '',
    weight: user.weight || '',
    height: user.height || '',
    waist: user.waist || '',
    photo: user.photo || null,
    goals: user.goals || [],
    fitnessLevel: user.fitnessLevel || 'beginner',
    nutritionPrefs: user.nutritionPrefs || [],
  }))

  const districts = getDistricts(form.city)
  const errors = {
    birthDate: birthDateError(form.birthDate),
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    waist: rangeError('waist', form.waist),
  }

  const phoneFromUser = () => {
    if (!user.phone) return { phone: '', phoneCountry: user.phoneCountry || DEFAULT_COUNTRY_ISO }
    const parsed = parseE164(user.phone)
    return {
      phone: parsed ? formatNationalNumber(parsed.iso, parsed.national) : user.phone,
      phoneCountry: user.phoneCountry || parsed?.iso || DEFAULT_COUNTRY_ISO,
    }
  }

  const openEditor = () => {
    const phoneFields = phoneFromUser()
    setForm({
      name: user.name || '',
      email: user.email || '',
      ...phoneFields,
      birthDate: user.birthDate || '',
      gender: user.gender || '',
      city: user.city || '',
      district: user.district || '',
      weight: user.weight || '',
      height: user.height || '',
      waist: user.waist || '',
      photo: user.photo || null,
      goals: user.goals || [],
      fitnessLevel: user.fitnessLevel || 'beginner',
      nutritionPrefs: user.nutritionPrefs || [],
    })
    setOpen(true)
  }

  const handleSave = async () => {
    const genderLocked = Boolean(user.gender)
    const nextGender = genderLocked ? user.gender : form.gender
    if (!isValidMemberGender(nextGender)) {
      toast('Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.', 'warning')
      return
    }
    if (!user.phone && !form.phone?.trim()) {
      toast('Telefon numarası zorunludur.', 'warning')
      return
    }
    if (errors.birthDate || errors.weight || errors.height || errors.waist) {
      toast('Lütfen geçerli bilgiler girin', 'warning')
      return
    }
    setSaving(true)
    try {
      const patch = {
        name: form.name,
        birthDate: form.birthDate,
        city: form.city,
        district: form.district,
        weight: form.weight,
        height: form.height,
        waist: form.waist,
        photo: form.photo,
        goals: form.goals,
        fitnessLevel: form.fitnessLevel,
        nutritionPrefs: form.nutritionPrefs,
        gender: nextGender,
        age: form.birthDate ? ageFromBirthDate(form.birthDate) : '',
      }
      if (!user.phone && form.phone) {
        patch.phone = toE164(form.phoneCountry, form.phone)
        patch.phoneCountry = form.phoneCountry
      }
      await updateProfile(patch)
      setOpen(false)
      toast('Kişisel bilgileriniz kaydedildi.', 'success')
    } catch (err) {
      toast(err?.message || 'Bilgiler kaydedilemedi. Tekrar deneyin.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleGoal = (value) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(value) ? f.goals.filter((g) => g !== value) : [...f.goals, value],
    }))
  }

  const toggleNutrition = (value) => {
    setForm((f) => ({
      ...f,
      nutritionPrefs: f.nutritionPrefs.includes(value)
        ? f.nutritionPrefs.filter((p) => p !== value)
        : [...f.nutritionPrefs, value],
    }))
  }

  const completionHints = [
    !user.birthDate && 'Doğum tarihi',
    !user.gender && 'Cinsiyet',
    !user.weight && 'Kilo',
    !user.height && 'Boy',
    !(user.goals?.length) && 'Hedef',
  ].filter(Boolean)

  return (
    <>
      <ProfileSectionCard
        icon={User}
        title="Kişisel Bilgiler"
        subtitle="Profilinizi ve hedeflerinizi tamamlayın"
        accent="brand"
        delay={0.12}
        action={(
          <button
            type="button"
            onClick={openEditor}
            className="shrink-0 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105"
          >
            Düzenle
          </button>
        )}
      >
        {completionHints.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Eksik: {completionHints.join(', ')} — profilinizi tamamlayın.
            </p>
          </div>
        )}

        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ['Ad Soyad', user.name || '—'],
            ['E-posta', user.email || '—'],
            ['Telefon', user.phone ? formatE164(user.phone) : '—'],
            ['Doğum Tarihi', formatBirthDate(user.birthDate)],
            ['Cinsiyet', MEMBER_GENDERS.find((g) => g.value === user.gender)?.label || '—'],
            ['Şehir / İlçe', user.city ? `${user.city}${user.district ? ` / ${user.district}` : ''}` : '—'],
            ['Kilo', user.weight ? `${user.weight} kg` : '—'],
            ['Boy', user.height ? `${user.height} cm` : '—'],
            ['Bel', user.waist ? `${user.waist} cm` : '—'],
            ['Hedefler', user.goals?.length ? user.goals.map((g) => GOALS.find((x) => x.value === g)?.label || g).join(', ') : '—'],
            ['Spor Seviyesi', FITNESS_LEVELS.find((f) => f.value === user.fitnessLevel)?.label || '—'],
            ['Beslenme', user.nutritionPrefs?.length ? user.nutritionPrefs.map((p) => NUTRITION_PREFS.find((x) => x.value === p)?.label || p).join(', ') : '—'],
          ].map(([k, v], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-2xl border border-brand-100/60 bg-white/80 px-4 py-3 shadow-sm"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-600/70">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-cream-900">{v}</dd>
            </motion.div>
          ))}
        </dl>
      </ProfileSectionCard>

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Kişisel Bilgiler" size="lg">
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-brand-100/70 bg-gradient-to-br from-brand-50/50 via-white to-sage-50/40 p-4 sm:p-5">
            <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Ad Soyad"
              icon={User}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              emphasis
              className="border-brand-200/70 bg-gradient-to-br from-white to-brand-50/40"
            />
            <FormField
              label="E-posta"
              icon={Mail}
              type="email"
              value={form.email}
              readOnly
              disabled
              className="cursor-not-allowed border-cream-200 bg-cream-100/70 opacity-90"
              hint="Kayıt e-postası değiştirilemez."
            />
          </div>

          <PhoneField
            country={form.phoneCountry}
            value={form.phone}
            disabled={Boolean(user.phone)}
            onCountryChange={(iso) => setForm({ ...form, phoneCountry: iso, phone: '' })}
            onValueChange={(phone) => setForm({ ...form, phone })}
            hint={user.phone ? 'Telefon numarası kayıt sonrası değiştirilemez.' : 'Telefon numaranızı ekleyin.'}
            emphasis={!user.phone}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <BirthDateField
              value={form.birthDate}
              onChange={(birthDate) => setForm({ ...form, birthDate })}
              error={errors.birthDate}
            />
            <GenderSelect
              value={form.gender}
              onChange={(gender) => setForm({ ...form, gender })}
              locked={Boolean(user.gender)}
              hint={user.gender ? 'Cinsiyet kayıt sonrası değiştirilemez.' : 'Kadın veya Erkek seçin.'}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Şehir"
              as="select"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })}
              emphasis
              className="border-sage-200/80 bg-gradient-to-br from-white to-sage-50/50"
            >
              <option value="">Şehir seçin</option>
              {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormField>
            <FormField
              label="İlçe"
              as="select"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              disabled={!form.city}
              emphasis
              className="border-sage-200/80 bg-gradient-to-br from-white to-sage-50/50"
            >
              <option value="">{form.city ? 'İlçe seçin' : '—'}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <FormField
              label="Kilo"
              icon={Scale}
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              error={errors.weight}
              emphasis
              className="border-amber-200/70 bg-gradient-to-br from-white to-amber-50/40"
            />
            <FormField
              label="Boy"
              icon={Ruler}
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              error={errors.height}
              emphasis
              className="border-sky-200/70 bg-gradient-to-br from-white to-sky-50/40"
            />
            <FormField
              label="Bel"
              icon={Ruler}
              type="number"
              value={form.waist}
              onChange={(e) => setForm({ ...form, waist: e.target.value })}
              error={errors.waist}
              emphasis
              className="border-rose-200/70 bg-gradient-to-br from-white to-rose-50/40"
            />
          </div>

          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Hedefler
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOALS.map((g) => (
                <ChoiceChip
                  key={g.value}
                  selected={form.goals.includes(g.value)}
                  tone={g.tone}
                  icon={g.icon}
                  label={g.label}
                  onClick={() => toggleGoal(g.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Activity className="h-3.5 w-3.5 text-brand-500" /> Spor Seviyesi
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {FITNESS_LEVELS.map((f) => (
                <ChoiceChip
                  key={f.value}
                  selected={form.fitnessLevel === f.value}
                  tone={f.tone}
                  icon={f.icon}
                  label={f.label}
                  hint={f.hint}
                  onClick={() => setForm({ ...form, fitnessLevel: f.value })}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Apple className="h-3.5 w-3.5 text-sage-500" /> Beslenme Tercihleri
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {NUTRITION_PREFS.map((p) => (
                <ChoiceChip
                  key={p.value}
                  selected={form.nutritionPrefs.includes(p.value)}
                  tone={p.tone}
                  icon={p.icon}
                  label={p.label}
                  onClick={() => toggleNutrition(p.value)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-200/50 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Check className="h-3.5 w-3.5" />
            </span>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </Modal>
    </>
  )
}
