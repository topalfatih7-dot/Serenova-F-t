/**
 * Progressive overload / çeşitlilik — önceki programs.data.entries üzerinden.
 * Yeni üye alanı yok; mevcut Eko/Basic workout programından okur.
 */

const NOTE_SETS_RE = /(\d+)\s*set/i
const NOTE_RPE_RE = /RPE\s*(\d+(?:\.\d+)?)/i

/**
 * Önceki antrenman programından özet (unique exerciseId + amount/note).
 */
export function summarizeWorkoutProgram(prog) {
  if (!prog?.entries?.length) return null
  const byId = new Map()
  for (const e of prog.entries) {
    if (!e?.exerciseId || e.mealType) continue
    if (byId.has(e.exerciseId)) continue
    byId.set(e.exerciseId, {
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName || '',
      amountType: e.amountType || 'reps',
      amount: Number(e.amount) || 10,
      note: e.note || '',
      block: e.block || '',
    })
  }
  const exercises = [...byId.values()]
  if (!exercises.length) return null
  return {
    exerciseIds: exercises.map((e) => e.exerciseId),
    exercises,
    title: prog.title || '',
    splitType: prog.coaching?.splitType || null,
    text: exercises
      .map((e) => `${e.exerciseName || e.exerciseId}: ${e.amountType}/${e.amount} ${e.note || ''}`.trim())
      .join(' | ')
      .slice(0, 1200),
  }
}

function bumpAmount(ex, mode = 'reps') {
  if (ex.amountType === 'duration') {
    return {
      ...ex,
      amount: Math.min(180, (Number(ex.amount) || 45) + 15),
    }
  }
  const next = Math.min(20, (Number(ex.amount) || 10) + (mode === 'strong' ? 2 : 1))
  return { ...ex, amount: next }
}

function bumpNote(note = '', { setsDelta = 0, rpeDelta = 0 } = {}) {
  let out = String(note || '')
  const setsM = out.match(NOTE_SETS_RE)
  if (setsM && setsDelta) {
    const sets = Math.min(5, Math.max(2, Number(setsM[1]) + setsDelta))
    out = out.replace(NOTE_SETS_RE, `${sets} set`)
  }
  const rpeM = out.match(NOTE_RPE_RE)
  if (rpeM && rpeDelta) {
    const rpe = Math.min(8, Math.max(5, Number(rpeM[1]) + rpeDelta))
    out = out.replace(NOTE_RPE_RE, `RPE${rpe}`)
  }
  if (!out.includes('progresyon') && (setsDelta || rpeDelta)) {
    out = `${out} · hafif progresyon`.slice(0, 120)
  }
  return out
}

/**
 * Yeni seans egzersizlerine önceki programa göre progresyon / çeşitlilik uygula.
 * - Aynı id kalırsa amount/note bump
 * - Önceki set ile overlap yüksekse excludeIds ile yeniden seçim çağıran tarafa sinyal
 */
export function applyProgressionToExercises(exercises, previousSummary, opts = {}) {
  if (!previousSummary?.exercises?.length || !exercises?.length) {
    return { exercises, explain: ['progresyon: yok (ilk program)'], overlapRatio: 0 }
  }

  const prevById = new Map(previousSummary.exercises.map((e) => [e.exerciseId, e]))
  const prevIds = new Set(previousSummary.exerciseIds || [])
  const newIds = exercises.map((e) => e.exerciseId)
  const overlap = newIds.filter((id) => prevIds.has(id)).length
  const overlapRatio = newIds.length ? overlap / newIds.length : 0

  const riskLevel = opts.riskLevel || 'low'
  const allowBump = riskLevel !== 'referral' && riskLevel !== 'high'

  const next = exercises.map((ex) => {
    const prev = prevById.get(ex.exerciseId)
    if (!prev || !allowBump) return ex
    if (ex.block === 'warmup' || ex.block === 'cooldown') return ex

    let updated = bumpAmount(ex, 'reps')
    // önceki nottaki set bilgisini koruyup +0 (veya ara sıra +1)
    const prevSets = Number(String(prev.note || '').match(NOTE_SETS_RE)?.[1] || 0)
    const setsDelta = prevSets >= 2 && prevSets < 4 && overlapRatio > 0.5 ? 1 : 0
    updated = {
      ...updated,
      note: bumpNote(updated.note || prev.note, { setsDelta, rpeDelta: 0 }),
    }
    return updated
  })

  const explain = [
    `progresyon: overlap=${Math.round(overlapRatio * 100)}%`,
    allowBump ? 'working set amount +1' : 'yüksek risk — bump yok',
  ]

  return { exercises: next, explain, overlapRatio }
}

/**
 * Çeşitlilik için önceki ana hareket id’lerini exclude listesine ekle
 * (overlap çok yüksek olacaksa).
 */
export function previousIdsToExclude(previousSummary, minExclude = 2) {
  if (!previousSummary?.exercises?.length) return []
  const mains = previousSummary.exercises.filter(
    (e) => e.block === 'main' || (!e.block && e.amountType !== 'duration'),
  )
  const ids = (mains.length ? mains : previousSummary.exercises)
    .map((e) => e.exerciseId)
    .filter(Boolean)
  return ids.slice(0, Math.max(minExclude, Math.ceil(ids.length * 0.4)))
}
