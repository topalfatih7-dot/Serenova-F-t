import { getAppUrl } from './_appUrl.js'
import { normalizeEmailAddress } from './_email.js'

/** Checkout / portal dönüşü — istemci Origin/Host yansıtılmaz. */
export function checkoutReturnOrigin() {
  return getAppUrl()
}

/**
 * Stripe müşteri e-postası yalnızca oturumdaki kullanıcıdan.
 * İstek gövdesindeki e-posta kullanılmaz (başka müşteriye bağlanma).
 */
export function checkoutEmailFromAuth(user, memberRow = null) {
  return normalizeEmailAddress(memberRow?.email)
    || normalizeEmailAddress(user?.email)
    || normalizeEmailAddress(user?.user_metadata?.email)
    || ''
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}
