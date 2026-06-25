import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarClock, ClipboardList, ArrowRight, Dumbbell, Apple } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { weekdayLabel } from '../../components/package/SupportScheduler'
import VideoJoinLink from '../../components/video/VideoJoinLink'
import StaffVideoPanel from '../../components/video/StaffVideoPanel'
import { useApp } from '../../context/AppContext'
import { isPaidMembership, packageIncludesCoach, packageIncludesDietitian } from '../../data/membershipPlans'

export function getStaffClients(members, role, staffId) {
  const sid = String(staffId || '')
  return members.filter((m) => {
    if (!isPaidMembership(m.membership)) return false
    if (m.membershipStatus !== 'active' && m.membershipStatus !== 'expiring') return false
    if (role === 'coach') {
      if (!packageIncludesCoach(m.packageConfig)) return false
      return String(m.assignedCoachId || '') === sid
    }
    if (!packageIncludesDietitian(m.packageConfig)) return false
    return String(m.assignedDietitianId || '') === sid
  })
}

export function getStaffAppointments(clients, role) {
  const now = new Date()
  const key = role === 'coach' ? 'coachSessions' : 'dietitianSessions'
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
  const isCoach = staffUser.role === 'coach'
  const RoleIcon = isCoach ? Dumbbell : Apple

  const clients = useMemo(() => getStaffClients(platform.members, staffUser.role, staffUser.id), [platform.members, staffUser.role, staffUser.id])
  const appointments = useMemo(() => getStaffAppointments(clients, staffUser.role), [clients, staffUser.role])
  const myPrograms = useMemo(
    () => (platform.programs || []).filter((p) => p.staffId === staffUser.id),
    [platform.programs, staffUser.id]
  )

  const weekKey = isCoach ? 'coachSessions' : 'dietitianSessions'
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
            Merhaba, {(staffUser.name || '').split(' ')[0]}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-800/60">
            <RoleIcon className="h-4 w-4" /> {isCoach ? 'Koç paneli' : 'Diyetisyen paneli'}
            {staffUser.workDays?.length ? ` · ${staffUser.workDays.map(weekdayLabel).join(', ')} · ${staffUser.workStart}–${staffUser.workEnd}` : ''}
          </p>
        </div>
        <Link to="/staff/clients" className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <ClipboardList className="h-4 w-4" /> Program Oluştur
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Danışan" value={clients.length} sub="Aktif ücretli üye" icon={Users} accent="brand" />
        <StatsCard label="Bu Hafta Randevu" value={thisWeekCount} sub="Planlanan görüşme" icon={CalendarClock} accent="sage" />
        <StatsCard label="Oluşturulan Program" value={myPrograms.length} sub="Toplam" icon={ClipboardList} accent="gold" />
      </div>

      {/* Görüntülü görüşme alanı */}
      <StaffVideoPanel clients={clients} role={staffUser.role} />

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-cream-900">Yaklaşan Randevular</h3>
          <Link to="/staff/clients" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            Danışanlar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-6 text-center text-sm text-cream-800/50">Yaklaşan randevu yok</p>
        ) : (
          <div className="mt-4 space-y-2">
            {appointments.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-cream-50 px-4 py-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isCoach ? 'bg-brand-100 text-brand-600' : 'bg-sage-100 text-sage-600'}`}>
                  <RoleIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-cream-900">{a.memberName}</p>
                  <p className="text-xs text-cream-800/50">{a.title}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-right text-sm font-medium text-cream-900">
                    {format(new Date(a.date), 'd MMM', { locale: tr })}
                    <span className="block text-xs font-normal text-cream-800/50">{format(new Date(a.date), 'HH:mm')}</span>
                  </span>
                  <VideoJoinLink
                    session={a}
                    sessionType={isCoach ? 'coach' : 'dietitian'}
                    audience="staff"
                    size="sm"
                  />
                </div>
              </div>
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
