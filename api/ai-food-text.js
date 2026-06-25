/**
 * Metin tabanlı kalori analizi — chat mesajları için.
 * Fotoğraf analizi ile aynı JSON şemasını döndürür.
 */

import {
  FOOD_TEXT_SYSTEM,
  FOOD_TEXT_INSTRUCTION,
  FOOD_TEXT_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
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
    const text = String(body?.text || '').trim()
    if (!text || text.length < 2) {
      return res.status(400).json({ ok: false, error: 'Metin gerekli' })
    }
    if (text.length > 2000) {
      return res.status(400).json({ ok: false, error: 'Metin çok uzun (max 2000 karakter)' })
    }

    const instruction = FOOD_TEXT_INSTRUCTION.replace('{{TEXT}}', text)
    const raw = await callGemini([{ text: instruction }], FOOD_TEXT_SYSTEM, FOOD_TEXT_CONFIG)
    const result = parseJsonResponse(raw)

    const items = Array.isArray(result.items) ? result.items.map((it) => ({
      name: String(it.name || 'Bilinmeyen').slice(0, 60),
      amount: Number(it.amount) || 1,
      unit: String(it.unit || 'porsiyon').slice(0, 20),
      cal: Math.max(0, Math.round(Number(it.cal) || 0)),
    })) : []

    return res.status(200).json({
      ok: true,
      label: String(result.label || 'Yazılan Öğün').slice(0, 60),
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
