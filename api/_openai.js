/**
 * OpenAI API yardımcısı (sunucu tarafı) — kalori chat/vision için GPT-4o.
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'

const API_URL = 'https://api.openai.com/v1/chat/completions'

/** USD / 1M token — gpt-4o (standart API, 2026) */
const GPT4O_INPUT_PER_M = 2.5
const GPT4O_OUTPUT_PER_M = 10.0

export class OpenAiApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'OpenAiApiError'
    this.status = status
    this.code = code
  }
}

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o'
}

export function estimateOpenAiCostUsd(promptTokens, completionTokens, model = 'gpt-4o') {
  const m = String(model || '').toLowerCase()
  let inRate = GPT4O_INPUT_PER_M
  let outRate = GPT4O_OUTPUT_PER_M
  if (m.includes('gpt-4o-mini')) {
    inRate = 0.15
    outRate = 0.6
  }
  const input = (Number(promptTokens) || 0) / 1_000_000 * inRate
  const output = (Number(completionTokens) || 0) / 1_000_000 * outRate
  return Math.round((input + output) * 1_000_000) / 1_000_000
}

function friendlyMessage(status, apiMsg = '') {
  const msg = String(apiMsg || '').toLowerCase()
  if (status === 429 || msg.includes('rate') || msg.includes('quota')) {
    return 'AI kullanım limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.'
  }
  if (status === 401 || status === 403) {
    return 'OpenAI API anahtarı geçersiz veya yetkisiz. OPENAI_API_KEY kontrol edin.'
  }
  if (status === 400) {
    return 'AI isteği reddedildi. Girdiğiniz metin veya görsel uygun olmayabilir.'
  }
  if (status >= 500) {
    return 'OpenAI servisi geçici olarak kullanılamıyor.'
  }
  return String(apiMsg || '').slice(0, 200) || `OpenAI API hatası (${status})`
}

export function parseJsonResponse(text) {
  let cleaned = String(text || '').trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return JSON.parse(cleaned)
}

/**
 * Chat Completions çağrısı.
 * @param {object} opts
 * @param {Array} opts.messages
 * @param {object} [opts.config]
 * @param {string} [opts.endpoint] — kullanım logu için (food-text | food-vision)
 * @param {string} [opts.userId]
 * @returns {Promise<{ text: string, usage: object, model: string, costUsd: number }>}
 */
export async function callOpenAi({ messages, config = {}, endpoint = 'openai', userId = null }) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY tanımlı değil')

  const model = getOpenAiModel()
  const body = {
    model,
    messages,
    temperature: config.temperature ?? 0.2,
    max_tokens: config.maxOutputTokens ?? config.max_tokens ?? 800,
  }
  if (config.responseMimeType === 'application/json' || config.response_format === 'json') {
    body.response_format = { type: 'json_object' }
  }

  let res
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new OpenAiApiError(503, 'network_error', 'OpenAI servisine bağlanılamadı.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const apiMsg = data?.error?.message || ''
    const code = res.status === 429
      ? 'quota_exceeded'
      : (res.status === 401 || res.status === 403)
        ? 'invalid_api_key'
        : (data?.error?.code || `http_${res.status}`)
    throw new OpenAiApiError(res.status, code, friendlyMessage(res.status, apiMsg))
  }

  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) {
    throw new OpenAiApiError(502, 'empty_response', 'AI boş yanıt döndürdü.')
  }

  const usage = data?.usage || {}
  const promptTokens = Number(usage.prompt_tokens) || 0
  const completionTokens = Number(usage.completion_tokens) || 0
  const totalTokens = Number(usage.total_tokens) || (promptTokens + completionTokens)
  const costUsd = estimateOpenAiCostUsd(promptTokens, completionTokens, model)

  logAiUsage({
    provider: 'openai',
    model,
    endpoint,
    userId,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd,
    success: true,
  }).catch(() => {})

  return { text, usage: { promptTokens, completionTokens, totalTokens }, model, costUsd }
}

export async function logAiUsage({
  provider,
  model,
  endpoint,
  userId = null,
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  costUsd = 0,
  success = true,
  errorCode = null,
  meta = null,
}) {
  const admin = getSupabaseAdmin()
  if (!admin) return
  try {
    await admin.from('ai_usage_logs').insert({
      provider,
      model,
      endpoint,
      user_id: userId || null,
      prompt_tokens: Math.max(0, Math.round(Number(promptTokens) || 0)),
      completion_tokens: Math.max(0, Math.round(Number(completionTokens) || 0)),
      total_tokens: Math.max(0, Math.round(Number(totalTokens) || 0)),
      cost_usd: Number(costUsd) || 0,
      success: Boolean(success),
      error_code: errorCode ? String(errorCode).slice(0, 80) : null,
      meta: meta && typeof meta === 'object' ? meta : null,
    })
  } catch {
    /* log asla ana akışı bozmasın */
  }
}
