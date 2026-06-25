/**
 * Vercel Serverless Function — Fotoğraflı Kalori Tespiti (Platinum).
 *
 * Frontend, küçültülmüş yemek fotoğrafını base64 olarak gönderir;
 * bu fonksiyon Gemini 2.0 Flash (vision) ile analiz edip yapılandırılmış
 * JSON döndürür. API anahtarı yalnızca sunucuda tutulur.
 *
 * İstek gövdesi: { image: "data:image/jpeg;base64,..." veya saf base64", mimeType?: "image/jpeg" }
 * Yanıt: { ok: true, label, items: [{name, amount, unit, cal}], confidence }
 */

import {
  FOOD_VISION_SYSTEM,
  FOOD_VISION_INSTRUCTION,
  FOOD_VISION_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

function stripDataUrl(image) {
  // "data:image/jpeg;base64,XXXX" → { mimeType, data }
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/s.exec(image || '')
  if (match) return { mimeType: match[1], data: match[2] }
  return { mimeType: null, data: image }
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
    const { image, mimeType: bodyMime } = body || {}
    if (!image) {
      return res.status(400).json({ ok: false, error: 'Fotoğraf (image) gerekli' })
    }

    const { mimeType: parsedMime, data } = stripDataUrl(image)
    const mimeType = bodyMime || parsedMime || 'image/jpeg'

    const parts = [
      { text: FOOD_VISION_INSTRUCTION },
      { inline_data: { mime_type: mimeType, data } },
    ]

    const raw = await callGemini(parts, FOOD_VISION_SYSTEM, FOOD_VISION_CONFIG)
    const result = parseJsonResponse(raw)

    // Sonucu doğrula/normalize et
    const items = Array.isArray(result.items) ? result.items.map((it) => ({
      name: String(it.name || 'Bilinmeyen').slice(0, 60),
      amount: Number(it.amount) || 1,
      unit: String(it.unit || 'porsiyon').slice(0, 20),
      cal: Math.max(0, Math.round(Number(it.cal) || 0)),
    })) : []

    return res.status(200).json({
      ok: true,
      label: String(result.label || 'Tespit Edilen Öğün').slice(0, 60),
      items,
      confidence: result.confidence || 'medium',
    })
  } catch (e) {
    const status = e?.status || 500
    const body = e?.code
      ? { ok: false, code: e.code, error: e.message || String(e) }
      : { ok: false, error: String(e?.message || e) }
    return res.status(status).json(body)
  }
}
