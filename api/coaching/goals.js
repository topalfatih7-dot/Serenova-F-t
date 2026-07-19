/**
 * Goal Classification Engine — serbest metin + BMI → primary/secondary.
 */

const GOAL_KEYWORDS = [
  { goal: 'fat_loss', re: /kilo|yağ|zayıf|vermek|veriş|fat|weight\s*loss|slim/i },
  { goal: 'hypertrophy', re: /kas|hipertrofi|şekil|tonus|muscle|büyü|kalça|glute|popo/i },
  { goal: 'strength', re: /güç|kuvvet|strength|1rm|ağırlık kald/i },
  { goal: 'muscular_endurance', re: /dayanıklılık|endurance|tekrar|kondisyon/i },
  { goal: 'athletic', re: /spor\s*perform|atlet|koşu|5\s*km|sprint/i },
  { goal: 'posture_mobility', re: /postür|duruş|esneklik|mobilite|mobility|yoga|pilates/i },
  { goal: 'rehab_support', re: /rehabilit|ağrı\s*azalt|sakatlık|diz|bel|omuz|iyileş/i },
  { goal: 'health', re: /sağlık|tansiyon|şeker|metabol/i },
  { goal: 'lifestyle', re: /alışkanlık|düzenli|formda\s*kal|enerji/i },
]

export function classifyGoals(profile) {
  const text = String(profile?.preferences?.goalText || '')
  const hits = []
  for (const { goal, re } of GOAL_KEYWORDS) {
    if (re.test(text)) hits.push(goal)
  }

  const c = profile?.constraints || {}
  const activeInjury = c.injuries === 'yes_ongoing' || c.injuries === 'yes_partial'
  if (activeInjury && (c.injuryLimitation === 'moderate' || c.injuryLimitation === 'severe' || c.painScale >= 6)) {
    hits.unshift('rehab_support')
  }

  const bmi = profile?.bmi
  if (bmi != null && bmi >= 27 && !hits.includes('fat_loss') && !hits.includes('hypertrophy')) {
    hits.push('fat_loss')
  }
  if (bmi != null && bmi < 20 && hits.includes('fat_loss')) {
    // conflict: underweight fat loss → prefer hypertrophy/health
    const idx = hits.indexOf('fat_loss')
    if (idx >= 0) hits.splice(idx, 1)
    if (!hits.includes('hypertrophy')) hits.push('hypertrophy')
  }

  if (!hits.length) hits.push('general_fitness')

  // Priority: rehab > health > performance goals
  const priority = [
    'rehab_support', 'health', 'posture_mobility', 'fat_loss',
    'hypertrophy', 'strength', 'athletic', 'muscular_endurance',
    'lifestyle', 'general_fitness',
  ]
  hits.sort((a, b) => priority.indexOf(a) - priority.indexOf(b))

  const unique = [...new Set(hits)]
  const primary = unique[0]
  const secondary = unique.slice(1, 3)
  const weights = {}
  if (secondary.length === 0) {
    weights[primary] = 1
  } else if (secondary.length === 1) {
    weights[primary] = 0.65
    weights[secondary[0]] = 0.35
  } else {
    weights[primary] = 0.55
    weights[secondary[0]] = 0.3
    weights[secondary[1]] = 0.15
  }

  let programBias = 'general'
  if (primary === 'fat_loss') programBias = 'fat_loss'
  else if (primary === 'hypertrophy') programBias = 'hypertrophy'
  else if (primary === 'strength') programBias = 'strength'
  else if (primary === 'muscular_endurance' || primary === 'athletic') programBias = 'endurance'
  else if (primary === 'posture_mobility' || primary === 'rehab_support') programBias = 'mobility'
  else if (primary === 'fat_loss' && secondary.includes('hypertrophy')) programBias = 'recomp'

  const gluteFocus = /kalça|glute|popo|hip\s*thrust/i.test(text)
    || (profile?.gender === 'female' && primary === 'hypertrophy')

  const conflicts = []
  if (primary === 'rehab_support' && unique.includes('strength')) {
    conflicts.push('Rehab öncelikli; güç hedefi ikincil tutuldu')
  }

  return {
    primary,
    secondary,
    weights,
    conflicts,
    programBias,
    gluteFocus,
    explain: [`primary=${primary}`, `bias=${programBias}`, gluteFocus ? 'gluteFocus' : ''].filter(Boolean),
  }
}
