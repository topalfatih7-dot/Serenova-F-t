import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, Sparkles } from 'lucide-react'

export default function PricingCard({ plan, featured = false, ctaTo, ctaLabel }) {
  const isPremium = plan.id === 'premium'

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative flex flex-col rounded-3xl p-6 sm:p-8 ${
        featured
          ? 'glass-card-solid border-brand-200/80 bg-gradient-to-b from-brand-50/80 via-white to-sage-50/50 shadow-xl shadow-brand-500/10 ring-2 ring-brand-200/50'
          : 'glass-card-solid'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
          Önerilen
        </span>
      )}
      <div className="flex items-center gap-2">
        {isPremium ? <Crown className="h-5 w-5 text-gold-500" /> : <Sparkles className="h-5 w-5 text-sage-500" />}
        <h3 className="font-display text-xl font-bold text-cream-900">{plan.name}</h3>
      </div>
      <div className="mt-4">
        {plan.price === 0 ? (
          <p className="font-display text-4xl font-bold text-cream-900">Ücretsiz</p>
        ) : plan.price ? (
          <p className="font-display text-4xl font-bold text-cream-900">
            {plan.price.toLocaleString('tr-TR')}₺
            <span className="text-base font-normal text-cream-800/50">/ay</span>
          </p>
        ) : (
          <p className="font-display text-2xl font-bold text-brand-600">Özelleştirilebilir</p>
        )}
        <p className="mt-1 text-sm text-cream-800/60">{plan.period}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-sm">
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
          featured
            ? 'btn-wellness w-full !shadow-md'
            : 'border border-cream-200 bg-gradient-to-r from-cream-50 to-white text-cream-900 hover:border-brand-200 hover:shadow-md'
        }`}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
