/**
 * Nutrition Integration — antrenman ↔ beslenme kısıtları (meal UI yok).
 * Protein / kalori / alerji / antrenman günü vurgusu → prompt + guard.
 */

import { detectAllergyFlags } from './nutritionGuard.js'

/**
 * @returns {{
 *   proteinGPerKg: number,
 *   proteinGDay: number,
 *   targetKcal: number|null,
 *   trainingDayKcalBump: number,
 *   allergyFlags: string[],
 *   mealTimingHint: string,
 *   promptBlock: string,
 *   explain: string[],
 * }}
 */
export function buildNutritionConstraints(profile, goalPlan, dailyCalories, opts = {}) {
  const explain = []
  const weight = parseFloat(profile?.weight) || parseFloat(profile?.targetWeight) || 70
  const primary = goalPlan?.primary || 'general_fitness'
  const sessionStart = opts.sessionStart || '09:00'
  const sessionMin = profile?.schedule?.sessionMinutes || 35

  let proteinGPerKg = 1.4
  if (primary === 'fat_loss' || primary === 'hypertrophy' || goalPlan?.programBias === 'recomp') {
    proteinGPerKg = 1.8
  } else if (primary === 'strength') {
    proteinGPerKg = 1.7
  } else if (primary === 'health' || primary === 'lifestyle' || primary === 'rehab_support') {
    proteinGPerKg = 1.3
  }
  // BMI yüksek + fat_loss: üst banda yaklaş
  if (profile?.bmi != null && profile.bmi >= 27 && primary === 'fat_loss') {
    proteinGPerKg = 2.0
  }
  proteinGPerKg = Math.max(1.2, Math.min(2.2, proteinGPerKg))
  const proteinGDay = Math.round(weight * proteinGPerKg)
  explain.push(`protein ~${proteinGPerKg} g/kg → ${proteinGDay}g/gün`)

  const targetKcal = dailyCalories?.recommended || dailyCalories?.maintenance || null
  // MET proxy: orta kuvvet ~5 MET * kg * hours
  const hours = sessionMin / 60
  const trainingDayKcalBump = Math.round(5 * weight * hours * 0.15) // yumuşak bump, abartısız
  explain.push(targetKcal ? `hedef kcal ~${targetKcal}` : 'hedef kcal yok')

  const ht = profile?.rawHealthTest || {}
  const allergyFlags = detectAllergyFlags(ht)
  if (allergyFlags.length) explain.push(`alerji: ${allergyFlags.join(', ')}`)

  const mealTimingHint = `Antrenman saati ~${sessionStart}: ana öğünlerden birini seansa yakın (1–2 saat önce veya sonrası) planla; su önerisi yazma.`

  const allergyLine = allergyFlags.length
    ? `YASAK / dikkat: ${allergyFlags.join(', ')} — bu alerjenleri öğünlerde kullanma.`
    : 'Bilinen alerji bayrağı yok; HT özetindeki alerji notlarına yine uy.'

  const promptBlock = [
    'BESLENME KISITLARI (Coaching Engine — uy):',
    `- Günlük protein hedefi: ~${proteinGDay} g (${proteinGPerKg} g/kg, kilo ${weight}).`,
    targetKcal ? `- Günlük kalori hedefi: ~${targetKcal} kcal (±15%); her öğünde porsiyon + ~kcal yaz.` : '- Kalori hedefi belirsiz; dengeli porsiyon kullan.',
    `- Antrenman günü: karbonhidratı biraz daha öne çıkar (toplam +~${trainingDayKcalBump} kcal kadar esnek).`,
    '- Dinlenme günü mantığı (aynı şablon): proteini koru, aşırı kalori ekleme.',
    allergyLine,
    mealTimingHint,
    '- Su/hidrasyon cümlesi YAZMA. Tıbbi diyet iddiası YOK.',
  ].join('\n')

  return {
    proteinGPerKg,
    proteinGDay,
    targetKcal,
    trainingDayKcalBump,
    allergyFlags,
    mealTimingHint,
    promptBlock,
    explain,
  }
}
