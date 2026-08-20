import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  ALL_PLANS,
  getTierPrice,
  isPaidMembership,
  RECOMMENDED_DURATION_MONTHS,
  RECOMMENDED_PLAN,
  sortPlansForDisplay,
} from '../../data/membershipPlans'
import { isOneTimePlan, memberHasActiveRecurringPackages } from '../../utils/memberPackages'
import { isStripeEnabled, STRIPE_REQUIRED_MESSAGE } from '../../config/stripe'
import { startStripeCheckout } from '../../services/stripePayment'
import { useToast } from '../../context/ToastContext'
import MembershipPlanCard from './MembershipPlanCard'
import MembershipDurationPicker from './MembershipDurationPicker'
import MembershipCancelDialog from './MembershipCancelDialog'

function defaultDurationMonths(planId) {
  if (planId === RECOMMENDED_PLAN) return RECOMMENDED_DURATION_MONTHS
  return 1
}

/**
 * Üye paneli / üyelik sayfası: plan seç → süre (1/3/6) → Stripe ödeme.
 * Ayrı onboarding sayfasına yönlendirmez.
 */
export default function MemberPlanCheckout({
  plans: plansProp,
  membership,
  userEmail,
  member = null,
  initialPlanId = null,
  selectedPlanId: controlledSelected,
  onSelectedPlanChange,
}) {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const plans = sortPlansForDisplay(plansProp?.length ? plansProp : ALL_PLANS)
    .filter((p) => p.id !== membership)

  const queryPlan = searchParams.get('plan')
  const fallbackPlan = initialPlanId
    || (queryPlan && plans.some((p) => p.id === queryPlan) ? queryPlan : null)
    || plans[0]?.id
    || null

  const [internalSelected, setInternalSelected] = useState(fallbackPlan)
  const selected = controlledSelected ?? internalSelected

  const setSelected = (planId) => {
    onSelectedPlanChange?.(planId)
    if (controlledSelected == null) setInternalSelected(planId)
  }

  const [durationMonths, setDurationMonths] = useState(() => defaultDurationMonths(fallbackPlan))
  const [saving, setSaving] = useState(false)
  const [stackOpen, setStackOpen] = useState(false)
  const checkoutRef = useRef(null)
  const didCancelToast = useRef(false)
  const skipScrollOnce = useRef(true)

  useEffect(() => {
    setDurationMonths(defaultDurationMonths(selected))
    if (skipScrollOnce.current) {
      skipScrollOnce.current = false
      return
    }
    if (!selected) return
    requestAnimationFrame(() => {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [selected])

  useEffect(() => {
    if (didCancelToast.current) return
    if (searchParams.get('payment') !== 'cancelled') return
    didCancelToast.current = true
    toast('Ödeme iptal edildi. Planınız değişmedi.', 'info')
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, toast])

  useEffect(() => {
    if (!queryPlan) return
    if (!plans.some((p) => p.id === queryPlan)) return
    if (queryPlan === selected) return
    setSelected(queryPlan)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca ?plan= değişince
  }, [queryPlan])

  const selectedPlan = plans.find((p) => p.id === selected)
  const isPaid = isPaidMembership(selected)
  const isOneTime = isOneTimePlan(selected)
  const selectedPrice = isPaid
    ? getTierPrice(selected, isOneTime ? 1 : durationMonths, selectedPlan)
    : 0

  const handleSelect = (planId) => {
    setSelected(planId)
  }

  const startCheckout = async () => {
    if (!selected || !isPaid) return
    if (selectedPrice <= 0) {
      toast('Geçersiz plan fiyatı. Lütfen geçerli bir paket seçin.', 'error')
      return
    }
    setSaving(true)
    const r = await startStripeCheckout(selected, 'change', isOneTime ? 1 : durationMonths, userEmail)
    if (!r.success) {
      setSaving(false)
      toast(r.error || (isStripeEnabled() ? 'Ödeme başlatılamadı' : STRIPE_REQUIRED_MESSAGE), 'error')
    }
  }

  const handlePay = async () => {
    if (!selected || !isPaid) return
    if (selectedPrice <= 0) {
      toast('Geçersiz plan fiyatı. Lütfen geçerli bir paket seçin.', 'error')
      return
    }
    if (memberHasActiveRecurringPackages(member) && !isOneTime) {
      setStackOpen(true)
      return
    }
    await startCheckout()
  }

  if (!plans.length) {
    return (
      <p className="rounded-2xl border border-cream-200 bg-white/80 px-4 py-6 text-center text-sm text-cream-800/70">
        Seçilebilecek başka plan bulunmuyor.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="plans-cards-grid">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`plans-card-reveal plans-card-reveal-delay-${Math.min(i + 1, 3)} relative min-w-0`}
          >
            <MembershipPlanCard
              plan={plan}
              index={i}
              selected={selected === plan.id}
              onSelect={handleSelect}
              recommended={plan.id === 'vip'}
              compact
            />
          </div>
        ))}
      </div>

      <div ref={checkoutRef} className="space-y-4">
        {selected && !isOneTime && (
          <MembershipDurationPicker
            planId={selected}
            value={durationMonths}
            onChange={setDurationMonths}
          />
        )}

        {selected && isOneTime && (
          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 px-4 py-3 text-sm text-teal-900">
            <p className="font-semibold">{selectedPlan?.name}</p>
            <p className="mt-0.5 text-xs text-teal-800/80">
              Tek seferlik · {selectedPrice.toLocaleString('tr-TR')}₺ · mevcut üyeliğinize eklenir
            </p>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handlePay}
            disabled={!selected || !isPaid || saving || selectedPrice <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {selectedPlan
              ? `Ödemeye geç · ${selectedPrice.toLocaleString('tr-TR')}₺`
              : 'Ödemeye geç'}
          </button>
        </div>
      </div>

      <MembershipCancelDialog
        open={stackOpen}
        onClose={() => { if (!saving) setStackOpen(false) }}
        variant="stack"
        planLabel={selectedPlan?.name}
        dateLabel=""
        busy={saving}
        onConfirm={() => {
          setStackOpen(false)
          void startCheckout()
        }}
      />
    </div>
  )
}
