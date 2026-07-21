/**
 * User Profiling Engine — mevcut HT + profil alanlarından AthleteProfile.
 * Yeni soru eklemez; eksik alanda güvenli default + explain.
 */

const WEEKDAY_NAME_TO_JS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const EMOJI_SCORE = {
  very_bad: 15,
  bad: 30,
  low: 35,
  ok: 55,
  fair: 55,
  good: 75,
  very_good: 90,
  excellent: 95,
  high: 80,
  medium: 55,
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function calcBmi(weight, height) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h < 50) return null
  return Math.round((w / ((h / 100) ** 2)) * 10) / 10
}

function bmiCategory(bmi) {
  if (bmi == null) return ''
  if (bmi < 18.5) return 'zayıf'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'fazla kilolu'
  return 'obezite aralığı'
}

function resolveAge(memberData = {}, ht = {}) {
  let age = parseFloat(memberData.age)
  if (!age && memberData.birthDate) {
    const birth = new Date(memberData.birthDate)
    if (!Number.isNaN(birth.getTime())) {
      age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    }
  }
  if (!age) age = parseFloat(ht.age) || 30
  return Math.max(16, Math.round(age))
}

function mapExperience(ht = {}) {
  const hist = ht.trainingHistoryYears
  const freq = ht.activityFrequency
  const explain = []
  let level = 'beginner'

  if (hist === 'none' || freq === '0') {
    level = 'novice'
    explain.push('Antrenman geçmişi yok veya 0 gün aktivite → novice')
  } else if (hist === 'under_6m' || freq === '1_2') {
    level = 'beginner'
    explain.push('Kısa geçmiş veya 1–2 gün/hafta → beginner')
  } else if (hist === '6m_2y' || freq === '3_4') {
    level = 'intermediate'
    explain.push('6ay–2yıl veya 3–4 gün → intermediate')
  } else if (hist === '2y_plus' || freq === '5_plus') {
    level = 'advanced'
    explain.push('2yıl+ veya 5+ gün → advanced')
  }

  const activities = Array.isArray(ht.currentActivityTypes) ? ht.currentActivityTypes : []
  if (level === 'advanced' && !activities.includes('strength') && ht.previousCoachExperience === 'no') {
    level = 'intermediate'
    explain.push('Kuvvet/koç yok → advanced cap intermediate')
  }
  if (ht.movementQuality === 'weak' || ht.injuryLimitation === 'severe') {
    if (level === 'advanced' || level === 'intermediate') {
      level = 'beginner'
      explain.push('Zayıf hareket kalitesi veya ciddi kısıt → beginner cap')
    }
  }
  return { experienceLevel: level, explain }
}

function sessionMinutesFromGoal(band) {
  const map = {
    '15_25': 22,
    '30_40': 35,
    '45_60': 50,
    '60_plus': 65,
  }
  return map[band] || 35
}

function resolveWorkoutWeekdays(availability = {}, preferredTrainingDays = []) {
  const fromAvail = Object.entries(availability || {})
    .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
    .map(([day]) => Number(day))
    .filter((d) => !Number.isNaN(d))

  if (fromAvail.length) {
    return { weekdays: [...new Set(fromAvail)].sort(), source: 'availability' }
  }

  const fromPreferred = (Array.isArray(preferredTrainingDays) ? preferredTrainingDays : [])
    .map((name) => WEEKDAY_NAME_TO_JS[String(name).toLowerCase()])
    .filter((d) => d != null)

  if (fromPreferred.length) {
    return { weekdays: [...new Set(fromPreferred)].sort(), source: 'preferredTrainingDays' }
  }

  return { weekdays: [1, 3, 5], source: 'default_mwf' }
}

