# Yeni Form — SEO Master Plan (2026)

> **Hazırlanma:** 2026-07-30 · **Güncelleme:** 2026-08-13 · **Site:** https://www.yeniform.com  
> **Hedef:** Türkiye'de "online diyetisyen" ve "online koçluk" aramalarında rakiplerin önüne geç, AI arama araçlarında (GEO) görünür ol.  
> **Uygulama checklist:** [`SEO_SAYFA_EKLEME.md`](SEO_SAYFA_EKLEME.md) · skill: `.cursor/skills/yeniform-seo/`

---

## BÖLÜM 1: MEVCUT DURUM TESPİTİ

### 1.1 Teknik SEO Skor Kartı

| Kontrol | Durum | Öncelik |
|---------|-------|---------|
| Sitemap.xml (200 OK) | ✅ Çalışıyor | — |
| robots.txt | ✅ Doğru yapılandırılmış | — |
| Canonical tag (her sayfada) | ✅ Mevcut | — |
| Prerender (Googlebot için HTML) | ✅ Çalışıyor | — |
| Meta title/description | ✅ Her sayfada | — |
| OG / Twitter Card | ✅ Mevcut | — |
| JSON-LD (Organization, WebSite, FAQ, Service) | ✅ Mevcut | — |
| HTML lang="tr" | ✅ Doğru | — |
| HTTPS | ✅ | — |
| Mobile-first (Tailwind responsive) | ✅ | — |
| GA4 + Consent Mode v2 | ✅ | — |
| GSC mülk + sitemap gönderildi | ✅ | — |
| Sitemap `lastmod` (static routes) | ✅ Marketing route’larda var | — |
| SearchAction schema | ✅ WebSite; `/blog?q=` UI zorunlu | — |
| AggregateRating | ✅ Yalnızca gerçek testimonial (n≥5) | — |
| Video sitemap | ❌ Eksik | ORTA |
| Image alt tag denetimi | ⚠️ Denetlenmedi | ORTA |
| Core Web Vitals ölçümü | ⚠️ Ölçülmedi | YÜKSEK |
| Staff biyografi/sertifika (E-E-A-T) | ⚠️ Zayıf | KRİTİK |
| Social sameAs (sadece Instagram) | ⚠️ 1 platform | ORTA |
| Blog E-E-A-T (yazar = staff) | ❌ Eksik | YÜKSEK |
| Koşul/hedef bazlı alt sayfalar | ❌ Yok | KRİTİK |
| Şehir/bölge sayfaları | ❌ Yok | YÜKSEK |

---

### 1.2 İçerik Boşluğu Analizi

**Mevcut public sayfalar:**
- `/` — Ana sayfa
- `/online-diyetisyen` — Hizmet sayfası ✅
- `/online-kocluk` — Hizmet sayfası ✅
- `/membership` — Fiyatlandırma
- `/hakkimizda` — Hakkında
- `/blog` + `/blog/:slug` — Blog
- `/team/coaches`, `/team/dietitians`, `/team/doctors` — Ekip
- `/stories` — Başarı hikayeleri
- `/corporate` — Kurumsal

**Kritik eksik SEO sayfaları:**

| Eksik Sayfa | Hedef Kelime | Aylık Arama | Öncelik |
|-------------|--------------|-------------|---------|
| /kilo-verme | "kilo verme diyetisyen", "kilo vermek için ne yapmalı" | ~20.000 | 🔴 KRİTİK |
| /beslenme/sporcu-beslenmesi | "sporcu beslenmesi", "sporcu diyeti" | ~5.000 | 🔴 KRİTİK |
| /beslenme/pcos | "PCOS diyeti", "polikistik over beslenme" | ~3.000 | 🟠 YÜKSEK |
| /beslenme/insulin-direnci | "insülin direnci beslenmesi" | ~4.000 | 🟠 YÜKSEK |
| /beslenme/hamilelik | "hamilelikte beslenme" | ~6.000 | 🟠 YÜKSEK |
| /online-kocluk/ev-antrenman | "evde antrenman programı" | ~8.000 | 🟠 YÜKSEK |
| /online-kocluk/kadin | "kadınlar için online koçluk" | ~2.000 | 🟡 ORTA |
| /online-diyetisyen/fiyat | "online diyetisyen fiyat" | ~3.000 | 🟡 ORTA |
| /saglik-analizi | "kişisel sağlık analizi online" | ~1.500 | 🟡 ORTA |

---

### 1.3 Rakip Analizi

