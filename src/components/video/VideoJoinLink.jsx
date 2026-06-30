import { Link } from 'react-router-dom'
import { Video, Clock } from 'lucide-react'
import { memberCallPath, staffCallPath, SESSION_TYPE_META } from '../../config/videoCall'
import { canAccessCallRoom, canJoinSession } from '../../services/videoCallSession'

/**
 * Randevu kartlarında görüşme odası linki — görüşme aktif olmasa da oda açılır.
 */
export default function VideoJoinLink({
  session,
  sessionType,
  audience = 'member',
  className = '',
  size = 'md',
}) {
  if (!session || session.status !== 'scheduled') return null

  const roomAccess = canAccessCallRoom(session)
  const joinCheck = canJoinSession(session)
  const path = audience === 'staff'
    ? staffCallPath(sessionType, session.id)
    : memberCallPath(sessionType, session.id)
  const meta = SESSION_TYPE_META[sessionType] || SESSION_TYPE_META.coach
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2.5 text-sm'

  if (!roomAccess.ok) {
    return (
      <span
        title={roomAccess.reason}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-cream-100 text-cream-800/55 ${sizeClass} ${className}`}
      >
        <Clock className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {roomAccess.reason}
      </span>
    )
  }

  const subtitle = joinCheck.ok
    ? 'Görüşmeye Katıl'
    : joinCheck.reason || 'Görüşme Odası'

  return (
    <Link
      to={path}
      title={joinCheck.reason || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-sm transition hover:opacity-90 ${meta.btn} ${sizeClass} ${className}`}
    >
      <Video className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {subtitle.startsWith('Görüşme') && !joinCheck.ok ? 'Görüşme Odası' : subtitle}
    </Link>
  )
}
