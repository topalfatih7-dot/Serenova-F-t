/**
 * Intensity Engine — sets/reps/RPE/rest → note + amount (şema genişletmeden).
 */

/**
 * @returns {{
 *   amountType: 'reps'|'duration',
 *   amount: number,
 *   durationUnit: string,
 *   sets: number,
 *   rpe: number,
 *   restSec: number,
 *   note: string,
 * }}
 */
export function prescribeIntensity(pattern, goalPlan, experienceLevel, riskLevel, volumePlan = null) {
  const bias = goalPlan?.programBias || 'general'
  let sets = volumePlan?.setsPerSessionMajor || 2
  let reps = 12
  let rpe = 6
  let rest = 60

  const compounds = ['squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v', 'lunge']

  if (compounds.includes(pattern)) {
    sets = experienceLevel === 'novice' ? Math.min(2, sets) : Math.max(2, sets)
    if (bias === 'strength' && experienceLevel !== 'novice' && experienceLevel !== 'beginner') {
      reps = 6
      rpe = 7
      rest = 120
      sets = Math.min(4, Math.max(3, sets))
    } else if (bias === 'fat_loss' || bias === 'endurance') {
      reps = 12
      rpe = 6
      rest = 45
    } else if (bias === 'hypertrophy' || bias === 'recomp') {
      reps = 10
      rpe = 7
      rest = 75
    } else {
      reps = 10
      rpe = 7
      rest = 75
    }
  } else if (pattern === 'core') {
    sets = 2
    reps = 12
    rpe = 6
    rest = 45
  } else if (pattern === 'loco') {
    return {
      amountType: 'duration',
      amount: experienceLevel === 'novice' ? 60 : 90,
      durationUnit: 'sn',
      sets: 1,
      rpe: 5,
      restSec: 0,
      note: '1 set · RPE5',
    }
  } else if (pattern === 'mobility') {
    return {
      amountType: 'duration',
      amount: 45,
      durationUnit: 'sn',
      sets: 1,
      rpe: 3,
      restSec: 0,
      note: '1 set',
    }
  } else {
    sets = 2
    reps = 12
    rpe = 6
    rest = 45
  }

  if (riskLevel === 'high' || riskLevel === 'referral' || bias === 'mobility') {
    sets = Math.min(sets, 2)
    rpe = Math.min(rpe, 6)
    reps = Math.min(reps, 10)
    rest = Math.max(rest, 60)
  }
  if (experienceLevel === 'novice') {
    rpe = Math.min(rpe, 6)
    sets = Math.min(sets, 2)
  }
  if (volumePlan?.deload) {
    sets = Math.max(2, sets - 1)
    rpe = Math.min(rpe, 6)
    reps = Math.max(8, reps - 2)
  }

  // Failure / drop / cluster — MVP kapalı (note’a yazılmaz)
  return {
    amountType: 'reps',
    amount: reps,
    durationUnit: 'sn',
    sets,
    rpe,
    restSec: rest,
    note: `${sets} set · RPE${rpe} · ${rest}sn dinlenme`,
  }
}
