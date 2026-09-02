/**
 * Deterministik kalori motoru — GPT kalori üretmez.
 * Porsiyon (sözlük) veya 100g (OFF / USDA) girdilerini alt/orta/üst kcal + makroya çevirir.
 */

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function roundCal(n) {
  return Math.max(0, Math.round(Number(n) || 0))
}

export function roundMacro(n) {
  return Math.max(0, Math.round((Number(n) || 0) * 10) / 10)
}

const COUNT_UNITS = new Set([
  'adet', 'tane', 'dilim', 'porsiyon', 'kase', 'bardak', 'fincan',
  'kasik', 'kaşık', 'avuc', 'avuç', 'yarim', 'yarım',
])

const MASS_VOLUME_UNITS = new Set([
  'g', 'gr', 'gram', 'grams', 'grami', 'gramı',
  'kg', 'kilo',
  'ml', 'mililitre',
  'cl',
  'l', 'lt', 'litre', 'liter',
])

export function normalizePortionUnit(unit) {
  return String(unit || '').toLocaleLowerCase('tr-TR').trim()
}

/** 200 g / 250 ml / 0.2 kg → gram. Porsiyon birimlerinde 0. */
export function gramsFromAmountAndUnit(amount, unit) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return 0
  const u = normalizePortionUnit(unit)
  if (u === 'kg' || u === 'kilo') return n * 1000
  if (u === 'cl') return n * 10
  if (u === 'l' || u === 'lt' || u === 'litre' || u === 'liter') return n * 1000
  if (MASS_VOLUME_UNITS.has(u)) return n
  return 0
}

/** GPT bazen amount=200, unit=g yazar ama gramsEstimate bırakır. */
export function inferPerceptionGrams(perception = {}) {
  const explicit = Number(perception.gramsEstimate) || 0
  if (explicit > 0) return explicit
  return gramsFromAmountAndUnit(perception.amount, perception.unit)
}

export function dictionaryRowHasMacros(row = {}) {
  return (Number(row.protein_g) || 0) + (Number(row.fat_g) || 0) + (Number(row.carb_g) || 0) > 0
}

/**
 * Tek öğün satırı için imkânsız değerler (200 porsiyon tavuk gibi).
 * Şişirilmiş gram (24 kg tavuk) kcal/g oranını normal gösterebilir; tavan şart.
 */
export function isPlausibleScaledFood(item = {}) {
  const cal = Number(item.cal) || 0
  const grams = Number(item.grams) || 0
  const protein = Number(item.protein) || 0
  const carb = Number(item.carb) || 0
  const fat = Number(item.fat) || 0
  if (cal <= 0) return false
  if (cal > 2500) return false
  if (grams > 2000) return false
  if (protein > 250) return false
  if (grams > 0 && cal > grams * 9.5 + 8) return false
  if (cal >= 20 && protein + carb + fat <= 0) return false
  return true
}

/**
 * 100g başına besin × gram aralığı.
 */
export function scalePer100g({ grams, gramsLow, gramsHigh, per100g = {} }) {
  const g = Math.max(0, Number(grams) || 0)
  const gLow = Math.max(0, Number(gramsLow ?? g) || 0)
  const gHigh = Math.max(gLow, Number(gramsHigh ?? g) || 0)
  const k = (Number(per100g.kcal) || 0) / 100
  const p = (Number(per100g.protein) || 0) / 100
  const c = (Number(per100g.carb) || 0) / 100
  const f = (Number(per100g.fat) || 0) / 100
  const loG = Math.min(gLow, gHigh)
  const hiG = Math.max(gLow, gHigh)
  return {
    grams: g,
    gramsLow: loG,
    gramsHigh: hiG,
    cal: roundCal(k * g),
    calLow: roundCal(k * loG),
    calHigh: roundCal(k * hiG),
    protein: roundMacro(p * g),
    carb: roundMacro(c * g),
    fat: roundMacro(f * g),
  }
}

