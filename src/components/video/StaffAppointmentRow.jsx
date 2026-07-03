import { format, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, Clock } from 'lucide-react'
import VideoJoinLink from './VideoJoinLink'

/**
 * Koç / diyetisyen panelinde randevu + görüntülü görüşme satırı.
 * Mobilde dikey düzen: isim → tarih/saat → tam genişlik buton.
 */
export default function StaffAppointmentRow({
  memberName,
  subtitle,
  dateISO,
  session,
  sessionType,
  isCoach = true,
  live = false,
  showJoin = true,
}) {
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
            live
              ? 'bg-red-100 text-red-600'
              : isCoach
                ? 'bg-brand-100 text-brand-600'
                : 'bg-sage-100 text-sage-600'
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

      {showJoin && session && (
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
