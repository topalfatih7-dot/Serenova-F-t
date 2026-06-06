import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MembershipBadge from '../components/ui/MembershipBadge'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { User, Bell, Shield, CreditCard, LogOut, Edit } from 'lucide-react'

export default function ProfilePage() {
  const { user, membership, membershipStatus, settings, updateProfile, updateSettings, logout, cancelMembership } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [form, setForm] = useState({ name: user.name, email: user.email, city: user.city })

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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-cream-900">{user.name}</p>
            <p className="text-sm text-cream-800/60">{user.email}</p>
            <div className="mt-2">
              <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
            </div>
          </div>
        </div>
      </div>

      {[
        { icon: User, title: 'Kişisel Bilgiler', items: [['Ad', user.name], ['Yaş', user.age], ['Şehir', user.city]] },
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

      <div className="flex gap-3">
        <button type="button" onClick={() => setCancelOpen(true)} className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
          Üyeliği İptal Et
        </button>
        <button type="button" onClick={handleLogout} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 py-3 text-sm font-medium hover:bg-cream-50">
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Profili Düzenle">
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" placeholder="Ad Soyad" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" placeholder="E-posta" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" placeholder="Şehir" />
          <button type="button" onClick={handleSave} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">Kaydet</button>
        </div>
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
