import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

function TrialShieldVisual() {
  return (
    <div className="membership-trial-visual relative mx-auto flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52 lg:mx-0 lg:h-56 lg:w-56">
      <div aria-hidden className="membership-trial-glow membership-trial-glow-a" />
      <div aria-hidden className="membership-trial-glow membership-trial-glow-b" />
      <svg
        aria-hidden
        viewBox="0 0 160 180"
        className="relative z-[1] h-[78%] w-auto drop-shadow-[0_18px_32px_rgba(45,140,120,0.28)]"
      >
        <defs>
          <linearGradient id="trialShieldFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8f5ef" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#9fd9d0" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#5bb8ab" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="trialShieldStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dcdc1" />
            <stop offset="100%" stopColor="#2f9f90" />
          </linearGradient>
          <linearGradient id="trialCheck" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34b38a" />
            <stop offset="100%" stopColor="#1f8f6a" />
          </linearGradient>
        </defs>
        <path
          d="M80 12 C52 22 28 26 22 28 v58 c0 42 28 70 58 82 30-12 58-40 58-82 V28 C112 26 108 22 80 12Z"
          fill="url(#trialShieldFill)"
          stroke="url(#trialShieldStroke)"
          strokeWidth="3.5"
        />
        <path
          d="M52 88 L72 108 L112 64"
          fill="none"
          stroke="url(#trialCheck)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 48 56"
        className="absolute bottom-3 right-4 z-[2] h-10 w-8 text-sage-500/80 sm:bottom-4 sm:right-6 sm:h-12 sm:w-9"
      >
        <path
          d="M24 4C14 16 8 28 10 44c5-4 10-5 14-5s9 1 14 5C40 28 34 16 24 4Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export default function MembershipTrialCta({ isMember = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="membership-trial-card relative overflow-hidden rounded-[1.75rem] border border-teal-100/70 p-6 shadow-[0_20px_50px_-28px_rgba(30,70,55,0.28)] sm:rounded-[2rem] sm:p-8 lg:p-10"
    >
      <div aria-hidden className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-sky-200/45 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-teal-100/50 blur-3xl" />

      <div className="relative z-[1] grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="text-center lg:text-left">
          {isMember ? (
            <>
              <h3 className="font-display text-[clamp(1.35rem,2.8vw,1.85rem)] font-bold leading-tight text-slate-900">
                Planınızı yönetmeye{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  hazır mısınız?
                </span>
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 lg:mx-0">
                Mevcut planınıza dönmek veya detayları görmek için profilinize gidin.
              </p>
              <Link
                to="/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-teal-500 to-sage-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110"
              >
                Profilime dön
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <h3 className="font-display text-[clamp(1.35rem,2.8vw,1.85rem)] font-bold leading-tight text-slate-900">
                Hâlâ{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  emin
                </span>{' '}
                değil misiniz?
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 lg:mx-0">
                Ücretsiz kaydolun, sağlık skorlarınızı ve paneli deneyin — kredi kartı gerekmez.
              </p>
              <motion.div className="mt-6 inline-flex" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/onboarding?plan=free"
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-500 via-teal-500 to-sage-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-110 sm:px-8 sm:text-base"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  Hemen başla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </motion.div>
            </>
          )}
        </div>

        <div className="relative flex justify-center lg:justify-end" aria-hidden>
          <TrialShieldVisual />
          <span className="absolute left-[18%] top-[22%] flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-500 shadow-md sm:left-[22%] sm:top-[18%]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
