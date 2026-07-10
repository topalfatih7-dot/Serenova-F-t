import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import {
  DURATION_OPTIONS,
  getTierPrice,
  formatMonthlyPrice,
  isPaidMembership,
  getDurationSavingsPercent,
  RECOMMENDED_DURATION_MONTHS,
  RECOMMENDED_PLAN,
} from '../../data/membershipPlans'
import { isOneTimePlan } from '../../utils/memberPackages'

export default function MembershipDurationPicker({ planId, value, onChange }) {
  if (!isPaidMembership(planId) || isOneTimePlan(planId)) return null

  const showSixMonthHint = planId === RECOMMENDED_PLAN

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden rounded-2xl border border-cream-200/80 bg-gradient-to-br from-cream-50/80 via-white to-sage-50/40 p-4"
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-cream-800/55">
        <Sparkles className="h-3.5 w-3.5 text-sage-500" />
        Paket süresi — ne kadar süreyle devam etmek istersiniz?
      </p>
      {showSixMonthHint && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-900 ring-1 ring-amber-100">
          6 aylık VIP pakette en yüksek tasarruf — uzun vadeli dönüşüm için önerilir.
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {DURATION_OPTIONS.map(({ months, label, days }) => {
          const price = getTierPrice(planId, months)
          const selected = value === months
          const savings = getDurationSavingsPercent(planId, months)
          const isRecommendedDuration = months === RECOMMENDED_DURATION_MONTHS && planId === RECOMMENDED_PLAN
          return (
            <motion.button
              key={months}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(months)}
              className={`relative rounded-xl border px-2 py-3 text-center transition ${
                selected
                  ? 'border-brand-400 bg-white shadow-md ring-2 ring-brand-100'
                  : 'border-cream-200 bg-white/80 hover:border-sage-200 hover:shadow-sm'
              } ${isRecommendedDuration && !selected ? 'border-amber-200' : ''}`}
            >
              {savings > 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sage-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                  %{savings} tasarruf
                </span>
              )}
              {isRecommendedDuration && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] text-white">
                  ★
                </span>
              )}
              <p className="text-[10px] font-semibold text-cream-800/60">{label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-sage-600">{days} gün</p>
              <p className="mt-1 text-sm font-bold text-cream-900">
                {months === 1 ? formatMonthlyPrice(price) : `${price.toLocaleString('tr-TR')}₺`}
              </p>
              {months > 1 && (
                <p className="mt-0.5 text-[9px] text-sage-600">Toplam tutar</p>
              )}
            </motion.button>
          )
        })}
      </div>
      <p className="mt-2.5 text-center text-[10px] text-cream-800/50">
        Süreyi daha sonra profilinizden değiştirebilirsiniz.
      </p>
    </motion.div>
  )
}