**Doğrudan Rakipler (Online Diyetisyen):**

| Rakip | Güçlü Yönler | Zayıf Yönleri |
|-------|-------------|---------------|
| onlinediyetisyenyusuf.com | 42.000+ danışan (sosyal kanıt güçlü), kişisel marka | Tek kişi (ölçeklenemez), video görüşme yok |
| dytasliakturk.com.tr | 2026 fiyat içeriği, long-tail odaklı | Bireysel klinik, platform yok |
| Bireysel diyetisyen siteleri | Niş uzmanlık (PCOS, sporcu vb.) | Platform entegrasyonu yok |

**Platform Rakipler:**
| Rakip | Fark | Yeni Form Avantajı |
|-------|------|-------------------|
| DoktorTakvim / Doctorane | Genel sağlık, randevu | Koç + diyetisyen + AI program birlikte |
| Wellness uygulamaları | Uluslararası (İngilizce), genel | Türkçe, video görüşme, sağlık skoru |

**Yeni Form'un Rakipsiz Unsurları:**
1. ✅ Platform içi **video görüşme** (Daily.co) — WhatsApp bazlı rakiplere karşı büyük avantaj
2. ✅ **GPT-5.4 sağlık skoru** — 8 boyutlu AI sağlık analizi, rakiplerde yok
3. ✅ **Koç + Diyetisyen bir arada** (VIP) — benzeri platforma göre fark yaratan
4. ✅ **Egzersiz video kütüphanesi** — programa entegre, rakiplerde yok
5. ✅ **Kalori AI** (fotoğraf + metin) — kullanıcı tutma özelliği

---

## BÖLÜM 2: ANAHTAR KELİME HARİTASI

### 2.1 Birincil Hedef Kümesi (Ana Sayfalar)

```
/                    → "yeni form", "yeniform", "online koçluk platformu"
/online-diyetisyen   → "online diyetisyen", "online diyet", "online beslenme danışmanlığı"
/online-kocluk       → "online koçluk", "online spor koçu", "online fitness koçu"
/membership          → "online diyetisyen fiyat", "online koçluk fiyat", "diyet paketi"
```

### 2.2 İkincil Hedef Kümesi (Yeni Sayfalar)

```
/kilo-verme                   → "kilo verme diyeti", "kilo vermek için diyetisyen"
/beslenme/sporcu              → "sporcu beslenmesi", "sporcu diyeti programı"
/beslenme/pcos                → "PCOS diyeti", "polikistik yumurtalık beslenme"
/beslenme/insulin-direnci     → "insülin direnci diyeti", "insülin direnci beslenme"
/beslenme/hamilelik           → "hamilelikte beslenme", "gebelikte diyet"
/online-kocluk/ev-antrenman   → "evde antrenman programı", "ekipmansız antrenman"
```

### 2.3 Blog Konuları (Long-tail Intent)

**Hazır yazılabilecek yüksek değerli konular:**

| Başlık | Hedef Kelime | Arama Hacmi |
|--------|-------------|-------------|
| "İnsülin Direncinde Beslenme: Uzman Rehberi" | insülin direnci beslenme | ~4.000/ay |
| "PCOS Diyeti: Neler Yemeli, Nelerden Kaçınmalı?" | PCOS diyeti | ~3.000/ay |
| "Sporcu Beslenmesi: Antrenman Öncesi ve Sonrası" | sporcu beslenmesi | ~5.000/ay |
| "Evde Antrenman Programı: Ekipmansız 4 Haftalık Plan" | evde antrenman | ~8.000/ay |
| "Online Diyetisyen mi Yüz Yüze Diyetisyen mi?" | online diyetisyen | ~15.000/ay |
| "Kilo Vermenin 7 Bilimsel Yolu" | kilo verme yolları | ~12.000/ay |
| "Kalori Hesaplama Rehberi: BMR ve TDEE Nedir?" | kalori hesaplama | ~10.000/ay |
| "Online Koçluk Nedir? Faydaları ve Nasıl Çalışır?" | online koçluk nedir | ~3.000/ay |
| "2026 Online Diyetisyen Fiyatları" | online diyetisyen fiyat 2026 | ~3.000/ay |
| "Beslenme Programı Neden PDF'ten Fazlasını Gerektirir?" | online beslenme programı | ~2.000/ay |

### 2.4 LSI Kelimeler (Semantik Zenginlik)

