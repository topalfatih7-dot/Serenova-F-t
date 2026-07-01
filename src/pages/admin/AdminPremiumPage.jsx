import { useMemo, useState, useEffect } from 'react'
import {
  Crown, Search, Dumbbell, Apple, Calendar, Clock,
  UserCheck, ChevronRight, AlertTriangle, Package, Stethoscope,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ManualSessionEditor from '../../components/admin/ManualSessionEditor'
import {
  isPaidMembership, PAID_MEMBERSHIPS, packageIncludesCoach, packageIncludesDietitian, packageIncludesDoctor,
  memberNeedsStaffAssignment, PLAN_IDS, PLAN_LABELS, DURATION_OPTIONS, getDefaultPackageForPlan,
} from '../../data/membershipPlans'
import { enrichMemberPremium, getRemainingDays, getDurationMonths } from '../../services/premiumMembership'
import { countStaffClients } from '../../services/staffAssignment'
import { isOneTimePlan, isPackageEntryActive } from '../../utils/memberPackages'
import { fetchMemberSessions } from '../../services/supabaseDb'

const STATUS_STYLES = {
  active: 'bg-sage-50 text-sage-700 ring-sage-200',
  expiring: 'bg-orange-50 text-orange-700 ring-orange-200',
}

const STATUS_LABELS = {
  active: 'Aktif',
  expiring: 'Sona Eriyor',
}

function PremiumMemberCard({ member, staffName, onEdit }) {
  const info = enrichMemberPremium(member)
  const showCoach = packageIncludesCoach(member.packageConfig)
  const showDiet = packageIncludesDietitian(member.packageConfig)
  const showDoctor = packageIncludesDoctor(member.packageConfig)
  const missingCoach = showCoach && !member.assignedCoachId
  const missingDiet = showDiet && !member.assignedDietitianId
  const missingDoctor = showDoctor && !member.assignedDoctorId
  const staffCols = [showCoach, showDiet, showDoctor].filter(Boolean).length

  return (
    <button
      type="button"
      onClick={() => onEdit(member)}
      className="group w-full rounded-2xl border border-cream-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-sm font-bold text-brand-700">
          {member.name?.charAt(0)?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-cream-900">{member.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_STYLES[member.membershipStatus] || STATUS_STYLES.active}`}>
              {STATUS_LABELS[member.membershipStatus] || member.membershipStatus}
            </span>
          </div>
          <p className="truncate text-xs text-cream-800/50">{member.email}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cream-300 group-hover:text-brand-400" />
      </div>

      <div className={`mt-4 grid gap-2 ${staffCols === 0 ? 'grid-cols-2' : staffCols === 1 ? 'grid-cols-3' : staffCols === 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5'}`}>
        <div className="rounded-xl bg-cream-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Kalan</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-cream-900">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            {info.premiumRemainingDays != null ? `${info.premiumRemainingDays} gün` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-cream-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Süre</p>
          <p className="mt-0.5 text-sm font-bold text-cream-900">{getDurationMonths(member.packageConfig)} ay</p>
        </div>
        {showCoach && (
          <div className="rounded-xl bg-cream-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Koç</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-cream-900">
              <Dumbbell className={`h-3.5 w-3.5 shrink-0 ${missingCoach ? 'text-amber-500' : 'text-brand-500'}`} />
              {staffName(member.assignedCoachId)}
            </p>
          </div>
        )}
        {showDiet && (
          <div className="rounded-xl bg-cream-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Diyetisyen</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-cream-900">
              <Apple className={`h-3.5 w-3.5 shrink-0 ${missingDiet ? 'text-amber-500' : 'text-sage-500'}`} />
              {staffName(member.assignedDietitianId)}
            </p>
          </div>
        )}
        {showDoctor && (
          <div className="rounded-xl bg-cream-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Doktor</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-cream-900">
              <Stethoscope className={`h-3.5 w-3.5 shrink-0 ${missingDoctor ? 'text-amber-500' : 'text-teal-600'}`} />
              {staffName(member.assignedDoctorId)}
            </p>
          </div>
        )}
      </div>

      {(missingCoach || missingDiet || missingDoctor || info.premiumExpiringSoon) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {info.premiumExpiringSoon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
              <AlertTriangle className="h-3 w-3" /> Süre bitiyor
            </span>
          )}
          {missingCoach && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              Koç atanmadı
            </span>
          )}
          {missingDiet && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              Diyetisyen atanmadı
            </span>
          )}
          {missingDoctor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              Doktor atanmadı
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function EditPremiumModal({ member, staff, members, onClose, onSave, busy }) {
  const coaches = staff.filter((s) => s.role === 'coach' && s.active !== false)
  const dietitians = staff.filter((s) => s.role === 'dietitian' && s.active !== false)
  const doctors = staff.filter((s) => s.role === 'doctor' && s.active !== false)

  const [membership, setMembership] = useState(member?.membership || 'free')
  const [addPackage, setAddPackage] = useState(false)
  const [durationMonths, setDurationMonths] = useState(() => getDurationMonths(member?.packageConfig))
  const [remainingDaysInput, setRemainingDaysInput] = useState(() => {
    const r = getRemainingDays(member?.premiumExpiresAt)
    return r != null ? String(r) : ''
  })
  const [extendDays, setExtendDays] = useState('')
  const [coachId, setCoachId] = useState(member?.assignedCoachId || '')
  const [dietitianId, setDietitianId] = useState(member?.assignedDietitianId || '')
  const [doctorId, setDoctorId] = useState(member?.assignedDoctorId || '')
  const [coachSessions, setCoachSessions] = useState([])
  const [dietitianSessions, setDietitianSessions] = useState([])
  const [doctorSessions, setDoctorSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    if (!member?.id) return undefined
    let active = true
    setSessionsLoading(true)
    fetchMemberSessions(member.id)
      .then((sessions) => {
        if (!active) return
        setCoachSessions(sessions.coachSessions)
        setDietitianSessions(sessions.dietitianSessions)
        setDoctorSessions(sessions.doctorSessions)
      })
      .finally(() => {
        if (active) setSessionsLoading(false)
      })
    return () => { active = false }
  }, [member?.id])

  if (!member) return null

  const previewPackage = getDefaultPackageForPlan(membership, durationMonths)
  const showCoach = packageIncludesCoach(previewPackage)
  const showDiet = packageIncludesDietitian(previewPackage)
  const showDoctor = packageIncludesDoctor(previewPackage) || membership === 'doktor'
  const assignmentTitle = [showCoach && 'Koç', showDiet && 'Diyetisyen', showDoctor && 'Doktor'].filter(Boolean).join(' & ') || null

  const remaining = getRemainingDays(member.premiumExpiresAt)
  const info = enrichMemberPremium(member)
  const coachName = coaches.find((s) => s.id === coachId)?.name || ''
  const dietitianName = dietitians.find((s) => s.id === dietitianId)?.name || ''
  const doctorName = doctors.find((s) => s.id === doctorId)?.name || ''
  const planChanged = membership !== member.membership

  const submit = () => {
    const payload = {
      assignedCoachId: showCoach ? (coachId || null) : null,
      assignedDietitianId: showDiet ? (dietitianId || null) : null,
      assignedDoctorId: showDoctor ? (doctorId || null) : null,
      coachSessions: showCoach ? coachSessions.map((s) => ({ ...s, coach: coachName || s.coach })) : [],
      dietitianSessions: showDiet ? dietitianSessions.map((s) => ({ ...s, coach: dietitianName || s.coach })) : [],
      doctorSessions: showDoctor ? doctorSessions : [],
    }

    if (planChanged || addPackage) {
      payload.membership = membership
      payload.durationMonths = durationMonths
      if (addPackage) payload.addPackage = true
    } else if (durationMonths !== getDurationMonths(member.packageConfig)) {
      payload.durationMonths = durationMonths
    }

    const extend = Number(extendDays)
    if (extendDays !== '' && !Number.isNaN(extend) && extend !== 0) {
      payload.extendDays = extend
    } else if (remainingDaysInput !== '' && remainingDaysInput !== String(remaining ?? '')) {
      const days = Number(remainingDaysInput)
      if (!Number.isNaN(days) && days >= 0) payload.setRemainingDays = days
    }

    onSave(payload)
  }

  return (
    <Modal open={!!member} onClose={onClose} title="Premium Yönetimi" size="lg">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
          <p className="font-display text-lg font-bold">{member.name}</p>
          <p className="text-sm text-white/80">{member.email}</p>
          {(member.activePackages || []).filter((p) => isPackageEntryActive(p)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(member.activePackages || []).filter((p) => isPackageEntryActive(p)).map((p) => (
                <span key={p.id} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold">
                  {PLAN_LABELS[p.planId] || p.planId}
                  {isOneTimePlan(p.planId) ? ' · tek sefer' : p.expiresAt ? ` · ${p.expiresAt}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Paket & süre */}
        <section className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
            <Package className="h-4 w-4 text-brand-500" /> Paket & Süre
          </p>
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-cream-800">
            <input
              type="checkbox"
              checked={addPackage}
              onChange={(e) => setAddPackage(e.target.checked)}
              className="rounded border-cream-300 text-brand-500"
            />
            Mevcut paketlere ekle (çoklu paket — eskisi kalır)
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-cream-800/55">Üyelik paketi</span>
              <select
                value={membership}
                onChange={(e) => setMembership(e.target.value)}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              >
                {PLAN_IDS.map((id) => (
                  <option key={id} value={id}>{PLAN_LABELS[id] || id}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-cream-800/55">Paket süresi</span>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                disabled={!isPaidMembership(membership) || membership === 'doktor'}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm disabled:opacity-50"
              >
                {membership === 'doktor' ? (
                  <option value={0}>Tek seferlik</option>
                ) : DURATION_OPTIONS.map((o) => (
                  <option key={o.months} value={o.months}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-cream-800/55">Kalan gün (manuel)</span>
              <input
                type="number"
                min={0}
                value={remainingDaysInput}
                onChange={(e) => setRemainingDaysInput(e.target.value)}
                disabled={!isPaidMembership(membership)}
                placeholder="Örn. 30"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-cream-800/55">Süre uzat (+ gün)</span>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                disabled={!isPaidMembership(membership)}
                placeholder="Örn. 7"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm disabled:opacity-50"
              />
            </label>
          </div>
          {(planChanged || addPackage) && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {addPackage
                ? 'Yeni paket mevcut haklara eklenir; birleşik erişim uygulanır.'
                : 'Paket değişince abonelik paketleri yenilenir; tek seferlik doktor paketleri korunur.'}
            </p>
          )}
        </section>

        {/* Süre özeti */}
        <section className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
            <Calendar className="h-4 w-4 text-brand-500" /> Mevcut Premium Süresi
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-cream-200">
              <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Kalan gün</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-brand-600">
                <Clock className="h-4 w-4" />
                {remaining != null ? `${remaining} gün` : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-cream-200">
              <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Paket süresi</p>
              <p className="mt-1 text-lg font-bold text-cream-900">{getDurationMonths(member.packageConfig)} ay</p>
            </div>
            <div className="col-span-2 rounded-xl bg-white px-3 py-2.5 ring-1 ring-cream-200 sm:col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Bitiş tarihi</p>
              <p className="mt-1 text-sm font-semibold text-cream-900">{member.premiumExpiresAt || 'Belirlenmedi'}</p>
            </div>
          </div>
          {info.premiumExpiringSoon && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-orange-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Üyelik 7 gün içinde sona erecek
            </p>
          )}
        </section>

        {/* Atamalar — yalnızca pakette olan roller */}
        {assignmentTitle && (
          <section className="rounded-2xl border border-cream-200 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
              <UserCheck className="h-4 w-4 text-brand-500" /> {assignmentTitle}
            </p>
            <div className="space-y-3">
              {showCoach && (
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs text-cream-800/55"><Dumbbell className="h-3 w-3" /> Koç</span>
                  <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm">
                    <option value="">— Atanmadı —</option>
                    {coaches.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {countStaffClients(members, s.id, 'coach')} üye
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showDiet && (
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs text-cream-800/55"><Apple className="h-3 w-3" /> Diyetisyen</span>
                  <select value={dietitianId} onChange={(e) => setDietitianId(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm">
                    <option value="">— Atanmadı —</option>
                    {dietitians.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {countStaffClients(members, s.id, 'dietitian')} üye
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showDoctor && (
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs text-cream-800/55"><Stethoscope className="h-3 w-3" /> Doktor</span>
                  <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm">
                    <option value="">— Atanmadı —</option>
                    {doctors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>
        )}

        {/* Manuel randevular */}
        {sessionsLoading ? (
          <p className="text-sm text-cream-800/50">Randevular yükleniyor…</p>
        ) : (
          <ManualSessionEditor
            member={{ ...member, membership, packageConfig: previewPackage }}
            coachName={coachName}
            dietitianName={dietitianName}
            doctorName={doctorName}
            coachSessions={coachSessions}
            dietitianSessions={dietitianSessions}
            doctorSessions={doctorSessions}
            onCoachChange={setCoachSessions}
            onDietitianChange={setDietitianSessions}
            onDoctorChange={setDoctorSessions}
          />
        )}

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cream-900 py-3 text-sm font-semibold text-white hover:bg-cream-800 disabled:opacity-50"
        >
          Premium Ayarlarını Kaydet
        </button>
      </div>
    </Modal>
  )
}

export default function AdminPremiumPage() {
  const { platform, adminUpdatePremium } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)

  const staff = platform.staff || []
  const members = platform.members || []
  const staffName = (id) => staff.find((s) => s.id === id)?.name || 'Atanmadı'

  const premiumMembers = useMemo(() => {
    return members
      .filter((m) => isPaidMembership(m.membership))
      .filter((m) => {
        const q = search.toLowerCase()
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        if (!matchSearch) return false
        if (filter === 'unassigned') {
          return memberNeedsStaffAssignment(m)
        }
        if (filter === 'expiring') {
          const r = getRemainingDays(m.premiumExpiresAt)
          return r != null && r > 0 && r <= 7
        }
        if (filter === 'active') return m.membershipStatus === 'active'
        return true
      })
      .sort((a, b) => {
        const ra = getRemainingDays(a.premiumExpiresAt) ?? 9999
        const rb = getRemainingDays(b.premiumExpiresAt) ?? 9999
        return ra - rb
      })
  }, [members, search, filter])

  const stats = useMemo(() => {
    const paidPlans = PAID_MEMBERSHIPS
    return {
      total: members.filter((m) => paidPlans.includes(m.membership)).length,
      unassigned: members.filter((m) => paidPlans.includes(m.membership) && memberNeedsStaffAssignment(m)).length,
      expiring: members.filter((m) => {
        const r = getRemainingDays(m.premiumExpiresAt)
        return paidPlans.includes(m.membership) && r != null && r > 0 && r <= 7
      }).length,
    }
  }, [members])

  const handleSave = async (options) => {
    if (!selected) return
    setBusy(true)
    try {
      const r = await adminUpdatePremium(selected.id, options)
      if (r.success) {
        toast('Premium ayarları kaydedildi', 'success')
        setSelected(null)
      } else {
        toast(r.error || 'Kaydedilemedi', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-cream-900 via-cream-800 to-brand-900 p-5 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Crown className="h-6 w-6 text-amber-300" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Premium Yönetimi</h1>
            <p className="mt-1 text-sm text-white/70">Paket, süre ve koç/diyetisyen atamalarını yönetin</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Premium', value: stats.total },
            { label: 'Atama Eksik', value: stats.unassigned },
            { label: 'Sona Eriyor', value: stats.expiring },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-2.5 text-center backdrop-blur sm:px-4">
              <p className="text-lg font-bold sm:text-xl">{s.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/60 sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="Üye ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm"
        >
          <option value="all">Tüm premium</option>
          <option value="active">Aktif</option>
          <option value="unassigned">Atama eksik</option>
          <option value="expiring">7 gün içinde biten</option>
        </select>
      </div>

      {premiumMembers.length === 0 ? (
        <EmptyState
          title="Premium üye yok"
          description="Premium üyelik satın alan veya atanan üyeler burada listelenir."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {premiumMembers.map((m) => (
            <PremiumMemberCard key={m.id} member={m} staffName={staffName} onEdit={setSelected} />
          ))}
        </div>
      )}

      <EditPremiumModal
        key={selected?.id}
        member={selected}
        staff={staff}
        members={members}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        busy={busy}
      />
    </div>
  )
}
