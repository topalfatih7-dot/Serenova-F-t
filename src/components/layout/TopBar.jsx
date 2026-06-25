import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'

export default function TopBar({ title }) {
  const { notifications, user, membership } = useApp()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-200/40 bg-gradient-to-r from-white/90 via-white/85 to-brand-50/50 px-4 py-3 shadow-sm shadow-brand-500/[0.04] backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        {title ? (
          <h1 className="font-display text-lg font-semibold text-cream-900">{title}</h1>
        ) : (
          <p className="text-sm text-cream-800/60">Merhaba, <span className="font-medium text-cream-900">{user.name.split(' ')[0]}</span></p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative rounded-xl p-2 transition hover:bg-brand-50/80">
          <Bell className="h-5 w-5 text-brand-600" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-gradient-to-r from-rose-500 to-orange-400 ring-2 ring-white" />
          )}
        </Link>
        <Link to="/profile" className="hidden sm:block">
          <MembershipBadge tier={membership} />
        </Link>
      </div>
    </header>
  )
}
