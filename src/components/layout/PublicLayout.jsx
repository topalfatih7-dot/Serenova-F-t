import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserRound, LayoutDashboard, LogIn, UserPlus, Home, Sparkles, BookOpen, LifeBuoy, Menu, X, Users, Dumbbell, Apple, Stethoscope, Building2, Compass, Trophy, HeartHandshake } from 'lucide-react'
import PromoBanner from '../landing/PromoBanner'
import ConsentBanner from '../ui/ConsentBanner'
import BrandLogo from '../ui/BrandLogo'
import ScrollToTop from './ScrollToTop'
import FooterSocialLinks from './FooterSocialLinks'
import NavDropdown from './NavDropdown'
import PublicRouteSeo from '../seo/PublicRouteSeo'
import { BRAND } from '../../config/brand'
import { useApp } from '../../context/AppContext'
import { hasRegisteredMember } from '../../utils/memberProfile'
import { scrollToContactSection } from '../../utils/scrollToContact'
import { LEGAL_FOOTER_PARAGRAPHS } from '../../data/legalDocuments'
import { LegalFooterParagraph } from '../legal/LegalFooterParagraph'
import { preloadTeamHero } from '../../utils/teamHeroImages'

const guestLinks = [
  { to: '/', label: 'Ana Sayfa', icon: Home },
  { to: '/membership', label: 'Üyelikler', icon: Sparkles },
  { to: '/corporate', label: 'Kurumsal', icon: Building2 },
]

const discoverSubLinks = [
  { to: '/online-diyetisyen', label: 'Online Diyetisyen', icon: Apple, color: 'text-sage-600 bg-sage-50' },
  { to: '/online-kocluk', label: 'Online Koçluk', icon: Dumbbell, color: 'text-brand-600 bg-brand-50' },
  { to: '/hakkimizda', label: 'Hakkımızda', icon: HeartHandshake, color: 'text-sage-600 bg-sage-50' },
  { to: '/stories', label: 'Başarı Hikayeleri', icon: Trophy, color: 'text-warm-500 bg-warm-50' },
  { to: '/blog', label: 'Blog', icon: BookOpen, color: 'text-brand-600 bg-brand-50' },
]

const memberExtraLinks = [
  { to: '/support', label: 'Destek', icon: LifeBuoy },
]

const teamSubLinks = [
  {
    to: '/team/coaches',
    label: 'Koçlar',
    icon: Dumbbell,
    color: 'text-brand-600 bg-brand-50',
    onPrefetch: () => preloadTeamHero('coaches'),
  },
  {
    to: '/team/dietitians',
    label: 'Diyetisyenler',
    icon: Apple,
    color: 'text-sage-600 bg-sage-50',
    onPrefetch: () => preloadTeamHero('dietitians'),
  },
  {
    to: '/team/doctors',
    label: 'Doktorlar',
    icon: Stethoscope,
    color: 'text-cream-700 bg-cream-100',
    onPrefetch: () => preloadTeamHero('doctors'),
  },
]

