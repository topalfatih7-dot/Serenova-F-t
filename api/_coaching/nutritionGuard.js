/**
 * Beslenme doğrulama — mevcut HT alerji alanları + meal name içindeki ~kcal.
 * Yeni soru yok; meal şeması (name/note/mealType/start) aynı kalır.
 */

const ALLERGY_RULES = [
  {
    id: 'gluten',
    detect: /gluten|buğday|bugday|ekmek|makarna|bulgur|yulaf(?!\s*glutensiz)|un\b/i,
    mealDetect: /ekmek|makarna|bulgur|simit|börek|borek|pizza|sandwich|sandviç|yulaf|unlu|kraker/i,
    safeSwap: {
      breakfast: 'Glutensiz yulaf veya yumurta + peynir + domates-salatalık, bitki çayı (~320 kcal)',
      snack_morning: 'Bir avuç çiğ badem veya yoğurt (~150 kcal)',
      lunch: 'Izgara tavuk/balık, bol salata, glutensiz yan (~450 kcal)',
      snack_afternoon: 'Meyve + süzme yoğurt (~180 kcal)',
      dinner: 'Fırın balık veya sebzeli köfte (glutensiz), salata (~420 kcal)',
      snack_evening: 'Süzme yoğurt veya ayran (~120 kcal)',
    },
  },
  {
    id: 'lactose',
    detect: /laktoz|süt|sut\b|dairy|peynir|yoğurt|yogurt|ayran|kaşar|kasar/i,
    mealDetect: /süt|sut\b|peynir|yoğurt|yogurt|ayran|kaşar|kasar|labne|krema/i,
    safeSwap: {
      breakfast: '2 yumurta, domates-salatalık, zeytin, glutensiz veya tam tahıl ekmek (~350 kcal)',
      snack_morning: 'Meyve + bir avuç çiğ kuruyemiş (~160 kcal)',
      lunch: 'Izgara tavuk, bulgur/pilav, salata (~480 kcal)',
      snack_afternoon: 'Meyve (~100 kcal)',
      dinner: 'Izgara balık veya mercimek yemeği, salata (~420 kcal)',
      snack_evening: 'Bitki çayı + meyve (~80 kcal)',
    },
  },
  {
    id: 'nut',
    detect: /fıstık|fistık|fistik|yer\s*fıst|ceviz|badem|fındık|findik|nut allergy|kuruyemiş alerji/i,
    mealDetect: /fıstık|fistık|ceviz|badem|fındık|findik|nut\b|ezmesi|pesto/i,
    safeSwap: {
      breakfast: '2 yumurta, yulaf veya ekmek, domates (~340 kcal)',
      snack_morning: 'Meyve (~90 kcal)',
      lunch: 'Izgara tavuk, salata, pilav (~470 kcal)',
      snack_afternoon: 'Yoğurt veya ayran (~120 kcal)',
      dinner: 'Sebzeli ızgara balık, salata (~400 kcal)',
      snack_evening: 'Bitki çayı (~10 kcal)',
    },
  },
  {
    id: 'egg',
    detect: /yumurta|egg/i,
    mealDetect: /yumurta|omlet|menemen/i,
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
  return ALLERGY_RULES.filter((r) => r.detect.test(text)).map((r) => r.id)
}

export function parseKcalFromMealName(name = '') {
  const m = String(name).match(/~\s*(\d{2,4})\s*kcal/i)
    || String(name).match(/\((\d{2,4})\s*kcal\)/i)
    || String(name).match(/(\d{2,4})\s*kcal/i)
  return m ? Number(m[1]) : null
}

/**
 * Öğün listesini alerji + kalori bandına göre düzelt.
 * @returns {{ meals, explain, dailyKcal, inBand }}
 */
export function guardNutritionMeals(meals, { healthTest = {}, dailyCalories = null } = {}) {
  const flags = detectAllergyFlags(healthTest)
  const explain = []
  if (flags.length) explain.push(`alerji bayrakları: ${flags.join(', ')}`)

  const target = dailyCalories?.recommended || dailyCalories?.maintenance || null
  let next = (meals || []).map((m) => ({ ...m }))

  for (const meal of next) {
    const name = meal.name || ''
    for (const rule of ALLERGY_RULES) {
      if (!flags.includes(rule.id)) continue
      if (rule.mealDetect.test(name)) {
        const swap = rule.safeSwap[meal.mealType]
        if (swap) {
          meal.name = swap
          meal.note = [meal.note, `alerji güvenli alternatif (${rule.id})`].filter(Boolean).join(' · ').slice(0, 200)
          explain.push(`${meal.mealType}: ${rule.id} swap`)
        }
      }
    }
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
  if (target && parsedCount >= 3) {
    const low = target * 0.8
    const high = target * 1.2
    inBand = dailyKcal >= low && dailyKcal <= high
    if (!inBand) {
      explain.push(`kcal band dışı: toplam~${dailyKcal} hedef~${target}`)
      // Deterministik hafif düzeltme: snack’lere kcal notu ekle / ana öğünlere hedef ipucu
      const scale = target / Math.max(dailyKcal, 1)
      next = next.map((meal) => {
        const k = parseKcalFromMealName(meal.name)
        if (k == null) return meal
        const adjusted = Math.round(k * scale)
        const cleaned = String(meal.name)
          .replace(/~\s*\d{2,4}\s*kcal/ig, '')
          .replace(/\(\s*\d{2,4}\s*kcal\s*\)/ig, '')
          .replace(/\d{2,4}\s*kcal/ig, '')
          .replace(/\(\s*\)/g, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+,/g, ',')
          .trim()
          .replace(/[,\s]+$/g, '')
        return {
          ...meal,
          name: `${cleaned} (~${adjusted} kcal)`.slice(0, 400),
        }
      })
      dailyKcal = next.reduce((s, m) => s + (parseKcalFromMealName(m.name) || 0), 0)
      inBand = dailyKcal >= low && dailyKcal <= high
      explain.push(`kcal yeniden ölçeklendi → ~${dailyKcal}`)
    } else {
      explain.push(`kcal band OK: ~${dailyKcal} / ${target}`)
    }
  } else if (target) {
    explain.push('kcal parse yetersiz — band kontrolü atlandı')
  }

  return { meals: next, explain, dailyKcal, inBand, allergyFlags: flags, targetKcal: target }
}
