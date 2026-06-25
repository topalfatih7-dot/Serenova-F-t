import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import SessionCard from '../components/calendar/SessionCard'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Calendar, Dumbbell } from 'lucide-react'

export default function CoachSchedulePage() {
  const { coachSessions, rescheduleSession, cancelSession, membership } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [rescheduleTarget, setRescheduleTarget] = useState(null)

  const filtered = coachSessions.filter((s) => {
    if (filter === 'upcoming') return s.status === 'scheduled' && new Date(s.date) >= new Date()
    if (filter === 'past') return s.status === 'completed' || new Date(s.date) < new Date()
    return true
  })

  const handleReschedule = (session) => setRescheduleTarget(session)

  const confirmReschedule = () => {
    if (rescheduleTarget) {
      rescheduleSession(rescheduleTarget.id, 'coach', addDays(new Date(rescheduleTarget.date), 3))
      toast('Randevu yeniden planlandı', 'success')
      setRescheduleTarget(null)
    }
  }

  const handleCancel = (session) => {
    cancelSession(session.id, 'coach')
    toast('Randevu iptal edildi', 'info')
  }

  if (membership === 'free') {
    return (
      <EmptyState
        icon={Calendar}
        title="Koç randevuları Premium özelliğidir"
        description="Birebir koç görüşmeleri için Premium üyeliğe geçin."
        action={<Link to="/membership" className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Planları İncele</Link>}
      />
    )
  }

  return (
    <PanelPageShell maxWidth="max-w-4xl">
      <PanelPageHeader
        title="Koç Randevuları"
        subtitle="Birebir antrenman görüşmeleriniz"
        icon={Dumbbell}
        accent="brand"
        actions={['upcoming', 'past', 'all'].map((f) => (
          <PanelChip key={f} active={filter === f} onClick={() => setFilter(f)} accent="brand">
            {f === 'upcoming' ? 'Yaklaşan' : f === 'past' ? 'Geçmiş' : 'Tümü'}
          </PanelChip>
        ))}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Randevu bulunamadı" description="Koç randevularınız admin tarafından planlandığında burada görünecek." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SessionCard key={s.id} session={s} sessionType="coach" onReschedule={handleReschedule} onCancel={handleCancel} />
          ))}
        </div>
      )}

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Randevuyu Yeniden Planla">
        <p className="text-sm text-cream-800/70">Randevu 3 gün sonraya taşınacak.</p>
        <button type="button" onClick={confirmReschedule} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">Onayla</button>
      </Modal>
    </PanelPageShell>
  )
}
