import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  STRIPE_INFLUENCER_COUPON_ID,
  STRIPE_INFLUENCER_COUPON_DURATION,
  INFLUENCER_COMMISSION_RATE,
  INFLUENCER_DISCOUNT_CLAIMED_ERROR,
  computeInfluencerCommissionTry,
  memberHasClaimedInfluencerDiscount,
  mergeInfluencerAttribution,
  applyInfluencerDiscountClaimToData,
  normalizeCommissionBase,
} from '../src/data/influencerPayouts.js'
import { influencerDiscountGate } from '../api/_influencerDiscount.js'
import { influencerInviteEmail, influencerFirstDiscountEmail } from '../api/_mailer.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('influencer coupon constants', () => {
  it('uses a new once coupon id and does not mutate the old forever coupon', () => {
    assert.equal(STRIPE_INFLUENCER_COUPON_ID, 'yeniform_influencer_10_once')
    assert.equal(STRIPE_INFLUENCER_COUPON_DURATION, 'once')
    const payouts = read('src/data/influencerPayouts.js')
    assert.match(payouts, /yeniform_influencer_10_sub/)
    const coupon = read('api/_influencerCoupon.js')
    assert.match(coupon, /STRIPE_INFLUENCER_COUPON_DURATION/)
    assert.equal(coupon.includes('yeniform_influencer_10_sub'), false)
    assert.equal(coupon.includes("'forever'"), false)
  })
})

describe('computeInfluencerCommissionTry', () => {
  it('first payment discounted vs list_price: 2500 list / 2000 paid / 20% → 400 vs 500', () => {
    const discounted = computeInfluencerCommissionTry({
      amountPaidTry: 2000,
      listPriceTry: 2500,
      commissionBase: 'discounted',
      isFirstPayment: true,
      rate: INFLUENCER_COMMISSION_RATE,
    })
    assert.equal(discounted.commissionTry, 400)
    assert.equal(discounted.commissionBase, 'discounted')
    assert.equal(discounted.isFirstPayment, true)

    const list = computeInfluencerCommissionTry({
      amountPaidTry: 2000,
      listPriceTry: 2500,
      commissionBase: 'list_price',
      isFirstPayment: true,
      rate: INFLUENCER_COMMISSION_RATE,
    })
    assert.equal(list.commissionTry, 500)
    assert.equal(list.commissionBase, 'list_price')
  })

  it('renewal uses amount_paid even if commission_base is list_price', () => {
    const renewal = computeInfluencerCommissionTry({
      amountPaidTry: 2500,
      listPriceTry: 2500,
      commissionBase: 'list_price',
      isFirstPayment: false,
    })
    assert.equal(renewal.commissionTry, 500)
    assert.equal(renewal.commissionBase, null)
    assert.equal(renewal.isFirstPayment, false)

    const discountedPaid = computeInfluencerCommissionTry({
      amountPaidTry: 2000,
      listPriceTry: 2500,
      commissionBase: 'list_price',
      isFirstPayment: false,
    })
    assert.equal(discountedPaid.commissionTry, 400)
  })
})

