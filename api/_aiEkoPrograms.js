/**
 * Eko paket AI program üretimi / yenileme (sunucu).
 */

import {
  BASIC_PROGRAM_SYSTEM,
  buildBasicProgramInstruction,
  BASIC_PROGRAM_CONFIG,
  EKO_PROGRAM_SYSTEM,
  buildEkoProgramInstruction,
  EKO_PROGRAM_CONFIG,
} from './_ai-prompts.js'
import {
  AI_BASIC_SOURCE,
  AI_EKO_SOURCE,
  EKO_DIET_DAYS,
  EKO_WORKOUT_DAYS,
  appendProgramNotifications,
  buildHealthTestSummary,
  loadHealthTestSchemaLabels,
  buildValidatedProgramPayloads,
  clampCycleLength,
  deleteProgramsBySourceAndType,
  deleteProgramsBySources,
  enrichProfileBasics,
  estimateDailyCalories,
  isProgramCycleDue,
  programInsertRow,
  resolveBasicCycleWindow,
  summarizeNutritionProgram,
  toCandidateRows,
  toDateStr,
} from './_aiBasicPrograms.js'
import {
  isPaidMembership,
  memberExpirySyncNeedsPersist,
  syncMemberPackages,
} from './_memberPackages.js'
import {
  callOpenAi,
  parseJsonResponse,
  isOpenAiConfigured,
  getOpenAiProgramModel,
  OpenAiApiError,
} from './_openai.js'

export async function loadExerciseCandidates(admin) {
  let { data, error } = await admin
    .from('exercises')
    .select('id, name, description, body_part, category, difficulty, equipment, target_muscle, locations, video_url, video_pending, requires_machine, metadata')
    .eq('video_pending', false)
    .eq('requires_machine', false)
    .eq('difficulty', 'beginner')
    .neq('metadata->>importStatus', 'deferred')
    .order('name', { ascending: true })
    .limit(50)

  if (error || !data?.length) {
    const fallback = await admin
      .from('exercises')
      .select('id, name, description, body_part, category, difficulty, equipment, target_muscle, locations, video_url, video_pending, requires_machine, metadata')
      .eq('video_pending', false)
      .neq('metadata->>importStatus', 'deferred')
      .order('name', { ascending: true })
      .limit(50)
    data = fallback.data || []
    error = fallback.error
  }

  if (error) throw new Error(error.message || 'Egzersiz kütüphanesi okunamadı')
  if (!data?.length) throw new Error('Hareket kütüphanesi boş')
  return data
}

function rowToProgram(row) {
  return { ...(row.data || {}), id: row.id, memberId: row.member_id, staffId: row.staff_id }
}

function resolveEkoExpiryDate(memberData = {}) {
  if (memberData.premiumExpiresAt) return toDateStr(memberData.premiumExpiresAt)
  const pkgs = Array.isArray(memberData.activePackages) ? memberData.activePackages : []
  const eko = pkgs
    .filter((p) => p?.planId === 'eko' && p.status !== 'expired' && p.status !== 'consumed')
    .map((p) => toDateStr(p.expiresAt))
    .filter(Boolean)
    .sort()
  return eko.length ? eko[eko.length - 1] : null
}

/** Eko paket hâlâ geçerli mi? (tarih-only string: bitiş günü dahil) */
function memberPackageStillActive(memberData, membership, today = new Date()) {
  if (membership !== 'eko') return false
  const expStr = resolveEkoExpiryDate(memberData || {})
  if (!expStr) return false
  const todayStr = toDateStr(today)
  if (!todayStr) return false
  return expStr >= todayStr
}

/**
 * Basic: deneme bitişine kadar diyet + antrenman.
 */
