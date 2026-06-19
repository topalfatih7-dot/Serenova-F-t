import { Video, Settings, Radio } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import VideoJoinLink from './VideoJoinLink'
import { isVideoCallConfigured } from '../../config/videoCall'
import { getSessionTiming, canJoinSession } from '../../services/videoCallSession'

/**
 * Koç / diyetisyen paneli için özel "Görüntülü Görüşme" alanı.
 * Planlı ve süresi dolmamış tüm seansları belirgin biçimde listeler,
 * canlı görüşmeleri öne çıkarır ve yapılandırma eksikse uyarı gösterir.
 */
export default function StaffVideoPanel({ clients, role }) {
  const isCoach = role === 'coach'
  const key = isCoach ? 'coachSessions' : 'dietitianSessions'
  const now = new Date()
  const configured = isVideoCallConfigured()

  const sessions = []
  ;(clients || []).forEach((m) => {
    ;(m[key] || []).forEach((s) => {
      if (s.status !== 'scheduled') return
      const timing = getSessionTiming(s, now)
      if (timing.isExpired) return
      const join = canJoinSession(s, now)
      sessions.push({ ...s, memberName: m.name, timing, join })
    })
  })
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date))

  const liveCount = sessions.filter((s) => s.timing.isInJoinWindow).length

  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-sage-50/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-md">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-cream-900">Görüntülü Görüşme</h3>
            <p className="text-xs text-cream-800/60">Danışanlarınızla canlı görüşmelere buradan katılın</p>
          </div>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> {liveCount} görüşme aktif
          </span>
        )}
      </div>

      {/* Yapılandırma uyarısı */}
      {!configured && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            Video görüşme altyapısı henüz etkin değil. Yöneticiniz <code className="rounded bg-white px-1 py-0.5">VITE_DAILY_DOMAIN</code> ayarını tanımladığında “Görüşmeye Katıl” butonları çalışır hâle gelir.
          </p>
        </div>
      )}

      {/* Seans listesi */}
      {sessions.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white/70 px-4 py-6 text-center text-sm text-cream-800/55">
          Planlı görüntülü görüşme yok. Randevular admin panelinden eklendiğinde burada belirir.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {sessions.slice(0, 6).map((s) => {
            const live = s.timing.isInJoinWindow
            return (
              <div
                key={s.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  live ? 'border-red-200 bg-white shadow-sm ring-1 ring-red-100' : 'border-cream-200 bg-white/80'
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${live ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
                  {(s.memberName || '?').charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-cream-900">{s.memberName}</p>
                  <p className="text-xs text-cream-800/55">
                    {isToday(new Date(s.date)) ? 'Bugün' : format(new Date(s.date), 'd MMM', { locale: tr })}
                    {' · '}{format(new Date(s.date), 'HH:mm')}
                    {s.join?.statusLabel ? ` · ${s.join.statusLabel}` : ''}
                  </p>
                </div>
                <VideoJoinLink
                  session={s}
                  sessionType={isCoach ? 'coach' : 'dietitian'}
                  audience="staff"
                  size="md"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
