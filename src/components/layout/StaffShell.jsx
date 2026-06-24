import { useMemo } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, LogOut, Library, List, Wallet } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import BrandLogo from '../ui/BrandLogo'
import PanelMobileMenu from './PanelMobileMenu'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'
import { staffRoleMeta } from '../../utils/staffRoles'

const STAFF_EMOJIS = ['📋', '💪', '🥗', '📊', '🧘', '⭐', '🎯', '💚', '🏅', '🤝']

function staffNavForRole(role) {
  const base = [
    { to: '/staff', icon: LayoutDashboard, label: 'Genel Bakış', end: true },
    { to: '/staff/clients', icon: Users, label: 'Danışanlarım' },
  ]
  if (role === 'dietitian') {
    return [
      ...base,
      { to: '/staff/lists', icon: List, label: 'Listeler' },
      { to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
    ]
  }
  return [
    ...base,
    { to: '/staff/programs', icon: ClipboardList, label: 'Programlar' },
    { to: '/staff/library', icon: Library, label: 'Kütüphane' },
    { to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
  ]
}

export default function StaffShell() {
  const { staffUser, logout } = useApp()

  const meta = staffRoleMeta(staffUser.role)
  const RoleIcon = meta.icon
  const roleLabel = meta.label
  const staffNav = useMemo(() => staffNavForRole(staffUser.role), [staffUser.role])

  return (
    <div className="staff-panel-bg relative flex min-h-screen overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={STAFF_EMOJIS} accent="staff" />
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-cream-200 bg-white/90 backdrop-blur-sm lg:flex">
        <div className="border-b border-cream-100 p-5">
          <BrandLogo linkTo="/staff" />
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            <RoleIcon className="h-3 w-3" /> {roleLabel} Paneli
          </span>
          {staffUser.name && <p className="mt-3 truncate text-sm text-cream-800/60">{staffUser.name}</p>}
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {staffNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-cream-800 hover:bg-cream-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-cream-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/60 hover:bg-cream-50"
          >
            <LogOut className="h-4 w-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col">
        <PanelMobileMenu
          navItems={staffNav}
          brandLink="/staff"
          badge={{ label: `${roleLabel} Paneli`, icon: RoleIcon, className: 'bg-brand-500 text-white' }}
          userName={staffUser.name}
          accent="staff"
          logout={logout}
          headerRight={<span className="text-xs font-medium text-cream-800/50">{roleLabel}</span>}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm">
          {BRAND.name} · {roleLabel} Paneli
        </footer>
      </div>
    </div>
  )
}
