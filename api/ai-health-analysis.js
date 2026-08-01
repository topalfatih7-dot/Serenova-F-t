/**
 * Sağlık skoru + staffBrief (GPT-5.4).
 * Program / diyet listesi üretmez.
 *
 * Erişim: kayıtlı üye (ücretsiz skor üretimi dahil).
 * force yeniden analiz: yalnızca ücretli.
 *
 * POST body:
 * - profile, categorySummaries — üye kendi analizi
 * - memberId?, force? — personel/admin yeniden analiz (fingerprint değişmeden 409)
 */

import {
  HEALTH_SCORE_SYSTEM,
  buildHealthScoreInstruction,
  HEALTH_SCORE_CONFIG,
} from './_ai-prompts.js'
import {
  buildHealthAnalysisFingerprint,
  isCompleteHealthAnalysis,
  normalizeHealthScores,
  normalizeStaffBrief,
} from './_healthScoreAnalysis.js'
import { setCorsHeaders, handleOptions, requireAuth, getAdminEmail } from './_guards.js'
import { checkAiDailyQuota } from './_aiQuota.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { isPaidMembership } from './_memberPackages.js'

export const config = {
  maxDuration: 60,
}

async function loadOpenAi() {
  const href = new URL('./_openai.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

async function loadStaffRow(admin, userId) {
  const { data } = await admin
    .from('staff')
    .select('id, role, email')
    .eq('id', userId)
    .maybeSingle()
  return data || null
}

async function canAccessMember(authUser, memberRow, admin) {
  if (!authUser?.id || !memberRow?.id) return false
  if (authUser.id === memberRow.id) return true

  const email = (authUser.email || '').toLowerCase()
  if (email && email === getAdminEmail()) return true

  const { data: memberSelf } = await admin
    .from('members')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()
  if (memberSelf?.role === 'admin') return true

  const staff = await loadStaffRow(admin, authUser.id)
  if (!staff?.id) return false

  const assignedCoach = memberRow.assigned_coach_id || memberRow.data?.assignedCoachId || null
  const assignedDiet = memberRow.assigned_dietitian_id || memberRow.data?.assignedDietitianId || null
  const role = String(staff.role || '').toLowerCase()
  if (role === 'coach' && assignedCoach === staff.id) return true
  if (role === 'dietitian' && assignedDiet === staff.id) return true
  if ((role === 'coach' || role === 'dietitian') && (assignedCoach === staff.id || assignedDiet === staff.id)) {
    return true
  }
  return false
}

function profileFromMemberRow(row) {
  const data = row?.data && typeof row.data === 'object' ? row.data : {}
  return {
    id: row.id,
    age: data.age ?? null,
    gender: data.gender ?? null,
    height: data.height ?? null,
    weight: data.weight ?? null,
    goals: data.goals || [],
    fitnessLevel: data.fitnessLevel || null,
    healthTest: data.healthTest || {},
    healthAnalysis: data.healthAnalysis || null,
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  try {
    const auth = await requireAuth(req)
    if (!auth.ok) {
      return res.status(auth.status).json({ ok: false, error: auth.error })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const memberId = String(body.memberId || auth.user.id).trim()
    const force = body.force === true

    const rl = await enforceRateLimit({
      req,
      prefix: 'ai-health-analysis',
      limit: 20,
      windowMs: 60 * 60 * 1000,
      extraKey: auth.user.id,
    })
    applyRateLimitHeaders(res, rl.headers)
    if (!rl.ok) {
      return res.status(rl.status).json({ ok: false, error: rl.error })
    }

    const quota = await checkAiDailyQuota(auth.user.id)
    if (!quota.ok) {
      return res.status(quota.status).json({ ok: false, error: quota.error })
    }

    const admin = getSupabaseAdmin()
    const { data: memberRow, error: memberErr } = await admin
      .from('members')
      .select('id, name, membership, assigned_coach_id, assigned_dietitian_id, data')
      .eq('id', memberId)
      .maybeSingle()

    if (memberErr || !memberRow) {
      return res.status(404).json({ ok: false, error: 'Üye bulunamadı' })
    }

    const paid = isPaidMembership(memberRow.membership)

    // Personel force / yeniden analiz yalnızca ücretli üyelikte
    if (force && !paid) {
      return res.status(403).json({
        ok: false,
        error: 'Yeniden analiz yalnızca aktif ücretli üyelikte kullanılabilir',
      })
    }

    const allowed = await canAccessMember(auth.user, memberRow, admin)
    if (!allowed) {
      return res.status(403).json({ ok: false, error: 'Bu üye için analiz yetkiniz yok' })
    }

    const dbProfile = profileFromMemberRow(memberRow)
    const existingAnalysis = dbProfile.healthAnalysis

    const clientProfile = body.profile && typeof body.profile === 'object' ? body.profile : {}
    const profile = {
      age: clientProfile.age ?? dbProfile.age,
      gender: clientProfile.gender ?? dbProfile.gender,
      height: clientProfile.height ?? dbProfile.height,
      weight: clientProfile.weight ?? dbProfile.weight,
      goals: clientProfile.goals || dbProfile.goals || [],
      fitnessLevel: clientProfile.fitnessLevel || dbProfile.fitnessLevel,
      healthTest: dbProfile.healthTest,
    }

    const categorySummaries = body.categorySummaries && typeof body.categorySummaries === 'object'
      ? body.categorySummaries
      : {}

    const fingerprint = buildHealthAnalysisFingerprint({
      ...profile,
      healthTest: dbProfile.healthTest,
    })

    if (
      isCompleteHealthAnalysis(existingAnalysis)
      && existingAnalysis.sourceFingerprint
      && existingAnalysis.sourceFingerprint === fingerprint
    ) {
      return res.status(409).json({
        ok: false,
        error: 'Sağlık testi veya profil bilgileri değişmedi; yeniden analiz yapılamaz',
        unchanged: true,
        sourceFingerprint: fingerprint,
        force,
      })
    }

    const {
      callOpenAi,
      parseJsonResponse,
      isOpenAiConfigured,
      getOpenAiHealthModel,
      logAiUsage,
    } = await loadOpenAi()

    if (!isOpenAiConfigured()) {
      return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (OPENAI_API_KEY)' })
    }

    const model = getOpenAiHealthModel()
    const instruction = buildHealthScoreInstruction(profile, categorySummaries)

    let normalized = null
    let aiGenerated = false
    let usedModel = model
    let usage = null
    let costUsd = 0
    let apiCallSucceeded = false

    try {
      const result = await callOpenAi({
        messages: [
          { role: 'system', content: HEALTH_SCORE_SYSTEM },
          { role: 'user', content: instruction },
        ],
        config: {
          ...HEALTH_SCORE_CONFIG,
          reasoningEffort: 'low',
        },
        model,
        endpoint: 'ai-health-analysis',
        userId: auth.user.id,
      })
      apiCallSucceeded = true
      usedModel = result.model || model
      usage = result.usage || null
      costUsd = Number(result.costUsd) || 0
      const parsed = parseJsonResponse(result.text)
      normalized = normalizeHealthScores(parsed)
      if (normalized?.staffBrief == null && parsed) {
        const brief = normalizeStaffBrief(parsed)
        if (brief && normalized) normalized.staffBrief = brief
      }
      aiGenerated = Boolean(normalized)
    } catch (e) {
      console.error('[ai-health-analysis] openai', e?.message || e)
      // callOpenAi zaten success logladıysa çift satır yazma; yalnızca API çağrısı düştüğünde failure log
      if (!apiCallSucceeded) {
        await logAiUsage({
          provider: 'openai',
          model,
          endpoint: 'ai-health-analysis',
          userId: auth.user.id,
          success: false,
          errorCode: e?.code || e?.name || 'openai_error',
        })
      }
    }

    if (!normalized) {
      return res.status(502).json({
        ok: false,
        error: 'AI sağlık skoru üretilemedi',
        sourceFingerprint: fingerprint,
      })
    }

    if (!normalized.staffBrief) {
      return res.status(502).json({
        ok: false,
        error: 'AI staff brief eksik',
        sourceFingerprint: fingerprint,
      })
    }

    return res.status(200).json({
      ok: true,
      scores: normalized.scores,
      overallScore: normalized.overallScore,
      summary: normalized.summary,
      staffBrief: normalized.staffBrief,
      memberBrief: normalized.memberBrief || null,
      aiGenerated,
      model: usedModel,
      usage,
      costUsd,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      sourceFingerprint: fingerprint,
      force,
      userId: auth.user.id,
      memberId,
    })
  } catch (e) {
    console.error('[ai-health-analysis]', e)
    return res.status(500).json({ ok: false, error: e.message || 'AI hatası' })
  }
}
