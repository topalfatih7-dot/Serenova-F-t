import { Outlet, Navigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Dumbbell, Apple, Settings, ClipboardList, Library,
} from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import TopBar from './TopBar'
import PanelMobileMenu from './PanelMobileMenu'
import ConsentBanner from '../ui/ConsentBanner'
import { useApp } from '../../context/AppContext'
import { BRAND } from '../../config/brand'

const memberNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/schedule/coach', icon: Dumbbell, label: 'Koç Randevuları' },
  { to: '/schedule/dietitian', icon: Apple, label: 'Diyetisyen' },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım' },
  { to: '/library', icon: Library, label: 'Kütüphane' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler' },
  { to: '/support', icon: HelpCircle, label: 'Destek' },
  { to: '/profile', icon: Settings, label: 'Profil' },
]

export default function AppShell() {
  const { isAuthenticated, isAdmin, isStaff, membership, notifications, user, logout } = useApp()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (isStaff) {
    return <Navigate to="/staff" replace />
  }

  const unread = (notifications || []).filter((n) => !n.read).length
  const navItems = membership === 'free'
    ? [...memberNav, { to: '/builder', icon: Crown, label: "Premium'a Geç" }]
    : memberNav

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">
        <PanelMobileMenu
          navItems={navItems}
          brandLink="/dashboard"
          badge={{ label: membership === 'premium' ? 'Premium Üye' : 'Ücretsiz Üye', className: membership === 'premium' ? 'bg-brand-500 text-white' : 'bg-cream-900 text-white' }}
          userName={user?.name}
          accent="member"
          logout={logout}
          headerRight={(
            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-cream-50" aria-label="Bildirimler">
              <Bell className="h-5 w-5 text-cream-800" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />}
            </Link>
          )}
        />
        <div className="hidden lg:block">
          <TopBar />
        </div>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="hidden border-t border-cream-200 bg-white px-6 py-3 text-center text-[10px] text-cream-800/40 lg:block">
          {BRAND.name} · Bu platform tıbbi teşhis veya tedavi sunmaz.
        </footer>
      </div>
      <MobileNav />
      <ConsentBanner />
    </div>
  )
}
