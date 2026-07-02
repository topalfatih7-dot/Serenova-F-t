import { BRAND } from '../../config/brand'

export default function LoadingScreen({ fullScreen = true, overlay = false }) {
  const base = overlay
    ? 'fixed inset-0 z-[200] bg-cream-50/80 backdrop-blur-sm'
    : `${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'} bg-gradient-to-br from-cream-50 via-white to-brand-50/40`

  return (
    <div
      className={`${base} flex w-full items-center justify-center`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={BRAND.name}
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500 border-r-brand-400/40 [animation-duration:1.1s]" />
        <span className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-sage-500 border-l-sage-400/40 [animation-duration:1.6s] [animation-direction:reverse]" />
        <img
          src={BRAND.assets.mark}
          alt={BRAND.name}
          className="relative h-14 w-14 rounded-2xl object-contain shadow-lg"
          width={56}
          height={56}
          decoding="async"
        />
      </div>
    </div>
  )
}
