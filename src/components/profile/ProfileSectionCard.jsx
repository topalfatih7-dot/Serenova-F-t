import { motion } from 'framer-motion'

const ACCENTS = {
  brand: {
    ring: 'ring-brand-200/60',
    icon: 'from-brand-500 to-brand-600',
    glow: 'bg-brand-400/20',
    border: 'border-brand-100/80',
    bg: 'from-brand-50/90 via-white to-white',
  },
  sage: {
    ring: 'ring-sage-200/60',
    icon: 'from-sage-500 to-emerald-600',
    glow: 'bg-sage-400/20',
    border: 'border-sage-100/80',
    bg: 'from-sage-50/90 via-white to-white',
  },
  amber: {
    ring: 'ring-amber-200/60',
    icon: 'from-amber-500 to-orange-500',
    glow: 'bg-amber-400/20',
    border: 'border-amber-100/80',
    bg: 'from-amber-50/90 via-white to-white',
  },
  violet: {
    ring: 'ring-violet-200/60',
    icon: 'from-violet-500 to-purple-600',
    glow: 'bg-violet-400/20',
    border: 'border-violet-100/80',
    bg: 'from-violet-50/90 via-white to-white',
  },
  rose: {
    ring: 'ring-rose-200/60',
    icon: 'from-rose-500 to-pink-500',
    glow: 'bg-rose-400/20',
    border: 'border-rose-100/80',
    bg: 'from-rose-50/90 via-white to-white',
  },
}

export default function ProfileSectionCard({
  icon: Icon,
  title,
  subtitle,
  accent = 'brand',
  children,
  action,
  delay = 0,
  className = '',
}) {
  const tone = ACCENTS[accent] || ACCENTS.brand

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm sm:p-6 ${tone.border} ${tone.bg} ${className}`}
    >
      <div aria-hidden className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl ${tone.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ${tone.icon} ${tone.ring}`}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 className="font-display text-lg font-bold text-cream-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-cream-800/55">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </motion.section>
  )
}
