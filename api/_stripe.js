/**
 * Stripe sunucu yardımcısı (yalnızca Vercel sunucu tarafı).
 * STRIPE_SECRET_KEY env değişkeni GİZLİDİR — asla tarayıcıya gönderilmez,
 * VITE_ ön eki YOKTUR.
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

// Para birimi (Stripe TRY destekler; en küçük birim = kuruş)
export const CURRENCY = 'try'

// membershipPlans.js ile aynı varsayılan fiyatlar (TL).
// Canlı fiyat öncelikle Supabase `plans` tablosundan okunur; bu yalnızca yedektir.
export const PLAN_FALLBACK = {
  gumus: { name: 'Gümüş Üyelik', price: 999, durationWeeks: 4 },
  altin: { name: 'Altın Üyelik', price: 1999, durationWeeks: 4 },
  platinum: { name: 'Platinum Üyelik', price: 3499, durationWeeks: 4 },
  premium: { name: 'Premium Üyelik', price: 1999, durationWeeks: 4 },
}

export const PAID_PLAN_IDS = Object.keys(PLAN_FALLBACK)
export const isPaidPlanId = (id) => PAID_PLAN_IDS.includes(id)

// TL → kuruş (Stripe en küçük birim)
export const toMinorUnits = (amountTry) => Math.round(Number(amountTry || 0) * 100)
