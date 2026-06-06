import { Link } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'

export default function TopBar({ onMenuClick, title }) {
  const { notifications, user, membership } = useApp()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-200 bg-white/90 px-4 py-3 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-lg p-2 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        {title ? (
          <h1 className="font-display text-lg font-semibold text-cream-900">{title}</h1>
        ) : (
          <p className="text-sm text-cream-800/60">Merhaba, <span className="font-medium text-cream-900">{user.name.split(' ')[0]}</span></p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-cream-50">
          <Bell className="h-5 w-5 text-cream-800" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-500" />
          )}
        </Link>
        <Link to="/profile" className="hidden sm:block">
          <MembershipBadge tier={membership} />
        </Link>
      </div>
    </header>
  )
}
