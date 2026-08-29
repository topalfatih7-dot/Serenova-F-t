import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Loader2 } from 'lucide-react'
import BrandLogo from '../ui/BrandLogo'

function NavBadge({ item, compact = false }) {
  if (!(item.badgeCount > 0)) return null

  const isAlert = item.healthTestBadge
  const text = isAlert ? '!' : item.badgeCount > 9 ? '9+' : item.badgeCount
  const tone = isAlert ? 'bg-amber-500' : 'bg-rose-500'

  if (compact) {
    return (
      <span
        className={`absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold text-white ring-2 ring-white ${tone}`}
      >
        {text}
      </span>
    )
  }

  return (
    <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${tone}`}>
      {text}
    </span>
  )
}

const ACTIVE = {
  member: {
    link: 'nav-active-glow scale-[1.02] font-semibold',
    icon: 'text-brand-700',
    label: 'text-brand-700',
  },
  staff: {
    link: 'bg-brand-500 text-white font-semibold',
    icon: 'text-white',
    label: 'text-white',
  },
  admin: {
    link: 'bg-cream-900 text-white font-semibold',
    icon: 'text-white',
    label: 'text-white',
  },
}

/**
 * Ortak hover-expand sol rail — üye / staff / admin.
 * Spacer dar kalır; rail açılınca içerik üzerine biner.
 */
function PanelSidebar({
  items = [],
  brandLink = '/',
  headerExtra = null,
  userName = '',
  activeVariant = 'member',
  logout,
  loggingOut = false,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const hoverLockedRef = useRef(false)
  const railRef = useRef(null)

  const active = ACTIVE[activeVariant] || ACTIVE.member

  const handleLogout = useCallback(async () => {
    if (loggingOut || !logout) return
    await logout()
    navigate('/login', { replace: true })
  }, [logout, loggingOut, navigate])

  const collapse = useCallback(() => {
    setExpanded(false)
    hoverLockedRef.current = Boolean(railRef.current?.matches(':hover'))
    const focused = document.activeElement
    if (focused instanceof HTMLElement && railRef.current?.contains(focused)) {
      focused.blur()
    }
  }, [])

  useEffect(() => {
    collapse()
  }, [location.pathname, collapse])

  const handleMouseEnter = () => {
    if (hoverLockedRef.current) return
    setExpanded(true)
  }

  const handleMouseLeave = () => {
    hoverLockedRef.current = false
    setExpanded(false)
  }

  const handleFocusCapture = () => {
    if (hoverLockedRef.current) return
    setExpanded(true)
  }

  const handleNavSelect = () => {
    collapse()
  }

  return (
    <div className="relative hidden w-[4.5rem] shrink-0 md:block">
      <aside
        ref={railRef}
        data-expanded={expanded ? 'true' : 'false'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocusCapture}
        className={`absolute inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-brand-200/30 bg-gradient-to-b from-white/95 via-white/90 to-brand-50/40 shadow-xl shadow-brand-500/[0.06] backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-[var(--yf-elevated)]/95 dark:via-[var(--yf-elevated)]/90 dark:to-brand-50/30 ${
          expanded
            ? 'w-64 shadow-2xl shadow-brand-500/10'
            : 'w-[4.5rem]'
        }`}
      >
        <div className={`shrink-0 border-b border-cream-100 py-3.5 transition-[padding] duration-300 ${expanded ? 'px-4' : 'px-2.5'}`}>
          <div
            className={`h-9 overflow-hidden transition-[width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              expanded ? 'mx-0 w-[10.75rem]' : 'mx-auto w-9'
            }`}
          >
            <BrandLogo
              linkTo={brandLink}
              size="sm"
              className="flex h-9 items-center [&_picture]:flex [&_picture]:h-9 [&_picture]:items-center"
              imgClassName="!max-w-none h-9 w-auto shrink-0"
              onNavigate={handleNavSelect}
            />
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
              expanded
                ? 'mt-3 grid-rows-[1fr] opacity-100'
                : 'mt-0 grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              {headerExtra}
              {userName ? (
                <p className={`truncate text-sm text-cream-800/60 ${headerExtra ? 'mt-2' : ''}`}>
                  {userName}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto p-2 lg:space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              onClick={handleNavSelect}
              className={({ isActive }) =>
                `flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  expanded
                    ? 'justify-start gap-2.5 px-2.5 lg:gap-3 lg:px-3 lg:text-sm'
                    : 'justify-center gap-0 px-0'
                } ${
                  isActive
                    ? active.link
                    : `hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-sage-50/50 ${expanded ? 'hover:translate-x-0.5' : ''}`
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex shrink-0 items-center justify-center">
                    <item.icon
                      className={`h-[1.15rem] w-[1.15rem] transition-colors ${
                        isActive ? active.icon : (item.iconTone || 'text-cream-800')
                      }`}
                    />
                    {!expanded && <NavBadge item={item} compact />}
                  </span>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                      expanded
                        ? 'max-w-[12rem] flex-1 opacity-100'
                        : 'max-w-0 flex-1 opacity-0'
                    } ${isActive ? active.label : (item.labelTone || 'text-cream-800')}`}
                  >
                    {item.label}
                  </span>
                  {expanded && (
                    <span className="shrink-0">
                      <NavBadge item={item} />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-cream-100 transition-[padding] duration-300 ${expanded ? 'p-3' : 'p-2'}`}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm text-rose-500/80 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 ${
              expanded ? 'justify-start gap-3 px-3' : 'justify-center gap-0 px-0'
            }`}
          >
            {loggingOut ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <LogOut className="h-4 w-4 shrink-0" />}
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                expanded ? 'max-w-[10rem] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
            </span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default memo(PanelSidebar)
