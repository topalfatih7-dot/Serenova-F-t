import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Tag, X } from 'lucide-react'
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
import { validateInfluencerCodeApi } from '../../services/influencerDb'
import { useToast } from '../../context/ToastContext'
import { useApp } from '../../context/AppContext'
import MembershipPlanCard from './MembershipPlanCard'
import MembershipDurationPicker from './MembershipDurationPicker'
import MembershipCancelDialog from './MembershipCancelDialog'
import {
  captureInfluencerRefFromSearch,
  isValidInfluencerCodeFormat,
  normalizeInfluencerCode,
  readStoredInfluencerCode,
  storeInfluencerCode,
} from '../../utils/influencerCode'
import {
  discountedListPriceTry,
  INFLUENCER_DISCOUNT_PERCENT,
  formatInfluencerTry,
} from '../../data/influencerPayouts'

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
  const { isAuthenticated } = useApp()
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
  const [codeInput, setCodeInput] = useState(() => readStoredInfluencerCode())
  const [codeStatus, setCodeStatus] = useState('idle')
  const [codeError, setCodeError] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)
  const checkoutRef = useRef(null)
  const didCancelToast = useRef(false)
  const skipScrollOnce = useRef(true)

  const didAutoApply = useRef(false)

  useEffect(() => {
    const fromQuery = captureInfluencerRefFromSearch(searchParams)
    const stored = fromQuery || readStoredInfluencerCode()
    if (!stored) return
    setCodeInput((prev) => prev || stored)
    if (!isAuthenticated) return
    if (didAutoApply.current) return
    didAutoApply.current = true
    let cancelled = false
    ;(async () => {
      const r = await validateInfluencerCodeApi(stored)
      if (cancelled) return
      if (r.valid) {
        setCodeStatus('valid')
        setCodeError('')
        setAppliedCode(stored)
        storeInfluencerCode(stored)
      }
    })()
    return () => { cancelled = true }
  }, [searchParams, isAuthenticated])

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
  const codeValid = codeStatus === 'valid' && appliedCode
  const chargedPrice = codeValid ? discountedListPriceTry(selectedPrice) : selectedPrice

  const applyDiscountCode = async (raw = codeInput) => {
    const code = normalizeInfluencerCode(raw)
    if (!code) {
      setCodeStatus('idle')
      setCodeError('')
      setAppliedCode('')
      storeInfluencerCode('')
      return { valid: false }
    }
    if (!isValidInfluencerCodeFormat(code)) {
      setCodeStatus('invalid')
      setCodeError('Geçersiz kod.')
      setAppliedCode('')
      return { valid: false, error: 'Geçersiz kod.' }
    }
    setCodeChecking(true)
    try {
      const r = await validateInfluencerCodeApi(code)
      if (r.valid) {
        setCodeStatus('valid')
        setCodeError('')
        setAppliedCode(code)
        storeInfluencerCode(code)
        return { valid: true, code }
      }
      if (/oturum/i.test(String(r.error || ''))) {
        storeInfluencerCode(code)
        setCodeStatus('idle')
        setCodeError('')
        setAppliedCode('')
        return { valid: false, stored: true, code }
      }
      setCodeStatus('invalid')
      setCodeError(r.error || 'Geçersiz kod.')
      setAppliedCode('')
      return { valid: false, error: r.error || 'Geçersiz kod.' }
    } finally {
      setCodeChecking(false)
    }
  }

  const handleSelect = (planId) => {
    setSelected(planId)
  }

  const startCheckout = async () => {
    if (!selected || !isPaid) return
    if (selectedPrice <= 0) {
      toast('Geçersiz plan fiyatı. Lütfen geçerli bir paket seçin.', 'error')
      return
    }
    let discountCode = null
    const typed = normalizeInfluencerCode(codeInput)
    if (typed) {
      if (codeValid && appliedCode === typed) {
        discountCode = appliedCode
      } else {
        const checked = await applyDiscountCode(typed)
        if (!checked.valid) {
          toast(checked.error || 'Geçersiz kod.', 'error')
          return
        }
        discountCode = checked.code
      }
    }
    const payAmount = discountCode ? discountedListPriceTry(selectedPrice) : selectedPrice
    if (payAmount <= 0) {
      toast('İndirim sonrası tutar geçersiz.', 'error')
      return
    }
    setSaving(true)
    const r = await startStripeCheckout(selected, 'change', isOneTime ? 1 : durationMonths, userEmail, discountCode)
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

        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <label htmlFor="influencer-code" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
            <Tag className="h-3.5 w-3.5" /> İndirim kodu
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="influencer-code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={codeInput}
              onChange={(e) => {
                const next = normalizeInfluencerCode(e.target.value)
                setCodeInput(next)
                if (codeStatus !== 'idle') {
                  setCodeStatus('idle')
                  setCodeError('')
                  setAppliedCode('')
                }
              }}
              onBlur={() => {
                if (codeInput) void applyDiscountCode(codeInput)
              }}
              placeholder="Kodunuz varsa girin"
              className={`w-full rounded-xl border bg-white px-4 py-2.5 font-mono text-sm tracking-wide outline-none focus:ring-2 ${
                codeStatus === 'invalid'
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : codeStatus === 'valid'
                    ? 'border-sage-300 focus:border-sage-400 focus:ring-sage-100'
                    : 'border-cream-200 focus:border-brand-400 focus:ring-brand-100'
              }`}
            />
            <button
              type="button"
              onClick={() => void applyDiscountCode(codeInput)}
              disabled={codeChecking || !codeInput}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-100 disabled:opacity-50"
            >
              {codeChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Uygula'}
            </button>
            {codeInput && (
              <button
                type="button"
                aria-label="Kodu temizle"
                onClick={() => {
                  setCodeInput('')
                  setCodeStatus('idle')
                  setCodeError('')
                  setAppliedCode('')
                  storeInfluencerCode('')
                }}
                className="inline-flex items-center justify-center rounded-xl border border-cream-200 p-2.5 text-cream-800/50 hover:bg-cream-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {codeStatus === 'valid' && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-sage-700">
              <Check className="h-4 w-4" />
              İlk ödemede %{INFLUENCER_DISCOUNT_PERCENT} indirim uygulandı. Yenilemeler tam fiyattır.
            </p>
          )}
          {codeStatus === 'invalid' && (
            <p className="mt-2 text-sm font-medium text-red-600">{codeError || 'Geçersiz kod.'}</p>
          )}
          {codeValid && selectedPrice > 0 && (
            <p className="mt-2 text-sm text-cream-800">
              <span className="mr-2 text-cream-800/45 line-through">{formatInfluencerTry(selectedPrice)}</span>
              <span className="font-semibold text-cream-900">{formatInfluencerTry(chargedPrice)}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handlePay}
            disabled={!selected || !isPaid || saving || selectedPrice <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {selectedPlan
              ? `Ödemeye geç · ${chargedPrice.toLocaleString('tr-TR')}₺`
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
