import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Globe, Clock, Lock, Check, X,
  ExternalLink, AlertCircle, Loader2, Eye, Info, Bell,
} from 'lucide-react'
import PhotoUpload from '../ui/PhotoUpload'
import PhoneField from '../ui/PhoneField'
import ProfileSectionCard from '../profile/ProfileSectionCard'
import { GENDERS } from '../../data/staffApplication'
import { CITY_NAMES, getDistricts } from '../../data/turkeyCities'
import WeeklyAvailability from '../package/WeeklyAvailability'
import { normalizeStaffProfile } from '../../data/staffProfile'
import { staffRoleMeta } from '../../utils/staffRoles'
import { staffProfilePath } from '../../config/seo'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { supabase } from '../../services/supabaseClient'
import { useToast } from '../../context/ToastContext'
import { detectExternalContactInfo } from '../../utils/contactInfoGuard'

const TABS = [
  { id: 'profile', label: 'Profil', icon: User, hint: 'Fotoğraf, iletişim ve tanıtım' },
  { id: 'schedule', label: 'Çalışma', icon: Clock, hint: 'Müsaitlik ve sosyal medya' },
  { id: 'security', label: 'Güvenlik', icon: Lock, hint: 'Şifre değiştirme' },
]

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
      {children}{required && <span className="text-brand-500"> *</span>}
    </span>
  )
}

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

/** Başvuru onayından sonra personelin değiştiremeyeceği alanlar */
function lockedProfileFields(staffUser) {
  const base = normalizeStaffProfile(staffUser)
  return {
    specialty: base.specialty,
    specialties: base.specialties,
    experienceYears: base.experienceYears,
    languages: base.languages,
    education: base.education,
    experiences: base.experiences,
    certificates: base.certificates,
    role: base.role,
    email: base.email,
  }
}

