import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const HEIGHT = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
}

/** Yatay marka logosu — public/brand-logo.webp (+ png fallback).
 * variant="mark" → kare ikon.
 * imgClassName: örn. sidebar clip için `max-w-none` (dar kutuda küçülmesin). */
export default function BrandLogo({
  size = 'md',
  linkTo = '/',
  onNavigate,
  variant = 'full',
  className = '',
  imgClassName = '',
}) {
  const isMark = variant === 'mark'

  return (
    <Link
      to={linkTo}
      onClick={onNavigate}
      className={`inline-flex shrink-0 items-center ${className}`.trim()}
      aria-label={BRAND.name}
    >
      {isMark ? (
        <img
          src={BRAND.assets.mark}
          alt={BRAND.name}
          className={`${HEIGHT[size]} w-auto aspect-square bg-transparent object-contain ${imgClassName}`.trim()}
          width={40}
          height={40}
          decoding="async"
        />
      ) : (
        <picture>
          <source srcSet={BRAND.assets.logoWebp} type="image/webp" />
          <img
            src={BRAND.assets.logo}
            alt={`${BRAND.name} — ${BRAND.domain}`}
            className={`${HEIGHT[size]} w-auto max-w-[min(100vw-8rem,240px)] bg-transparent object-contain object-left ${imgClassName}`.trim()}
            width={240}
            height={63}
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      )}
    </Link>
  )
}
