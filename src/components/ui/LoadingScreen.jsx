import { BRAND } from '../../config/brand'

export default function LoadingScreen({ message = 'Yükleniyor…', fullScreen = true, overlay = false }) {
  const base = overlay
    ? 'fixed inset-0 z-[200] bg-cream-50/80 backdrop-blur-sm'
    : `${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'} bg-gradient-to-br from-cream-50 via-white to-brand-50/40`

  return (
    <div className={`${base} flex w-full items-center justify-center`} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Dönen halkalar */}
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500 border-r-brand-400/40 [animation-duration:1.1s]" />
          <span className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-sage-500 border-l-sage-400/40 [animation-duration:1.6s] [animation-direction:reverse]" />
          {/* Marka rozeti */}
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sage-500 text-lg font-bold text-white shadow-lg">
            {BRAND.initials}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-lg font-bold text-cream-900">{BRAND.shortName}</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-sage-500" />
          </div>
          <p className="text-sm text-cream-800/55">{message}</p>
        </div>
      </div>
    </div>
  )
}