**Online Diyetisyen Sayfası İçin:**
- beslenme uzmanı, diyetisyen randevu, diyet programı, kalori hesaplama, öğün planı,
- sağlıklı beslenme, kilo kontrolü, besin değeri, metabolizma, su içmek, protein alımı,
- Türkiye diyetisyen, lisanslı diyetisyen, RD (Registered Dietitian), diyet danışmanlığı

**Online Koçluk Sayfası İçin:**
- fitness koçu, personal trainer, PT, antrenman programı, spor egzersiz, kas yapmak,
- kilo vermek, form almak, güçlenmek, kondisyon, dayanıklılık, esneklik,
- ev egzersizi, gym programı, ağırlık antrenmanı, kardiyo, HIIT

---

## BÖLÜM 3: TEKNİK SEO EYLEM PLANI

### 3.1 Acil (Bu Hafta) 🔴

#### A. Sitemap `lastmod` Ekle
**Dosya:** `api/sitemap.js`  
Static route'lara son deployment tarihini ekle. Her deploy'da güncellenmeli.

#### B. SearchAction Schema
**Dosya:** `src/config/seo.js` → `buildWebSiteSchema()`  
WebSite schema'ya `potentialAction` ekle:
```json
{
  "@type": "SearchAction",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://www.yeniform.com/blog?q={search_term_string}"
  },
  "query-input": "required name=search_term_string"
}
```

#### C. AggregateRating Schema
Landing page testimonialları varsa rating verisi toplanmalı → `AggregateRating` schema ekle.

#### D. Blog Article Author = Staff
**Dosya:** `api/_ai-prompts.js` veya blog generate logic  
Blog yazıları belirli bir staff üyesinin adıyla imzalanmalı → Article JSON-LD `author` field.

---

### 3.2 Kısa Vadeli (2 Hafta) 🟠

#### E. E-E-A-T: Staff Profil Güçlendirmesi
Her staff üyesinin profilinde olması gerekenler:
- Tam biyografi (200+ kelime)
- Eğitim bilgileri (okul, mezuniyet yılı)
- Sertifikalar ve lisans numarası
- Uzmanlık alanları (specialties array)
- Profesyonel fotoğraf

Bu veriler `Person` JSON-LD'ye otomatik girer (`buildPersonSchema`).