/**
 * Sözlük porsiyonu: cal_per_unit, amount_default üzerindeki makrolar ölçeklenir.
 */
export function scalePortion({
  amount,
  amountLow,
  amountHigh,
  calPerUnit,
  amountDefault = 1,
  protein_g = 0,
  fat_g = 0,
  carb_g = 0,
}) {
  const def = Number(amountDefault) > 0 ? Number(amountDefault) : 1
  const midAmt = Number(amount) || def
  const lowAmt = Number(amountLow ?? amount) || def
  const highAmt = Number(amountHigh ?? amount) || def
  const mid = midAmt / def
  const lo = Math.min(lowAmt, highAmt) / def
  const hi = Math.max(lowAmt, highAmt) / def
  const calUnit = Number(calPerUnit) || 0
  return {
    amount: midAmt,
    cal: roundCal(calUnit * mid),
    calLow: roundCal(calUnit * lo),
    calHigh: roundCal(calUnit * hi),
    protein: roundMacro((Number(protein_g) || 0) * mid),
    carb: roundMacro((Number(carb_g) || 0) * mid),
    fat: roundMacro((Number(fat_g) || 0) * mid),
  }
}

/** İsimdeki "(120g)" veya birim sezgisinden sözlük porsiyonunun tahmini gramı. */
export function typicalGramsForDictionaryRow(row = {}) {
  const name = String(row.name || '')
  const tagged = name.match(/\((\d+(?:[.,]\d+)?)\s*g\)/i) || name.match(/(\d+(?:[.,]\d+)?)\s*g\b/i)
  if (tagged) {
    const g = Number(String(tagged[1]).replace(',', '.'))
    if (g > 0) return g
  }
  const unit = String(row.unit || '').toLowerCase()
  const map = {
    adet: 50,
    dilim: 30,
    kase: 200,
    bardak: 200,
    fincan: 80,
    kasik: 15,
    kaşık: 15,
    avuc: 15,
    avuç: 15,
    yarim: 75,
    yarım: 75,
    porsiyon: 150,
    g: Number(row.amount_default) || 100,
  }
  return map[unit] || 150
}

export function isCountUnit(unit) {
  return COUNT_UNITS.has(normalizePortionUnit(unit))
}

function rangeFromGrams(grams, gramsLow, gramsHigh) {
  const g = Math.max(0, Number(grams) || 0)
  const lo = Number(gramsLow) > 0 ? Number(gramsLow) : g * 0.85
  const hi = Number(gramsHigh) > 0 ? Number(gramsHigh) : g * 1.15
  return { grams: g, gramsLow: lo, gramsHigh: Math.max(lo, hi) }
}

/**
 * Perception öğesini sözlük satırına bağla (adet vs gram).
 * Gram/ml asla porsiyon sayısı değildir — 200 g tavuk ≠ 200 porsiyon.
 */
