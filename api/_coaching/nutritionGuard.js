/**
 * Beslenme doğrulama — HT alerji + meal name ~kcal + protein tabanı
 * + food_dictionary grounding (orta seviye zorunluluk).
 */

/** food_dictionary name_normalized ile aynı fold (TR karakter → ASCII). */
export function foldTr(str = '') {
  return String(str)
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const GROUND_MIN_KEY_LEN = 5
/** LLM kcal vs grounded kcal sapması bu oranın üstündeyse düzelt. */
const GROUND_KCAL_DRIFT = 0.25

/**
 * Öğün metnini food_dictionary ile eşleştir (en uzun, üst üste binmeyen substring).
 * @param {string} name
 * @param {Map<string, { cal: number, protein: number, fat: number, carb: number, name: string }>|null} foodIndex
 * @returns {{ matchedCount: number, kcal: number, protein: number, fat: number, carb: number, matchedNames: string[] }}
 */
export function groundMealAgainstCatalog(name = '', foodIndex = null) {
  const empty = { matchedCount: 0, kcal: 0, protein: 0, fat: 0, carb: 0, matchedNames: [] }
  if (!foodIndex || !foodIndex.size || !name) return empty

  let haystack = foldTr(name)
  if (!haystack) return empty

  const keys = [...foodIndex.keys()]
    .map((raw) => ({ raw, folded: foldTr(raw) }))
    .filter(({ folded }) => folded.length >= GROUND_MIN_KEY_LEN)
    .sort((a, b) => b.folded.length - a.folded.length)

  let kcal = 0
  let protein = 0
  let fat = 0
  let carb = 0
  const matchedNames = []

  for (const { raw, folded } of keys) {
    const idx = haystack.indexOf(folded)
    if (idx < 0) continue
    const meta = foodIndex.get(raw)
    if (!meta) continue
    kcal += Number(meta.cal) || 0
    protein += Number(meta.protein) || 0
    fat += Number(meta.fat) || 0
    carb += Number(meta.carb) || 0
    matchedNames.push(meta.name || raw)
    // Aynı bölgeyi tekrar saymamak için maskele
    haystack = `${haystack.slice(0, idx)}${' '.repeat(folded.length)}${haystack.slice(idx + folded.length)}`
  }

  return {
    matchedCount: matchedNames.length,
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carb: Math.round(carb * 10) / 10,
    matchedNames,
  }
}

function rewriteMealKcal(name, kcal) {
  const cleaned = String(name || '')
    .replace(/~\s*\d{2,4}\s*kcal/ig, '')
    .replace(/\(\s*\d{2,4}\s*kcal\s*\)/ig, '')
    .replace(/\d{2,4}\s*kcal/ig, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
    .replace(/[,\s]+$/g, '')
  return `${cleaned} (~${Math.round(kcal)} kcal)`.slice(0, 400)
}

function applyGroundedKcalToName(name, groundedKcal) {
  if (!(groundedKcal > 0)) return name
  const llmKcal = parseKcalFromMealName(name)
  if (llmKcal == null) return rewriteMealKcal(name, groundedKcal)
  const drift = Math.abs(llmKcal - groundedKcal) / Math.max(groundedKcal, 1)
  if (drift <= GROUND_KCAL_DRIFT) return name
  return rewriteMealKcal(name, groundedKcal)
}

const ALLERGY_RULES = [
  {
    id: 'gluten',
    detect: /gluten|buğday|bugday|çölyak|celiac/i,
    mealDetect: /ekmek|makarna|bulgur|simit|börek|borek|pizza|sandwich|sandviç|yulaf(?!\s*glutensiz)|unlu|kraker|wrap|poğaça|pogaca|galeta|simit|çiğ\s*köfte|cig\s*kofte/i,
    safeSwap: {
      breakfast: 'Glutensiz yulaf veya 2 yumurta + peynir + domates-salatalık, bitki çayı (~320 kcal)',
      snack_morning: 'Meyve + süzme yoğurt (~180 kcal)',
      lunch: 'Izgara tavuk/balık, bol salata, pirinç veya patates (~450 kcal)',
      snack_afternoon: 'Meyve + süzme yoğurt (~180 kcal)',
      dinner: 'Fırın balık veya ızgara tavuk, sebze, salata (~420 kcal)',
      snack_evening: 'Süzme yoğurt (~120 kcal)',
    },
  },
  {
    id: 'lactose',
    // HT tespit: süt ürünü alerji/laktoz ifadeleri (tek başına "süt" kelimesi yeterli)
    detect: /laktoz|lactose|süt\s*ürün|sut\s*urun|dairy|peynir\s*alerj|yoğurt\s*alerj|yogurt\s*alerj/i,
    // Öğün: süt ürünü token’ları (laktozsuz / bitki sütü muafiyeti guard içinde)
    mealDetect: /\b(süt|sut|peynir|yoğurt|yogurt|ayran|kaşar|kasar|labne|krema|lor)\b/i,
    safeSwap: {
      breakfast: '2 yumurta, domates-salatalık, zeytin, tam tahıl veya glutensiz ekmek (~350 kcal)',
      snack_morning: 'Meyve + bir avuç çiğ kuruyemiş yerine meyve (~100 kcal)',
      lunch: 'Izgara tavuk, bulgur veya pirinç, salata (~480 kcal)',
      snack_afternoon: 'Meyve (~100 kcal)',
      dinner: 'Izgara balık veya mercimek yemeği, salata (~420 kcal)',
      snack_evening: 'Bitki çayı + meyve (~80 kcal)',
    },
  },
  {
    id: 'nut',
    detect: /fıstık|fistık|fistik|yer\s*fıst|ceviz\s*alerj|badem\s*alerj|fındık|findik|nut allergy|kuruyemiş alerji|nut\b/i,
    mealDetect: /fıstık|fistık|ceviz|badem|fındık|findik|\bnut\b|ezmesi|pesto|tahin/i,
    safeSwap: {
      breakfast: '2 yumurta, yulaf veya ekmek, domates (~340 kcal)',
      snack_morning: 'Meyve (~90 kcal)',
      lunch: 'Izgara tavuk, salata, pilav (~470 kcal)',
      snack_afternoon: 'Süzme yoğurt veya meyve (~120 kcal)',
      dinner: 'Sebzeli ızgara balık, salata (~400 kcal)',
      snack_evening: 'Bitki çayı (~10 kcal)',
    },
  },
  {
    id: 'egg',
    detect: /yumurta\s*alerj|egg\s*allerg/i,
    mealDetect: /\byumurta\b|omlet|menemen/i,
    safeSwap: {
      breakfast: 'Peynir + zeytin + domates-salatalık + ekmek, çay (~320 kcal)',
      snack_morning: 'Meyve (~90 kcal)',
      lunch: 'Mercimek çorba, salata, bulgur (~420 kcal)',
      snack_afternoon: 'Yoğurt (~120 kcal)',
      dinner: 'Izgara tavuk veya balık, sebze (~410 kcal)',
      snack_evening: 'Ayran (~70 kcal)',
    },
  },
]

/** Öğün adından kaba protein tahmini (sözlük yoksa) */
const PROTEIN_HEURISTICS = [
  { re: /tavuk|hindi|somon|levrek|ton\s*bal|balık|balik|köfte|kofte|yumurta|omlet|lor|süzme|suzme|protein\s*shake/i, grams: 28 },
  { re: /yoğurt|yogurt|peynir|ayran|mercimek|nohut|fasulye|humus/i, grams: 12 },
  { re: /yulaf|bulgur|pilav|ekmek|meyve|salata|sebze/i, grams: 4 },
]

function collectAllergyText(healthTest = {}) {
  const parts = [
    Array.isArray(healthTest.foodAllergies) ? healthTest.foodAllergies.join(' ') : healthTest.foodAllergies,
    healthTest.foodAllergiesDetail,
    healthTest.dietFoodAllergiesDetail,
    Array.isArray(healthTest.dietFoodAllergies) ? healthTest.dietFoodAllergies.join(' ') : healthTest.dietFoodAllergies,
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function detectAllergyFlags(healthTest = {}) {
  const text = collectAllergyText(healthTest)
  if (!text.trim()) return []
  const flags = []
  for (const r of ALLERGY_RULES) {
    if (r.detect.test(text)) flags.push(r.id)
  }
  // Geriye dönük: HT’de düz "yumurta" / "gluten" listesi
  if (/\byumurta\b/.test(text) && !flags.includes('egg')) flags.push('egg')
  if (/gluten|buğday|bugday/.test(text) && !flags.includes('gluten')) flags.push('gluten')
  if (/\b(fıstık|ceviz|badem|fındık|kuruyemiş)\b/.test(text) && !flags.includes('nut')) flags.push('nut')
  if (/\b(laktoz|süt|peynir|yoğurt)\b/.test(text) && !flags.includes('lactose')) flags.push('lactose')
  return [...new Set(flags)]
}

export function parseKcalFromMealName(name = '') {
  const m = String(name).match(/~\s*(\d{2,4})\s*kcal/i)
    || String(name).match(/\((\d{2,4})\s*kcal\)/i)
    || String(name).match(/(\d{2,4})\s*kcal/i)
  return m ? Number(m[1]) : null
}

function estimateProteinFromName(name = '', foodIndex = null) {
  const lower = String(name || '').toLowerCase()
  if (foodIndex && foodIndex.size) {
    let best = 0
    for (const [key, meta] of foodIndex.entries()) {
      if (key.length >= 4 && lower.includes(key)) {
        best = Math.max(best, Number(meta.protein) || 0)
      }
    }
    if (best > 0) return best
  }
  for (const h of PROTEIN_HEURISTICS) {
    if (h.re.test(name)) return h.grams
  }
  return 0
}

function rescaleMealKcal(name, scale) {
  const k = parseKcalFromMealName(name)
  if (k == null) return name
  const adjusted = Math.round(k * scale)
  const cleaned = String(name)
    .replace(/~\s*\d{2,4}\s*kcal/ig, '')
    .replace(/\(\s*\d{2,4}\s*kcal\s*\)/ig, '')
    .replace(/\d{2,4}\s*kcal/ig, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
    .replace(/[,\s]+$/g, '')
  return `${cleaned} (~${adjusted} kcal)`.slice(0, 400)
}

/**
 * Öğün listesini alerji + food_dictionary grounding + kalori + protein bandına göre düzelt.
 * @returns {{ meals, explain, dailyKcal, estimatedProteinG, estimatedFatG, estimatedCarbG, inBand, proteinOk, allergyFlags, targetKcal, groundingCoverage }}
 */
export function guardNutritionMeals(meals, {
  healthTest = {},
  dailyCalories = null,
  foodIndex = null,
  proteinFloorRatio = 0.85,
} = {}) {
  const flags = detectAllergyFlags(healthTest)
  const explain = []
  if (flags.length) explain.push(`alerji bayrakları: ${flags.join(', ')}`)

  const target = dailyCalories?.recommended || dailyCalories?.maintenance || null
  const proteinTarget = dailyCalories?.proteinG || null
  let next = (meals || []).map((m) => ({ ...m }))

  for (const meal of next) {
    const name = meal.name || ''
    for (const rule of ALLERGY_RULES) {
      if (!flags.includes(rule.id)) continue
      if (rule.mealDetect.test(name)) {
        // Laktozsuz / glutensiz açıkça işaretliyse swap yapma
        if (rule.id === 'lactose' && /laktozsuz|bitki\s*süt|badem\s*süt|yulaf\s*süt/i.test(name)) continue
        if (rule.id === 'gluten' && /glutensiz/i.test(name)) continue
        if (rule.id === 'nut' && /kuruyemiş\s*yok|fındıksız/i.test(name)) continue
        const swap = rule.safeSwap[meal.mealType]
        if (swap) {
          meal.name = swap
          meal.note = [meal.note, `alerji güvenli alternatif (${rule.id})`].filter(Boolean).join(' · ').slice(0, 200)
          explain.push(`${meal.mealType}: ${rule.id} swap`)
        }
      }
    }
  }

  // food_dictionary grounding — kcal düzeltme + P/F/C (eşleşme yoksa heuristic)
  let groundedMealsCount = 0
  let estimatedProteinG = 0
  let estimatedFatG = 0
  let estimatedCarbG = 0
  for (const meal of next) {
    const ground = groundMealAgainstCatalog(meal.name, foodIndex)
    if (ground.matchedCount > 0) {
      groundedMealsCount += 1
      const before = meal.name
      meal.name = applyGroundedKcalToName(meal.name, ground.kcal)
      if (meal.name !== before) {
        explain.push(`${meal.mealType}: kcal food_dictionary → ~${ground.kcal}`)
      }
      estimatedProteinG += ground.protein
      estimatedFatG += ground.fat
      estimatedCarbG += ground.carb
    } else {
      estimatedProteinG += estimateProteinFromName(meal.name, foodIndex)
    }
  }

  const totalMeals = next.length
  const groundingCoverage = totalMeals > 0
    ? Math.round((groundedMealsCount / totalMeals) * 100) / 100
    : 0
  if (totalMeals > 0) {
    explain.push(
      `food_dictionary eşleşme: ${groundedMealsCount}/${totalMeals} öğün (${Math.round(groundingCoverage * 100)}%)`,
    )
  }

  let dailyKcal = 0
  let parsedCount = 0
  for (const meal of next) {
    const k = parseKcalFromMealName(meal.name)
    if (k != null) {
      dailyKcal += k
      parsedCount += 1
    }
  }

  let inBand = true
  const bandLow = 0.85
  const bandHigh = 1.15
  if (target && parsedCount >= 3) {
    const low = target * bandLow
    const high = target * bandHigh
    inBand = dailyKcal >= low && dailyKcal <= high
    if (!inBand) {
      explain.push(`kcal band dışı: toplam~${dailyKcal} hedef~${target}`)
      const scale = target / Math.max(dailyKcal, 1)
      next = next.map((meal) => ({
        ...meal,
        name: rescaleMealKcal(meal.name, scale),
      }))
      dailyKcal = next.reduce((s, m) => s + (parseKcalFromMealName(m.name) || 0), 0)
      // Band rescale sonrası protein: grounded oran korunamaz; yeniden tahmin
      estimatedProteinG = next.reduce((s, m) => {
        const g = groundMealAgainstCatalog(m.name, foodIndex)
        return s + (g.matchedCount > 0 ? g.protein : estimateProteinFromName(m.name, foodIndex))
      }, 0)
      estimatedFatG = next.reduce((s, m) => {
        const g = groundMealAgainstCatalog(m.name, foodIndex)
        return s + (g.matchedCount > 0 ? g.fat : 0)
      }, 0)
      estimatedCarbG = next.reduce((s, m) => {
        const g = groundMealAgainstCatalog(m.name, foodIndex)
        return s + (g.matchedCount > 0 ? g.carb : 0)
      }, 0)
      inBand = dailyKcal >= low && dailyKcal <= high
      explain.push(`kcal yeniden ölçeklendi → ~${dailyKcal}`)
    } else {
      explain.push(`kcal band OK: ~${dailyKcal} / ${target}`)
    }
  } else if (target) {
    explain.push('kcal parse yetersiz — band kontrolü atlandı')
  }

  let proteinOk = true
  if (proteinTarget && estimatedProteinG > 0) {
    const floor = proteinTarget * proteinFloorRatio
    proteinOk = estimatedProteinG >= floor
    if (!proteinOk) {
      explain.push(`protein düşük tahmini ~${Math.round(estimatedProteinG)}g < ${Math.round(floor)}g`)
      for (const meal of next) {
        if (['breakfast', 'lunch', 'dinner'].includes(meal.mealType)) {
          meal.note = [meal.note, 'protein artır: süzme yoğurt / ızgara tavuk ekle'].filter(Boolean).join(' · ').slice(0, 200)
        }
      }
    } else {
      explain.push(`protein tahmini OK: ~${Math.round(estimatedProteinG)}g / ${proteinTarget}g`)
    }
  }

  return {
    meals: next,
    explain,
    dailyKcal,
    estimatedProteinG: Math.round(estimatedProteinG),
    estimatedFatG: Math.round(estimatedFatG),
    estimatedCarbG: Math.round(estimatedCarbG),
    inBand,
    proteinOk,
    allergyFlags: flags,
    targetKcal: target,
    groundingCoverage,
  }
}

/**
 * Birden fazla gün şablonunu (7g) tek tek guard et.
 * @param {Array<{ dayIndex: number, meals: object[] }>} dayPlans
 */
export function guardNutritionDayPlans(dayPlans, opts = {}) {
  const guardedDays = []
  const explain = []
  let allergyFlags = []
  let coverageSum = 0
  let coverageN = 0
  let estimatedFatG = 0
  let estimatedCarbG = 0
  let estimatedProteinG = 0
  for (const day of dayPlans || []) {
    const g = guardNutritionMeals(day.meals, opts)
    guardedDays.push({
      dayIndex: day.dayIndex,
      meals: g.meals,
      dailyKcal: g.dailyKcal,
      inBand: g.inBand,
      groundingCoverage: g.groundingCoverage,
    })
    explain.push(
      `gün ${day.dayIndex}: kcal~${g.dailyKcal} band=${g.inBand} ground=${Math.round((g.groundingCoverage || 0) * 100)}%`,
    )
    allergyFlags = g.allergyFlags || allergyFlags
    if (typeof g.groundingCoverage === 'number') {
      coverageSum += g.groundingCoverage
      coverageN += 1
    }
    estimatedFatG += g.estimatedFatG || 0
    estimatedCarbG += g.estimatedCarbG || 0
    estimatedProteinG += g.estimatedProteinG || 0
  }
  const overallGroundingCoverage = coverageN > 0
    ? Math.round((coverageSum / coverageN) * 100) / 100
    : 0
  const days = Math.max(1, coverageN)
  return {
    dayPlans: guardedDays,
    explain,
    allergyFlags,
    groundingCoverage: overallGroundingCoverage,
    estimatedFatG: Math.round(estimatedFatG / days),
    estimatedCarbG: Math.round(estimatedCarbG / days),
    estimatedProteinG: Math.round(estimatedProteinG / days),
  }
}