export async function generateBasicPrograms(admin, memberRow) {
  if (!isOpenAiConfigured()) {
    return { ok: false, error: 'AI yapılandırması eksik (OPENAI_API_KEY)', status: 503 }
  }

  const memberData = memberRow.data || {}
  const window = resolveBasicCycleWindow(memberData.freeTrialExpiresAt)
  if (!window) {
    return {
      ok: true,
      synced: false,
      skipped: 'window_closed',
      error: 'Ücretsiz deneme süresi dolmuş; program oluşturulamadı',
    }
  }

  const exercises = await loadExerciseCandidates(admin)
  const candidates = toCandidateRows(exercises)
  const candidateIds = new Set(candidates.map((c) => c.id))
  const exercisesById = Object.fromEntries(exercises.map((ex) => [ex.id, ex]))

  const profile = enrichProfileBasics({
    ...memberData,
    name: memberRow.name,
    gender: memberData.gender,
  })
  const dailyCalories = estimateDailyCalories(profile)
  const schemaLabels = await loadHealthTestSchemaLabels(admin)
  const healthTestSummary = buildHealthTestSummary(memberData.healthTest, 3800, schemaLabels)

  const instruction = buildBasicProgramInstruction({
    profile,
    healthTestSummary,
    dailyCalories,
    candidates,
    cycleLength: window.cycleLength,
  })

  let raw
  try {
    const result = await callOpenAi({
      messages: [
        { role: 'system', content: BASIC_PROGRAM_SYSTEM },
        { role: 'user', content: instruction },
      ],
      model: getOpenAiProgramModel(),
      config: BASIC_PROGRAM_CONFIG,
      endpoint: 'program-basic',
      userId: memberRow.id,
    })
    raw = result.text
  } catch (e) {
    return {
      ok: false,
      error: e?.message || 'OpenAI program çağrısı başarısız',
      status: e instanceof OpenAiApiError ? e.status : (e?.status || 502),
    }
  }
  let aiJson
  try {
    aiJson = parseJsonResponse(raw)
  } catch {
    return { ok: false, error: 'AI program yanıtı ayrıştırılamadı', status: 502 }
  }

  let payloads
  try {
    payloads = buildValidatedProgramPayloads({
      aiJson,
      exercisesById,
      candidateIds,
      memberName: memberRow.name || profile.name || 'Üye',
      cycleStartDate: window.startStr,
      cycleLength: window.cycleLength,
      availability: memberData.availability || {},
      dailyCalories,
      source: AI_BASIC_SOURCE,
      buildNutrition: true,
      buildWorkout: true,
    })
  } catch (e) {
    return { ok: false, error: e.message || 'Program doğrulanamadı', status: 502 }
  }

  await deleteProgramsBySources(admin, memberRow.id, [AI_BASIC_SOURCE])

  const rows = [
    programInsertRow(memberRow.id, payloads.workoutPayload),
    programInsertRow(memberRow.id, payloads.nutritionPayload),
  ]
  const { data: inserted, error: insertErr } = await admin.from('programs').insert(rows).select()
  if (insertErr || !inserted?.length) {
    return { ok: false, error: insertErr?.message || 'Programlar kaydedilemedi', status: 500 }
  }

  const programs = inserted.map(rowToProgram)
  try {
    await appendProgramNotifications(admin, memberRow.id, programs)
  } catch (e) {
    console.warn('[ai-basic] notify', e?.message || e)
  }

  return {
    ok: true,
    synced: true,
    programs,
    cycleStartDate: window.startStr,
    cycleEndDate: payloads.endStr,
    dailyCalories,
  }
}

/**
 * Eko: ilk üretim veya tam yenileme (diyet + antrenman).
 * @param {{ force?: boolean, renewDiet?: boolean, renewWorkout?: boolean }} opts
 */
