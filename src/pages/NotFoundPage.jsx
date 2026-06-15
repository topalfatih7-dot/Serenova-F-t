import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, LifeBuoy } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function NotFoundPage() {
  const { isAuthenticated, isAdmin, isStaff } = useApp()

  const panelLink = isAdmin ? '/admin' : isStaff ? '/staff' : isAuthenticated ? '/dashboard' : null

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-sage-200/25 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg text-center"
      >
        <p className="font-display text-[7rem] font-extrabold leading-none tracking-tighter text-brand-500/15 sm:text-[9rem]">
          404
        </p>
        <div className="-mt-10 sm:-mt-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/70 backdrop-blur">
            <Search className="h-3.5 w-3.5" />
            Sayfa bulunamadı
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-cream-900 sm:text-3xl">
            Aradığınız sayfa mevcut değil
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-800/60 sm:text-base">
            Bağlantı yanlış olabilir veya sayfa taşınmış olabilir. Ana sayfaya dönerek devam edebilirsiniz.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Ana Sayfa
            </Link>
            {panelLink && (
              <Link
                to={panelLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cream-200 bg-white px-6 py-3 text-sm font-semibold text-cream-800 transition hover:border-brand-200 hover:text-brand-600 sm:w-auto"
              >
                Panele Dön
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-6 py-3 text-sm font-medium text-cream-800/70 transition hover:bg-cream-100 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri Git
            </button>
          </div>

          {!isAuthenticated && (
            <p className="mt-8 text-sm text-cream-800/50">
              Yardıma mı ihtiyacınız var?{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:underline">
                Giriş yapın
              </Link>{' '}
              veya{' '}
              <Link to="/onboarding" className="font-medium text-brand-600 hover:underline">
                kayıt olun
              </Link>
              .
            </p>
          )}
          {isAuthenticated && !isAdmin && !isStaff && (
            <Link
              to="/support"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              <LifeBuoy className="h-4 w-4" />
              Destek merkezine git
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
