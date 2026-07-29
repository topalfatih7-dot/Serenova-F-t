import { memo } from 'react'
import { useAuth, useActions } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import { resolveFirstName } from '../../utils/displayName'
import { buildMemberNavItems } from '../../config/memberNav'
import PanelSidebar from './PanelSidebar'

/** Üye paneli — PanelSidebar sarmalayıcısı (mevcut import yolu korunur). */
function Sidebar({ healthTestIncomplete = false }) {
  const {
    user, membership, membershipStatus, loggingOut,
    chatUnreadCount, notificationUnreadCount, openSupportTicketsCount,
  } = useAuth()
  const { logout } = useActions()

  const displayName = resolveFirstName({ name: user?.name, email: user?.email })

  const items = buildMemberNavItems({
    membership,
    chatUnreadCount,
    notificationUnreadCount,
    openSupportTicketsCount,
    healthTestIncomplete,
  })

  return (
    <PanelSidebar
      items={items}
      brandLink="/dashboard"
      headerExtra={(
        <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
      )}
      userName={displayName}
      activeVariant="member"
      logout={logout}
      loggingOut={loggingOut}
    />
  )
}

export default memo(Sidebar)
