import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, LogOut, Dumbbell, Apple } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import BrandLogo from '../ui/BrandLogo'
import { BRAND } from '../../config/brand'

const staffNav = [
  { to: '/staff', icon: LayoutDashboard, label: 'Genel Bakış', end: true },
  { to: '/staff/clients', icon: Users, label: 'Danışanlarım' },
  { to: '/staff/programs', icon: ClipboardList, label: 'Programlar' },
]

export default function StaffShell() {
  const { isStaff, staffUser, logout } = useApp()

  if (!isStaff) {
    return <Navigate to="/login" replace />
  }

  const isCoach = staffUser.role === 'coach'
  const RoleIcon = isCoach ? Dumbbell : Apple
  const roleLabel = isCoach ? 'Koç' : 'Diyetisyen'

  return (
    <div className="flex min-h-screen bg-cream-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cream-200 bg-white lg:flex">
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

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-cream-200 bg-white px-4 py-3 sm:px-6 lg:hidden">
          <BrandLogo linkTo="/staff" size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-cream-800/50">{roleLabel}</span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-cream-200 px-2.5 py-1.5 text-xs font-medium text-cream-800/70 hover:bg-cream-50"
            >
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
        </header>

        <nav className="flex gap-1 border-b border-cream-200 bg-white px-2 py-2 lg:hidden">
          {staffNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium ${
                  isActive ? 'bg-brand-500 text-white' : 'text-cream-800/70'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-cream-200 bg-white px-6 py-3 text-center text-[10px] text-cream-800/40">
          {BRAND.name} · {roleLabel} Paneli
        </footer>
      </div>
    </div>
  )
}
