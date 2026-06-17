import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import SessionCard from '../components/calendar/SessionCard'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Calendar } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-cream-900">Koç Randevuları</h1>
        <div className="flex gap-2">
          {['upcoming', 'past', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === f ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}
            >
              {f === 'upcoming' ? 'Yaklaşan' : f === 'past' ? 'Geçmiş' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

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
        <p className="text-sm text-cream-800/70">Randevu 3 gün sonraya taşınacak (demo).</p>
        <button type="button" onClick={confirmReschedule} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">Onayla</button>
      </Modal>
    </div>
  )
}
