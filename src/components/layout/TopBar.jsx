import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageCircle, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import { resolveFirstName } from '../../utils/displayName'

/**
 * Masaüstü panel üst çubuğu.
 * Üye varsayılan path’leri; staff/admin props ile override eder.
 */
function TopBar({
  title,
  messagesTo = '/messages',
  notificationsTo = '/notifications',
  showMembershipBadge = true,
  messagesCount = null,
  notificationsCount = null,
  /** Admin: bildirim yerine destek linki */
  supportTo = null,
  supportCount = 0,
  greetingFallback = 'Üye',
  /** Shell’den gelen isim (staff/admin); yoksa auth user */
  displayName = null,
}) {
  const {
    user, membership, chatUnreadCount, notificationUnreadCount, isStaff,
  } = useAuth()

  const firstName = displayName || resolveFirstName({
    name: user?.name,
    email: user?.email,
    fallback: greetingFallback || (isStaff ? 'Personel' : 'Üye'),
  })

  const msgCount = messagesCount ?? chatUnreadCount
  const notifCount = notificationsCount ?? notificationUnreadCount

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-200/40 bg-gradient-to-r from-white/90 via-white/85 to-brand-50/50 px-4 py-3 shadow-sm shadow-brand-500/[0.04] backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        {title ? (
          <h1 className="font-display text-lg font-semibold text-cream-900">{title}</h1>
        ) : (
          <p className="text-sm text-cream-800/60">Merhaba, <span className="font-medium text-cream-900">{firstName}</span></p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link to={messagesTo} className="relative rounded-xl p-2 transition hover:bg-brand-50/80" aria-label="Mesajlar">
          <MessageCircle className="h-5 w-5 text-brand-600" />
          {msgCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {msgCount > 9 ? '9+' : msgCount}
            </span>
          )}
        </Link>
        {supportTo ? (
          <Link to={supportTo} className="relative rounded-xl p-2 transition hover:bg-brand-50/80" aria-label="Destek">
            <MessageSquare className="h-5 w-5 text-brand-600" />
            {supportCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {supportCount > 9 ? '9+' : supportCount}
              </span>
            )}
          </Link>
        ) : (
          <Link to={notificationsTo} className="relative rounded-xl p-2 transition hover:bg-brand-50/80" aria-label="Bildirimler">
            <Bell className="h-5 w-5 text-brand-600" />
            {notifCount > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-gradient-to-r from-rose-500 to-orange-400 ring-2 ring-white" />
            )}
          </Link>
        )}
        {showMembershipBadge && (
          <Link to="/profile" className="hidden sm:block">
            <MembershipBadge tier={membership} />
          </Link>
        )}
      </div>
    </header>
  )
}

export default memo(TopBar)
