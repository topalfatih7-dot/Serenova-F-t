import { BRAND } from '../../config/brand'

export default function LoadingScreen({ message = 'Yükleniyor…', fullScreen = true, overlay = false }) {
  const base = overlay
    ? 'fixed inset-0 z-[200] bg-cream-50/80 backdrop-blur-sm'
    : `${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'} bg-gradient-to-br from-cream-50 via-white to-brand-50/40`

  return (
    <div className={`${base} flex w-full items-center justify-center`} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500 border-r-brand-400/40 [animation-duration:1.1s]" />
          <span className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-sage-500 border-l-sage-400/40 [animation-duration:1.6s] [animation-direction:reverse]" />
          <img
            src={BRAND.assets.mark}
            alt=""
            aria-hidden
            className="relative h-14 w-14 rounded-2xl object-contain shadow-lg"
            width={56}
            height={56}
            decoding="async"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src={BRAND.assets.logo}
            alt={BRAND.name}
            className="h-10 w-auto max-w-[min(80vw,220px)] object-contain"
            width={220}
            height={40}
            decoding="async"
          />
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
