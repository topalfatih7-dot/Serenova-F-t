import { Outlet, Navigate, Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PanelMobileMenu from './PanelMobileMenu'
import ConsentBanner from '../ui/ConsentBanner'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import OnboardingTutorial from '../ui/OnboardingTutorial'
import { useApp } from '../../context/AppContext'
import { getPlanLabel } from '../../data/membershipPlans'
import { isHealthTestComplete } from '../../data/healthTest'
import { buildMemberNavItems } from '../../config/memberNav'
import { BRAND } from '../../config/brand'

const MEMBER_EMOJIS = ['🏃‍♀️', '🥗', '💪', '🧘‍♀️', '🍎', '💧', '🔥', '❤️', '⚡', '🥑', '🏋️', '🌱']

export default function AppShell() {
  const {
    isAdmin, isStaff, membership, notifications, user, logout, loggingOut, settings, updateSettings,
    chatUnreadCount, notificationUnreadCount, openSupportTicketsCount, packageConfig,
  } = useApp()

  const handleTutorialComplete = () => {
    if (user?.id && !settings?.tutorialSeen) {
      updateSettings?.({ tutorialSeen: true })
    }
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (isStaff) {
    return <Navigate to="/staff" replace />
  }

  const unread = (notifications || []).filter((n) => !n.read).length
  const healthTestIncomplete = user?.id
    && !isHealthTestComplete(user.healthTest, user.gender, packageConfig)

  const navItems = buildMemberNavItems({
    membership,
    chatUnreadCount,
    notificationUnreadCount,
    openSupportTicketsCount,
    healthTestIncomplete,
  })

  return (
    <div className="flex h-dvh overflow-hidden">
      <NoIndexHead />
      <Sidebar healthTestIncomplete={healthTestIncomplete} />
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
          loggingOut={loggingOut}
          headerRight={(
            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-cream-50" aria-label="Bildirimler">
              <Bell className="h-5 w-5 text-cream-800" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />}
            </Link>
          )}
        />
        <div className="hidden md:block">
          <TopBar />
        </div>
        <main className="member-panel-bg relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="pointer-events-none sticky top-0 h-0">
            <div className="relative h-screen w-full overflow-hidden">
              <AnimatedBackground emojis={MEMBER_EMOJIS} accent="member" />
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col px-8 py-4 sm:px-10 sm:py-6 lg:px-12">
            <Outlet />
          </div>
        </main>
        <footer className="hidden border-t border-brand-200/30 bg-gradient-to-r from-white/90 to-brand-50/40 px-6 py-3 text-center text-[10px] text-cream-800/50 md:block">
          {BRAND.name} · Bu platform tıbbi teşhis veya tedavi sunmaz.
        </footer>
      </div>

      <OnboardingTutorial
        userId={user?.id}
        seen={!!settings?.tutorialSeen}
        onComplete={handleTutorialComplete}
      />

      <ConsentBanner />
    </div>
  )
}
