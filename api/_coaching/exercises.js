/**
 * Exercise Selection Engine — metadata derive, filter, score, slot fill.
 */

import { exerciseViolatesRisk } from './risk.js'

const DIFFICULTY_RANK = { beginner: 1, intermediate: 2, advanced: 3 }

function norm(s) {
  return String(s || '').toLowerCase().trim()
}

/** DB satırından ExerciseMeta türet (Phase 1 heuristic) */
export function deriveExerciseMeta(row) {
  const name = norm(row.name)
  const body = norm(row.body_part || row.bodyPart)
  const target = norm(row.target_muscle || row.targetMuscle)
  const equip = norm(row.equipment)
  const cat = norm(row.category)
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
  const blob = `${name} ${body} ${target} ${cat}`

  let movementPattern = meta.movementPattern || 'other'
  if (movementPattern === 'other') {
    if (/squat|goblet|leg press|hack|oturarak bacak/.test(blob)) movementPattern = 'squat'
    else if (/deadlift|hinge|rdl|romanian|good morning|hip hinge|swings?/.test(blob)) movementPattern = 'hinge'
    else if (/lunge|split squat|step.?up|afiş|reverse lunge/.test(blob)) movementPattern = 'lunge'
    else if (/bench|push.?up|şınav|chest press|fly|pec/.test(blob)) movementPattern = 'push_h'
    else if (/overhead|shoulder press|military|arnold|dik press/.test(blob)) movementPattern = 'push_v'
    else if (/row|çekiş|pulldown|face pull|reverse fly/.test(blob)) movementPattern = 'pull_h'
    else if (/pull.?up|chin.?up|barfiks|lat pulldown|yukarı çek/.test(blob)) movementPattern = 'pull_v'
    else if (/plank|crunch|dead bug|pallof|core|mekik|oblique/.test(blob)) movementPattern = 'core'
    else if (/walk|march|bike|cardio|koşu|jumping jack|burpee/.test(blob)) movementPattern = 'loco'
    else if (/stretch|mobil|yoga|foam|esnek/.test(blob)) movementPattern = 'mobility'
    else if (/bridge|hip thrust|glute/.test(blob)) movementPattern = 'hinge'
    else if (/curl|extension|raise|shrug|calf/.test(blob)) movementPattern = 'accessory'
  }

  let equipmentClass = meta.equipmentClass
  if (!equipmentClass) {
    if (row.requires_machine || /makine|machine|smith|cable|kablo/.test(equip)) {
      equipmentClass = /cable|kablo/.test(equip) ? 'cable' : 'machine'
    } else if (/barbell|halter|bar/.test(equip) || /barbell|halter/.test(name)) equipmentClass = 'barbell'
    else if (/dumbbell|dambıl|db /.test(equip) || /dambıl|dumbbell/.test(name)) equipmentClass = 'dumbbell'
    else if (/band|direnç|elastik/.test(equip) || /band/.test(name)) equipmentClass = 'band'
    else if (/bodyweight|vücut|kendi/.test(equip) || !equip) equipmentClass = 'bodyweight'
    else equipmentClass = 'other'
  }

  const jointStress = {
    back: 1,
    knee: 1,
    shoulder: 1,
    hip: 1,
    ...(meta.jointStress || {}),
  }
  if (/deadlift|squat|good morning|axial/.test(blob)) jointStress.back = Math.max(jointStress.back, 3)
  if (/squat|lunge|jump|plyo/.test(blob)) jointStress.knee = Math.max(jointStress.knee, 3)
  if (/overhead|military|snatch|handstand/.test(blob)) jointStress.shoulder = Math.max(jointStress.shoulder, 4)
  if (/deep squat|pistol/.test(blob)) {
    jointStress.knee = Math.max(jointStress.knee, 4)
    jointStress.hip = Math.max(jointStress.hip, 3)
  }
  if (movementPattern === 'mobility' || movementPattern === 'core') {
    jointStress.back = Math.min(jointStress.back, 2)
    jointStress.knee = Math.min(jointStress.knee, 2)
    jointStress.shoulder = Math.min(jointStress.shoulder, 2)
  }

  const tags = new Set(Array.isArray(meta.tags) ? meta.tags : [])
  if (movementPattern === 'push_v') tags.add('overhead_press')
  if (/behind.?neck|ense/.test(blob)) tags.add('behind_neck')
  if (/jump|plyo|burpee|box jump/.test(blob)) {
    tags.add('plyometric')
    tags.add('high_impact')
  }
  if (/back squat|barbell squat|deadlift/.test(blob)) tags.add('axial_loading_heavy')
  if (movementPattern === 'lunge') tags.add('lunge_loaded')
  if (/good morning/.test(blob)) tags.add('good_morning_loaded')
  if (jointStress.knee >= 4) tags.add('deep_knee_flexion')

  const difficulty = row.difficulty || 'beginner'
  const skillDemand = meta.skillDemand || DIFFICULTY_RANK[difficulty] || 1
  const fatigueCost = meta.fatigueCost || (
    ['squat', 'hinge', 'push_v'].includes(movementPattern) ? 4
      : ['lunge', 'pull_v'].includes(movementPattern) ? 3
        : movementPattern === 'mobility' ? 1 : 2
  )

  const locations = Array.isArray(row.locations) ? row.locations.map(norm) : []

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    video_url: row.video_url || row.videoUrl || '',
    video_pending: Boolean(row.video_pending ?? row.videoPending),
    body_part: row.body_part || row.bodyPart || '',
    target_muscle: row.target_muscle || row.targetMuscle || '',
    equipment: row.equipment || '',
    difficulty,
    requires_machine: Boolean(row.requires_machine ?? row.requiresMachine),
    locations,
    movementPattern,
    equipmentClass,
    jointStress,
    tags: [...tags],
    skillDemand,
    fatigueCost,
    suitability: {
      beginner: difficulty === 'beginner' || skillDemand <= 2,
      home: !row.requires_machine && ['bodyweight', 'band', 'dumbbell'].includes(equipmentClass),
      gym: true,
    },
    safetyRating: meta.safetyRating || (tags.has('plyometric') ? 2 : 4),
    raw: row,
  }
}

