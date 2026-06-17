import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, Sparkles, Star, Award } from 'lucide-react'

function planIcon(id) {
  if (id === 'free')     return <Sparkles className="h-5 w-5 text-sage-500" />
  if (id === 'gumus')    return <Star className="h-5 w-5 text-slate-400" />
  if (id === 'altin')    return <Crown className="h-5 w-5 text-amber-500" />
  if (id === 'platinum') return <Award className="h-5 w-5 text-brand-500" />
  return <Crown className="h-5 w-5 text-gold-500" />
}

function cardStyle(id, featured) {
  if (featured || id === 'altin') {
    return 'glass-card-solid border-amber-200/60 bg-gradient-to-b from-amber-50/60 via-white to-sage-50/30 shadow-xl shadow-amber-500/10 ring-2 ring-amber-200/40'
  }
  if (id === 'platinum') {
    return 'glass-card-solid border-brand-200/60 bg-gradient-to-b from-brand-50/60 via-white to-white shadow-xl shadow-brand-500/10 ring-2 ring-brand-200/40'
  }
  if (id === 'gumus') {
    return 'glass-card-solid border-slate-200/60 bg-gradient-to-b from-slate-50/40 via-white to-white'
  }
  return 'glass-card-solid'
}

function badgeStyle(id) {
  if (id === 'altin')    return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
  if (id === 'platinum') return 'bg-gradient-to-r from-brand-500 to-brand-700 text-white'
  if (id === 'gumus')    return 'bg-slate-500 text-white'
  return 'bg-gradient-to-r from-brand-500 to-sage-500 text-white'
}

function priceColor(id) {
  if (id === 'altin')    return 'text-amber-700'
  if (id === 'platinum') return 'text-brand-700'
  if (id === 'gumus')    return 'text-slate-700'
  return 'text-sage-700'
}

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const isFree = plan.price === 0

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative flex flex-col rounded-3xl p-6 sm:p-8 ${cardStyle(plan.id, featured)}`}
    >
      {plan.badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold shadow-md ${badgeStyle(plan.id)}`}>
          {plan.badge}
        </span>
      )}

      <div className="flex items-center gap-2">
        {planIcon(plan.id)}
        <h3 className="font-display text-xl font-bold text-cream-900">{plan.name}</h3>
      </div>

      <div className="mt-4">
        {isFree ? (
          <p className={`font-display text-4xl font-bold ${priceColor(plan.id)}`}>Ücretsiz</p>
        ) : (
          <p className="font-display text-4xl font-bold text-cream-900">
            {plan.price?.toLocaleString('tr-TR')}₺
            <span className="text-base font-normal text-cream-800/50">/ay</span>
          </p>
        )}
        <p className="mt-1 text-sm text-cream-800/60">{plan.period}</p>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f, i) => (
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

      <Link
        to={ctaTo}
        className={`mt-8 block rounded-full py-3.5 text-center text-sm font-semibold transition ${
          featured || plan.id === 'altin'
            ? 'btn-wellness w-full !shadow-md'
            : plan.id === 'platinum'
              ? 'w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:from-brand-700 hover:to-brand-600'
              : plan.id === 'gumus'
                ? 'w-full border-2 border-slate-400 bg-white text-slate-700 hover:bg-slate-50'
                : 'border border-cream-200 bg-gradient-to-r from-cream-50 to-white text-cream-900 hover:border-brand-200 hover:shadow-md'
        }`}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
