// Orb animasyonları CSS'e taşındı; scroll yoğun bölümlerde statik orb kullanılır
import { BRAND } from '../../config/brand'

const VARIANTS = {
  team: {
    gradient: 'from-brand-700 via-brand-800 to-sage-900',
    orb1: 'bg-brand-400/35',
    orb2: 'bg-sage-400/30',
    orb3: 'bg-gold-400/20',
    dots: 'rgba(255,255,255,0.08)',
  },
  stories: {
    gradient: 'from-warm-100 via-brand-50 to-sage-100',
    orb1: 'bg-warm-400/30',
    orb2: 'bg-brand-300/25',
    orb3: 'bg-sage-300/25',
    dots: 'rgba(45,143,196,0.12)',
  },
  testimonials: {
    gradient: 'from-brand-600 via-brand-700 to-sage-800',
    orb1: 'bg-brand-300/40',
    orb2: 'bg-sage-300/35',
    orb3: 'bg-gold-400/25',
    dots: 'rgba(255,255,255,0.10)',
    dark: true,
  },
  faq: {
    gradient: 'from-sage-50 via-brand-50 to-warm-50',
    orb1: 'bg-brand-200/45',
    orb2: 'bg-sage-200/40',
    orb3: 'bg-warm-300/30',
    dots: 'rgba(68,150,100,0.10)',
  },
}

export default function SectionBackdrop({ variant = 'team', children, className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.team

  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${v.gradient}`} />

      {/* Statik orb'lar — blur + pulse animasyonu scroll lag'i yaratıyordu */}
      <div
        aria-hidden
        className={`landing-orb-static absolute -left-24 top-0 h-80 w-80 rounded-full blur-3xl ${v.orb1}`}
      />
      <div
        aria-hidden
        className={`landing-orb-static absolute -right-20 bottom-0 h-72 w-72 rounded-full blur-3xl ${v.orb2}`}
      />
      <div
        aria-hidden
        className={`landing-orb-static absolute left-1/3 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${v.orb3}`}
      />

      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, ${v.dots} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </section>
  )
}

export function SectionHeader({ badge, badgeIcon: BadgeIcon, title, subtitle, dark = false, align = 'center', className = '' }) {
  const alignClass = align === 'left' ? 'text-left' : 'text-center'
  const subtitleMx = align === 'left' ? '' : 'mx-auto'

  return (
    <div className={`section-reveal-in ${alignClass} ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${
        dark
          ? 'border border-white/20 bg-white/10 text-white/90 backdrop-blur-md'
          : 'section-badge'
      }`}>
        {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
        {badge}
      </span>
      <h2 className={`mt-4 font-display text-3xl font-bold sm:text-4xl ${dark ? 'text-white' : 'section-title !text-cream-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`${subtitleMx} mt-3 max-w-xl text-base leading-relaxed ${dark ? 'text-white/70' : 'section-subtitle !mt-3'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export { BRAND }
