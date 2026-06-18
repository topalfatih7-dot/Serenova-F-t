/**
 * Merkezi AI Prompt Deposu (sunucu tarafı).
 * Tüm Vercel serverless AI fonksiyonları bu dosyadan prompt çeker.
 *
 * Maliyet optimizasyonu ilkeleri:
 *  - Promptlar kısa ve net tutulur (daha az input token).
 *  - Model'den DOĞRUDAN JSON istenir (response_mime_type: application/json),
 *    böylece ekstra açıklama metni üretilmez (daha az output token).
 *  - maxOutputTokens düşük tutulur.
 *  - Görüntüler frontend'de küçültülür (daha az input token).
 *
 * Not: Bu dosya `_` ile başlar; Vercel bunu bir API route olarak DEĞİL,
 * sadece yardımcı modül olarak görür.
 */

// ─── Fotoğraf → Yemek/Kalori Tespiti (Vision) ───────────────────────
export const FOOD_VISION_SYSTEM = `Sen bir beslenme uzmanı ve gıda görüntü analiz asistanısın.
Sana bir yemek/tabak fotoğrafı verilecek. Görseldeki TÜM yiyecek ve içecekleri tespit et.
Her bir öğe için Türkçe isim, tahmini porsiyon miktarı, birim ve tahmini kalori (kcal) değeri ver.
Türk mutfağını ve yaygın porsiyon ölçülerini (dilim, porsiyon, kase, adet, bardak, g) dikkate al.
Kalori tahminlerini gerçekçi tut. Görselde yemek yoksa items dizisini boş döndür.`

export const FOOD_VISION_INSTRUCTION = `Bu fotoğraftaki yiyecekleri analiz et ve SADECE şu JSON şemasında yanıt ver:
{
  "label": "kısa tabak açıklaması (ör. Kahvaltı Tabağı)",
  "items": [
    { "name": "yiyecek adı (Türkçe)", "amount": sayı, "unit": "birim", "cal": kalori_sayısı }
  ],
  "confidence": "low | medium | high"
}`

// Vision için Gemini generationConfig (maliyet kontrolü)
export const FOOD_VISION_CONFIG = {
  temperature: 0.2,
  maxOutputTokens: 800,
  responseMimeType: 'application/json',
}

// ─── Beslenme Analizi (Metin) ───────────────────────────────────────
// Kural tabanlı plan zaten üretiliyor; AI burada KİŞİSEL, kısa bir
// motivasyon + iyileştirme notu ekler. Düşük token = düşük maliyet.
export const NUTRITION_SYSTEM = `Sen deneyimli bir diyetisyensin. Sana bir üyenin profili ve
kural tabanlı oluşturulmuş beslenme planı özeti verilecek. Kısa, kişisel ve uygulanabilir
öneriler üret. Tıbbi teşhis KOYMA. Türkçe yanıt ver.`

export function buildNutritionInstruction(profile, baseSummary) {
  return `ÜYE PROFİLİ:
- Yaş: ${profile.age || '—'}, Cinsiyet: ${profile.gender || '—'}
- Boy/Kilo: ${profile.height || '—'}cm / ${profile.weight || '—'}kg
- Hedefler: ${(profile.goals || []).join(', ') || '—'}
- Beslenme tercihleri: ${(profile.nutritionPrefs || []).join(', ') || '—'}
- Fitness seviyesi: ${profile.fitnessLevel || '—'}

MEVCUT PLAN ÖZETİ:
${baseSummary || '—'}

SADECE şu JSON şemasında yanıt ver:
{
  "summary": "1-2 cümle kişisel motivasyon mesajı",
  "tips": ["kısa öneri 1", "kısa öneri 2", "kısa öneri 3"],
  "focus": "bu hafta odaklanılacak tek şey"
}`
}

export const NUTRITION_CONFIG = {
  temperature: 0.5,
  maxOutputTokens: 500,
  responseMimeType: 'application/json',
}
