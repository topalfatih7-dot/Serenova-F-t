# AI Kurulum Rehberi (Google Gemini)

Bu proje, **fotoğraflı kalori tespiti** ve **AI destekli beslenme notu** için
yapay zekaya bağlanabilir. Mimari, mevcut Telegram entegrasyonuyla aynıdır:
API anahtarı **yalnızca sunucuda** (Vercel) tutulur, tarayıcıya asla sızmaz.

> **Önemli:** AI **opsiyoneldir**. Anahtar tanımlanmazsa uygulama eskisi gibi
> çalışır; fotoğraf analizi "demo" örnek sonuçlar gösterir, beslenme planı
> kural tabanlı üretilir. Hiçbir şey bozulmaz.

---

## Neden Gemini? (En ucuz seçenek)

| Sağlayıcı | Vision | Ücretsiz katman | Ücretli fiyat (yaklaşık) |
|-----------|:------:|-----------------|--------------------------|
| **Google Gemini 2.0 Flash** | ✅ | **15 istek/dk, 1500/gün** (kart gerekmez) | ~$0.10 / 1M giriş token |
| OpenAI gpt-4o-mini | ✅ | yok | ~$0.15 / 1M giriş token |

**Sonuç:** Gemini 2.0 Flash hem ücretsiz katmanı hem de en düşük ücretli
fiyatı sunduğu için seçildi. Çoğu küçük/orta işletme **ücretsiz katmanla**
hiç ödeme yapmadan kullanabilir.

---

## Adım Adım Kurulum

### 1. Ücretsiz Gemini API anahtarı al
1. https://aistudio.google.com/apikey adresine git (Google hesabıyla giriş).
2. **"Create API key"** → anahtarı kopyala (`AIzaSy...` ile başlar).
3. Kredi kartı **gerekmez**; ücretsiz katman otomatik aktiftir.

### 2. Vercel'e ortam değişkenlerini ekle
Vercel Dashboard → Proje → **Settings → Environment Variables**:

| Değişken | Değer | Ortam |
|----------|-------|-------|
| `GEMINI_API_KEY` | `AIzaSy...` (kopyaladığın anahtar) | Production + Preview |
| `GEMINI_MODEL` | `gemini-2.0-flash` *(opsiyonel)* | Production + Preview |
| `VITE_AI_VISION_ENABLED` | `true` | Production + Preview |
| `VITE_AI_NUTRITION_ENABLED` | `true` *(opsiyonel)* | Production + Preview |

> `GEMINI_API_KEY` **asla** `VITE_` ön eki almaz → tarayıcıya sızmaz.
> `VITE_AI_*` bayrakları sadece arayüzün gerçek analizi deneyip denemeyeceğini
> belirler (gizli bilgi değildir).

### 3. Yeniden dağıt (redeploy)
Vercel'de **Deployments → Redeploy** (env değişkenleri build'e dahil olsun diye).

### 4. Test et
- **Fotoğraflı kalori:** Platinum üye → Kalori Hesapla → "Fotoğrafla Hesapla"
  → bir yemek fotoğrafı yükle. Gerçek analiz birkaç saniyede gelir.
- Anahtar yanlışsa/limitte ise arayüz otomatik **demo sonuca** düşer (kırılmaz).

---

## Yerel Geliştirme (opsiyonel)

Serverless fonksiyonları yerelde çalıştırmak için Vercel CLI gerekir:

```bash
npm i -g vercel
vercel dev
```

Yerel `.env.local` dosyası (commit etme!):

```
GEMINI_API_KEY=AIzaSy...
VITE_AI_VISION_ENABLED=true
VITE_AI_NUTRITION_ENABLED=true
```

> Not: Normal `npm run dev` (Vite) `/api/*` fonksiyonlarını **çalıştırmaz**.
> Bu yüzden yerelde AI denemek için `vercel dev` kullan. `npm run dev` ile
> arayüz yine açılır ama fotoğraf analizi demo moda düşer.

---

## Dosya Haritası

