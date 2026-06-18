/**
 * Google Gemini API yardımcısı (sunucu tarafı).
 *
 * NEDEN GEMINI?
 *  - En ucuz vision destekli model: Gemini 2.0 Flash.
 *  - ÜCRETSIZ katman: 15 istek/dk, 1500 istek/gün (kredi kartı gerekmez).
 *  - Ücretli katman bile çok ucuz (~$0.10/1M giriş, ~$0.40/1M çıkış token).
 *
 * API anahtarı YALNIZCA sunucu ortam değişkeninde tutulur: GEMINI_API_KEY
 * (Vercel Dashboard > Settings > Environment Variables). Asla VITE_ ön eki KULLANMA.
 *
 * Model, GEMINI_MODEL env değişkeni ile değiştirilebilir (varsayılan: gemini-2.0-flash).
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}

/**
 * Gemini'ye istek atar ve metin yanıtını döndürür.
 * @param {Array} parts - Gemini "parts" dizisi (text ve/veya inline_data)
 * @param {string} systemInstruction - sistem talimatı
 * @param {object} generationConfig - { temperature, maxOutputTokens, responseMimeType }
 * @returns {Promise<string>} - modelin ürettiği ham metin (genelde JSON string)
 */
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

  const url = `${API_BASE}/${getModel()}:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API hatası (${res.status}): ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini boş yanıt döndürdü')
  return text
}

/**
 * Model çıktısındaki JSON'u güvenli şekilde ayrıştırır.
 * responseMimeType=application/json kullanıldığında genelde saf JSON gelir,
 * ama olası ```json ... ``` sarmalını da temizler.
 */
export function parseJsonResponse(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return JSON.parse(cleaned)
}