function scoreRisk(ht = {}, explain = []) {
  let score = 10
  const pain = Number(ht.painScale)
  if (!Number.isNaN(pain)) score += pain * 4

  if (ht.injuries === 'yes_ongoing') score += 20
  else if (ht.injuries === 'yes_partial') score += 14
  else if (ht.injuries === 'yes_recovered') score += 4

  if (ht.injuryLimitation === 'severe') score += 15
  else if (ht.injuryLimitation === 'moderate') score += 8
  else if (ht.injuryLimitation === 'mild') score += 4

  if (ht.injuryDoctorRestriction === 'yes') score += 25

  const painAreas = Array.isArray(ht.painAreas) ? ht.painAreas : []
  score += Math.min(20, painAreas.length * 5)

  const chronic = Array.isArray(ht.chronicConditions) ? ht.chronicConditions : []
  const serious = ['heart', 'hypertension', 'stroke', 'cancer', 'kidney', 'lung']
  if (chronic.some((c) => serious.includes(c))) score += 18
  if (chronic.includes('sleep_apnea')) score += 6

  if (ht.pregnancy && ht.pregnancy !== 'no' && ht.pregnancy !== 'none') score += 20
  if (ht.doctorClearance === 'yes' && chronic.length) score += 20
  if (ht.doctorClearance === 'unsure' && chronic.length) score += 10
  if (ht.exerciseContraindications === 'yes') score += 10

  score = clamp(score)
  explain.push(`RiskScore=${score}`)
  return score
}

function scoreReadiness(ht = {}, riskScore, explain = []) {
  let score = 50
  const readinessMap = {
    not_ready: -20,
    thinking: -5,
    ready: 15,
    already_changing: 20,
    very_ready: 20,
  }
  if (ht.readinessToChange && readinessMap[ht.readinessToChange] != null) {
    score += readinessMap[ht.readinessToChange]
  }
  const mot = Number(ht.motivation)
  if (!Number.isNaN(mot)) score += (mot / 10) * 20

  score += (EMOJI_SCORE[ht.energy] ?? 55) / 10 - 5
  score += (EMOJI_SCORE[ht.wellbeing] ?? 55) / 10 - 5

  const barriers = Array.isArray(ht.exerciseBarriers) ? ht.exerciseBarriers : []
  for (const b of barriers) {
    if (['time', 'motivation', 'pain', 'knowledge', 'environment'].includes(b)) score -= 8
  }

  if (riskScore > 70) score = Math.min(score, 55)
  score = clamp(score)
  explain.push(`ReadinessScore=${score}`)
  return score
}

function scoreRecovery(ht = {}, radar = {}, explain = []) {
  const sleep = radar.sleep != null ? Number(radar.sleep) : 55
  const stressInv = radar.stress != null ? 100 - Number(radar.stress) : 50
  const energy = EMOJI_SCORE[ht.energy] ?? 55
  let score = (sleep + stressInv + energy) / 3

  if (ht.shiftWork === 'yes') score -= 12
  else if (ht.shiftWork === 'sometimes') score -= 6
  if (ht.sittingHours === '10_plus') score -= 8
  else if (ht.sittingHours === '7_9') score -= 4

  const pain = Number(ht.painScale)
  if (!Number.isNaN(pain) && pain >= 7) score -= 15
  else if (!Number.isNaN(pain) && pain >= 4) score -= 6

  score = clamp(score)
  explain.push(`RecoveryScore=${score}`)
  return score
}

function scoreAdherence(ht = {}, dayCount, sessionMin, explain = []) {
  let score = 45
  score += Math.min(25, dayCount * 6)
  if (sessionMin <= 40) score += 8
  if (sessionMin >= 60) score -= 5

  const barriers = Array.isArray(ht.exerciseBarriers) ? ht.exerciseBarriers : []
  if (barriers.includes('time')) score -= 12
  if (barriers.includes('motivation')) score -= 10

  if (ht.socialSupport === 'yes' || ht.socialSupport === 'strong') score += 8
  const mot = Number(ht.motivation)
  if (!Number.isNaN(mot) && mot >= 7) score += 8

  score = clamp(score)
  explain.push(`ExpectedAdherence=${score}`)
  return score
}

/**
 * @param {object} memberData — members.data + name/gender üst alanlar
 */
