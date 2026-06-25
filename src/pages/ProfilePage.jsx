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
import VerificationSection from '../components/profile/VerificationSection'
import ProfileSectionCard from '../components/profile/ProfileSectionCard'
import { syncMemberHealthAssets } from '../services/memberHealthSync'
import VideoJoinLink from '../components/video/VideoJoinLink'

import { getPlanLabel } from '../data/membershipPlans'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
}

export default function ProfilePage() {
  const {
    user, membership, membershipStatus, settings, packageConfig, myPrograms, staff,
    coachSessions, dietitianSessions, updateProfile, updateSettings, logout,
    createProgram, exercises, refresh,
    verificationStatus, sendEmailVerification, confirmEmailVerification,
    sendPhoneVerification, confirmPhoneVerification, refreshVerification,
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
    name: user.name, email: user.email, phone: user.phone || '', city: user.city, district: user.district || '',
    photo: user.photo || null,
  })

  const hasSupport =
    (Number(packageConfig?.coachMeetingsPerMonth) || Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 ||
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
    { to: '/support', icon: Shield, label: 'Destek', sub: 'Yardım & talepler', color: 'from-violet-500 to-purple-600' },
  ]

  const bodyMetrics = [
    { icon: Scale, label: 'Kilo', value: user.weight ? `${user.weight} kg` : '—' },
    { icon: Ruler, label: 'Boy', value: user.height ? `${user.height} cm` : '—' },
    { icon: Activity, label: 'Bel', value: user.waist ? `${user.waist} cm` : '—' },
    { icon: Heart, label: 'Yaş', value: user.age || '—' },
  ]

  return (
    <div className="relative mx-auto max-w-4xl space-y-5 pb-10 sm:space-y-6">
      <div aria-hidden className="pointer-events-none absolute -left-6 -right-6 -top-6 -z-10 h-64 rounded-[2rem] bg-gradient-to-br from-brand-100/50 via-cream-50 to-sage-100/40 blur-2xl sm:-left-10 sm:-right-10" />

      {/* Hero */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative overflow-hidden rounded-3xl border border-white/80 bg-white shadow-lg shadow-brand-900/[0.06]">
        <div className="relative h-40 bg-gradient-to-br from-brand-600 via-brand-500 to-sage-500 sm:h-48">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
          <motion.div
            aria-hidden
            className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            aria-hidden
            className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-gold-300/30 blur-2xl"
            animate={{ x: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
          />
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-cream-900 shadow-md backdrop-blur transition hover:scale-[1.02] hover:bg-white sm:text-sm"
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
                <span className="rounded-full bg-gradient-to-r from-brand-100 to-sage-100 px-3 py-1 text-xs font-semibold text-brand-800">
                  {getPlanLabel(membership)} Üye
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
                className="rounded-2xl border border-white/80 bg-gradient-to-br from-white to-cream-50/80 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
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
              className="group flex flex-col gap-2 rounded-2xl border border-white/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
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
          <ProfileSectionCard
            icon={Activity}
            title="Sağlık Özeti"
            subtitle="Vücut ölçülerinizi takip edin"
            accent="amber"
            delay={0.1}
            action={(
              <button
                type="button"
                onClick={openHealthEdit}
                className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:brightness-105 sm:text-sm"
              >
                Ölçüleri Güncelle
              </button>
            )}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bodyMetrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="rounded-2xl border border-amber-100/80 bg-white/80 p-3 text-center shadow-sm"
                >
                  <m.icon className="mx-auto h-4 w-4 text-amber-600" />
                  <p className="mt-2 font-display text-lg font-bold text-cream-900">{m.value}</p>
                  <p className="text-[11px] font-medium text-cream-800/50">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </ProfileSectionCard>

          {/* Kişisel bilgiler — tam profil */}
          <PersonalInfoSection user={user} />

          <VerificationSection
            user={user}
            verificationStatus={verificationStatus}
            onSendEmailVerification={sendEmailVerification}
            onConfirmEmailVerification={confirmEmailVerification}
            onSendPhoneVerification={sendPhoneVerification}
            onConfirmPhoneVerification={confirmPhoneVerification}
            onRefresh={refresh}
            onRefreshStatus={refreshVerification}
          />
        </div>

        {/* Sağ: bildirim + abonelik */}
        <div className="space-y-5 lg:col-span-2">
          <ProfileSectionCard
            icon={Shield}
            title="Üyelik Planınız"
            subtitle="Aktif paket ve görüşme haklarınız"
            accent="violet"
            delay={0.15}
          >
            <p className="font-display text-3xl font-bold text-cream-900">{getPlanLabel(membership)}</p>
            {packageConfig && membership !== 'free' && (
              <ul className="mt-4 space-y-2.5">
                {(Number(packageConfig.coachMeetingsPerMonth) || Number(packageConfig.coachMeetingsPerWeek) || 0) > 0 && (
                  <li className="flex items-center gap-2 rounded-xl bg-violet-50/80 px-3 py-2 text-sm text-cream-800">
                    <Dumbbell className="h-4 w-4 text-brand-500" /> Ayda {packageConfig.coachMeetingsPerMonth || (packageConfig.coachMeetingsPerWeek || 0) * 4} koç görüşmesi
                  </li>
                )}
                {(Number(packageConfig.dietitianMeetingsPerMonth) || 0) > 0 && (
                  <li className="flex items-center gap-2 rounded-xl bg-violet-50/80 px-3 py-2 text-sm text-cream-800">
                    <Apple className="h-4 w-4 text-sage-500" /> Ayda {packageConfig.dietitianMeetingsPerMonth} diyetisyen görüşmesi
                  </li>
                )}
              </ul>
            )}
            <p className="mt-4 text-xs text-cream-800/50">
              Plan değişikliği için <Link to="/support" className="font-semibold text-brand-600 hover:underline">Destek</Link> üzerinden bize ulaşın.
            </p>
          </ProfileSectionCard>

          <ProfileSectionCard
            icon={Bell}
            title="Bildirimler"
            subtitle="Tercihlerinizi yönetin"
            accent="rose"
            delay={0.2}
          >
            <div className="space-y-2.5">
              {[
                { key: 'emailNotifs', label: 'E-posta bildirimleri', color: 'bg-brand-50' },
                { key: 'pushNotifs', label: 'Push bildirimleri', color: 'bg-sage-50' },
                { key: 'reminderNotifs', label: 'Hatırlatıcılar', color: 'bg-amber-50' },
              ].map((t) => (
                <label key={t.key} className={`flex cursor-pointer items-center justify-between rounded-2xl border border-white/80 px-4 py-3 shadow-sm transition hover:shadow-md ${t.color}`}>
                  <span className="text-sm font-medium text-cream-800">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={!!settings[t.key]}
                    onChange={(e) => updateSettings({ [t.key]: e.target.checked })}
                    className="h-5 w-5 accent-brand-500"
                  />
                </label>
              ))}
            </div>
          </ProfileSectionCard>
        </div>
      </div>

      {/* Uzmanlar */}
      {membership !== 'free' && hasSupport && (
        <ProfileSectionCard
          icon={CalendarClock}
          title="Uzmanlarım"
          subtitle="Koç ve diyetisyen randevularınız"
          accent="sage"
          delay={0.25}
          action={(
            <Link to="/calendar" className="text-xs font-semibold text-sage-700 hover:underline">Takvime git</Link>
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(Number(packageConfig?.coachMeetingsPerMonth) || Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cream-900">{assignedCoach?.name || 'Atanmadı'}</p>
                  <p className="text-xs text-cream-800/55">Koç · Ayda {packageConfig.coachMeetingsPerMonth || (packageConfig.coachMeetingsPerWeek || 0) * 4} görüşme</p>
                </div>
                <Link to="/schedule/coach" className="shrink-0 text-brand-600"><ChevronRight className="h-5 w-5" /></Link>
              </div>
            )}
            {(Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
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
        </ProfileSectionCard>
      )}

      <motion.button
        type="button"
        onClick={handleLogout}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-gradient-to-r from-white to-red-50/50 py-3.5 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-200 hover:shadow-md"
      >
        <LogOut className="h-4 w-4" /> Çıkış Yap
      </motion.button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profil Fotoğrafı & İletişim">
        <div className="space-y-4">
          <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          <FormField label="Ad Soyad" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
          <FormField label="E-posta" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
          <FormField label="Telefon" icon={Phone} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" />
          <FormField label="Şehir" icon={MapPin} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Şehir" />
          <FormField label="İlçe" icon={MapPin} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="İlçe" />
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
