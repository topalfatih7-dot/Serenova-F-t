/**
 * AI Coaching Engine — orkestrasyon (deterministik workout).
 * Veri: HT + availability + completedActivities + exercises + önceki programs + coachingState.
 */

import { buildAthleteProfile, fitnessLevelFromExperience, resolveTrainingLocation } from './profile.js'
import { analyzeRisk } from './risk.js'
import { classifyGoals } from './goals.js'
import { planSplit } from './split.js'
import { planVolume } from './volume.js'
import { buildEligiblePool, difficultiesForExperience, needsMachineExclusion } from './exercises.js'
import { buildSessionExercises, resolveSessionStart } from './workout.js'
import {
  applyProgressionToExercises,
  previousIdsToExclude,
  summarizeWorkoutProgram,
} from './progression.js'
import {
  analyzeAdherence,
  decideAdaptation,
  applyAdaptationToExercises,
  clampSplitDays,
} from './adaptation.js'
import { buildNutritionConstraints } from './nutritionConstraints.js'
import { evaluateNutritionSafety } from './safetyGate.js'

/**
 * @param {object} memberData
 * @param {object[]} exerciseRows
 * @param {{ previousWorkout?: object|null, completedActivities?: object, dailyCalories?: object }} [options]
 */
export function runCoachingEngine(memberData, exerciseRows, options = {}) {
  const profile = buildAthleteProfile(memberData || {})
  const risk = analyzeRisk(profile)
  const goals = classifyGoals(profile)

  const completedActivities = options.completedActivities
    ?? memberData?.completedActivities
    ?? {}
  const previousWorkout = options.previousWorkout || null
  const mesocycleWeek = Number(memberData?.coachingState?.mesocycleWeek) || 0

  const adherence = analyzeAdherence({
    previousWorkout,
    completedActivities,
    lookbackDays: 14,
  })
  const adaptation = decideAdaptation(adherence, {
    risk: profile.scores.risk,
    recovery: profile.scores.recovery,
    daysHint: profile.schedule.workoutWeekdays?.length || 3,
  })

  let split = planSplit(profile, goals, risk)
  split = clampSplitDays(split, adaptation)

  const volume = planVolume(profile, goals, risk, {
    mesocycleWeek: mesocycleWeek + 1,
    adaptationMode: adaptation.mode,
  })

  const pool = buildEligiblePool(exerciseRows || [], profile, risk)

  const previousSummary = previousWorkout
    ? summarizeWorkoutProgram(previousWorkout)
    : null
  const excludeFromPrevious = previousSummary
    ? previousIdsToExclude(previousSummary)
    : []

  const explain = [
    ...profile.explain,
    ...goals.explain,
    ...split.explain,
    ...volume.explain,
    ...adaptation.explain,
    `risk=${risk.level}`,
    `pool=${pool.length}`,
    ...(risk.warnings || []),
    previousSummary ? `önceki program: ${previousSummary.exerciseIds.length} hareket` : null,
  ].filter(Boolean)

  if (pool.length < 4) {
    throw new Error(`Uygun hareket havuzu yetersiz (${pool.length}). Kütüphane veya kısıtları kontrol edin.`)
  }

  const excludeExtra = (adaptation.mode === 'ease' || adaptation.mode === 'restart_easy')
    ? []
    : excludeFromPrevious

  const usedAcross = new Set(excludeExtra)
  const templates = []
  for (const tpl of split.sessionTemplates) {
    const built = buildSessionExercises(pool, tpl, profile, goals, risk, {
      excludeIds: [
        ...(split.sessionTemplates.length > 1 ? [...usedAcross] : excludeExtra),
      ],
      volumePlan: volume,
    })
    let exercises = built.exercises

    if (adaptation.mode !== 'ease' && adaptation.mode !== 'restart_easy' && !volume.deload) {
      const prog = applyProgressionToExercises(exercises, previousSummary, {
        riskLevel: risk.level,
      })
      exercises = prog.exercises
      explain.push(...prog.explain)
    } else if (volume.deload) {
      explain.push('progresyon: deload — bump yok')
    } else {
      explain.push('progresyon: ease/restart — bump yok')
    }

    const adapted = applyAdaptationToExercises(exercises, adaptation)
    exercises = adapted.exercises
    explain.push(...adapted.explain.filter((x) => !explain.includes(x)))

    built.usedIds.forEach((id) => usedAcross.add(id))
    templates.push({
      id: tpl.id,
      focus: tpl.focus,
      exercises,
      explain: built.explain,
    })
    explain.push(`template ${tpl.id}: ${exercises.length} hareket`)
  }

  if (previousSummary && templates[0] && adaptation.mode !== 'restart_easy' && !volume.deload) {
    const ids = new Set(templates[0].exercises.map((e) => e.exerciseId))
    const overlap = [...ids].filter((id) => previousSummary.exerciseIds.includes(id)).length
    const ratio = ids.size ? overlap / ids.size : 0
    if (ratio > 0.7 && pool.length >= 8) {
      const harderExclude = [
        ...excludeFromPrevious,
        ...previousSummary.exerciseIds.slice(0, 6),
      ]
      const rebuilt = buildSessionExercises(
        pool,
        split.sessionTemplates[0],
        profile,
        goals,
        risk,
        { excludeIds: harderExclude, volumePlan: volume },
      )
      if (rebuilt.exercises.length >= 4) {
        let exercises = rebuilt.exercises
        if (adaptation.mode !== 'ease') {
          const prog = applyProgressionToExercises(exercises, previousSummary, {
            riskLevel: risk.level,
          })
          exercises = prog.exercises
        }
        const adapted = applyAdaptationToExercises(exercises, adaptation)
        templates[0] = {
          ...templates[0],
          exercises: adapted.exercises,
          explain: [...rebuilt.explain, 'çeşitlilik: yeniden seçildi'],
        }
        explain.push('çeşitlilik: overlap>70% → yeniden seçim')
      }
    }
  }

  const primary = templates[0]
  if (!primary?.exercises?.length) {
    throw new Error('Seans üretilemedi')
  }

  let sessionDuration = Math.min(90, Math.max(20, profile.schedule.sessionMinutes || 35))
  if (adaptation.mode === 'ease' || adaptation.mode === 'restart_easy' || volume.deload) {
    sessionDuration = Math.max(20, sessionDuration - 5)
  }
  const sessionStart = resolveSessionStart(
    profile.schedule.availability,
    profile.schedule.workoutWeekdays,
  )

  const safety = risk.nutritionSafety || evaluateNutritionSafety({
    bmi: profile.bmi,
    goals: profile.goals,
    constraints: profile.constraints,
  }, profile.rawHealthTest || {})

  const nutritionConstraints = buildNutritionConstraints(
    profile,
    goals,
    options.dailyCalories || null,
    { sessionStart, safety },
  )
  explain.push(...nutritionConstraints.explain)

  const mesoWeek = (Number(memberData?.coachingState?.mesocycleWeek) || 0) + 1
  explain.push(
    `mesocycle hafta ${mesoWeek}${volume.deload ? ' (deload)' : ''}`,
    `hacim hedefi ~${volume.weeklySetsPerMuscle?.target || '—'} set/kas/hafta (${profile.experienceLevel})`,
  )
  if (risk.level === 'referral' || risk.level === 'high') {
    explain.push('yoğunluk: failure yasak; RIR 2–4 tercih')
  }

  return {
    profile,
    risk,
    goals,
    split,
    volume,
    adaptation,
    adherence,
    nutritionConstraints,
    safety,
    poolSize: pool.length,
    sessionDuration,
    sessionStart,
    templates,
    primaryExercises: primary.exercises,
    fitnessLevel: fitnessLevelFromExperience(profile.experienceLevel),
    explain,
    referralSuggested: risk.referralSuggested,
    descriptionHints: buildDescriptionHints(
      profile, goals, risk, split, previousSummary, adaptation, volume, mesoWeek,
    ),
    previousWorkoutSummary: previousSummary,
  }
}

