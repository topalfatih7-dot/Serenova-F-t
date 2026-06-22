import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import MembershipBadge from '../components/ui/MembershipBadge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  User, Bell, LogOut, Edit, CalendarClock, CalendarDays,
  Dumbbell, Apple, ClipboardList, ChevronRight, MapPin, Mail, Phone, Camera,
  Flame, CalendarCheck, Scale, Ruler, Heart, Shield, Activity,
} from 'lucide-react'
import PersonalInfoSection from '../components/profile/PersonalInfoSection'
import { syncMemberHealthAssets } from '../services/memberHealthSync'
import VideoJoinLink from '../components/video/VideoJoinLink'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek', other: 'Belirtilmedi' }
const MEMBERSHIP_LABELS = { free: 'Ücretsiz', gumus: 'Gümüş', altin: 'Altın', platinum: 'Platinum', premium: 'Premium' }
const STATUS_LABELS = { active: 'Aktif', paused: 'Dondurulmuş', cancelled: 'İptal' }

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
}

export default function ProfilePage() {
  const {
    user, membership, membershipStatus, settings, packageConfig, myPrograms, staff,
    coachSessions, dietitianSessions, updateProfile, updateSettings, logout,
    createProgram, exercises, refresh,
  } = useApp()
  const assignedCoach = (staff || []).find((s) => s.id === user.assignedCoachId)
  const assignedDietitian = (staff || []).find((s) => s.id === user.assignedDietitianId)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Stripe plan değişikliği dönüşü
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast('Ödeme alındı! Planınız birkaç saniye içinde güncellenecek.', 'success')
      refresh?.()
      const t = setTimeout(() => refresh?.(), 4000)
      const next = new URLSearchParams(searchParams)
      next.delete('payment'); next.delete('session_id')
      setSearchParams(next, { replace: true })
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [healthEditOpen, setHealthEditOpen] = useState(false)
  const [healthForm, setHealthForm] = useState({
    age: user.age || '',
    weight: user.weight || '',
    height: user.height || '',
    waist: user.waist || '',
  })
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: user.name, email: user.email, phone: user.phone || '', city: user.city,
    photo: user.photo || null,
  })

  const hasSupport =
    (Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 ||
    (Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0

  const upcomingSessions = [...(coachSessions || []), ...(dietitianSessions || [])]
    .filter((s) => s.status === 'scheduled' && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  const upcomingCount = [...(coachSessions || []), ...(dietitianSessions || [])]
    .filter((s) => s.status === 'scheduled' && new Date(s.date) >= new Date()).length

  const handleSave = () => {
    updateProfile(form)
    setEditOpen(false)
    toast('Profil güncellendi', 'success')
  }

  const handleHealthSave = async () => {
    await updateProfile(healthForm)
    setHealthEditOpen(false)
    const merged = { ...user, ...healthForm }
    const result = await syncMemberHealthAssets({
      user: merged,
      exercises,
      updateProfile,
      createProgram,
      myPrograms,
    })
    toast(
      result.synced ? 'Sağlık özeti güncellendi ve programlarınız yenilendi.' : 'Sağlık özeti güncellendi.',
      'success',
    )
  }

  const openHealthEdit = () => {
    setHealthForm({
      age: user.age || '',
      weight: user.weight || '',
      height: user.height || '',
      waist: user.waist || '',
    })
    setHealthEditOpen(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast('Çıkış yapıldı', 'info')
  }

  const quickLinks = [
    { to: '/programs', icon: ClipboardList, label: 'Programlarım', sub: `${myPrograms.length} program`, color: 'from-brand-500 to-brand-600' },
    { to: '/calendar', icon: CalendarDays, label: 'Takvim', sub: 'Müsaitlik', color: 'from-sage-500 to-emerald-600' },
    { to: '/calorie', icon: Flame, label: 'Kalori', sub: 'AI analiz', color: 'from-amber-500 to-orange-600' },
    { to: '/support', icon: Shield, label: 'Destek', sub: 'Üyelik işlemleri', color: 'from-violet-500 to-purple-600' },
  ]

  const bodyMetrics = [
    { icon: Scale, label: 'Kilo', value: user.weight ? `${user.weight} kg` : '—' },
    { icon: Ruler, label: 'Boy', value: user.height ? `${user.height} cm` : '—' },
    { icon: Activity, label: 'Bel', value: user.waist ? `${user.waist} cm` : '—' },
    { icon: Heart, label: 'Yaş', value: user.age || '—' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8 sm:space-y-6">

      {/* Hero */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative overflow-hidden rounded-3xl border border-cream-200/80 bg-white shadow-sm">
        <div className="relative h-36 bg-gradient-to-br from-brand-600 via-brand-500 to-sage-500 sm:h-44">
          <div aria-hidden className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div aria-hidden className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-gold-300/30 blur-2xl" />
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-cream-900 shadow-sm backdrop-blur transition hover:bg-white sm:text-sm"
          >
            <Edit className="h-3.5 w-3.5" /> Profili Düzenle
          </button>
        </div>

        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end">
            <div className="relative shrink-0">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white shadow-lg sm:h-32 sm:w-32" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-sage-500 text-4xl font-bold text-white ring-4 ring-white shadow-lg sm:h-32 sm:w-32">
                  {user.name?.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow ring-2 ring-white transition hover:bg-brand-600"
                aria-label="Fotoğraf değiştir"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <h1 className="font-display text-2xl font-bold text-cream-900 sm:text-3xl">{user.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-cream-800/60 sm:justify-start">
                <span className="flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}</span>
                {user.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.city}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
                <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-cream-800/70">
                  {MEMBERSHIP_LABELS[membership] || 'Ücretsiz'} · {STATUS_LABELS[membershipStatus] || membershipStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              { icon: ClipboardList, label: 'Program', value: myPrograms.length },
              { icon: CalendarCheck, label: 'Randevu', value: upcomingCount },
              { icon: Flame, label: 'Seri', value: user.streak || 0 },
              { icon: Dumbbell, label: 'Koç', value: assignedCoach ? '✓' : '—' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={i + 1}
                className="rounded-2xl border border-cream-100 bg-gradient-to-br from-cream-50 to-white p-3 text-center sm:p-4"
              >
                <s.icon className="mx-auto h-4 w-4 text-brand-500 sm:h-5 sm:w-5" />
                <p className="mt-1 font-display text-xl font-bold text-cream-900 sm:text-2xl">{s.value}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45 sm:text-xs">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {quickLinks.map((item, i) => (
          <motion.div key={item.to} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <Link
              to={item.to}
              className="group flex flex-col gap-2 rounded-2xl border border-cream-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm transition group-hover:scale-105`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-cream-900">{item.label}</p>
                <p className="text-xs text-cream-800/50">{item.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        {/* Sol: sağlık + kişisel */}
        <div className="space-y-5 lg:col-span-3">
          {/* Vücut metrikleri */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-cream-900">
                <Activity className="h-5 w-5 text-brand-500" /> Sağlık Özeti
              </h2>
              <button
                type="button"
                onClick={openHealthEdit}
                className="rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-105 sm:text-sm"
              >
                Ölçüleri Güncelle
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bodyMetrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-cream-50 p-3 text-center">
                  <m.icon className="mx-auto h-4 w-4 text-brand-500" />
                  <p className="mt-2 font-display text-lg font-bold text-cream-900">{m.value}</p>
                  <p className="text-[11px] text-cream-800/50">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Kişisel bilgiler — tam profil */}
          <PersonalInfoSection user={user} />
        </div>

        {/* Sağ: bildirim + abonelik */}
        <div className="space-y-5 lg:col-span-2">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="rounded-2xl border border-cream-200 bg-gradient-to-br from-brand-50/80 to-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cream-800/50">Üyelik</h2>
            <p className="mt-2 font-display text-2xl font-bold text-cream-900">{MEMBERSHIP_LABELS[membership] || 'Ücretsiz'}</p>
            <p className="mt-1 text-sm text-cream-800/60">
              Durum: <span className="font-medium capitalize text-cream-900">{STATUS_LABELS[membershipStatus] || membershipStatus}</span>
            </p>
            {packageConfig && membership !== 'free' && (
              <ul className="mt-4 space-y-2 text-xs text-cream-800/65">
                {(Number(packageConfig.coachMeetingsPerWeek) || 0) > 0 && (
                  <li className="flex items-center gap-2"><Dumbbell className="h-3.5 w-3.5 text-brand-500" /> Haftada {packageConfig.coachMeetingsPerWeek} koç görüşmesi</li>
                )}
                {(Number(packageConfig.dietitianMeetingsPerMonth) || 0) > 0 && (
                  <li className="flex items-center gap-2"><Apple className="h-3.5 w-3.5 text-sage-500" /> Ayda {packageConfig.dietitianMeetingsPerMonth} diyetisyen görüşmesi</li>
                )}
              </ul>
            )}
            <p className="mt-4 text-xs text-cream-800/45">
              Plan değişikliği için <Link to="/support" className="font-semibold text-brand-600 hover:underline">Destek</Link> üzerinden talep oluşturabilirsiniz.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold text-cream-900">
              <Bell className="h-5 w-5 text-brand-500" /> Bildirimler
            </h2>
            <div className="mt-4 space-y-3">
              {[
                { key: 'emailNotifs', label: 'E-posta' },
                { key: 'pushNotifs', label: 'Push' },
                { key: 'reminderNotifs', label: 'Hatırlatıcı' },
              ].map((t) => (
                <label key={t.key} className="flex cursor-pointer items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <span className="text-sm text-cream-800">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={!!settings[t.key]}
                    onChange={(e) => updateSettings({ [t.key]: e.target.checked })}
                    className="h-5 w-5 accent-brand-500"
                  />
                </label>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Uzmanlar */}
      {membership !== 'free' && hasSupport && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-cream-900">
              <CalendarClock className="h-5 w-5 text-brand-500" /> Uzmanlarım
            </h2>
            <Link to="/calendar" className="text-xs font-semibold text-brand-600 hover:underline">Takvime git</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-cream-100 bg-cream-50/50 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cream-900">{assignedCoach?.name || 'Atanmadı'}</p>
                  <p className="text-xs text-cream-800/55">Koç · Haftada {packageConfig.coachMeetingsPerWeek} görüşme</p>
                </div>
                <Link to="/schedule/coach" className="shrink-0 text-brand-600"><ChevronRight className="h-5 w-5" /></Link>
              </div>
            )}
            {(Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-cream-100 bg-cream-50/50 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <Apple className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cream-900">{assignedDietitian?.name || 'Atanmadı'}</p>
                  <p className="text-xs text-cream-800/55">Diyetisyen · Ayda {packageConfig.dietitianMeetingsPerMonth} görüşme</p>
                </div>
                <Link to="/schedule/dietitian" className="shrink-0 text-sage-600"><ChevronRight className="h-5 w-5" /></Link>
              </div>
            )}
          </div>
          {upcomingSessions.length > 0 && (
            <div className="mt-4 border-t border-cream-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/45">Yaklaşan</p>
              <div className="space-y-2">
                {upcomingSessions.map((s) => {
                  const sessionType = coachSessions?.some((cs) => cs.id === s.id) ? 'coach' : 'dietitian'
                  return (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2.5 text-sm">
                      <span className="font-medium text-cream-900">{s.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cream-800/60">{format(new Date(s.date), 'd MMM, HH:mm', { locale: tr })}</span>
                        <VideoJoinLink session={s} sessionType={sessionType} size="sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-white py-3.5 text-sm font-semibold text-cream-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut className="h-4 w-4" /> Çıkış Yap
      </button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profil Fotoğrafı & İletişim">
        <div className="space-y-4">
          <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          <FormField label="Ad Soyad" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
          <FormField label="E-posta" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
          <FormField label="Telefon" icon={Phone} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" />
          <FormField label="Şehir" icon={MapPin} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Şehir" />
          <button type="button" onClick={handleSave} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">Kaydet</button>
        </div>
      </Modal>

      <Modal open={healthEditOpen} onClose={() => setHealthEditOpen(false)} title="Sağlık Özeti Güncelle">
        <div className="space-y-4">
          <p className="text-sm text-cream-800/65">Yalnızca vücut ölçülerinizi güncelleyin. Diğer bilgiler Kişisel Bilgiler bölümünden düzenlenir.</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Yaş" icon={Heart} type="number" value={healthForm.age} onChange={(e) => setHealthForm({ ...healthForm, age: e.target.value })} placeholder="Yaş" />
            <FormField label="Kilo (kg)" icon={Scale} type="number" value={healthForm.weight} onChange={(e) => setHealthForm({ ...healthForm, weight: e.target.value })} placeholder="Kilo" />
            <FormField label="Boy (cm)" icon={Ruler} type="number" value={healthForm.height} onChange={(e) => setHealthForm({ ...healthForm, height: e.target.value })} placeholder="Boy" />
            <FormField label="Bel (cm)" icon={Activity} type="number" value={healthForm.waist} onChange={(e) => setHealthForm({ ...healthForm, waist: e.target.value })} placeholder="Bel" />
          </div>
          <button type="button" onClick={handleHealthSave} className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-3 text-sm font-bold text-white shadow-md hover:brightness-105">Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}
