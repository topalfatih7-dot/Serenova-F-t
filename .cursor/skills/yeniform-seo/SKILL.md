# Yeni Form — SEO Mühendisliği Skill

## Tetikleyiciler
Bu skill'i şu durumlarda kullan:
- SEO, arama motoru optimizasyonu, anahtar kelime, sıralama, Google, GSC, schema, yapılandırılmış veri söz konusu olduğunda
- Yeni sayfa eklerken (meta tag, canonical, prerender, sitemap güncellemesi gerekir)
- Blog, içerik, E-E-A-T, backlink, GEO/AI arama görünürlüğü konularında
- `src/config/seo.js`, `src/data/seoServiceContent.js`, `scripts/prerender-seo.mjs`, `api/sitemap.js` değiştirildiğinde
- `/online-diyetisyen`, `/online-kocluk` veya başka public SEO sayfası değiştirildiğinde

---

## 1. Proje SEO Mimarisi

### Temel Dosyalar
| Dosya | Görev |
|-------|-------|
| `src/config/seo.js` | Merkezi SEO config: SEO obj, PAGE_SEO, schema builder'lar, slug fn |
| `src/data/seoServiceContent.js` | Hizmet sayfaları içerik (H1, H2, FAQ, CTA) |
| `src/components/seo/SeoHead.jsx` | Client-side meta/title/canonical yönetimi |
| `src/components/seo/JsonLd.jsx` | JSON-LD script enjeksiyonu |
| `src/components/seo/PublicRouteSeo.jsx` | Public route otomatik SEO |
| `scripts/prerender-seo.mjs` | Build sonrası static HTML shell üretir (Googlebot için) |
| `api/sitemap.js` | Dinamik sitemap.xml (blog + staff + static routes) |
| `public/robots.txt` | Crawler direktifleri |
| `index.html` | Global default meta (prerender override eder) |

### Prerender Mantığı
```
Build → prerender-seo.mjs → dist/{path}/index.html (title+canonical+H1+body)
Vercel → static file önce, rewrite sonra
Googlebot → static HTML (JS çalıştırmaz) → doğru içerik görür
```

**ÖNEMLİ**: Prerender `#seo-static-content` div'i CSS ile görsel olarak gizler ama DOM'da bırakır. Googlebot bunu okur. Bu cloaking **değildir** çünkü React render edilince aynı içerik görünür hale gelir.

---

## 2. Anahtar Kelime Haritası

### Birincil Hedefler (Yüksek Hacim / Yüksek Değer)
| Kelime | Aylık Arama | Niyet | Hedef Sayfa |
|--------|-------------|-------|-------------|
| online diyetisyen | ~15.000 | Satın alma | /online-diyetisyen |
| online koçluk | ~8.000 | Satın alma | /online-kocluk |
| online diyet | ~12.000 | Bilgi/Satın alma | /online-diyetisyen |
| online spor koçu | ~5.000 | Satın alma | /online-kocluk |
| online fitness koçu | ~3.000 | Satın alma | /online-kocluk |
| online beslenme danışmanlığı | ~4.000 | Bilgi/Satın alma | /online-diyetisyen |

### İkincil Hedefler (Long-tail / Yüksek Dönüşüm)
| Kelime | Hedef Sayfa | Durum |
|--------|-------------|-------|
| video görüşmeli diyetisyen | /online-diyetisyen | Mevcut içerikte var |
| kişiye özel beslenme programı | /online-diyetisyen | Mevcut içerikte var |
| online antrenman programı | /online-kocluk | Mevcut içerikte var |
| kilo verme diyetisyen | YOK → /beslenme/kilo-verme | **EKSİK** |
| PCOS diyeti | YOK → /beslenme/pcos | **EKSİK** |
| insülin direnci beslenmesi | YOK → /beslenme/insulin-direnci | **EKSİK** |
| sporcu beslenmesi | YOK → /beslenme/sporcu-beslenmesi | **EKSİK** |
| hamilelikte beslenme | YOK → /beslenme/hamilelik | **EKSİK** |
| evde antrenman programı | YOK → /online-kocluk/ev-antrenman | **EKSİK** |
| online diyetisyen fiyat 2026 | /membership | Güçlendirilmeli |

### Marka Aramaları
| Kelime | Hedef | Durum |
|--------|-------|-------|
| yeni form | / | OK |
| yeniform | / | OK |
| yeniform.com | / | OK |
| yeni form üyelik | /membership | OK |
| yeni form diyetisyen | /online-diyetisyen | OK |

