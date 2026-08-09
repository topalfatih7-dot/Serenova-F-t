import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, Clock, User, Video, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import VideoJoinLink from '../video/VideoJoinLink'
import {
  canMemberModifySession,
  memberCancelBlockedCopy,
  memberCancelLabel,
  VIDEO_ACTIVE_STATUSES,
} from '../../utils/sessionCancelRules'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800',
  scheduled: 'bg-brand-50 text-brand-700',
  completed: 'bg-sage-50 text-sage-700',
  cancelled: 'bg-red-50 text-red-600',
  rejected: 'bg-red-50 text-red-700',
  rescheduled: 'bg-amber-50 text-amber-700',
  cancel_pending: 'bg-orange-50 text-orange-800',
  admin_cancel_pending: 'bg-orange-50 text-orange-800',
}

const STATUS_LABELS = {
  pending: 'Onay bekliyor',
  scheduled: 'Planlandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  rejected: 'Reddedildi',
  rescheduled: 'Yeniden planlandı',
  cancel_pending: 'İptal onayı bekleniyor',
  admin_cancel_pending: 'Yönetim iptal onayı',
}

export default function SessionCard({ session, sessionType = 'coach', onReschedule, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isPast = new Date(session.date) < new Date()
  const status = session.status || 'scheduled'
  const withinNotice = canMemberModifySession(session)
  const canReschedule = (status === 'scheduled' || status === 'rescheduled') && !isPast && withinNotice
  const canCancelPending = status === 'pending' && !isPast
  const canRequestCancel = (status === 'scheduled' || status === 'rescheduled') && !isPast && withinNotice
  const canCancel = canCancelPending || canRequestCancel
  const showModifyBlocked = (status === 'scheduled' || status === 'rescheduled') && !isPast && !withinNotice
  const canJoin = VIDEO_ACTIVE_STATUSES.includes(status)

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[status] || STATUS_STYLES.scheduled}`}>
            {STATUS_LABELS[status] || status}
          </span>
          <h4 className="mt-2 font-semibold text-cream-900">{session.title}</h4>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-800/60">
            <User className="h-3.5 w-3.5" /> {session.coach}
          </p>
        </div>
        {canCancel && (
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1.5 hover:bg-cream-100">
              <MoreVertical className="h-4 w-4 text-cream-800/50" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-cream-200 bg-white py-1 shadow-lg">
                {canReschedule && (
                  <button
                    type="button"
                    onClick={() => { onReschedule?.(session); setMenuOpen(false) }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-cream-50"
                  >
                    Yeniden Planla
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { onCancel?.(session); setMenuOpen(false) }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  {memberCancelLabel(status)}
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
        {canJoin && !isPast && (
          <span className="flex items-center gap-1.5 text-brand-600">
            <Video className="h-4 w-4" /> Video görüşme
          </span>
        )}
      </div>
      {showModifyBlocked && (
        <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-xs text-cream-800/70">
          {memberCancelBlockedCopy()}
        </p>
      )}
      {status === 'cancel_pending' && (
        <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
          İptal talebiniz uzman onayını bekliyor. Onaylanana kadar randevu geçerlidir.
        </p>
      )}
      {canJoin && (
        <div className="mt-4 border-t border-cream-100 pt-4">
          <VideoJoinLink session={session} sessionType={sessionType} className="w-full" />
        </div>
      )}
    </div>
  )
}
