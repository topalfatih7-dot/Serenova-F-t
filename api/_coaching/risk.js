/**
 * Risk Analysis Engine — hard restrictions (prompt’a güvenmez).
 */

import { evaluateNutritionSafety } from './safetyGate.js'

const REGION_ALIASES = {
  neck: 'neck',
  shoulder: 'shoulder',
  elbow: 'elbow',
  hand_wrist: 'wrist',
  wrist: 'wrist',
  upper_back: 'upper_back',
  low_back: 'low_back',
  lowback: 'low_back',
  hip: 'hip',
  knee: 'knee',
  ankle: 'ankle',
  foot: 'foot',
}

const REGION_BANS = {
  knee: {
    avoid: ['deep_knee_flexion', 'plyometric', 'high_impact', 'lunge_loaded'],
    limit: ['single_leg_hard'],
  },
  shoulder: {
    avoid: ['overhead_press', 'behind_neck', 'kipping'],
    limit: ['horizontal_push_heavy'],
  },
  low_back: {
    avoid: ['axial_loading_heavy', 'loaded_flexion', 'good_morning_loaded'],
    limit: ['hinge_loaded'],
  },
  neck: {
    avoid: ['behind_neck', 'neck_loading'],
    limit: [],
  },
  hip: {
    avoid: ['deep_hip_impingement'],
    limit: ['deep_squat'],
  },
  ankle: {
    avoid: ['plyometric', 'high_impact'],
    limit: [],
  },
  wrist: {
    avoid: ['wrist_extension_load'],
    limit: ['floor_pushup'],
  },
  upper_back: {
    avoid: ['axial_loading_heavy'],
    limit: [],
  },
  elbow: {
    avoid: ['elbow_extension_heavy'],
    limit: [],
  },
  foot: {
    avoid: ['plyometric', 'high_impact'],
    limit: [],
  },
}

function normalizeRegion(r) {
  return REGION_ALIASES[r] || r
}

/**
 * @param {import('./profile.js').buildAthleteProfile extends Function ? any : object} profile
 */
