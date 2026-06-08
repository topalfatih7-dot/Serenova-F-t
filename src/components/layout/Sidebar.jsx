import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Dumbbell, Apple, Star, Settings, LogOut, ClipboardList,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import BrandLogo from '../ui/BrandLogo'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/schedule/coach', icon: Dumbbell, label: 'Koç Randevuları' },
  { to: '/schedule/dietitian', icon: Apple, label: 'Diyetisyen' },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler' },
  { to: '/stories', icon: Star, label: 'Başarı Hikayeleri' },
  { to: '/support', icon: HelpCircle, label: 'Destek' },
  { to: '/profile', icon: Settings, label: 'Profil' },
]

export default function Sidebar() {
  const { user, membership, membershipStatus, logout } = useApp()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-cream-200 bg-white/80 backdrop-blur-sm lg:flex">
      <div className="border-b border-cream-100 p-5">
        <BrandLogo linkTo="/dashboard" />
        <div className="mt-3">
          <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
        </div>
        <p className="mt-2 truncate text-sm text-cream-800/60">{user.name}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-cream-800 hover:bg-cream-50'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        {membership === 'free' && (
          <NavLink
            to="/builder"
            className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2.5 text-sm font-semibold text-white"
          >
            <Crown className="h-4 w-4" /> Premium&apos;a Geç
          </NavLink>
        )}
      </nav>

      <div className="border-t border-cream-100 p-3">
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
