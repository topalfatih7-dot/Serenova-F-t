import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { formatPlanPrice, getPlanBadge, getPlanDurationLabel, isOneTimeBillingPlan } from '../../data/membershipPlans'
import { getPlanTheme, planVisual, dailyPrice } from '../membership/planTheme'

const VISIBLE_FEATURES = 4

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const [expanded, setExpanded] = useState(false)
  const theme = getPlanTheme(plan)
  const isFree = plan.price === 0
  const badge = getPlanBadge(plan)
  const isFeatured = featured || plan.id === 'vip'
  const isElite = plan.id === 'vip'
  const isOneTime = isOneTimeBillingPlan(plan)
  const durationLabel = getPlanDurationLabel(plan)
  const daily = dailyPrice(plan.price)

  const includedFeatures = (plan.features || []).filter((f) => f.included)
  const hasMore = includedFeatures.length > VISIBLE_FEATURES
  const visibleFeatures = expanded || !hasMore
    ? includedFeatures
    : includedFeatures.slice(0, VISIBLE_FEATURES)
  const hiddenCount = includedFeatures.length - VISIBLE_FEATURES

  const description = Array.isArray(plan.limits) && plan.limits.length
    ? plan.limits.slice(0, 2).join('. ')
    : isFree
      ? 'Süre bitmiş üyelik fallback'
      : isOneTime
        ? `${durationLabel} · mevcut üyeliğe eklenebilir`
        : `${durationLabel} · 3 ve 6 aylık seçenekler de mevcut`

  const solidCta = isElite

  return (
    <div
      className={`plans-pricing-card plans-pricing-card--ref relative z-0 flex h-full flex-col overflow-visible rounded-2xl border bg-white px-3.5 pb-3.5 pt-5 shadow-[0_8px_24px_rgba(15,40,60,0.06)] sm:px-4 sm:pb-4 sm:pt-6 ${
        isElite
          ? 'border-amber-300/80 shadow-[0_10px_28px_rgba(217,160,32,0.14)] ring-1 ring-amber-100'
          : isFeatured
            ? 'border-emerald-300/80 shadow-[0_10px_28px_rgba(16,145,90,0.12)] ring-1 ring-emerald-100'
            : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {badge && (
        <span
          className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-md sm:text-[10px] ${
            isElite
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : isOneTime
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600'
                : 'bg-gradient-to-r from-emerald-500 to-green-600'
          }`}
        >
          {badge}
        </span>
      )}

      <div className="flex flex-col items-center text-center">
        <span className={`flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11 ${theme.label}`}>
          {planVisual(plan, 'h-7 w-7 sm:h-8 sm:w-8', 'text-2xl leading-none')}
        </span>
        <h3 className={`mt-2 font-display text-[0.95rem] font-bold leading-snug sm:text-base ${theme.label}`}>
          {plan.name}
        </h3>
      </div>

      <div className="mt-3 text-center">
        <p className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-[1.35rem]">
          {formatPlanPrice(plan)}
        </p>
        {!isFree && !isOneTime && (
          <p className="mt-1 text-[10px] font-medium text-slate-500 sm:text-[11px]">
            Günde ~{daily.toLocaleString('tr-TR')}₺
          </p>
        )}
        <p className="mx-auto mt-2 max-w-[16rem] text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          {description}
        </p>
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-2 px-0.5">
        {visibleFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-left text-[11px] leading-snug text-slate-700 sm:text-xs">
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.label}`} strokeWidth={2.75} />
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          {expanded ? 'Daha az' : `+${hiddenCount} özellik`}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      <Link
        to={ctaTo}
        className={`mt-4 block rounded-full py-2.5 text-center text-xs font-semibold transition sm:text-[13px] ${
          solidCta
            ? `${theme.btn} shadow-md hover:brightness-105`
            : `border-2 border-current bg-white ${theme.label} hover:bg-slate-50`
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
