/**
 * Vercel Serverless Function — AI Destekli Beslenme Notu.
 *
 * Kural tabanlı beslenme planı (src/services/aiAnalysis.js) zaten üretilir.
 * Bu fonksiyon, üye profili + plan özetini alıp Gemini ile KISA, kişisel bir
 * motivasyon/iyileştirme notu üretir. AI yoksa frontend kural tabanlı metne döner.
 *
 * İstek gövdesi: { profile: {...}, baseSummary: "..." }
 * Yanıt: { ok: true, summary, tips: [...], focus }
 */

import { callGemini, parseJsonResponse, isGeminiConfigured } from './_gemini.js'
import {
  NUTRITION_SYSTEM,
  buildNutritionInstruction,
  NUTRITION_CONFIG,
} from './_ai-prompts.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (GEMINI_API_KEY)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { profile, baseSummary } = body || {}
    if (!profile) {
      return res.status(400).json({ ok: false, error: 'profile gerekli' })
    }

    const instruction = buildNutritionInstruction(profile, baseSummary)
    const raw = await callGemini([{ text: instruction }], NUTRITION_SYSTEM, NUTRITION_CONFIG)
    const result = parseJsonResponse(raw)

    return res.status(200).json({
      ok: true,
      summary: String(result.summary || '').slice(0, 400),
      tips: Array.isArray(result.tips) ? result.tips.slice(0, 5).map((t) => String(t).slice(0, 200)) : [],
      focus: String(result.focus || '').slice(0, 200),
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}
