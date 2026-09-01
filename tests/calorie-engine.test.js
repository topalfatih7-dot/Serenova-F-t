import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  scalePer100g,
  scalePortion,
  scaleDictionaryItem,
  composeConfidence,
  identityScoreFromSource,
  portionScoreFromGrams,
  assembleMealResult,
  typicalGramsForDictionaryRow,
} from '../api/_calorieEngine.js'
import { mapOffNutriments, parseServingGrams, mapOffProduct } from '../api/_openFoodFacts.js'
import { mapFdcNutrients } from '../api/_usdaFood.js'
import { normalizePerception, runFoodVisionPipeline } from '../api/_foodVisionPipeline.js'

describe('scalePer100g', () => {
  it('scales 100g chicken at 165 kcal/100g', () => {
    const r = scalePer100g({
      grams: 100,
      gramsLow: 80,
      gramsHigh: 120,
      per100g: { kcal: 165, protein: 31, carb: 0, fat: 3.6 },
    })
    assert.equal(r.cal, 165)
    assert.equal(r.calLow, 132)
    assert.equal(r.calHigh, 198)
    assert.equal(r.protein, 31)
  })

  it('scales barcode serving × 0.5', () => {
    const r = scalePer100g({
      grams: 50,
      gramsLow: 45,
      gramsHigh: 55,
      per100g: { kcal: 250, protein: 10, carb: 20, fat: 12 },
    })
    assert.equal(r.cal, 125)
    assert.equal(r.calLow, 113)
    assert.equal(r.calHigh, 138)
  })
})

describe('scalePortion', () => {
  it('scales 2 eggs from 1-adet dictionary row', () => {
    const r = scalePortion({
      amount: 2,
      amountLow: 1.8,
      amountHigh: 2.2,
      calPerUnit: 78,
      amountDefault: 1,
      protein_g: 6.3,
      fat_g: 5.3,
      carb_g: 0.6,
    })
    assert.equal(r.cal, 156)
    assert.equal(r.calLow, 140)
    assert.equal(r.calHigh, 172)
  })
})

describe('scaleDictionaryItem', () => {
  it('uses name grams for grilled chicken porsiyon', () => {
    const row = {
      name: 'Izgara tavuk göğüs (120g)',
      cal_per_unit: 200,
      amount_default: 1,
      unit: 'porsiyon',
      protein_g: 38,
      fat_g: 4,
      carb_g: 0,
    }
    assert.equal(typicalGramsForDictionaryRow(row), 120)
    const r = scaleDictionaryItem({ gramsEstimate: 120, gramsLow: 100, gramsHigh: 140, unit: 'g' }, row)
    assert.equal(r.cal, 200)
    assert.equal(r.calLow, 167)
    assert.equal(r.calHigh, 233)
  })
})

describe('confidence', () => {
  it('maps barcode identity to high band when quality and portion are strong', () => {
    const { score, band } = composeConfidence({
      qualityScore: 0.9,
      identityScore: identityScoreFromSource('open_food_facts', { barcode: true }),
      portionScore: 0.9,
    })
    assert.equal(band, 'high')
    assert.equal(score >= 0.75, true)
  })

  it('drops portion score when gram range is wide', () => {
    const tight = portionScoreFromGrams(120, 110, 130)
    const wide = portionScoreFromGrams(120, 40, 240)
    assert.equal(tight > wide, true)
    assert.equal(wide < 0.5, true)
  })
})

describe('assembleMealResult', () => {
  it('sums items and exposes range + macros', () => {
    const meal = assembleMealResult({
      label: 'Kahvaltı',
      items: [
        { name: 'Yumurta', amount: 2, unit: 'adet', cal: 156, calLow: 140, calHigh: 172, protein: 12.6, carb: 1.2, fat: 10.6, source: 'food_dictionary', grams: 100 },
      ],
      qualityScore: 0.8,
    })
    assert.equal(meal.ok, true)
    assert.equal(meal.totalCal, 156)
    assert.equal(meal.totalCalLow, 140)
    assert.equal(meal.totalCalHigh, 172)
    assert.equal(meal.macros.protein, 12.6)
    assert.equal(meal.confidence === 'high' || meal.confidence === 'medium', true)
  })
})

describe('Open Food Facts mapper', () => {
  it('reads energy-kcal_100g', () => {
    const n = mapOffNutriments({
      'energy-kcal_100g': 250,
      proteins_100g: 8,
      carbohydrates_100g: 30,
      fat_100g: 10,
    })
    assert.equal(n.kcal, 250)
    assert.equal(n.protein, 8)
  })

  it('converts kJ when kcal missing', () => {
    const n = mapOffNutriments({ 'energy-kj_100g': 418.4, proteins_100g: 1 })
    assert.equal(Math.round(n.kcal), 100)
  })

  it('parses serving grams and maps product', () => {
    assert.equal(parseServingGrams({ serving_size: '30 g' }), 30)
    const mapped = mapOffProduct({
      code: '8690000000001',
      product_name: 'Test Yoğurt',
      nutriments: { 'energy-kcal_100g': 90, proteins_100g: 10, carbohydrates_100g: 5, fat_100g: 3 },
      serving_size: '150 g',
    })
    assert.equal(mapped.productName, 'Test Yoğurt')
    assert.equal(mapped.per100g.kcal, 90)
    assert.equal(mapped.servingGrams, 150)
  })

  it('returns null without energy', () => {
    assert.equal(mapOffProduct({ product_name: 'X', nutriments: {} }), null)
  })
})

describe('USDA nutrient mapper', () => {
  it('maps FDC nutrient ids per 100g', () => {
    const per = mapFdcNutrients({
      foodNutrients: [
        { nutrientId: 1008, value: 165 },
        { nutrientId: 1003, value: 31 },
        { nutrientId: 1004, value: 3.6 },
        { nutrientId: 1005, value: 0 },
      ],
    })
    assert.equal(per.kcal, 165)
    assert.equal(per.protein, 31)
  })
})

describe('normalizePerception', () => {
  it('drops kcal if the model sneaks it in and keeps gram range', () => {
    const p = normalizePerception({
      label: 'Tabak',
      sceneType: 'open_food',
      quality: { usable: true, issues: [] },
      items: [{ name: 'Pilav', cal: 9999, gramsEstimate: 180, gramsLow: 140, gramsHigh: 220 }],
    })
    assert.equal(p.items[0].name, 'Pilav')
    assert.equal(p.items[0].gramsEstimate, 180)
    assert.equal(p.items[0].cal, undefined)
  })

  it('flags unusable scene', () => {
    const p = normalizePerception({ sceneType: 'unusable', quality: { usable: false }, items: [] })
    assert.equal(p.sceneType, 'unusable')
    assert.equal(p.quality.usable, false)
  })
})

describe('runFoodVisionPipeline gates', () => {
  it('returns 422 unusable_image without barcode', async () => {
    const r = await runFoodVisionPipeline({
      perceptionRaw: { sceneType: 'unusable', quality: { usable: false, issues: ['blurry'] }, items: [] },
    })
    assert.equal(r.ok, false)
    assert.equal(r.code, 'unusable_image')
    assert.equal(r.status, 422)
  })

  it('returns 422 not_food when empty open plate', async () => {
    const r = await runFoodVisionPipeline({
      perceptionRaw: { sceneType: 'not_food', quality: { usable: true }, items: [] },
    })
    assert.equal(r.ok, false)
    assert.equal(r.code, 'not_food')
  })
})