export async function generateEkoPrograms(admin, memberRow, opts = {}) {
  if (!isOpenAiConfigured()) {
    return { ok: false, error: 'AI yapılandırması eksik (OPENAI_API_KEY)', status: 503 }
  }

  const memberData = memberRow.data || {}
  if (memberRow.membership !== 'eko') {
    return { ok: false, skipped: 'not_eko', error: 'Yalnızca Eko paket', status: 403 }
  }
  if (!memberPackageStillActive(memberData, memberRow.membership)) {
    return { ok: true, synced: false, skipped: 'package_expired', error: 'Eko paket süresi dolmuş' }
  }

  const todayStr = toDateStr(new Date())
  const premiumExpiresAt = resolveEkoExpiryDate(memberData)

  const force = opts.force === true
  let renewDiet = opts.renewDiet !== false
  let renewWorkout = opts.renewWorkout !== false

  const { data: existing } = await admin
    .from('programs')
    .select('id, data')
    .eq('member_id', memberRow.id)

  const ekoPrograms = (existing || [])
    .filter((r) => r.data?.source === AI_EKO_SOURCE)
    .map(rowToProgram)

  const lastDiet = ekoPrograms
    .filter((p) => p.type === 'nutrition')
    .sort((a, b) => String(b.cycleStartDate || '').localeCompare(String(a.cycleStartDate || '')))[0]
  const lastWorkout = ekoPrograms
    .filter((p) => p.type === 'workout')
    .sort((a, b) => String(b.cycleStartDate || '').localeCompare(String(a.cycleStartDate || '')))[0]

  if (!force) {
    if (renewDiet && lastDiet && !isProgramCycleDue(lastDiet)) renewDiet = false
    if (renewWorkout && lastWorkout && !isProgramCycleDue(lastWorkout)) renewWorkout = false
  }

  if (!renewDiet && !renewWorkout) {
    return { ok: true, synced: false, skipped: 'already_exists', error: 'Aktif Eko program dilimleri mevcut' }
  }

  const dietLen = renewDiet
    ? clampCycleLength(EKO_DIET_DAYS, todayStr, premiumExpiresAt)
    : 0
  const workoutLen = renewWorkout
    ? clampCycleLength(EKO_WORKOUT_DAYS, todayStr, premiumExpiresAt)
    : 0

  if (renewDiet && dietLen < 1) renewDiet = false
  if (renewWorkout && workoutLen < 1) renewWorkout = false
  if (!renewDiet && !renewWorkout) {
    return { ok: true, synced: false, skipped: 'package_ending', error: 'Paket bitişine yeterli gün kalmadı' }
  }

  const exercises = await loadExerciseCandidates(admin)
  const candidates = toCandidateRows(exercises)
  const candidateIds = new Set(candidates.map((c) => c.id))
  const exercisesById = Object.fromEntries(exercises.map((ex) => [ex.id, ex]))

  const profile = enrichProfileBasics({
    ...memberData,
    name: memberRow.name,
    gender: memberData.gender,
  })
  const dailyCalories = estimateDailyCalories(profile)
  const schemaLabels = await loadHealthTestSchemaLabels(admin)
  const healthTestSummary = buildHealthTestSummary(memberData.healthTest, 3800, schemaLabels)
  const previousDietSummary = lastDiet ? summarizeNutritionProgram(lastDiet) : ''

  // Tek OpenAI (gpt-4.1) çağrısı — her iki tip isteniyorsa; aksi halde ilgili alanlar
  const needBoth = renewDiet && renewWorkout
  const maxLenForPrompt = Math.max(dietLen || 0, workoutLen || 0) || EKO_WORKOUT_DAYS

  const instruction = buildEkoProgramInstruction({
    profile,
    healthTestSummary,
    dailyCalories,
    candidates,
    dietDays: dietLen || EKO_DIET_DAYS,
    workoutDays: workoutLen || EKO_WORKOUT_DAYS,
    buildNutrition: renewDiet,
    buildWorkout: renewWorkout,
    previousDietSummary: renewDiet ? previousDietSummary : '',
  })

  let raw
  try {
    const result = await callOpenAi({
      messages: [
        { role: 'system', content: EKO_PROGRAM_SYSTEM },
        { role: 'user', content: instruction },
      ],
      model: getOpenAiProgramModel(),
      config: EKO_PROGRAM_CONFIG,
      endpoint: 'program-eko',
      userId: memberRow.id,
    })
    raw = result.text
  } catch (e) {
    return {
      ok: false,
      error: e?.message || 'OpenAI program çağrısı başarısız',
      status: e instanceof OpenAiApiError ? e.status : (e?.status || 502),
    }
  }
  let aiJson
  try {
    aiJson = parseJsonResponse(raw)
  } catch {
    return { ok: false, error: 'AI program yanıtı ayrıştırılamadı', status: 502 }
  }

  const programsOut = []

  if (renewDiet) {
    let dietPayloads
    try {
      dietPayloads = buildValidatedProgramPayloads({
        aiJson,
        exercisesById,
        candidateIds,
        memberName: memberRow.name || profile.name || 'Üye',
        cycleStartDate: todayStr,
        cycleLength: dietLen,
        availability: memberData.availability || {},
        dailyCalories,
        source: AI_EKO_SOURCE,
        buildNutrition: true,
        buildWorkout: false,
        previousDietSummary,
      })
    } catch (e) {
      return { ok: false, error: e.message || 'Diyet doğrulanamadı', status: 502 }
    }
    await deleteProgramsBySourceAndType(admin, memberRow.id, AI_EKO_SOURCE, 'nutrition')
    // İlk Eko üretimde basic de silinsin
    if (force || !lastDiet) {
      await deleteProgramsBySources(admin, memberRow.id, [AI_BASIC_SOURCE])
    }
    const { data: inserted, error } = await admin
      .from('programs')
      .insert([programInsertRow(memberRow.id, dietPayloads.nutritionPayload)])
      .select()
    if (error || !inserted?.length) {
      return { ok: false, error: error?.message || 'Diyet kaydedilemedi', status: 500 }
    }
    programsOut.push(...inserted.map(rowToProgram))
  }

  if (renewWorkout) {
    // Workout için ayrı cycleLength — aiJson aynı
    let workoutPayloads
    try {
      workoutPayloads = buildValidatedProgramPayloads({
        aiJson,
        exercisesById,
        candidateIds,
        memberName: memberRow.name || profile.name || 'Üye',
        cycleStartDate: todayStr,
        cycleLength: workoutLen,
        availability: memberData.availability || {},
        dailyCalories,
        source: AI_EKO_SOURCE,
        buildNutrition: false,
        buildWorkout: true,
      })
    } catch (e) {
      return { ok: false, error: e.message || 'Antrenman doğrulanamadı', status: 502 }
    }
    await deleteProgramsBySourceAndType(admin, memberRow.id, AI_EKO_SOURCE, 'workout')
    if (force || !lastWorkout) {
      await deleteProgramsBySources(admin, memberRow.id, [AI_BASIC_SOURCE])
    }
    const { data: inserted, error } = await admin
      .from('programs')
      .insert([programInsertRow(memberRow.id, workoutPayloads.workoutPayload)])
      .select()
    if (error || !inserted?.length) {
      return { ok: false, error: error?.message || 'Antrenman kaydedilemedi', status: 500 }
    }
    programsOut.push(...inserted.map(rowToProgram))
  }

  try {
    await appendProgramNotifications(admin, memberRow.id, programsOut)
  } catch (e) {
    console.warn('[ai-eko] notify', e?.message || e)
  }

  return {
    ok: true,
    synced: true,
    programs: programsOut,
    renewed: { diet: renewDiet, workout: renewWorkout },
    cycleStartDate: todayStr,
    dailyCalories,
    needBoth,
    maxLenForPrompt,
  }
}

