/**
 * Merkezi AI Prompt Deposu (sunucu tarafı).
 * Kalori (food text/vision) + blog + günlük tüyo + staff sağlık skoru.
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
export const BLOG_AUTHOR = 'Yeni Form Ekibi'
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
    ? `\nSon yazı başlıkları (TEKRARLAMA, aynı kökte yazma — uyku, kortizol, alışkanlık, lif, motivasyon düşüşü): ${recentTitles.slice(0, 30).join(' | ')}`
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
4. Özet/kapanış — 1-2 paragraf; burada doğal şekilde şu sayfalardan EN AZ BİRİNE metin içi referans ver (URL'yi olduğu gibi yaz): https://www.yeniform.com/online-diyetisyen veya https://www.yeniform.com/online-kocluk veya https://www.yeniform.com/kilo-verme veya https://www.yeniform.com/online-diyetisyen/fiyat veya https://www.yeniform.com/online-kocluk/ev-antrenman veya https://www.yeniform.com/beslenme/sporcu-beslenmesi veya https://www.yeniform.com/beslenme/pcos veya https://www.yeniform.com/beslenme/insulin-direnci veya https://www.yeniform.com/beslenme/hamilelik veya https://www.yeniform.com/kalori-hesaplama veya https://www.yeniform.com/membership
5. "Bu içerik genel bilgilendirme amaçlıdır" notu

Paragraflar arasında boş satır bırak. Kısa özet yazma; okuyucuya gerçek değer sun.
Konu online diyet / koçluk / paket ile ilgiliyse başlıkta veya girişte ilgili anahtar kelimeyi doğal kullan.

SADECE şu JSON şemasında yanıt ver:
{
  "title": "çekici başlık (max 80 karakter)",
  "category": "${category}",
  "excerpt": "140 karaktere kadar özet",
  "author": "${BLOG_AUTHOR}",
  "accent": "brand | sage | gold | cream",
  "content": "tam makale metni (${BLOG_MIN_CHARS}+ karakter, hedef ${BLOG_TARGET_CHARS}+)"
}`
}

export const BLOG_CONFIG = {
  temperature: 0.65,
  maxOutputTokens: 4096,
  responseMimeType: 'application/json',
}

/** Günlük konu rotasyonu — pillar + küme; tekrarlayan uyku/kortizol/lif/alışkanlık kökleri yok */
export const BLOG_TOPIC_ROTATION = [
  {
    category: 'Beslenme',
    topics: [
      'online diyetisyen ile kilo verme süreci nasıl işler',
      'online diyet fiyatlarını etkileyen faktörler ve paket seçimi',
      'video görüşmeli diyetisyen desteğinin avantajları',
      'BMR ve TDEE nedir günlük kalori ihtiyacı nasıl hesaplanır',
      'kalori açığı nedir sürdürülebilir kilo vermede güvenli sınır',
      'online diyetisyen ile yüz yüze diyetisyen farkı kim için hangisi',
      'glisemik indeks ve öğün sırası pratikte ne işe yarar',
      'kahvaltı atlamak metabolizmayı yavaşlatır mı bilimsel bakış',
      'online beslenme danışmanlığı kimler için uygundur',
      'protein alımını gün içine nasıl yayarsınız sporcu ve masa başı',
    ],
  },
  {
    category: 'Antrenman',
    topics: [
      'online koçluk nedir ve yüz yüze koçluktan farkı',
      'online spor koçu ile evde antrenman programı',
      'online fitness koçu seçerken dikkat edilecekler',
      'progressive overload evde nasıl uygulanır',
      'NEAT nedir günlük hareket enerji harcamasına etkisi',
      'video koçluk seansına nasıl hazırlanılır',
      'kuvvet antrenmanı yeni başlayanlar için ilk 8 hafta',
      'toparlanma gününde ne yapılır aşırı antrenman belirtileri',
      'evde vücut ağırlığı antrenmanında ilerleme nasıl ölçülür',
      'antrenman saatiyle sporcu öğünü nasıl hizalanır',
    ],
  },
  {
    category: 'Motivasyon',
    topics: [
      'online diyetisyen ve koçla hesap verebilirlik',
      'çevre tasarımı irade yerine ortamı düzenlemek',
      'implementation intention ile randevuyu takvime bağlamak',
      'küçük kazanımları kutlama',
      'öz disiplin ve öz şefkat dengesi',
      'sürdürülebilir dönüşüm zihniyeti',
      'hedef belirleme ve SMART kriterler',
      'plato döneminde kilo vermede ne yapılır',
      'sosyal medya karşılaştırması ve beden algısı',
      'seans kaçırmamak için randevu ritüeli',
    ],
  },
  {
    category: 'Yaşam',
    topics: [
      'masa başı çalışanlar için online koçluk ve hareket',
      'circadian ritim ve öğün saatleri',
      'mevsimsel beslenme Türkiye mutfağı',
      'sosyal yaşamda sağlıklı seçimler',
      'iş yaşam dengesi ve wellness',
      'online wellness platformunda ilk 30 gün',
      'ofiste mikro mola ve merdiven kullanımı',
      'ekran molası boyun ve omuz rahatlatma',
      'seyahatte öğün düzeni pratik çerçeve',
      'hidrasyon mitleri vs günlük pratik',
    ],
  },
]

