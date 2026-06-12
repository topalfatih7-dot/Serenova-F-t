import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Bell, User, Crown } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/schedule/coach', icon: Calendar, label: 'Takvim' },
  { to: '/notifications', icon: Bell, label: 'Bildirim' },
  { to: '/profile', icon: User, label: 'Profil' },
]

export default function MobileNav() {
  const { membership, notifications } = useApp()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cream-200 bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium ${
                isActive ? 'text-brand-600' : 'text-cream-800/50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.to === '/notifications' && unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] text-white">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
        {membership === 'free' && (
          <NavLink to="/builder" className="flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium text-gold-500">
            <Crown className="h-5 w-5" />
            Premium
          </NavLink>
        )}
      </div>
    </nav>
  )
}