/**
 * İlk Eko üretimi: her iki tipi force et, basic+eko sil.
 */
export async function generateEkoProgramsInitial(admin, memberRow) {
  await deleteProgramsBySources(admin, memberRow.id, [AI_BASIC_SOURCE, AI_EKO_SOURCE])
  return generateEkoPrograms(admin, memberRow, {
    force: true,
    renewDiet: true,
    renewWorkout: true,
  })
}

/**
 * Cron: süresi dolmuş dilimleri yenile.
 */
export async function runEkoRenewBatch(admin, { limit = 8 } = {}) {
  const { data: members, error } = await admin
    .from('members')
    .select('id, name, membership, data')
    .eq('membership', 'eko')
    .limit(80)

  if (error) throw new Error(error.message || 'Üyeler okunamadı')

  const today = new Date()
  const candidates = (members || []).filter((m) => memberPackageStillActive(m.data || {}, m.membership, today))

  let processed = 0
  const results = []

  for (const member of candidates) {
    if (processed >= limit) break

    const { data: progs } = await admin
      .from('programs')
      .select('id, data')
      .eq('member_id', member.id)

    const eko = (progs || []).filter((p) => p.data?.source === AI_EKO_SOURCE).map(rowToProgram)
    const lastDiet = eko.filter((p) => p.type === 'nutrition')
      .sort((a, b) => String(b.cycleStartDate || '').localeCompare(String(a.cycleStartDate || '')))[0]
    const lastWorkout = eko.filter((p) => p.type === 'workout')
      .sort((a, b) => String(b.cycleStartDate || '').localeCompare(String(a.cycleStartDate || '')))[0]

    const renewDiet = !lastDiet || isProgramCycleDue(lastDiet, today)
    const renewWorkout = !lastWorkout || isProgramCycleDue(lastWorkout, today)
    if (!renewDiet && !renewWorkout) continue

    // Sağlık testi yoksa atla
    if (!member.data?.healthTest || typeof member.data.healthTest !== 'object') {
      results.push({ memberId: member.id, skipped: 'no_health_test' })
      continue
    }

    try {
      const r = await generateEkoPrograms(admin, member, {
        force: false,
        renewDiet,
        renewWorkout,
      })
      results.push({ memberId: member.id, ...r })
      if (r.synced) processed += 1
    } catch (e) {
      results.push({ memberId: member.id, ok: false, error: e.message || String(e) })
    }
  }

  return { ok: true, processed, results }
}

