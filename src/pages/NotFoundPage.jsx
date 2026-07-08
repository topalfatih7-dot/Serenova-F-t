import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  ArrowLeft,
  LifeBuoy,
  Dumbbell,
  Activity,
  Flame,
  Heart,
  Sparkles,
  Compass,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import SeoHead from '../components/seo/SeoHead'

const FLOATERS = [
  { Icon: Dumbbell, className: 'panel-float-a top-[12%] left-[8%] text-brand-400/40', size: 28, delay: 0 },
  { Icon: Activity, className: 'panel-float-b top-[18%] right-[10%] text-sage-400/45', size: 32, delay: 0.15 },
  { Icon: Flame, className: 'panel-float-c bottom-[22%] left-[12%] text-warm-400/40', size: 26, delay: 0.3 },
  { Icon: Heart, className: 'panel-float-b bottom-[16%] right-[14%] text-rose-400/35', size: 24, delay: 0.45 },
  { Icon: Sparkles, className: 'panel-float-a top-[42%] left-[4%] text-violet-400/35', size: 22, delay: 0.2 },
  { Icon: Compass, className: 'panel-float-c top-[38%] right-[6%] text-brand-300/40', size: 30, delay: 0.35 },
]

const DIGITS = [
  { char: '4', gradient: 'from-brand-500 via-brand-400 to-sage-400', float: 'not-found-float-a' },
  { char: '0', gradient: 'from-violet-500 via-fuchsia-400 to-rose-400', float: 'not-found-float-b' },
  { char: '4', gradient: 'from-sage-500 via-emerald-400 to-brand-400', float: 'not-found-float-c' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.35 + i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function NotFoundPage() {
  const { isAuthenticated, isAdmin, isStaff } = useApp()
  const panelLink = isAdmin ? '/admin' : isStaff ? '/staff' : isAuthenticated ? '/dashboard' : null

  return (
    <>
      <SeoHead
        title="Sayfa Bulunamadı (404)"
        description="Aradığınız sayfa mevcut değil. Yeni Form ana sayfasına dönerek devam edebilirsiniz."
        noindex
      />

      <div className="not-found-page relative flex min-h-[82vh] items-center justify-center overflow-hidden px-4 py-14 sm:min-h-[85vh] sm:px-6 sm:py-20">
        {/* Aurora arka plan */}
        <div aria-hidden className="not-found-aurora pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="panel-orb not-found-orb-a absolute -left-24 top-0 h-72 w-72 bg-brand-300/50"
        />
        <div
          aria-hidden
          className="panel-orb not-found-orb-b absolute -right-20 bottom-0 h-80 w-80 bg-sage-300/45"
          style={{ '--orb-dur': '20s' }}
        />
        <div
          aria-hidden
          className="panel-orb absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 bg-violet-300/30"
          style={{ '--orb-dur': '18s', animationDelay: '-6s' }}
        />

        {/* Yüzen ikonlar */}
        {FLOATERS.map(({ Icon, className, size, delay }, i) => (
          <motion.div
            key={i}
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + delay, duration: 0.5 }}
            className={`pointer-events-none absolute ${className}`}
          >
            <Icon className="drop-shadow-sm" size={size} strokeWidth={1.75} />
          </motion.div>
        ))}

        <div className="relative z-[1] w-full max-w-2xl text-center">
          {/* Animasyonlu 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 flex items-center justify-center gap-1 sm:gap-3"
          >
            {DIGITS.map(({ char, gradient, float }, i) => (
              <span
                key={i}
                className={`not-found-digit ${float} bg-gradient-to-br ${gradient} font-display text-[5.5rem] font-black leading-none tracking-tighter text-transparent bg-clip-text sm:text-[8rem] md:text-[9rem]`}
              >
                {char}
              </span>
            ))}
          </motion.div>

          {/* Cam kart */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="not-found-card mx-auto max-w-lg rounded-3xl border border-white/60 bg-white/75 px-6 py-8 shadow-xl shadow-brand-500/10 backdrop-blur-xl sm:px-10 sm:py-10"
          >
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-gradient-to-r from-brand-50 to-sage-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700"
            >
              <Compass className="h-3.5 w-3.5 animate-pulse" />
              Rota bulunamadı
            </motion.span>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-5 font-display text-2xl font-bold text-cream-900 sm:text-3xl"
            >
              Bu sayfa{' '}
              <span className="bg-gradient-to-r from-brand-600 via-violet-600 to-sage-600 bg-clip-text text-transparent">
                antrenman programında yok
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-800/65 sm:text-base"
            >
              Bağlantı hatalı olabilir veya sayfa taşınmış olabilir. Ana sayfadan veya panelinizden devam edebilirsiniz.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
            >
              <Link
                to="/"
                className="not-found-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:scale-[1.02] hover:shadow-brand-500/35 active:scale-[0.98]"
              >
                <Home className="h-4 w-4" />
                Ana Sayfa
              </Link>
              {panelLink && (
                <Link
                  to={panelLink}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-200/80 bg-white/90 px-6 py-3.5 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]"
                >
                  <Activity className="h-4 w-4" />
                  Panele Dön
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-6 py-3.5 text-sm font-medium text-cream-800/70 transition hover:bg-cream-100/80 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri Git
              </button>
            </motion.div>

            {!isAuthenticated && (
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="mt-8 text-sm text-cream-800/55"
              >
                Yardıma mı ihtiyacınız var?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                  Giriş yapın
                </Link>{' '}
                veya{' '}
                <Link to="/onboarding" className="font-semibold text-violet-600 hover:underline">
                  kayıt olun
                </Link>
                .
              </motion.p>
            )}
            {isAuthenticated && !isAdmin && !isStaff && (
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5}>
                <Link
                  to="/support"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-700 transition hover:bg-sage-100"
                >
                  <LifeBuoy className="h-4 w-4" />
                  Destek merkezine git
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Hızlı linkler */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={6}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              { to: '/library', label: 'Kütüphane', show: isAuthenticated && !isAdmin && !isStaff },
              { to: '/blog', label: 'Blog', show: true },
              { to: '/membership', label: 'Paketler', show: !isAuthenticated },
            ]
              .filter((l) => l.show)
              .map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-full border border-white/70 bg-white/50 px-4 py-1.5 text-xs font-semibold text-cream-800/70 backdrop-blur-sm transition hover:border-brand-200 hover:bg-white hover:text-brand-700"
                >
                  {label}
                </Link>
              ))}
          </motion.div>
        </div>
      </div>
    </>
  )
}
