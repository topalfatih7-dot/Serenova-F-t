import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

const UPCOMING_STATUSES = ['pending', 'scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending']

export default function MemberScheduleView({
  type,
  title,
  subtitle,
  icon: Icon,
  accent = 'brand',
  sessions = [],
  canBook = true,
  monthlyLimit = 0,
  limitScope = 'month',
  lockedTitle,
  lockedDescription,
  upgradeHref = '/plans',
}) {
  const { staff, user, bookSession, getStaffBookedSlots, rescheduleSession, cancelSession } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [bookOpen, setBookOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const staffId = useMemo(() => {
    if (type === 'coach') return user.assignedCoachId
    return user.assignedDietitianId
  }, [type, user.assignedCoachId, user.assignedDietitianId])

  const assignedStaff = useMemo(
    () => (staff || []).find((s) => s.id === staffId) || null,
    [staff, staffId],
  )

  const filtered = sessions.filter((s) => {
    const st = s.status || 'scheduled'
    if (filter === 'upcoming') {
      return UPCOMING_STATUSES.includes(st) && new Date(s.date) >= new Date()
    }
    if (filter === 'past') {
      return ['completed', 'cancelled', 'rejected', 'no_show'].includes(st) || new Date(s.date) < new Date()
    }
    return true
  })

  const handleBook = (dateISO, duration) => bookSession(type, dateISO, duration)

  const hasSessions = (sessions || []).length > 0
  if (!canBook && !hasSessions) {
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

  const confirmCancel = async () => {
    if (!cancelTarget || busy) return
    setBusy(true)
    try {
      const r = await cancelSession(cancelTarget.id, type)
      if (r?.success === false) {
        toast(r.error || 'İptal işlemi başarısız.', 'error')
        return
      }
      if (r?.outcome === 'cancel_pending') {
        toast('İptal talebiniz gönderildi. Uzman onayı bekleniyor.', 'info')
      } else {
        toast('Randevu iptal edildi', 'info')
      }
      setCancelTarget(null)
    } finally {
      setBusy(false)
    }
  }

  const confirmReschedule = async () => {
    if (!rescheduleTarget || busy) return
    setBusy(true)
    try {
      const r = await rescheduleSession(rescheduleTarget.id, type, null, rescheduleDays)
      if (r?.success === false) {
        toast(r.error || 'Yeniden planlama başarısız.', 'error')
        return
      }
      toast('Randevu yeniden planlandı', 'success')
      setRescheduleTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        accent={accent}
        image={type === 'coach' ? PANEL_IMAGES.scheduleCoach : PANEL_IMAGES.scheduleDietitian}
        actions={canBook ? (
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
        ) : null}
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
          description={canBook
            ? 'Uzmanınızın müsait olduğu gün ve saatlerden Randevu Al ile yeni görüşme planlayabilirsiniz.'
            : (lockedDescription || 'Bu pakette yeni randevu hakkı kalmadı.')}
          action={canBook ? (
            <button
              type="button"
              onClick={() => setBookOpen(true)}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Randevu Al
            </button>
          ) : (
            <Link to={upgradeHref} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
              Planları İncele
            </Link>
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
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      <SessionBooker
        open={canBook && bookOpen}
        onClose={() => setBookOpen(false)}
        type={type}
        staff={assignedStaff}
        existingSessions={sessions}
        monthlyLimit={monthlyLimit}
        limitScope={limitScope}
        accent={accent}
        onBook={handleBook}
        getBookedSlots={getStaffBookedSlots}
      />

      <Modal open={!!rescheduleTarget} onClose={() => !busy && setRescheduleTarget(null)} title="Randevuyu Yeniden Planla">
        <p className="text-sm text-cream-800/70">
          Mevcut randevu iptal edilip {rescheduleDays} gün sonrasına taşınacak. Kesin saat için Randevu Al kullanın.
        </p>
        <p className="mt-2 text-xs text-cream-800/55">
          Randevu saatinden 24 saatten az kaldığında yeniden planlama yapılamaz.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={confirmReschedule}
          className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60 ${
            accent === 'sage' ? 'bg-sage-500' : accent === 'teal' ? 'bg-teal-600' : 'bg-brand-500'
          }`}
        >
          {busy ? 'İşleniyor…' : 'Onayla'}
        </button>
      </Modal>

      <Modal
        open={!!cancelTarget}
        onClose={() => !busy && setCancelTarget(null)}
        title={cancelTarget?.status === 'pending' ? 'Talebi İptal Et' : 'İptal Talebi Gönder'}
      >
        {cancelTarget?.status === 'pending' ? (
          <p className="text-sm text-cream-800/70">
            Onay bekleyen randevu talebiniz anında iptal edilecek.
          </p>
        ) : (
          <p className="text-sm text-cream-800/70">
            İptal talebiniz uzmanınıza iletilecek. Uzman onayladıktan sonra randevu iptal olur; reddedilirse görüşme planlandığı gibi devam eder.
          </p>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => setCancelTarget(null)}
            className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirmCancel}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'İşleniyor…' : (cancelTarget?.status === 'pending' ? 'Talebi İptal Et' : 'Talebi Gönder')}
          </button>
        </div>
      </Modal>
    </PanelPageShell>
  )
}
