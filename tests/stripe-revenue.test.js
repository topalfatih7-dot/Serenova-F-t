import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isStripeRevenuePayment,
  sumStripeRevenue,
  isStripeRecurringPackage,
  stripePackageMonthlyAmount,
  computeStripeMrr,
} from '../src/utils/stripeRevenue.js'

const stripePayment = {
  id: 'pay-stripe',
  memberId: 'm-stripe',
  amount: 2700,
  provider: 'stripe',
  status: 'completed',
  stripeSessionId: 'cs_test_1',
  createdAt: '2026-03-10T12:00:00.000Z',
}

const adminPayment = {
  id: 'pay-admin',
  memberId: 'm-admin',
  amount: 7425,
  provider: 'admin',
  kind: 'admin_grant',
  countsAsRevenue: false,
  status: 'completed',
  createdAt: '2026-03-11T12:00:00.000Z',
}

describe('isStripeRevenuePayment', () => {
  it('counts Stripe provider and fingerprint, skips admin / RC / refunds', () => {
    assert.equal(isStripeRevenuePayment(stripePayment), true)
    assert.equal(isStripeRevenuePayment({
      amount: 4050,
      stripeInvoiceId: 'in_1',
      status: 'completed',
    }), true)
    assert.equal(isStripeRevenuePayment(adminPayment), false)
    assert.equal(isStripeRevenuePayment({ amount: 100, provider: 'revenuecat' }), false)
    assert.equal(isStripeRevenuePayment({
      amount: 2700,
      provider: 'stripe',
      status: 'refunded',
    }), false)
    assert.equal(isStripeRevenuePayment({ amount: 5000, status: 'completed' }), false)
  })
})

describe('sumStripeRevenue', () => {
  it('excludes admin grants from the total', () => {
    assert.equal(sumStripeRevenue([stripePayment, adminPayment]), 2700)
  })
})

describe('stacked Stripe + admin packages', () => {
  it('MRR counts only the Stripe row', () => {
    const member = {
      id: 'm-mix',
      membership: 'vip',
      membershipStatus: 'active',
      activePackages: [
        {
          id: 'pkg-s',
          planId: 'eko_diyet',
          status: 'active',
          provider: 'stripe',
          stripeSubscriptionId: 'sub_a',
          price: 8100,
          packageConfig: { durationMonths: 3 },
          expiresAt: '2027-01-01',
        },
        {
          id: 'pkg-a',
          planId: 'spor',
          status: 'active',
          provider: 'admin',
          price: 4050,
          packageConfig: { durationMonths: 1 },
          expiresAt: '2027-01-01',
        },
      ],
    }
    assert.equal(isStripeRecurringPackage(member.activePackages[0], member), true)
    assert.equal(isStripeRecurringPackage(member.activePackages[1], member), false)
    assert.equal(stripePackageMonthlyAmount(member.activePackages[0]), 2700)
    assert.equal(computeStripeMrr([member]), 2700)
    assert.equal(computeStripeMrr([{
      ...member,
      activePackages: [member.activePackages[1]],
    }]), 0)
  })
})
