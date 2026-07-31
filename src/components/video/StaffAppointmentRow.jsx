import { format, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, Clock, Check, X } from 'lucide-react'
import VideoJoinLink from './VideoJoinLink'
import { normalizeStaffRole } from '../../utils/staffRoles'

const AVATAR_STYLES = {
  coach: { live: 'bg-red-100 text-red-600', idle: 'bg-brand-100 text-brand-600' },
  dietitian: { live: 'bg-red-100 text-red-600', idle: 'bg-sage-100 text-sage-600' },
  doctor: { live: 'bg-red-100 text-red-600', idle: 'bg-amber-100 text-amber-700' },
}

/**
 * Koç / diyetisyen / doktor panelinde randevu + görüntülü görüşme satırı.
 */
export default function StaffAppointmentRow({
  memberName,
  subtitle,
  dateISO,
  session,
  sessionType,
  isCoach = true,
  accentRole,
  live = false,
  showJoin = true,
  pending = false,
  onApprove,
  onReject,
  responding = false,
}) {
  const role = normalizeStaffRole(accentRole || (isCoach ? 'coach' : sessionType === 'doctor' ? 'doctor' : 'dietitian'))
  const styles = AVATAR_STYLES[role] || AVATAR_STYLES.coach
  const date = new Date(dateISO)
  const dateLabel = isToday(date) ? 'Bugün' : format(date, 'd MMMM yyyy', { locale: tr })
  const timeLabel = format(date, 'HH:mm')

  return (
    <div
      className={`rounded-xl border px-3 py-3 sm:px-4 ${
        live
          ? 'border-red-200 bg-white shadow-sm ring-1 ring-red-100'
          : 'border-cream-200 bg-white/90'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            live ? styles.live : styles.idle
          }`}
        >
          {(memberName || '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-cream-900 break-words sm:text-base">
            {memberName}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-cream-800/55 break-words sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-cream-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream-900 sm:text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          {dateLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream-900 sm:text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          {timeLabel}
        </span>
      </div>

      {pending && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={responding}
            onClick={() => onApprove?.(session)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sage-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" /> Onayla
          </button>
          <button
            type="button"
            disabled={responding}
            onClick={() => onReject?.(session)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" /> Reddet
          </button>
        </div>
      )}

      {!pending && showJoin && session && (
        <div className="mt-3">
          <VideoJoinLink
            session={session}
            sessionType={sessionType}
            audience="staff"
            size="sm"
            fullWidth
          />
        </div>
      )}
    </div>
  )
}
