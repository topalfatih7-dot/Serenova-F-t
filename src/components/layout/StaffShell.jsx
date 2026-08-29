import { useMemo, useState, useCallback } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import '../../styles/panel.css'
import { useApp } from '../../context/AppContext'
import PanelSidebar from './PanelSidebar'
import PanelMobileMenu from './PanelMobileMenu'
import TopBar from './TopBar'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'
import { staffRoleMeta } from '../../utils/staffRoles'
import { resolveFirstName } from '../../utils/displayName'
import { buildStaffNavItems } from '../../config/staffNav'
import StaffForcePasswordChange from '../auth/StaffForcePasswordChange'
import { supabase } from '../../services/supabaseClient'
import { isPanelChatPath, isPanelChatThreadPath } from '../../utils/chatLayout'

const STAFF_EMOJIS = ['📋', '💪', '🥗', '📊', '🧘', '⭐', '🎯', '💚', '🏅', '🤝']

export default function StaffShell() {
  const location = useLocation()
  const chatPage = isPanelChatPath(location.pathname)
  const chatThread = isPanelChatThreadPath(location.pathname)
  const {
    staffUser, logout, loggingOut, chatUnreadCount, staffAdminUnreadCount,
    staffCollabUnreadCount, notificationUnreadCount, refresh,
  } = useApp()

  const mustChangePassword = Boolean(staffUser?.data?.tempPasswordIssued)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const handlePasswordChanged = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await supabase
          .from('staff')
          .update({ data: { ...(staffUser?.data || {}), tempPasswordIssued: false } })
          .eq('id', staffUser.id)
      }
    } catch {
      // Güncelleme başarısız olsa bile kullanıcıya devam ettir; bir sonraki girişte yeniden sorar.
    }
    await refresh().catch(() => {})
    setPasswordChanged(true)
  }, [staffUser, refresh])

  const showForceChange = mustChangePassword && !passwordChanged

  const meta = staffRoleMeta(staffUser.role)
  const RoleIcon = meta.icon
  const roleLabel = meta.label
  const unread = notificationUnreadCount || 0

  const staffNav = useMemo(() => buildStaffNavItems({
    role: staffUser.role,
    chatUnreadCount,
    staffAdminUnreadCount,
    staffCollabUnreadCount,
    notificationUnreadCount: unread,
  }), [staffUser.role, chatUnreadCount, staffAdminUnreadCount, staffCollabUnreadCount, unread])

  const displayName = resolveFirstName({
    name: staffUser.name,
    email: staffUser.email,
    fallback: roleLabel,
  })

  const bellLink = (
    <Link to="/staff/notifications" className="relative rounded-lg p-2 hover:bg-cream-50" aria-label="Bildirimler">
      <Bell className="h-5 w-5 text-cream-800" />
      {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />}
    </Link>
  )

  const roleBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      <RoleIcon className="h-3 w-3" /> {roleLabel} Paneli
    </span>
  )

  return (
    <div className="staff-panel-bg relative flex h-dvh overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={STAFF_EMOJIS} accent="staff" />

      {showForceChange && (
        <StaffForcePasswordChange
          staffName={staffUser?.name}
          onDone={handlePasswordChanged}
        />
      )}

      <PanelSidebar
        items={staffNav}
        brandLink="/staff"
        headerExtra={roleBadge}
        userName={displayName}
        activeVariant="staff"
        logout={logout}
        loggingOut={loggingOut}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <PanelMobileMenu
          navItems={staffNav}
          brandLink="/staff"
          badge={{ label: `${roleLabel} Paneli`, icon: RoleIcon, className: 'bg-brand-500 text-white' }}
          userName={displayName}
          accent="staff"
          logout={logout}
          loggingOut={loggingOut}
          headerRight={bellLink}
        />

        <div className="hidden md:block">
          <TopBar
            messagesTo="/staff/messages"
            notificationsTo="/staff/notifications"
            showMembershipBadge={false}
            messagesCount={chatUnreadCount}
            notificationsCount={unread}
            displayName={displayName}
            greetingFallback={roleLabel}
          />
        </div>

        <main
          data-panel-scroll
          className={`flex min-h-0 flex-1 flex-col overscroll-contain ${
            chatPage ? 'overflow-hidden' : 'overflow-y-auto'
          } ${
            chatThread
              ? 'px-0 py-0 md:px-10 md:py-6 lg:px-12'
              : 'px-8 py-4 sm:px-10 sm:py-6 lg:px-12'
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
        <footer className="hidden shrink-0 border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm md:block">
          {BRAND.name} · {roleLabel} Paneli
        </footer>
      </div>
    </div>
  )
}