function experienceCap(experienceLevel) {
  if (experienceLevel === 'novice' || experienceLevel === 'beginner') return 1
  if (experienceLevel === 'intermediate') return 2
  return 3
}

function equipmentAllowed(meta, equipmentProfile = [], location = 'mixed') {
  const access = new Set(equipmentProfile)
  if (location === 'home' || (!access.has('gym') && location !== 'gym')) {
    if (meta.requires_machine) return false
    if (meta.equipmentClass === 'machine' || meta.equipmentClass === 'barbell') return false
    if (meta.equipmentClass === 'cable') return false
    if (access.has('bodyweight') || access.size === 0) {
      if (['bodyweight', 'band'].includes(meta.equipmentClass)) return true
      if (access.has('dumbbells') && meta.equipmentClass === 'dumbbell') return true
      if (access.has('bands') && meta.equipmentClass === 'band') return true
      if (meta.equipmentClass === 'bodyweight') return true
      return access.has('dumbbells') && meta.equipmentClass === 'dumbbell'
    }
    if (access.has('dumbbells') && meta.equipmentClass === 'dumbbell') return true
    if (access.has('bands') && meta.equipmentClass === 'band') return true
    if (meta.equipmentClass === 'bodyweight') return true
    return false
  }
  if (location === 'outdoor') {
    return !meta.requires_machine && ['bodyweight', 'band'].includes(meta.equipmentClass)
  }
  // gym / mixed with gym access
  return true
}

/**
 * Geniş kütüphaneden uygun havuz.
 */
