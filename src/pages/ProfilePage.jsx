import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import MembershipBadge from '../components/ui/MembershipBadge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { requestNotificationPermission, unlockNotificationAudio } from '../utils/browserNotifications'
import {
  User, Bell, LogOut, Edit, CalendarDays,
  Dumbbell, Apple, ClipboardList, MapPin, Mail, Phone, Camera,
  Flame, Shield, Stethoscope, Clock, Loader2,
} from 'lucide-react'
import PersonalInfoSection from '../components/profile/PersonalInfoSection'
import HealthSummarySection from '../components/profile/HealthSummarySection'
import VerificationSection from '../components/profile/VerificationSection'
import ProfileSectionCard from '../components/profile/ProfileSectionCard'

import { getPlanLabel } from '../data/membershipPlans'
import { isOneTimePlan, isPackageEntryActive } from '../utils/memberPackages'
import { getRemainingDays } from '../services/premiumMembership'
import useStripePaymentReturn from '../hooks/useStripePaymentReturn'
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
}

export default function ProfilePage() {
  const {
    user, membership, membershipStatus, settings, myPrograms, staff,
    updateProfile, updateSettings, logout, loggingOut,
    refresh,
    verificationStatus, sendEmailVerification, confirmEmailVerification,
    sendPhoneVerification, confirmPhoneVerification, refreshVerification,
    premiumExpiresAt,
  } = useApp()
  const assignedCoach = (staff || []).find((s) => s.id === user.assignedCoachId)
  const assignedDietitian = (staff || []).find((s) => s.id === user.assignedDietitianId)
  const assignedDoctor = (staff || []).find((s) => s.id === user.assignedDoctorId)
  const { toast } = useToast()
  const navigate = useNavigate()

  useStripePaymentReturn(refresh, {
    successMessage: 'Ödeme alındı! Planınız birkaç saniye içinde güncellenecek.',
  })

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: user.name, email: user.email, phone: user.phone || '', city: user.city, district: user.district || '',
    photo: user.photo || null,
  })

  const expertCards = [
    { icon: Dumbbell, label: 'Koç', name: assignedCoach?.name, to: '/schedule/coach', iconClass: 'text-brand-500' },
    { icon: Apple, label: 'Diyetisyen', name: assignedDietitian?.name, to: '/schedule/dietitian', iconClass: 'text-sage-500' },
    { icon: Stethoscope, label: 'Doktor', name: assignedDoctor?.name, to: '/schedule/doctor', iconClass: 'text-teal-600' },
  ]

  const handleSave = () => {
    updateProfile(form)
    setEditOpen(false)
    toast('Profil güncellendi', 'success')
  }

  const remainingDays = getRemainingDays(premiumExpiresAt)

  const handleLogout = async () => {
    if (loggingOut) return
    await logout()
    navigate('/')
    toast('Çıkış yapıldı', 'info')
  }

  const handleNotifToggle = async (key, checked) => {
    if ((key === 'pushNotifs' || key === 'soundNotifs') && checked) {
      await unlockNotificationAudio().catch(() => {})
    }
    if (key === 'pushNotifs' && checked) {
      const permission = await requestNotificationPermission()
      if (permission === 'denied') {
        toast('Tarayıcı bildirimleri engellenmiş. Tarayıcı ayarlarından Yeni Form için izin verin.', 'warning', 6000)
      } else if (permission === 'granted') {
        toast('Tarayıcı bildirimleri açıldı.', 'success')
      }
    }
    updateSettings({ [key]: checked })
  }

  const quickLinks = [
    { to: '/programs', icon: ClipboardList, label: 'Programlarım', sub: `${myPrograms.length} program`, color: 'from-brand-500 to-brand-600' },
    { to: '/calendar', icon: CalendarDays, label: 'Takvim', sub: 'Müsaitlik', color: 'from-sage-500 to-emerald-600' },
    { to: '/calorie', icon: Flame, label: 'Kalori', sub: 'Tahmini hesap', color: 'from-amber-500 to-orange-600' },
    { to: '/support', icon: Shield, label: 'Destek', sub: 'Yardım & talepler', color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <div className="relative w-full space-y-5 pb-10 sm:space-y-6">
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
          <div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-center">
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

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold text-cream-900 sm:text-3xl">{user.name}</h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
                <span className="rounded-full bg-gradient-to-r from-brand-100 to-sage-100 px-3 py-1 text-xs font-semibold text-brand-800">
                  {getPlanLabel(membership)}
                </span>
              </div>
            </div>
          </div>

          {/* Uzmanlar */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {expertCards.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={i + 1}
              >
                <Link
                  to={item.to}
                  className="flex flex-col items-center rounded-2xl border border-white/80 bg-gradient-to-br from-white to-cream-50/80 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-4"
                >
                  <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.iconClass}`} />
                  <p className="mt-2 text-sm font-semibold text-cream-900 sm:text-base">{item.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-cream-800/50 sm:text-xs">
                    {item.name || 'Atanmadı'}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <HealthSummarySection user={user} />

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        {/* Sol: hızlı erişim + kişisel */}
        <div className="space-y-5 lg:col-span-3">
          {/* Hızlı erişim — 2x2 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {quickLinks.map((item, i) => (
              <motion.div key={item.to} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <Link
                  to={item.to}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-white/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
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

          {/* Kişisel bilgiler — tam profil */}
          <PersonalInfoSection user={user} />
        </div>

        {/* Sağ: bildirim + abonelik */}
        <div className="space-y-5 lg:col-span-2">
          <ProfileSectionCard
            icon={Shield}
            title="Üyelik Planınız"
            subtitle="Aktif paket süreniz"
            accent="violet"
            delay={0.15}
          >
            <p className="font-display text-3xl font-bold text-cream-900">{getPlanLabel(membership)}</p>
            {(user.activePackages || []).filter((p) => isPackageEntryActive(p)).length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.activePackages || []).filter((p) => isPackageEntryActive(p)).map((p) => (
                  <span key={p.id} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200">
                    {getPlanLabel(p.planId)}
                    {isOneTimePlan(p.planId) ? ' · tek görüşme' : p.expiresAt ? ` · ${new Date(p.expiresAt).toLocaleDateString('tr-TR')}` : ''}
                  </span>
                ))}
              </div>
            )}
            {membership !== 'free' && premiumExpiresAt && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 p-[1px] shadow-md shadow-violet-500/10"
              >
                <div className="rounded-[calc(1rem-1px)] bg-gradient-to-br from-white/95 via-violet-50/40 to-fuchsia-50/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600/75">Kalan Süre</p>
                      <p className="mt-1 font-display text-3xl font-bold">
                        <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                          {remainingDays ?? '—'}
                        </span>
                        <span className="ml-1 text-base font-semibold text-violet-700/80">gün</span>
                      </p>
                      <p className="mt-1 text-xs text-cream-800/55">
                        {new Date(premiumExpiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihine kadar
                      </p>
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                      <Clock className="h-7 w-7" />
                    </div>
                  </div>
                  {membershipStatus === 'expiring' && (
                    <p className="mt-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 text-xs font-semibold text-orange-700">
                      Süreniz yakında doluyor — yenilemek için destek ile iletişime geçin.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
            {membership === 'free' && (
              <p className="mt-4 text-sm text-cream-800/60">
                Ücretsiz plandasınız.{' '}
                <Link to="/membership" className="font-semibold text-brand-600 hover:text-brand-700">Premium özellikler için plan yükseltin</Link>
              </p>
            )}
            <Link
              to="/membership"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              Planları karşılaştır / değiştir
            </Link>
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
                { key: 'pushNotifs', label: 'Tarayıcı bildirimleri', color: 'bg-sage-50' },
                { key: 'soundNotifs', label: 'Bildirim sesleri', color: 'bg-violet-50' },
                { key: 'reminderNotifs', label: 'Hatırlatıcılar', color: 'bg-amber-50' },
              ].map((t) => (
                <label key={t.key} className={`flex cursor-pointer items-center justify-between rounded-2xl border border-white/80 px-4 py-3 shadow-sm transition hover:shadow-md ${t.color}`}>
                  <span className="text-sm font-medium text-cream-800">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={!!settings[t.key]}
                    onChange={(e) => handleNotifToggle(t.key, e.target.checked)}
                    className="h-5 w-5 accent-brand-500"
                  />
                </label>
              ))}
            </div>
          </ProfileSectionCard>

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
      </div>

      <motion.button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        whileHover={{ scale: loggingOut ? 1 : 1.01 }}
        whileTap={{ scale: loggingOut ? 1 : 0.99 }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-gradient-to-r from-white to-red-50/50 py-3.5 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
      </motion.button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profil Fotoğrafı & İletişim">
        <div className="space-y-4">
          <PhotoUpload label="" value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          <FormField label="Ad Soyad" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
          <FormField label="E-posta" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
          <FormField label="Telefon" icon={Phone} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" />
          <FormField label="Şehir" icon={MapPin} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Şehir" />
          <FormField label="İlçe" icon={MapPin} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="İlçe" />
          <button type="button" onClick={handleSave} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}
