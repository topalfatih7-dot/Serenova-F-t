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

const BRAND_CONTEXT = `Platform: Yeni Form (yeniform.com) — çevrimiçi koçluk, diyetisyen desteği ve wellness.
Kullanıcılar Türkiye'de; Türk mutfağı ve günlük yaşam alışkanlıkları önceliklidir.
Tıbbi teşhis KOYMA; genel bilgilendirme ve pratik öneriler ver.`

// ─── Fotoğraf → Yemek/Kalori Tespiti (Vision) ───────────────────────
export const FOOD_VISION_SYSTEM = `Sen Yeni Form platformunun beslenme uzmanı AI asistanısın.
${BRAND_CONTEXT}
Sana bir yemek/tabak fotoğrafı verilecek. Görseldeki TÜM yiyecek ve içecekleri tespit et.
Her öğe için Türkçe isim, tahmini porsiyon miktarı, birim ve tahmini kalori (kcal) ver.
Türk mutfağı porsiyonlarını (dilim, porsiyon, kase, adet, bardak, gram) kullan.
Kalori tahminlerini USDA/Türk Gıda Kompozisyon tablolarına yakın gerçekçi tut.
Belirsiz görsellerde confidence: "low" kullan. Görselde yemek yoksa items dizisini boş döndür.`

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

// ─── Metin → Yemek/Kalori Tespiti (Chat) ────────────────────────────
export const FOOD_TEXT_SYSTEM = `Sen Yeni Form platformunun beslenme uzmanı AI asistanısın.
${BRAND_CONTEXT}
Kullanıcı ne yediğini Türkçe yazacak — günlük konuşma dili, kısaltmalar ve karışık öğünler olabilir.
Yazılan TÜM yiyecek ve içecekleri ayıkla; her biri için Türkçe isim, tahmini porsiyon, birim ve kalori (kcal) ver.
"2 yumurta", "yarım porsiyon pilav", "1 bardak ayran" gibi ifadeleri doğru yorumla.
Türk mutfağı porsiyonlarını kullan. Kalori tahminlerini gerçekçi tut.
Hiç yiyecek anlaşılmazsa items dizisini boş döndür.`

export const FOOD_TEXT_INSTRUCTION = `Kullanıcının yazdığı öğün:
"""
{{TEXT}}
"""

SADECE şu JSON şemasında yanıt ver:
{
  "label": "kısa öğün açıklaması",
  "items": [
    { "name": "yiyecek adı (Türkçe)", "amount": sayı, "unit": "birim", "cal": kalori_sayısı }
  ],
  "confidence": "low | medium | high"
}`

export const FOOD_TEXT_CONFIG = {
  temperature: 0.2,
  maxOutputTokens: 600,
  responseMimeType: 'application/json',
}

// ─── Beslenme İpuçları (AI — günlük öğün planı YOK) ─────────────────
export const NUTRITION_SYSTEM = `Sen Yeni Form platformunun deneyimli diyetisyen AI asistanısın.
${BRAND_CONTEXT}
Üyenin sağlık testi, hedefleri ve beslenme tercihlerine göre 4–6 kısa, uygulanabilir beslenme ipucu üret.
Günlük öğün menüsü veya kahvaltı/öğle/akşam listesi VERME. Su/hidrasyon önerisi VERME.
Tıbbi teşhis KOYMA. Türkçe yanıt ver.`

export function buildNutritionInstruction(profile, healthTestSummary = '') {
  return `ÜYE PROFİLİ:
- Yaş: ${profile.age || '—'}, Cinsiyet: ${profile.gender || '—'}
- Boy/Kilo: ${profile.height || '—'}cm / ${profile.weight || '—'}kg
- Hedefler: ${(profile.goals || []).join(', ') || '—'}
- Beslenme tercihleri: ${(profile.nutritionPrefs || []).join(', ') || '—'}
- Fitness seviyesi: ${profile.fitnessLevel || '—'}

SAĞLIK TESTİ ÖZETİ:
${healthTestSummary || '—'}

SADECE şu JSON şemasında yanıt ver:
{
  "tips": ["kısa ipucu 1", "kısa ipucu 2", "kısa ipucu 3", "kısa ipucu 4"],
  "focus": "bu hafta odaklanılacak tek beslenme alışkanlığı (1 cümle)"
}`
}

