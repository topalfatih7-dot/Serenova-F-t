import { useState } from 'react'
import NotificationItem from '../components/notifications/NotificationItem'
import EmptyState from '../components/ui/EmptyState'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Bell } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'support-reply', label: 'Destek' },
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
    <PanelPageShell maxWidth="max-w-2xl">
      <PanelPageHeader
        title="Bildirimler"
        subtitle={unread > 0 ? `${unread} okunmamış mesajınız var` : 'Her şey güncel görünüyor'}
        icon={Bell}
        accent="violet"
        actions={unread > 0 ? (
          <button
            type="button"
            onClick={() => { markAllNotificationsRead(); toast('Tümü okundu olarak işaretlendi', 'success') }}
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            Tümünü okundu işaretle
          </button>
        ) : null}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <PanelChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} accent="brand">
            {f.label}
          </PanelChip>
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
    </PanelPageShell>
  )
}
