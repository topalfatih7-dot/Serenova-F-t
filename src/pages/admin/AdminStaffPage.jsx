import { useState } from 'react'
import { Plus, Search, Mail, Phone, Trash2, Edit, Stethoscope, Award, Briefcase } from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import StaffFormModal from '../../components/admin/StaffFormModal'
import { normalizeStaffProfile } from '../../data/staffProfile'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

export default function AdminStaffPage() {
  const { staff, addStaff, editStaff, removeStaff } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = staff.filter((s) => {
    const p = normalizeStaffProfile(s)
    const q = search.toLowerCase()
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q) ||
      p.specialties.some((t) => t.toLowerCase().includes(q))
    const matchRole = filterRole === 'all' || s.role === filterRole
    return matchSearch && matchRole
  })

  const handleAdd = async (form) => {
    const result = await addStaff(form)
    if (result && !result.success) { toast(result.error, 'error'); return }
    setAddOpen(false)
    toast('Uzman profili oluşturuldu', 'success')
  }

  const handleEdit = async (form) => {
    const patch = { ...form }
    if (!patch.password) delete patch.password
    await editStaff(editTarget.id, patch)
    setEditTarget(null)
    toast('Profil güncellendi', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Kadromuz · Uzman Ekibi</h1>
          <p className="mt-1 text-sm text-cream-800/60">
            {staff.length} kayıtlı uzman · eğitim, sertifika ve deneyim bilgileri sitede yayınlanır
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> Yeni Uzman
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="İsim, e-posta veya uzmanlık ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm">
          <option value="all">Tüm roller</option>
          <option value="coach">Koç</option>
          <option value="dietitian">Diyetisyen</option>
          <option value="doctor">Doktor</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Henüz uzman eklenmedi"
          description="Koç, diyetisyen veya doktor ekleyerek detaylı kadro profillerini yayınlayın."
          action={<button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Yeni Uzman</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const p = normalizeStaffProfile(s)
            const meta = staffRoleMeta(s.role)
            const RoleIcon = meta.icon
            const roleColors = {
              coach: 'bg-brand-100 text-brand-600',
              dietitian: 'bg-sage-100 text-sage-600',
              doctor: 'bg-cream-200 text-cream-900',
            }
            return (
              <div key={s.id} className="flex flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${roleColors[s.role] || roleColors.coach}`}>
                        <RoleIcon className="h-5 w-5" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-cream-900">{p.name}</p>
                      <span className="text-xs font-medium text-cream-800/70">
                        {meta.label}{p.title ? ` · ${p.title}` : ''}
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

                {p.specialty && <p className="mt-2 text-sm font-medium text-brand-600">{p.specialty}</p>}
                {p.headline && <p className="mt-2 line-clamp-2 text-sm text-cream-800/65">{p.headline}</p>}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-cream-800/55">
                  {p.experienceYears > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5">
                      <Briefcase className="h-3 w-3" /> {p.experienceYears} yıl
                    </span>
                  )}
                  {p.education.length > 0 && <span className="rounded-full bg-cream-100 px-2 py-0.5">{p.education.length} eğitim</span>}
                  {p.certificates.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5">
                      <Award className="h-3 w-3" /> {p.certificates.length} sertifika
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-1.5 pt-4 text-sm text-cream-800/70">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-cream-800/40" /> {p.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-cream-800/40" /> {p.phone || '—'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {addOpen && <StaffFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />}
      {editTarget && (
        <StaffFormModal
          key={editTarget.id}
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
