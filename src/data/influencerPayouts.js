import {
  STAFF_EARNING_STATUS,
  formatStaffPayoutPeriodLabel,
  formatStaffPayoutWindowLabel,
  nextStaffPayoutPeriodKey,
  staffPayoutPeriodKey,
} from './staffPayouts.js'

export const INFLUENCER_DISCOUNT_PERCENT = 10
export const INFLUENCER_COMMISSION_RATE = 0.20

/**
 * Stripe kupon süresi immutable.
 * Eski forever kupon `yeniform_influencer_10_sub` dokunulmaz; yeni checkout `once` kullanır.
 * Daha eski once denemesi: `yeniform_influencer_10`.
 */
export const STRIPE_INFLUENCER_COUPON_ID = 'yeniform_influencer_10_once'
export const STRIPE_INFLUENCER_COUPON_DURATION = 'once'

export const INFLUENCER_COMMISSION_BASE = {
  DISCOUNTED: 'discounted',
  LIST_PRICE: 'list_price',
}

export const INFLUENCER_DISCOUNT_CLAIMED_ERROR =
  'Influencer indirimi bu hesapta daha önce kullanıldı. Sonraki ödemeler liste fiyatındandır.'

export const INFLUENCER_DISCOUNT_CHECKOUT_COPY =
  'Kodunuz yalnızca ilk ödemede %10 indirim sağlar. Sonraki yenilemeler güncel liste fiyatından tahsil edilir. Bu indirim hesabınızda yalnızca bir kez kullanılabilir.'

export const INFLUENCER_DISCOUNT_PREPAID_COPY =
  '3 veya 6 aylık peşin ödemede indirim, bu Checkout’taki toplam ilk ödemeye bir kez uygulanır; sonraki dönemler liste fiyatındandır.'

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

export function normalizeCommissionBase(raw, fallback = INFLUENCER_COMMISSION_BASE.DISCOUNTED) {
  if (raw === INFLUENCER_COMMISSION_BASE.LIST_PRICE) return INFLUENCER_COMMISSION_BASE.LIST_PRICE
  if (raw === INFLUENCER_COMMISSION_BASE.DISCOUNTED) return INFLUENCER_COMMISSION_BASE.DISCOUNTED
  return fallback === INFLUENCER_COMMISSION_BASE.LIST_PRICE
    ? INFLUENCER_COMMISSION_BASE.LIST_PRICE
    : INFLUENCER_COMMISSION_BASE.DISCOUNTED
}

/**
 * İlk ödemede komisyon tabanı influencer.commission_base;
 * yenilemede her zaman ödenen tutar (liste fiyatı).
 */
export function computeInfluencerCommissionTry({
  amountPaidTry,
  listPriceTry,
  commissionBase,
  isFirstPayment,
  rate = INFLUENCER_COMMISSION_RATE,
} = {}) {
  const paid = Number(amountPaidTry) || 0
  const list = Number(listPriceTry) || 0
  const first = Boolean(isFirstPayment)
  const snapshotBase = first ? normalizeCommissionBase(commissionBase) : null
  const baseAmount = first && snapshotBase === INFLUENCER_COMMISSION_BASE.LIST_PRICE
    ? (list > 0 ? list : paid)
    : paid
  const commissionTry = Math.round(baseAmount * rate * 100) / 100
  return {
    commissionTry,
    commissionBase: snapshotBase,
    isFirstPayment: first,
    baseAmountTry: baseAmount,
  }
}

export function memberHasClaimedInfluencerDiscount(source) {
  if (!source || typeof source !== 'object') return false
  const at = source.influencerDiscountClaimedAt
    || source.data?.influencerDiscountClaimedAt
  return Boolean(at)
}

export function influencerDiscountClaimFields({ claimedAt, code, influencerId } = {}) {
  return {
    influencerDiscountClaimedAt: claimedAt,
    influencerDiscountCode: String(code || '').trim().toUpperCase(),
    influencerDiscountInfluencerId: String(influencerId || '').trim(),
  }
}

export function applyInfluencerDiscountClaimToData(data, meta, claimedAt) {
  const next = data && typeof data === 'object' ? { ...data } : {}
  if (!meta?.influencerId) return next
  if (memberHasClaimedInfluencerDiscount(next)) return next
  return {
    ...next,
    ...influencerDiscountClaimFields({
      claimedAt,
      code: meta.influencerCode,
      influencerId: meta.influencerId,
    }),
  }
}

export function mergeInfluencerAttribution(meta = {}, memberData = {}) {
  const data = memberData?.data && typeof memberData.data === 'object'
    ? { ...memberData.data, ...memberData }
    : (memberData || {})
  const influencerId = String(
    meta.influencerId || data.influencerDiscountInfluencerId || '',
  ).trim()
  const influencerCode = String(
    meta.influencerCode || data.influencerDiscountCode || '',
  ).trim().toUpperCase()
  return {
    ...meta,
    influencerId,
    influencerCode,
  }
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
