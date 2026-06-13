import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Sparkles } from 'lucide-react'
import NumberSelector from '../ui/NumberSelector'
import PackageSummaryCard from './PackageSummaryCard'
import {
  ADD_ONS, DEFAULT_PACKAGE,
  COACH_MAX_PER_WEEK, DIETITIAN_MAX_PER_MONTH,
  DURATION_MIN_WEEKS, DURATION_MAX_WEEKS,
} from '../../data/membershipPlans'
import { calculatePackagePrice, getRecommendedPackage } from '../../services/packagePricing'

export default function PackageBuilder({ config, onChange, onSave, onReset, userProfile }) {
  const pricing = useMemo(() => calculatePackagePrice(config), [config])
  const recommended = useMemo(() => getRecommendedPackage(userProfile), [userProfile])

  const toggleAddOn = (id) => {
    const addOns = config.addOns.includes(id)
      ? config.addOns.filter((a) => a !== id)
      : [...config.addOns, id]
    onChange({ ...config, addOns })
  }

  const applyRecommended = () => {
    onChange({ ...config, ...recommended })
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cream-200 bg-white p-6">
          <button
            type="button"
            onClick={applyRecommended}
            className="mb-6 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-sage-50 p-4 text-left transition hover:shadow-sm"
          >
            <Sparkles className="h-5 w-5 text-brand-500" />
            <div>
              <p className="font-medium text-cream-900">Size Önerilen Paket</p>
              <p className="text-sm text-cream-800/60">
                {recommended.coachMeetingsPerWeek} koç/hafta · {recommended.durationWeeks} hafta · Detaylı takip
              </p>
            </div>
          </button>

          <NumberSelector
            label="Haftalık koç görüşmesi"
            value={config.coachMeetingsPerWeek}
            min={1}
            max={COACH_MAX_PER_WEEK}
            onChange={(v) => onChange({ ...config, coachMeetingsPerWeek: v })}
            hint={`Haftada en fazla ${COACH_MAX_PER_WEEK} koç görüşmesi seçebilirsiniz.`}
          />

          <div className="mt-6">
            <NumberSelector
              label="Aylık diyetisyen görüşmesi"
              value={config.dietitianMeetingsPerMonth}
              min={0}
              max={DIETITIAN_MAX_PER_MONTH}
              onChange={(v) => onChange({ ...config, dietitianMeetingsPerMonth: v })}
              hint={`Ayda en fazla ${DIETITIAN_MAX_PER_MONTH} diyetisyen görüşmesi seçebilirsiniz.`}
            />
          </div>

          <div className="mt-6">
            <NumberSelector
              label="Program süresi"
              value={config.durationWeeks}
              min={DURATION_MIN_WEEKS}
              max={DURATION_MAX_WEEKS}
              step={1}
              unit=" hafta"
              onChange={(v) => onChange({ ...config, durationWeeks: v })}
              hint="1 hafta aralıklarla, 36 haftaya kadar seçebilirsiniz."
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-cream-200 bg-white p-6">
          <h3 className="font-semibold text-cream-900">Eklentiler</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ADD_ONS.map((addon) => (
              <label
                key={addon.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  config.addOns.includes(addon.id) ? 'border-brand-300 bg-brand-50/50' : 'border-cream-200 hover:border-brand-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.addOns.includes(addon.id)}
                  onChange={() => toggleAddOn(addon.id)}
                  className="mt-1 accent-brand-500"
                />
                <div>
                  <p className="font-medium text-cream-900">{addon.name}</p>
                  <p className="text-xs text-cream-800/60">{addon.desc}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-600">+{addon.price}₺/ay</p>
                </div>
              </label>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        <PackageSummaryCard config={config} pricing={pricing} />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onReset?.()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream-200 py-3 text-sm font-medium text-cream-800 hover:bg-cream-50"
          >
            <RotateCcw className="h-4 w-4" /> Sıfırla
          </button>
          <button
            type="button"
            onClick={() => onSave?.(config, pricing)}
            className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Paketi Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

export { DEFAULT_PACKAGE }
