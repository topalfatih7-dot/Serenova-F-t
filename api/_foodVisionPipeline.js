/**
 * Fotoğraf algısı → besin çözümleme → kalori motoru.
 */

import { assembleMealResult, inferPerceptionGrams, qualityScoreFromClient } from './_calorieEngine.js'
import { resolvePerceptionItems } from './_foodNutritionLookup.js'
import { normalizeBarcode } from './_openFoodFacts.js'

const SCENE_TYPES = new Set(['packaged', 'open_food', 'mixed', 'not_food', 'unusable'])

function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function normalizePerceptionItem(raw = {}) {
  const name = String(raw.name || '').trim().slice(0, 60)
  if (!name) return null
  const amount = num(raw.amount, 1) || 1
  const unit = String(raw.unit || '').slice(0, 20)
  const inferred = inferPerceptionGrams({
    amount,
    unit,
    gramsEstimate: raw.gramsEstimate,
  })
  const gramsEstimate = inferred || num(raw.gramsEstimate, 0)
  const gramsLow = num(raw.gramsLow, gramsEstimate ? gramsEstimate * 0.85 : 0)
  const gramsHigh = num(raw.gramsHigh, gramsEstimate ? gramsEstimate * 1.15 : 0)
  return {
    name,
    nameEn: String(raw.nameEn || '').trim().slice(0, 80),
    packaged: Boolean(raw.packaged),
    amount,
    unit: unit || (gramsEstimate ? 'g' : 'porsiyon'),
    gramsEstimate: gramsEstimate || undefined,
    gramsLow: gramsLow || undefined,
    gramsHigh: gramsHigh || undefined,
    servingsEstimate: num(raw.servingsEstimate, 1) || 1,
    relativeArea: num(raw.relativeArea, 0),
    ocrText: String(raw.ocrText || '').trim().slice(0, 200),
  }
}

export function normalizePerception(raw = {}) {
  const sceneType = SCENE_TYPES.has(raw.sceneType) ? raw.sceneType : 'open_food'
  const items = Array.isArray(raw.items)
    ? raw.items.map(normalizePerceptionItem).filter(Boolean)
    : []
  const issues = Array.isArray(raw.quality?.issues)
    ? raw.quality.issues.map((x) => String(x)).slice(0, 8)
    : []
  return {
    label: String(raw.label || '').slice(0, 60),
    sceneType,
    quality: {
      usable: raw.quality?.usable !== false,
      issues,
    },
    plateContext: String(raw.plateContext || '').slice(0, 80),
    items,
  }
}

/**
 * @returns {Promise<{ ok: true, ...meal } | { ok: false, status: number, code: string, error: string, issues?: string[] }>}
 */
export async function runFoodVisionPipeline({
  perceptionRaw,
  barcode,
  clientQuality,
} = {}) {
  const perception = normalizePerception(perceptionRaw || {})
  const code = normalizeBarcode(barcode)
  const qualityIssues = [
    ...(Array.isArray(clientQuality?.issues) ? clientQuality.issues : []),
    ...perception.quality.issues,
  ]

  const unusable = perception.sceneType === 'unusable' || perception.quality.usable === false
  const notFood = perception.sceneType === 'not_food' || (perception.sceneType !== 'packaged' && !perception.items.length)

  if (unusable && !code) {
    return {
      ok: false,
      status: 422,
      code: 'unusable_image',
      error: 'Fotoğraf analiz için uygun değil. Daha net, yakından ve aydınlık bir kare çekin.',
      issues: qualityIssues.length ? qualityIssues : ['unusable'],
    }
  }

  if (notFood && !code) {
    return {
      ok: false,
      status: 422,
      code: 'not_food',
      error: 'Fotoğrafta yemek tespit edilemedi.',
      issues: ['not_food'],
    }
  }

  const { items, unmatched } = await resolvePerceptionItems(
    perception.items.length ? perception.items : (code ? [{ name: 'Ambalajlı ürün', packaged: true, servingsEstimate: 1 }] : []),
    { barcode: code || null, sceneType: perception.sceneType },
  )

  if (!items.length) {
    return {
      ok: false,
      status: 422,
      code: notFood ? 'not_food' : 'unmatched_food',
      error: unmatched.length
        ? `Besin değeri bulunamadı: ${unmatched.map((u) => u.name).join(', ')}`
        : 'Fotoğrafta yemek tespit edilemedi.',
      issues: unmatched.map((u) => u.name),
    }
  }

  const label = perception.label
    || items.map((i) => i.name).slice(0, 3).join(', ')
    || 'Tespit Edilen Öğün'

  return assembleMealResult({
    label,
    sceneType: perception.sceneType === 'unusable' && code ? 'packaged' : perception.sceneType,
    items,
    unmatched,
    qualityScore: qualityScoreFromClient(clientQuality),
    qualityIssues,
    barcode: code || null,
  })
}
