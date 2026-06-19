import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  User, Bell, Shield, CreditCard, LogOut, Edit, CalendarClock, CalendarDays,
  Dumbbell, Apple, ClipboardList, ChevronRight, MapPin, Mail, Phone, Camera,
  Sparkles, Flame, CalendarCheck,
} from 'lucide-react'
import VideoJoinLink from '../components/video/VideoJoinLink'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek', other: 'Belirtilmedi' }
const MEMBERSHIP_LABELS = { free: 'Ücretsiz', gumus: 'Gümüş', altin: 'Altın', platinum: 'Platinum', premium: 'Premium' }

export default function ProfilePage() {
  const {
    user, membership, membershipStatus, settings, packageConfig, myPrograms, staff,
    coachSessions, dietitianSessions,
    updateProfile, updateSettings, logout,
  } = useApp()
  const assignedCoach = (staff || []).find((s) => s.id === user.assignedCoachId)
  const assignedDietitian = (staff || []).find((s) => s.id === user.assignedDietitianId)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: user.name, email: user.email, phone: user.phone || '', city: user.city,
    weight: user.weight || '', height: user.height || '', waist: user.waist || '',
    gender: user.gender || '', photo: user.photo || null,
  })

  const hasSupport =
    (Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 ||
    (Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0

  const upcomingSessions = [...(coachSessions || []), ...(dietitianSessions || [])]
    .filter((s) => s.status === 'scheduled' && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)

  const upcomingCount = [...(coachSessions || []), ...(dietitianSessions || [])]
    .filter((s) => s.status === 'scheduled' && new Date(s.date) >= new Date()).length

  const handleSave = () => {
    updateProfile(form)
    setEditOpen(false)
    toast('Profil güncellendi', 'success')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast('Çıkış yapıldı', 'info')
  }

  const stats = [
    { icon: ClipboardList, label: 'Program', value: myPrograms.length, color: 'text-brand-600 bg-brand-50' },
    { icon: CalendarCheck, label: 'Randevu', value: upcomingCount, color: 'text-sage-600 bg-sage-50' },
    { icon: Flame, label: 'Seri', value: user.streak || 0, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* ════ SOSYAL MEDYA TARZI PROFİL BAŞLIĞI ════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm"
      >
        {/* Kapak — renkli gradient + orb'lar */}
        <div className="relative h-32 bg-gradient-to-br from-brand-500 via-brand-600 to-sage-600 sm:h-40">
          <div aria-hidden className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div aria-hidden className="absolute right-6 top-4 h-24 w-24 rounded-full bg-gold-400/25 blur-2xl" />
          <div aria-hidden className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-cream-900 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Edit className="h-4 w-4" /> Düzenle
          </button>
        </div>

        {/* Avatar + isim */}
        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="-mt-12 flex flex-col items-center text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-left">
            <div className="relative">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md sm:h-28 sm:w-28" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-sage-400 text-4xl font-bold text-white ring-4 ring-white shadow-md sm:h-28 sm:w-28">
                  {user.name?.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow ring-2 ring-white transition hover:bg-brand-600"
                aria-label="Fotoğrafı değiştir"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex-1 sm:mb-2 sm:ml-5 sm:mt-0">
              <h1 className="font-display text-xl font-bold text-cream-900 sm:text-2xl">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-cream-800/60 sm:justify-start">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                {user.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.city}</span>}
              </div>
              <div className="mt-2 flex justify-center sm:justify-start">
                <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
              </div>
            </div>
          </div>

          {/* İstatistik şeridi */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-cream-100 pt-5">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream-50 py-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="font-display text-lg font-bold text-cream-900">{s.value}</span>
                <span className="text-[11px] text-cream-800/55">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Programlarım kısayolu */}
      <Link
        to="/programs"
        className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-cream-900">Programlarım</p>
          <p className="text-sm text-cream-800/60">
            {myPrograms.length > 0 ? `${myPrograms.length} antrenman/beslenme programı` : 'Koç ve diyetisyen programlarınız'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-cream-800/30" />
      </Link>

      {/* Detay kartları */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Kişisel Bilgiler */}
        <div className="rounded-2xl border border-cream-200 bg-white p-6 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-500" />
              <h2 className="font-semibold text-cream-900">Kişisel Bilgiler</h2>
            </div>
            <button type="button" onClick={() => setEditOpen(true)} className="text-xs font-semibold text-brand-600 hover:underline">
              Düzenle
            </button>
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ['Telefon', user.phone || '—'],
              ['Yaş', user.age || '—'],
              ['Cinsiyet', GENDER_LABELS[user.gender] || '—'],
              ['Şehir', user.city || '—'],
              ['Kilo', user.weight ? `${user.weight} kg` : '—'],
              ['Boy', user.height ? `${user.height} cm` : '—'],
              ['Bel çevresi', user.waist ? `${user.waist} cm` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-cream-50 pb-2 text-sm">
                <span className="text-cream-800/60">{k}</span>
                <span className="font-medium text-cream-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bildirim Ayarları */}
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-cream-900">Bildirim Ayarları</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { key: 'emailNotifs', label: 'E-posta bildirimleri' },
              { key: 'pushNotifs', label: 'Push bildirimleri' },
              { key: 'reminderNotifs', label: 'Hatırlatıcılar' },
            ].map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-cream-800/80">{t.label}</span>
                <input
                  type="checkbox"
                  checked={!!settings[t.key]}
                  onChange={(e) => updateSettings({ [t.key]: e.target.checked })}
                  className="h-4 w-4 accent-brand-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Abonelik */}
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-cream-900">Abonelik</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-cream-800/60">Plan</span>
              <span className="font-medium text-cream-900">{MEMBERSHIP_LABELS[membership] || 'Ücretsiz'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cream-800/60">Durum</span>
              <span className="font-medium capitalize text-cream-900">{membershipStatus}</span>
            </div>
          </div>
          <Link
            to={`/onboarding?plan=${membership === 'free' ? 'gumus' : membership}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <Sparkles className="h-4 w-4" /> Planı Değiştir
          </Link>
        </div>
      </div>

      {/* Uzmanlar & Randevular */}
      {membership !== 'free' && hasSupport && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-cream-900">Uzmanlarım & Randevular</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Dumbbell className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">Koç</p>
                  <p className="text-xs text-cream-800/60">
                    {assignedCoach?.name || 'Henüz atanmadı'} · Haftada {packageConfig.coachMeetingsPerWeek} görüşme
                  </p>
                </div>
                <Link to="/schedule/coach" className="text-xs font-semibold text-brand-600 hover:underline">Randevular</Link>
              </div>
            )}
            {(Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <Apple className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">Diyetisyen</p>
                  <p className="text-xs text-cream-800/60">
                    {assignedDietitian?.name || 'Henüz atanmadı'} · Ayda {packageConfig.dietitianMeetingsPerMonth} görüşme
                  </p>
                </div>
                <Link to="/schedule/dietitian" className="text-xs font-semibold text-sage-600 hover:underline">Randevular</Link>
              </div>
            )}
          </div>
          {upcomingSessions.length > 0 && (
            <div className="mt-4 border-t border-cream-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/45">Yaklaşan Randevular</p>
              <div className="space-y-1.5">
                {upcomingSessions.map((s) => {
                  const sessionType = coachSessions?.some((cs) => cs.id === s.id) ? 'coach' : 'dietitian'
                  return (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream-50 px-3 py-2 text-sm">
                      <span className="text-cream-800/70">{s.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-cream-900">{format(new Date(s.date), 'd MMM, HH:mm', { locale: tr })}</span>
                        <VideoJoinLink session={s} sessionType={sessionType} size="sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <Link
            to="/calendar"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            <CalendarDays className="h-4 w-4" /> Müsaitliğimi Takvimden Düzenle
          </Link>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/support" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 bg-white py-3 text-sm font-medium hover:bg-cream-50">
          Üyelik İşlemleri (Destek)
        </Link>
        <button type="button" onClick={handleLogout} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 bg-white py-3 text-sm font-medium hover:bg-cream-50">
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profili Düzenle">
        <div className="space-y-4">
          <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          <FormField label="Ad Soyad" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
          <FormField label="E-posta" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
          <FormField label="Telefon" icon={Phone} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" />
          <FormField label="Şehir" icon={MapPin} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Şehir" />
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Kilo (kg)" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Kilo" />
            <FormField label="Boy (cm)" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="Boy" />
            <FormField label="Bel (cm)" type="number" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} placeholder="Bel" />
          </div>
          <FormField label="Cinsiyet" as="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={form.gender ? '' : 'text-cream-800/40'}>
            <option value="">Belirtmek istemiyorum</option>
            <option value="female" className="text-cream-900">Kadın</option>
            <option value="male" className="text-cream-900">Erkek</option>
            <option value="other" className="text-cream-900">Belirtmek istemiyorum</option>
          </FormField>
          <button type="button" onClick={handleSave} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}
