/**
 * Beslenme / program güvenlik kapısı — deficit ve agresif dil engelleri.
 * Antrenman risk analizi risk.js’te; burası kalori hedefi + ED / BMI sinyalleri.
 */

/**
 * Gebelik yalnızca açıkça bildirilmişse / şüphe varsa aktif sayılır.
 * `prefer_not` (Belirtmek istemiyorum), `no`, `none` → gebelik DEĞİL.
 * Eski hata: prefer_not, `!== 'no' && !== 'none'` yüzünden gebelik gibi işleniyordu.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPregnancyReported(value) {
  if (value == null || value === '') return false
  const v = String(value).trim().toLowerCase()
  return v === 'yes' || v === 'suspect'
}

/**
 * @param {object} profile — enrichProfileBasics veya athlete profile alanları
 * @param {object} [healthTest]
 * @returns {{
 *   blockDeficit: boolean,
 *   softMaintenanceOnly: boolean,
 *   blockAggressiveLanguage: boolean,
 *   diabetesCaution: boolean,
 *   hardBlockProgram: boolean,
 *   flags: string[],
 *   messagesTR: string[],
 * }}
 */
export function evaluateNutritionSafety(profile = {}, healthTest = {}) {
  const ht = healthTest && typeof healthTest === 'object' ? healthTest : {}
  const bmi = profile.bmi != null ? Number(profile.bmi) : null
  const flags = []
  const messagesTR = []
  let blockDeficit = false
  let softMaintenanceOnly = false
  let blockAggressiveLanguage = false
  let diabetesCaution = false
  let hardBlockProgram = false

  if (bmi != null && bmi < 18.5) {
    blockDeficit = true
    softMaintenanceOnly = true
    blockAggressiveLanguage = true
    flags.push('low_bmi')
    messagesTR.push('BMI düşük aralıkta; kalori açığı uygulanmadı (bakım kalorisi).')
  }
  if (bmi != null && bmi < 17) {
    softMaintenanceOnly = true
    blockAggressiveLanguage = true
    flags.push('very_low_bmi')
    messagesTR.push('Çok düşük BMI bildirimi; agresif kilo verme dili engellendi. Uzmana danışın.')
  }

  const edText = [
    ht.eatingHabits,
    ht.eatingDisorderHistory,
    ht.disorderedEating,
    ht.nutritionConcerns,
    ht.mentalHealthNotes,
    Array.isArray(ht.mentalHealth) ? ht.mentalHealth.join(' ') : ht.mentalHealth,
  ].filter(Boolean).join(' ').toLowerCase()

  const edSignals = /yeme\s*bozuk|anoreksi|bulimi|kusma|laksatif|aşırı\s*kısıt|binge|purge|ed\b|orthorexia|aşırı\s*diyet/
  if (edSignals.test(edText)) {
    blockDeficit = true
    softMaintenanceOnly = true
    blockAggressiveLanguage = true
    flags.push('ed_signal')
    messagesTR.push('Yeme davranışı risk sinyali; açık verilmedi, bakım odaklı plan önerildi.')
  }

  const rapidLoss = /hızlı\s*kilo|haftada\s*[2-9]|çok\s*hızlı\s*vermek|crash\s*diet/
  const goalText = [
    ...(Array.isArray(profile.goals) ? profile.goals : []),
    ht.performanceGoal,
    ht.weightGoalPace,
  ].filter(Boolean).join(' ').toLowerCase()
  if (rapidLoss.test(goalText) || rapidLoss.test(edText)) {
    blockDeficit = true
    blockAggressiveLanguage = true
    flags.push('rapid_loss_intent')
    messagesTR.push('Hızlı kilo kaybı hedefi yumuşatıldı; güvenli tempo tercih edildi.')
  }

  const chronic = Array.isArray(ht.chronicConditions)
    ? ht.chronicConditions
    : (Array.isArray(profile.constraints?.chronicConditions)
      ? profile.constraints.chronicConditions
      : [])
  const meds = String(ht.medications || ht.medicationDetail || ht.currentMedications || '').toLowerCase()
  const hasDiabetes = chronic.includes('diabetes') || chronic.includes('diyabet')
    || /diyabet|diabetes|insulin|insülin|metformin|sülfonil|glp-?1/.test(meds)
    || /diyabet|diabetes/.test(String(ht.bloodSugar || ''))
  if (hasDiabetes) {
    diabetesCaution = true
    flags.push('diabetes_caution')
    messagesTR.push('Kan şekeri / diyabet notu: agresif HIIT ve derin açık önerilmez; tıbbi takip edilmeli.')
  }

  const pregnancy = ht.pregnancy || profile.constraints?.pregnancy
  if (isPregnancyReported(pregnancy)) {
    blockAggressiveLanguage = true
    flags.push('pregnancy')
    messagesTR.push('Gebelik bildirildi; plan muhafazakâr tutuldu (tıbbi tavsiye değildir).')
    const clearance = ht.doctorClearance || profile.constraints?.doctorClearance
    if (clearance === 'yes' || clearance === 'unsure') {
      softMaintenanceOnly = softMaintenanceOnly || false
      flags.push('pregnancy_clearance_caution')
    }
  }

  return {
    blockDeficit,
    softMaintenanceOnly,
    blockAggressiveLanguage,
    diabetesCaution,
    hardBlockProgram,
    flags,
    messagesTR,
  }
}
