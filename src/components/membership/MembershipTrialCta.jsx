import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

function LeafSvg({ className = '', gid = 'a', tone = 'green' }) {
  const body = `trialLeafBody-${gid}`
  const shine = `trialLeafShine-${gid}`
  const colors =
    tone === 'mint'
      ? { a: '#8fd9a8', b: '#45b87a', c: '#2a8f5c' }
      : tone === 'olive'
        ? { a: '#a3c96b', b: '#6fa040', c: '#4a7a28' }
        : { a: '#7dce6a', b: '#3faf5f', c: '#1f7a45' }

  return (
    <svg aria-hidden viewBox="0 0 72 96" className={className}>
      <defs>
        <linearGradient id={body} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={colors.a} />
          <stop offset="45%" stopColor={colors.b} />
          <stop offset="100%" stopColor={colors.c} />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#c8f0a8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c8f0a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M36 4C20 22 10 42 12 72c8-7 16-10 24-10s16 3 24 10C62 42 52 22 36 4Z"
        fill={`url(#${body})`}
      />
      <path
        d="M36 4C24 24 16 42 16 62c6-5 12-8 20-8 2 0 4 .2 6 .6C38 36 38 18 36 4Z"
        fill={`url(#${shine})`}
      />
      <path d="M36 16v58" stroke="rgba(255,255,255,0.42)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M36 30c-7 7-12 16-14 26M36 38c7 6 11 14 13 24M36 48c-5 5-8 11-9 17"
        stroke="rgba(255,255,255,0.26)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function TrialShieldVisual() {
  return (
    <div className="membership-trial-visual relative mx-auto flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52 lg:mx-0 lg:h-56 lg:w-56">
      <div aria-hidden className="membership-trial-glow membership-trial-glow-a" />
      <div aria-hidden className="membership-trial-glow membership-trial-glow-b" />

      {/* Arka plan yaprakları */}
      <LeafSvg
        gid="back1"
        tone="olive"
        className="membership-trial-leaf membership-trial-leaf-back-1"
      />
      <LeafSvg
        gid="back2"
        tone="mint"
        className="membership-trial-leaf membership-trial-leaf-back-2"
      />

      <svg
        aria-hidden
        viewBox="0 0 160 180"
        className="relative z-[2] h-[78%] w-auto drop-shadow-[0_18px_32px_rgba(45,140,120,0.28)]"
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

      {/* Ön / yan yapraklar — dağınık */}
      <LeafSvg
        gid="front1"
        className="membership-trial-leaf membership-trial-leaf-front-1"
      />
      <LeafSvg
        gid="front2"
        tone="mint"
        className="membership-trial-leaf membership-trial-leaf-front-2"
      />
      <LeafSvg
        gid="front3"
        tone="olive"
        className="membership-trial-leaf membership-trial-leaf-front-3"
      />
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
        </div>
      </div>
    </motion.div>
  )
}
