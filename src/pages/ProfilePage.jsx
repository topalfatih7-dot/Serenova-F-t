import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import MembershipBadge from '../components/ui/MembershipBadge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { User, Bell, Shield, CreditCard, LogOut, Edit, CalendarClock, CalendarDays, Dumbbell, Apple, ClipboardList, ChevronRight } from 'lucide-react'
import VideoJoinLink from '../components/video/VideoJoinLink'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek', other: 'Belirtilmedi' }

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
    name: user.name, email: user.email, city: user.city,
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-cream-900">Profil & Ayarlar</h1>
        <button type="button" onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-2 text-sm hover:bg-cream-50">
          <Edit className="h-4 w-4" /> Düzenle
        </button>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <div className="flex items-center gap-4">
          {user.photo ? (
            <img src={user.photo} alt={user.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-cream-900">{user.name}</p>
            <p className="text-sm text-cream-800/60">{user.email}</p>
            <div className="mt-2">
              <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
            </div>
          </div>
        </div>
      </div>

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

      {[
        { icon: User, title: 'Kişisel Bilgiler', items: [
          ['Ad', user.name], ['Yaş', user.age], ['Cinsiyet', GENDER_LABELS[user.gender] || '—'],
          ['Kilo', user.weight ? `${user.weight} kg` : '—'], ['Boy', user.height ? `${user.height} cm` : '—'],
          ['Bel çevresi', user.waist ? `${user.waist} cm` : '—'],
          ['Şehir', user.city || '—'],
        ] },
        { icon: Bell, title: 'Bildirim Ayarları', toggles: [
          { key: 'emailNotifs', label: 'E-posta bildirimleri' },
          { key: 'pushNotifs', label: 'Push bildirimleri' },
          { key: 'reminderNotifs', label: 'Hatırlatıcılar' },
        ]},
        { icon: Shield, title: 'Gizlilik', items: [['Dil', settings.language === 'tr' ? 'Türkçe' : 'English'], ['Tema', settings.theme === 'light' ? 'Açık' : 'Koyu']] },
        { icon: CreditCard, title: 'Abonelik', items: [['Plan', membership === 'free' ? 'Ücretsiz' : membership === 'gumus' ? 'Gümüş' : membership === 'altin' ? 'Altın' : membership === 'platinum' ? 'Platinum' : 'Premium'], ['Durum', membershipStatus]] },
      ].map((section) => (
        <div key={section.title} className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <section.icon className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-cream-900">{section.title}</h2>
          </div>
          {section.items && (
            <div className="mt-4 space-y-3">
              {section.items.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-cream-800/60">{k}</span>
                  <span className="font-medium capitalize">{v}</span>
                </div>
              ))}
            </div>
          )}
          {section.toggles && (
            <div className="mt-4 space-y-3">
              {section.toggles.map((t) => (
                <label key={t.key} className="flex items-center justify-between">
                  <span className="text-sm">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[t.key]}
                    onChange={(e) => updateSettings({ [t.key]: e.target.checked })}
                    className="accent-brand-500"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

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
        <Link to="/support" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 py-3 text-sm font-medium hover:bg-cream-50">
          Üyelik İşlemleri (Destek)
        </Link>
        <button type="button" onClick={handleLogout} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 py-3 text-sm font-medium hover:bg-cream-50">
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profili Düzenle">
        <div className="space-y-4">
          <FormField label="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
          <FormField label="E-posta" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
          <FormField label="Şehir" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Şehir" />
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
          <PhotoUpload value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
          <button type="button" onClick={handleSave} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">Kaydet</button>
        </div>
      </Modal>

    </div>
  )
}
