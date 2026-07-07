import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Users, Activity, Target, CalendarClock,
  Mail, CalendarRange, UserRound, FileText, HeartPulse,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import NutritionProgramBuilder from '../../components/staff/NutritionProgramBuilder'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AvailabilityView from '../../components/package/AvailabilityView'
import MemberHealthInsights from '../../components/member/MemberHealthInsights'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { calculateBMI, bmiCategory, GOAL_LABELS, FITNESS_LABELS } from '../../services/health'
import { getStaffClients, getStaffAppointments } from './StaffOverviewPage'
import StaffAppointmentRow from '../../components/video/StaffAppointmentRow'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'
import {
  isCoachRole,
  isDietitianRole,
  sessionTypeForRole,
  staffRoleMeta,
} from '../../utils/staffRoles'

function ClientInfo({ member, role }) {
  const isCoach = isCoachRole(role)
  const sessionType = sessionTypeForRole(role)
  const bmi = calculateBMI(member.weight, member.height)
  const cat = bmiCategory(bmi)
  const appts = getStaffAppointments([member], role)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        {member.photo && (
          <img src={member.photo} alt={member.name} className="h-40 w-32 shrink-0 self-center rounded-2xl border border-cream-200 object-cover sm:self-start" />
        )}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Vücut Kitle İndeksi</p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-900">{bmi ?? '—'}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Ölçüler</p>
            <p className="mt-1 text-sm font-medium text-cream-900">{member.weight ? `${member.weight} kg` : '—'} · {member.height ? `${member.height} cm` : '—'}</p>
            <p className="mt-1 text-xs text-cream-800/50">Bel: {member.waist ? `${member.waist} cm` : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Spor Seviyesi</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900">
              <Activity className="h-4 w-4 text-brand-500" /> {FITNESS_LABELS[member.fitnessLevel] || '—'}
            </p>
            <p className="mt-1 text-xs text-cream-800/50">Yaş: {member.age || '—'} · {member.gender === 'female' ? 'Kadın' : member.gender === 'male' ? 'Erkek' : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">İletişim</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900 break-all"><Mail className="h-3.5 w-3.5 shrink-0" /> {member.email}</p>
            {member.phone && <p className="mt-1 text-xs text-cream-800/55">{member.phone}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><Target className="h-4 w-4 text-brand-500" /> Hedefler</p>
          <Chips values={member.goals} map={GOAL_LABELS} />
        </div>
      </div>

      <MemberHealthInsights member={member} showLocation compact showHealthAnalysis={false} />

      <Link
        to={`/staff/clients/${member.id}/health`}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
      >
        <HeartPulse className="h-4 w-4" /> Tam Sağlık Profili & Notlar
      </Link>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarRange className="h-4 w-4 text-brand-500" /> Antrenman Müsaitliği</p>
        <AvailabilityView value={member.availability} emptyText="Danışan henüz antrenman günü belirtmemiş." />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarClock className="h-4 w-4 text-brand-500" /> Yaklaşan Randevular</p>
        {appts.length === 0 ? (
          <p className="text-sm text-cream-800/40">Yaklaşan randevu yok</p>
        ) : (
          <div className="space-y-2.5">
            {appts.slice(0, 4).map((a) => (
              <StaffAppointmentRow
                key={a.id}
                memberName={member.name}
                subtitle={a.title}
                dateISO={a.date}
                session={a}
                sessionType={sessionType}
                isCoach={isCoach}
                accentRole={role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chips({ values, map }) {
  if (!values?.length) return <span className="text-sm text-cream-800/40">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-cream-800">
          {map[v] || v}
        </span>
      ))}
    </div>
  )
}

export default function StaffClientsPage() {
  const navigate = useNavigate()
  const { staffUser, platform, createProgram } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [infoClient, setInfoClient] = useState(null)
  const [programClient, setProgramClient] = useState(null)
  const role = staffUser.role
  const isCoach = isCoachRole(role)
  const isDietitian = isDietitianRole(role)
  const RoleIcon = staffRoleMeta(role).icon

  const clients = useMemo(() => getStaffClients(platform.members, staffUser.role, staffUser.id), [platform.members, staffUser.role, staffUser.id])
  const filtered = clients.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )

  const programType = isCoach ? 'workout' : 'nutrition'
  const packageRange = useMemo(() => {
    if (!programClient) return null
    return getMemberPackageDateRange(programClient, programType)
  }, [programClient, programType])

  const handleCreateNutrition = async (data) => {
    if (!programClient) return
    if (!memberHasProgramTypePackage(programClient, programType)) {
      toast('Üyenin bu program türü için aktif paketi yok', 'error')
      return
    }
    const outside = findEntriesOutsidePackage(data.entries || [], programClient, programType)
    if (outside.length) {
      const dates = [...new Set(outside.map((e) => e.date))].join(', ')
      toast(`Paket süresi dışındaki tarihler: ${dates}`, 'error')
      return
    }
    if (data.scheduleType === 'cycle14' && data.cycleStartDate) {
      const windows = getPackageWindowsForProgramType(programClient, programType)
      if (!isDateInPackageWindows(data.cycleStartDate, windows)) {
        toast('Liste başlangıç tarihi üyenin paket süresi içinde olmalı', 'error')
        return
      }
      const endDate = format(addDays(new Date(`${data.cycleStartDate}T12:00:00`), (data.cycleLength || 14) - 1), 'yyyy-MM-dd')
      if (!isDateInPackageWindows(endDate, windows)) {
        toast('14 günlük listenin bitiş tarihi paket süresini aşıyor', 'error')
        return
      }
    }
    const created = await createProgram({
      type: 'nutrition',
      memberId: programClient.id,
      memberName: programClient.name,
      staffId: staffUser.id,
      staffName: staffUser.name,
      ...data,
    })
    if (!created) {
      toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error')
      return
    }
    toast(`${programClient.name} için liste oluşturuldu — danışana bildirim gönderildi`, 'success')
    setProgramClient(null)
  }

  const openProgramFlow = (member) => {
    if (isCoach) {
      navigate(`/staff/clients/${member.id}/program`)
      return
    }
    if (isDietitian) {
      setProgramClient(member)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Danışanlarım</h1>
        <p className="mt-1 text-sm text-cream-800/60">{clients.length} danışan · bilgileri görüntüleyin veya program oluşturun</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Danışan bulunamadı" description="Size atanan ücretli üyeler burada görünecek." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const bmi = calculateBMI(m.weight, m.height)
            const cat = bmiCategory(bmi)
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream-900">{m.name}</p>
                    <p className="truncate text-xs text-cream-800/50">{m.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-cream-800/60">
                    <RoleIcon className="h-4 w-4" /> {FITNESS_LABELS[m.fitnessLevel] || '—'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>
                    VKİ {bmi ?? '—'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoClient(m)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50 py-2.5 text-xs font-semibold text-cream-800 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <UserRound className="h-3.5 w-3.5" /> Bilgiler
                  </button>
                  <Link
                    to={`/staff/clients/${m.id}/health`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    <HeartPulse className="h-3.5 w-3.5" /> Sağlık Profili
                  </Link>
                  <button
                    type="button"
                    onClick={() => openProgramFlow(m)}
                    disabled={!isCoach && !isDietitian}
                    className={`col-span-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                      isCoach || isDietitian
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'cursor-not-allowed border border-cream-200 bg-cream-50 text-cream-800/40'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> {isCoach ? 'Program Oluştur' : isDietitian ? 'Liste Oluştur' : 'Randevu'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!infoClient} onClose={() => setInfoClient(null)} title={infoClient?.name} size="lg">
        {infoClient && <ClientInfo member={infoClient} role={role} />}
      </Modal>

      {isDietitian && (
        <Modal open={!!programClient} onClose={() => setProgramClient(null)} title={`${programClient?.name} — Beslenme Listesi`} size="xl">
          {programClient && (
            <NutritionProgramBuilder packageRange={packageRange} onCreate={handleCreateNutrition} />
          )}
        </Modal>
      )}
    </div>
  )
}
