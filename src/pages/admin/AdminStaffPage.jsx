import { useState } from 'react'
import {
  Plus, Search, Mail, Phone, Clock, Trash2, Edit, Dumbbell, Apple, Stethoscope,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import PhotoUpload from '../../components/ui/PhotoUpload'
import { WEEKDAYS, weekdayLabel } from '../../components/package/SupportScheduler'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const EMPTY_FORM = {
  role: 'coach', name: '', email: '', phone: '', password: '',
  specialty: '', bio: '', photo: null, workDays: [1, 3, 5], workStart: '09:00', workEnd: '17:00',
}

function StaffFormModal({ open, onClose, onSubmit, initial, isEdit }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [error, setError] = useState('')

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const toggleDay = (d) => {
    const workDays = form.workDays.includes(d)
      ? form.workDays.filter((x) => x !== d)
      : [...form.workDays, d].sort((a, b) => a - b)
    update({ workDays })
  }

  const submit = () => {
    if (!form.name || !form.email.includes('@')) { setError('Ad ve geçerli e-posta gerekli.'); return }
    if (!isEdit && (!form.password || form.password.length < 6)) { setError('Şifre en az 6 karakter olmalı.'); return }
    if (form.workDays.length === 0) { setError('En az bir çalışma günü seçin.'); return }
    setError('')
    onSubmit(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Bilgileri Düzenle' : 'Yeni Koç / Diyetisyen Ekle'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'coach', label: 'Koç', icon: Dumbbell },
            { value: 'dietitian', label: 'Diyetisyen', icon: Apple },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => update({ role: r.value })}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${
                form.role === r.value ? 'border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'border-cream-200 text-cream-800'
              }`}
            >
              <r.icon className="h-4 w-4" /> {r.label}
            </button>
          ))}
        </div>

        <PhotoUpload
          value={form.photo}
          onChange={(photo) => update({ photo })}
          label="Profil Fotoğrafı"
          hint="Kadromuz bölümünde gösterilecek. Net, gülümseyen bir portre önerilir."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ad Soyad" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <input value={form.specialty} onChange={(e) => update({ specialty: e.target.value })} placeholder="Uzmanlık (ör. Güç antrenmanı)" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <input value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="E-posta" type="email" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="Telefon" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        </div>

        <textarea value={form.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="Kısa açıklama (kadromuz kartında görünür)" rows={3} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

        <input value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder={isEdit ? 'Şifre (değiştirmek için doldurun)' : 'Şifre (min. 6)'} type="password" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

        <div>
          <p className="mb-2 text-sm font-medium text-cream-800/80">Haftalık çalışma günleri</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  form.workDays.includes(d.value) ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-cream-800/70">Başlangıç saati</span>
            <input type="time" value={form.workStart} onChange={(e) => update({ workStart: e.target.value })} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-cream-800/70">Bitiş saati</span>
            <input type="time" value={form.workEnd} onChange={(e) => update({ workEnd: e.target.value })} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm" />
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="button" onClick={submit} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          {isEdit ? 'Değişiklikleri Kaydet' : 'Kaydet'}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminStaffPage() {
  const { staff, addStaff, editStaff, removeStaff } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || s.role === filterRole
    return matchSearch && matchRole
  })

  const handleAdd = (form) => {
    const result = addStaff(form)
    if (!result.success) { toast(result.error, 'error'); return }
    setAddOpen(false)
    toast('Kayıt oluşturuldu', 'success')
  }

  const handleEdit = (form) => {
    const patch = { ...form }
    if (!patch.password) delete patch.password
    editStaff(editTarget.id, patch)
    setEditTarget(null)
    toast('Bilgiler güncellendi', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Kadromuz · Koç & Diyetisyen</h1>
          <p className="mt-1 text-sm text-cream-800/60">{staff.length} kayıtlı uzman · ana sayfadaki “Kadromuz” bölümünde görünür</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> Yeni Ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm">
          <option value="all">Tüm roller</option>
          <option value="coach">Koç</option>
          <option value="dietitian">Diyetisyen</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Henüz uzman eklenmedi"
          description="Koç veya diyetisyen ekleyerek danışan takibi ve program oluşturmayı başlatın."
          action={<button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Yeni Ekle</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const isCoach = s.role === 'coach'
            const RoleIcon = isCoach ? Dumbbell : Apple
            return (
              <div key={s.id} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="h-11 w-11 rounded-xl object-cover" />
                    ) : (
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isCoach ? 'bg-brand-100 text-brand-600' : 'bg-sage-100 text-sage-600'}`}>
                        <RoleIcon className="h-5 w-5" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-cream-900">{s.name}</p>
                      <span className={`text-xs font-medium ${isCoach ? 'text-brand-600' : 'text-sage-600'}`}>
                        {isCoach ? 'Koç' : 'Diyetisyen'}{s.specialty ? ` · ${s.specialty}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditTarget(s)} className="rounded-lg p-1.5 text-cream-800/50 hover:bg-cream-100" aria-label="Düzenle">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {s.bio && <p className="mt-3 text-sm leading-relaxed text-cream-800/65">{s.bio}</p>}
                <div className="mt-4 space-y-2 text-sm text-cream-800/70">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-cream-800/40" /> {s.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-cream-800/40" /> {s.phone || '—'}</p>
                  <p className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cream-800/40" />
                    <span>
                      {s.workDays?.length ? s.workDays.map(weekdayLabel).join(', ') : '—'}
                      <span className="block text-xs text-cream-800/50">{s.workStart} – {s.workEnd}</span>
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {addOpen && (
        <StaffFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
      )}
      {editTarget && (
        <StaffFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={{ ...editTarget, password: '' }}
          isEdit
        />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Kaydı Sil">
        <p className="text-sm text-cream-800/70">
          <strong>{deleteTarget?.name}</strong> kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
          <button
            type="button"
            onClick={() => { removeStaff(deleteTarget.id); setDeleteTarget(null); toast('Kayıt silindi', 'info') }}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white"
          >
            Sil
          </button>
        </div>
      </Modal>
    </div>
  )
}
