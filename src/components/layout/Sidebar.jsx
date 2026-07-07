import { NavLink } from 'react-router-dom'
import { LogOut, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import MembershipBadge from '../ui/MembershipBadge'
import BrandLogo from '../ui/BrandLogo'
import { resolveFirstName } from '../../utils/displayName'
import { buildMemberNavItems } from '../../config/memberNav'

export default function Sidebar({ healthTestIncomplete = false }) {
  const {
    user, membership, membershipStatus, logout, loggingOut,
    chatUnreadCount, notificationUnreadCount, openSupportTicketsCount,
  } = useApp()

  const displayName = resolveFirstName({ name: user?.name, email: user?.email })

  const itemsWithBadges = buildMemberNavItems({
    membership,
    chatUnreadCount,
    notificationUnreadCount,
    openSupportTicketsCount,
    healthTestIncomplete,
  })

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-brand-200/30 bg-gradient-to-b from-white/95 via-white/90 to-brand-50/40 shadow-xl shadow-brand-500/[0.06] backdrop-blur-xl md:flex lg:w-72">
      <div className="shrink-0 border-b border-cream-100 p-4 lg:p-5">
        <BrandLogo linkTo="/dashboard" />
        <div className="mt-3">
          <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
        </div>
        <p className="mt-2 truncate text-sm text-cream-800/60">{displayName}</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5 lg:space-y-1.5 lg:p-3">
        {itemsWithBadges.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold leading-snug transition-all duration-200 lg:gap-3.5 lg:px-3.5 lg:py-3 lg:text-base ${
                isActive ? 'nav-active-glow scale-[1.01]' : 'text-cream-900/85 hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-violet-50/50 hover:translate-x-0.5'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0 lg:h-[1.35rem] lg:w-[1.35rem]" />
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
            {item.badgeCount > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${
                item.healthTestBadge ? 'bg-amber-500' : 'bg-rose-500'
              }`}>
                {item.healthTestBadge ? '!' : item.badgeCount > 9 ? '9+' : item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-cream-100 p-3">
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/60 hover:bg-cream-50 hover:text-cream-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  )
}
