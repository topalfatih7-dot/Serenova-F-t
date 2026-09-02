/**
 * Kalıcı Stripe Product + Price (lookup_key).
 * Tutar değişince yeni Price; lookup_key taşınır; eski Price arşivlenir.
 */
import { CURRENCY, toMinorUnits, assertStripeMinAmountTry } from './_stripe.js'
import {
  catalogLookupKey,
  catalogPriceMatchesStripePrice,
  stripeSearchLiteral,
} from '../src/utils/stripeCatalog.js'

function productNameFor({ planName, months, oneTime }) {
  const name = String(planName || '').trim() || 'Yeni Form Paketi'
  if (oneTime) return name
  const durationLabel = Number(months) === 1 ? '1 ay' : `${months} ay`
  return `${name} (${durationLabel})`
}

function productDescriptionFor({ planName, months, oneTime }) {
  const name = String(planName || '').trim() || 'Paket'
  if (oneTime) return `${name} — tek seferlik ödeme`
  const durationLabel = Number(months) === 1 ? '1 ay' : `${months} ay`
  return `${name} — ${durationLabel} üyelik · süre sonunda güncel katalog fiyatıyla yenilenir`
}

async function findPriceByLookupKey(stripe, lookupKey) {
  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
    expand: ['data.product'],
  })
  return listed.data?.[0] || null
}

async function findProductByLookup(stripe, lookupKey) {
  const q = `metadata["yeniform_lookup"]:"${stripeSearchLiteral(lookupKey)}"`
  try {
    const found = await stripe.products.search({ query: q, limit: 1 })
    if (found.data?.[0]) return found.data[0]
  } catch {
    /* search kapalı olabilir */
  }
  const listed = await stripe.products.list({ limit: 100, active: true })
  return listed.data.find((p) => String(p.metadata?.yeniform_lookup || '') === lookupKey) || null
}

async function ensureCatalogProduct(stripe, {
  planId,
  planName,
  months,
  oneTime,
  existingProduct,
}) {
  const lookupKey = catalogLookupKey(planId, months)
  const name = productNameFor({ planName, months, oneTime })
  const description = productDescriptionFor({ planName, months, oneTime })
  const metadata = {
    yeniform_plan_id: String(planId),
    yeniform_duration_months: String(months),
    yeniform_lookup: lookupKey,
  }

  let product = null
  if (existingProduct && typeof existingProduct === 'object' && existingProduct.id) {
    product = existingProduct
  } else if (typeof existingProduct === 'string' && existingProduct) {
    try {
      product = await stripe.products.retrieve(existingProduct)
    } catch {
      product = null
    }
  }
  if (!product) product = await findProductByLookup(stripe, lookupKey)

  if (!product) {
    return stripe.products.create({ name, description, metadata })
  }

  const patch = {}
  if (product.name !== name) patch.name = name
  if (product.description !== description) patch.description = description
  const meta = product.metadata || {}
  if (meta.yeniform_lookup !== lookupKey || meta.yeniform_plan_id !== String(planId)) {
    patch.metadata = { ...meta, ...metadata }
  }
  if (Object.keys(patch).length) {
    return stripe.products.update(product.id, patch)
  }
  return product
}

/**
 * Plan + süre için aktif katalog Price. Tutar değiştiyse yeni Price üretir.
 */
export async function ensureCatalogPrice(stripe, {
  planId,
  planName,
  months = 1,
  amountTry,
  oneTime = false,
}) {
  const minCheck = assertStripeMinAmountTry(amountTry)
  if (!minCheck.ok) {
    const err = new Error(minCheck.error)
    err.status = 400
    throw err
  }

  const lookupKey = catalogLookupKey(planId, months)
  const unitAmount = toMinorUnits(amountTry)
  const existing = await findPriceByLookupKey(stripe, lookupKey)
  if (existing && catalogPriceMatchesStripePrice(existing, { unitAmount, months, oneTime })) {
    return existing
  }

  const product = await ensureCatalogProduct(stripe, {
    planId,
    planName,
    months,
    oneTime,
    existingProduct: existing?.product,
  })

  const params = {
    product: product.id,
    currency: CURRENCY,
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    metadata: {
      yeniform_plan_id: String(planId),
      yeniform_duration_months: String(months),
    },
  }
  if (!oneTime) {
    params.recurring = { interval: 'month', interval_count: Number(months) || 1 }
  }

  const created = await stripe.prices.create(params)
  if (existing?.id && existing.id !== created.id) {
    try {
      await stripe.prices.update(existing.id, { active: false })
    } catch (e) {
      console.warn('[stripe-catalog] old price archive', existing.id, e.message)
    }
  }
  return created
}

export { productNameFor, productDescriptionFor }
