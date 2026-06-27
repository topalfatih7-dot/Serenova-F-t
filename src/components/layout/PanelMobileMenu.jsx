import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut } from 'lucide-react'
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
  headerRight = null,
}) {
  const [open, setOpen] = useState(false)
  const activeClass = ACCENTS[accent] || ACCENTS.member

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
              className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-r border-cream-200 bg-white shadow-xl"
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
                        isActive ? activeClass : 'text-cream-800 hover:bg-cream-100'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badgeCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              {logout && (
                <div className="border-t border-cream-100 p-3">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); logout() }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/70 hover:bg-cream-50"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
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
