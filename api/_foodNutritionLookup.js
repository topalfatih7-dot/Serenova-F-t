/**
 * Perception öğesi → OFF / food_dictionary / USDA.
 * Kalori uydurulmaz; eşleşmeyen öğeler unmatched döner.
 */

import {
  scalePer100g,
  scaleDictionaryItem,
  inferPerceptionGrams,
  isPlausibleScaledFood,
  typicalGramsForDictionaryRow,
  isCountUnit,
} from './_calorieEngine.js'
import { lookupFoodByName } from './_foodCache.js'
import { lookupProductByBarcode, searchProductByName } from './_openFoodFacts.js'
import { lookupUsdaFood } from './_usdaFood.js'

function gramsFromOff(off, item, servings) {
  const s = Number(servings) > 0 ? Number(servings) : 1
  const inferred = inferPerceptionGrams(item)
  if (inferred > 0) {
    return {
      grams: inferred,
      gramsLow: Number(item.gramsLow) || inferred * 0.85,
      gramsHigh: Number(item.gramsHigh) || inferred * 1.15,
    }
  }
  const serving = Number(off.servingGrams) > 0 ? Number(off.servingGrams) : 100
  const grams = serving * s
  return {
    grams,
    gramsLow: grams * 0.85,
    gramsHigh: grams * 1.15,
  }
}

function itemFromPer100g({ name, amount, unit, grams, gramsLow, gramsHigh, per100g, source }) {
  const scaled = scalePer100g({ grams, gramsLow, gramsHigh, per100g })
  return {
    name: String(name || 'Yiyecek').slice(0, 60),
    amount: Number(amount) || 1,
    unit: String(unit || 'g').slice(0, 20),
    ...scaled,
    source,
  }
}

function barcodeIndexFor(items, sceneType) {
  if (!items.length) return -1
  const packagedIdx = items.findIndex((it) => it.packaged)
  if (packagedIdx >= 0) return packagedIdx
  if (sceneType === 'packaged' || sceneType === 'mixed') return 0
  return 0
}

/**
 * @param {object} item perception öğesi
 * @param {{ tryBarcode?: string }} opts
 */
export async function resolvePerceptionItem(item, opts = {}) {
  const name = String(item?.name || '').trim()
  if (!name) return { unmatched: { name: '' } }

  const servings = Number(item.servingsEstimate) || 1
  const unit = String(item.unit || 'porsiyon').slice(0, 20)

  if (opts.tryBarcode) {
    const off = await lookupProductByBarcode(opts.tryBarcode)
    if (off?.per100g?.kcal > 0) {
      const g = gramsFromOff(off, item, servings)
      return {
        item: itemFromPer100g({
          name: off.productName || name,
          amount: servings,
          unit: off.servingGrams ? 'porsiyon' : 'g',
          ...g,
          per100g: off.per100g,
          source: 'open_food_facts',
        }),
      }
    }
  }

  if (item.packaged) {
    const q = String(item.ocrText || name).trim()
    const off = await searchProductByName(q)
    if (off?.per100g?.kcal > 0) {
      const g = gramsFromOff(off, item, servings)
      return {
        item: itemFromPer100g({
          name: off.productName || name,
          amount: servings,
          unit: 'porsiyon',
          ...g,
          per100g: off.per100g,
          source: 'open_food_facts',
        }),
      }
    }
  }

  const row = await lookupFoodByName(name)
  if (row) {
    const scaled = scaleDictionaryItem(item, row)
    if (isPlausibleScaledFood(scaled)) {
      return {
        item: {
          name: String(row.name || name).slice(0, 60),
          ...scaled,
          source: 'food_dictionary',
        },
      }
    }
  }

  const offName = await searchProductByName(String(item.ocrText || name).trim())
  if (offName?.per100g?.kcal > 0) {
    const g = gramsFromOff(offName, item, servings)
    return {
      item: itemFromPer100g({
        name: offName.productName || name,
        amount: Number(item.amount) || servings,
        unit,
        ...g,
        per100g: offName.per100g,
        source: 'open_food_facts',
      }),
    }
  }

  const usda = await lookupUsdaFood(item.nameEn || name)
  if (usda?.per100g?.kcal > 0) {
    const grams = inferPerceptionGrams(item)
      || (isCountUnit(unit) ? typicalGramsForDictionaryRow({ name, unit }) : 0)
      || 100
    const gramsLow = Number(item.gramsLow) || grams * 0.75
    const gramsHigh = Number(item.gramsHigh) || grams * 1.25
    return {
      item: itemFromPer100g({
        name,
        amount: Number(item.amount) || 1,
        unit: unit === 'g' ? 'g' : unit,
        grams,
        gramsLow,
        gramsHigh,
        per100g: usda.per100g,
        source: 'usda',
      }),
    }
  }

  return { unmatched: { name } }
}

export async function resolvePerceptionItems(items = [], { barcode, sceneType } = {}) {
  const list = Array.isArray(items) ? items : []
  const idx = barcode ? barcodeIndexFor(list, sceneType) : -1
  const resolved = []
  const unmatched = []

  for (let i = 0; i < list.length; i += 1) {
    const result = await resolvePerceptionItem(list[i], {
      tryBarcode: i === idx ? barcode : null,
    })
    if (result.item) resolved.push(result.item)
    else if (result.unmatched?.name) unmatched.push(result.unmatched)
  }

  return { items: resolved, unmatched }
}