const TOPIC_STOPWORDS = new Set([
  'nedir', 'nasil', 'nasıl', 'icin', 'için', 'ile', 'veya', 'gibi', 'daha',
  'olan', 'olarak', 'uzerine', 'üzerine', 'hakkinda', 'hakkında', 'yeni',
  'form', 'bir', 'bu',
])

function foldTr(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

function topicTokens(text) {
  const keep = new Set(['bmr', 'tdee', 'pcos', 'neat'])
  return foldTr(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => keep.has(w) || (w.length >= 4 && !TOPIC_STOPWORDS.has(w)))
}

export function topicOverlapsRecent(topicHint, recentTitles = []) {
  const topicWords = topicTokens(topicHint)
  const recentWords = new Set(topicTokens((recentTitles || []).join(' ')))
  const seen = new Set()
  let hits = 0
  for (const w of topicWords) {
    if (seen.has(w)) continue
    seen.add(w)
    if (recentWords.has(w)) hits += 1
  }
  return hits >= 2
}

/** Günlük slot; son başlıklarla ≥2 anlamlı kelime örtüşen konuyu atlar (28 deneme). */
export function pickBlogTopic(recentTitles = [], now = new Date()) {
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000,
  )
  const n = BLOG_TOPIC_ROTATION.length
  let fallback = null
  for (let offset = 0; offset < 28; offset += 1) {
    const d = dayOfYear + offset
    const rotation = BLOG_TOPIC_ROTATION[d % n]
    const topicIndex = Math.floor(d / n) % rotation.topics.length
    const candidate = {
      category: rotation.category,
      topicHint: rotation.topics[topicIndex],
    }
    if (!fallback) fallback = candidate
    if (!topicOverlapsRecent(candidate.topicHint, recentTitles)) return candidate
  }
  return fallback
}

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

// ─── Staff sağlık skoru + brief (program/diyet listesi YOK) ─────────
export const HEALTH_SCORE_SYSTEM = `Sen Yeni Form platformunun deneyimli sağlık analizi AI asistanısın.
${BRAND_CONTEXT}
Üyenin kişisel sağlık analizi cevaplarına göre 0–100 arası skorlar, yalnızca koç/diyetisyen için kısa klinik paragraflar ve üyenin kendisine gösterilecek motive edici bir değerlendirme (memberBrief) üret.
Skorlar tutarlı, gerçekçi ve dengeli olsun; aşırı iyimser veya aşırı kötümser olma.
Tıbbi teşhis KOYMA. Acil durum belirtisi varsa staffBrief.risks içinde nazikçe yönlendir.
Antrenman programı, egzersiz listesi, haftalık gün şablonu, öğün menüsü veya kalori/makro tablosu ÜRETME.
Türkçe yanıt ver.`