export function analyzeRisk(profile) {
  const c = profile?.constraints || {}
  const redFlags = []
  const warnings = []
  const bannedTags = new Set()
  const preferredPatterns = []
  const jointRestrictions = {}

  const regions = [
    ...(c.injuryRegions || []),
    ...(c.painAreas || []),
  ].map(normalizeRegion)

  const activeInjury = c.injuries === 'yes_ongoing' || c.injuries === 'yes_partial'
  const severity = c.injuryLimitation || 'mild'

  for (const region of [...new Set(regions)]) {
    const rules = REGION_BANS[region]
    if (!rules) continue
    const level = activeInjury && (severity === 'severe' || severity === 'moderate')
      ? 'avoid'
      : activeInjury || (c.painAreas || []).map(normalizeRegion).includes(region)
        ? (severity === 'mild' ? 'limit' : 'avoid')
        : 'limit'

    jointRestrictions[region] = level
    const tags = level === 'avoid' ? [...rules.avoid, ...rules.limit] : rules.limit
    tags.forEach((t) => bannedTags.add(t))

    if (region === 'knee') preferredPatterns.push('hip_bridge', 'open_chain_knee_safe', 'hinge_light')
    if (region === 'shoulder') preferredPatterns.push('horizontal_push_supported', 'pull_h')
    if (region === 'low_back') preferredPatterns.push('core_anti_extension', 'hinge_regression')
  }

  let referralSuggested = false
  if (c.injuryDoctorRestriction === 'yes') {
    referralSuggested = true
    redFlags.push({
      code: 'doctor_exercise_restriction',
      severity: 'high',
      messageTR: 'Doktor egzersiz kısıtı bildirildi; program düşük yükte tutuldu. Uzmana danışın.',
    })
  }

  const chronic = c.chronicConditions || []
  const serious = ['heart', 'hypertension', 'stroke', 'cancer', 'kidney']
  if (c.doctorClearance === 'yes' && chronic.some((x) => serious.includes(x))) {
    referralSuggested = true
    redFlags.push({
      code: 'doctor_restriction_with_chronic',
      severity: 'high',
      messageTR: 'Doktor kısıtlaması ve kronik durum bildirildi; yalnızca çok düşük yoğunluk önerildi.',
    })
  }

  if (c.pregnancy && c.pregnancy !== 'no' && c.pregnancy !== 'none') {
    bannedTags.add('prone_prolonged')
    bannedTags.add('supine_prolonged')
    bannedTags.add('valsalva_heavy')
    bannedTags.add('plyometric')
    bannedTags.add('failure_training')
    bannedTags.add('axial_loading_heavy')
    warnings.push('Gebelik bildirildi; program muhafazakâr tutuldu (tıbbi tavsiye değildir).')
    referralSuggested = true
    redFlags.push({
      code: 'pregnancy',
      severity: 'high',
      messageTR: 'Gebelik: yoğunluk düşük tutuldu; obstetrik onay olmadan agresif antrenman uygulanmamalı.',
    })
  }

  if (c.painScale >= 7) {
    bannedTags.add('failure_training')
    bannedTags.add('plyometric')
    bannedTags.add('axial_loading_heavy')
    warnings.push('Yüksek ağrı skoru: hacim ve yoğunluk düşürüldü.')
  }

  if (c.exerciseContraindications === 'yes' && c.exerciseContraindicationsDetail) {
    warnings.push(`Kaçınılacak hareket notu dikkate alındı: ${String(c.exerciseContraindicationsDetail).slice(0, 120)}`)
  }

  const nutritionSafety = evaluateNutritionSafety({
    bmi: profile?.bmi,
    goals: profile?.goals,
    constraints: c,
  }, profile?.rawHealthTest || {})

  if (nutritionSafety.flags.includes('ed_signal') || nutritionSafety.flags.includes('very_low_bmi')) {
    bannedTags.add('failure_training')
    bannedTags.add('plyometric')
    referralSuggested = true
    redFlags.push({
      code: nutritionSafety.flags.includes('ed_signal') ? 'ed_signal' : 'very_low_bmi',
      severity: 'high',
      messageTR: nutritionSafety.messagesTR[0]
        || 'Riskli beslenme / kilo profili; program muhafazakâr tutuldu.',
    })
    warnings.push(...nutritionSafety.messagesTR.slice(0, 2))
  } else if (nutritionSafety.flags.includes('low_bmi')) {
    warnings.push(...nutritionSafety.messagesTR.slice(0, 1))
  }

  const chronicLower = (c.chronicConditions || []).map((x) => String(x).toLowerCase())
  const meds = String(profile?.rawHealthTest?.medications
    || profile?.rawHealthTest?.medicationDetail
    || '').toLowerCase()
  if (
    chronicLower.some((x) => x.includes('diabetes') || x.includes('diyabet'))
    || /insulin|insülin|metformin|glp-?1|diyabet/.test(meds)
  ) {
    bannedTags.add('failure_training')
    warnings.push('Diyabet / kan şekeri notu: yoğunluk muhafazakâr; hipoglisemi riskine dikkat.')
    nutritionSafety.diabetesCaution = true
  }

  const riskScore = profile?.scores?.risk ?? 0
  let level = 'low'
  if (referralSuggested || riskScore >= 85) level = 'referral'
  else if (riskScore >= 70) level = 'high'
  else if (riskScore >= 45) level = 'moderate'

  if (level === 'referral' || level === 'high') {
    preferredPatterns.push('mobility', 'loco_easy', 'core_easy')
    bannedTags.add('failure_training')
  }

  return {
    level,
    redFlags,
    jointRestrictions,
    bannedTags: [...bannedTags],
    preferredPatterns: [...new Set(preferredPatterns)],
    warnings,
    referralSuggested,
    nutritionSafety,
    textBlocklist: buildTextBlocklist(c.exerciseContraindicationsDetail),
  }
}

function buildTextBlocklist(detail = '') {
  const raw = String(detail || '').toLowerCase()
  if (!raw.trim()) return []
  const tokens = []
  const keywords = [
    'squat', 'deadlift', 'bench', 'overhead', 'jump', 'koşu', 'running',
    'burpee', 'plank', 'lunge', 'askeri', 'askı', 'barfiks', 'şınav',
    'military', 'snatch', 'clean',
  ]
  for (const k of keywords) {
    if (raw.includes(k)) tokens.push(k)
  }
  return tokens
}

/** Egzersiz adı / türetilmiş tag’lere göre hard reject */
export function exerciseViolatesRisk(meta, riskReport) {
  if (!meta || !riskReport) return false
  const bans = new Set(riskReport.bannedTags || [])
  const tags = meta.tags || []
  for (const t of tags) {
    if (bans.has(t)) return true
  }
  const stress = meta.jointStress || {}
  for (const [joint, level] of Object.entries(riskReport.jointRestrictions || {})) {
    const s = stress[joint] ?? stress[joint === 'low_back' ? 'back' : joint]
    if (s == null) continue
    if (level === 'avoid' && s >= 3) return true
    if (level === 'limit' && s >= 4) return true
  }
  const name = String(meta.name || '').toLowerCase()
  for (const token of riskReport.textBlocklist || []) {
    if (name.includes(token)) return true
  }
  return false
}
