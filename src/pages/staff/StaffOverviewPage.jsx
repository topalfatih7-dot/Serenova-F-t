import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarClock, ClipboardList, ArrowRight } from 'lucide-react'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { weekdayLabel } from '../../components/package/SupportScheduler'
import StaffVideoPanel from '../../components/video/StaffVideoPanel'
import StaffAppointmentRow from '../../components/video/StaffAppointmentRow'
import { useApp } from '../../context/AppContext'
import { getStaffClients } from '../../utils/chatAccess'
import { resolveFirstName } from '../../utils/displayName'
import {
  fallbackNameForRole,
  panelTitleForRole,
  sessionTypeForRole,
  sessionsKeyForRole,
  staffRoleMeta,
  isCoachRole,
} from '../../utils/staffRoles'

export { getStaffClients }

export function getStaffAppointments(clients, role) {
  const now = new Date()
  const key = sessionsKeyForRole(role)
  const list = []
  clients.forEach((m) => {
    (m[key] || []).forEach((s) => {
      if (s.status === 'scheduled' && new Date(s.date) >= now) {
        list.push({ ...s, memberName: m.name, memberId: m.id })
      }
    })
  })
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export default function StaffOverviewPage() {
  const { staffUser, platform } = useApp()
  const role = staffUser.role
  const isCoach = isCoachRole(role)
  const RoleIcon = staffRoleMeta(role).icon
  const sessionType = sessionTypeForRole(role)

  const clients = useMemo(() => getStaffClients(platform.members, role, staffUser.id), [platform.members, role, staffUser.id])
  const firstName = resolveFirstName({
    name: staffUser.name,
    email: staffUser.email,
    fallback: fallbackNameForRole(role),
  })
  const appointments = useMemo(() => getStaffAppointments(clients, role), [clients, role])
  const myPrograms = useMemo(
    () => (platform.programs || []).filter((p) => p.staffId === staffUser.id),
    [platform.programs, staffUser.id]
  )

  const weekKey = sessionsKeyForRole(role)
  const thisWeekCount = useMemo(() => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return clients.reduce((sum, m) => sum + (m[weekKey] || []).filter((s) => {
      const d = new Date(s.date)
      return s.status === 'scheduled' && d >= now && d <= weekEnd
    }).length, 0)
  }, [clients, weekKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">
            Merhaba, {firstName}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-800/60">
            <RoleIcon className="h-4 w-4" /> {panelTitleForRole(role)}
            {staffUser.workDays?.length ? ` · ${staffUser.workDays.map(weekdayLabel).join(', ')} · ${staffUser.workStart}–${staffUser.workEnd}` : ''}
          </p>
        </div>
        <Link to="/staff/clients" className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <ClipboardList className="h-4 w-4" /> {isCoach ? 'Program Oluştur' : 'Danışanlarım'}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Danışan" value={clients.length} sub="Aktif ücretli üye" icon={Users} accent="brand" />
        <StatsCard label="Bu Hafta Randevu" value={thisWeekCount} sub="Planlanan görüşme" icon={CalendarClock} accent="sage" />
        <StatsCard label="Oluşturulan Program" value={myPrograms.length} sub={isCoach ? 'Antrenman programı' : 'Toplam'} icon={ClipboardList} accent="gold" />
      </div>

      {/* Görüntülü görüşme alanı */}
      <StaffVideoPanel clients={clients} role={staffUser.role} />

      <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-cream-900">Yaklaşan Randevular</h3>
          <Link to="/staff/clients" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            Danışanlar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-6 text-center text-sm text-cream-800/50">Yaklaşan randevu yok</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {appointments.slice(0, 8).map((a) => (
              <StaffAppointmentRow
                key={a.id}
                memberName={a.memberName}
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

      {clients.length === 0 && (
        <EmptyState
          icon={Users}
          title="Henüz danışan yok"
          description="Premium üyeler kayıt oldukça ve paketlerinde destek seçtikçe burada görünecekler."
        />
      )}
    </div>
  )
}
