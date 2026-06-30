import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import SessionCard from '../components/calendar/SessionCard'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { packageIncludesDoctor } from '../data/membershipPlans'
import { Stethoscope } from 'lucide-react'

export default function DoctorSchedulePage() {
  const { doctorSessions, packageConfig, rescheduleSession, cancelSession } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [rescheduleTarget, setRescheduleTarget] = useState(null)

  const filtered = (doctorSessions || []).filter((s) => {
    if (filter === 'upcoming') return s.status === 'scheduled' && new Date(s.date) >= new Date()
    if (filter === 'past') return s.status === 'completed' || new Date(s.date) < new Date()
    return true
  })

  if (!packageIncludesDoctor(packageConfig)) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Doktor randevuları Doktor Paketi ile kullanılabilir"
        description="Uzman doktor görüşmeleri için Doktor Paketi'ne geçin."
        action={<Link to="/membership" className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Planları İncele</Link>}
      />
    )
  }

  return (
    <PanelPageShell maxWidth="max-w-4xl">
      <PanelPageHeader
        title="Doktor Randevuları"
        subtitle="Sağlık danışmanlığı — tıbbi teşhis veya tedavi yerine geçmez"
        icon={Stethoscope}
        accent="brand"
      />

      <div className="flex flex-wrap gap-2">
        {['upcoming', 'past', 'all'].map((f) => (
          <PanelChip key={f} active={filter === f} onClick={() => setFilter(f)} accent="brand">
            {f === 'upcoming' ? 'Yaklaşan' : f === 'past' ? 'Geçmiş' : 'Tümü'}
          </PanelChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Randevu bulunamadı" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              sessionType="doctor"
              onReschedule={setRescheduleTarget}
              onCancel={(session) => { cancelSession(session.id, 'doctor'); toast('Randevu iptal edildi', 'info') }}
            />
          ))}
        </div>
      )}

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Randevuyu Yeniden Planla">
        <p className="text-sm text-cream-800/70">Randevu 5 gün sonraya taşınacak.</p>
        <button
          type="button"
          onClick={() => {
            rescheduleSession(rescheduleTarget.id, 'doctor', addDays(new Date(rescheduleTarget.date), 5))
            toast('Randevu yeniden planlandı', 'success')
            setRescheduleTarget(null)
          }}
          className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white"
        >
          Onayla
        </button>
      </Modal>
    </PanelPageShell>
  )
}
