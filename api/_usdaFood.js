/**
 * USDA FoodData Central — açık yemek yedeği (100g başına).
 * USDA_FDC_API_KEY yoksa sessizce atlanır.
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { normalizeFoodName } from './_foodCache.js'

const FDC_SEARCH = 'https://api.nal.usda.gov/fdc/v1/foods/search'
const ENERGY_IDS = new Set([1008, 2047, 2048])
const PROTEIN_IDS = new Set([1003])
const FAT_IDS = new Set([1004])
const CARB_IDS = new Set([1005])

export function mapFdcNutrients(food = {}) {
  const per100g = { kcal: 0, protein: 0, carb: 0, fat: 0 }
  const list = Array.isArray(food.foodNutrients) ? food.foodNutrients : []
  for (const n of list) {
    const id = Number(n.nutrientId || n.nutrient?.id || 0)
    const name = String(n.nutrientName || n.nutrient?.name || '').toLowerCase()
    const unit = String(n.unitName || n.nutrient?.unitName || '').toLowerCase()
    const val = Number(n.value ?? n.amount)
    if (!Number.isFinite(val)) continue

    if (ENERGY_IDS.has(id) || (name === 'energy' && (unit === 'kcal' || unit === 'kcal'))) {
      per100g.kcal = val
    } else if (PROTEIN_IDS.has(id) || name === 'protein') {
      per100g.protein = val
    } else if (FAT_IDS.has(id) || name.includes('total lipid')) {
      per100g.fat = val
    } else if (CARB_IDS.has(id) || name.includes('carbohydrate')) {
      per100g.carb = val
    }
  }
  if (!(per100g.kcal > 0)) return null
  return per100g
}

export function mapFdcFood(food = {}) {
  const per100g = mapFdcNutrients(food)
  if (!per100g) return null
  return {
    fdcId: Number(food.fdcId) || null,
    description: String(food.description || food.lowercaseDescription || 'USDA food').slice(0, 120),
    dataType: String(food.dataType || ''),
    per100g,
  }
}

function rankFdcHit(food) {
  const t = String(food?.dataType || '')
  if (t === 'Foundation') return 0
  if (t === 'SR Legacy') return 1
  if (t === 'Survey (FNDDS)') return 2
  return 3
}

async function readUsdaCache(queryNormalized) {
  const admin = getSupabaseAdmin()
  if (!admin || !queryNormalized) return null
  try {
    const { data, error } = await admin
      .from('usda_food_cache')
      .select('fdc_id, description, per_100g')
      .eq('query_normalized', queryNormalized)
      .maybeSingle()
    if (error || !data?.per_100g) return null
    const per100g = {
      kcal: Number(data.per_100g.kcal) || 0,
      protein: Number(data.per_100g.protein) || 0,
      carb: Number(data.per_100g.carb) || 0,
      fat: Number(data.per_100g.fat) || 0,
    }
    if (!(per100g.kcal > 0)) return null
    return {
      fdcId: data.fdc_id,
      description: data.description || 'USDA food',
      per100g,
      cached: true,
    }
  } catch {
    return null
  }
}

async function writeUsdaCache(queryNormalized, mapped) {
  const admin = getSupabaseAdmin()
  if (!admin || !queryNormalized || !mapped) return
  try {
    await admin.from('usda_food_cache').upsert({
      query_normalized: queryNormalized.slice(0, 120),
      fdc_id: mapped.fdcId,
      description: mapped.description,
      per_100g: mapped.per100g,
      raw: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'query_normalized' })
  } catch {
    /* ignore */
  }
}

export function getUsdaApiKey() {
  return process.env.USDA_FDC_API_KEY || process.env.DATA_GOV_API_KEY || ''
}

export async function lookupUsdaFood(query) {
  const q = String(query || '').trim().slice(0, 80)
  if (q.length < 2) return null
  const queryNormalized = normalizeFoodName(q) || q.toLowerCase()

  const cached = await readUsdaCache(queryNormalized)
  if (cached) return cached

  const apiKey = getUsdaApiKey()
  if (!apiKey) return null

  try {
    const res = await fetch(`${FDC_SEARCH}?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        pageSize: 8,
        dataType: ['Foundation', 'SR Legacy'],
      }),
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => null)
    const foods = Array.isArray(json?.foods) ? json.foods.slice() : []
    foods.sort((a, b) => rankFdcHit(a) - rankFdcHit(b))
    for (const food of foods) {
      const mapped = mapFdcFood(food)
      if (!mapped) continue
      await writeUsdaCache(queryNormalized, mapped)
      return { ...mapped, cached: false }
    }
    return null
  } catch {
    return null
  }
}
