import { Outlet, Navigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Dumbbell, Apple, Settings, ClipboardList, Library, CalendarDays, Flame, Wallet,
} from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PanelMobileMenu from './PanelMobileMenu'
import ConsentBanner from '../ui/ConsentBanner'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { useApp } from '../../context/AppContext'
import { getPlanLabel } from '../../data/membershipPlans'
import { BRAND } from '../../config/brand'

const MEMBER_EMOJIS = ['🏃‍♀️', '🥗', '💪', '🧘‍♀️', '🍎', '💧', '🔥', '❤️', '⚡', '🥑', '🏋️', '🌱']

const memberNav = [
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

export default function AppShell() {
  const { isAdmin, isStaff, membership, notifications, user, logout } = useApp()

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (isStaff) {
    return <Navigate to="/staff" replace />
  }

  const unread = (notifications || []).filter((n) => !n.read).length
  const navItems = membership === 'free'
    ? [...memberNav, { to: '/membership', icon: Crown, label: 'Planları İncele' }]
    : memberNav

  return (
    <div className="flex h-screen overflow-hidden">
      <NoIndexHead />
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PanelMobileMenu
          navItems={navItems}
          brandLink="/dashboard"
          badge={{
            label: membership === 'free' ? 'Ücretsiz Üye' : `${getPlanLabel(membership)} Üye`,
            className: membership === 'free' ? 'bg-cream-900 text-white' : 'bg-brand-500 text-white',
          }}
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
        <main className="member-panel-bg relative flex-1 overflow-y-auto">
          <div className="pointer-events-none sticky top-0 h-0">
            <div className="relative h-screen w-full overflow-hidden">
              <AnimatedBackground emojis={MEMBER_EMOJIS} accent="member" />
            </div>
          </div>
          <div className="relative p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
        <footer className="hidden border-t border-cream-200 bg-white px-6 py-3 text-center text-[10px] text-cream-800/40 lg:block">
          {BRAND.name} · Bu platform tıbbi teşhis veya tedavi sunmaz.
        </footer>
      </div>
      <ConsentBanner />
    </div>
  )
}
