import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, Sparkles, Award, Leaf, Dumbbell, ChevronDown } from 'lucide-react'
import { formatMonthlyPrice, getPlanBadge } from '../../data/membershipPlans'

const VISIBLE_COLLAPSED = 6

function planIcon(id, large = false) {
  const cls = large ? 'h-7 w-7' : 'h-5 w-5'
  if (id === 'free') return <Sparkles className={`${cls} text-sage-500`} />
  if (id === 'eko') return <Leaf className={`${cls} text-sage-600`} />
  if (id === 'diyet') return <Sparkles className={`${cls} text-emerald-600`} />
  if (id === 'spor') return <Dumbbell className={`${cls} text-blue-600`} />
  if (id === 'kurucu') return <Crown className={`${cls} text-amber-600`} />
  if (id === 'vip') return <Award className={`${cls} text-brand-600`} />
  return <Crown className={`${cls} text-gold-500`} />
}

function iconWrapClass(id, featured) {
  if (id === 'kurucu' || featured) return 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 ring-amber-200/80'
  if (id === 'vip') return 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-brand-200/80'
  if (id === 'diyet') return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
  if (id === 'spor') return 'bg-blue-50 text-blue-700 ring-blue-200/80'
  if (id === 'eko') return 'bg-sage-50 text-sage-700 ring-sage-200/80'
  return 'bg-cream-50 text-sage-700 ring-cream-200/80'
}

function cardStyle(id, featured) {
  if (featured || id === 'kurucu') {
    return 'glass-card-solid border-amber-200/60 bg-gradient-to-b from-amber-50/60 via-white to-sage-50/30 shadow-xl shadow-amber-500/10 ring-2 ring-amber-200/40'
  }
  if (id === 'vip') {
    return 'glass-card-solid border-brand-200/60 bg-gradient-to-b from-brand-50/60 via-white to-white shadow-xl shadow-brand-500/10 ring-2 ring-brand-200/40'
  }
  return 'glass-card-solid'
}

function badgeStyle(id) {
  if (id === 'kurucu') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
  if (id === 'vip') return 'bg-gradient-to-r from-brand-500 to-brand-700 text-white'
  return 'bg-gradient-to-r from-brand-500 to-sage-500 text-white'
}

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const [expanded, setExpanded] = useState(false)
  const isFree = plan.price === 0
  const badge = getPlanBadge(plan)
  const features = plan.features || []
  const hasMore = features.length > VISIBLE_COLLAPSED
  const visibleFeatures = expanded || !hasMore ? features : features.slice(0, VISIBLE_COLLAPSED)
  const hiddenCount = features.length - VISIBLE_COLLAPSED

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative flex h-full min-h-[32rem] flex-col rounded-3xl p-6 sm:p-8 ${cardStyle(plan.id, featured)}`}
    >
      {badge && (
        <span className={`absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold shadow-md ${badgeStyle(plan.id)}`}>
          {badge}
        </span>
      )}

      <div className="flex flex-col items-center pt-2 text-center">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${iconWrapClass(plan.id, featured)}`}>
          {planIcon(plan.id, true)}
        </span>
        <h3 className="mt-4 font-display text-xl font-bold text-cream-900">{plan.name}</h3>
        {plan.id === 'kurucu' && (
          <p className="mt-1 text-xs font-medium text-amber-700/90">Sınırlı kontenjan</p>
        )}
      </div>

      <div className="mt-5 text-center">
        <p className={`font-display text-2xl font-bold ${isFree ? 'text-sage-700' : 'text-cream-900'}`}>
          {formatMonthlyPrice(plan.price)}
        </p>
        <p className="mt-1 text-sm text-cream-800/60">
          {isFree ? plan.period : '3 ve 6 aylık seçenekler de mevcut'}
        </p>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <ul className="space-y-3">
          {visibleFeatures.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              {f.included ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-cream-300" />
              )}
              <span className={f.included ? 'text-cream-800' : 'text-cream-800/40'}>{f.text}</span>
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50/80"
          >
            {expanded ? 'Daha az göster' : `${hiddenCount} özellik daha`}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <Link
        to={ctaTo}
        className={`mt-6 block rounded-full py-3.5 text-center text-sm font-semibold transition ${
          featured || plan.id === 'kurucu'
            ? 'btn-wellness w-full !shadow-md'
            : plan.id === 'vip'
              ? 'w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:from-brand-700 hover:to-brand-600'
              : 'border border-cream-200 bg-gradient-to-r from-cream-50 to-white text-cream-900 hover:border-brand-200 hover:shadow-md'
        }`}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
