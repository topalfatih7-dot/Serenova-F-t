/**
 * Open Food Facts — ambalajlı ürün besin değerleri.
 * User-Agent zorunlu; barkod cache ile tekrarlayan istekler kesilir.
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'

export const OFF_USER_AGENT = 'YeniForm/1.0 (https://yeniform.com)'

export function normalizeBarcode(code) {
  return String(code || '').replace(/\D/g, '').slice(0, 20)
}

export function mapOffNutriments(nutriments = {}) {
  const n = nutriments || {}
  let kcal = Number(n['energy-kcal_100g'])
  if (!Number.isFinite(kcal) || kcal <= 0) {
    const kj = Number(n['energy-kj_100g'])
    if (Number.isFinite(kj) && kj > 0) kcal = kj / 4.184
  }
  if (!Number.isFinite(kcal) || kcal <= 0) {
    kcal = Number(n['energy-kcal']) || 0
  }
  return {
    kcal: Math.max(0, Number(kcal) || 0),
    protein: Math.max(0, Number(n.proteins_100g) || 0),
    carb: Math.max(0, Number(n.carbohydrates_100g) || 0),
    fat: Math.max(0, Number(n.fat_100g) || 0),
  }
}

export function parseServingGrams(product = {}) {
  const q = Number(product.serving_quantity)
  if (Number.isFinite(q) && q > 0) {
    const unit = String(product.serving_quantity_unit || '').toLowerCase()
    if (!unit || unit === 'g' || unit === 'ml') return q
  }
  const serving = String(product.serving_size || '')
  const m = serving.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i)
  if (m) return Number(String(m[1]).replace(',', '.'))
  return null
}

export function mapOffProduct(product = {}) {
  if (!product || typeof product !== 'object') return null
  const per100g = mapOffNutriments(product.nutriments)
  if (!(per100g.kcal > 0)) return null
  const name = String(
    product.product_name_tr
    || product.product_name
    || product.generic_name
    || '',
  ).trim()
  return {
    barcode: normalizeBarcode(product.code || product._id),
    productName: (name || 'Ambalajlı ürün').slice(0, 80),
    per100g,
    servingGrams: parseServingGrams(product),
    servingSize: String(product.serving_size || '').slice(0, 40),
    brands: String(product.brands || '').slice(0, 80),
  }
}

async function readBarcodeCache(barcode) {
  const admin = getSupabaseAdmin()
  if (!admin || !barcode) return null
  try {
    const { data, error } = await admin
      .from('product_nutrition_cache')
      .select('barcode, product_name, nutriments, serving_size, serving_quantity')
      .eq('barcode', barcode)
      .maybeSingle()
    if (error || !data) return null
    const per100g = mapOffNutriments(data.nutriments)
    if (!(per100g.kcal > 0)) return null
    return {
      barcode: data.barcode,
      productName: data.product_name || 'Ambalajlı ürün',
      per100g,
      servingGrams: Number(data.serving_quantity) > 0 ? Number(data.serving_quantity) : parseServingGrams({ serving_size: data.serving_size }),
      servingSize: data.serving_size || '',
      cached: true,
    }
  } catch {
    return null
  }
}

async function writeBarcodeCache(mapped, rawProduct) {
  const admin = getSupabaseAdmin()
  if (!admin || !mapped?.barcode) return
  try {
    await admin.from('product_nutrition_cache').upsert({
      barcode: mapped.barcode,
      product_name: mapped.productName,
      nutriments: rawProduct?.nutriments || {
        'energy-kcal_100g': mapped.per100g.kcal,
        proteins_100g: mapped.per100g.protein,
        carbohydrates_100g: mapped.per100g.carb,
        fat_100g: mapped.per100g.fat,
      },
      serving_size: mapped.servingSize || null,
      serving_quantity: mapped.servingGrams,
      raw: rawProduct || {},
      source: 'open_food_facts',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'barcode' })
  } catch {
    /* cache yazılamazsa akış bozulmasın */
  }
}

async function offFetch(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': OFF_USER_AGENT,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function lookupProductByBarcode(barcode) {
  const code = normalizeBarcode(barcode)
  if (!code || code.length < 8) return null

  const cached = await readBarcodeCache(code)
  if (cached) return cached

  try {
    const json = await offFetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`)
    if (!json || json.status === 0 || !json.product) return null
    const mapped = mapOffProduct(json.product)
    if (!mapped) return null
    if (!mapped.barcode) mapped.barcode = code
    await writeBarcodeCache(mapped, json.product)
    return { ...mapped, cached: false }
  } catch {
    return null
  }
}

export async function searchProductByName(query) {
  const q = String(query || '').trim().slice(0, 80)
  if (q.length < 3) return null
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=5`
    const json = await offFetch(url)
    const products = Array.isArray(json?.products) ? json.products : []
    for (const product of products) {
      const mapped = mapOffProduct(product)
      if (!mapped) continue
      if (mapped.barcode) await writeBarcodeCache(mapped, product)
      return { ...mapped, cached: false }
    }
    return null
  } catch {
    return null
  }
}

/** İsim + OFF araması için normalize ipucu (dışarıya). */
