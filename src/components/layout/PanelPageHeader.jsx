import { motion } from 'framer-motion'

const ACCENTS = {
  brand: 'panel-header-brand',
  sage: 'panel-header-sage',
  warm: 'panel-header-warm',
  flame: 'panel-header-flame',
  violet: 'panel-header-violet',
  teal: 'panel-header-teal',
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
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          {Icon && (
            <div className="panel-page-header-icon shrink-0">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold leading-tight tracking-tight sm:text-2xl">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-white/90 sm:mt-1 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="panel-page-header-actions flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        )}
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

/** Panel içerik genişliği — shell kenar boşluğu dışında tam genişlik */
export const PANEL_CONTENT_WIDTH = 'w-full max-w-none'

export function PanelPageShell({ children, className = '', maxWidth = PANEL_CONTENT_WIDTH, spacing = 'space-y-6', ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`mx-auto ${maxWidth} ${spacing} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
