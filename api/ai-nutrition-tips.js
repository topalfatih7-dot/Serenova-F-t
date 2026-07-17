/**
 * Üye AI uçları (Vercel Hobby 12-fn limiti — tek route):
 * - POST task=nutrition-tips (default)
 * - POST task=basic-programs → Basic deneme süresi programları
 * - POST task=eko-programs → Eko 15g diyet + 30g antrenman
 */

import {
  NUTRITION_SYSTEM,
  buildNutritionInstruction,
  NUTRITION_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth, requireAdmin } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { AI_BASIC_SOURCE, AI_EKO_SOURCE } from './_aiBasicPrograms.js'
import { callGemini, parseJsonResponse, isGeminiConfigured } from './_gemini.js'

export const config = {
  maxDuration: 60,
}

function filterTips(tips) {
  return (Array.isArray(tips) ? tips : [])
    .map((t) => String(t || '').trim())
    .filter((t) => t.length > 0)
    .filter((t) => !/\bsu\b|hidrasyon|litre|water/i.test(t))
    .slice(0, 6)
}

function hasHealthTest(data) {
  const ht = data?.healthTest
  return ht && typeof ht === 'object' && Object.keys(ht).length > 0
}

async function handleNutritionTips(req, res, auth) {
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

async function handleBasicPrograms(req, res, auth) {
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  const admin = getSupabaseAdmin()
  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('id, name, membership, data, created_at')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (memberErr || !memberRow) {
    return res.status(404).json({ ok: false, error: 'Üye bulunamadı' })
  }
  if (memberRow.membership !== 'free') {
    return res.status(403).json({
      ok: false,
      skipped: 'not_free',
      error: 'AI Basic programları yalnızca ücretsiz paket içindir',
    })
  }
  if (!hasHealthTest(memberRow.data)) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'no_health_test',
      error: 'Sağlık testi tamamlanmalı',
    })
  }

  const { data: existing } = await admin
    .from('programs')
    .select('id, data')
    .eq('member_id', memberRow.id)
  const hasAiBasic = (existing || []).some((p) => p.data?.source === AI_BASIC_SOURCE)
  if (hasAiBasic) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'already_exists',
      error: 'AI Basic programları zaten oluşturulmuş',
    })
  }

  const { generateBasicPrograms } = await import('./_aiEkoPrograms.js')
  const result = await generateBasicPrograms(admin, memberRow)
  if (result.status) {
    return res.status(result.status).json(result)
  }
  return res.status(200).json(result)
}

async function handleEkoPrograms(req, res, auth) {
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  const admin = getSupabaseAdmin()
  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('id, name, membership, data')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (memberErr || !memberRow) {
    return res.status(404).json({ ok: false, error: 'Üye bulunamadı' })
  }
  if (memberRow.membership !== 'eko') {
    return res.status(403).json({
      ok: false,
      skipped: 'not_eko',
      error: 'AI Eko programları yalnızca Eko paket içindir',
    })
  }
  if (!hasHealthTest(memberRow.data)) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'no_health_test',
      error: 'Sağlık testi tamamlanmalı',
    })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const force = body.force === true

  if (!force) {
    const { data: existing } = await admin
      .from('programs')
      .select('id, data')
      .eq('member_id', memberRow.id)
    const hasEko = (existing || []).some((p) => p.data?.source === AI_EKO_SOURCE)
    if (hasEko) {
      return res.status(200).json({
        ok: true,
        synced: false,
        skipped: 'already_exists',
        error: 'AI Eko programları zaten oluşturulmuş',
      })
    }
  }

  const { generateEkoProgramsInitial } = await import('./_aiEkoPrograms.js')
  const result = await generateEkoProgramsInitial(admin, memberRow)
  if (result.status) {
    return res.status(result.status).json(result)
  }
  return res.status(200).json(result)
}

async function handleEkoProgramsAdmin(req, res) {
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  const adminAuth = await requireAdmin(req)
  if (!adminAuth.ok) {
    return res.status(adminAuth.status).json({ ok: false, error: adminAuth.error })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const memberId = String(body.memberId || '').trim()
  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'memberId gerekli' })
  }

  const admin = getSupabaseAdmin()
  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('id, name, membership, data')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !memberRow) {
    return res.status(404).json({ ok: false, error: 'Üye bulunamadı' })
  }
  if (memberRow.membership !== 'eko') {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'not_eko',
      error: 'Üye Eko pakette değil',
    })
  }
  if (!hasHealthTest(memberRow.data)) {
    return res.status(200).json({
      ok: true,
      synced: false,
      skipped: 'no_health_test',
      error: 'Sağlık testi tamamlanmalı',
    })
  }

  const { generateEkoProgramsInitial } = await import('./_aiEkoPrograms.js')
  const result = await generateEkoProgramsInitial(admin, memberRow)
  if (result.status) {
    return res.status(result.status).json(result)
  }
  return res.status(200).json(result)
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const task = String(body.task || 'nutrition-tips').trim()
    req.body = body

    // Admin task — kendi auth zinciri
    if (task === 'eko-programs-admin') {
      return await handleEkoProgramsAdmin(req, res)
    }

    const auth = await requireAuth(req)
    if (!auth.ok) {
      return res.status(auth.status).json({ ok: false, error: auth.error })
    }

    if (task === 'basic-programs') {
      return await handleBasicPrograms(req, res, auth)
    }
    if (task === 'eko-programs') {
      return await handleEkoPrograms(req, res, auth)
    }

    return await handleNutritionTips(req, res, auth)
  } catch (e) {
    console.error('[ai-nutrition-tips]', e)
    return res.status(500).json({ ok: false, error: e.message || 'AI hatası' })
  }
}
