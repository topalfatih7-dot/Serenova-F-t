import { useMemo, useState } from 'react'
import {
  Check, X, UserPlus, Dumbbell, Apple, ChevronDown, ChevronUp, Copy,
  Building2, Mail, MessageSquare, ExternalLink, MapPin,
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
                  {open && (
                    <div className="border-t border-cream-100 bg-cream-50/50 px-4 py-4 text-sm">
                      <StaffApplicationDetail app={app} d={d} />
                    </div>
                  )}
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

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }
const EDU_LEVEL_LABELS = { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans' }

function DetailBlock({ title, children }) {
  if (!children) return null
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-cream-800/45">{title}</p>
      <div className="mt-1.5 text-cream-900">{children}</div>
    </div>
  )
}

function TagList({ items }) {
  if (!items?.length) return <span className="text-cream-800/45">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium ring-1 ring-cream-200">{item}</span>
      ))}
    </div>
  )
}

function StaffApplicationDetail({ app, d }) {
  const isCoach = app.role === 'coach'
  const location = [d.city, d.district].filter(Boolean).join(' / ')
  const gym = d.hasGym ? [d.gymName, d.gymCity, d.gymDistrict].filter(Boolean).join(' · ') : null
  const socials = [
    d.linkedin && ['LinkedIn', d.linkedin],
    d.instagram && ['Instagram', d.instagram],
    d.youtube && ['YouTube', d.youtube],
    d.website && ['Web', d.website],
  ].filter(Boolean)

  return (
    <div className="space-y-1">
      <DetailBlock title="İletişim">
        <p>{app.email} · {app.phone || '—'}</p>
        {d.gender && <p className="text-cream-800/65">Cinsiyet: {GENDER_LABELS[d.gender] || d.gender}</p>}
      </DetailBlock>

      {location && (
        <DetailBlock title="Konum">
          <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand-500" /> {location}</p>
        </DetailBlock>
      )}

      {gym && (
        <DetailBlock title="Salon">
          <p className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-amber-600" /> {gym}</p>
        </DetailBlock>
      )}

      {socials.length > 0 && (
        <DetailBlock title="Sosyal Medya">
          <ul className="space-y-1">
            {socials.map(([label, url]) => (
              <li key={label}>
                <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                  {label} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      <DetailBlock title="Uzmanlık Alanları">
        <TagList items={d.specialties} />
        {d.specialtyOther && <p className="mt-1 text-xs text-cream-800/60">Diğer: {d.specialtyOther}</p>}
        {d.experienceYears != null && <p className="mt-2 text-cream-800/65">{d.experienceYears} yıl deneyim</p>}
      </DetailBlock>

      {isCoach ? (
        <>
          <DetailBlock title="Yetkin Gruplar">
            <TagList items={d.competentGroups} />
            {d.competentGroupOther && <p className="mt-1 text-xs text-cream-800/60">Diğer: {d.competentGroupOther}</p>}
            {d.chronicDiseaseExamples && <p className="mt-2 text-xs text-cream-800/60">Kronik hastalık örnekleri: {d.chronicDiseaseExamples}</p>}
          </DetailBlock>
          <DetailBlock title="Eğitim">
            <p>
              {EDU_LEVEL_LABELS[d.educationLevel] || d.educationLevel || '—'}
              {d.educationDepartment ? ` · ${d.educationDepartment}` : ''}
              {d.educationGpa ? ` · GPA ${d.educationGpa}` : ''}
            </p>
          </DetailBlock>
          <DetailBlock title="Resmi Antrenörlük">
            <TagList items={d.officialCoachingCerts} />
          </DetailBlock>
          <DetailBlock title="Uluslararası Sertifikalar">
            <TagList items={d.internationalCerts} />
            {d.certOtherNotes?.international && <p className="mt-1 text-xs">Diğer: {d.certOtherNotes.international}</p>}
          </DetailBlock>
          <DetailBlock title="Branş Sertifikaları">
            <TagList items={d.branchCerts} />
            {d.certOtherNotes?.branch && <p className="mt-1 text-xs">Diğer: {d.certOtherNotes.branch}</p>}
          </DetailBlock>
          {(d.certificateFiles?.length > 0 || (d.certDocuments && Object.keys(d.certDocuments).length > 0)) && (
            <DetailBlock title="Yüklenen Belgeler">
              <ul className="space-y-1">
                {(d.certificateFiles || []).map((f, i) => (
                  <li key={f.url || i}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                      {f.name || `Belge ${i + 1}`} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
                {Object.entries(d.certDocuments || {}).map(([name, url]) => (
                  <li key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                      {name} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </DetailBlock>
          )}
          <DetailBlock title="Çalışma Yaklaşımları">
            <TagList items={d.workApproaches} />
            {d.workApproachOther && <p className="mt-1 text-xs">Diğer: {d.workApproachOther}</p>}
          </DetailBlock>
          <DetailBlock title="Hizmet Alanları">
            <TagList items={d.serviceAreas} />
            {d.serviceAreaOther && <p className="mt-1 text-xs">Diğer: {d.serviceAreaOther}</p>}
          </DetailBlock>
        </>
      ) : (
        <>
          {d.graduationDepartment && <DetailBlock title="Mezuniyet"><p>{d.graduationDepartment}</p></DetailBlock>}
          {d.licenseNumber && <DetailBlock title="Diploma / Oda No"><p>{d.licenseNumber}</p></DetailBlock>}
          {d.bio && <DetailBlock title="Tanıtım"><p className="text-cream-800/75">{d.bio}</p></DetailBlock>}
          {(d.education || []).length > 0 && (
            <DetailBlock title="Eğitim">
              <ul className="list-inside list-disc text-cream-800/75">
                {d.education.filter((e) => e.degree || e.school).map((e, i) => (
                  <li key={i}>{[e.degree, e.school, e.year].filter(Boolean).join(' · ')}</li>
                ))}
              </ul>
            </DetailBlock>
          )}
          {(d.certificates || []).length > 0 && (
            <DetailBlock title="Sertifikalar">
              <ul className="list-inside list-disc text-cream-800/75">
                {d.certificates.filter((c) => c.name).map((c, i) => (
                  <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(' · ')}</li>
                ))}
              </ul>
            </DetailBlock>
          )}
        </>
      )}
    </div>
  )
}
