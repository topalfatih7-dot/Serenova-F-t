import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  stripeObjectId,
  invoiceSubscriptionId,
  invoiceSubscriptionMetadata,
} from '../api/_stripe.js'

/** Live invoice.paid payload shape (2026-08-14) — top-level `subscription` is null. */
const basilInvoice = {
  id: 'in_1U4KCHGm0Qpi2P1JFAXsq8et',
  subscription: null,
  metadata: {},
  customer: 'cus_UzXFuNyQK44Z6h',
  amount_paid: 5000,
  billing_reason: 'subscription_create',
  parent: {
    type: 'subscription_details',
    subscription_details: {
      subscription: 'sub_1U4KCHGm0Qpi2P1JC7Qrklgn',
      metadata: {
        memberId: '41924338-cbdd-4a3f-8b6d-a3e828ebbcd1',
        planId: 'eko_diyet',
        planPrice: '50',
        durationMonths: '1',
      },
    },
  },
  lines: {
    data: [{
      subscription: null,
      parent: {
        type: 'subscription_item_details',
        subscription_item_details: {
          subscription: 'sub_1U4KCHGm0Qpi2P1JC7Qrklgn',
          subscription_item: 'si_V4T8hbHGaYyHs7',
        },
      },
    }],
  },
}

describe('stripeObjectId', () => {
  it('reads string and expanded object', () => {
    assert.equal(stripeObjectId('sub_abc'), 'sub_abc')
    assert.equal(stripeObjectId({ id: 'sub_abc' }), 'sub_abc')
    assert.equal(stripeObjectId(null), null)
    assert.equal(stripeObjectId({}), null)
  })
})

describe('invoiceSubscriptionId', () => {
  it('reads Basil parent.subscription_details when invoice.subscription is null', () => {
    assert.equal(invoiceSubscriptionId(basilInvoice), 'sub_1U4KCHGm0Qpi2P1JC7Qrklgn')
  })

  it('falls back to legacy invoice.subscription', () => {
    assert.equal(
      invoiceSubscriptionId({ subscription: 'sub_legacy', parent: null }),
      'sub_legacy',
    )
  })

  it('falls back to line parent when invoice parent is missing', () => {
    assert.equal(
      invoiceSubscriptionId({
        subscription: null,
        parent: null,
        lines: basilInvoice.lines,
      }),
      'sub_1U4KCHGm0Qpi2P1JC7Qrklgn',
    )
  })

  it('returns null for non-subscription invoices', () => {
    assert.equal(invoiceSubscriptionId({ id: 'in_x', parent: { type: 'quote_details' } }), null)
  })
})

describe('invoiceSubscriptionMetadata', () => {
  it('reads Basil parent snapshot when invoice.metadata is empty', () => {
    const meta = invoiceSubscriptionMetadata(basilInvoice, { metadata: {} })
    assert.equal(meta.memberId, '41924338-cbdd-4a3f-8b6d-a3e828ebbcd1')
    assert.equal(meta.planId, 'eko_diyet')
  })

  it('lets invoice.metadata override parent snapshot', () => {
    const meta = invoiceSubscriptionMetadata(
      { ...basilInvoice, metadata: { planId: 'vip' } },
      null,
    )
    assert.equal(meta.planId, 'vip')
    assert.equal(meta.memberId, '41924338-cbdd-4a3f-8b6d-a3e828ebbcd1')
  })
})
