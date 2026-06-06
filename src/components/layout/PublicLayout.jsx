import { Outlet, Link } from 'react-router-dom'
import { useState } from 'react'
import { UserRound, LayoutDashboard } from 'lucide-react'
import ConsentBanner from '../ui/ConsentBanner'
import BrandLogo from '../ui/BrandLogo'
import { BRAND } from '../../config/brand'
import { useApp } from '../../context/AppContext'

const publicLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/membership', label: 'Üyelikler' },
  { to: '/stories', label: 'Hikayeler' },
  { to: '/support', label: 'Destek' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, user } = useApp()
  const firstName = (user?.name || '').trim().split(' ')[0]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-cream-200/80 bg-cream-50/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo />
          <nav className="hidden items-center gap-1 md:flex">
            {publicLinks.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-cream-800 hover:bg-cream-100">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              isAdmin ? (
                <Link to="/admin" className="flex items-center gap-2 rounded-full bg-cream-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cream-800">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </Link>
              ) : (
                <Link to="/profile" className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                  <UserRound className="h-4 w-4" />
                  {firstName ? `Profil · ${firstName}` : 'Profil'}
                </Link>
              )
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-cream-800 hover:text-brand-600">Giriş</Link>
                <Link to="/register" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                  Başla
                </Link>
              </>
            )}
          </div>
          <button type="button" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-cream-200 px-4 py-4 md:hidden">
            {publicLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium">{l.label}</Link>
            ))}
            {isAuthenticated ? (
              isAdmin ? (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-cream-900 py-2.5 text-center text-sm font-semibold text-white">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </Link>
              ) : (
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-500 py-2.5 text-center text-sm font-semibold text-white">
                  <UserRound className="h-4 w-4" />
                  {firstName ? `Profil · ${firstName}` : 'Profil'}
                </Link>
              )
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 block py-2.5 text-sm">Giriş</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="mt-2 block rounded-full bg-brand-500 py-2.5 text-center text-sm font-semibold text-white">Başla</Link>
              </>
            )}
          </nav>
        )}
      </header>
      <Outlet />
      <footer className="border-t border-cream-200 bg-cream-900 py-12 text-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-xl font-bold text-white">{BRAND.name}</p>
              <p className="mt-3 text-sm text-cream-100/60">{BRAND.tagline}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Platform</p>
              <div className="mt-3 space-y-2 text-sm text-cream-100/60">
                <Link to="/membership" className="block hover:text-white">Üyelikler</Link>
                <Link to="/builder" className="block hover:text-white">Paket Oluştur</Link>
                <Link to="/support" className="block hover:text-white">Destek</Link>
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
