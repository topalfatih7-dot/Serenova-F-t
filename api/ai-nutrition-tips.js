/**
 * Sağlık profili + test → AI beslenme ipuçları (günlük menü yok).
 */

import {
  NUTRITION_SYSTEM,
  buildNutritionInstruction,
  NUTRITION_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'

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

  const { callGemini, parseJsonResponse, isGeminiConfigured } = await loadGemini()
  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (GEMINI_API_KEY)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const profile = body?.profile || {}
    const healthTestSummary = String(body?.healthTestSummary || '').slice(0, 3000)

    const instruction = buildNutritionInstruction(profile, healthTestSummary)
    const raw = await callGemini([{ text: instruction }], NUTRITION_SYSTEM, NUTRITION_CONFIG)
    const result = parseJsonResponse(raw)
    const tips = filterTips(result.tips)

    if (tips.length === 0) {
      return res.status(502).json({ ok: false, error: 'AI beslenme ipucu üretemedi' })
    }

    return res.status(200).json({
      ok: true,
      tips,
      focus: String(result.focus || '').trim().slice(0, 200),
      aiGenerated: true,
    })
  } catch (e) {
    const status = e?.status || 500
    const body = e?.code
      ? { ok: false, code: e.code, error: e.message || String(e) }
      : { ok: false, error: String(e?.message || e) }
    return res.status(status).json(body)
  }
}