export default function StaffProfileEditor({ staffUser, onSave }) {
  const { toast } = useToast()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => normalizeStaffProfile(staffUser))
  const [whatsappNotifs, setWhatsappNotifs] = useState(
    () => staffUser?.settings?.whatsappNotifs !== false,
  )
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const meta = staffRoleMeta(staffUser.role)
  const RoleIcon = meta.icon
  const districts = useMemo(() => getDistricts(form.city), [form.city])
  const update = (patch) => setForm((f) => normalizeStaffProfile({ ...f, ...patch }))

  const completionHints = [
    !form.photo && 'Profil fotoğrafı',
    !form.bio && 'Biyografi',
  ].filter(Boolean)

  const validate = () => {
    if (!form.name?.trim()) return 'Ad soyad gerekli.'
    if (!form.phone?.trim()) return 'Telefon gerekli.'
    if (!form.city?.trim() || !form.district?.trim()) return 'İl ve ilçe seçin.'
    if (!form.gender) return 'Cinsiyet seçin.'
    if (!form.photo) return 'Profil fotoğrafı gerekli.'
    const bioGuard = detectExternalContactInfo(form.bio)
    if (bioGuard.blocked) return `Biyografide ${bioGuard.reason} paylaşamazsınız. Tüm iletişim uygulama içinden yürütülmelidir.`
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) {
      toast(err, 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...lockedProfileFields(staffUser),
        name: form.name.trim(),
        phone: form.phone,
        title: form.title,
        gender: form.gender,
        city: form.city,
        district: form.district,
        bio: form.bio,
        photo: form.photo,
        availability: form.availability || {},
        linkedin: form.linkedin,
        instagram: form.instagram,
        youtube: form.youtube,
        website: form.website,
        settings: {
          ...(staffUser?.settings || {}),
          whatsappNotifs,
        },
      }
      const result = await onSave(payload)
      if (result?.success === false) {
        toast(result.error || 'Kaydedilemedi', 'error')
        return
      }
      toast('Profiliniz güncellendi', 'success')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!currentPassword) {
      toast('Mevcut şifrenizi girin.', 'error')
      return
    }
    if (!isPasswordValid(password)) {
      toast('Yeni şifre gereksinimleri karşılanmıyor.', 'error')
      return
    }
    if (password !== passwordConfirm) {
      toast('Yeni şifreler eşleşmiyor.', 'error')
      return
    }
    if (currentPassword === password) {
      toast('Yeni şifre mevcut şifreden farklı olmalı.', 'error')
      return
    }
    setPasswordSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: staffUser.email,
        password: currentPassword,
      })
      if (signInError) {
        toast('Mevcut şifre hatalı.', 'error')
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast('Şifreniz güncellendi', 'success')
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirm('')
    } catch (err) {
      toast(err.message || 'Şifre güncellenemedi', 'error')
    } finally {
      setPasswordSaving(false)
    }
  }

  const publicPath = staffProfilePath(staffUser)
  const activeTab = TABS.find((t) => t.id === tab)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-cream-200/80 bg-gradient-to-br from-brand-500 via-brand-600 to-sage-600 p-5 text-white shadow-lg sm:p-6"
      >
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            {form.photo ? (
              <img src={form.photo} alt={form.name} className="h-20 w-20 rounded-2xl border-4 border-white/40 object-cover shadow-xl sm:h-24 sm:w-24" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/20 sm:h-24 sm:w-24">
                <User className="h-10 w-10 text-white/70" />
              </div>
            )}
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-brand-700 shadow-md">
              <RoleIcon className="h-3 w-3" /> {meta.label}
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-xl font-bold sm:text-2xl">{form.name || 'Profiliniz'}</h1>
            <p className="mt-1 text-sm text-white/80">{form.title || form.email}</p>
            {completionHints.length > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <AlertCircle className="h-3.5 w-3.5" />
                Eksik: {completionHints.slice(0, 2).join(', ')}{completionHints.length > 2 ? '…' : ''}
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Check className="h-3.5 w-3.5" /> Profil tamamlandı
              </p>
            )}
          </div>
          <Link
            to={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
          >
            <Eye className="h-4 w-4" /> Halka açık profil
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>
      </motion.div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-brand-50/50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="text-xs leading-relaxed text-cream-800/70">
          Uzmanlık alanları, eğitim ve sertifikalar başvurunuz onaylandığında sisteme kaydedilir;
          değişiklik için yöneticinize başvurun.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2 sm:flex-wrap sm:min-w-0">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'border border-cream-200 bg-white text-cream-800/70 hover:border-brand-200 hover:text-brand-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
        {activeTab && (
          <p className="mt-2 text-xs text-cream-800/50">{activeTab.hint}</p>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'profile' && (
            <ProfileSectionCard icon={User} title="Temel Bilgiler" subtitle="Danışanlarınızın gördüğü profil kartı" accent="brand">
              <div className="space-y-5">
                <PhotoUpload
                  value={form.photo}
                  onChange={(photo) => update({ photo })}
                  label="Profil Fotoğrafı"
                  variant="portrait"
                  hint="Net portre fotoğrafı önerilir — kadro sayfalarında görünür."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <FieldLabel required>Ad Soyad</FieldLabel>
                    <input value={form.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} placeholder="Adınız Soyadınız" />
                  </label>
                  <div className="sm:col-span-2">
                    <PhoneField value={form.phone} onValueChange={(phone) => update({ phone })} label="Telefon *" />
                  </div>
                  <label className="block">
                    <FieldLabel>Unvan</FieldLabel>
                    <input value={form.title} onChange={(e) => update({ title: e.target.value })} className={inputCls} placeholder="Uzman Diyetisyen" />
                  </label>
                  <label className="block">
                    <FieldLabel required>Cinsiyet</FieldLabel>
                    <select value={form.gender} onChange={(e) => update({ gender: e.target.value })} className={`${inputCls} ${form.gender ? '' : 'text-cream-800/40'}`}>
                      <option value="">Seçin</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <FieldLabel required>İl</FieldLabel>
                    <select value={form.city} onChange={(e) => update({ city: e.target.value, district: '' })} className={inputCls}>
                      <option value="">Seçin</option>
                      {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <FieldLabel required>İlçe</FieldLabel>
                    <select value={form.district} onChange={(e) => update({ district: e.target.value })} disabled={!form.city} className={inputCls}>
                      <option value="">{form.city ? 'Seçin' : '—'}</option>
                      {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <FieldLabel>Biyografi</FieldLabel>
                  <textarea
                    value={form.bio}
                    onChange={(e) => update({ bio: e.target.value })}
                    rows={5}
                    placeholder="Deneyiminiz, yaklaşımınız ve danışanlarınıza nasıl destek olduğunuz…"
                    className={`${inputCls} resize-y`}
                  />
                  <p className="mt-1.5 text-xs text-cream-800/50">
                    Bu biyografi herkese açık yayınlanır — kadro sayfalarında ve genel profilinizde görünür.
                  </p>
                </label>
                <div className="rounded-2xl border border-cream-200 bg-cream-50/50 px-4 py-3">
                  <p className="text-xs text-cream-800/55">
                    <span className="font-semibold">E-posta:</span> {form.email}
                    <span className="ml-2 text-cream-800/40">(değişiklik için yöneticinize başvurun)</span>
                  </p>
                </div>
              </div>
            </ProfileSectionCard>
          )}

          {tab === 'schedule' && (
            <div className="space-y-5">
              <ProfileSectionCard icon={Clock} title="Randevu Müsaitliği" subtitle="Danışanlar yalnızca burada seçtiğiniz gün ve saatlerden randevu alabilir" accent="sage">
                <WeeklyAvailability
                  value={form.availability || {}}
                  onChange={(availability) => update({ availability })}
                />
              </ProfileSectionCard>
              <ProfileSectionCard icon={Globe} title="Sosyal Medya & Web" subtitle="Yalnızca yönetim kaydı — danışanlara gösterilmez" accent="violet">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={form.linkedin} onChange={(e) => update({ linkedin: e.target.value })} placeholder="LinkedIn URL" className={inputCls} />
                  <input value={form.instagram} onChange={(e) => update({ instagram: e.target.value })} placeholder="Instagram URL" className={inputCls} />
                  <input value={form.youtube} onChange={(e) => update({ youtube: e.target.value })} placeholder="YouTube URL" className={inputCls} />
                  <input value={form.website} onChange={(e) => update({ website: e.target.value })} placeholder="Web sitesi URL" className={inputCls} />
                </div>
              </ProfileSectionCard>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-5">
              <ProfileSectionCard icon={Bell} title="Bildirimler" subtitle="Randevu ve mesaj uyarıları" accent="sage">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-cream-200 bg-teal-50/60 px-4 py-3">
                  <span className="text-sm font-medium text-cream-800">WhatsApp bildirimleri</span>
                  <input
                    type="checkbox"
                    checked={whatsappNotifs}
                    onChange={(e) => setWhatsappNotifs(e.target.checked)}
                    className="h-5 w-5 accent-brand-500"
                  />
                </label>
                <p className="mt-2 text-xs text-cream-800/50">
                  Kapalıysa randevu ve danışan mesajı WhatsApp bildirimleri gönderilmez. Kaydet’e basmayı unutmayın.
                </p>
              </ProfileSectionCard>
              <ProfileSectionCard icon={Lock} title="Şifre Değiştir" subtitle="Güvenlik için önce mevcut şifrenizi doğrulayın" accent="brand">
              <div className="space-y-4">
                <label className="block sm:max-w-md">
                  <FieldLabel required>Mevcut şifre</FieldLabel>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputCls}
                    autoComplete="current-password"
                    placeholder="Şu anki şifreniz"
                  />
                </label>
                <ul className="grid gap-1.5 rounded-2xl border border-cream-100 bg-cream-50/60 p-4 sm:grid-cols-2">
                  {PASSWORD_RULES.map((r) => {
                    const ok = r.test(password)
                    return (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-sage-600' : 'text-cream-800/45'}`}>
                        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {r.label}
                      </li>
                    )
                  })}
                </ul>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>Yeni şifre</FieldLabel>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
                  </label>
                  <label className="block">
                    <FieldLabel required>Yeni şifre tekrarı</FieldLabel>
                    <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  disabled={
                    passwordSaving
                    || !currentPassword
                    || !password
                    || !isPasswordValid(password)
                    || password !== passwordConfirm
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-50"
                >
                  {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Şifreyi Güncelle
                </button>
              </div>
            </ProfileSectionCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-4 z-10 flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
    </div>
  )
}
