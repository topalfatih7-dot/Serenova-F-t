import { Video, Settings, Radio } from 'lucide-react'
import StaffAppointmentRow from './StaffAppointmentRow'
import { isVideoCallConfigured } from '../../config/videoCall'
import { getSessionTiming, canJoinSession } from '../../services/videoCallSession'
import { isCoachRole, sessionTypeForRole, sessionsKeyForRole } from '../../utils/staffRoles'

/**
 * Koç / diyetisyen / doktor paneli için "Görüntülü Görüşme" alanı.
 */
export default function StaffVideoPanel({ clients, role }) {
  const sessionType = sessionTypeForRole(role)
  const key = sessionsKeyForRole(role)
  const isCoach = isCoachRole(role)
  const now = new Date()
  const configured = isVideoCallConfigured()

  const sessions = []
  ;(clients || []).forEach((m) => {
    ;(m[key] || []).forEach((s) => {
      if (s.status !== 'scheduled') return
      const timing = getSessionTiming(s, now, sessionType)
      if (timing.isExpired) return
      const join = canJoinSession(s, now, sessionType)
      sessions.push({ ...s, memberName: m.name, timing, join })
    })
  })
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date))

  const liveCount = sessions.filter((s) => s.timing.isInJoinWindow).length

  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-sage-50/60 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-md">
            <Video className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold leading-tight text-cream-900 sm:text-lg">
              Görüntülü Görüşme
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-cream-800/60 sm:text-sm">
              Danışanlarınızla canlı görüşmelere buradan katılın
            </p>
          </div>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm sm:self-center">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> {liveCount} görüşme aktif
          </span>
        )}
      </div>

      {!configured && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            Video görüşme altyapısı henüz etkin değil. Yöneticiniz <code className="rounded bg-white px-1 py-0.5">VITE_DAILY_DOMAIN</code> ayarını tanımladığında “Görüşmeye Katıl” butonları çalışır hâle gelir.
          </p>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white/70 px-4 py-6 text-center text-sm leading-relaxed text-cream-800/55">
          Planlı görüntülü görüşme yok. Randevular admin panelinden veya üye self-servis ile eklendiğinde burada belirir.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {sessions.slice(0, 6).map((s) => {
            const live = s.timing.isInJoinWindow
            const statusParts = [s.title].filter(Boolean)
            if (s.join?.statusLabel) statusParts.push(s.join.statusLabel)
            return (
              <StaffAppointmentRow
                key={s.id}
                memberName={s.memberName}
                subtitle={statusParts.join(' · ') || undefined}
                dateISO={s.date}
                session={s}
                sessionType={sessionType}
                isCoach={isCoach}
                accentRole={role}
                live={live}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
