import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, Loader2 } from 'lucide-react'
import BrandLogo from '../ui/BrandLogo'

const ACCENTS = {
  admin: 'bg-cream-900 text-white',
  staff: 'bg-brand-500 text-white',
  member: 'bg-brand-50 text-brand-700',
}

export default function PanelMobileMenu({
  navItems = [],
  brandLink = '/',
  badge = null,
  userName = '',
  accent = 'member',
  logout,
  loggingOut = false,
  headerRight = null,
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const activeClass = ACCENTS[accent] || ACCENTS.member

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = useCallback(async () => {
    if (loggingOut || !logout) return
    setOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }, [logout, loggingOut, navigate])

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream-200 text-cream-800 hover:bg-cream-50"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo linkTo={brandLink} size="sm" />
        </div>
        <div className="flex items-center gap-2">{headerRight}</div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-cream-900/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-r border-brand-200/30 bg-gradient-to-b from-white/95 via-white/90 to-brand-50/40 shadow-xl shadow-brand-500/[0.06] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-cream-100 p-4">
                <BrandLogo linkTo={brandLink} size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-cream-800/60 hover:bg-cream-50"
                  aria-label="Menüyü kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {(badge || userName) && (
                <div className="border-b border-cream-100 px-4 py-3">
                  {badge && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className || 'bg-cream-900 text-white'}`}>
                      {badge.icon && <badge.icon className="h-3 w-3" />} {badge.label}
                    </span>
                  )}
                  {userName && <p className="mt-2 truncate text-sm text-cream-800/60">{userName}</p>}
                </div>
              )}

              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? activeClass
                          : 'hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-sage-50/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-inherit' : (item.iconTone || 'text-cream-800')
                          }`}
                        />
                        <span className={`flex-1 ${isActive ? '' : (item.labelTone || 'text-cream-800')}`}>
                          {item.label}
                        </span>
                        {item.badgeCount > 0 && (
                          <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${
                            item.healthTestBadge ? 'bg-amber-500' : 'bg-rose-500'
                          }`}>
                            {item.healthTestBadge ? '!' : item.badgeCount > 9 ? '9+' : item.badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {logout && (
                <div className="border-t border-cream-100 p-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-500/80 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
