import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MembershipBadge from '../components/ui/MembershipBadge'
import Modal from '../components/ui/Modal'
import SupportScheduler, { DEFAULT_SUPPORT_SCHEDULE, weekdayLabel } from '../components/package/SupportScheduler'
import WeeklyAvailability from '../components/package/WeeklyAvailability'
import AvailabilityView from '../components/package/AvailabilityView'
import FormField from '../components/ui/FormField'
import PhotoUpload from '../components/ui/PhotoUpload'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { countAvailabilitySlots } from '../services/availability'
import { User, Bell, Shield, CreditCard, LogOut, Edit, CalendarClock, CalendarRange, Dumbbell, Apple, ClipboardList, ChevronRight } from 'lucide-react'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek', other: 'Belirtilmedi' }

export default function ProfilePage() {
  const {
    user, membership, membershipStatus, settings, packageConfig, supportSchedule, myPrograms, staff,
    updateProfile, updateSettings, saveSupportSchedule, logout, cancelMembership,
  } = useApp()
  const assignedCoach = (staff || []).find((s) => s.id === user.assignedCoachId)
  const assignedDietitian = (staff || []).find((s) => s.id === user.assignedDietitianId)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [form, setForm] = useState({
    name: user.name, email: user.email, city: user.city,
    weight: user.weight || '', height: user.height || '', waist: user.waist || '',
    gender: user.gender || '', photo: user.photo || null,
  })
  const [scheduleForm, setScheduleForm] = useState({ ...DEFAULT_SUPPORT_SCHEDULE, ...(supportSchedule || {}) })
  const [availabilityForm, setAvailabilityForm] = useState(user.availability || {})

  const hasSupport =
    (Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 ||
    (Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0

  const handleSave = () => {
    updateProfile(form)
    setEditOpen(false)
    toast('Profil güncellendi', 'success')
  }

  const openSchedule = () => {
    setScheduleForm({ ...DEFAULT_SUPPORT_SCHEDULE, ...(supportSchedule || {}) })
    setScheduleOpen(true)
  }

  const handleScheduleSave = () => {
    saveSupportSchedule(scheduleForm)
    setScheduleOpen(false)
    toast('Destek tarihleriniz güncellendi', 'success')
  }

  const openAvailability = () => {
    setAvailabilityForm(user.availability || {})
    setAvailabilityOpen(true)
  }

  const handleAvailabilitySave = () => {
    updateProfile({ availability: availabilityForm })
    setAvailabilityOpen(false)
    toast('Müsaitlik bilgileriniz güncellendi', 'success')
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
        { icon: CreditCard, title: 'Abonelik', items: [['Plan', membership === 'premium' ? 'Premium' : 'Ücretsiz'], ['Durum', membershipStatus]] },
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

      {membership === 'premium' && hasSupport && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-brand-500" />
              <h2 className="font-semibold text-cream-900">Destek Tarihleri</h2>
            </div>
            <button type="button" onClick={openSchedule} className="flex items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-1.5 text-xs font-medium hover:bg-cream-50">
              <Edit className="h-3.5 w-3.5" /> Düzenle
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {(Number(packageConfig?.coachMeetingsPerWeek) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Dumbbell className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">Koç Görüşmeleri</p>
                  <p className="text-xs text-cream-800/60">
                    Haftada {packageConfig.coachMeetingsPerWeek} görüşme
                    {assignedCoach ? ` · ${assignedCoach.name}` : ' · uzman atanıyor'}
                  </p>
                </div>
                <span className="text-sm font-medium text-cream-900">
                  {supportSchedule ? `${weekdayLabel(supportSchedule.coachDay)} · ${supportSchedule.coachTime}` : 'Seçilmedi'}
                </span>
              </div>
            )}
            {(Number(packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <Apple className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">Diyetisyen Görüşmeleri</p>
                  <p className="text-xs text-cream-800/60">
                    Ayda {packageConfig.dietitianMeetingsPerMonth} görüşme
                    {assignedDietitian ? ` · ${assignedDietitian.name}` : ' · uzman atanıyor'}
                  </p>
                </div>
                <span className="text-sm font-medium text-cream-900">
                  {supportSchedule ? `${weekdayLabel(supportSchedule.dietitianDay)} · ${supportSchedule.dietitianTime}` : 'Seçilmedi'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {membership === 'premium' && hasSupport && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-brand-500" />
              <h2 className="font-semibold text-cream-900">Haftalık Müsaitlik</h2>
            </div>
            <button type="button" onClick={openAvailability} className="flex items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-1.5 text-xs font-medium hover:bg-cream-50">
              <Edit className="h-3.5 w-3.5" /> Düzenle
            </button>
          </div>
          <p className="mt-1 text-xs text-cream-800/55">Koçunuz ve diyetisyeniniz bu saatleri görerek görüşmelerinizi planlar.</p>
          <div className="mt-4">
            <AvailabilityView value={user.availability} emptyText="Henüz müsait saat eklemediniz. Düzenle’ye dokunarak ekleyin." />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setCancelOpen(true)} className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
          Üyeliği İptal Et
        </button>
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

      <Modal open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} title="Haftalık Müsaitlik" size="lg">
        <WeeklyAvailability value={availabilityForm} onChange={setAvailabilityForm} />
        <button type="button" onClick={handleAvailabilitySave} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">
          Kaydet ({countAvailabilitySlots(availabilityForm)} saat)
        </button>
      </Modal>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Destek Tarihlerini Düzenle" size="md">
        <SupportScheduler
          schedule={scheduleForm}
          packageConfig={packageConfig}
          onChange={setScheduleForm}
        />
        <button type="button" onClick={handleScheduleSave} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">
          Kaydet
        </button>
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Üyelik İptali">
        <p className="text-sm text-cream-800/70">İptal işlemi demo modundadır. Gerçek iptal için destek ile iletişime geçin.</p>
        <button type="button" onClick={() => { cancelMembership(); setCancelOpen(false); toast('Üyelik iptal edildi', 'info') }} className="mt-4 w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white">
          İptali Onayla
        </button>
      </Modal>
    </div>
  )
}
