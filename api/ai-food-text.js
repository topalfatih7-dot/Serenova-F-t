/**
 * Metin tabanlı kalori — cache → sözlük → GPT ayıklama + motor (kcal GPT'den değil).
 */

import {
  FOOD_TEXT_SYSTEM,
  FOOD_TEXT_INSTRUCTION,
  FOOD_TEXT_CONFIG,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { checkAiDailyQuota } from './_aiQuota.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { requireMemberCalorieAccess } from './_memberEntitlements.js'
import {
  normalizeMealQuery,
  lookupMealCache,
  upsertMealCache,
  parseMealItemsNaive,
  lookupFoodItems,
  composeFromDictionary,
} from './_foodCache.js'
import { assembleMealResult } from './_calorieEngine.js'
import { resolvePerceptionItems } from './_foodNutritionLookup.js'
import { normalizePerceptionItem } from './_foodVisionPipeline.js'

async function loadOpenAi() {
  const href = new URL('./_openai.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

function jsonMeal(result, extra = {}) {
  return {
    ok: true,
    label: result.label,
    sceneType: result.sceneType || 'open_food',
    items: result.items,
    unmatched: result.unmatched || [],
    totalCal: result.totalCal,
    totalCalLow: result.totalCalLow,
    totalCalHigh: result.totalCalHigh,
    macros: result.macros,
    confidence: result.confidence,
    confidenceScore: result.confidenceScore,
    confidenceReasons: result.confidenceReasons || [],
    pipeline: result.pipeline,
    ...extra,
  }
}

function mealFromItems(label, items, unmatched = [], extra = {}) {
  const assembled = assembleMealResult({
    label,
    sceneType: 'open_food',
    items,
    unmatched,
    qualityScore: 1,
    qualityIssues: [],
    barcode: null,
  })
  return jsonMeal(assembled, extra)
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
    prefix: 'ai-food-text',
    limit: 30,
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

  const entitlement = await requireMemberCalorieAccess(auth.user?.id, { photo: false })
  if (!entitlement.ok) {
    return res.status(entitlement.status).json({ ok: false, error: entitlement.error })
  }

  const { callOpenAi, parseJsonResponse, isOpenAiConfigured, logAiUsage } = await loadOpenAi()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const text = String(body?.text || '').trim()
    if (!text || text.length < 2) {
      return res.status(400).json({ ok: false, error: 'Metin gerekli' })
    }
    if (text.length > 2000) {
      return res.status(400).json({ ok: false, error: 'Metin çok uzun (max 2000 karakter)' })
    }

    const queryNormalized = normalizeMealQuery(text)

    const cached = await lookupMealCache(queryNormalized)
    if (cached?.items?.length) {
      logAiUsage({
        provider: 'cache',
        model: 'meal-cache',
        endpoint: 'food-text-cache',
        userId: auth.user?.id,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        success: true,
        meta: { queryNormalized },
      }).catch(() => {})

      return res.status(200).json(
        mealFromItems(cached.label || 'Kayıtlı Öğün', cached.items, [], {
          cached: true,
          source: 'cache',
        }),
      )
    }

    const parsed = parseMealItemsNaive(text)
    if (parsed.length > 0) {
      const { found, missing } = await lookupFoodItems(parsed)
      if (found.length > 0 && missing.length === 0) {
        const composed = composeFromDictionary(found)
        if (composed?.items?.length) {
          const payload = mealFromItems(composed.label, composed.items, [], {
            cached: true,
            source: 'dictionary',
          })
          await upsertMealCache({
            queryNormalized,
            queryRaw: text,
            label: payload.label,
            items: payload.items,
            confidence: payload.confidence,
            userId: auth.user?.id,
          })

          logAiUsage({
            provider: 'cache',
            model: 'food-dictionary',
            endpoint: 'food-text-dictionary',
            userId: auth.user?.id,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            success: true,
            meta: { queryNormalized, itemCount: payload.items.length },
          }).catch(() => {})

          return res.status(200).json(payload)
        }
      }
    }

    if (!isOpenAiConfigured()) {
      return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (OPENAI_API_KEY)' })
    }

    const instruction = FOOD_TEXT_INSTRUCTION.replace('{{TEXT}}', text)
    const { text: raw } = await callOpenAi({
      messages: [
        { role: 'system', content: FOOD_TEXT_SYSTEM },
        { role: 'user', content: instruction },
      ],
      config: FOOD_TEXT_CONFIG,
      endpoint: 'food-text',
      userId: auth.user?.id,
    })
    const extracted = parseJsonResponse(raw)
    const perceptionItems = (Array.isArray(extracted.items) ? extracted.items : [])
      .map((it) => normalizePerceptionItem({
        ...it,
        packaged: false,
        cal: undefined,
      }))
      .filter(Boolean)

    const { items, unmatched } = await resolvePerceptionItems(perceptionItems, {
      barcode: null,
      sceneType: 'open_food',
    })

    const label = String(extracted.label || 'Yazılan Öğün').slice(0, 60)
    if (!items.length) {
      return res.status(200).json(
        mealFromItems(label, [], unmatched, {
          cached: false,
          source: 'openai',
        }),
      )
    }

    const payload = mealFromItems(label, items, unmatched, {
      cached: false,
      source: 'openai',
    })

    await upsertMealCache({
      queryNormalized,
      queryRaw: text,
      label: payload.label,
      items: payload.items,
      confidence: payload.confidence,
      userId: auth.user?.id,
    })

    return res.status(200).json(payload)
  } catch (e) {
    if (e?.code || e?.name === 'OpenAiApiError') {
      logAiUsage({
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        endpoint: 'food-text',
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
