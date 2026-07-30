import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
import { formatPlanPrice } from '../../data/membershipPlans'
import { getPlanTheme, planIcon } from './planTheme'
import { getPlanCtaLabel } from '../../utils/planCta'

function CellValue({ value }) {
  if (value === false) {
    return (
      <span className="flex h-6 w-6 items-center justify-center" aria-label="Yok">
        <X className="h-3.5 w-3.5 text-slate-300" strokeWidth={2.5} />
      </span>
    )
  }
  if (value === true) {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-emerald-500 text-white shadow-sm shadow-sage-500/25"
        aria-label="Var"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  return <span className="text-xs font-semibold text-slate-700">{value}</span>
}

export default function MembershipComparisonAccordion({
  plans = [],
  comparisonRows = [],
  isMember = false,
  membership,
  user,
}) {
  const [openId, setOpenId] = useState(() => plans.find((p) => p.id === 'vip')?.id || plans[0]?.id)

  const ctaForPlan = (plan) => getPlanCtaLabel(plan, {
    forMember: isMember,
    member: user,
    currentMembership: membership,
  })

  return (
    <div className="space-y-3 md:hidden">
      {plans.map((plan) => {
        const theme = getPlanTheme(plan)
        const isOpen = openId === plan.id
        const isVip = plan.id === 'vip'

        return (
          <div
            key={plan.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              isVip ? 'border-amber-200 ring-1 ring-amber-100' : 'border-cream-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : plan.id)}
              className="flex w-full items-center gap-3 p-4 text-left"
              aria-expanded={isOpen}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconIdle}`}>
                {planIcon(plan, 'h-4 w-4')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`font-display text-sm font-bold ${theme.label}`}>{plan.name}</span>
                  {isVip && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                      Önerilen
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-cream-800/55">
                  {plan.price === 0 ? 'Ücretsiz' : formatPlanPrice(plan)}
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-cream-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-cream-100 px-4 pb-4">
                    <ul className="divide-y divide-cream-50">
                      {comparisonRows.map((row) => (
                        <li key={row.feature} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-xs text-cream-800/75">{row.feature}</span>
                          <CellValue value={row[plan.id]} />
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/onboarding?plan=${plan.id}`}
                      className={`mt-4 flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold ${theme.btnIdle}`}
                    >
                      {ctaForPlan(plan)}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
