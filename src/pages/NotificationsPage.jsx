import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationItem from '../components/notifications/NotificationItem'
import EmptyState from '../components/ui/EmptyState'
import PanelPageHeader, { PanelFilterBar, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { unlockNotificationAudio } from '../utils/browserNotifications'
import { PANEL_IMAGES } from '../utils/panelImages'
import { Bell, BellDot, Inbox, MailOpen } from 'lucide-react'

const FILTERS = [
  { id: 'unread', label: 'Okunmamışlar', icon: BellDot },
  { id: 'all', label: 'Tümü', icon: Inbox },
  { id: 'read', label: 'Okunanlar', icon: MailOpen },
]

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, flushNotificationReads } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  useEffect(() => () => { flushNotificationReads() }, [flushNotificationReads])

  const handleFilter = (id) => {
    unlockNotificationAudio().catch(() => {})
    setFilter(id)
  }

  const handleNotificationOpen = (n) => {
    markNotificationRead(n.id)
    if (n.type === 'chat' && n.staffRole) {
      navigate(`/messages/${n.staffRole}`)
      return
    }
    if (n.type === 'program') {
      navigate('/programs')
      return
    }
    if (n.type === 'availability' || n.action === 'availability') {
      navigate('/calendar?avail=1')
      return
    }
    if (n.type === 'support-reply' || n.type === 'support') {
      navigate('/support')
      return
    }
    if (n.type === 'assignment') {
      navigate('/profile')
      return
    }
    if (n.type === 'billing' || n.action === 'payments' || n.type === 'renewal') {
      navigate('/profile/payments')
      return
    }
    if (n.type === 'appointment') {
      navigate('/schedule')
    }
  }

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.read)

  const unread = notifications.filter((n) => !n.read).length

  return (
    <PanelPageShell onPointerDown={() => { unlockNotificationAudio().catch(() => {}) }}>
      <PanelPageHeader
        title="Bildirimler"
        subtitle={unread > 0 ? `${unread} okunmamış mesajınız var` : 'Her şey güncel görünüyor'}
        icon={Bell}
        accent="violet"
        image={PANEL_IMAGES.notifications}
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

      <PanelFilterBar
        value={filter}
        onChange={handleFilter}
        accent="violet"
        options={FILTERS.map((f) => (
          f.id === 'unread' ? { ...f, badge: unread } : f
        ))}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Bildirim yok" description="Yeni bildirimler burada görünecek." />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleNotificationOpen} />
          ))}
        </div>
      )}
    </PanelPageShell>
  )
}
