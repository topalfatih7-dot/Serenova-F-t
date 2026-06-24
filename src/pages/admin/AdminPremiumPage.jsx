import { useMemo, useState } from 'react'
import {
  Crown, Search, Dumbbell, Apple, Calendar, Clock,
  UserCheck, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ManualSessionEditor from '../../components/admin/ManualSessionEditor'
import { isPaidMembership, PAID_MEMBERSHIPS, getPlanLabel } from '../../data/membershipPlans'
import { enrichMemberPremium, getRemainingDays, getDurationMonths } from '../../services/premiumMembership'
import { countStaffClients } from '../../services/staffAssignment'

const STATUS_STYLES = {
  active: 'bg-sage-50 text-sage-700 ring-sage-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  cancelled: 'bg-red-50 text-red-600 ring-red-200',
  expiring: 'bg-orange-50 text-orange-700 ring-orange-200',
}

const STATUS_LABELS = {
  active: 'Aktif',
  paused: 'Duraklatıldı',
  cancelled: 'İptal',
  expiring: 'Sona Eriyor',
}

function PremiumMemberCard({ member, staffName, onEdit }) {
  const info = enrichMemberPremium(member)
  const missingCoach = !member.assignedCoachId && (Number(member.packageConfig?.coachMeetingsPerMonth) || Number(member.packageConfig?.coachMeetingsPerWeek) || 0) > 0
  const missingDiet = !member.assignedDietitianId && (member.packageConfig?.dietitianMeetingsPerMonth || 0) > 0

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

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        <div className="rounded-xl bg-cream-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Koç</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-cream-900">
            <Dumbbell className={`h-3.5 w-3.5 shrink-0 ${missingCoach ? 'text-amber-500' : 'text-brand-500'}`} />
            {staffName(member.assignedCoachId)}
          </p>
        </div>
        <div className="rounded-xl bg-cream-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cream-800/45">Diyetisyen</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-cream-900">
            <Apple className={`h-3.5 w-3.5 shrink-0 ${missingDiet ? 'text-amber-500' : 'text-sage-500'}`} />
            {staffName(member.assignedDietitianId)}
          </p>
        </div>
      </div>

      {(missingCoach || missingDiet || info.premiumExpiringSoon) && (
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
        </div>
      )}
    </button>
  )
}

function EditPremiumModal({ member, staff, members, onClose, onSave, busy }) {
  const coaches = staff.filter((s) => s.role === 'coach' && s.active !== false)
  const dietitians = staff.filter((s) => s.role === 'dietitian' && s.active !== false)

  const [coachId, setCoachId] = useState(member?.assignedCoachId || '')
  const [dietitianId, setDietitianId] = useState(member?.assignedDietitianId || '')
  const [coachSessions, setCoachSessions] = useState(member?.coachSessions || [])
  const [dietitianSessions, setDietitianSessions] = useState(member?.dietitianSessions || [])

  if (!member) return null

  const remaining = getRemainingDays(member.premiumExpiresAt)
  const info = enrichMemberPremium(member)
  const coachName = coaches.find((s) => s.id === coachId)?.name || ''
  const dietitianName = dietitians.find((s) => s.id === dietitianId)?.name || ''

  const submit = () => {
    onSave({
      assignedCoachId: coachId || null,
      assignedDietitianId: dietitianId || null,
      coachSessions: coachSessions.map((s) => ({ ...s, coach: coachName || s.coach })),
      dietitianSessions: dietitianSessions.map((s) => ({ ...s, coach: dietitianName || s.coach })),
    })
  }

  return (
    <Modal open={!!member} onClose={onClose} title="Premium Yönetimi" size="lg">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
          <p className="font-display text-lg font-bold">{member.name}</p>
          <p className="text-sm text-white/80">{member.email}</p>
        </div>

        {/* Süre — salt okunur */}
        <section className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
            <Calendar className="h-4 w-4 text-brand-500" /> Premium Süresi
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
          <p className="mt-2 text-xs text-cream-800/50">Kalan gün paket satın alımından otomatik hesaplanır; buradan değiştirilemez.</p>
        </section>

        {/* Atamalar */}
        <section className="rounded-2xl border border-cream-200 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
            <UserCheck className="h-4 w-4 text-brand-500" /> Koç & Diyetisyen
          </p>
          <div className="space-y-3">
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
          </div>
        </section>

        {/* Manuel randevular */}
        <ManualSessionEditor
          member={member}
          coachName={coachName}
          dietitianName={dietitianName}
          coachSessions={coachSessions}
          dietitianSessions={dietitianSessions}
          onCoachChange={setCoachSessions}
          onDietitianChange={setDietitianSessions}
        />

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cream-900 py-3 text-sm font-semibold text-white hover:bg-cream-800 disabled:opacity-50"
        >
          Atama ve Randevuları Kaydet
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
          return !m.assignedCoachId || !m.assignedDietitianId
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
      unassigned: members.filter((m) => paidPlans.includes(m.membership) && (!m.assignedCoachId || !m.assignedDietitianId)).length,
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
        toast('Atama kaydedildi', 'success')
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
            <p className="mt-1 text-sm text-white/70">Koç ve diyetisyen atamalarını yönetin</p>
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
