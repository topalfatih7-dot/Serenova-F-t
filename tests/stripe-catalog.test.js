import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogLookupKey,
  catalogTiersFromPlan,
  catalogPriceMatchesStripePrice,
  shouldNotifyAmountChange,
  shouldSendT7Reminder,
  isWithinUpcomingDays,
  daysUntilPeriodEnd,
  zamCoversT7,
  recordPriceNotice,
  noticeChargeKey,
  collectMemberStripeSubscriptionRefs,
  subscriptionIntervalCount,
  subscriptionMatchesTier,
  LIVE_SUBSCRIPTION_STATUSES,
  CATALOG_PRORATION,
} from '../src/utils/stripeCatalog.js'

describe('stripe catalog lookup', () => {
  it('builds stable lookup keys', () => {
    assert.equal(catalogLookupKey('eko_diyet', 1), 'yeniform_eko_diyet_1m')
    assert.equal(catalogLookupKey('vip', 6), 'yeniform_vip_6m')
  })

  it('lists recurring tiers and one-time doktor', () => {
    const rec = catalogTiersFromPlan({
      id: 'diyet',
      price: 2499,
      pricingTiers: [
        { months: 1, price: 2499 },
        { months: 3, price: 6499 },
        { months: 6, price: 9999 },
      ],
    })
    assert.equal(rec.length, 3)
    assert.equal(rec[1].price, 6499)

    const doc = catalogTiersFromPlan({
      id: 'doktor',
      billingType: 'one_time',
      price: 1500,
      pricingTiers: [{ months: 1, price: 1500 }],
    })
    assert.equal(doc.length, 1)
    assert.equal(doc[0].oneTime, true)
  })

  it('matches stripe price amount, currency and interval', () => {
    const price = {
      unit_amount: 129900,
      currency: 'try',
      recurring: { interval: 'month', interval_count: 1 },
    }
    assert.equal(catalogPriceMatchesStripePrice(price, { unitAmount: 129900, months: 1, oneTime: false }), true)
    assert.equal(catalogPriceMatchesStripePrice(price, { unitAmount: 149900, months: 1, oneTime: false }), false)
    assert.equal(catalogPriceMatchesStripePrice(price, { unitAmount: 129900, months: 3, oneTime: false }), false)
  })
})

describe('amount change and T-7 window', () => {
  it('notifies only when catalog amount differs', () => {
    assert.equal(shouldNotifyAmountChange(1299, 1599), true)
    assert.equal(shouldNotifyAmountChange(1299, 1299), false)
    assert.equal(shouldNotifyAmountChange(1599, 1299), true)
  })

  it('treats next 7 days as reminder window', () => {
    const now = new Date('2026-12-25T12:00:00.000Z')
    const inFive = new Date('2026-12-30T12:00:00.000Z')
    const inTen = new Date('2027-01-05T12:00:00.000Z')
    assert.equal(isWithinUpcomingDays(inFive, 7, now), true)
    assert.equal(isWithinUpcomingDays(inTen, 7, now), false)
    assert.ok(daysUntilPeriodEnd(inFive, now) <= 7)
  })

  it('skips T-7 when renewal is cancelled', () => {
    const periodEnd = Math.floor(Date.now() / 1000) + 3 * 24 * 3600
    assert.equal(shouldSendT7Reminder({
      cancelAtPeriodEnd: true,
      periodEnd,
      amount: 1599,
      notices: [],
      subId: 'sub_1',
    }), false)
  })

  it('skips T-7 when zam mail in last 7 days covers same periodEnd+amount', () => {
    const now = new Date('2026-12-28T10:00:00.000Z')
    const periodEnd = '2027-01-01'
    const notices = recordPriceNotice([], {
      subId: 'sub_1',
      periodEnd,
      amount: 1599,
      kind: 'zam',
      status: 'sent',
      at: '2026-12-27T10:00:00.000Z',
    })
    assert.equal(zamCoversT7(notices, { subId: 'sub_1', periodEnd, amount: 1599, now }), true)
    assert.equal(shouldSendT7Reminder({
      cancelAtPeriodEnd: false,
      periodEnd,
      amount: 1599,
      notices,
      subId: 'sub_1',
      now,
    }), false)
  })

  it('sends T-7 if zam was months earlier for the same June charge', () => {
    const now = new Date('2026-05-25T10:00:00.000Z')
    const periodEnd = '2026-06-01'
    const notices = recordPriceNotice([], {
      subId: 'sub_6m',
      periodEnd,
      amount: 4499,
      kind: 'zam',
      status: 'sent',
      at: '2025-12-12T10:00:00.000Z',
    })
    assert.equal(zamCoversT7(notices, { subId: 'sub_6m', periodEnd, amount: 4499, now }), false)
    assert.equal(shouldSendT7Reminder({
      cancelAtPeriodEnd: false,
      periodEnd,
      amount: 4499,
      notices,
      subId: 'sub_6m',
      now,
    }), true)
  })

  it('keys notices by sub + day + amount', () => {
    assert.equal(
      noticeChargeKey('sub_1', '2027-01-01T15:00:00.000Z', 1599),
      'sub_1|2027-01-01|1599',
    )
  })
})

describe('member stripe refs and interval', () => {
  it('collects stripe packages and skips revenuecat / doktor', () => {
    const refs = collectMemberStripeSubscriptionRefs({
      id: 'm1',
      membership: 'vip',
      data: {
        activePackages: [
          {
            status: 'active',
            planId: 'eko_diyet',
            provider: 'stripe',
            stripeSubscriptionId: 'sub_a',
            packageConfig: { durationMonths: 3 },
          },
          {
            status: 'active',
            planId: 'doktor',
            provider: 'stripe',
            stripeSubscriptionId: 'sub_doc',
            packageConfig: { billingType: 'one_time' },
          },
          {
            status: 'active',
            planId: 'spor',
            provider: 'revenuecat',
            stripeSubscriptionId: 'sub_rc',
            packageConfig: { durationMonths: 1 },
          },
        ],
      },
    })
    assert.equal(refs.length, 1)
    assert.equal(refs[0].subscriptionId, 'sub_a')
    assert.equal(refs[0].durationMonths, 3)
  })

  it('reads interval_count from subscription item', () => {
    const sub = {
      status: 'active',
      metadata: { planId: 'vip' },
      items: { data: [{ price: { recurring: { interval_count: 6 }, unit_amount: 1999900 } }] },
    }
    assert.equal(subscriptionIntervalCount(sub), 6)
    assert.equal(subscriptionMatchesTier(sub, { planId: 'vip', months: 6 }), true)
    assert.equal(subscriptionMatchesTier(sub, { planId: 'vip', months: 1 }), false)
    assert.equal(LIVE_SUBSCRIPTION_STATUSES.has('active'), true)
  })
})

describe('proration', () => {
  it('never charges the difference mid-cycle', () => {
    assert.equal(CATALOG_PRORATION, 'none')
  })
})
