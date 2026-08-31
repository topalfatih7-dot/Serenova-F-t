import {
  STAFF_EARNING_STATUS,
  formatStaffPayoutPeriodLabel,
  formatStaffPayoutWindowLabel,
  nextStaffPayoutPeriodKey,
  staffPayoutPeriodKey,
} from './staffPayouts.js'

export const INFLUENCER_DISCOUNT_PERCENT = 10
export const INFLUENCER_COMMISSION_RATE = 0.20
/** Stripe kupon süresi immutable; once olan eski `yeniform_influencer_10` kullanılmaz. */
export const STRIPE_INFLUENCER_COUPON_ID = 'yeniform_influencer_10_sub'
export const STRIPE_INFLUENCER_COUPON_DURATION = 'forever'

export const INFLUENCER_EARNING_STATUS = STAFF_EARNING_STATUS

export {
  formatStaffPayoutPeriodLabel as formatInfluencerPayoutPeriodLabel,
  formatStaffPayoutWindowLabel as formatInfluencerPayoutWindowLabel,
  nextStaffPayoutPeriodKey as nextInfluencerPayoutPeriodKey,
  staffPayoutPeriodKey as influencerPayoutPeriodKey,
}

export function discountedListPriceTry(listPriceTry, percent = INFLUENCER_DISCOUNT_PERCENT) {
  const list = Number(listPriceTry) || 0
  const pct = Number(percent) || 0
  if (list <= 0) return 0
  return Math.round(list * (100 - pct)) / 100
}

export function commissionFromPaidMinor(amountTotalMinor, rate = INFLUENCER_COMMISSION_RATE) {
  const minor = Number(amountTotalMinor) || 0
  return Math.round(minor * rate) / 100
}

export function formatInfluencerTry(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export function isCountableInfluencerEarning(row) {
  return row?.status === 'pending' || row?.status === 'approved' || row?.status === 'paid'
}

export function summarizeInfluencerEarnings(rows = []) {
  const countable = (rows || []).filter(isCountableInfluencerEarning)
  const pendingRows = (rows || []).filter((r) => r.status === 'pending' || r.status === 'approved')
  const uniqueCustomers = new Set(countable.map((r) => r.member_id).filter(Boolean)).size
  const gmv = countable.reduce((s, r) => s + Number(r.amount_paid_try || 0), 0)
  const pending = pendingRows.reduce((s, r) => s + Number(r.commission_try || 0), 0)
  const paid = (rows || [])
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + Number(r.commission_try || 0), 0)
  const total = countable.reduce((s, r) => s + Number(r.commission_try || 0), 0)
  return { uniqueCustomers, gmv, pending, paid, total, pendingRows }
}
