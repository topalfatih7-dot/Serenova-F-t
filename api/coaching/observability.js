/**
 * Observability + coachingState (members.data) — yeni form yok.
 */

/** Structured log (Vercel / Node). */
export function logCoachingDecision(memberId, coached, extra = {}) {
  const payload = {
    tag: 'coaching-engine',
    memberId: memberId || null,
    split: coached?.split?.splitType || null,
    days: coached?.split?.daysPerWeek || null,
    risk: coached?.risk?.level || null,
    goal: coached?.goals?.primary || null,
    pool: coached?.poolSize ?? null,
    adaptation: coached?.adaptation?.mode || null,
    adherence: coached?.adherence?.rate ?? null,
    volumeScale: coached?.volume?.volumeScale ?? null,
    deload: coached?.volume?.deload ?? false,
    exercises: (coached?.primaryExercises || []).map((e) => e.exerciseId),
    explain: (coached?.explain || []).slice(0, 24),
    ...extra,
  }
  try {
    console.info('[coaching-engine]', JSON.stringify(payload))
  } catch {
    console.info('[coaching-engine]', payload.memberId, payload.split, payload.risk)
  }
  return payload
}

/**
 * members.data.coachingState güncelle (mesocycle, explain snapshot).
 */
export function buildCoachingStatePatch(existingData = {}, coached, source = 'ai') {
  const prev = existingData.coachingState && typeof existingData.coachingState === 'object'
    ? existingData.coachingState
    : {}
  const prevWeek = Number(prev.mesocycleWeek) || 0
  const mesocycleWeek = prevWeek >= 12 ? 1 : prevWeek + 1

  return {
    ...existingData,
    coachingState: {
      updatedAt: new Date().toISOString(),
      source,
      mesocycleWeek,
      deloadCounter: coached?.volume?.deload
        ? (Number(prev.deloadCounter) || 0) + 1
        : (Number(prev.deloadCounter) || 0),
      lastSplitType: coached?.split?.splitType || null,
      lastGoalPrimary: coached?.goals?.primary || null,
      lastRiskLevel: coached?.risk?.level || null,
      lastAdaptationMode: coached?.adaptation?.mode || null,
      lastAdherenceRate: coached?.adherence?.rate ?? null,
      lastExerciseIds: (coached?.primaryExercises || []).map((e) => e.exerciseId),
      lastScores: coached?.profile?.scores || null,
      lastExplain: (coached?.explain || []).slice(0, 30),
      lastPoolSize: coached?.poolSize ?? null,
    },
    coachingProfile: {
      experienceLevel: coached?.profile?.experienceLevel || null,
      scores: coached?.profile?.scores || null,
      location: coached?.profile?.locationProfile || null,
      equipment: coached?.profile?.equipmentProfile || null,
      updatedAt: new Date().toISOString(),
    },
  }
}

export async function persistCoachingState(admin, memberId, memberData, coached, source) {
  if (!admin || !memberId || !coached) return null
  const nextData = buildCoachingStatePatch(memberData || {}, coached, source)
  const { error } = await admin.from('members').update({ data: nextData }).eq('id', memberId)
  if (error) {
    console.warn('[coaching-engine] coachingState persist failed', error.message || error)
    return null
  }
  return nextData.coachingState
}
