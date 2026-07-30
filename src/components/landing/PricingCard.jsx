import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getPlanDurationLabel, isOneTimeBillingPlan } from '../../data/membershipPlans'
import { getPlanTheme, planVisual } from '../membership/planTheme'

/** Landing kart fiyatı — checkout metinlerini bozmaz */
function formatCardPrice(plan) {
  if (!plan || !plan.price || plan.price <= 0) return 'Ücretsiz'
  const amount = `${Number(plan.price).toLocaleString('tr-TR')}₺`
  if (isOneTimeBillingPlan(plan)) return amount
  return `${amount} / ay`
}

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const theme = getPlanTheme(plan)
  const isFree = plan.price === 0
  const isElite = plan.id === 'vip'
  /* Solid CTA: yalnızca Vip; diğerleri outline */
  const solidCta = plan.id === 'vip' || isElite
  const isOneTime = isOneTimeBillingPlan(plan)
  const durationLabel = getPlanDurationLabel(plan)
  const includedFeatures = (plan.features || []).filter((f) => f.included)

  const description = Array.isArray(plan.limits) && plan.limits.length
    ? plan.limits[0]
    : isFree
      ? 'Süre bitmiş üyelik fallback'
      : isOneTime
        ? durationLabel
        : `${durationLabel} · 3 / 6 ay seçenek`

  /* En pahalı (vip) = En çok tercih */
  const displayBadge = featured || isElite ? 'En çok tercih' : null

  const badgeClass =
    'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-amber-200/60'

  const shellClass = isElite || featured
    ? 'plans-pricing-card--elite border-amber-300/90 shadow-md shadow-amber-100/50 ring-1 ring-amber-200/80'
    : 'border-slate-200/80 shadow-sm shadow-slate-200/30'

  const accentBar = isElite || featured
    ? `h-1 bg-gradient-to-r ${theme.accent}`
    : `h-0.5 bg-gradient-to-r ${theme.accent} opacity-70`

  const ctaClass = solidCta
    ? `border-2 border-transparent text-white shadow-sm hover:brightness-105 ${theme.btn}`
    : `border-2 bg-white hover:bg-slate-50/80 ${theme.btnOutline}`

  return (
    <div
      className={`plans-pricing-card plans-pricing-card--ref relative flex h-full flex-col rounded-3xl border bg-white px-4 pb-5 pt-7 sm:px-5 sm:pb-6 sm:pt-8 ${shellClass}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-5 top-0 rounded-full ${accentBar}`}
      />

      {displayBadge && (
        <span
          className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide shadow-sm sm:text-[9px] ${badgeClass}`}
        >
          {displayBadge}
        </span>
      )}

      <div className="flex flex-col items-center text-center">
        <span
          className={`plans-pricing-icon flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset sm:h-[3.25rem] sm:w-[3.25rem] ${theme.iconIdle}`}
        >
          {planVisual(plan, 'h-5 w-5', 'text-lg leading-none')}
        </span>
        <h3 className={`mt-3 font-display text-[0.95rem] font-bold leading-snug sm:text-base ${theme.label}`}>
          {plan.name}
        </h3>
      </div>

      <div className="mt-3 text-center">
        <p className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {formatCardPrice(plan)}
        </p>
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-500 sm:text-xs">
          {description}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {includedFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-left text-[11px] leading-snug text-slate-700 sm:text-xs">
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.label}`} strokeWidth={2.75} />
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5 sm:pt-6">
        <Link
          to={ctaTo}
          className={`block rounded-full py-2.5 text-center text-[11px] font-semibold transition sm:text-xs ${ctaClass}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
