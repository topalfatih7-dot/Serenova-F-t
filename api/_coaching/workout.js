/**
 * Workout Generator — warmup → main → accessories → cooldown + intensity notes.
 */

import { selectExercisesForPatterns } from './exercises.js'
import { prescribeIntensity } from './intensity.js'

function timeBudgetSlots(sessionMinutes, riskLevel) {
  if (riskLevel === 'referral') {
    return {
      warmup: ['loco', 'mobility'],
      main: ['hinge', 'push_h', 'core'],
      cooldown: ['mobility'],
    }
  }
  if (sessionMinutes <= 25) {
    return {
      warmup: ['mobility'],
      main: null, // use template patterns trimmed
      maxMain: 4,
      cooldown: ['mobility'],
    }
  }
  if (sessionMinutes <= 40) {
    return { warmup: ['loco'], main: null, maxMain: 5, cooldown: ['mobility'] }
  }
  return { warmup: ['loco', 'mobility'], main: null, maxMain: 6, cooldown: ['mobility', 'core'] }
}

/**
 * Tek seans şablonu için egzersiz listesi üret.
 */
export function buildSessionExercises(pool, template, profile, goalPlan, riskReport, opts = {}) {
  const sessionMin = profile?.schedule?.sessionMinutes || 35
  const budget = timeBudgetSlots(sessionMin, riskReport?.level)
  const excludeIds = new Set(opts.excludeIds || [])
  const volumePlan = opts.volumePlan || null

  const warmupPatterns = budget.warmup || []
  let mainPatterns = [...(template.patterns || [])]
  // Deload / kısa seans: ana slot sayısını kırp
  let maxMain = budget.maxMain
  if (volumePlan?.deload && maxMain) maxMain = Math.max(3, maxMain - 1)
  if (maxMain) mainPatterns = mainPatterns.slice(0, maxMain)

  // Preferred patterns from risk → prepend soft if missing
  for (const p of riskReport?.preferredPatterns || []) {
    if (['mobility', 'core', 'hinge'].includes(p) && !mainPatterns.includes(p)) {
      // skip — already in warmup/cooldown
    }
  }

  const wu = selectExercisesForPatterns(pool, warmupPatterns, profile, goalPlan, { excludeIds: [...excludeIds] })
  wu.selected.forEach((s) => excludeIds.add(s.meta.id))

  const main = selectExercisesForPatterns(pool, mainPatterns, profile, goalPlan, { excludeIds: [...excludeIds] })
  main.selected.forEach((s) => excludeIds.add(s.meta.id))

  const cdPatterns = (budget.cooldown || []).filter((p) => {
    // avoid duplicate pattern if already in main as last
    return true
  })
  const cd = selectExercisesForPatterns(pool, cdPatterns, profile, goalPlan, { excludeIds: [...excludeIds] })
  cd.selected.forEach((s) => excludeIds.add(s.meta.id))

  const ordered = [
    ...wu.selected.map((s) => ({ ...s, block: 'warmup' })),
    ...main.selected.map((s) => ({ ...s, block: 'main' })),
    ...cd.selected.map((s) => ({ ...s, block: 'cooldown' })),
  ]

  // Deduplicate by id keeping first
  const seen = new Set()
  const unique = ordered.filter((s) => {
    if (seen.has(s.meta.id)) return false
    seen.add(s.meta.id)
    return true
  })

  if (unique.length < 4) {
    const fill = selectExercisesForPatterns(
      pool,
      ['pull_h', 'push_h', 'hinge', 'core', 'mobility'],
      profile,
      goalPlan,
      { excludeIds: [...seen] },
    )
    for (const s of fill.selected) {
      if (unique.length >= 6) break
      if (seen.has(s.meta.id)) continue
      seen.add(s.meta.id)
      unique.push({ ...s, block: 'main' })
    }
  }

  // Push/pull dengesi: push var pull yoksa pull ekle (profesyonel seans kuralı)
  const patternsPresent = new Set(unique.map((s) => s.pattern))
  const hasPush = patternsPresent.has('push_h') || patternsPresent.has('push_v')
  const hasPull = patternsPresent.has('pull_h') || patternsPresent.has('pull_v')
  if (hasPush && !hasPull && riskReport?.level !== 'referral') {
    const pullFill = selectExercisesForPatterns(
      pool,
      ['pull_h', 'pull_v'],
      profile,
      goalPlan,
      { excludeIds: [...seen] },
    )
    if (pullFill.selected[0]) {
      const s = pullFill.selected[0]
      seen.add(s.meta.id)
      // ana bloğun ortasına ekle (warmup sonrası)
      const insertAt = unique.findIndex((u) => u.block === 'main') + 1
      unique.splice(insertAt > 0 ? insertAt : unique.length, 0, { ...s, block: 'main' })
    }
  }

  const exp = profile?.experienceLevel || 'beginner'
  const riskLevel = riskReport?.level || 'low'

  const exercises = unique.slice(0, 10).map((s) => {
    const rx = prescribeIntensity(s.pattern, goalPlan, exp, riskLevel, volumePlan)
    const formHint = formCueFor(s.pattern, s.block, riskReport)
    const note = [rx.note, formHint].filter(Boolean).join(' · ').slice(0, 120)
    return {
      exerciseId: s.meta.id,
      amountType: rx.amountType,
      amount: rx.amount,
      durationUnit: rx.durationUnit,
      note,
      block: s.block,
      pattern: s.pattern,
      exerciseName: s.meta.name,
    }
  })

  return {
    exercises,
    explain: [
      ...wu.explain,
      ...main.explain,
      ...cd.explain,
      hasPush && !hasPull ? 'push/pull denge: pull eklendi' : null,
    ].filter(Boolean),
    usedIds: seen,
  }
}

function formCueFor(pattern, block, riskReport) {
  if (block === 'warmup') return 'ısınma · kontrollü tempo'
  if (block === 'cooldown') return 'soğuma · nefes'
  if (pattern === 'mobility') return 'kontrollü ROM · nefes'
  if (pattern === 'loco') return 'rahat tempo · burun nefesi'
  const knee = riskReport?.jointRestrictions?.knee
  const back = riskReport?.jointRestrictions?.low_back
  const shoulder = riskReport?.jointRestrictions?.shoulder
  if (pattern === 'squat' || pattern === 'lunge') {
    return knee ? 'diz hizası · ağrısız ROM' : 'göğüs dik · topuklar yerde'
  }
  if (pattern === 'hinge') {
    return back ? 'nötr bel · hafif ROM' : 'kalça geri · nötr bel'
  }
  if (pattern === 'push_h' || pattern === 'push_v') {
    return shoulder ? 'kürekleri sık · ağrısız açı' : 'core sıkı · kontrollü tempo'
  }
  if (pattern === 'pull_h' || pattern === 'pull_v') {
    return 'kürekleri sık · omuz sarkmasın'
  }
  if (pattern === 'core') return 'nefes vermede sık'
  return 'kontrollü tempo'
}

export function resolveSessionStart(availability = {}, weekdays = []) {
  for (const wd of weekdays) {
    const hours = availability[wd] || availability[String(wd)]
    if (Array.isArray(hours) && hours.length) {
      const h = String(hours[0])
      if (/^\d{2}:\d{2}/.test(h)) return h.slice(0, 5)
    }
  }
  return '09:00'
}
