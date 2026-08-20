import { Link } from 'react-router-dom'
import { Video, Clock } from 'lucide-react'
import { memberCallPath, staffCallPath, SESSION_TYPE_META } from '../../config/videoCall'
import { canAccessCallRoom, canJoinSession } from '../../services/videoCallSession'
import { VIDEO_ACTIVE_STATUSES } from '../../utils/sessionCancelRules'

/**
 * Randevu kartlarında görüşme odası linki — görüşme aktif olmasa da oda açılır.
 */
export default function VideoJoinLink({
  session,
  sessionType,
  audience = 'member',
  className = '',
  size = 'md',
  fullWidth = false,
}) {
  const joinOk = VIDEO_ACTIVE_STATUSES.includes(session?.status || 'scheduled')
  if (!session || !joinOk) return null

  const roomAccess = canAccessCallRoom(session, new Date(), sessionType)
  const joinCheck = canJoinSession(session, new Date(), sessionType)
  const path = audience === 'staff'
    ? staffCallPath(sessionType, session.id)
    : memberCallPath(sessionType, session.id)
  const meta = SESSION_TYPE_META[sessionType] || SESSION_TYPE_META.coach
  const sizeClass = size === 'sm'
    ? 'px-3 py-2 text-xs'
    : 'px-4 py-2.5 text-sm'
  const widthClass = fullWidth || className.includes('w-full') ? 'w-full' : ''

  if (!roomAccess.ok) {
    return (
      <span
        title={roomAccess.reason}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-cream-100 text-cream-800/70 ${sizeClass} ${widthClass} whitespace-normal text-center leading-snug ${className}`}
      >
        <Clock className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
        <span className="min-w-0">{roomAccess.reason}</span>
      </span>
    )
  }

  const subtitle = joinCheck.ok
    ? 'Görüşmeye Katıl'
    : joinCheck.reason || 'Görüşme Odası'
  const label = subtitle.startsWith('Görüşme') && !joinCheck.ok ? 'Görüşme Odası' : subtitle

  return (
    <Link
      to={path}
      title={joinCheck.reason || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-sm transition hover:opacity-90 ${meta.btn} ${sizeClass} ${widthClass} whitespace-normal text-center leading-snug ${className}`}
    >
      <Video className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
      <span className="min-w-0">{label}</span>
    </Link>
  )
}
