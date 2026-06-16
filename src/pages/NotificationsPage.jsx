import { useState } from 'react'
import NotificationItem from '../components/notifications/NotificationItem'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Bell } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'reminder', label: 'Hatırlatıcı' },
  { id: 'assignment', label: 'Atamalar' },
  { id: 'no-response', label: 'Yanıt bekleniyor' },
  { id: 'health-warning', label: 'Sağlık' },
  { id: 'upsell', label: 'Öneriler' },
]

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp()
  const { toast } = useToast()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter)

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="welcome-banner flex flex-wrap items-center justify-between gap-4 !py-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Bildirimler</h1>
          {unread > 0 ? (
            <p className="mt-1 text-sm text-white/80">{unread} okunmamış mesajınız var</p>
          ) : (
            <p className="mt-1 text-sm text-white/75">Her şey güncel görünüyor</p>
          )}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => { markAllNotificationsRead(); toast('Tümü okundu olarak işaretlendi', 'success') }}
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f.id
                ? 'bg-gradient-to-r from-brand-500 to-sage-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white/80 text-cream-800 shadow-sm hover:bg-brand-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Bildirim yok" description="Yeni bildirimler burada görünecek." />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={markNotificationRead} />
          ))}
        </div>
      )}
    </div>
  )
}
