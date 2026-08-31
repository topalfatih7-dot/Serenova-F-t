import { STRIPE_INFLUENCER_COUPON_ID, INFLUENCER_DISCOUNT_PERCENT } from '../src/data/influencerPayouts.js'

export async function ensureInfluencerCoupon(stripe) {
  try {
    const existing = await stripe.coupons.retrieve(STRIPE_INFLUENCER_COUPON_ID)
    if (existing && !existing.deleted) return existing
  } catch (e) {
    if (e?.statusCode !== 404 && e?.code !== 'resource_missing') {
      throw e
    }
  }
  return stripe.coupons.create({
    id: STRIPE_INFLUENCER_COUPON_ID,
    percent_off: INFLUENCER_DISCOUNT_PERCENT,
    duration: 'once',
    name: 'Influencer %10',
  })
}
