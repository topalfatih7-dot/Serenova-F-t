import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserRound, LayoutDashboard, LogIn, UserPlus, Home, Sparkles, Trophy, BookOpen, LifeBuoy, Menu, X, Users, ChevronDown, Dumbbell, Apple, Stethoscope } from 'lucide-react'
import ConsentBanner from '../ui/ConsentBanner'
import BrandLogo from '../ui/BrandLogo'
import { BRAND } from '../../config/brand'
import { useApp } from '../../context/AppContext'
import { scrollToContactSection } from '../../utils/scrollToContact'

const baseLinks = [
  { to: '/', label: 'Ana Sayfa', icon: Home },
  { to: '/membership', label: 'Üyelikler', icon: Sparkles },
  { to: '/stories', label: 'Hikayeler', icon: Trophy },
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: 'contact', label: 'Bize Ulaşın', icon: LifeBuoy },
]

const teamSubLinks = [
  { to: '/team/coaches', label: 'Koçlar', icon: Dumbbell, color: 'text-brand-600 bg-brand-50' },
  { to: '/team/dietitians', label: 'Diyetisyenler', icon: Apple, color: 'text-sage-600 bg-sage-50' },
  { to: '/team/doctors', label: 'Doktorlar', icon: Stethoscope, color: 'text-cream-700 bg-cream-100' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [teamDropOpen, setTeamDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setTeamDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const { isAuthenticated, isAdmin, isStaff, user, staffUser } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const firstName = (user?.name || staffUser?.name || '').trim().split(' ')[0]
  const contactLink = baseLinks[baseLinks.length - 1]
  const publicLinks = isAuthenticated && !isAdmin && !isStaff
    ? [...baseLinks.slice(0, -1), { to: '/support', label: 'Destek', icon: LifeBuoy }, contactLink]
    : baseLinks

  const goToContact = useCallback((closeMenu = false) => {
    if (closeMenu) setMenuOpen(false)
    if (pathname === '/') {
      scrollToContactSection()
      window.history.replaceState(null, '', '/#bize-ulasin')
      return
    }
    navigate('/#bize-ulasin')
  }, [pathname, navigate])

  const renderNavLink = (l, onClickExtra) => {
    if (l.to === 'contact') {
      return (
        <button
          key="contact"
          type="button"
          onClick={() => { goToContact(); onClickExtra?.() }}
          className="group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-cream-800 transition hover:text-brand-600"
        >
          <l.icon className="relative h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="relative">{l.label}</span>
        </button>
      )
    }
    const active = pathname === l.to
    return (
      <Link
        key={l.to}
        to={l.to}
        onClick={onClickExtra}
        className={`group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
          active ? 'text-brand-700' : 'text-cream-800 hover:text-brand-600'
        }`}
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-100/90 to-sage-100/90 shadow-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <l.icon className="relative h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="relative">{l.label}</span>
      </Link>
    )
  }

  const renderMobileLink = (l) => {
    if (l.to === 'contact') {
      return (
        <button
          key="contact"
          type="button"
          onClick={() => goToContact(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-cream-800 transition hover:bg-cream-100"
        >
          <l.icon className="h-5 w-5" />
          {l.label}
        </button>
      )
    }
    return (
      <Link
        key={l.to}
        to={l.to}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === l.to ? 'bg-brand-100/70 text-brand-700' : 'text-cream-800 hover:bg-cream-100'}`}
      >
        <l.icon className="h-5 w-5" />
        {l.label}
      </Link>
    )
  }

  return (
    <div className="wellness-mesh-bg min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 shadow-sm shadow-brand-900/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo />
          <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/50 p-1 shadow-inner shadow-brand-900/[0.02] backdrop-blur md:flex">
            {publicLinks.map((l) => renderNavLink(l))}
            <div ref={dropRef} className="relative">
              <button
                type="button"
                onClick={() => setTeamDropOpen((v) => !v)}
                className={`group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  teamDropOpen ? 'text-brand-700' : 'text-cream-800 hover:text-brand-600'
                }`}
              >
                {teamDropOpen && (
                  <motion.span layoutId="nav-pill-team" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-100/90 to-sage-100/90 shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <Users className="relative h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="relative">Kadromuz</span>
                <ChevronDown className={`relative h-3.5 w-3.5 transition-transform ${teamDropOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {teamDropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-xl shadow-cream-900/10 backdrop-blur-xl"
                  >
                    {teamSubLinks.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setTeamDropOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream-800 transition hover:bg-cream-50"
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sub.color}`}>
                          <sub.icon className="h-4 w-4" />
                        </span>
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
          <div className="hidden items-center gap-2.5 md:flex">
            {isAuthenticated ? (
              isAdmin ? (
                <Link to="/admin" className="flex items-center gap-2 rounded-full bg-cream-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cream-800 hover:shadow-md">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </Link>
              ) : isStaff ? (
                <Link to="/staff" className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md">
                  <LayoutDashboard className="h-4 w-4" />
                  {firstName ? `Panelim · ${firstName}` : 'Panelim'}
                </Link>
              ) : (
                <Link to="/profile" className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md">
                  <UserRound className="h-4 w-4" />
                  {firstName ? `Profil · ${firstName}` : 'Profil'}
                </Link>
              )
            ) : (
              <>
                <Link to="/login" className="btn-wellness-outline !py-2.5 !px-4 !text-sm">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/onboarding" className="btn-wellness !py-2.5 !px-5 !text-sm">
                    <UserPlus className="h-4 w-4" />
                    Kayıt Ol
                  </Link>
                </motion.div>
              </>
            )}
          </div>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 bg-white transition md:hidden ${
              menuOpen ? 'text-brand-600' : 'hamburger-glow text-brand-600'
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/50 bg-white/90 px-4 backdrop-blur-xl md:hidden"
            >
              <div className="py-3">
                {publicLinks.map((l) => renderMobileLink(l))}
                <div className="mt-1">
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-cream-800/40">Kadromuz</p>
                  {teamSubLinks.map((sub) => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-cream-800 transition hover:bg-cream-100"
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sub.color}`}>
                        <sub.icon className="h-4 w-4" />
                      </span>
                      {sub.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-2 border-t border-cream-200 pt-3">
                  {isAuthenticated ? (
                    isAdmin ? (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-full bg-cream-900 py-3 text-center text-sm font-semibold text-white">
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    ) : isStaff ? (
                      <Link to="/staff" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-white">
                        <LayoutDashboard className="h-4 w-4" />
                        {firstName ? `Panelim · ${firstName}` : 'Panelim'}
                      </Link>
                    ) : (
                      <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-white">
                        <UserRound className="h-4 w-4" />
                        {firstName ? `Profil · ${firstName}` : 'Profil'}
                      </Link>
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-1.5 rounded-full border border-cream-200 bg-white py-3 text-center text-sm font-semibold text-cream-800">
                        <LogIn className="h-4 w-4" />
                        Giriş Yap
                      </Link>
                      <Link to="/onboarding" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 py-3 text-center text-sm font-semibold text-white shadow-md">
                        <UserPlus className="h-4 w-4" />
                        Kayıt Ol
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <Outlet />
      <footer className="relative overflow-hidden border-t border-brand-800/30 bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 py-14 text-cream-100">
        <div aria-hidden className="wellness-orb -left-20 top-0 h-64 w-64 bg-brand-500/20" />
        <div aria-hidden className="wellness-orb -right-16 bottom-0 h-72 w-72 bg-sage-500/15" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-xl font-bold text-white">{BRAND.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{BRAND.tagline}</p>
              <p className="mt-4 text-xs text-white/40">Güvenli, destekleyici ve sürdürülebilir dönüşüm.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Platform</p>
              <div className="mt-3 space-y-2 text-sm text-cream-100/60">
                <Link to="/membership" className="block hover:text-white">Üyelikler</Link>
                <Link to="/blog" className="block hover:text-white">Blog</Link>
                <button type="button" onClick={() => goToContact()} className="block text-left hover:text-white">
                  Bize Ulaşın
                </button>
                {isAuthenticated && !isAdmin && !isStaff && (
                  <Link to="/support" className="block hover:text-white">Destek</Link>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Yasal Bilgilendirme</p>
              <p className="mt-3 text-xs leading-relaxed text-cream-100/40">
                Bu platform koçluk ve wellness hizmetidir; tıbbi teşhis veya tedavi sunmaz.
                Beslenme önerileri genel rehberlik amaçlıdır. Sağlık sorunlarınız için doktorunuza danışın.
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-cream-100/30">© 2026 {BRAND.name} · KVKK uyumlu</p>
        </div>
      </footer>
      <ConsentBanner />
    </div>
  )
}
