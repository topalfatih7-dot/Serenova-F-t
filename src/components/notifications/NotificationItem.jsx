import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Bell, Heart, AlertTriangle, TrendingUp, Crown, Activity, MessageCircle,
} from 'lucide-react'

const TYPE_CONFIG = {
  reminder: { icon: Bell, color: 'text-brand-500 bg-brand-50' },
  motivation: { icon: Heart, color: 'text-pink-500 bg-pink-50' },
  'no-response': { icon: MessageCircle, color: 'text-amber-600 bg-amber-50' },
  renewal: { icon: TrendingUp, color: 'text-orange-500 bg-orange-50' },
  upsell: { icon: Crown, color: 'text-gold-500 bg-amber-50' },
  'health-warning': { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  missed: { icon: Activity, color: 'text-cream-800 bg-cream-100' },
}

export default function NotificationItem({ notification, onRead }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.reminder
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={() => onRead?.(notification.id)}
      className={`flex w-full gap-4 rounded-2xl border p-4 text-left transition hover:shadow-sm ${
        notification.read ? 'border-cream-100 bg-white/50 opacity-70' : 'border-brand-100 bg-white shadow-sm'
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
        <p className="mt-2 text-xs text-cream-800/40">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
        </p>
      </div>
    </button>
  )
}
