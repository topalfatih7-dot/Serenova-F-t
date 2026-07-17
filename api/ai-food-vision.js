/**
 * Vercel Serverless Function — Fotoğraflı Kalori Tespiti (Platinum).
 *
 * Frontend, küçültülmüş yemek fotoğrafını base64 olarak gönderir;
 * bu fonksiyon GPT-4o (vision) ile analiz edip yapılandırılmış
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
import { checkAiDailyQuota } from './_aiQuota.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { requireMemberCalorieAccess } from './_memberEntitlements.js'

async function loadOpenAi() {
  const href = new URL('./_openai.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

function stripDataUrl(image) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/s.exec(image || '')
  if (match) return { mimeType: match[1], data: match[2] }
  return { mimeType: null, data: image }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const rl = await enforceRateLimit({
    req,
    prefix: 'ai-food-vision',
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

  const entitlement = await requireMemberCalorieAccess(auth.user?.id, { photo: true })
  if (!entitlement.ok) {
    return res.status(entitlement.status).json({ ok: false, error: entitlement.error })
  }

  const { callOpenAi, parseJsonResponse, isOpenAiConfigured, logAiUsage } = await loadOpenAi()

  if (!isOpenAiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (OPENAI_API_KEY)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { image, mimeType: bodyMime } = body || {}
    if (!image) {
      return res.status(400).json({ ok: false, error: 'Fotoğraf (image) gerekli' })
    }

    const { mimeType: parsedMime, data } = stripDataUrl(image)
    const mimeType = bodyMime || parsedMime || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${data}`

    const { text: raw } = await callOpenAi({
      messages: [
        { role: 'system', content: FOOD_VISION_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: FOOD_VISION_INSTRUCTION },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
          ],
        },
      ],
      config: FOOD_VISION_CONFIG,
      endpoint: 'food-vision',
      userId: auth.user?.id,
    })
    const result = parseJsonResponse(raw)

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
    if (e?.code || e?.name === 'OpenAiApiError') {
      logAiUsage({
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        endpoint: 'food-vision',
        userId: auth.user?.id,
        success: false,
        errorCode: e.code || 'openai_error',
      }).catch(() => {})
    }
    const status = e?.status || 500
    const errBody = e?.code
      ? { ok: false, code: e.code, error: e.message || String(e) }
      : { ok: false, error: String(e?.message || e) }
    return res.status(status).json(errBody)
  }
}