export function buildAthleteProfile(memberData = {}) {
  const ht = memberData.healthTest || {}
  const radar = memberData.healthAnalysis?.radarScores || {}
  const explain = []

  const weight = parseFloat(memberData.weight) || parseFloat(ht.weight) || 70
  const height = parseFloat(memberData.height) || parseFloat(ht.height) || 170
  const bmi = calcBmi(weight, height)
  const age = resolveAge(memberData, ht)
  const { experienceLevel, explain: expExplain } = mapExperience(ht)
  explain.push(...expExplain)

  const { weekdays, source: scheduleSource } = resolveWorkoutWeekdays(
    memberData.availability || {},
    ht.preferredTrainingDays,
  )
  if (scheduleSource === 'default_mwf') {
    explain.push('Müsaitlik yok → varsayılan Pzt/Çar/Cum')
  } else {
    explain.push(`Antrenman günleri: ${weekdays.join(',')} (${scheduleSource})`)
  }

  const sessionMinutes = sessionMinutesFromGoal(ht.sessionDurationGoal)
  const riskScore = scoreRisk(ht, explain)
  const readinessScore = scoreReadiness(ht, riskScore, explain)
  const recoveryScore = scoreRecovery(ht, radar, explain)
  const adherenceScore = scoreAdherence(ht, weekdays.length, sessionMinutes, explain)

  const equipment = Array.isArray(ht.equipmentAccess) ? ht.equipmentAccess : []
  const location = ht.trainingLocation || 'mixed'

  return {
    name: memberData.name || '',
    gender: memberData.gender || '',
    age,
    weight,
    height,
    bmi,
    bmiCategory: bmiCategory(bmi),
    targetWeight: parseFloat(memberData.targetWeight) || parseFloat(ht.targetWeight) || null,
    experienceLevel,
    lifestyleLoad: {
      sittingHours: ht.sittingHours || '',
      shiftWork: ht.shiftWork || '',
      dailySteps: ht.dailySteps || '',
    },
    equipmentProfile: equipment,
    locationProfile: location,
    schedule: {
      workoutWeekdays: weekdays,
      sessionMinutes,
      sessionDurationGoal: ht.sessionDurationGoal || '30_40',
      scheduleSource,
      availability: memberData.availability || {},
    },
    constraints: {
      painAreas: Array.isArray(ht.painAreas) ? ht.painAreas : [],
      injuryRegions: Array.isArray(ht.injuryRegions) ? ht.injuryRegions : [],
      injuries: ht.injuries || 'no',
      injuryLimitation: ht.injuryLimitation || '',
      injuryDoctorRestriction: ht.injuryDoctorRestriction || 'no',
      chronicConditions: Array.isArray(ht.chronicConditions) ? ht.chronicConditions : [],
      pregnancy: ht.pregnancy || 'no',
      doctorClearance: ht.doctorClearance || '',
      exerciseContraindications: ht.exerciseContraindications || 'no',
      exerciseContraindicationsDetail: ht.exerciseContraindicationsDetail || '',
      painScale: Number(ht.painScale) || 0,
      flexibilityLevel: ht.flexibilityLevel || 'medium',
      movementQuality: ht.movementQuality || '',
      cardioCapacity: ht.cardioCapacity || '',
    },
    preferences: {
      modalities: Array.isArray(ht.exercisePreferences) ? ht.exercisePreferences : [],
      barriers: Array.isArray(ht.exerciseBarriers) ? ht.exerciseBarriers : [],
      activityTypes: Array.isArray(ht.currentActivityTypes) ? ht.currentActivityTypes : [],
      sportsHistory: Array.isArray(ht.sportsHistory) ? ht.sportsHistory : [],
      goalText: [ht.performanceGoal, ht.dietGoal, ht.dietReason].flat().filter(Boolean).join(' | '),
      activityFrequency: ht.activityFrequency || '',
    },
    scores: {
      risk: riskScore,
      readiness: readinessScore,
      recovery: recoveryScore,
      adherenceExpected: adherenceScore,
    },
    radar,
    explain,
    rawHealthTest: ht,
  }
}

export function fitnessLevelFromExperience(experienceLevel) {
  if (experienceLevel === 'novice' || experienceLevel === 'beginner') return 'beginner'
  if (experienceLevel === 'advanced') return 'advanced'
  return 'intermediate'
}