export function buildEligiblePool(exerciseRows, profile, riskReport) {
  const cap = experienceCap(profile?.experienceLevel)
  const location = profile?.locationProfile || 'mixed'
  const equipment = profile?.equipmentProfile || []
  const pool = []

  for (const row of exerciseRows || []) {
    if (row.video_pending || row.videoPending) continue
    if (row.metadata?.importStatus === 'deferred') continue
    const meta = deriveExerciseMeta(row)
    const dRank = DIFFICULTY_RANK[meta.difficulty] || 1
    if (dRank > cap) continue
    if (!equipmentAllowed(meta, equipment, location)) continue
    if (exerciseViolatesRisk(meta, riskReport)) continue
    if (riskReport?.level === 'referral' && !['mobility', 'loco', 'core'].includes(meta.movementPattern)) {
      if (meta.fatigueCost > 2) continue
    }
    pool.push(meta)
  }

  return pool
}

function scoreForPattern(meta, pattern, goalPlan, profile, usedIds) {
  let score = 0
  if (meta.movementPattern === pattern) score += 40
  else if (pattern === 'push_h' && meta.movementPattern === 'push_v') score += 10
  else if (pattern === 'pull_h' && meta.movementPattern === 'pull_v') score += 10
  else if (pattern === 'squat' && meta.movementPattern === 'lunge') score += 12
  else if (pattern === 'hinge' && /glute|bridge|thrust/.test(norm(meta.name))) score += 35
  else return -1

  const bias = goalPlan?.programBias
  if (bias === 'fat_loss' && meta.movementPattern === 'loco') score += 8
  if (bias === 'hypertrophy' && meta.fatigueCost >= 3) score += 6
  if (bias === 'mobility' && meta.movementPattern === 'mobility') score += 15
  if (goalPlan?.gluteFocus && /glute|bridge|hip|kalça|thrust/.test(norm(`${meta.name} ${meta.target_muscle}`))) {
    score += 12
  }

  score += (meta.safetyRating || 3) * 3
  score += meta.suitability?.beginner ? 5 : 0

  const prefs = profile?.preferences?.modalities || []
  if (prefs.includes('mindBody') && meta.movementPattern === 'mobility') score += 8
  if (prefs.includes('walking') && meta.movementPattern === 'loco') score += 8
  if (prefs.includes('strength') && meta.fatigueCost >= 3) score += 6
  if (prefs.includes('shortHome') && meta.suitability?.home) score += 6

  if (usedIds.has(meta.id)) score -= 100
  // stable tie-break: prefer lower id lexicographically via tiny score
  score += (1 - (meta.id.charCodeAt(0) % 7) * 0.01)

  return score
}

/**
 * Slot pattern listesi için egzersiz seç (deterministik).
 */
export function selectExercisesForPatterns(pool, patterns, profile, goalPlan, opts = {}) {
  const usedIds = new Set(opts.excludeIds || [])
  const selected = []
  const explain = []

  for (const pattern of patterns) {
    let best = null
    let bestScore = -1
    for (const meta of pool) {
      if (usedIds.has(meta.id)) continue
      const s = scoreForPattern(meta, pattern, goalPlan, profile, usedIds)
      if (s > bestScore) {
        bestScore = s
        best = meta
      }
    }
    if (best && bestScore >= 0) {
      usedIds.add(best.id)
      selected.push({ meta: best, pattern, score: bestScore })
      explain.push(`${pattern}→${best.name} (${bestScore.toFixed(1)})`)
    } else {
      explain.push(`${pattern}→SKIP`)
    }
  }

  return { selected, explain, usedIds }
}

/** SQL ön filtresi için difficulty listesi */
export function difficultiesForExperience(experienceLevel) {
  if (experienceLevel === 'novice' || experienceLevel === 'beginner') return ['beginner']
  if (experienceLevel === 'intermediate') return ['beginner', 'intermediate']
  return ['beginner', 'intermediate', 'advanced']
}

export function needsMachineExclusion(profile) {
  const loc = profile?.locationProfile
  const eq = profile?.equipmentProfile || []
  if (loc === 'home' || loc === 'outdoor') return true
  if (!eq.includes('gym')) return true
  return false
}
