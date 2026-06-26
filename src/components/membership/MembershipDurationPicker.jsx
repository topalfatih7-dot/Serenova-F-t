import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { DURATION_OPTIONS, getTierPrice, formatMonthlyPrice, isPaidMembership } from '../../data/membershipPlans'

export default function MembershipDurationPicker({ planId, value, onChange }) {
  if (!isPaidMembership(planId)) return null

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
      <div className="mt-3 grid grid-cols-3 gap-2">
        {DURATION_OPTIONS.map(({ months, label }) => {
          const price = getTierPrice(planId, months)
          const selected = value === months
          return (
            <motion.button
              key={months}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(months)}
              className={`rounded-xl border px-2 py-3 text-center transition ${
                selected
                  ? 'border-brand-400 bg-white shadow-md ring-2 ring-brand-100'
                  : 'border-cream-200 bg-white/80 hover:border-sage-200 hover:shadow-sm'
              }`}
            >
              <p className="text-[10px] font-semibold text-cream-800/60">{label}</p>
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
