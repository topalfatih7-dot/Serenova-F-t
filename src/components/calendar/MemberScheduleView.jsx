import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import SessionCard from './SessionCard'
import SessionBooker from './SessionBooker'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import PanelPageHeader, { PanelFilterBar, PanelPageShell } from '../layout/PanelPageHeader'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { PANEL_IMAGES } from '../../utils/panelImages'
import { Calendar, CalendarPlus, CalendarClock, History, LayoutGrid } from 'lucide-react'

const SCHEDULE_FILTERS = [
  { id: 'upcoming', label: 'Yaklaşan', icon: CalendarClock },
  { id: 'past', label: 'Geçmiş', icon: History },
  { id: 'all', label: 'Tümü', icon: LayoutGrid },
]

export default function MemberScheduleView({
  type,
  title,
  subtitle,
  icon: Icon,
  accent = 'brand',
  sessions = [],
  canBook = true,
  monthlyLimit = 0,
  lockedTitle,
  lockedDescription,
  upgradeHref = '/plans',
}) {
  const { staff, user, bookSession, getStaffBookedSlots, rescheduleSession, cancelSession } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [bookOpen, setBookOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)

  const staffId = useMemo(() => {
    if (type === 'coach') return user.assignedCoachId
    if (type === 'doctor') return user.assignedDoctorId
    return user.assignedDietitianId
  }, [type, user.assignedCoachId, user.assignedDietitianId, user.assignedDoctorId])

  const assignedStaff = useMemo(
    () => (staff || []).find((s) => s.id === staffId) || null,
    [staff, staffId],
  )

  const filtered = sessions.filter((s) => {
    if (filter === 'upcoming') return ['scheduled', 'rescheduled'].includes(s.status || 'scheduled') && new Date(s.date) >= new Date()
    if (filter === 'past') return s.status === 'completed' || new Date(s.date) < new Date()
    return true
  })

  const handleBook = (dateISO, duration) => bookSession(type, dateISO, duration)

  if (!canBook) {
    return (
      <EmptyState
        icon={Icon}
        title={lockedTitle}
        description={lockedDescription}
        action={(
          <Link to={upgradeHref} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
            Planları İncele
          </Link>
        )}
      />
    )
  }

  const rescheduleDays = type === 'coach' ? 3 : 5

  return (
    <PanelPageShell>
      <PanelPageHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        accent={accent}
        image={type === 'coach' ? PANEL_IMAGES.scheduleCoach : type === 'doctor' ? PANEL_IMAGES.scheduleDoctor : PANEL_IMAGES.scheduleDietitian}
        actions={(
          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 sm:w-auto ${
              accent === 'sage' ? 'bg-white/20 hover:bg-white/30' : accent === 'teal' ? 'bg-white/20 hover:bg-white/30' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <CalendarPlus className="h-4 w-4" />
            Randevu Al
          </button>
        )}
      />

      <PanelFilterBar
        value={filter}
        onChange={setFilter}
        options={SCHEDULE_FILTERS}
        accent={accent}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Randevu bulunamadı"
          description="Uzmanınızın müsait olduğu gün ve saatlerden Randevu Al ile yeni görüşme planlayabilirsiniz."
          action={(
            <button
              type="button"
              onClick={() => setBookOpen(true)}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Randevu Al
            </button>
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              sessionType={type}
              onReschedule={setRescheduleTarget}
              onCancel={(session) => {
                cancelSession(session.id, type)
                toast('Randevu iptal edildi', 'info')
              }}
            />
          ))}
        </div>
      )}

      <SessionBooker
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        type={type}
        staff={assignedStaff}
        existingSessions={sessions}
        monthlyLimit={monthlyLimit}
        accent={accent}
        onBook={handleBook}
        getBookedSlots={getStaffBookedSlots}
      />

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Randevuyu Yeniden Planla">
        <p className="text-sm text-cream-800/70">
          Mevcut randevu iptal edilip {rescheduleDays} gün sonrasına taşınacak. Kesin saat için Randevu Al kullanın.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!rescheduleTarget) return
            rescheduleSession(rescheduleTarget.id, type, addDays(new Date(rescheduleTarget.date), rescheduleDays))
            toast('Randevu yeniden planlandı', 'success')
            setRescheduleTarget(null)
          }}
          className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white ${
            accent === 'sage' ? 'bg-sage-500' : accent === 'teal' ? 'bg-teal-600' : 'bg-brand-500'
          }`}
        >
          Onayla
        </button>
      </Modal>
    </PanelPageShell>
  )
}
