/** Stripe katalog fiyatı — lookup_key, yenileme bildirimi, T-7 tekilleştirme. */

export const PRICE_REMINDER_DAYS = 7
export const CATALOG_PRORATION = 'none'
export const LIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due'])

export function catalogLookupKey(planId, months = 1) {
  const id = String(planId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  const m = Number(months) || 1
  return `yeniform_${id || 'plan'}_${m}m`
}

export function formatTryAmount(amount) {
  const n = Math.round(Number(amount) || 0)
  return `${n.toLocaleString('tr-TR')}₺`
}

export function toPeriodEndDate(periodEnd) {
  if (periodEnd == null || periodEnd === '') return null
  if (periodEnd instanceof Date) {
    return Number.isNaN(periodEnd.getTime()) ? null : periodEnd
  }
  const n = Number(periodEnd)
  if (Number.isFinite(n) && n > 0) {
    const ms = n > 1e12 ? n : n * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(periodEnd)
  return Number.isNaN(d.getTime()) ? null : d
}

export function periodEndKey(periodEnd) {
  const d = toPeriodEndDate(periodEnd)
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

export function formatChargeDateTr(periodEnd) {
  const d = toPeriodEndDate(periodEnd)
  if (!d) return '—'
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  })
}

export function daysUntilPeriodEnd(periodEnd, now = new Date()) {
  const end = toPeriodEndDate(periodEnd)
  if (!end) return null
  const ms = end.getTime() - now.getTime()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function isWithinUpcomingDays(periodEnd, days = PRICE_REMINDER_DAYS, now = new Date()) {
  const n = daysUntilPeriodEnd(periodEnd, now)
  if (n == null) return false
  return n >= 0 && n <= Number(days)
}

export function noticeChargeKey(subId, periodEnd, amount) {
  const sid = String(subId || '').trim()
  const amt = Math.round(Number(amount) || 0)
  return `${sid}|${periodEndKey(periodEnd)}|${amt}`
}

export function normalizePriceNotices(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter((n) => n && typeof n === 'object' && n.subId)
}

export function recordPriceNotice(notices, entry, cap = 40) {
  const next = [
    ...normalizePriceNotices(notices),
    {
      subId: String(entry.subId || '').trim(),
      periodEnd: periodEndKey(entry.periodEnd),
      amount: Math.round(Number(entry.amount) || 0),
      kind: entry.kind === 'remind' ? 'remind' : 'zam',
      status: entry.status === 'pending' ? 'pending' : 'sent',
      at: entry.at || new Date().toISOString(),
    },
  ]
  return next.slice(-cap)
}

export function hasNoticeForCharge(notices, { subId, periodEnd, amount, kinds = ['zam', 'remind'] }) {
  const key = noticeChargeKey(subId, periodEnd, amount)
  return normalizePriceNotices(notices).some((n) => (
    noticeChargeKey(n.subId, n.periodEnd, n.amount) === key
    && kinds.includes(n.kind)
    && n.status !== 'pending'
  ))
}

export function zamCoversT7(notices, { subId, periodEnd, amount, now = new Date(), withinDays = PRICE_REMINDER_DAYS }) {
  const key = noticeChargeKey(subId, periodEnd, amount)
  const since = now.getTime() - Number(withinDays) * 24 * 60 * 60 * 1000
  return normalizePriceNotices(notices).some((n) => (
    n.kind === 'zam'
    && n.status !== 'pending'
    && noticeChargeKey(n.subId, n.periodEnd, n.amount) === key
    && new Date(n.at).getTime() >= since
  ))
}

export function shouldNotifyAmountChange(previousAmount, nextAmount) {
  return Math.round(Number(previousAmount) || 0) !== Math.round(Number(nextAmount) || 0)
}

export function shouldSendT7Reminder({
  cancelAtPeriodEnd,
  periodEnd,
  amount,
  notices,
  subId,
  now = new Date(),
}) {
  if (cancelAtPeriodEnd) return false
  if (!isWithinUpcomingDays(periodEnd, PRICE_REMINDER_DAYS, now)) return false
  if (hasNoticeForCharge(notices, { subId, periodEnd, amount, kinds: ['remind'] })) return false
  if (zamCoversT7(notices, { subId, periodEnd, amount, now })) return false
  return true
}

export function pendingPriceNotices(notices) {
  return normalizePriceNotices(notices).filter((n) => n.status === 'pending')
}

export function markNoticeSent(notices, { subId, periodEnd, amount, kind }) {
  const key = noticeChargeKey(subId, periodEnd, amount)
  return normalizePriceNotices(notices).map((n) => {
    if (n.status !== 'pending') return n
    if (n.kind !== kind) return n
    if (noticeChargeKey(n.subId, n.periodEnd, n.amount) !== key) return n
    return { ...n, status: 'sent', at: new Date().toISOString() }
  })
}

export function catalogTiersFromPlan(plan) {
  if (!plan || plan.id === 'free') return []
  const oneTime = plan.billingType === 'one_time'
  const tiers = Array.isArray(plan.pricingTiers || plan.pricing_tiers)
    ? (plan.pricingTiers || plan.pricing_tiers)
    : []
  const priceFor = (months) => {
    const m = Number(months) || 1
    const hit = tiers.find((t) => Number(t.months) === m)
    if (hit != null && Number(hit.price) > 0) return Number(hit.price)
    if (m === 1 && Number(plan.price) > 0) return Number(plan.price)
    return 0
  }
  if (oneTime) {
    const price = priceFor(1)
    return price > 0 ? [{ months: 1, price, oneTime: true }] : []
  }
  const out = []
  for (const months of [1, 3, 6]) {
    const price = priceFor(months)
    if (price > 0) out.push({ months, price, oneTime: false })
  }
  return out
}

export function catalogPriceMatchesStripePrice(price, { unitAmount, months, oneTime }) {
  if (!price) return false
  if (Number(price.unit_amount) !== Number(unitAmount)) return false
  const currency = String(price.currency || '').toLowerCase()
  if (currency && currency !== 'try') return false
  if (oneTime) return !price.recurring
  return price.recurring?.interval === 'month'
    && Number(price.recurring.interval_count) === Number(months)
}

export function primarySubscriptionItem(subscription) {
  const items = subscription?.items?.data
  if (!Array.isArray(items) || !items.length) return null
  return items[0]
}

export function subscriptionUnitAmount(subscription) {
  const item = primarySubscriptionItem(subscription)
  const price = item?.price
  if (price && typeof price === 'object') return Number(price.unit_amount) || 0
  return 0
}

export function subscriptionIntervalCount(subscription) {
  const item = primarySubscriptionItem(subscription)
  const price = item?.price
  if (price && typeof price === 'object' && price.recurring) {
    return Number(price.recurring.interval_count) || 1
  }
  const meta = Number(subscription?.metadata?.durationMonths)
  return [1, 3, 6].includes(meta) ? meta : 1
}

export function subscriptionMatchesTier(subscription, { planId, months }) {
  if (!LIVE_SUBSCRIPTION_STATUSES.has(String(subscription?.status || ''))) return false
  const metaPlan = String(subscription?.metadata?.planId || '').trim()
  if (metaPlan && metaPlan !== String(planId)) return false
  return Number(subscriptionIntervalCount(subscription)) === Number(months)
}

export function collectMemberStripeSubscriptionRefs(memberRow = {}) {
  const data = memberRow.data && typeof memberRow.data === 'object' ? memberRow.data : memberRow
  const membership = memberRow.membership || data.membership || ''
  const refs = []
  const packages = Array.isArray(data.activePackages) ? data.activePackages : []
  for (const pkg of packages) {
    if (pkg?.status && pkg.status !== 'active') continue
    if (pkg?.packageConfig?.billingType === 'one_time') continue
    const provider = String(pkg?.provider || 'stripe').trim()
    if (provider === 'revenuecat' || provider === 'admin') continue
    const sid = String(pkg?.stripeSubscriptionId || '').trim()
    if (!sid) continue
    refs.push({
      subscriptionId: sid,
      planId: pkg.planId,
      durationMonths: Number(pkg.packageConfig?.durationMonths) || 1,
      cancelAtPeriodEnd: Boolean(pkg.cancelAtPeriodEnd),
      currentPeriodEnd: pkg.currentPeriodEnd || pkg.expiresAt || null,
      memberId: memberRow.id || data.id || null,
    })
  }
  const legacySid = String(data.stripeSubscriptionId || '').trim()
  if (
    legacySid
    && !refs.some((r) => r.subscriptionId === legacySid)
    && membership
    && membership !== 'free'
  ) {
    refs.push({
      subscriptionId: legacySid,
      planId: membership,
      durationMonths: Number(data.packageConfig?.durationMonths) || 1,
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
      currentPeriodEnd: data.currentPeriodEnd || data.premiumExpiresAt || null,
      memberId: memberRow.id || data.id || null,
    })
  }
  return refs
}

export function stripeSearchLiteral(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
