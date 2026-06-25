import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Calendar, MessageSquare,
  BarChart3, LogOut, Activity, Stethoscope, BookOpen, Library, Sparkles, Crown, Package, Wallet, UserPlus,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import BrandLogo from '../ui/BrandLogo'
import PanelMobileMenu from './PanelMobileMenu'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'

const ADMIN_EMOJIS = ['📊', '📈', '⚙️', '👥', '💼', '✅', '🚀', '⭐', '📋', '🔔']

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Genel Bakış', end: true },
  { to: '/admin/members', icon: Users, label: 'Üyeler' },
  { to: '/admin/plans', icon: Package, label: 'Paketler' },
  { to: '/admin/premium', icon: Crown, label: 'Premium Yönetimi' },
  { to: '/admin/applications', icon: UserPlus, label: 'Başvurular' },
  { to: '/admin/library', icon: Library, label: 'Kütüphane' },
  { to: '/admin/staff', icon: Stethoscope, label: 'Kadromuz' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Abonelikler' },
  { to: '/admin/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
  { to: '/admin/sessions', icon: Calendar, label: 'Seanslar' },
  { to: '/admin/support', icon: MessageSquare, label: 'Destek Talepleri' },
  { to: '/admin/blog', icon: BookOpen, label: 'Blog' },
  { to: '/admin/content', icon: Sparkles, label: 'İçerik' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analitik' },
  { to: '/admin/activity', icon: Activity, label: 'Aktivite' },
]

export default function AdminShell() {
  const { logout } = useApp()

  return (
    <div className="admin-panel-bg relative flex min-h-screen overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={ADMIN_EMOJIS} accent="admin" />
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-cream-200 bg-white/90 backdrop-blur-sm lg:flex">
        <div className="border-b border-cream-100 p-5">
          <BrandLogo linkTo="/admin" />
          <span className="mt-3 inline-block rounded-full bg-cream-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Admin Panel
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-cream-900 text-white' : 'text-cream-800 hover:bg-cream-100'
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
          navItems={adminNav}
          brandLink="/admin"
          badge={{ label: 'Admin Panel', className: 'bg-cream-900 text-white' }}
          accent="admin"
          logout={logout}
          headerRight={<span className="text-xs font-medium text-cream-800/50">Admin</span>}
        />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm">
          {BRAND.name} · Yönetim Paneli
        </footer>
      </div>
    </div>
  )
}