export function scaleDictionaryItem(perception = {}, row = {}) {
  const unit = String(perception.unit || row.unit || 'porsiyon').slice(0, 20)
  const typical = typicalGramsForDictionaryRow(row) || 100
  const def = Number(row.amount_default) > 0 ? Number(row.amount_default) : 1
  const countAmount = Number(perception.amount)
  const inferredGrams = inferPerceptionGrams(perception)
  const gramsLowIn = Number(perception.gramsLow) || 0
  const gramsHighIn = Number(perception.gramsHigh) || 0

  let amount
  let amountLow
  let amountHigh
  let gMid
  let gLo
  let gHi

  if (inferredGrams > 0) {
    const ranged = rangeFromGrams(inferredGrams, gramsLowIn, gramsHighIn)
    gMid = ranged.grams
    gLo = ranged.gramsLow
    gHi = ranged.gramsHigh
    amount = gMid / typical
    amountLow = gLo / typical
    amountHigh = gHi / typical
  } else if (isCountUnit(unit) && Number.isFinite(countAmount) && countAmount > 0) {
    amount = Math.min(countAmount, 40)
    amountLow = amount * 0.9
    amountHigh = amount * 1.1
    gMid = typical * (amount / def)
    gLo = gMid * 0.9
    gHi = gMid * 1.1
  } else {
    const raw = Number.isFinite(countAmount) && countAmount > 0
      ? countAmount
      : def
    // Birimsiz 200 → gram; 2 → porsiyon.
    if (raw >= 20) {
      const ranged = rangeFromGrams(raw, gramsLowIn, gramsHighIn)
      gMid = ranged.grams
      gLo = ranged.gramsLow
      gHi = ranged.gramsHigh
      amount = gMid / typical
      amountLow = gLo / typical
      amountHigh = gHi / typical
    } else {
      amount = raw
      amountLow = amount * 0.9
      amountHigh = amount * 1.1
      gMid = typical * (amount / def)
      gLo = gMid * 0.9
      gHi = gMid * 1.1
    }
  }

  const scaled = scalePortion({
    amount,
    amountLow,
    amountHigh,
    calPerUnit: row.cal_per_unit,
    amountDefault: row.amount_default,
    protein_g: row.protein_g,
    fat_g: row.fat_g,
    carb_g: row.carb_g,
  })

  const percUnit = normalizePortionUnit(perception.unit)
  const displayAmount = inferredGrams > 0 ? inferredGrams : amount
  const displayUnit = inferredGrams > 0
    ? (MASS_VOLUME_UNITS.has(percUnit) ? percUnit : 'g')
    : unit

  return {
    ...scaled,
    amount: displayAmount,
    unit: displayUnit,
    grams: Math.round(gMid),
    gramsLow: Math.round(Math.min(gLo, gHi)),
    gramsHigh: Math.round(Math.max(gLo, gHi)),
  }
}

export function portionScoreFromGrams(grams, gramsLow, gramsHigh) {
  const g = Number(grams) || 0
  if (g <= 0) return 0.4
  const span = Math.abs((Number(gramsHigh) || g) - (Number(gramsLow) || g))
  const uncertainty = span / (2 * g)
  return clamp(1 - uncertainty, 0.15, 1)
}

export function identityScoreFromSource(source, { barcode = false } = {}) {
  if (source === 'open_food_facts' && barcode) return 1
  if (source === 'open_food_facts') return 0.85
  if (source === 'food_dictionary') return 0.8
  if (source === 'usda') return 0.65
  return 0
}

export function composeConfidence({ qualityScore = 0.7, identityScore = 0.5, portionScore = 0.5 }) {
  const score = clamp(
    0.25 * Number(qualityScore || 0) + 0.35 * Number(identityScore || 0) + 0.4 * Number(portionScore || 0),
    0,
    1,
  )
  const band = score >= 0.75 ? 'high' : score >= 0.5 ? 'medium' : 'low'
  return { score: Math.round(score * 100) / 100, band }
}

export function qualityScoreFromClient(clientQuality) {
  if (clientQuality && Number.isFinite(Number(clientQuality.score))) {
    return clamp(Number(clientQuality.score), 0, 1)
  }
  return 0.7
}

export function sumMealItems(items = []) {
  return items.reduce(
    (acc, it) => {
      acc.totalCal += Number(it.cal) || 0
      acc.totalCalLow += Number(it.calLow) || 0
      acc.totalCalHigh += Number(it.calHigh) || 0
      acc.protein += Number(it.protein) || 0
      acc.carb += Number(it.carb) || 0
      acc.fat += Number(it.fat) || 0
      return acc
    },
    { totalCal: 0, totalCalLow: 0, totalCalHigh: 0, protein: 0, carb: 0, fat: 0 },
  )
}

