const GRACE_KEY = 'yeniform-stripe-payment-grace'
const GRACE_MS = 3 * 60 * 1000

export function markStripePaymentGrace() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(GRACE_KEY, String(Date.now()))
}

export function clearStripePaymentGrace() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(GRACE_KEY)
}

export function isStripePaymentGraceActive() {
  if (typeof sessionStorage === 'undefined') return false
  const ts = Number(sessionStorage.getItem(GRACE_KEY))
  if (!ts || Number.isNaN(ts)) return false
  if (Date.now() - ts > GRACE_MS) {
    sessionStorage.removeItem(GRACE_KEY)
    return false
  }
  return true
}

/** Stripe success redirect — hydrate hook'tan önce çalışır; grace hemen işaretlenir */
export function ensurePaymentReturnGraceFromUrl() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('payment') !== 'success') return false
  markStripePaymentGrace()
  return true
}

export function shouldSkipExpiryPersistDuringPayment() {
  return ensurePaymentReturnGraceFromUrl() || isStripePaymentGraceActive()
}
