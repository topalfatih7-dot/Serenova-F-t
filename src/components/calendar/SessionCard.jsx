import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, Clock, User, Video, MoreVertical } from 'lucide-react'
import { useState } from 'react'

const STATUS_STYLES = {
  scheduled: 'bg-brand-50 text-brand-700',
  completed: 'bg-sage-50 text-sage-700',
  cancelled: 'bg-red-50 text-red-600',
  rescheduled: 'bg-amber-50 text-amber-700',
}

const STATUS_LABELS = {
  scheduled: 'Planlandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  rescheduled: 'Yeniden planlandı',
}

export default function SessionCard({ session, onReschedule, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isPast = new Date(session.date) < new Date()
  const canModify = session.status === 'scheduled' && !isPast

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[session.status]}`}>
            {STATUS_LABELS[session.status]}
          </span>
          <h4 className="mt-2 font-semibold text-cream-900">{session.title}</h4>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-800/60">
            <User className="h-3.5 w-3.5" /> {session.coach}
          </p>
        </div>
        {canModify && (
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1.5 hover:bg-cream-100">
              <MoreVertical className="h-4 w-4 text-cream-800/50" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-cream-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { onReschedule?.(session); setMenuOpen(false) }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-cream-50"
                >
                  Yeniden Planla
                </button>
                <button
                  type="button"
                  onClick={() => { onCancel?.(session); setMenuOpen(false) }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  İptal Et
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-cream-800/70">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-brand-400" />
          {format(new Date(session.date), 'd MMMM yyyy', { locale: tr })}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-brand-400" />
          {format(new Date(session.date), 'HH:mm')} · {session.duration} dk
        </span>
        {session.status === 'scheduled' && !isPast && (
          <span className="flex items-center gap-1.5 text-brand-600">
            <Video className="h-4 w-4" /> Video görüşme
          </span>
        )}
      </div>
    </div>
  )
}
