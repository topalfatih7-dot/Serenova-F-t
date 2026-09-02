import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarClock, ClipboardList, ArrowRight, Hourglass, Ban } from 'lucide-react'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { weekdayLabel } from '../../components/package/supportScheduleConstants'
import StaffVideoPanel from '../../components/video/StaffVideoPanel'
import StaffAppointmentRow from '../../components/video/StaffAppointmentRow'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getStaffClients } from '../../utils/chatAccess'
import {
  getStaffAppointments,
  getStaffPendingAppointments,
  getStaffCancelPendingAppointments,
  isPendingApprovalExpired,
} from './staffAppointments'
import { resolveFirstName } from '../../utils/displayName'
import {
  fallbackNameForRole,
  panelTitleForRole,
  sessionTypeForRole,
  sessionsKeyForRole,
  staffRoleMeta,
  isCoachRole,
} from '../../utils/staffRoles'

export default function StaffOverviewPage() {
  const { staffUser, platform, respondSession, respondCancelSession, cancelSession } = useApp()
  const { toast } = useToast()
  const role = staffUser.role
  const isCoach = isCoachRole(role)
  const RoleIcon = staffRoleMeta(role).icon
  const sessionType = sessionTypeForRole(role)
  const [respondingId, setRespondingId] = useState(null)

  const clients = useMemo(() => getStaffClients(platform.members, role, staffUser.id), [platform.members, role, staffUser.id])
  const firstName = resolveFirstName({
    name: staffUser.name,
    email: staffUser.email,
    fallback: fallbackNameForRole(role),
  })
  const appointments = useMemo(() => getStaffAppointments(clients, role), [clients, role])
  const pendingAppointments = useMemo(() => getStaffPendingAppointments(clients, role), [clients, role])
  const cancelPendingAppointments = useMemo(
    () => getStaffCancelPendingAppointments(clients, role),
    [clients, role],
  )
  const myPrograms = useMemo(
    () => (platform.programs || []).filter((p) => p.staffId === staffUser.id),
    [platform.programs, staffUser.id]
  )

  const handleRespond = useCallback(async (session, decision) => {
    if (!session?.id || !session.memberId) return
    setRespondingId(session.id)
    try {
      const r = await respondSession({
        memberId: session.memberId,
        sessionId: session.id,
        sessionType,
        decision,
      })
      if (r?.success === false) {
        toast(r.error || 'İşlem başarısız.', 'error')
        return
      }
      toast(decision === 'approve' ? 'Randevu onaylandı' : 'Talep reddedildi', decision === 'approve' ? 'success' : 'info')
    } finally {
      setRespondingId(null)
    }
  }, [respondSession, sessionType, toast])

  const handleRespondCancel = useCallback(async (session, decision) => {
    if (!session?.id || !session.memberId) return
    setRespondingId(session.id)
    try {
      const r = await respondCancelSession({
        memberId: session.memberId,
        sessionId: session.id,
        sessionType,
        decision,
      })
      if (r?.success === false) {
        toast(r.error || 'İşlem başarısız.', 'error')
        return
      }
      toast(
        decision === 'approve' ? 'İptal onaylandı' : 'İptal talebi reddedildi — randevu devam ediyor',
        decision === 'approve' ? 'info' : 'success',
      )
    } finally {
      setRespondingId(null)
    }
  }, [respondCancelSession, sessionType, toast])

  const handleStaffCancel = useCallback(async (session) => {
    if (!session?.id || !session.memberId) return
    setRespondingId(session.id)
    try {
      const r = await cancelSession(session.id, sessionType, { memberId: session.memberId })
      if (r?.success === false) {
        toast(r.error || 'İptal başarısız.', 'error')
        return
      }
      if (r?.outcome === 'admin_cancel_pending') {
        toast('İptal talebi yönetime gönderildi (24 saatten az kaldı).', 'info')
      } else {
        toast('Randevu iptal edildi', 'info')
      }
    } finally {
      setRespondingId(null)
    }
  }, [cancelSession, sessionType, toast])

  const weekKey = sessionsKeyForRole(role)
  const thisWeekCount = useMemo(() => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return clients.reduce((sum, m) => sum + (m[weekKey] || []).filter((s) => {
      const d = new Date(s.date)
      return ['scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending'].includes(s.status || 'scheduled')
        && d >= now && d <= weekEnd
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

      <StaffVideoPanel clients={clients} role={staffUser.role} />

      {pendingAppointments.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <Hourglass className="h-4 w-4 text-amber-600" />
              Onay bekleyen talepler
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {pendingAppointments.length}
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {pendingAppointments.slice(0, 8).map((a) => {
              const overdue = isPendingApprovalExpired(a, sessionType)
              return (
              <StaffAppointmentRow
                key={a.id}
                memberName={a.memberName}
                subtitle={overdue
                  ? `${a.title || 'Randevu talebi'} · süresi geçti — yalnız reddedebilirsiniz`
                  : `${a.title || 'Randevu talebi'} · onay bekliyor`}
                dateISO={a.date}
                session={a}
                sessionType={sessionType}
                isCoach={isCoach}
                accentRole={role}
                pending
                overdue={overdue}
                responding={respondingId === a.id}
                onApprove={overdue ? undefined : (s) => handleRespond(s, 'approve')}
                onReject={(s) => handleRespond(s, 'reject')}
              />
              )
            })}
          </div>
        </div>
      )}

      {cancelPendingAppointments.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <Ban className="h-4 w-4 text-orange-600" />
              İptal talepleri
            </h3>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
              {cancelPendingAppointments.length}
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {cancelPendingAppointments.slice(0, 8).map((a) => (
              <StaffAppointmentRow
                key={`cancel-${a.id}`}
                memberName={a.memberName}
                subtitle={`${a.title || 'Randevu'} · iptal onayı bekliyor`}
                dateISO={a.date}
                session={a}
                sessionType={sessionType}
                isCoach={isCoach}
                accentRole={role}
                cancelPending
                showJoin={false}
                responding={respondingId === a.id}
                onApprove={(s) => handleRespondCancel(s, 'approve')}
                onReject={(s) => handleRespondCancel(s, 'reject')}
              />
            ))}
          </div>
        </div>
      )}

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
                subtitle={
                  a.status === 'admin_cancel_pending'
                    ? `${a.title || 'Randevu'} · yönetim iptal onayı`
                    : a.status === 'cancel_pending'
                      ? `${a.title || 'Randevu'} · iptal onayı bekliyor`
                      : a.title
                }
                dateISO={a.date}
                session={a}
                sessionType={sessionType}
                isCoach={isCoach}
                accentRole={role}
                responding={respondingId === a.id}
                onCancel={handleStaffCancel}
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
