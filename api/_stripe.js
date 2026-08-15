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

/**
 * Stripe settlement (GBP hesabında £0.30 min) için TRY güvenli alt sınır.
 * Kur dalgalanmasına tampon — 10₺ gibi test tutarları reddedilir.
 */
export const STRIPE_MIN_AMOUNT_TRY = 50

export function assertStripeMinAmountTry(amountTry) {
  const n = Number(amountTry) || 0
  if (n < STRIPE_MIN_AMOUNT_TRY) {
    return {
      ok: false,
      error: `Stripe minimum tutar ${STRIPE_MIN_AMOUNT_TRY}₺. Paket fiyatı en az ${STRIPE_MIN_AMOUNT_TRY}₺ olmalı (şu an ${n.toLocaleString('tr-TR')}₺). Admin → Paketler’den fiyatı yükseltin.`,
    }
  }
  return { ok: true }
}

/** Stripe API hata mesajını kullanıcıya Türkçe özetle */
export function mapStripeCheckoutError(err) {
  const raw = String(err?.message || err || '')
  const lower = raw.toLowerCase()
  if (
    lower.includes('at least 30 pence')
    || lower.includes('minimum')
    || lower.includes('convert to at least')
  ) {
    return `Ödeme tutarı Stripe minimumunun altında. Paket fiyatını en az ${STRIPE_MIN_AMOUNT_TRY}₺ yapın (hesap GBP settlement — düşük TL tutarları reddedilir).`
  }
  return raw || 'Ödeme oturumu oluşturulamadı.'
}

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

/** Legacy fallback allowlist — checkout artık DB `is_sellable` tercih eder */
export const PAID_PLAN_IDS = Object.keys(PLAN_FALLBACK)
export const isPaidPlanId = (id) => PAID_PLAN_IDS.includes(id)

export const toMinorUnits = (amountTry) => Math.round(Number(amountTry || 0) * 100)

/**
 * Stripe id — ham string veya expand edilmiş `{ id }` nesnesi.
 * Webhook gövdesi endpoint API sürümünde gelir (SDK `apiVersion` pin’i bunu değiştirmez).
 */
export function stripeObjectId(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const s = value.trim()
    return s || null
  }
  if (typeof value === 'object' && typeof value.id === 'string') {
    const s = value.id.trim()
    return s || null
  }
  return null
}

/**
 * Faturadaki abonelik id’si.
 * 2025-03-31.basil: `invoice.subscription` kaldırıldı → `parent.subscription_details.subscription`.
 * https://docs.stripe.com/changelog/basil/2025-03-31/adds-new-parent-field-to-invoicing-objects
 */
export function invoiceSubscriptionId(invoice) {
  if (!invoice || typeof invoice !== 'object') return null
  const fromParent = stripeObjectId(invoice.parent?.subscription_details?.subscription)
  if (fromParent) return fromParent
  const fromLegacy = stripeObjectId(invoice.subscription)
  if (fromLegacy) return fromLegacy
  const lines = invoice.lines?.data
  if (!Array.isArray(lines)) return null
  for (const line of lines) {
    const fromItem = stripeObjectId(line?.parent?.subscription_item_details?.subscription)
    if (fromItem) return fromItem
    const fromLine = stripeObjectId(line?.subscription)
    if (fromLine) return fromLine
  }
  return null
}

/** Yenileme metadata: abonelik + fatura anı snapshot + fatura metadata (son yazılan kazanır). */
export function invoiceSubscriptionMetadata(invoice, subscription = null) {
  const subMeta = subscription?.metadata && typeof subscription.metadata === 'object'
    ? subscription.metadata
    : {}
  const parentMeta = invoice?.parent?.subscription_details?.metadata
  const invoiceMeta = invoice?.metadata && typeof invoice.metadata === 'object'
    ? invoice.metadata
    : {}
  return {
    ...subMeta,
    ...(parentMeta && typeof parentMeta === 'object' ? parentMeta : {}),
    ...invoiceMeta,
  }
}
