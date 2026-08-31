import {
  STRIPE_INFLUENCER_COUPON_ID,
  STRIPE_INFLUENCER_COUPON_DURATION,
  INFLUENCER_DISCOUNT_PERCENT,
} from '../src/data/influencerPayouts.js'

export async function ensureInfluencerCoupon(stripe) {
  try {
    const existing = await stripe.coupons.retrieve(STRIPE_INFLUENCER_COUPON_ID)
    if (existing && !existing.deleted) {
      const percent = Number(existing.percent_off)
      if (
        existing.duration !== STRIPE_INFLUENCER_COUPON_DURATION
        || percent !== INFLUENCER_DISCOUNT_PERCENT
      ) {
        throw new Error(
          `Stripe kuponu ${STRIPE_INFLUENCER_COUPON_ID} abonelik süresince %${INFLUENCER_DISCOUNT_PERCENT} olmalı.`,
        )
      }
      return existing
    }
  } catch (e) {
    if (e?.statusCode !== 404 && e?.code !== 'resource_missing') {
      throw e
    }
  }
  return stripe.coupons.create({
    id: STRIPE_INFLUENCER_COUPON_ID,
    percent_off: INFLUENCER_DISCOUNT_PERCENT,
    duration: STRIPE_INFLUENCER_COUPON_DURATION,
    name: 'Influencer %10 (abonelik)',
  })
}
