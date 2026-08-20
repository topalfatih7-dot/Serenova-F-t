import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolvePackagePurchase,
  expirePackageBySubscriptionId,
  applyStripeSubscriptionState,
  extendPackageForSubscription,
  findPackageBySubscriptionId,
  isPackageEntryActive,
} from '../api/_memberPackages.js'

const cfg = (planId, months = 1) => ({
  planId,
  durationMonths: months,
  coachMeetingsPerMonth: planId === 'vip' || planId === 'spor' ? 2 : 0,
  dietitianMeetingsPerMonth: planId === 'vip' || planId === 'diyet' || planId === 'eko_diyet' ? 1 : 0,
})

function memberWithPackages(packages, extra = {}) {
  return {
    id: 'm1',
    membership: extra.membership || 'eko_diyet',
    membershipStatus: 'active',
    stripeSubscriptionId: extra.stripeSubscriptionId || null,
    activePackages: packages,
    doctorSessions: [],
    coachSessions: [],
    dietitianSessions: [],
  }
}

describe('stripe stacking + per-subscription expire', () => {
  it('adds a second Stripe subscription instead of replacing the first', () => {
    const first = resolvePackagePurchase([], 'eko_diyet', cfg('eko_diyet'), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_a',
      expiresAt: '2026-12-01',
    })
    const stacked = resolvePackagePurchase(first, 'vip', cfg('vip'), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_b',
      expiresAt: '2026-10-01',
    })
    const active = stacked.filter((p) => p.status === 'active')
    assert.equal(active.length, 2)
    assert.ok(active.some((p) => p.planId === 'eko_diyet' && p.stripeSubscriptionId === 'sub_a'))
    assert.ok(active.some((p) => p.planId === 'vip' && p.stripeSubscriptionId === 'sub_b'))
  })

  it('upserts the same stripeSubscriptionId instead of duplicating', () => {
    const first = resolvePackagePurchase([], 'eko_diyet', cfg('eko_diyet'), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_a',
      expiresAt: '2026-12-01',
    })
    const again = resolvePackagePurchase(first, 'eko_diyet', cfg('eko_diyet', 3), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_a',
      expiresAt: '2027-03-01',
    })
    assert.equal(again.filter((p) => p.stripeSubscriptionId === 'sub_a').length, 1)
    assert.equal(again[0].expiresAt, '2027-03-01')
  })

  it('expires only the matching subscription and keeps the other paid', () => {
    const packages = resolvePackagePurchase(
      resolvePackagePurchase([], 'eko_diyet', cfg('eko_diyet'), {
        provider: 'stripe',
        stripeSubscriptionId: 'sub_a',
        expiresAt: '2026-12-01',
      }),
      'vip',
      cfg('vip'),
      { provider: 'stripe', stripeSubscriptionId: 'sub_b', expiresAt: '2026-10-01' },
    )
    const after = expirePackageBySubscriptionId(
      memberWithPackages(packages, { membership: 'vip' }),
      'sub_a',
    )
    const active = after.activePackages.filter((p) => isPackageEntryActive(p))
    assert.equal(active.length, 1)
    assert.equal(active[0].planId, 'vip')
    assert.equal(after.membership, 'vip')
  })

  it('does not expire every Stripe package when the id is unknown', () => {
    const packages = resolvePackagePurchase([], 'vip', cfg('vip'), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_live',
      expiresAt: '2026-12-01',
    })
    const before = memberWithPackages(packages, { membership: 'vip' })
    const after = expirePackageBySubscriptionId(before, 'sub_other')
    assert.equal(after.activePackages.filter((p) => isPackageEntryActive(p)).length, 1)
    assert.equal(after.membership, 'vip')
  })

  it('maps cancel_at_period_end onto the matching package only', () => {
    const packages = [
      ...resolvePackagePurchase([], 'eko_diyet', cfg('eko_diyet'), {
        provider: 'stripe',
        stripeSubscriptionId: 'sub_a',
        expiresAt: '2026-12-01',
      }),
      ...resolvePackagePurchase([], 'vip', cfg('vip'), {
        provider: 'stripe',
        stripeSubscriptionId: 'sub_b',
        expiresAt: '2026-10-01',
      }),
    ]
    const after = applyStripeSubscriptionState(
      memberWithPackages(packages, { membership: 'vip' }),
      {
        id: 'sub_a',
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: Math.floor(Date.parse('2026-12-01T00:00:00Z') / 1000),
      },
    )
    const a = after.activePackages.find((p) => p.stripeSubscriptionId === 'sub_a')
    const b = after.activePackages.find((p) => p.stripeSubscriptionId === 'sub_b')
    assert.equal(a.cancelAtPeriodEnd, true)
    assert.equal(Boolean(b.cancelAtPeriodEnd), false)
    assert.equal(isPackageEntryActive(a), true)
  })

  it('legacy member-level stripeSubscriptionId binds a single unlabeled package', () => {
    const pkg = {
      id: 'legacy-1',
      planId: 'eko_diyet',
      packageConfig: cfg('eko_diyet'),
      status: 'active',
      expiresAt: '2026-12-01',
      provider: 'legacy',
    }
    const found = findPackageBySubscriptionId([pkg], 'sub_old', {
      stripeSubscriptionId: 'sub_old',
    })
    assert.equal(found?.id, 'legacy-1')
  })

  it('renewal extends the matching package instead of adding another', () => {
    const packages = resolvePackagePurchase([], 'eko_diyet', cfg('eko_diyet'), {
      provider: 'stripe',
      stripeSubscriptionId: 'sub_a',
      expiresAt: '2026-09-01',
    })
    const after = extendPackageForSubscription(
      memberWithPackages(packages),
      'sub_a',
      { expiresAt: '2026-12-01', price: 1299, planId: 'eko_diyet', packageConfig: cfg('eko_diyet') },
    )
    const active = after.activePackages.filter((p) => p.stripeSubscriptionId === 'sub_a')
    assert.equal(active.length, 1)
    assert.equal(active[0].expiresAt, '2026-12-01')
    assert.equal(active[0].cancelAtPeriodEnd, false)
  })
})
