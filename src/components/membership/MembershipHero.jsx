import { motion } from 'framer-motion'
import { Shield, Users, CalendarDays, Sparkles } from 'lucide-react'
import PlansAnimatedBackground from '../landing/PlansAnimatedBackground'

const FEATURES = [
  {
    icon: Shield,
    title: 'Güvenli & Kişisel',
    desc: 'KVKK uyumlu veri koruma ile güvenli takip',
  },
  {
    icon: Users,
    title: 'Uzman Kadro',
    desc: 'Diyetisyen ve koç desteği',
  },
  {
    icon: CalendarDays,
    title: 'Esnek Planlama',
    desc: 'Planınızı istediğiniz zaman değiştirin',
  },
]

const ease = [0.22, 1, 0.36, 1]

function FloatCard({ className = '', floatClass = '', children, delay = 0 }) {
  return (
    <div className={`absolute z-[3] ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay, ease }}
        className={`membership-hero-float ${floatClass}`}
      >
        {children}
      </motion.div>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="membership-hero-visual relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] lg:max-w-[19rem]">
      <div className="membership-hero-photo relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]">
        <img
          src="/membership/hero.webp"
          alt="Yeni Form üyesi telefonunda kişisel planını inceliyor"
          width={900}
          height={1350}
          className="aspect-[4/5] max-h-[22rem] w-full object-cover object-[center_18%] lg:max-h-[24rem]"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div aria-hidden className="membership-hero-photo-fade" />
      </div>

      <FloatCard
        className="left-0 top-[10%] -translate-x-[18%] sm:-translate-x-[28%]"
        floatClass="membership-hero-float-plan"
        delay={0.25}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Kişisel Plan</p>
        <div className="mt-2 flex items-end gap-1" aria-hidden>
          {[40, 62, 48, 78, 55, 88].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-sage-500 to-emerald-400"
              style={{ height: `${h * 0.28}px` }}
            />
          ))}
        </div>
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-600">
            <span>İlerleme</span>
            <span className="text-sage-600">78%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-sage-500 to-emerald-400" />
          </div>
        </div>
      </FloatCard>

      <FloatCard
        className="bottom-[16%] left-0 -translate-x-[10%] sm:-translate-x-[22%]"
        floatClass="membership-hero-float-coach"
        delay={0.38}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-brand-500 text-[11px] font-bold text-white shadow-sm">
            SA
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-slate-500">Diyetisyen</p>
            <p className="truncate text-xs font-semibold text-slate-800">Selin A.</p>
            <p className="text-[10px] font-semibold text-emerald-600">Online</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard
        className="right-0 top-[8%] translate-x-[8%] sm:translate-x-[18%]"
        floatClass="membership-hero-float-track"
        delay={0.32}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Haftalık Takip</p>
        <p className="mt-1 text-lg font-bold leading-none text-sage-600">−1.2 kg</p>
        <svg viewBox="0 0 88 28" className="mt-2 h-7 w-full" aria-hidden>
          <path
            d="M2 22 C14 20, 18 14, 28 15 S42 8, 52 10 S68 4, 86 6"
            fill="none"
            stroke="url(#mhTrack)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="mhTrack" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#44a86a" />
              <stop offset="100%" stopColor="#2d8fc4" />
            </linearGradient>
          </defs>
        </svg>
      </FloatCard>

      <FloatCard
        className="bottom-[8%] right-0 translate-x-[4%] sm:translate-x-[14%]"
        floatClass="membership-hero-float-goals"
        delay={0.45}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Günlük Hedefler</p>
        <div className="mt-2 space-y-2">
          <div>
            <div className="mb-0.5 flex justify-between text-[10px] font-medium text-slate-600">
              <span>Kalori</span>
              <span>1600/2000</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-brand-500 to-sage-500" />
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex justify-between text-[10px] font-medium text-slate-600">
              <span>Su</span>
              <span>1.8/2.5L</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-brand-400" />
            </div>
          </div>
        </div>
      </FloatCard>
    </div>
  )
}

export default function MembershipHero({ title, subtitle, children }) {
  return (
    <>
      <PlansAnimatedBackground className="membership-hero-section plans-section-ref !py-7 sm:!py-9 lg:!py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 xl:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="relative z-[2] text-center lg:text-left"
          >
            <span className="plans-ref-badge">
              <Sparkles className="h-3 w-3" aria-hidden />
              Üyeliklerimiz
            </span>
            <h1 className="section-title mt-3 text-[clamp(1.45rem,3.2vw,2.1rem)] leading-[1.15]">
              {title}
            </h1>
            <p className="section-subtitle mx-auto mt-2 max-w-xl text-sm lg:mx-0">{subtitle}</p>

            <ul className="mt-5 grid gap-3 text-left sm:grid-cols-3 sm:gap-2.5 lg:mt-6 lg:gap-3">
              {FEATURES.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.07, ease }}
                    className="flex items-start gap-2.5 sm:flex-col sm:items-center sm:text-center lg:items-start lg:text-left"
                  >
                    <span className="membership-hero-feature-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      <Icon className="h-4 w-4 text-sage-700" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-cream-900">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-cream-800/65">{item.desc}</p>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="relative z-[1] mx-auto w-full max-w-sm px-5 sm:px-6 lg:mx-0 lg:max-w-none lg:px-8"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </PlansAnimatedBackground>
      {children}
    </>
  )
}
