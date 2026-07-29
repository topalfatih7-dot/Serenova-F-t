import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import PanelSidebar from './PanelSidebar'
import PanelMobileMenu from './PanelMobileMenu'
import TopBar from './TopBar'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'
import { buildAdminNavItems } from '../../config/adminNav'

const ADMIN_EMOJIS = ['📊', '📈', '⚙️', '👥', '💼', '✅', '🚀', '⭐', '📋', '🔔']

export default function AdminShell() {
  const {
    logout, loggingOut, adminStaffUnreadCount, pendingApplicationsCount, openSupportTicketsCount,
  } = useApp()

  const navWithBadges = useMemo(() => buildAdminNavItems({
    pendingApplicationsCount,
    adminStaffUnreadCount,
    openSupportTicketsCount,
  }), [pendingApplicationsCount, adminStaffUnreadCount, openSupportTicketsCount])

  const adminBadge = (
    <span className="inline-block rounded-full bg-cream-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Admin Panel
    </span>
  )

  return (
    <div className="admin-panel-bg relative flex h-dvh overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={ADMIN_EMOJIS} accent="admin" />

      <PanelSidebar
        items={navWithBadges}
        brandLink="/admin"
        headerExtra={adminBadge}
        activeVariant="admin"
        logout={logout}
        loggingOut={loggingOut}
      />

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

        <div className="hidden md:block">
          <TopBar
            messagesTo="/admin/messages"
            supportTo="/admin/support"
            supportCount={openSupportTicketsCount}
            showMembershipBadge={false}
            messagesCount={adminStaffUnreadCount}
            greetingFallback="Admin"
            displayName="Admin"
          />
        </div>

        <main data-panel-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 py-4 sm:px-10 sm:py-6 lg:px-12">
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
