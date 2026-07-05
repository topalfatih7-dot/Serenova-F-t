import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Calendar, MessageSquare, MessageCircle,
  BarChart3, LogOut, Activity, Stethoscope, BookOpen, Library, Sparkles, Crown, Package, Wallet, UserPlus, Loader2,
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
  { to: '/admin/applications', icon: UserPlus, label: 'Başvurular', applicationsBadge: true },
  { to: '/admin/library', icon: Library, label: 'Kütüphane' },
  { to: '/admin/staff', icon: Stethoscope, label: 'Kadromuz' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Abonelikler' },
  { to: '/admin/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
  { to: '/admin/sessions', icon: Calendar, label: 'Seanslar' },
  { to: '/admin/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true },
  { to: '/admin/support', icon: MessageSquare, label: 'Destek Talepleri', supportBadge: true },
  { to: '/admin/blog', icon: BookOpen, label: 'Blog' },
  { to: '/admin/content', icon: Sparkles, label: 'İçerik' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analitik' },
  { to: '/admin/activity', icon: Activity, label: 'Aktivite' },
]

function NavBadge({ count }) {
  if (!count) return null
  return (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function AdminShell() {
  const { logout, loggingOut, adminStaffUnreadCount, pendingApplicationsCount, openSupportTicketsCount } = useApp()

  const navWithBadges = adminNav.map((item) => ({
    ...item,
    badgeCount: item.applicationsBadge
      ? pendingApplicationsCount
      : item.chatBadge
        ? adminStaffUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : 0,
  }))

  return (
    <div className="admin-panel-bg relative flex h-dvh overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={ADMIN_EMOJIS} accent="admin" />
      <aside className="relative hidden w-56 shrink-0 flex-col border-r border-cream-200 bg-white/90 backdrop-blur-sm md:flex lg:w-64">
        <div className="border-b border-cream-100 p-5">
          <BrandLogo linkTo="/admin" />
          <span className="mt-3 inline-block rounded-full bg-cream-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Admin Panel
          </span>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {navWithBadges.map((item) => (
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
              <span className="flex-1">{item.label}</span>
              <NavBadge count={item.badgeCount} />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-cream-100 p-3">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/60 hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <PanelMobileMenu
          navItems={navWithBadges}
          brandLink="/admin"
          badge={{ label: 'Admin Panel', className: 'bg-cream-900 text-white' }}
          accent="admin"
          logout={logout}
          loggingOut={loggingOut}
          headerRight={<span className="text-xs font-medium text-cream-800/50">Admin</span>}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-4 sm:px-10 sm:py-6 lg:px-12">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
        <footer className="shrink-0 border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm">
          {BRAND.name} · Yönetim Paneli
        </footer>
      </div>
    </div>
  )
}