export const NUTRITION_CONFIG = {
  temperature: 0.45,
  maxOutputTokens: 600,
  responseMimeType: 'application/json',
}

// ─── Günlük Blog Makalesi (Cron) ────────────────────────────────────
export const BLOG_CATEGORIES = ['Beslenme', 'Antrenman', 'Motivasyon', 'Yaşam']
export const BLOG_ACCENTS = ['brand', 'sage', 'gold', 'cream']
export const BLOG_MIN_CHARS = 900

export const BLOG_SYSTEM = `Sen Yeni Form (yeniform.com) wellness platformunun bilim yazarısın.
${BRAND_CONTEXT}
Bilimsel kaynaklara dayalı, anlaşılır Türkçe makaleler yazarsın.
Makaleler: sağlıklı beslenme, egzersiz, motivasyon, uyku, stres, sürdürülebilir yaşam tarzı.
Abartılı vaatler, mucize diyetler veya tıbbi tedavi önerileri YASAK.
Her makale sonunda kısa bir "Bu içerik genel bilgilendirme amaçlıdır" notu ekle.`

export function buildBlogInstruction({ category, topicHint, recentTitles = [] }) {
  const avoid = recentTitles.length
    ? `\nSon yazı başlıkları (tekrarlama): ${recentTitles.slice(0, 8).join(' | ')}`
    : ''
  return `Kategori: ${category}
Konu ipucu: ${topicHint}
${avoid}

Yeni Form bloguna uygun, bilimsel temelli bir makale yaz.
İçerik EN AZ ${BLOG_MIN_CHARS} karakter olmalı (boşluklar dahil).
Paragraflar arasında boş satır bırak. Madde listeleri kullanabilirsin.

SADECE şu JSON şemasında yanıt ver:
{
  "title": "çekici başlık (max 80 karakter)",
  "category": "${category}",
  "excerpt": "140 karaktere kadar özet",
  "author": "Yeni Form Ekibi",
  "accent": "brand | sage | gold | cream",
  "content": "tam makale metni (${BLOG_MIN_CHARS}+ karakter)"
}`
}

export const BLOG_CONFIG = {
  temperature: 0.65,
  maxOutputTokens: 2500,
  responseMimeType: 'application/json',
}

/** Günlük konu rotasyonu — kategori + odak */
export const BLOG_TOPIC_ROTATION = [
  { category: 'Beslenme', topics: ['protein alımı ve kas onarımı', 'lifli beslenmenin metabolizma etkisi', 'sağlıklı yağlar ve omega-3', 'öğün zamanlaması ve kan şekeri', 'hidrasyon ve performans', 'mikrobesinler ve enerji', 'bitkisel protein kaynakları'] },
  { category: 'Antrenman', topics: ['kuvvet antrenmanının metabolik faydaları', 'HIIT vs LISS karşılaştırması', 'esneklik ve mobilite', 'evde vücut ağırlığı antrenmanı', 'toparlanma ve dinlenme günleri', 'kardiyo ve kalp sağlığı', 'core stabilite egzersizleri'] },
  { category: 'Motivasyon', topics: ['alışkanlık oluşturma bilimi', 'hedef belirleme ve SMART kriterler', 'motivasyon düşüşüyle başa çıkma', 'sosyal destek ve hesap verebilirlik', 'küçük kazanımları kutlama', 'öz disiplin ve öz şefkat dengesi', 'sürdürülebilir dönüşüm zihniyeti'] },
  { category: 'Yaşam', topics: ['uyku kalitesi ve kilo yönetimi', 'stres ve kortizol ilişkisi', 'masa başı çalışanlar için hareket', 'dijital detoks ve zihinsel sağlık', 'mevsimsel beslenme', 'sosyal yaşamda sağlıklı seçimler', 'work-life balance ve wellness'] },
]
