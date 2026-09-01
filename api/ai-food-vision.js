/**
 * Vercel Serverless Function — Fotoğraflı kalori (hibrit boru hattı).
 *
 * GPT yalnızca algı (sahne, öğe, porsiyon). Kalori OFF / sözlük / USDA + motor.
 * İstek: { image, mimeType?, barcode?, clientQuality? }
 */

import {
  FOOD_VISION_PERCEPTION_SYSTEM,
  FOOD_VISION_PERCEPTION_CONFIG,
  buildFoodVisionPerceptionInstruction,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { checkAiDailyQuota } from './_aiQuota.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { requireMemberCalorieAccess } from './_memberEntitlements.js'
import { runFoodVisionPipeline } from './_foodVisionPipeline.js'
import { normalizeBarcode } from './_openFoodFacts.js'

export const config = { maxDuration: 30 }

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
    const { image, mimeType: bodyMime, barcode: bodyBarcode, clientQuality } = body || {}
    if (!image) {
      return res.status(400).json({ ok: false, error: 'Fotoğraf (image) gerekli' })
    }

    const barcode = normalizeBarcode(bodyBarcode)
    const { mimeType: parsedMime, data } = stripDataUrl(image)
    const mimeType = bodyMime || parsedMime || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${data}`

    const { text: raw } = await callOpenAi({
      messages: [
        { role: 'system', content: FOOD_VISION_PERCEPTION_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildFoodVisionPerceptionInstruction({ barcode }) },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
      config: FOOD_VISION_PERCEPTION_CONFIG,
      endpoint: 'food-vision',
      userId: auth.user?.id,
    })
    const perception = parseJsonResponse(raw)

    const result = await runFoodVisionPipeline({
      perceptionRaw: perception,
      barcode,
      clientQuality,
    })

    if (!result.ok) {
      return res.status(result.status || 422).json({
        ok: false,
        code: result.code,
        error: result.error,
        issues: result.issues || [],
      })
    }

    return res.status(200).json(result)
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
