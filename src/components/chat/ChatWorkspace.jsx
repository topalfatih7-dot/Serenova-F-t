import { ArrowLeft } from 'lucide-react'

/**
 * Mobil: liste VEYA sohbet (tam ekran). md+ (768px): yan yana split.
 * showThread — mobilde sohbet paneli açık mı
 */
export function ChatWorkspace({ showThread, onBack, inbox, thread, backLabel = 'Sohbetler' }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden md:grid-cols-[minmax(160px,200px)_1fr] md:gap-3 lg:grid-cols-[minmax(220px,260px)_1fr] lg:gap-4 xl:grid-cols-[minmax(260px,300px)_1fr]">
        <aside
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-cream-200 bg-white/95 shadow-sm backdrop-blur-sm md:rounded-2xl ${
            showThread ? 'hidden md:flex' : 'flex min-h-[calc(100dvh-11rem)] md:min-h-0'
          }`}
        >
          {inbox}
        </aside>

        <section
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm md:rounded-2xl ${
            showThread ? 'flex min-h-[calc(100dvh-11rem)] md:min-h-0' : 'hidden md:flex'
          }`}
        >
          {showThread && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center gap-2 border-b border-cream-100 px-3 py-2.5 text-sm font-semibold text-brand-600 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{thread}</div>
        </section>
      </div>
    </div>
  )
}

export function ChatPageFrame({ children, className = '' }) {
  return (
    <div className={`-mx-1 flex min-h-0 flex-col sm:-mx-2 ${className}`}>
      {children}
    </div>
  )
}

export function ChatThreadHeader({ title, subtitle, actions, presence }) {
  return (
    <div className="shrink-0 border-b border-cream-100 px-3 py-2.5 sm:px-4 md:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-base font-bold text-cream-900 sm:text-lg">{title}</p>
            {presence}
          </div>
          {subtitle && <p className="truncate text-xs text-cream-800/55">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function ChatThreadBody({ children }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 md:px-5">
      {children}
    </div>
  )
}
