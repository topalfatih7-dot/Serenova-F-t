import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const HEIGHT = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
}

/** Yatay marka logosu — public/brand-logo.webp (+ png fallback) */
export default function BrandLogo({ size = 'md', linkTo = '/', onNavigate }) {
  return (
    <Link to={linkTo} onClick={onNavigate} className="inline-flex shrink-0 items-center" aria-label={BRAND.name}>
      <picture>
        <source srcSet={BRAND.assets.logoWebp} type="image/webp" />
        <img
          src={BRAND.assets.logo}
          alt={`${BRAND.name} — ${BRAND.domain}`}
          className={`${HEIGHT[size]} w-auto max-w-[min(100vw-8rem,240px)] bg-transparent object-contain object-left`}
          width={240}
          height={63}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
    </Link>
  )
}