function memberFromRowForExpiry(row) {
  const data = row.data || {}
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...rest
  } = data
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    membership: row.membership,
    membershipStatus: row.membership_status,
    assignedCoachId: row.assigned_coach_id ?? null,
    assignedDietitianId: row.assigned_dietitian_id ?? null,
    assignedDoctorId: row.assigned_doctor_id ?? null,
    ...rest,
  }
}

function memberDataPayloadForExpiry(member, data) {
  const {
    id: _id,
    name: _name,
    email: _email,
    membership: _m,
    membershipStatus: _ms,
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...rest
  } = member
  return { ...data, ...rest }
}

/**
 * Süresi dolan ücretli üyeleri free'ye indirger, AI eko programlarını siler.
 * eko-renew cron'undan önce çalıştırılır.
 */
export async function runMembershipExpiryBatch(admin, { limit = 100 } = {}) {
  const { data: members, error } = await admin
    .from('members')
    .select('id, name, email, membership, membership_status, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
    .neq('membership', 'free')
    .limit(500)

  if (error) throw new Error(error.message || 'Üyeler okunamadı')

  let synced = 0
  let cleanedPrograms = 0
  const results = []

  for (const row of members || []) {
    if (synced >= limit) break

    const before = memberFromRowForExpiry(row)
    const after = syncMemberPackages(before)
    if (!memberExpirySyncNeedsPersist(before, after)) continue

    const prevMembership = before.membership
    const newData = memberDataPayloadForExpiry(after, row.data || {})
    const { error: updErr } = await admin
      .from('members')
      .update({
        membership: after.membership,
        membership_status: after.membershipStatus || 'active',
        assigned_coach_id: after.assignedCoachId || null,
        assigned_dietitian_id: after.assignedDietitianId || null,
        assigned_doctor_id: after.assignedDoctorId || null,
        data: newData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (updErr) {
      results.push({ memberId: row.id, ok: false, error: updErr.message })
      continue
    }

    synced += 1
    let deleted = 0
    if (isPaidMembership(prevMembership) && after.membership === 'free') {
      try {
        const del = await deleteProgramsBySources(admin, row.id, [AI_EKO_SOURCE])
        deleted = del.deleted || 0
        cleanedPrograms += deleted
      } catch (e) {
        results.push({
          memberId: row.id,
          ok: true,
          downgraded: true,
          programCleanupError: e.message || String(e),
        })
        continue
      }
    }

    results.push({
      memberId: row.id,
      ok: true,
      from: prevMembership,
      to: after.membership,
      deletedAiEko: deleted,
    })
  }

  // Zaten free'ye düşmüş ama ai_eko kalmış üyeler (hydrate ile düşmüş olabilir)
  const orphan = await cleanupOrphanAiEkoPrograms(admin, { limit: 40 })
  cleanedPrograms += orphan.deleted || 0

  return { ok: true, synced, cleanedPrograms, orphanAiEko: orphan.deleted || 0, results }
}

/** membership !== eko olan üyelerin ai_eko programlarını sil */
async function cleanupOrphanAiEkoPrograms(admin, { limit = 40 } = {}) {
  const { data: programs, error } = await admin
    .from('programs')
    .select('id, member_id, data')
    .limit(400)
  if (error) throw new Error(error.message || 'Programlar okunamadı')

  const ekoRows = (programs || []).filter((p) => p.data?.source === AI_EKO_SOURCE)
  if (!ekoRows.length) return { deleted: 0 }

  const memberIds = [...new Set(ekoRows.map((p) => p.member_id).filter(Boolean))]
  const { data: mems } = await admin.from('members').select('id, membership').in('id', memberIds)
  const notEko = new Set((mems || []).filter((m) => m.membership !== 'eko').map((m) => m.id))
  const ids = ekoRows.filter((p) => notEko.has(p.member_id)).map((p) => p.id).slice(0, limit)
  if (!ids.length) return { deleted: 0 }

  const { error: delErr } = await admin.from('programs').delete().in('id', ids)
  if (delErr) throw new Error(delErr.message || 'Orphan ai_eko silinemedi')
  return { deleted: ids.length }
}
