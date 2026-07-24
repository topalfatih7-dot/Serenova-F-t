/**
 * Nutrition Integration — antrenman ↔ beslenme kısıtları.
 * Protein / yağ / karbonhidrat / kalori / alerji → prompt + guard.
 */

import { detectAllergyFlags } from './nutritionGuard.js'
import { evaluateNutritionSafety } from './safetyGate.js'

/**
 * @returns {{
 *   proteinGPerKg: number,
 *   proteinGDay: number,
 *   fatGDay: number,
 *   carbGDay: number,
 *   targetKcal: number|null,
 *   trainingDayKcalBump: number,
 *   allergyFlags: string[],
 *   mealTimingHint: string,
 *   promptBlock: string,
 *   explain: string[],
 *   safety: object,
 * }}
 */
export function buildNutritionConstraints(profile, goalPlan, dailyCalories, opts = {}) {
  const explain = []
  const weight = parseFloat(profile?.weight) || parseFloat(profile?.targetWeight) || 70
  const primary = goalPlan?.primary || 'general_fitness'
  const sessionStart = opts.sessionStart || '09:00'
  const sessionMin = profile?.schedule?.sessionMinutes || 35
  const ht = profile?.rawHealthTest || {}
  const safety = opts.safety || evaluateNutritionSafety({
    bmi: profile?.bmi,
    goals: profile?.goals,
    constraints: profile?.constraints,
  }, ht)

  let proteinGPerKg = 1.6
  if (primary === 'fat_loss' || primary === 'hypertrophy' || goalPlan?.programBias === 'recomp') {
    proteinGPerKg = 1.9
  } else if (primary === 'strength') {
    proteinGPerKg = 1.8
  } else if (primary === 'health' || primary === 'lifestyle' || primary === 'rehab_support') {
    proteinGPerKg = 1.6
  }
  if (profile?.bmi != null && profile.bmi >= 27 && primary === 'fat_loss') {
    proteinGPerKg = 2.2
  }
  if (safety.blockDeficit && primary === 'fat_loss') {
    proteinGPerKg = Math.max(proteinGPerKg, 1.8)
  }
  proteinGPerKg = Math.max(1.6, Math.min(2.4, proteinGPerKg))

  // dailyCalories zaten hesaplandıysa onu tercih et
  const proteinGDay = dailyCalories?.proteinG
    ? Number(dailyCalories.proteinG)
    : Math.round(weight * proteinGPerKg)
  if (!dailyCalories?.proteinG) {
    explain.push(`protein ~${proteinGPerKg} g/kg → ${proteinGDay}g/gün`)
  } else {
    explain.push(`protein hedefi ${proteinGDay}g/gün (Mifflin paketi)`)
    proteinGPerKg = Math.round((proteinGDay / weight) * 100) / 100
  }

  const fatGDay = dailyCalories?.fatG
    ? Number(dailyCalories.fatG)
    : Math.round(weight * Math.max(0.6, primary === 'fat_loss' ? 0.7 : 0.8))
  const carbGDay = dailyCalories?.carbG
    ? Number(dailyCalories.carbG)
    : null

  const targetKcal = dailyCalories?.recommended || dailyCalories?.maintenance || null
  const hours = sessionMin / 60
  const trainingDayKcalBump = Math.round(5 * weight * hours * 0.15)
  explain.push(targetKcal ? `hedef kcal ~${targetKcal}` : 'hedef kcal yok')
  explain.push(`yağ ≥${fatGDay}g/gün`)
  if (carbGDay != null) explain.push(`karbonhidrat ~${carbGDay}g/gün`)
  if (safety.flags?.length) explain.push(`güvenlik: ${safety.flags.join(', ')}`)

  const allergyFlags = detectAllergyFlags(ht)
  if (allergyFlags.length) explain.push(`alerji: ${allergyFlags.join(', ')}`)

  const mealTimingHint = `Antrenman saati ~${sessionStart}: ana öğünlerden birini seansa yakın (1–2 saat önce veya sonrası) planla; su önerisi yazma.`

  const allergyLine = allergyFlags.length
    ? `YASAK / dikkat: ${allergyFlags.join(', ')} — bu alerjenleri öğünlerde kullanma.`
    : 'Bilinen alerji bayrağı yok; HT özetindeki alerji notlarına yine uy.'

  const safetyLines = (safety.messagesTR || []).map((m) => `- Güvenlik: ${m}`)
  if (safety.blockDeficit) {
    safetyLines.push('- Kalori açığı UYGULAMA; bakım / dengeli plan yaz.')
  }
  if (safety.blockAggressiveLanguage) {
    safetyLines.push('- "Hızlı zayıfla / detoks / mucize" dili YASAK.')
  }
  if (safety.diabetesCaution) {
    safetyLines.push('- Diyabet ihtimali: aşırı düşük karbonhidrat veya agresif HIIT dili kullanma.')
  }

  const promptBlock = [
    'BESLENME KISITLARI (kod hesapladı — uydurma / değiştirme):',
    targetKcal
      ? `- Günlük kalori hedefi: ~${targetKcal} kcal (±10%); her öğünde porsiyon + ~kcal yaz.`
      : '- Kalori hedefi belirsiz; dengeli porsiyon kullan.',
    `- Makro: protein ~${proteinGDay} g · yağ ~${fatGDay} g${carbGDay != null ? ` · karbonhidrat ~${carbGDay} g` : ''}.`,
    `- Her ana öğünde ~20–40 g protein hedefle; 6 öğüne dağıt.`,
    `- Antrenman günü: karbonhidratı biraz öne çıkar (toplam +~${trainingDayKcalBump} kcal esnek).`,
    '- Dinlenme günü: proteini koru, aşırı kalori ekleme.',
    allergyLine,
    mealTimingHint,
    ...safetyLines,
    '- Su/hidrasyon cümlesi YAZMA. Tıbbi diyet / teşhis iddiası YOK.',
  ].join('\n')

  return {
    proteinGPerKg,
    proteinGDay,
    fatGDay,
    carbGDay,
    targetKcal,
    trainingDayKcalBump,
    allergyFlags,
    mealTimingHint,
    promptBlock,
    explain,
    safety,
  }
}
