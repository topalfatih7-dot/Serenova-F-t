import { useMemo, useState } from 'react'
import {
  Check, X, UserPlus, Dumbbell, Apple, ChevronDown, ChevronUp, Copy,
  Building2, Mail, MessageSquare,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { staffRoleLabel } from '../../utils/staffRoles'

const SECTIONS = [
  { id: 'staff', label: 'Kadro', icon: UserPlus },
  { id: 'corporate', label: 'Kurumsal', icon: Building2 },
  { id: 'contact', label: 'İletişim', icon: Mail },
]

const STAFF_STATUS = {
  pending: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Onaylandı', style: 'bg-sage-50 text-sage-700' },
  rejected: { label: 'Reddedildi', style: 'bg-red-50 text-red-600' },
}

const CORP_STATUS = {
  pending: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700' },
  contacted: { label: 'İletişimde', style: 'bg-brand-50 text-brand-700' },
  approved: { label: 'Onaylandı', style: 'bg-sage-50 text-sage-700' },
  rejected: { label: 'Reddedildi', style: 'bg-red-50 text-red-600' },
}

const CONTACT_STATUS = {
  new: { label: 'Yeni', style: 'bg-amber-50 text-amber-700' },
  read: { label: 'Okundu', style: 'bg-brand-50 text-brand-700' },
  resolved: { label: 'Çözüldü', style: 'bg-sage-50 text-sage-700' },
}

export default function AdminApplicationsPage() {
  const {
    staffApplications, corporateApplications, contactInquiries,
    resolveStaffApplication, resolveCorporateApplication, updateContactInquiryStatus,
  } = useApp()
  const { toast } = useToast()
  const [section, setSection] = useState('staff')
  const [filter, setFilter] = useState('pending')
  const [busy, setBusy] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [approvedCreds, setApprovedCreds] = useState(null)

  const pendingStaff = (staffApplications || []).filter((a) => a.status === 'pending').length
  const pendingCorp = (corporateApplications || []).filter((a) => a.status === 'pending').length
  const newContact = (contactInquiries || []).filter((a) => a.status === 'new').length

  const staffFiltered = useMemo(
    () => (staffApplications || []).filter((a) => filter === 'all' || a.status === filter),
    [staffApplications, filter],
  )
  const corpFiltered = useMemo(
    () => (corporateApplications || []).filter((a) => filter === 'all' || a.status === filter),
    [corporateApplications, filter],
  )
  const contactFiltered = useMemo(
    () => (contactInquiries || []).filter((a) => filter === 'all' || a.status === filter),
    [contactInquiries, filter],
  )

  const filterOptions = section === 'contact'
    ? [['new', 'Yeni'], ['read', 'Okundu'], ['resolved', 'Çözüldü'], ['all', 'Tümü']]
    : [['pending', 'Bekleyen'], ['approved', section === 'corporate' ? 'Onaylanan' : 'Onaylanan'], ['rejected', 'Reddedilen'], ['all', 'Tümü']]

  const approveStaff = async (app) => {
    setBusy(app.id)
    try {
      const r = await resolveStaffApplication(app, true)
      if (!r.success) { toast(r.error || 'Onaylanamadı', 'error'); return }
      toast('Personel hesabı oluşturuldu', 'success')
      if (r.tempPassword) setApprovedCreds({ email: app.email, name: app.name, password: r.tempPassword })
    } finally { setBusy(null) }
  }

  const rejectStaff = async () => {
    if (!rejectTarget) return
    setBusy(rejectTarget.id)
    try {
      const r = await resolveStaffApplication(rejectTarget, false, rejectNote)
      if (!r.success) { toast(r.error, 'error'); return }
      toast('Reddedildi', 'info')
      setRejectTarget(null)
      setRejectNote('')
    } finally { setBusy(null) }
  }

  const setCorpStatus = async (app, status) => {
    setBusy(app.id)
    try {
      const r = await resolveCorporateApplication(app, status)
      if (!r.success) toast(r.error, 'error')
      else toast('Güncellendi', 'success')
    } finally { setBusy(null) }
  }

  const setContactStatus = async (inq, status) => {
    setBusy(inq.id)
    try {
      const r = await updateContactInquiryStatus(inq, status)
      if (!r.success) toast(r.error, 'error')
      else toast('Durum güncellendi', 'success')
    } finally { setBusy(null) }
  }

  const copyCreds = () => {
    if (!approvedCreds) return
    navigator.clipboard.writeText(`E-posta: ${approvedCreds.email}\nGeçici şifre: ${approvedCreds.password}`)
    toast('Kopyalandı', 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Başvurular</h1>
        <p className="mt-1 text-sm text-cream-800/60">Kadro, kurumsal ve iletişim formları</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const badge = s.id === 'staff' ? pendingStaff : s.id === 'corporate' ? pendingCorp : newContact
          return (
            <button key={s.id} type="button" onClick={() => { setSection(s.id); setFilter(s.id === 'contact' ? 'new' : 'pending'); setExpanded(null) }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${section === s.id ? 'bg-cream-900 text-white' : 'bg-cream-100 text-cream-800 hover:bg-cream-200'}`}>
              <Icon className="h-4 w-4" /> {s.label}
              {badge > 0 && <span className={`rounded-full px-1.5 text-xs ${section === s.id ? 'bg-white/20' : 'bg-amber-200 text-amber-800'}`}>{badge}</span>}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === id ? 'bg-brand-500 text-white' : 'bg-white text-cream-800 ring-1 ring-cream-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {section === 'staff' && (
        staffFiltered.length === 0 ? (
          <EmptyState icon={UserPlus} title="Kadro başvurusu yok" description="Navbar → Kadromuz → Kadromuza Katıl" />
        ) : (
          <div className="space-y-3">
            {staffFiltered.map((app) => {
              const st = STAFF_STATUS[app.status] || STAFF_STATUS.pending
              const RoleIcon = app.role === 'dietitian' ? Apple : Dumbbell
              const open = expanded === app.id
              const d = app.data || {}
              return (
                <div key={app.id} className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${app.role === 'dietitian' ? 'bg-sage-50 text-sage-600' : 'bg-brand-50 text-brand-600'}`}><RoleIcon className="h-5 w-5" /></span>
                      <div>
                        <p className="font-semibold text-cream-900">{app.name} · {staffRoleLabel(app.role)}</p>
                        <p className="text-xs text-cream-800/55">{app.email} · {new Date(app.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.style}`}>{st.label}</span>
                      <button type="button" onClick={() => setExpanded(open ? null : app.id)} className="rounded-lg border border-cream-200 p-2">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                      {app.status === 'pending' && (
                        <>
                          <button type="button" disabled={busy === app.id} onClick={() => approveStaff(app)} className="flex items-center gap-1 rounded-lg bg-sage-500 px-3 py-2 text-xs font-semibold text-white"><Check className="h-4 w-4" /> Onayla</button>
                          <button type="button" disabled={busy === app.id} onClick={() => setRejectTarget(app)} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"><X className="h-4 w-4" /> Reddet</button>
                        </>
                      )}
                    </div>
                  </div>
                  {open && <div className="border-t border-cream-100 bg-cream-50/50 px-4 py-4 text-sm"><p>{d.bio}</p><p className="mt-2 text-cream-800/60">{(d.specialties || []).join(', ')}</p></div>}
                </div>
              )
            })}
          </div>
        )
      )}

      {section === 'corporate' && (
        corpFiltered.length === 0 ? (
          <EmptyState icon={Building2} title="Kurumsal başvuru yok" description="Navbar → Kurumsal → Kurumsal Başvuru" />
        ) : (
          <div className="space-y-3">
            {corpFiltered.map((app) => {
              const st = CORP_STATUS[app.status] || CORP_STATUS.pending
              const d = app.data || {}
              return (
                <div key={app.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cream-900">{app.companyName}</p>
                      <p className="text-sm text-cream-800/65">{app.contactName} · {app.email} · {app.phone}</p>
                      <p className="mt-1 text-xs text-cream-800/45">{d.city} · {d.industry} · {d.employeeRange} çalışan</p>
                      <p className="mt-2 text-sm text-cream-800/70">{d.message}</p>
                      <p className="mt-1 text-xs text-brand-600">{(d.services || []).join(' · ')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.style}`}>{st.label}</span>
                      {app.status === 'pending' && (
                        <div className="flex gap-1">
                          <button type="button" disabled={busy === app.id} onClick={() => setCorpStatus(app, 'contacted')} className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">İletişimde</button>
                          <button type="button" disabled={busy === app.id} onClick={() => setCorpStatus(app, 'approved')} className="rounded-lg bg-sage-500 px-2 py-1 text-xs font-semibold text-white">Onayla</button>
                          <button type="button" disabled={busy === app.id} onClick={() => setCorpStatus(app, 'rejected')} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">Reddet</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {section === 'contact' && (
        contactFiltered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="İletişim mesajı yok" description="Ana sayfa Bize Ulaşın formu" />
        ) : (
          <div className="space-y-3">
            {contactFiltered.map((inq) => {
              const st = CONTACT_STATUS[inq.status] || CONTACT_STATUS.new
              return (
                <div key={inq.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cream-900">{inq.name}</p>
                      <p className="text-xs text-cream-800/55">{inq.email} · {inq.phone || '—'} · {inq.subject}</p>
                      <p className="mt-2 text-sm text-cream-800/70">{inq.message}</p>
                      <p className="mt-1 text-xs text-cream-800/40">{new Date(inq.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.style}`}>{st.label}</span>
                      <div className="flex gap-1">
                        {inq.status === 'new' && <button type="button" disabled={busy === inq.id} onClick={() => setContactStatus(inq, 'read')} className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Okundu</button>}
                        {inq.status !== 'resolved' && <button type="button" disabled={busy === inq.id} onClick={() => setContactStatus(inq, 'resolved')} className="rounded-lg bg-sage-500 px-2 py-1 text-xs font-semibold text-white">Çözüldü</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Başvuruyu Reddet">
        <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Gerekçe (opsiyonel)" className="w-full rounded-xl border border-cream-200 px-3 py-2 text-sm" />
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setRejectTarget(null)} className="flex-1 rounded-xl border py-2.5 text-sm">Vazgeç</button>
          <button type="button" onClick={rejectStaff} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white">Reddet</button>
        </div>
      </Modal>

      <Modal open={!!approvedCreds} onClose={() => setApprovedCreds(null)} title="Personel Hesabı">
        <div className="rounded-xl bg-sage-50 p-4 text-sm">
          <p className="font-semibold">{approvedCreds?.name}</p>
          <p className="mt-2">E-posta: <strong>{approvedCreds?.email}</strong></p>
          <p className="mt-1">Geçici şifre: <strong>{approvedCreds?.password}</strong></p>
        </div>
        <button type="button" onClick={copyCreds} className="btn-wellness mt-4 w-full !py-3"><Copy className="h-4 w-4" /> Kopyala</button>
      </Modal>
    </div>
  )
}
