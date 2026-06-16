import { formatRelativeTime } from '../../utils/relativeTime'
import useRelativeTimeTick from '../../hooks/useRelativeTimeTick'
import {
  Bell, Heart, AlertTriangle, TrendingUp, Crown, Activity, MessageCircle, ClipboardList, UserCheck,
} from 'lucide-react'

const TYPE_CONFIG = {
  reminder: { icon: Bell, color: 'text-brand-500 bg-brand-50' },
  motivation: { icon: Heart, color: 'text-pink-500 bg-pink-50' },
  'no-response': { icon: MessageCircle, color: 'text-amber-600 bg-amber-50' },
  renewal: { icon: TrendingUp, color: 'text-orange-500 bg-orange-50' },
  upsell: { icon: Crown, color: 'text-gold-500 bg-amber-50' },
  'health-warning': { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  missed: { icon: Activity, color: 'text-cream-800 bg-cream-100' },
  program: { icon: ClipboardList, color: 'text-brand-600 bg-brand-50' },
  support: { icon: MessageCircle, color: 'text-brand-600 bg-brand-50' },
  assignment: { icon: UserCheck, color: 'text-sage-600 bg-sage-50' },
}

export default function NotificationItem({ notification, onRead }) {
  useRelativeTimeTick()
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.reminder
  const Icon = config.icon
  const when = formatRelativeTime(notification.createdAt)

  return (
    <button
      type="button"
      onClick={() => onRead?.(notification.id)}
      className={`flex w-full gap-4 rounded-2xl p-4 text-left transition glass-card-solid ${
        notification.read ? 'opacity-70' : 'ring-1 ring-brand-100'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-cream-900">{notification.title}</p>
          {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
        </div>
        <p className="mt-1 text-sm text-cream-800/60">{notification.message}</p>
        <p className="mt-2 text-xs text-cream-800/40">{when}</p>
      </div>
    </button>
  )
}