---

## 3. Schema.org Durumu

### Mevcut Şemalar ✅
- `Organization` (landing) — alternateName, sameAs, logo
- `WebSite` (landing) — SearchAction potansiyeli var
- `FAQPage` (landing + service pages)
- `Service` (service pages)
- `Person` (staff profiles)
- `Article` (blog posts)
- `BreadcrumbList` — bazı sayfalarda

### Eksik / Güçlendirilmeli ⚠️
- `SearchAction` (WebSite schema'ya ekle — site içi arama)
- `LocalBusiness` veya `ProfessionalService` — online hizmet için `HealthAndBeautyBusiness`
- `Review` / `AggregateRating` — testimoniallar şema'ya dönüştür
- `VideoObject` — exercise videoları için
- `Event` — webinar/canlı seans duyuruları için
- `HowTo` — "Nasıl çalışır" bölümleri için
- `MedicalBusiness` veya `DietNutrition` — diyetisyen hizmet sayfası için

---

## 4. Teknik SEO Kontrol Listesi

### Critical (hemen düzelt)
- [ ] Sitemap `lastmod` tarihleri static route'lara eklenmeli (şu an yok)
- [ ] Video sitemap — exercise-thumbs public webp için image sitemap
- [ ] Staff E-E-A-T — biyografi, eğitim, sertifika alanları doldurulmalı
- [ ] Blog yazarı — staff ismi `author` field'ına bağlanmalı (Article schema)
- [ ] OG image boyutu doğrulama — 1200×630 zorunlu, mevcut /og-image.png kontrol edilmeli

### High Priority
- [ ] SearchAction schema (WebSite schema'ya sitelinks searchbox ekle)
- [ ] AggregateRating schema (testimonial/rating verisi şemaya dönüştür)
- [ ] Yeni hizmet sayfaları (kilo verme, PCOS, sporcu beslenmesi vb.)
- [ ] Blog yazıları için category/tag yapısı + URL optimizasyonu
- [ ] Internal linking otomasyonu — blog'dan service sayfalarına güçlü bağlar

### Medium Priority
- [ ] Core Web Vitals — LCP, CLS, FID ölçümü (PageSpeed Insights)
- [ ] Font preload optimizasyonu (Google Fonts şu an print media trick ile yükleniyor — ok)
- [ ] Image lazy loading audit
- [ ] Social sameAs genişletme (Twitter/X, YouTube, LinkedIn ekle)

---

## 5. İçerik Stratejisi (Sayfa Eklerken)

### Yeni SEO Sayfası Ekleme Adımları
1. `src/data/seoServiceContent.js`'e içerik objesini ekle
2. `src/config/seo.js` → `PAGE_SEO` objesine title/desc/keywords ekle
3. `api/sitemap.js` → `STATIC_ROUTES`'a ekle (priority, changefreq)
4. `scripts/prerender-seo.mjs` → `STATIC_SHELLS`'e ekle (title, desc, h1, body)
5. `public/robots.txt` → `Allow:` satırı ekle
6. Sayfada `<SeoHead>` ve `<JsonLd>` kullan
7. `npm run build` (prerender tetiklenir)
8. GSC'de URL Inspection → İndekslemeyi İste

### Blog Yazısı SEO Kuralları
- Title: `[Anahtar Kelime] — [Fayda] | Yeni Form` formatı
- Meta description: 150-160 karakter, CTA içermeli
- H1 = title değil, daha uzun/conversational
- H2'ler soru formatında (Google'ın "Diğer Sorular" bölümü için)
- Her blog yazısı en az 2 internal link içermeli (`/online-diyetisyen` veya `/online-kocluk`'a)
- `Article` JSON-LD `author` alanı → gerçek staff ismi (E-E-A-T)
- `datePublished` ve `dateModified` zorunlu

---

## 6. E-E-A-T (Deneyim, Uzmanlık, Otorite, Güvenilirlik)

YMYL (Your Money Your Life) kategorisindeyiz — sağlık ve beslenme. Google bu alanda çok sıkı değerlendirme yapar.

### E-E-A-T Sinyalleri (Uygula)
1. **Staff profilleri** → biyografi + eğitim + sertifika + lisans numarası görünür olmalı
2. **Sağlık sorumluluk reddi** — her içerik sayfasının altında görünür disclaimer
3. **Uzman reviewed** badge — blog yazıları diyetisyen/koç tarafından onaylanmış gösterilmeli
4. **Gerçek vaka çalışmaları** — başarı hikayeleri sayfası (/stories) güçlendirilmeli
5. **Kullanıcı yorumları** — AggregateRating schema ile göster
6. **Güven rozetleri** — lisans numaraları, akreditasyonlar footer'a ekle

---

## 7. GEO (AI Arama Optimizasyonu) — 2026 Trendi

ChatGPT, Gemini, Perplexity gibi AI araçları artık doğrudan cevap veriyor. Yeni Form bu cevaplarda yer almalı.

### GEO Stratejisi
1. **Soru-cevap formatı** — H2'leri soru olarak yaz: "Online diyetisyen ne kadar tutar?"
2. **FAQ şemasını genişlet** — her servis sayfasında en az 8 FAQ
3. **Özlü cevaplar** — ilk 2 satır net cevap ver (AI bu kısmı alıntılar)
4. **Sayısal veriler** — fiyat aralığı, seans sayısı, süreler spesifik belirt
5. **Atıflar** — sağlık iddialarına kaynak göster (WHO, TDD — Türk Diyetisyenler Derneği)
6. **`speakable` schema** — podcast/ses aramaları için kritik bilgileri işaretle

---

## 8. Rakip Analizi (Türkiye Online Diyetisyen/Koçluk)

### Bireysel Diyetisyen Siteleri (Düşük Otori, Yüksek Spesifik)
- `onlinediyetisyenyusuf.com` — 42.000+ danışan, güçlü kişisel marka
- `dytasliakturk.com.tr` — 2026 fiyat rehberi içeriği, long-tail odaklı

### Platform Rakipler (Yüksek Otorite)
- DoktorTakvim, Doctorane — genel sağlık, diyetisyen kategorisi var
- Wellbeing platformları (genel sağlık app'leri)

### Yeni Form Avantajları
1. **Video görüşme** — rakiplerin çoğu WhatsApp/e-posta bazlı
2. **Koç + Diyetisyen birlikte** — VIP paket benzeri rakipte yok
3. **Sağlık skoru AI** — GPT-5.4 ile kişisel sağlık analizi benzersiz
4. **Platform entegrasyonu** — program + takvim + kalori tek sistemde

---

## 9. Anahtar Schema Builder'lar

```javascript
// Servis sayfası için tam schema seti
import {
  buildServiceSchema,
  buildFaqSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from '../../config/seo'

// Staff profil için
import { buildPersonSchema } from '../../config/seo'

// Blog için
import { buildArticleSchema } from '../../config/seo'
```

---

## 10. Performans Hedefleri (KPI)

| Metrik | Şu An (Tahmini) | Hedef (3 ay) | Hedef (6 ay) |
|--------|-----------------|--------------|--------------|
| "online diyetisyen" pozisyon | 20-50 arası | Top 10 | Top 5 |
| "online koçluk" pozisyon | 20-50 arası | Top 10 | Top 5 |
| Organik tıklama (GSC) | baseline | +%150 | +%400 |
| İndekslenen sayfa sayısı | ~30 | ~80 | ~150 |
| Core Web Vitals LCP | bilinmiyor | < 2.5s | < 2.0s |
| Blog yazısı sayısı | mevcut | +30 | +90 |

---

## 11. Aylık SEO Kontrol Listesi

### Haftalık
- [ ] GSC Performance → impression + pozisyon değişimi izle
- [ ] GSC Coverage → yeni indekslenen/hata sayfaları
- [ ] Blog kalitesi → AI içeriğini staff review et

### Aylık
- [ ] Core Web Vitals raporu (PageSpeed Insights)
- [ ] Backlink profili (GSC → Bağlantılar)
- [ ] Yeni anahtar kelime fırsatları (GSC Queries → pozisyon 11-20 arası)
- [ ] Rakip sayfa değişiklikleri
- [ ] Sitemap URL sayısı kontrolü

---

## 12. Acil Yapılacaklar (Bu Sprint)

1. **Sitemap `lastmod`** → static routes'a deploy tarihi ekle
2. **`SearchAction`** → WebSite schema'ya ekle
3. **`AggregateRating`** → Testimonial verilerini schema'ya bağla
4. **Yeni hizmet sayfaları** → kilo verme + sporcu beslenmesi
5. **Blog author E-E-A-T** → Article schema author = staff name
6. **Social sameAs** → en az 3 platform BRAND.socialUrls'e ekle
7. **FAQ genişletme** → her servis sayfası 8+ soru
