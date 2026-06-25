import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Dumbbell, Apple, Settings, LogOut, ClipboardList, Library,
  CalendarDays, Flame, Wallet,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import BrandLogo from '../ui/BrandLogo'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/calendar', icon: CalendarDays, label: 'Takvim' },
  { to: '/calorie', icon: Flame, label: 'Kalori Hesapla' },
  { to: '/schedule/coach', icon: Dumbbell, label: 'Koç Randevuları' },
  { to: '/schedule/dietitian', icon: Apple, label: 'Diyetisyen' },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım' },
  { to: '/library', icon: Library, label: 'Kütüphane' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler' },
  { to: '/support', icon: HelpCircle, label: 'Destek' },
  { to: '/profile/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
  { to: '/profile', icon: Settings, label: 'Profil' },
]

export default function Sidebar() {
  const { user, membership, membershipStatus, logout } = useApp()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brand-200/30 bg-gradient-to-b from-white/95 via-white/90 to-brand-50/40 shadow-xl shadow-brand-500/[0.06] backdrop-blur-xl lg:flex">
      <div className="shrink-0 border-b border-cream-100 p-5">
        <BrandLogo linkTo="/dashboard" />
        <div className="mt-3">
          <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
        </div>
        <p className="mt-2 truncate text-sm text-cream-800/60">{user.name}</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive ? 'nav-active-glow font-semibold scale-[1.02]' : 'text-cream-800 hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-violet-50/50 hover:translate-x-0.5'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
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