describe('lifetime one-use influencer discount', () => {
  it('detects claimed flag on member or nested data', () => {
    assert.equal(memberHasClaimedInfluencerDiscount(null), false)
    assert.equal(memberHasClaimedInfluencerDiscount({}), false)
    assert.equal(memberHasClaimedInfluencerDiscount({
      influencerDiscountClaimedAt: '2026-09-13T10:00:00.000Z',
    }), true)
    assert.equal(memberHasClaimedInfluencerDiscount({
      data: { influencerDiscountClaimedAt: '2026-09-13T10:00:00.000Z' },
    }), true)
  })

  it('validate/checkout gate rejects coupon when already claimed', () => {
    const influencerRow = { id: 'inf-1', email: 'inf@example.com', code: 'AYSE10' }
    const user = { id: 'mem-1', email: 'uye@example.com' }
    const claimed = influencerDiscountGate({
      user,
      influencerRow,
      memberData: { influencerDiscountClaimedAt: '2026-09-13T10:00:00.000Z' },
    })
    assert.equal(claimed.ok, false)
    assert.equal(claimed.claimed, true)
    assert.equal(claimed.error, INFLUENCER_DISCOUNT_CLAIMED_ERROR)

    const allowed = influencerDiscountGate({
      user,
      influencerRow,
      memberData: {},
    })
    assert.equal(allowed.ok, true)
  })

  it('does not apply a second claim snapshot', () => {
    const first = applyInfluencerDiscountClaimToData({}, {
      influencerId: 'inf-1',
      influencerCode: 'ayse10',
    }, '2026-09-13T10:00:00.000Z')
    assert.equal(first.influencerDiscountClaimedAt, '2026-09-13T10:00:00.000Z')
    assert.equal(first.influencerDiscountCode, 'AYSE10')

    const second = applyInfluencerDiscountClaimToData(first, {
      influencerId: 'inf-2',
      influencerCode: 'OTHER',
    }, '2026-10-01T10:00:00.000Z')
    assert.equal(second.influencerDiscountInfluencerId, 'inf-1')
    assert.equal(second.influencerDiscountCode, 'AYSE10')
  })
})

describe('renewal attribution snapshot', () => {
  it('fills influencer id/code from member data when metadata is missing', () => {
    const merged = mergeInfluencerAttribution(
      { planId: 'vip' },
      {
        influencerDiscountInfluencerId: 'inf-1',
        influencerDiscountCode: 'ayse10',
      },
    )
    assert.equal(merged.influencerId, 'inf-1')
    assert.equal(merged.influencerCode, 'AYSE10')
    assert.equal(merged.planId, 'vip')
  })
})

describe('normalizeCommissionBase', () => {
  it('defaults to discounted', () => {
    assert.equal(normalizeCommissionBase(undefined), 'discounted')
    assert.equal(normalizeCommissionBase('nope', 'list_price'), 'list_price')
    assert.equal(normalizeCommissionBase('list_price'), 'list_price')
  })
})

describe('influencer discount copy contracts', () => {
  it('checkout and webhook enforce the claimed gate and once coupon', () => {
    const checkout = read('api/stripe-checkout.js')
    const validate = read('api/_influencer.js')
    const webhook = read('api/stripe-webhook.js')
    const ui = read('src/components/membership/MemberPlanCheckout.jsx')
    assert.match(checkout, /influencerDiscountGate/)
    assert.match(validate, /influencerDiscountGate/)
    assert.match(webhook, /isFirstPayment: true/)
    assert.match(webhook, /isFirstPayment: false/)
    assert.match(webhook, /influencerFirstDiscountEmail/)
    assert.equal(ui.includes('yenilendikçe'), false)
    assert.match(ui, /INFLUENCER_DISCOUNT_CHECKOUT_COPY/)
    assert.match(ui, /INFLUENCER_DISCOUNT_PREPAID_COPY/)
  })
})

describe('influencer emails', () => {
  it('invite email does not imply forever 10% on renewals', () => {
    const mail = influencerInviteEmail({
      name: 'Ayşe',
      email: 'a@example.com',
      tempPassword: 'x',
      code: 'AYSE10',
      loginUrl: 'https://www.yeniform.com/login',
    })
    assert.match(mail.html, /ilk ödemesinde yüzde 10/)
    assert.equal(mail.html.includes('yenilendikçe'), false)
    assert.match(mail.text, /ilk ödemede yüzde 10/)
  })

  it('member first-discount email explains list-price renewals and one-use', () => {
    const mail = influencerFirstDiscountEmail({
      name: '<script>',
      planName: 'VIP',
      amountPaidLabel: '2.000₺',
      listPriceLabel: '2.500₺',
      durationMonths: 3,
      paymentsUrl: 'https://www.yeniform.com/profile/payments',
    })
    assert.match(mail.subject, /%10 indirim/)
    assert.equal(mail.html.includes('<script>'), false)
    assert.match(mail.html, /liste fiyatından/)
    assert.match(mail.html, /yalnızca bir kez/)
    assert.match(mail.html, /3 aylık peşin/)
    assert.match(mail.text, /liste fiyatındandır/)
  })
})