export function ensureItemShape(item = {}) {
  const cal = roundCal(item.cal)
  const calLow = item.calLow != null ? roundCal(item.calLow) : roundCal(cal * 0.85)
  const calHigh = item.calHigh != null ? roundCal(item.calHigh) : roundCal(cal * 1.15)
  return {
    name: String(item.name || 'Bilinmeyen').slice(0, 60),
    amount: Number(item.amount) || 1,
    unit: String(item.unit || 'porsiyon').slice(0, 20),
    grams: item.grams != null ? Math.round(Number(item.grams) || 0) : undefined,
    gramsLow: item.gramsLow != null ? Math.round(Number(item.gramsLow) || 0) : undefined,
    gramsHigh: item.gramsHigh != null ? Math.round(Number(item.gramsHigh) || 0) : undefined,
    cal,
    calLow: Math.min(calLow, calHigh),
    calHigh: Math.max(calLow, calHigh),
    protein: roundMacro(item.protein),
    carb: roundMacro(item.carb),
    fat: roundMacro(item.fat),
    source: item.source || undefined,
    confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : undefined,
  }
}

export function buildConfidenceReasons({
  qualityIssues = [],
  sources = [],
  portionScore = 1,
  unmatchedCount = 0,
  barcode = false,
} = {}) {
  const reasons = []
  if (qualityIssues.includes('blurry')) reasons.push('bulanık fotoğraf')
  if (qualityIssues.includes('dark')) reasons.push('karanlık görüntü')
  if (portionScore < 0.5) reasons.push('porsiyon belirsiz')
  if (unmatchedCount > 0) reasons.push('bazı öğeler veritabanında yok')
  if (barcode && sources.includes('open_food_facts')) reasons.push('barkod ile eşleşti')
  else if (sources.includes('open_food_facts')) reasons.push('ürün veritabanı')
  if (sources.includes('food_dictionary')) reasons.push('yiyecek sözlüğü')
  if (sources.includes('usda')) reasons.push('USDA tahmini')
  return reasons.slice(0, 4)
}

export function assembleMealResult({
  label,
  sceneType = 'open_food',
  items = [],
  unmatched = [],
  qualityScore = 0.7,
  qualityIssues = [],
  barcode = null,
} = {}) {
  const shaped = items.map(ensureItemShape)
  const totals = sumMealItems(shaped)
  const n = shaped.length
  const identityScore = n
    ? shaped.reduce(
      (s, it) => s + identityScoreFromSource(it.source, {
        barcode: it.source === 'open_food_facts' && Boolean(barcode),
      }),
      0,
    ) / n
    : 0
  const portionScore = n
    ? shaped.reduce(
      (s, it) => s + portionScoreFromGrams(it.grams, it.gramsLow, it.gramsHigh),
      0,
    ) / n
    : 0.4
  const { score, band } = composeConfidence({ qualityScore, identityScore, portionScore })
  const sources = [...new Set(shaped.map((it) => it.source).filter(Boolean))]
  const itemConfidence = clamp(0.5 * identityScore + 0.5 * portionScore, 0, 1)

  return {
    ok: true,
    label: String(label || 'Tespit Edilen Öğün').slice(0, 60),
    sceneType,
    items: shaped.map((it) => ({
      ...it,
      confidence: Math.round(itemConfidence * 100) / 100,
    })),
    unmatched: unmatched.map((u) => ({
      name: String(u.name || '').slice(0, 60),
    })).filter((u) => u.name),
    totalCal: roundCal(totals.totalCal),
    totalCalLow: roundCal(totals.totalCalLow),
    totalCalHigh: roundCal(Math.max(totals.totalCalHigh, totals.totalCal)),
    macros: {
      protein: roundMacro(totals.protein),
      carb: roundMacro(totals.carb),
      fat: roundMacro(totals.fat),
    },
    confidence: band,
    confidenceScore: score,
    confidenceReasons: buildConfidenceReasons({
      qualityIssues,
      sources,
      portionScore,
      unmatchedCount: unmatched.length,
      barcode: Boolean(barcode),
    }),
    pipeline: {
      barcode: barcode ? String(barcode).replace(/\D/g, '').slice(0, 20) : null,
      sources,
    },
  }
}