const teamDropdownFooter = {
  to: '/team/apply',
  label: 'Kadromuza Katıl',
  icon: UserPlus,
  highlight: true,
}

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const navRef = useRef(null)

  const closeDropdown = useCallback(() => setOpenDropdown(null), [])

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { isAuthenticated, isAdmin, isStaff, user, staffUser } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpenDropdown(null)
  }
  const firstName = (user?.name || staffUser?.name || '').trim().split(' ')[0]

  // Kayıt/ödeme akışı sırasında (Stripe'a yönlendirilmeden önce) gerçek bir üye satırı
  // oluşmadan bir auth oturumu açılıyor (bkz. ensureAuthForRegistration). Header bu ara
  // durumda "Profil · İsim" göstermemeli — ödeme tamamlanıp üyelik oluşana kadar misafir
  // gibi davranmalı. Admin/staff bu duruma girmez (onlar members tablosunu kullanmaz).
  const isFullyRegistered = isAuthenticated && (isAdmin || isStaff || hasRegisteredMember(user))

  const publicLinks = isFullyRegistered && !isAdmin && !isStaff
    ? [...guestLinks.slice(0, 2), ...memberExtraLinks, ...guestLinks.slice(2)]
    : guestLinks

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
    const active = pathname === l.to || (l.to !== '/' && pathname.startsWith(`${l.to}/`))
    return (
      <Link
        key={l.to}
        to={l.to}
        onClick={() => {
          closeDropdown()
          onClickExtra?.()
        }}
        className={`group relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium transition xl:px-3.5 xl:text-sm ${
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

  const renderMobileLink = (l) => (
    <Link
      key={l.to}
      to={l.to}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === l.to || pathname.startsWith(`${l.to}/`) ? 'bg-brand-100/70 text-brand-700' : 'text-cream-800 hover:bg-cream-100'}`}
    >
      <l.icon className="h-5 w-5" />
      {l.label}
    </Link>
  )

  return (
    <div className="wellness-mesh-bg min-h-screen">
      <ScrollToTop />
      <PublicRouteSeo />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ana içeriğe atla
      </a>
      <PromoBanner />
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 shadow-sm shadow-brand-900/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo onNavigate={closeDropdown} />
          <nav ref={navRef} aria-label="Ana menü" className="hidden items-center gap-0.5 rounded-full border border-white/80 bg-white/50 p-1 shadow-inner shadow-brand-900/[0.02] backdrop-blur lg:flex xl:gap-1">
            {publicLinks.map((l) => renderNavLink(l))}
            <NavDropdown
              label="Keşfet"
              icon={Compass}
              items={discoverSubLinks}
              isOpen={openDropdown === 'discover'}
              onToggle={() => setOpenDropdown((v) => (v === 'discover' ? null : 'discover'))}
              onClose={() => setOpenDropdown(null)}
              layoutId="nav-pill-discover"
              pathname={pathname}
              activePaths={['/online-diyetisyen', '/online-kocluk', '/hakkimizda', '/stories', '/blog']}
            />
            <NavDropdown
              label="Kadromuz"
              icon={Users}
              items={teamSubLinks}
              footer={teamDropdownFooter}
              isOpen={openDropdown === 'team'}
              onToggle={() => setOpenDropdown((v) => (v === 'team' ? null : 'team'))}
              onClose={() => setOpenDropdown(null)}
              layoutId="nav-pill-team"
              pathname={pathname}
              activePaths={['/team']}
            />
          </nav>
          <div className="hidden items-center gap-2 lg:flex xl:gap-2.5">
            {isFullyRegistered ? (
              isAdmin ? (
                <Link to="/admin" onClick={closeDropdown} className="flex items-center gap-2 rounded-full bg-cream-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cream-800 hover:shadow-md">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </Link>
              ) : isStaff ? (
                <Link to="/staff" onClick={closeDropdown} className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md">
                  <LayoutDashboard className="h-4 w-4" />
                  {firstName ? `Panelim · ${firstName}` : 'Panelim'}
                </Link>
              ) : (
                <Link to="/profile" onClick={closeDropdown} className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md">
                  <UserRound className="h-4 w-4" />
                  {firstName ? `Profil · ${firstName}` : 'Profil'}
                </Link>
              )
            ) : (
              <>
                <Link to="/login" onClick={closeDropdown} className="btn-wellness-outline !py-2.5 !px-4 !text-sm">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/onboarding" onClick={closeDropdown} className="btn-wellness !py-2.5 !px-5 !text-sm">
                    <UserPlus className="h-4 w-4" />
                    Kayıt Ol
                  </Link>
                </motion.div>
              </>
            )}
          </div>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 bg-white transition lg:hidden ${
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
              className="overflow-hidden border-t border-white/50 bg-white/90 px-4 backdrop-blur-xl lg:hidden"
            >
              <div className="py-3">
                {publicLinks.map((l) => renderMobileLink(l))}
                <div className="mt-1">
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-cream-800/40">Keşfet</p>
                  {discoverSubLinks.map((sub) => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === sub.to || pathname.startsWith(`${sub.to}/`) ? 'bg-brand-100/70 text-brand-700' : 'text-cream-800 hover:bg-cream-100'}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sub.color}`}>
                        <sub.icon className="h-4 w-4" />
                      </span>
                      {sub.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-1">
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-cream-800/40">Kadromuz</p>
                  {teamSubLinks.map((sub) => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={sub.onPrefetch}
                      onFocus={sub.onPrefetch}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-cream-800 transition hover:bg-cream-100"
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sub.color}`}>
                        <sub.icon className="h-4 w-4" />
                      </span>
                      {sub.label}
                    </Link>
                  ))}
                  <Link
                    to="/team/apply"
                    onClick={() => setMenuOpen(false)}
                    className="mx-1 mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 px-3 py-3 text-sm font-semibold text-white shadow-md"
                  >
                    <UserPlus className="h-4 w-4" />
                    Kadromuza Katıl
                  </Link>
                </div>
                <div className="mt-2 border-t border-cream-200 pt-3">
                  {isFullyRegistered ? (
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
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="relative overflow-hidden border-t border-brand-800/30 bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 py-14 text-cream-100">
        <div aria-hidden className="wellness-orb -left-20 top-0 h-64 w-64 bg-brand-500/20" />
        <div aria-hidden className="wellness-orb -right-16 bottom-0 h-72 w-72 bg-sage-500/15" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-xl font-bold text-white">{BRAND.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{BRAND.tagline}</p>
              <p className="mt-2 text-xs text-white/45">
                <a
                  href={BRAND.siteUrl}
                  className="hover:text-white/80"
                  rel="noopener noreferrer"
                >
                  {BRAND.domain}
                </a>
              </p>
              <p className="mt-4 text-xs leading-relaxed text-white/40">Güvenli, destekleyici ve sürdürülebilir dönüşüm.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Platform</p>
              <div className="mt-3 space-y-2 text-sm text-cream-100/60">
                <Link to="/online-diyetisyen" className="block hover:text-white">Online Diyetisyen</Link>
                <Link to="/online-kocluk" className="block hover:text-white">Online Koçluk</Link>
                <Link to="/hakkimizda" className="block hover:text-white">Hakkımızda</Link>
                <Link to="/membership" className="block hover:text-white">Üyelikler</Link>
                <Link to="/blog" className="block hover:text-white">Blog</Link>
                <Link to="/stories" className="block hover:text-white">Başarı Hikayeleri</Link>
                <Link to="/corporate" className="block hover:text-white">Kurumsal</Link>
                <Link to="/team/apply" className="block hover:text-white">Kadromuza Katıl</Link>
                <button type="button" onClick={() => goToContact()} className="block text-left hover:text-white">
                  Bize Ulaşın
                </button>
                {isFullyRegistered && !isAdmin && !isStaff && (
                  <Link to="/support" className="block hover:text-white">Destek</Link>
                )}
              </div>
            </div>
            <FooterSocialLinks />
          </div>
          <div className="mt-10 border-t border-white/10 pt-8">
            <p className="text-sm font-semibold text-white">Yasal Bilgilendirme</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-6">
              {LEGAL_FOOTER_PARAGRAPHS.map((block) => (
                <LegalFooterParagraph
                  key={block.intro}
                  intro={block.intro}
                  outro={block.outro}
                  links={block.links}
                  className="text-cream-100/60"
                  linkClassName="text-cream-100/85 underline decoration-cream-100/25 underline-offset-2 transition hover:text-white hover:decoration-white/40"
                />
              ))}
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-cream-100/40">
            Bu platform koçluk ve wellness hizmetidir; tıbbi teşhis veya tedavi sunmaz.
            Beslenme önerileri genel rehberlik amaçlıdır. Sağlık sorunlarınız için doktorunuza danışın.
          </p>
          <p className="mt-4 text-center text-xs text-cream-100/30">© 2026 {BRAND.name} · KVKK uyumlu</p>
        </div>
      </footer>
      <ConsentBanner />
    </div>
  )
}
