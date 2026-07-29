/**
 * Stripe sunucu yardımcısı (yalnızca Vercel sunucu tarafı).
 */
import Stripe from 'stripe'

let _stripe = null

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe() {
  if (!isStripeConfigured()) return null
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  }
  return _stripe
}

export const CURRENCY = 'try'

// membershipPlans.js ile aynı varsayılan fiyatlar (TL, aylık).
export const PLAN_FALLBACK = {
  eko_diyet: { name: 'Eko Diyet Paketi', price: 1299, durationMonths: 1 },
  diyet: { name: 'Diyet Paketi', price: 2499, durationMonths: 1 },
  eko_spor: { name: 'Eko Spor Paketi', price: 1299, durationMonths: 1 },
  spor: { name: 'Spor Paketi', price: 2499, durationMonths: 1 },
  doktor: { name: 'Doktor Paketi', price: 1500, durationMonths: 0 },
  vip: { name: 'Vip Paket', price: 4999, durationMonths: 1 },
}

export const TIER_PRICES = {
  eko_diyet: { 1: 1299, 3: 2999, 6: 3999 },
  diyet: { 1: 2499, 3: 6499, 6: 9999 },
  eko_spor: { 1: 1299, 3: 2999, 6: 3999 },
  spor: { 1: 2499, 3: 6499, 6: 9999 },
  doktor: { 1: 1500 },
  vip: { 1: 4999, 3: 12999, 6: 19999 },
}

export function getTierPrice(planId, months = 1) {
  const m = Number(months) || 1
  return TIER_PRICES[planId]?.[m] || PLAN_FALLBACK[planId]?.price || 0
}

export const PAID_PLAN_IDS = Object.keys(PLAN_FALLBACK)
export const isPaidPlanId = (id) => PAID_PLAN_IDS.includes(id)

export const toMinorUnits = (amountTry) => Math.round(Number(amountTry || 0) * 100)
