import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'
import { formatPlanPrice, getPlanBadge, getPlanDurationLabel, isOneTimeBillingPlan, RECOMMENDED_PLAN } from '../../data/membershipPlans'
import { getPlanTheme, planIcon, dailyPrice } from './planTheme'

const VISIBLE_FEATURES = 4
const MotionLink = motion(Link)

export default function MembershipPlanCard({
  plan,
  selected = false,
  onSelect,
  recommended,
  index = 0,
  mode = 'select',
  ctaTo,
  ctaLabel,
  badge,
  current = false,
  compact = false,
}) {
  const [expanded, setExpanded] = useState(false)
  const theme = getPlanTheme(plan)
  const isRecommended = recommended ?? plan.id === RECOMMENDED_PLAN
  const planBadge = badge ?? getPlanBadge(plan)
  const features = plan.features || []
  const hasMore = features.length > VISIBLE_FEATURES
  const visibleFeatures = expanded || !hasMore ? features : features.slice(0, VISIBLE_FEATURES)
  const hiddenCount = features.length - VISIBLE_FEATURES
  const daily = dailyPrice(plan.price)
  const durationLabel = getPlanDurationLabel(plan)
  const isOneTime = isOneTimeBillingPlan(plan)
  const Tag = mode === 'select' ? motion.button : MotionLink
  const tagProps = mode === 'select'
    ? { type: 'button', onClick: () => onSelect?.(plan.id) }
    : { to: ctaTo || `/onboarding?plan=${plan.id}` }

  const toggleFeatures = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  const iconStyle = theme.customHex
    ? { backgroundColor: theme.customHex, color: '#fff' }
    : undefined
  const accentStyle = theme.customHex
    ? { background: `linear-gradient(90deg, ${theme.customHex}aa, ${theme.customHex})` }
    : undefined

  return (
    <Tag
      {...tagProps}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition-all ${
        selected
          ? `border-2 ${theme.ring} shadow-lg ${theme.glow}`
          : isRecommended
            ? 'border-amber-200/80 shadow-md shadow-amber-100/40 hover:shadow-lg'
            : isOneTime
              ? `border-teal-200/80 shadow-md ${theme.glow} hover:border-teal-300 hover:shadow-lg`
              : 'border-cream-200/80 hover:border-sage-200 hover:shadow-md'
      } ${compact ? 'min-h-[17.5rem]' : 'min-h-[22rem]'}`}
    >
      {isRecommended && (
        <motion.span
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '220%' }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        />
      )}

      <div
        className={`h-2 w-full ${theme.customHex ? '' : `bg-gradient-to-r ${theme.accent}`}`}
        style={accentStyle}
      />

      {planBadge && (
        <span
          className={`absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-md ${
            theme.customHex ? '' : (plan.id === 'doktor' ? 'bg-gradient-to-r from-teal-500 to-cyan-600' : 'bg-cream-900/90')
          }`}
          style={theme.customHex ? { backgroundColor: theme.customHex } : undefined}
        >
          {plan.id === 'doktor' && <Sparkles className="mr-1 inline h-2.5 w-2.5" />}
          {planBadge}
        </span>
      )}

      {current && (
        <span className="absolute right-3 top-3 z-20 rounded-full bg-cream-900 px-2.5 py-0.5 text-[9px] font-bold uppercase text-white">
          Mevcut
        </span>
      )}

      {selected && (
        <span className="absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}

      <div className={`flex flex-1 flex-col p-5 ${planBadge ? 'pt-9' : 'pt-5'}`}>
        <div className="flex flex-col items-center text-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-105 ${
              theme.customHex ? '' : (selected || isRecommended || isOneTime ? theme.icon : theme.iconIdle)
            }`}
            style={iconStyle || (theme.customHex && !(selected || isRecommended || isOneTime)
              ? { backgroundColor: `${theme.customHex}18`, color: theme.customHex }
              : undefined)}
          >
            {planIcon(plan, 'h-6 w-6')}
          </span>
          <h3 className={`mt-3 font-display text-lg font-bold text-cream-900 ${theme.label}`}>{plan.name}</h3>
          {isOneTime && (
            <p className="mt-1 text-xs font-medium text-teal-700/90">Uzman doktor ile online sağlık danışmanlığı</p>
          )}
          <p className="mt-1 font-display text-xl font-extrabold text-cream-900">
            {formatPlanPrice(plan)}
          </p>
          {plan.price > 0 && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">{durationLabel}</p>
          )}
          {plan.price > 0 && !isOneTime && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-semibold text-sage-700 ring-1 ring-sage-100">
              <Sparkles className="h-3 w-3" />
              Günde ~{daily.toLocaleString('tr-TR')}₺ — kahve fiyatına wellness
            </p>
          )}
          {isOneTime && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-800 ring-1 ring-teal-100">
              Mevcut üyeliğe ek paket
            </p>
          )}
          {plan.price === 0 && (
            <p className="mt-2 text-xs text-sage-600">Süre bitmiş üyelik — temel erişim</p>
          )}
        </div>

        <ul className="mt-4 flex-1 space-y-2 border-t border-cream-100 pt-4">
          {visibleFeatures.map((f, i) => (
            <li key={i} className={`flex items-start gap-2 text-xs leading-snug ${f.included ? 'text-cream-800/85' : 'text-cream-800/35'}`}>
              {f.included ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" strokeWidth={3} />
              ) : (
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cream-300" strokeWidth={2} />
              )}
              <span className={!f.included ? 'line-through' : ''}>{f.text}</span>
            </li>
          ))}
          {hasMore && (
            <li>
              <button
                type="button"
                onClick={toggleFeatures}
                aria-expanded={expanded}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-brand-600 transition hover:bg-brand-50/80"
              >
                {expanded ? 'Daha az göster' : `+${hiddenCount} özellik daha`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </li>
          )}
        </ul>

        <div className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${selected ? theme.btn : theme.btnIdle}`}>
          {mode === 'link' ? (
            <>
              {ctaLabel || `${plan.name} ile Başla`}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </>
          ) : (
            selected ? 'Seçildi ✓' : isRecommended ? 'Bu Planı Seç ★' : 'Planı Seç'
          )}
        </div>
      </div>
    </Tag>
  )
}