export function buildHealthScoreInstruction(profile = {}, categorySummaries = {}) {
  const cats = categorySummaries || {}
  return `ÜYE PROFİLİ:
- Yaş: ${profile.age || '—'}, Cinsiyet: ${profile.gender || '—'}
- Boy/Kilo: ${profile.height || '—'}cm / ${profile.weight || '—'}kg
- Hedefler: ${(profile.goals || []).join(', ') || '—'}
- Fitness seviyesi: ${profile.fitnessLevel || '—'}

KATEGORİ CEVAP ÖZETLERİ:
❤️ Genel Sağlık:
${cats.general || '—'}

🩺 Tıbbi Geçmiş:
${cats.medical || '—'}

🍎 Beslenme Profili:
${cats.nutrition || '—'}

🏋️ Hareket Profili:
${cats.physical || '—'}

🌙 Günlük Yaşam:
${cats.lifestyle || '—'}

👤 Size Özel Sorular:
${cats.special || '—'}

SKOR KURALLARI:
- general: genel iyilik, enerji, anksiyete/stres etkisi
- nutrition: beslenme düzeni, öğünler, sebze/meyve, yeme davranışları
- movement: günlük hareket, kapasite, egzersiz isteği
- sleep: uyku süresi/kalitesi, dinlenmiş uyanma
- stress: stres/anksiyete yönetimi (yüksek skor = iyi yönetim)
- lifestyle: sigara/alkol/ekran/çalışma düzeni ve yaşam kalitesi
- motivation: motivasyon ölçeği ve hedef inancı
- readiness: değişime hazır oluş
- overallScore: 8 skorun dengeli birleşimi (basit ortalama değil; kritik düşük alanlar genel skoru aşağı çekebilir)
- summary: 1–2 cümlelik kısa, destekleyici Türkçe özet (iç kayıt; üyeye skor gösterilmez)
- staffBrief: yalnızca koç/diyetisyen için klinik paragraflar (madde listesi YAZMA; her alan 2–4 cümle)
  - general: genel sağlık durumu ve öncelikler
  - nutrition: beslenme örüntüsü, riskler ve diyetisyen odakları
  - movement: hareket kapasitesi, antrenman uygunluğu
  - risks: dikkat edilmesi gereken riskler / kısıtlar
  - actions: önümüzdeki 2–4 haftalık somut aksiyon önerileri (program/menü yazma)
- memberBrief: ÜYENİN KENDİSİNE gösterilir; samimi "sen" dili, sıcak ve motive edici pazarlama tonu (her alan 2–4 cümle, madde listesi YAZMA)
  - strengths: skorları yüksek alanlara atıfla neyi iyi yaptığını söyle, kutla; "bunun üstüne koyalım" hissi ver
  - focus: skorları düşük alanları suçlamadan söyle; "bunları birlikte düzeltelim" tonu, 1–2 somut yaşam alışkanlığı örneği ver
  - planPitch: düşük skorlu alanlara göre Yeni Form paketinin bu kişiye nasıl avantaj sağlayacağını anlat; beslenme zayıfsa Diyet Paketi (birebir diyetisyen desteği), hareket zayıfsa Spor Paketi (antrenör + kişiye özel program), ikisi de zayıfsa veya genel durum düşükse Vip Paket (koç + diyetisyen + doktor görüşmesi) öner; abartılı vaat verme, "garanti" kelimesi kullanma

YASAK: exerciseId, weeklyPlan, mealPlan, kahvaltı/öğle/akşam listesi, kalori-makro uydurma.

SADECE şu JSON şemasında yanıt ver:
{
  "scores": {
    "general": 0,
    "nutrition": 0,
    "movement": 0,
    "sleep": 0,
    "stress": 0,
    "lifestyle": 0,
    "motivation": 0,
    "readiness": 0
  },
  "overallScore": 0,
  "summary": "kısa özet",
  "staffBrief": {
    "general": "paragraf",
    "nutrition": "paragraf",
    "movement": "paragraf",
    "risks": "paragraf",
    "actions": "paragraf"
  },
  "memberBrief": {
    "strengths": "paragraf",
    "focus": "paragraf",
    "planPitch": "paragraf"
  }
}`
}

export const HEALTH_SCORE_CONFIG = {
  temperature: 0.3,
  maxOutputTokens: 2200,
  responseMimeType: 'application/json',
}
