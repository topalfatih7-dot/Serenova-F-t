/**
 * Vercel Serverless — Bilinmeyen besin kalori tahmini.
 *
 * Yerel DB'de bulunamayan besinler için TEK seferlik AI çağrısı yapılır.
 * Sonuç frontend'de Supabase custom_foods'a kaydedilir; sonraki aramalarda
 * AI'ya hiç gidilmez (hibrit yaklaşım).
 *
 * İstek: { foods: [{name, qty, unit?}] }  — toplu (max 10)
 * Yanıt: { ok, results: [{name, cal100, unit, unitG, category, estimatedCal}] }
 */

import { callGemini, parseJsonResponse, isGeminiConfigured } from './_gemini.js'

const SYSTEM = `Sen bir Türk mutfağı uzmanı ve beslenme diyetisyenisin.
Sana Türkçe besin isimleri verilecek. Her biri için 100 gram başına kalori, 
yaygın ölçü birimi ve o birimin gram karşılığı ile besin kategorisini tahmin et.
Türk porsiyon normlarını kullan. SADECE JSON dön.`

const MAX_FOODS = 10

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'GEMINI_API_KEY tanımlı değil' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const foods = (body?.foods || []).slice(0, MAX_FOODS)
    if (!foods.length) return res.status(400).json({ ok: false, error: 'foods listesi boş' })

    const instruction = `Şu Türkçe besinler için tahmin yap:\n${
      foods.map((f, i) => `${i + 1}. "${f.name}"${f.qty ? ` (miktar: ${f.qty} ${f.unit || ''})` : ''}`).join('\n')
    }\n\nSADECE bu JSON şemasında yanıt ver:
[
  {
    "name": "besin adı (Türkçe, standartlaştırılmış)",
    "cal100": 100_gram_kalori_sayısı,
    "unit": "adet|porsiyon|dilim|kase|bardak|avuç|yemek kaşığı|gram",
    "unitG": birim_gram_karşılığı,
    "category": "Et & Balık|Tahıllar|Süt & Yumurta|Meyve|Sebze|Baklagiller|Yağlar|İçecekler|Hazır Yemek|Tatlılar|Diğer",
    "estimatedCal": toplam_tahmin_kalori
  }
]`

    const raw = await callGemini(
      [{ text: instruction }],
      SYSTEM,
      { temperature: 0.2, maxOutputTokens: 600, responseMimeType: 'application/json' }
    )
    const results = parseJsonResponse(raw)
    const normalized = (Array.isArray(results) ? results : []).map((r, i) => ({
      name: String(r.name || foods[i]?.name || 'Bilinmeyen').slice(0, 60),
      cal100: Math.max(1, Math.round(Number(r.cal100) || 50)),
      unit: String(r.unit || 'porsiyon').slice(0, 20),
      unitG: Math.max(1, Math.round(Number(r.unitG) || 100)),
      category: String(r.category || 'Diğer').slice(0, 40),
      estimatedCal: Math.max(0, Math.round(Number(r.estimatedCal) || 0)),
    }))

    return res.status(200).json({ ok: true, results: normalized })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}