| Dosya | Sorumluluk |
|-------|------------|
| `api/_gemini.js` | Gemini API çağrısı + JSON ayrıştırma (paylaşılan yardımcı) |
| `api/_ai-prompts.js` | Tüm promptlar (maliyet optimize, tek yerde) |
| `api/ai-food-vision.js` | Fotoğraf → kalori (serverless endpoint) |
| `api/ai-food-text.js` | Metin → kalori (serverless endpoint) |
| `api/ai-nutrition-tips.js` | Profil → beslenme ipuçları; `?task=auto-programs` → antrenman + diyet |
| `api/_autoPrograms.js` | Otomatik program Gemini mantığı (ayrı route değil — Hobby 12-fn) |
| `src/services/aiVision.js` | Frontend: görsel küçültme + `/api/ai-food-vision` çağrısı |
| `src/services/aiAutoPrograms.js` | Frontend: `/api/ai-nutrition-tips?task=auto-programs` |
| `src/services/memberHealthSync.js` | Basic otomatik program oluşturma (AI + yedek) |
| `src/utils/autoProgramBuilders.js` | 15 günlük koç + diyet payload (`AUTO_PLAN_LENGTH`) |
| `src/components/onboarding/HealthTestHub.jsx` | Test sonrası **Sonuçlar** (AI özet + program kartları) |

---

## Basic — 15 günlük otomatik koç + diyet (sağlık testi sonrası)

> **Yalnızca Basic (`membership: free`).** Eko / Diyet / Spor / Doktor / Vip üyelerine otomatik AI koç+diyet programı **üretilmez**; programları personel (koç/diyetisyen) gönderir. Sağlık özeti (`healthAnalysis`) test tamamlanınca üretilmeye devam edebilir.

Sağlık testleri tamamlanıp onaylar kaydedilince `syncMemberHealthAssets` çalışır:

1. **Kural tabanlı özet** → `healthAnalysis` (VKİ, kalori, form skoru, test içgörüleri).
2. **Gemini beslenme ipuçları** → `dietitianRecommendations.tips` (varsa).
3. **15 günlük programlar** (`AUTO_PLAN_LENGTH = 15`):
   - **Antrenman:** `scheduleType: 'dateRange'`, `cycleStartDate` = bugün, `cycleLength: 15`, haftalık gün rotasyonu (`day`). Hareketler **yalnızca** `exercises` kütüphanesinden (`exerciseId` zorunlu; Gemini yalnızca aday id listesinden seçer).
   - **Beslenme:** aynı 15 günlük pencere, `cycleSameDaily: true` (her gün aynı menü).
4. Programlar `/programs` ve `/calendar` üzerinde görünür (`entryMatchesDate` + süre penceresi).
5. **Sonuçlar UI:** `/health-test` hub altında AI özet + program önizlemesi + Programlarım / Takvim linkleri.

**API:** `POST /api/ai-nutrition-tips?task=auto-programs` (ayrı Vercel route yok — Hobby 12-fn). Gemini yoksa veya katalog dışı id gelirse `buildWorkoutProgramFromLibrary` + `buildFallbackNutritionMeals` yedekleri kullanılır.

**Kaynak etiketi:** `source: 'auto_ai' | 'auto_rules'`, `staffId: null`, `staffName: 'Yeni Form'`.

Personel diyet listeleri hâlâ **14 gün** (`CYCLE_PLAN_LENGTH`); otomatik Basic planlar **15 gün** (`AUTO_PLAN_LENGTH`).

---

## Maliyet Optimizasyonu (otomatik uygulanan)

- **Görsel küçültme:** Fotoğraflar gönderilmeden önce maks. 1024px + JPEG %80
  ile sıkıştırılır → daha az giriş token.
- **Doğrudan JSON:** Model'den `responseMimeType: application/json` ile yanıt
  istenir → gereksiz açıklama metni üretilmez.
- **Düşük `maxOutputTokens`:** Vision 800, beslenme 500 token ile sınırlı.
- **Kısa promptlar:** `api/_ai-prompts.js` içinde net ve kısa tutulur.

Tipik bir fotoğraf analizi **~1500-2500 token** tüketir → ücretsiz katmanda
**bedava**, ücretli katmanda analiz başına **~$0.0003** (yani ~3.000 analiz ≈ $1).