function buildDescriptionHints(profile, goals, risk, split, previousSummary, adaptation, volume, mesoWeek = 1) {
  const goalLabels = {
    fat_loss: 'yağ kaybı / kilo yönetimi',
    hypertrophy: 'kas gelişimi',
    strength: 'kuvvet',
    muscular_endurance: 'kas dayanıklılığı',
    general_fitness: 'genel fitness',
    athletic: 'atletik performans',
    posture_mobility: 'postür ve mobilite',
    rehab_support: 'güvenli hareket ve toparlanma desteği',
    lifestyle: 'sürdürülebilir alışkanlık',
    health: 'genel sağlık',
  }
  const parts = [
    `Bu program ${goalLabels[goals.primary] || goals.primary} odaklı hazırlandı.`,
    `${split.daysPerWeek} gün / ${split.splitType.replace(/_/g, ' ')} yapısı; seans ~${profile.schedule.sessionMinutes} dk.`,
    `Seviye: ${profile.experienceLevel}; mezosikl hafta ${mesoWeek}/4; hedef hacim ~${volume?.weeklySetsPerMuscle?.target || '—'} set/kas/hafta.`,
    'Çalışma setlerinde RIR 1–3 (yeni başlayanlarda 2–4); failure yok.',
  ]
  if (volume?.deload) parts.push('Bu dilim deload / düşük hacim haftası olarak ayarlandı.')
  if (profile.locationProfile === 'home') parts.push('Ev / mevcut ekipmana göre seçildi.')
  else if (profile.locationProfile === 'office') parts.push('Ofis ortamına uygun hareketler seçildi.')
  else if (profile.locationProfile === 'gym') parts.push('Salon ekipmanı dikkate alındı.')
  if (adaptation?.mode === 'ease' || adaptation?.mode === 'restart_easy') {
    parts.push('Son dönem tamamlanma oranına göre bu dilim daha sürdürülebilir ve hafif tutuldu.')
  } else if (adaptation?.mode === 'push') {
    parts.push('Yüksek uyumunuza göre hacim dikkatli şekilde ilerletildi.')
  }
  if (risk.level === 'referral' || risk.level === 'high') {
    parts.push('Risk profili nedeniyle yoğunluk düşük tutuldu; failure ve plyometrik yok.')
  }
  if (risk.warnings?.length) parts.push(risk.warnings[0])
  if (risk.redFlags?.length) parts.push(risk.redFlags[0].messageTR)
  if (previousSummary && adaptation?.mode !== 'restart_easy' && !volume?.deload) {
    parts.push('Önceki antrenman dilimine göre çeşitlilik uygulandı.')
  }
  if (profile.bmi != null) parts.push(`BMI ~${profile.bmi} (${profile.bmiCategory || '—'}).`)
  return parts.join(' ')
}

export function coachingQueryHints(profile) {
  const location = profile?.locationProfile || 'mixed'
  return {
    difficulties: difficultiesForExperience(profile?.experienceLevel || 'beginner'),
    excludeMachines: needsMachineExclusion(profile),
    location: location === 'home' || location === 'gym' || location === 'office' ? location : null,
  }
}

export {
  buildAthleteProfile,
  resolveTrainingLocation,
  analyzeRisk,
  classifyGoals,
  planSplit,
  planVolume,
  buildEligiblePool,
  summarizeWorkoutProgram,
  analyzeAdherence,
  decideAdaptation,
  buildNutritionConstraints,
  evaluateNutritionSafety,
}
