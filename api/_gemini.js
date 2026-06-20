/**
 * Google Gemini API yardımcısı (sunucu tarafı).
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
    this.code = code
  }
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}

function friendlyMessage(status, parsed) {
  const apiMsg = parsed?.message || ''
  if (status === 429 || apiMsg.toLowerCase().includes('quota')) {
    return 'AI kullanım limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.'
  }
  if (status === 403) {
    return 'AI API anahtarı geçersiz veya yetkisiz. GEMINI_API_KEY kontrol edin.'
  }
  if (status === 400) {
    return 'AI isteği reddedildi. Girdiğiniz metin veya görsel uygun olmayabilir.'
  }
  if (status >= 500) {
    return 'Google AI servisi geçici olarak kullanılamıyor.'
  }
  return apiMsg.slice(0, 200) || `Gemini API hatası (${status})`
}

export function geminiErrorResponse(err) {
  if (err instanceof GeminiApiError) {
    return {
      status: err.status,
      body: { ok: false, code: err.code, error: err.message },
    }
  }
  return {
    status: 500,
    body: { ok: false, error: String(err?.message || err) },
  }
}

export async function callGemini(parts, systemInstruction, generationConfig = {}) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY tanımlı değil')

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: generationConfig.temperature ?? 0.3,
      maxOutputTokens: generationConfig.maxOutputTokens ?? 800,
      ...(generationConfig.responseMimeType
        ? { responseMimeType: generationConfig.responseMimeType }
        : {}),
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const url = `${API_BASE}/${getModel()}:generateContent?key=${encodeURIComponent(key)}`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    throw new GeminiApiError(503, 'network_error', 'Google AI servisine bağlanılamadı.')
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    let parsed = {}
    try {
      parsed = JSON.parse(errText)?.error || {}
    } catch {
      /* ignore */
    }
    const code = res.status === 429 ? 'quota_exceeded' : (parsed.status || `http_${res.status}`)
    throw new GeminiApiError(res.status, code, friendlyMessage(res.status, parsed))
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new GeminiApiError(502, 'empty_response', 'AI boş yanıt döndürdü.')
  return text
}

export function parseJsonResponse(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return JSON.parse(cleaned)
}
