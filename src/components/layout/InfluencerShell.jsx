import { useMemo, useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import '../../styles/panel.css'
import { useApp } from '../../context/AppContext'
import PanelSidebar from './PanelSidebar'
import PanelMobileMenu from './PanelMobileMenu'
import TopBar from './TopBar'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'
import { INFLUENCER_NAV } from '../../config/influencerNav'
import { resolveFirstName } from '../../utils/displayName'
import StaffForcePasswordChange from '../auth/StaffForcePasswordChange'
import { updateInfluencerSelfProfile } from '../../services/influencerDb'

const INF_EMOJIS = ['📣', '💫', '🏷️', '📈', '✨', '🎯', '💎', '🌟']

export default function InfluencerShell() {
  const { influencerUser, logout, loggingOut, refresh } = useApp()
  const mustChangePassword = Boolean(influencerUser?.tempPasswordIssued || influencerUser?.data?.tempPasswordIssued)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const handlePasswordChanged = useCallback(async () => {
    await updateInfluencerSelfProfile({
      name: influencerUser?.name,
      phone: influencerUser?.phone,
      instagram: influencerUser?.instagram,
      tempPasswordIssued: false,
    }).catch(() => {})
    await refresh().catch(() => {})
    setPasswordChanged(true)
  }, [influencerUser, refresh])

  const showForceChange = mustChangePassword && !passwordChanged
  const displayName = resolveFirstName({
    name: influencerUser?.name,
    email: influencerUser?.email,
    fallback: 'Influencer',
  })

  const nav = useMemo(() => INFLUENCER_NAV, [])

  const badge = (
    <span className="inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Influencer Panel
    </span>
  )

  return (
    <div className="staff-panel-bg relative flex h-dvh overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={INF_EMOJIS} accent="staff" />

      {showForceChange && (
        <StaffForcePasswordChange
          staffName={influencerUser?.name}
          onDone={handlePasswordChanged}
        />
      )}

      <PanelSidebar
        items={nav}
        brandLink="/influencer"
        headerExtra={badge}
        userName={displayName}
        activeVariant="staff"
        logout={logout}
        loggingOut={loggingOut}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <PanelMobileMenu
          navItems={nav}
          brandLink="/influencer"
          badge={{ label: 'Influencer Panel', className: 'bg-brand-500 text-white' }}
          userName={displayName}
          accent="staff"
          logout={logout}
          loggingOut={loggingOut}
        />

        <div className="hidden md:block">
          <TopBar
            showMembershipBadge={false}
            showMessages={false}
            showNotifications={false}
            displayName={displayName}
            greetingFallback="Influencer"
          />
        </div>

        <main data-panel-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 py-4 sm:px-10 sm:py-6 lg:px-12">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
        <footer className="hidden shrink-0 border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm md:block">
          {BRAND.name} · Influencer Paneli
        </footer>
      </div>
    </div>
  )
}
