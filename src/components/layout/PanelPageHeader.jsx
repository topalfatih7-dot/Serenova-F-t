import { motion } from 'framer-motion'

const ACCENTS = {
  brand: 'panel-header-brand',
  sage: 'panel-header-sage',
  warm: 'panel-header-warm',
  flame: 'panel-header-flame',
  violet: 'panel-header-violet',
}

export default function PanelPageHeader({
  title,
  subtitle,
  icon: Icon,
  accent = 'brand',
  actions,
  children,
  className = '',
  compact = false,
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`panel-page-header ${ACCENTS[accent] || ACCENTS.brand} ${compact ? 'panel-page-header-compact' : ''} ${className}`}
    >
      <div className="panel-page-header-shimmer" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          {Icon && (
            <div className="panel-page-header-icon">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm opacity-90">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.header>
  )
}

export function PanelChip({ active, onClick, children, accent = 'brand' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel-chip panel-chip-${accent} ${active ? 'panel-chip-active' : ''}`}
    >
      {children}
    </button>
  )
}

export function PanelPageShell({ children, className = '', maxWidth = 'max-w-5xl' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`mx-auto ${maxWidth} space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}
