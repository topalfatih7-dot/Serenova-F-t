import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
import { formatMonthlyPrice, getPlanBadge } from '../../data/membershipPlans'
import { getPlanTheme, planIcon, dailyPrice } from '../membership/planTheme'

const VISIBLE_COLLAPSED = 6

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const [expanded, setExpanded] = useState(false)
  const theme = getPlanTheme(plan.id)
  const isFree = plan.price === 0
  const badge = getPlanBadge(plan)
  const features = plan.features || []
  const hasMore = features.length > VISIBLE_COLLAPSED
  const visibleFeatures = expanded || !hasMore ? features : features.slice(0, VISIBLE_COLLAPSED)
  const hiddenCount = features.length - VISIBLE_COLLAPSED
  const daily = dailyPrice(plan.price)
  const isFeatured = featured || plan.id === 'kurucu'

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className={`relative flex h-full min-h-[28rem] flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-xl md:min-h-[30rem] lg:min-h-[32rem] ${
        isFeatured
          ? `border-amber-200/70 ${theme.glow} ring-2 ring-amber-100/60`
          : plan.id === 'vip'
            ? `border-brand-200/70 ${theme.glow} ring-2 ring-brand-100/50`
            : 'border-cream-200/80 hover:border-sage-200'
      }`}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${theme.accent}`} />

      {badge && (
        <span className={`absolute -top-0 left-1/2 z-10 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg ${
          plan.id === 'kurucu' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-brand-500 to-sage-500'
        }`}>
          {badge}
        </span>
      )}

      <div className="flex flex-col items-center px-6 pt-10 text-center sm:px-8">
        <motion.span
          whileHover={{ scale: 1.08, rotate: 3 }}
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-md ${isFeatured || plan.id === 'vip' ? theme.icon : theme.iconIdle}`}
        >
          {planIcon(plan.id, 'h-7 w-7')}
        </motion.span>
        <h3 className={`mt-4 font-display text-xl font-bold ${theme.label}`}>{plan.name}</h3>
        {plan.id === 'kurucu' && (
          <p className="mt-1 text-xs font-medium text-amber-700/90">Sınırlı kontenjan — erken kayıt avantajı</p>
        )}
      </div>

      <div className="mt-5 px-6 text-center sm:px-8">
        <p className={`font-display text-2xl font-bold ${isFree ? 'text-sage-700' : 'text-cream-900'}`}>
          {formatMonthlyPrice(plan.price)}
        </p>
        {isFree ? (
          <p className="mt-1 text-sm text-sage-600">Kredi kartı gerekmez</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-cream-800/60">3 ve 6 aylık seçenekler de mevcut</p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-semibold text-sage-700 ring-1 ring-sage-100">
              Günde ~{daily.toLocaleString('tr-TR')}₺
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col px-6 sm:px-8">
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
        className={`mx-6 mb-6 mt-6 block rounded-full py-3.5 text-center text-sm font-semibold transition sm:mx-8 ${
          isFeatured ? theme.btn + ' shadow-lg hover:brightness-105'
            : plan.id === 'vip' ? theme.btn + ' shadow-md hover:brightness-105'
              : 'border border-cream-200 bg-gradient-to-r from-cream-50 to-white text-cream-900 hover:border-sage-200 hover:shadow-md'
        }`}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
