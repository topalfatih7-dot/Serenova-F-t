import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Dumbbell, Apple, Settings, LogOut, ClipboardList, Library,
  CalendarDays, Flame, Wallet, MessageCircle, Stethoscope,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import BrandLogo from '../ui/BrandLogo'
import { resolveFirstName } from '../../utils/displayName'

const navItems = [
  { to: '/profile', icon: Settings, label: 'Profil' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/calendar', icon: CalendarDays, label: 'Takvim' },
  { to: '/calorie', icon: Flame, label: 'Kalori Hesapla' },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true },
  { to: '/schedule/coach', icon: Dumbbell, label: 'Koç Randevuları', compact: true },
  { to: '/schedule/dietitian', icon: Apple, label: 'Diyetisyen Randevuları', compact: true },
  { to: '/schedule/doctor', icon: Stethoscope, label: 'Doktor Randevuları', compact: true },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım' },
  { to: '/library', icon: Library, label: 'Kütüphane' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler', notificationsBadge: true },
  { to: '/support', icon: HelpCircle, label: 'Destek', supportBadge: true },
  { to: '/profile/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
]

export default function Sidebar() {
  const {
    user, membership, membershipStatus, logout,
    chatUnreadCount, notificationUnreadCount, openSupportTicketsCount,
  } = useApp()

  const displayName = resolveFirstName({ name: user?.name, email: user?.email })

  const itemsWithBadges = navItems.map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.notificationsBadge
        ? notificationUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : 0,
  }))

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-brand-200/30 bg-gradient-to-b from-white/95 via-white/90 to-brand-50/40 shadow-xl shadow-brand-500/[0.06] backdrop-blur-xl md:flex lg:w-64">
      <div className="shrink-0 border-b border-cream-100 p-4 lg:p-5">
        <BrandLogo linkTo="/dashboard" />
        <div className="mt-3">
          <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
        </div>
        <p className="mt-2 truncate text-sm text-cream-800/60">{displayName}</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2.5 lg:space-y-1 lg:p-3">
        {itemsWithBadges.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-200 lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm ${
                isActive ? 'nav-active-glow font-semibold scale-[1.02]' : 'text-cream-800 hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-violet-50/50 hover:translate-x-0.5'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className={`flex-1 whitespace-nowrap ${item.compact ? 'text-[13px]' : ''}`}>{item.label}</span>
            {item.badgeCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {item.badgeCount > 9 ? '9+' : item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
        {membership === 'free' && (
          <NavLink
            to="/membership"
            className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-500 via-violet-500 to-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:scale-[1.02] hover:shadow-xl"
          >
            <Crown className="h-4 w-4" /> Planları İncele
          </NavLink>
        )}
      </nav>

      <div className="shrink-0 border-t border-cream-100 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/60 hover:bg-cream-50 hover:text-cream-900"
        >
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