#### F. FAQ Genişletme (Her Servis Sayfasında 8+)
`src/data/seoServiceContent.js` → `faqs` array'ini 4'ten 8-10'a çıkar.  
Sorular "Soru formatında" olmalı (Google SERP'te "Diğer Sorular" için).

**Online Diyetisyen Ek FAQ'ları:**
- "Online diyetisyen güvenilir mi?"
- "Online diyetisyen programı ne kadar sürer?"
- "İlk seansta neler konuşulur?"
- "Diyetisyen programını takip etmek kolay mı?"

**Online Koçluk Ek FAQ'ları:**
- "Online koç ile yüz yüze koç arasındaki fark nedir?"
- "Ekipman olmadan online koçluk olur mu?"
- "Online antrenman programı salona göre ne kadar etkili?"

#### G. Core Web Vitals Denetimi
```bash
# PageSpeed Insights ile ölç:
https://pagespeed.web.dev/report?url=https://www.yeniform.com
https://pagespeed.web.dev/report?url=https://www.yeniform.com/online-diyetisyen
```

Hedefler:
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- FID/INP (Interaction to Next Paint): < 200ms

#### H. Sosyal Medya sameAs Genişletme
`src/config/brand.js` → `BRAND_SOCIAL_LINKS` ve `manualSocialUrls`'e ekle:
- Twitter/X: `https://twitter.com/yeniform` (açılmalı)
- LinkedIn şirket sayfası
- YouTube kanalı (içerik video'ları için)

---

### 3.3 Orta Vadeli (1 Ay) 🟡

#### I. Yeni Hizmet Sayfaları Oluştur

**Öncelik Sırası:**
1. `/kilo-verme` — En yüksek arama hacmi
2. `/beslenme/sporcu-beslenmesi`
3. `/beslenme/insulin-direnci`
4. `/beslenme/pcos`
5. `/online-kocluk/ev-antrenman`

Her sayfa için:
- `src/data/seoServiceContent.js`'e içerik obje ekle
- H1, H2 bölümleri, FAQ, CTA, related links
- `Service` JSON-LD
- Prerender shell
- Sitemap'e ekle

#### J. Video Sitemap
`api/sitemap.js`'e video sitemap namespace ekle veya ayrı `api/video-sitemap.js`.  
Exercise video thumbnailları (public webp) için `ImageSitemap`.

#### K. İnfografik/Görsel SEO
- Beslenme tabloları → görsel + alt text optimize
- OG image'ları sayfa bazlı (her hizmet sayfası kendi OG görseline sahip olmalı)
- WebP format tüm görseller

---

### 3.4 Uzun Vadeli (3 Ay) 🟢

#### L. Şehir Sayfaları (Opsiyonel)
Online hizmet olmasına rağmen kullanıcılar şehir bazlı arar:
- `/istanbul/online-diyetisyen` → "istanbul online diyetisyen"
- `/ankara/online-diyetisyen` → "ankara online diyetisyen"
- `/izmir/online-diyetisyen` → "izmir online diyetisyen"

Bu sayfalar aynı içerik ama şehir spesifik opening paragraph ile.

#### M. Multilingual (Opsiyonel)
Türkiye'deki expat market + yurtdışı Türkler:
- `/en/online-dietitian`
- `hreflang` tags

---

## BÖLÜM 4: İÇERİK STRATEJİSİ

### 4.1 Blog Editoryal Takvim

**Frekans:** Günlük AI üretim (mevcut cron) + Haftada 1 insan editör onayı

**Aylık Tema Planı:**
```
Ağustos 2026:  Kilo Yönetimi + Yaz Beslenme
Eylül 2026:    Spor Sezonu Başlangıcı + Antrenman
Ekim 2026:     Sonbahar Sağlığı + Bağışıklık
Kasım 2026:    Sağlıklı Tarif + Pratik Öğünler
Aralık 2026:   Yılbaşı Dönemi Beslenme + Yeni Yıl Hedefleri
```

**Her Blog Yazısı Kontrol Listesi:**
- [ ] Title: 50-60 karakter, anahtar kelime başta
- [ ] Meta description: 150-160 karakter, CTA içeriyor
- [ ] H1: Title'dan farklı, conversational
- [ ] H2'ler: Soru formatında (en az 3)
- [ ] İç bağlantı: En az 2 (/online-diyetisyen veya /online-kocluk'a)
- [ ] Yazar: Gerçek staff ismi (E-E-A-T)
- [ ] Kaynak: Sağlık iddialarına link/atıf
- [ ] CTA: Yazı sonunda paket veya kayıt linki
- [ ] Görsel: En az 1, alt text optimize

### 4.2 İçerik Kümeleme (Topic Clustering)

**Pillar Page** → **Cluster Pages** yapısı:

```
/online-diyetisyen (PILLAR)
  ├── /beslenme/kilo-verme
  ├── /beslenme/pcos
  ├── /beslenme/insulin-direnci
  ├── /beslenme/hamilelik
  ├── /beslenme/sporcu-beslenmesi
  └── Blog: "Diyetisyen Seçerken Dikkat Edilecekler"

/online-kocluk (PILLAR)
  ├── /online-kocluk/ev-antrenman
  ├── /online-kocluk/kadin-fitness
  ├── /online-kocluk/baslangic
  └── Blog: "Koç ile 3 Ayda Forma Girmek"
```

---

## BÖLÜM 5: E-E-A-T (YMYL) STRATEJİSİ

### 5.1 Neden Kritik?

Yeni Form **YMYL** (Your Money or Your Life) kategorisindedir — sağlık ve beslenme tavsiyeleri verilmektedir. Google bu kategoride **E-E-A-T** sinyallerine çok daha büyük ağırlık verir.

### 5.2 E-E-A-T Güçlendirme Eylemleri

**Deneyim (Experience):**
- ✅ Gerçek üye başarı hikayelerini (/stories) SEO optimize et
- ✅ Case study formatında: "X kilo verdi, 3 ay koçluk"
- ✅ Before/after içerik (etik sınırlar içinde)

**Uzmanlık (Expertise):**
- ⚠️ Her staff üyesi: lisans numarası, mezun olduğu üniversite, uzmanlık alanı
- ⚠️ Blog yazıları diyetisyen onayı rozeti
- ⚠️ Medikal/beslenme iddialarında TDD (Türk Diyetisyenler Derneği) referansı

**Otorite (Authoritativeness):**
- ⚠️ Medyada yer alma → press room sayfası (/basin)
- ⚠️ Doğrusal backlink hedefleri: Milliyet Sağlık, Hürriyet Sağlık, NTV Sağlık
- ⚠️ Guest post: sağlık/fitness bloğu ortak içerikler

**Güvenilirlik (Trustworthiness):**
- ✅ KVKK + gizlilik politikaları mevcut
- ✅ Sağlık sorumluluk reddi (/legal/saglik-sorumluluk-reddi)
- ⚠️ Footer'a: "Tüm diyetisyenler Türk Diyetisyenler Derneği üyesidir" gibi badge
- ⚠️ SSL + güvenlik rozetleri
- ⚠️ Medya logoları (varsa)

---

## BÖLÜM 6: GEO — AI ARAMA OPTİMİZASYONU

### 6.1 AI Araç Davranışı

2026 itibarıyla kullanıcıların %40'ı Google yerine ChatGPT/Gemini/Perplexity'de sorgu başlatıyor. Bu araçlar:
1. Web'i tarayıp özetliyor
2. Spesifik, otoriter kaynakları alıntılıyor
3. Soru-cevap formatına uygun içeriği tercih ediyor

### 6.2 GEO Uygulama Stratejisi

**A. Soru-Cevap Yoğun İçerik:**
Her hizmet sayfasının ilk paragrafı: net, kısa, sorulara doğrudan cevap.

Örnek:
> ❌ "Yeni Form platformu, kullanıcılarına online diyetisyen hizmeti sunmaktadır..."
> ✅ "Online diyetisyen, evinizden video görüşme ile beslenme programı almaktır. Yeni Form'da ayda 2 diyetisyen seansı vardır; fiyat 1.299 TL/aydan başlar."

**B. Speakable Schema:**
```javascript
{
  "@context": "https://schema.org/",
  "@type": "WebPage",
  "name": "Online Diyetisyen",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".speakable-intro", ".faq-section"]
  }
}
```

**C. Fiyat Şeffaflığı:**
AI araçlar somut fiyat sorularına cevap arar. Membership sayfasında net fiyat + paket karşılaştırması → AI'ın bu veriyi alıntılamasını sağlar.

**D. Yapılandırılmış Veri Zenginliği:**
Mevcut şemaları güçlendir:
- `FAQPage` → her sayfada 8-10 soru
- `HowTo` → "Süreç nasıl işler" bölümleri için
- `Service` → `offers` ile fiyat bilgisi

---

## BÖLÜM 7: BACKLINK STRATEJİSİ

### 7.1 Hedef Backlink Kategorileri

**Tier 1 — Yüksek Otorite TR Medya:**
| Hedef | Taktik |
|-------|--------|
| Milliyet Sağlık | Guest post: "Online Diyetisyen ile Sağlıklı Kilo Verme" |
| Hürriyet Cadde | İnfografik paylaşım: "2026 Beslenme Trendleri" |
| NTV Sağlık | Uzman görüşü: Diyetisyen yorumları |
| Sabah Yaşam | Press release: platform lansmanı/başarı hikayesi |

**Tier 2 — Sağlık/Fitness Blogları:**
- 10-20 TR wellness blog'u → konuk yazı
- Mevcut staff profil LinkedIn → platform linki
- Diyetisyen/koç sosyal medya → web sitesi linki

**Tier 3 — Dizin ve Listeler:**
- Google İşletme Profili (online hizmet için)
- Türkiye sağlık platformları dizini
- Startup/tech dizinleri (platform olarak)

### 7.2 Link Building İçerik Fikirleri

1. **"2026 Online Diyetisyen Rehberi"** → PDF/infografik → medyada paylaşılır
2. **"Türkiye'nin Online Wellness Raporu"** → data-driven, PR dostu
3. **Ücretsiz araçlar** (kalori hesaplama sayfası public versiyonu) → backlink mıknatısı
4. **Staff profil sayfa içeriği** → LinkedIn'de paylaşım → siteye trafik + otorite

---

## BÖLÜM 8: ÖLÇÜM ve RAPORLAMA

### 8.1 Temel KPI'lar

**Google Search Console (Haftalık):**
- Toplam impression + tıklama (WoW değişim)
- "online diyetisyen" ortalama pozisyon
- "online koçluk" ortalama pozisyon
- İndekslenen sayfa sayısı

**Google Analytics 4 (Haftalık):**
- Organik trafik sessions
- Organik → Kayıt dönüşüm oranı
- Landing page engagement rate
- Blog sayfaları scroll depth

**Core Web Vitals (Aylık):**
- LCP hedef: < 2.5s
- CLS hedef: < 0.1
- INP hedef: < 200ms

### 8.2 Başarı Kriterleri

| Zaman Dilimi | Hedef |
|--------------|-------|
| 1. Ay | Teknik SEO eksikleri giderildi, 5 yeni blog yazısı yayında |
| 2. Ay | /online-diyetisyen pozisyon < 20, sitemap URL sayısı > 80 |
| 3. Ay | Organik tıklama +%150, 3 yeni hizmet sayfası canlı |
| 6. Ay | "online diyetisyen" top 5, organik trafik +%400 |
| 12. Ay | Sürdürülebilir aylık 10.000+ organik ziyaret |

---

## BÖLÜM 9: SPRINT PLANI

### Sprint 1 (Bu Hafta — 30 Temmuz – 5 Ağustos)
- [ ] Sitemap `lastmod` düzeltmesi (`api/sitemap.js`)
- [ ] `SearchAction` schema ekleme (`src/config/seo.js`)
- [ ] `AggregateRating` schema ekleme (testimoniallar varsa)
- [ ] FAQ genişletme: /online-diyetisyen → 8 soru, /online-kocluk → 8 soru
- [ ] Blog Article schema `author` → gerçek staff ismi
- [ ] GSC URL Inspection: / + /online-diyetisyen + /online-kocluk doğrula

### Sprint 2 (6–19 Ağustos)
- [ ] Staff E-E-A-T: Bio, eğitim, sertifika alanları admin panelinde doldur
- [ ] PageSpeed Insights denetimi → CWV düzeltmeleri
- [ ] Sosyal sameAs genişletme (Twitter/X + LinkedIn)
- [ ] /kilo-verme sayfası içerik + prerender + sitemap
- [ ] 10 blog yazısı: kilo yönetimi temalı

### Sprint 3 (20 Ağustos – 2 Eylül)
- [x] /beslenme/sporcu-beslenmesi sayfası ✅
- [x] /online-kocluk/ev-antrenman sayfası ✅
- [ ] Video sitemap / image sitemap ekle
- [ ] Backlink outreach başlat (5 TR sağlık bloğu)
- [ ] GSC coverage raporu → hata sayfaları düzelt

### Sprint 4 (28 Ağustos – Eylül) — TAMAMLANDI
- [x] /beslenme/pcos sayfası ✅ (2026-08-28)
- [x] /beslenme/insulin-direnci sayfası ✅ (2026-08-28)
- [x] /online-wellness sayfası ✅ (2026-08-28)
- [x] Mevcut sayfalar güçlendirildi: "online spor koçluğu", "online zayıflama", "online antrenman" keywords ✅
- [x] llms.txt güncellendi (GEO / AI crawler) ✅
- [x] Sitemap genişletildi (9 → 12 cluster URL) ✅
- [ ] Blog kalite denetimi: AI yazılar → staff onayı workflow
- [ ] Medya outreach başlat
- [ ] İlk aylık SEO raporu

---

## BÖLÜM 10: HIZLI REFERANS

### Yeni SEO Sayfası Ekleme Kontrol Listesi
```
□ seoServiceContent.js → içerik objesi
□ src/config/seo.js → PAGE_SEO girişi
□ api/sitemap.js → STATIC_ROUTES
□ scripts/prerender-seo.mjs → STATIC_SHELLS
□ public/robots.txt → Allow satırı
□ App.jsx → Route tanımı
□ Sayfada <SeoHead> + <JsonLd>
□ npm run build (prerender çalışır)
□ git commit + vercel deploy
□ GSC → URL Inspection → İndekslemeyi İste
```

### Prerender Shell Şablonu
```javascript
'/yeni-sayfa': {
  title: 'Anahtar Kelime — Fayda | Yeni Form',
  description: '150-160 karakter. Anahtar kelime içermeli. CTA ile bitmeli.',
  h1: 'H1: Conversational, anahtar kelime içeren başlık',
  body: `<p>Lead paragraph — anahtar kelime ilk cümlede.</p>
<h2>Section başlığı</h2>
<p>İçerik...</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/membership">Paketler</a></p>`,
},
```

### JSON-LD Örnek: Yeni Sayfa
```javascript
buildServiceSchema({
  name: 'Kilo Verme Diyetisyen Desteği',
  description: 'Online diyetisyen ile kişiye özel kilo verme programı...',
  path: '/kilo-verme',
  serviceType: 'WeightManagement',
  offers: [
    { name: 'Diyet Paketi', path: '/membership', description: '...' },
  ],
})
```
