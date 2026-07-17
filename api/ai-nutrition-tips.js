/**
 * Üye AI uçları (Vercel Hobby 12-fn limiti — tek route):
 * - POST task=nutrition-tips (default) → beslenme ipuçları
 * - POST task=basic-programs → Basic paket AI diyet + antrenman
 */

export const config = {
  maxDuration: 60,
}

import {
  NUTRITION_SYSTEM,
  buildNutritionInstruction,
  NUTRITION_CONFIG,
  BASIC_PROGRAM_SYSTEM,
  buildBasicProgramInstruction,
  BASIC_PROGRAM_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import {
  AI_BASIC_SOURCE,
  appendProgramNotifications,
  buildHealthTestSummary,
  buildValidatedProgramPayloads,
  enrichProfileBasics,
  estimateDailyCalories,
  isBasicProgramWindowOpen,
  programInsertRow,
  toCandidateRows,
  toDateStr,
} from './_aiBasicPrograms.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

function filterTips(tips) {
  return (Array.isArray(tips) ? tips : [])
    .map((t) => String(t || '').trim())
    .filter((t) => t.length > 0)
    .filter((t) => !/\bsu\b|hidrasyon|litre|water/i.test(t))
    .slice(0, 6)
}

function rowToProgram(row) {
  return { ...(row.data || {}), id: row.id, memberId: row.member_id, staffId: row.staff_id }
}

async function handleNutritionTips(req, res, auth) {
  const { callGemini, parseJsonResponse, isGeminiConfigured } = await loadGemini()
  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (GEMINI_API_KEY)' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const profile = body?.profile || {}
  const healthTestSummary = String(body?.healthTestSummary || '').slice(0, 3000)

  const instruction = buildNutritionInstruction(profile, healthTestSummary)
  const raw = await callGemini([{ text: instruction }], NUTRITION_SYSTEM, NUTRITION_CONFIG)
  const parsed = parseJsonResponse(raw)
  const tips = filterTips(parsed.tips)

  if (tips.length === 0) {
    return res.status(502).json({ ok: false, error: 'AI beslenme ipucu üretemedi' })
  }

  return res.status(200).json({
    ok: true,
    tips,
    focus: String(parsed.focus || '').trim().slice(0, 200),
    aiGenerated: true,
    userId: auth.user.id,
  })
}

async function loadExerciseCandidates(admin) {
  // Tercihen video hazır, beginner, makinesiz
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

async function handleBasicPrograms(req, res, auth) {
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  const { callGemini, parseJsonResponse, isGeminiConfigured } = await loadGemini()
  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (GEMINI_API_KEY)' })
  }

  const admin = getSupabaseAdmin()
  const memberId = auth.user.id

  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('id, name, membership, data, created_at')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !memberRow) {
    return res.status(404).json({ ok: false, error: 'Üye bulunamadı' })
  }

  if (memberRow.membership !== 'free') {
    return res.status(403).json({
      ok: false,
      skipped: 'not_free',
      error: 'AI program üretimi yalnızca Basic (ücretsiz) paket içindir',
    })
  }

  const memberData = memberRow.data || {}
  const joinedAt = toDateStr(memberData.joinedAt) || toDateStr(memberRow.created_at)
  if (!isBasicProgramWindowOpen(joinedAt)) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'window_closed',
      error: 'Kayıt tarihinden itibaren 14 günlük program penceresi dolmuş',
    })
  }

  const { data: existingPrograms, error: progErr } = await admin
    .from('programs')
    .select('id, data')
    .eq('member_id', memberId)

  if (progErr) {
    return res.status(500).json({ ok: false, error: progErr.message || 'Programlar okunamadı' })
  }

  const hasAiBasic = (existingPrograms || []).some((p) => p.data?.source === AI_BASIC_SOURCE)
  if (hasAiBasic) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'already_exists',
      error: 'AI Basic programları zaten oluşturulmuş',
    })
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
  const healthTestSummary = buildHealthTestSummary(memberData.healthTest)

  const instruction = buildBasicProgramInstruction({
    profile,
    healthTestSummary,
    dailyCalories,
    candidates,
  })

  const raw = await callGemini([{ text: instruction }], BASIC_PROGRAM_SYSTEM, BASIC_PROGRAM_CONFIG)
  let aiJson
  try {
    aiJson = parseJsonResponse(raw)
  } catch {
    return res.status(502).json({ ok: false, error: 'AI program yanıtı ayrıştırılamadı' })
  }

  let payloads
  try {
    payloads = buildValidatedProgramPayloads({
      aiJson,
      exercisesById,
      candidateIds,
      memberName: memberRow.name || profile.name || 'Üye',
      cycleStartDate: joinedAt,
      availability: memberData.availability || {},
      dailyCalories,
    })
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message || 'Program doğrulanamadı' })
  }

  const rows = [
    programInsertRow(memberId, payloads.workoutPayload),
    programInsertRow(memberId, payloads.nutritionPayload),
  ]

  const { data: inserted, error: insertErr } = await admin
    .from('programs')
    .insert(rows)
    .select()

  if (insertErr || !inserted?.length) {
    console.error('[ai-basic-programs] insert', insertErr)
    return res.status(500).json({ ok: false, error: insertErr?.message || 'Programlar kaydedilemedi' })
  }

  const programs = inserted.map(rowToProgram)
  try {
    await appendProgramNotifications(admin, memberId, programs)
  } catch (e) {
    console.warn('[ai-basic-programs] notify', e?.message || e)
  }

  return res.status(200).json({
    ok: true,
    synced: true,
    programs,
    cycleStartDate: joinedAt,
    cycleEndDate: payloads.endStr,
    dailyCalories,
  })
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const task = String(body.task || 'nutrition-tips').trim()

    if (task === 'basic-programs') {
      return await handleBasicPrograms(req, res, auth)
    }

    // Varsayılan: nutrition-tips (gövdeyi yeniden parse etmeden handleNutritionTips body okur)
    req.body = body
    return await handleNutritionTips(req, res, auth)
  } catch (e) {
    console.error('[ai-nutrition-tips]', e)
    return res.status(500).json({ ok: false, error: e.message || 'AI hatası' })
  }
}
