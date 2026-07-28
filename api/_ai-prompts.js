/**
 * Merkezi AI Prompt Deposu (sunucu tarafı).
 * Kalori (food text/vision) + blog + günlük tüyo.
 *
 * Not: `_` ile başlar; Vercel bunu API route olarak görmez.
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

// ─── Günlük Blog Makalesi (Cron) ────────────────────────────────────
export const BLOG_CATEGORIES = ['Beslenme', 'Antrenman', 'Motivasyon', 'Yaşam']
export const BLOG_ACCENTS = ['brand', 'sage', 'gold', 'cream']
export const BLOG_MIN_CHARS = 1350
export const BLOG_TARGET_CHARS = 1800

export const BLOG_SYSTEM = `Sen Yeni Form (yeniform.com) wellness platformunun bilim yazarısın.
${BRAND_CONTEXT}
Bilimsel kaynaklara dayalı, anlaşılır Türkçe makaleler yazarsın.
Makaleler kapsamlı ve derinlemesine olmalı: giriş, birden fazla alt başlıklı bölüm, pratik örnekler, madde işaretli ipuçları ve kapanış.
Konular: sağlıklı beslenme, egzersiz, motivasyon, uyku, stres, sürdürülebilir yaşam tarzı.
Abartılı vaatler, mucize diyetler veya tıbbi tedavi önerileri YASAK.
Her makale sonunda kısa bir "Bu içerik genel bilgilendirme amaçlıdır" notu ekle.`

export function buildBlogInstruction({ category, topicHint, recentTitles = [] }) {
  const avoid = recentTitles.length
    ? `\nSon yazı başlıkları (tekrarlama): ${recentTitles.slice(0, 8).join(' | ')}`
    : ''
  return `Kategori: ${category}
Konu ipucu: ${topicHint}
${avoid}

Yeni Form bloguna uygun, bilimsel temelli ve KAPSAMLI bir makale yaz.
İçerik EN AZ ${BLOG_MIN_CHARS} karakter olmalı (boşluklar dahil); hedef ${BLOG_TARGET_CHARS}+ karakter.

Yapı (zorunlu):
1. Giriş — 2-3 paragraf (konuyu bağlamla tanıt, okuyucuyu çek)
2. En az 4 alt başlık (## ile başlasın) — her bölümde 2-3 paragraf
3. En az bir madde işaretli pratik ipuçları listesi
4. Özet/kapanış — 1-2 paragraf; burada doğal şekilde şu sayfalardan EN AZ BİRİNE metin içi referans ver (URL'yi olduğu gibi yaz): https://www.yeniform.com/online-diyetisyen veya https://www.yeniform.com/online-kocluk veya https://www.yeniform.com/membership
5. "Bu içerik genel bilgilendirme amaçlıdır" notu

Paragraflar arasında boş satır bırak. Kısa özet yazma; okuyucuya gerçek değer sun.
Konu online diyet / koçluk / paket ile ilgiliyse başlıkta veya girişte ilgili anahtar kelimeyi doğal kullan.

SADECE şu JSON şemasında yanıt ver:
{
  "title": "çekici başlık (max 80 karakter)",
  "category": "${category}",
  "excerpt": "140 karaktere kadar özet",
  "author": "Yeni Form Ekibi",
  "accent": "brand | sage | gold | cream",
  "content": "tam makale metni (${BLOG_MIN_CHARS}+ karakter, hedef ${BLOG_TARGET_CHARS}+)"
}`
}

export const BLOG_CONFIG = {
  temperature: 0.65,
  maxOutputTokens: 4096,
  responseMimeType: 'application/json',
}

/** Günlük konu rotasyonu — pillar (online diyetisyen/koçluk) + cluster */
export const BLOG_TOPIC_ROTATION = [
  {
    category: 'Beslenme',
    topics: [
      'online diyetisyen ile kilo verme süreci nasıl işler',
      'online diyet fiyatlarını etkileyen faktörler ve paket seçimi',
      'video görüşmeli diyetisyen desteğinin avantajları',
      'protein alımı ve kas onarımı',
      'öğün zamanlaması ve kan şekeri dengesi',
      'lifli beslenmenin metabolizma etkisi',
      'online beslenme danışmanlığı kimler için uygundur',
    ],
  },
  {
    category: 'Antrenman',
    topics: [
      'online koçluk nedir ve yüz yüze koçluktan farkı',
      'online spor koçu ile evde antrenman programı',
      'online fitness koçu seçerken dikkat edilecekler',
      'kuvvet antrenmanının metabolik faydaları',
      'evde vücut ağırlığı antrenmanı',
      'toparlanma ve dinlenme günleri',
      'video koçluk seansına nasıl hazırlanılır',
    ],
  },
  {
    category: 'Motivasyon',
    topics: [
      'online diyetisyen ve koçla hesap verebilirlik',
      'alışkanlık oluşturma bilimi',
      'motivasyon düşüşüyle başa çıkma',
      'küçük kazanımları kutlama',
      'öz disiplin ve öz şefkat dengesi',
      'sürdürülebilir dönüşüm zihniyeti',
      'hedef belirleme ve SMART kriterler',
    ],
  },
  {
    category: 'Yaşam',
    topics: [
      'masa başı çalışanlar için online koçluk ve hareket',
      'uyku kalitesi ve kilo yönetimi',
      'stres ve kortizol ilişkisi',
      'mevsimsel beslenme',
      'sosyal yaşamda sağlıklı seçimler',
      'work-life balance ve wellness',
      'online wellness platformunda ilk 30 gün',
    ],
  },
]

// ─── Günün İpucu (Dashboard — günlük motivasyon) ───────────────────
export const DAILY_TIP_SYSTEM = `Sen Yeni Form (yeniform.com) wellness platformunun motivasyon koçusun.
${BRAND_CONTEXT}
Tek bir kısa, sıcak ve ilham verici Türkçe cümle yazarsın — üyenin günlük motivasyon ipucu.
Konular: spor, beslenme, alışkanlık, öz disiplin, mental sağlık, sürdürülebilir dönüşüm.
Tıbbi teşhis, abartılı vaat veya su içme önerisi YASAK. Emoji kullanma.`

export function buildDailyTipInstruction({ date, recentTips = [] }) {
  const avoid = recentTips.length
    ? `\nSon günlerin ipuçları (bunları TEKRARLAMA):\n${recentTips.map((t) => `- ${t}`).join('\n')}`
    : ''
  return `Bugünün tarihi: ${date} (Europe/Istanbul).${avoid}

SADECE şu JSON şemasında yanıt ver:
{ "tip": "tek motivasyon cümlesi, en fazla 120 karakter" }`
}

export const DAILY_TIP_CONFIG = {
  temperature: 0.9,
  maxOutputTokens: 150,
  responseMimeType: 'application/json',
}
