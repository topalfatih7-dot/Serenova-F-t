import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, CalendarDays, Ruler, Scale,
  Sparkles, Dumbbell, Salad, Check, AlertCircle,
} from 'lucide-react'
import FormField from '../ui/FormField'
import PhoneField from '../ui/PhoneField'
import PhotoUpload from '../ui/PhotoUpload'
import Modal from '../ui/Modal'
import { CITY_NAMES, getDistricts } from '../../data/turkeyCities'
import { DEFAULT_COUNTRY_ISO, toE164 } from '../../data/countryCodes'
import { syncMemberHealthAssets } from '../../services/memberHealthSync'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const GENDERS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
]

const GOALS = [
  { value: 'weight', label: 'Kilo Yönetimi' },
  { value: 'fatburn', label: 'Yağ Yakımı' },
  { value: 'muscle', label: 'Kas Kazanımı' },
  { value: 'tone', label: 'Formda Kalmak' },
  { value: 'endurance', label: 'Dayanıklılık' },
  { value: 'habit', label: 'Sağlıklı Alışkanlık' },
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
]

const NUTRITION_PREFS = [
  { value: 'balanced', label: 'Dengeli' },
  { value: 'high-protein', label: 'Yüksek Protein' },
  { value: 'vegetarian', label: 'Vejetaryen' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'low-carb', label: 'Düşük Karb.' },
]

const LIMITS = {
  age: { min: 13, max: 100 },
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

export default function PersonalInfoSection({ user }) {
  const { updateProfile, createProgram, exercises, myPrograms } = useApp()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    phoneCountry: user.phoneCountry || DEFAULT_COUNTRY_ISO,
    age: user.age || '',
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
    age: rangeError('age', form.age),
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    waist: rangeError('waist', form.waist),
  }

  const openEditor = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      phoneCountry: user.phoneCountry || DEFAULT_COUNTRY_ISO,
      age: user.age || '',
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
    if (errors.age || errors.weight || errors.height || errors.waist) {
      toast('Lütfen geçerli ölçü değerleri girin', 'warning')
      return
    }
    setSaving(true)
    try {
      const patch = {
        ...form,
        phone: form.phone ? toE164(form.phoneCountry, form.phone) : form.phone,
      }
      await updateProfile(patch)
      const merged = { ...user, ...patch }
      const result = await syncMemberHealthAssets({
        user: merged,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
      setOpen(false)
      toast(
        result.synced
          ? 'Bilgileriniz güncellendi ve kişisel programlarınız hazırlandı.'
          : 'Kişisel bilgileriniz kaydedildi.',
        'success',
      )
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
    !user.age && 'Yaş',
    !user.gender && 'Cinsiyet',
    !user.weight && 'Kilo',
    !user.height && 'Boy',
    !(user.goals?.length) && 'Hedef',
  ].filter(Boolean)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-cream-900">
              <User className="h-5 w-5 text-brand-500" /> Kişisel Bilgiler
            </h2>
            <p className="mt-1 text-xs text-cream-800/55">
              Profilinizi ve hedeflerinizi buradan tamamlayıp güncelleyebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={openEditor}
            className="shrink-0 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Düzenle
          </button>
        </div>

        {completionHints.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Eksik: {completionHints.join(', ')} — kişisel programlar için tamamlayın.
            </p>
          </div>
        )}

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['Ad Soyad', user.name || '—'],
            ['E-posta', user.email || '—'],
            ['Telefon', user.phone || '—'],
            ['Yaş', user.age || '—'],
            ['Cinsiyet', GENDERS.find((g) => g.value === user.gender)?.label || '—'],
            ['Şehir / İlçe', user.city ? `${user.city}${user.district ? ` / ${user.district}` : ''}` : '—'],
            ['Kilo', user.weight ? `${user.weight} kg` : '—'],
            ['Boy', user.height ? `${user.height} cm` : '—'],
            ['Hedefler', user.goals?.length ? user.goals.map((g) => GOALS.find((x) => x.value === g)?.label || g).join(', ') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-cream-50/80 px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-cream-800/45">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-cream-900">{v}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Kişisel Bilgiler" size="lg">
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Ad Soyad" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="E-posta" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <PhoneField
            country={form.phoneCountry}
            value={form.phone}
            onCountryChange={(iso) => setForm({ ...form, phoneCountry: iso, phone: '' })}
            onValueChange={(phone) => setForm({ ...form, phone })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Yaş" icon={CalendarDays} type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} error={errors.age} />
            <FormField label="Cinsiyet" as="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={form.gender ? '' : 'text-cream-800/40'}>
              <option value="">Seçin</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Şehir" as="select" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })}>
              <option value="">Şehir seçin</option>
              {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormField>
            <FormField label="İlçe" as="select" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.city}>
              <option value="">{form.city ? 'İlçe seçin' : '—'}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Kilo" icon={Scale} type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} error={errors.weight} />
            <FormField label="Boy" icon={Ruler} type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} error={errors.height} />
            <FormField label="Bel" icon={Ruler} type="number" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} error={errors.waist} />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Sparkles className="h-3.5 w-3.5" /> Hedefler
            </p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const sel = form.goals.includes(g.value)
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => toggleGoal(g.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      sel ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800/70'
                    }`}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Dumbbell className="h-3.5 w-3.5" /> Spor Seviyesi
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FITNESS_LEVELS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setForm({ ...form, fitnessLevel: f.value })}
                  className={`rounded-xl py-2 text-xs font-semibold ${
                    form.fitnessLevel === f.value ? 'bg-sage-500 text-white' : 'bg-cream-100 text-cream-800/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <Salad className="h-3.5 w-3.5" /> Beslenme Tercihleri
            </p>
            <div className="flex flex-wrap gap-2">
              {NUTRITION_PREFS.map((p) => {
                const sel = form.nutritionPrefs.includes(p.value)
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => toggleNutrition(p.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      sel ? 'bg-sage-500 text-white' : 'bg-cream-100 text-cream-800/70'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </Modal>
    </>
  )
}
