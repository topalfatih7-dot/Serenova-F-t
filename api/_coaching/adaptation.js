/**
 * Adaptation Engine — members.data.completedActivities + önceki workout programı.
 * Yeni form / sinyal alanı yok.
 *
 * completedActivities şekli: { "YYYY-MM-DD": ["YYYY-MM-DD_entryId", "YYYY-MM-DD_meal_breakfast", ...] }
 */

const NOTE_SETS_RE = /(\d+)\s*set/i
const NOTE_RPE_RE = /RPE\s*(\d+(?:\.\d+)?)/i

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDays(date, days) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

/** Bir günde antrenman entry’lerinin tamamı işaretli mi? */
function workoutDayCompleted(dateStr, entryIds, completedActivities) {
  if (!entryIds.length) return false
  const keys = completedActivities?.[dateStr] || []
  if (!keys.length) return false
  // En az %60 hareket tamamlandıysa gün "yapıldı" sayılır (kısmi uyum)
  const done = entryIds.filter((id) => keys.includes(`${dateStr}_${id}`)).length
  return done / entryIds.length >= 0.6
}

/**
 * Önceki workout programındaki planlı antrenman günlerini çıkar.
 */
export function listPlannedWorkoutDays(previousWorkout) {
  if (!previousWorkout?.entries?.length) return []

  const byDate = new Map()
  for (const e of previousWorkout.entries) {
    if (!e?.exerciseId || e.mealType) continue
    if (e.date) {
      if (!byDate.has(e.date)) byDate.set(e.date, [])
      byDate.get(e.date).push(e.id)
      continue
    }
  }

  // Tarihsiz (cycleSameDaily şablon): uydurma gün üretme — adherence “yetersiz geçmiş”
  // kalır. AI programları genelde date-expand ile gelir; completion key entry.id+date ister.

  return [...byDate.entries()]
    .map(([date, entryIds]) => ({ date, entryIds: [...new Set(entryIds)] }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Son N gündeki adherence analizi.
 */
export function analyzeAdherence({
  previousWorkout = null,
  completedActivities = {},
  lookbackDays = 14,
  today = new Date(),
} = {}) {
  const planned = listPlannedWorkoutDays(previousWorkout)
  const todayStr = toDateStr(today)
  const windowStart = toDateStr(addDays(today, -(lookbackDays - 1)))

  const inWindow = planned.filter((p) => p.date >= windowStart && p.date <= todayStr)
  // Gelecek günleri sayma
  const due = inWindow.filter((p) => p.date <= todayStr)

  let completed = 0
  let missed = 0
  let streakMiss = 0 // sondan geriye ardışık kaç planlı gün kaçırıldı
  const dueDesc = [...due].sort((a, b) => b.date.localeCompare(a.date))

  for (const day of due) {
    if (workoutDayCompleted(day.date, day.entryIds, completedActivities)) completed += 1
    else missed += 1
  }

  for (const day of dueDesc) {
    if (workoutDayCompleted(day.date, day.entryIds, completedActivities)) break
    streakMiss += 1
  }

  const plannedCount = due.length
  const rate = plannedCount > 0 ? completed / plannedCount : null

  // Tam bir hafta hiç yoksa (hiç planlı gün tamamlanmamış ve ≥3 planlı)
  const missedFullWeek = plannedCount >= 3 && completed === 0

  return {
    lookbackDays,
    plannedCount,
    completed,
    missed,
    rate,
    streakMiss,
    missedFullWeek,
    windowStart,
    windowEnd: todayStr,
  }
}

/**
 * Adherence → adaptation kararı.
 * @returns {{ mode, volumeScale, sessionTrim, intensityDelta, maxDays, explain[] }}
 */
export function decideAdaptation(adherence, profileScores = {}) {
  const explain = []
  const risk = profileScores.risk ?? 0
  const recovery = profileScores.recovery ?? 50

  let mode = 'maintain'
  let volumeScale = 1
  let sessionTrim = 0
  let intensityDelta = 0 // RPE / sets yönü
  let maxDays = null

  if (!adherence || adherence.rate == null || adherence.plannedCount < 2) {
    explain.push('adaptasyon: yeterli geçmiş yok → maintain')
    return { mode, volumeScale, sessionTrim, intensityDelta, maxDays, explain, adherence }
  }

  const { rate, streakMiss, missedFullWeek, plannedCount } = adherence

  if (missedFullWeek || streakMiss >= 3) {
    mode = 'restart_easy'
    volumeScale = 0.7
    sessionTrim = 1
    intensityDelta = -1
    maxDays = Math.min(3, profileScores.daysHint || 3)
    explain.push('adaptasyon: kaçırılan seri / boş hafta → restart_easy')
  } else if (rate < 0.4 || streakMiss >= 2) {
    mode = 'ease'
    volumeScale = 0.8
    sessionTrim = 1
    intensityDelta = -1
    explain.push(`adaptasyon: düşük uyum (${Math.round(rate * 100)}%) → ease`)
  } else if (rate >= 0.85 && plannedCount >= 3 && risk < 70 && recovery >= 45) {
    mode = 'push'
    volumeScale = 1.05
    intensityDelta = 0 // amount bump progression’da
    explain.push(`adaptasyon: yüksek uyum (${Math.round(rate * 100)}%) → push`)
  } else if (rate >= 0.5 && rate < 0.7) {
    mode = 'maintain'
    volumeScale = 0.95
    explain.push(`adaptasyon: orta uyum (${Math.round(rate * 100)}%) → hafif stabilize`)
  } else {
    explain.push(`adaptasyon: uyum ${Math.round(rate * 100)}% → maintain`)
  }

  // Düşük recovery ile push’u iptal
  if (mode === 'push' && recovery < 40) {
    mode = 'maintain'
    volumeScale = 1
    explain.push('adaptasyon: recovery düşük → push iptal')
  }

  return { mode, volumeScale, sessionTrim, intensityDelta, maxDays, explain, adherence }
}

function scaleSetsInNote(note, scale, intensityDelta) {
  let out = String(note || '')
  const setsM = out.match(NOTE_SETS_RE)
  if (setsM) {
    let sets = Number(setsM[1])
    if (scale < 1) sets = Math.max(2, Math.round(sets * scale))
    if (scale > 1) sets = Math.min(4, sets + (sets < 3 ? 1 : 0))
    out = out.replace(NOTE_SETS_RE, `${sets} set`)
  }
  const rpeM = out.match(NOTE_RPE_RE)
  if (rpeM && intensityDelta) {
    const rpe = Math.min(8, Math.max(5, Number(rpeM[1]) + intensityDelta))
    out = out.replace(NOTE_RPE_RE, `RPE${rpe}`)
  }
  return out.slice(0, 120)
}

/**
 * Üretilmiş egzersiz listesine adaptation uygula.
 */
export function applyAdaptationToExercises(exercises, adaptation) {
  if (!adaptation || adaptation.mode === 'maintain' && adaptation.volumeScale === 1 && !adaptation.sessionTrim) {
    return { exercises, explain: adaptation?.explain || [] }
  }

  let list = [...(exercises || [])]
  const explain = [...(adaptation.explain || [])]

  // sessionTrim: accessory/cooldown’dan kırp (warmup koru)
  if (adaptation.sessionTrim > 0 && list.length > 5) {
    const mains = list.filter((e) => e.block === 'main')
    const others = list.filter((e) => e.block !== 'main')
    if (mains.length > 3) {
      const drop = Math.min(adaptation.sessionTrim, mains.length - 3)
      // sondaki main’leri düş (accessory gibi)
      const keptMains = mains.slice(0, mains.length - drop)
      list = [
        ...others.filter((e) => e.block === 'warmup'),
        ...keptMains,
        ...others.filter((e) => e.block === 'cooldown'),
      ]
      explain.push(`adaptasyon: ${drop} hareket kısaltıldı`)
    }
  }

  list = list.map((ex) => {
    if (ex.block === 'warmup' || ex.block === 'cooldown') return ex
    let amount = Number(ex.amount) || 10
    if (adaptation.volumeScale < 1 && ex.amountType !== 'duration') {
      amount = Math.max(6, Math.round(amount * adaptation.volumeScale))
    }
    if (adaptation.volumeScale < 1 && ex.amountType === 'duration') {
      amount = Math.max(30, Math.round(amount * adaptation.volumeScale))
    }
    const note = scaleSetsInNote(ex.note, adaptation.volumeScale, adaptation.intensityDelta)
    return { ...ex, amount, note }
  })

  if (adaptation.mode === 'restart_easy' || adaptation.mode === 'ease') {
    // note’a kısa uyum ipucu
    list = list.map((ex) => {
      if (ex.block !== 'main') return ex
      if (String(ex.note || '').includes('kolay hafta')) return ex
      return {
        ...ex,
        note: `${ex.note || ''} · kolay hafta`.trim().slice(0, 120),
      }
    })
  }

  return { exercises: list, explain }
}

/**
 * Split gün sayısını adaptation.maxDays ile sınırla (profile’ı bozmadan).
 */
export function clampSplitDays(split, adaptation) {
  if (!adaptation?.maxDays || !split?.sessionTemplates) return split
  const days = Math.min(split.daysPerWeek, adaptation.maxDays)
  if (days >= split.daysPerWeek) return split
  return {
    ...split,
    daysPerWeek: days,
    sessionTemplates: split.sessionTemplates.slice(0, days),
    mapping: (split.mapping || []).slice(0, days),
    explain: [...(split.explain || []), `adaptasyon: gün ${days}’e düşürüldü`],
  }
}
