import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import SessionCard from '../components/calendar/SessionCard'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Apple } from 'lucide-react'

export default function DietitianSchedulePage() {
  const { dietitianSessions, rescheduleSession, cancelSession, membership } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [rescheduleTarget, setRescheduleTarget] = useState(null)

  const filtered = dietitianSessions.filter((s) => {
    if (filter === 'upcoming') return s.status === 'scheduled' && new Date(s.date) >= new Date()
    if (filter === 'past') return s.status === 'completed' || new Date(s.date) < new Date()
    return true
  })

  if (membership === 'free') {
    return (
      <EmptyState
        icon={Apple}
        title="Diyetisyen randevuları Premium özelliğidir"
        description="Beslenme rehberliği için Premium üyeliğe geçin."
        action={<Link to="/membership" className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Planları İncele</Link>}
      />
    )
  }

  return (
    <PanelPageShell maxWidth="max-w-4xl">
      <PanelPageHeader
        title="Diyetisyen Randevuları"
        subtitle="Beslenme rehberliği — tıbbi tedavi değildir"
        icon={Apple}
        accent="sage"
        actions={['upcoming', 'past', 'all'].map((f) => (
          <PanelChip key={f} active={filter === f} onClick={() => setFilter(f)} accent="sage">
            {f === 'upcoming' ? 'Yaklaşan' : f === 'past' ? 'Geçmiş' : 'Tümü'}
          </PanelChip>
        ))}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Apple} title="Randevu bulunamadı" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              sessionType="dietitian"
              onReschedule={setRescheduleTarget}
              onCancel={(session) => { cancelSession(session.id, 'dietitian'); toast('Randevu iptal edildi', 'info') }}
            />
          ))}
        </div>
      )}

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Randevuyu Yeniden Planla">
        <p className="text-sm text-cream-800/70">Randevu 5 gün sonraya taşınacak.</p>
        <button
          type="button"
          onClick={() => {
            rescheduleSession(rescheduleTarget.id, 'dietitian', addDays(new Date(rescheduleTarget.date), 5))
            toast('Randevu yeniden planlandı', 'success')
            setRescheduleTarget(null)
          }}
          className="mt-4 w-full rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white"
        >
          Onayla
        </button>
      </Modal>
    </PanelPageShell>
  )
}
