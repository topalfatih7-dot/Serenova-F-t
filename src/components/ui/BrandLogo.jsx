import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const HEIGHT = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
}

/** Yatay marka logosu — public/brand-logo.png (npm run og:image) */
export default function BrandLogo({ size = 'md', linkTo = '/' }) {
  return (
    <Link to={linkTo} className="inline-flex shrink-0 items-center" aria-label={BRAND.name}>
      <img
        src={BRAND.assets.logo}
        alt={`${BRAND.name} — ${BRAND.domain}`}
        className={`${HEIGHT[size]} w-auto max-w-[min(100vw-8rem,240px)] bg-transparent object-contain object-left`}
        width={240}
        height={64}
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  )
}
