/**
 * Admin gelir SoT: yalnızca gerçek Stripe tahsilatı.
 * Admin paket ataması / RevenueCat / etiketsiz kayıtlar gelire yazılmaz.
 */

const NON_REVENUE_PROVIDERS = new Set(['admin', 'revenuecat'])
const NON_REVENUE_STATUSES = new Set([
  'refunded', 'reversed', 'failed', 'canceled', 'cancelled', 'incomplete', 'void',
])
const KNOWN_PACKAGE_PROVIDERS = new Set(['stripe', 'revenuecat', 'admin'])

function hasStripePaymentFingerprint(payment) {
  return Boolean(
    payment?.stripeSessionId
    || payment?.stripeInvoiceId
    || payment?.stripePaymentIntent
    || payment?.stripeChargeId,
  )
}

function packageProvider(pkg) {
  const p = String(pkg?.provider || '').trim()
  return KNOWN_PACKAGE_PROVIDERS.has(p) ? p : 'legacy'
}

function isOneTimePkg(pkg) {
  if (!pkg) return false
  if (pkg.packageConfig?.billingType === 'one_time') return true
  return false
}

function isActivePkg(pkg, now = new Date().toISOString().split('T')[0]) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePkg(pkg)) return true
  if (!pkg.expiresAt) return true
  return pkg.expiresAt >= now
}

/** Gerçek Stripe tahsilatı mı — admin/hediye kayıtları false. */
export function isStripeRevenuePayment(payment) {
  if (!payment) return false
  if (payment.countsAsRevenue === false) return false
  const status = String(payment.status || 'completed').trim().toLowerCase()
  if (NON_REVENUE_STATUSES.has(status)) return false
  const provider = String(payment.provider || '').trim().toLowerCase()
  if (NON_REVENUE_PROVIDERS.has(provider)) return false
  if (provider === 'stripe') return true
  return hasStripePaymentFingerprint(payment)
}

export function filterStripeRevenuePayments(payments = []) {
  return (payments || []).filter(isStripeRevenuePayment)
}

export function sumStripeRevenue(payments = []) {
  return filterStripeRevenuePayments(payments).reduce((sum, p) => {
    const amount = Number(p.amount)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
}

/**
 * Stripe abonelik paketi — admin / RC / tek seferlik hariç.
 * Legacy paket yalnızca üye veya pakette Stripe abonelik id varsa sayılır.
 */
export function isStripeRecurringPackage(pkg, member = null) {
  if (!pkg || !isActivePkg(pkg)) return false
  if (isOneTimePkg(pkg)) return false
  const provider = packageProvider(pkg)
  if (provider === 'admin' || provider === 'revenuecat') return false
  if (provider === 'stripe') return true
  if (String(pkg.stripeSubscriptionId || '').trim()) return true
  if (provider === 'legacy' && String(member?.stripeSubscriptionId || '').trim()) return true
  return false
}

export function stripePackageMonthlyAmount(pkg) {
  if (!pkg) return 0
  const months = Math.max(1, Number(pkg.packageConfig?.durationMonths) || 1)
  const stored = Number(pkg.price)
  if (Number.isFinite(stored) && stored > 0) return stored / months
  return 0
}

function packagesOf(member) {
  if (Array.isArray(member?.activePackages)) return member.activePackages
  if (member?.stripeSubscriptionId && member.membership && member.membership !== 'free') {
    return [{
      status: 'active',
      provider: 'legacy',
      stripeSubscriptionId: member.stripeSubscriptionId,
      planId: member.membership,
      price: Number(member.planPrice) || 0,
      packageConfig: member.packageConfig || { durationMonths: 1 },
      expiresAt: member.premiumExpiresAt || null,
    }]
  }
  return []
}

/** Aktif (paused/cancelled değil) üyelerin Stripe abonelik MRR’i. */
export function computeStripeMrr(members = []) {
  return (members || []).reduce((sum, member) => {
    const status = member?.membershipStatus
    if (status === 'paused' || status === 'cancelled') return sum
    if (status && status !== 'active' && status !== 'expiring') return sum
    for (const pkg of packagesOf(member)) {
      if (!isStripeRecurringPackage(pkg, member)) continue
      sum += stripePackageMonthlyAmount(pkg)
    }
    return sum
  }, 0)
}
