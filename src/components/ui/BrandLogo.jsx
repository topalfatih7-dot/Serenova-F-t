import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

export default function BrandLogo({ size = 'md', linkTo = '/' }) {
  const sizes = {
    sm: { box: 'h-8 w-8 text-xs', text: 'text-base' },
    md: { box: 'h-9 w-9 text-sm', text: 'text-lg' },
    lg: { box: 'h-11 w-11 text-base', text: 'text-xl' },
  }
  const s = sizes[size]

  return (
    <Link to={linkTo} className="flex items-center gap-2.5">
      <span className={`flex ${s.box} items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-500 font-bold text-white shadow-sm`}>
        {BRAND.initials}
      </span>
      <div className="leading-tight">
        <span className={`font-display font-bold text-cream-900 ${s.text}`}>{BRAND.shortName}</span>
        <span className="hidden text-[10px] font-medium text-cream-800/50 sm:block">Fit Dönüşüm</span>
      </div>
    </Link>
  )
}
