# SEO & Google Search Console — Yeni Form (yeniform.com)

> **Canonical site:** https://www.yeniform.com  
> **Sitemap:** https://www.yeniform.com/sitemap.xml  
> **OG görsel:** https://www.yeniform.com/og-image.png (1200×630 PNG)  
> **Vercel proje:** `topalfatih7-3924s-projects/serenova-f-t`  
> **Son güncelleme:** 2026-07-06 (UX navigasyon, GA4 Consent Mode, blog slug)

`yeniform.com` → `www.yeniform.com` **308 Permanent Redirect** (doğrulandı).

---

## Durum özeti

### Tamamlanan

| Alan | Durum |
|------|--------|
| `VITE_SITE_URL` + `APP_URL` | ✅ Vercel (Production, Preview, Development) |
| `robots.txt` + `/sitemap.xml` | ✅ Canlı — dinamik (blog slug + kadro) |
| Search Console DNS doğrulama | ✅ |
| Sitemap gönderimi + dizin isteği | ✅ |
| **`public/og-image.png`** | ✅ SEO sosyal paylaşım görseli |
| **`public/brand-logo.png`** | ✅ Navbar, giriş, JSON-LD logo |
| **`BrandLogo.jsx`** | ✅ Gerçek logo PNG kullanıyor |
| Favicon + apple-touch-icon | ✅ `brand-logo-alt.png` kaynağından üretildi |
| Blog seed (5) + kadro (2) | ✅ Sitemap'te |
| **GA4 Consent Mode v2** | ✅ `ga4Loader.js` — çerez onayı sonrası yükleme |
| **Blog SEO slug URL** | ✅ `/blog/yazi-basligi` (+ UUID geriye dönük) |
| **Üyelik FAQ schema** | ✅ `/membership` JSON-LD |
| **Hero video poster** | ✅ `prefers-reduced-motion` + `prefers-reduced-data` |

### Sizin yapmanız gereken

| # | Görev | Süre |
|---|--------|------|
| 1 | **Deploy** — logo + og-image değişikliklerini Vercel'e gönder | 5 dk |
| 2 | **OG debugger** — Facebook + LinkedIn → Scrape Again | 5 dk |
| 3 | **Search Console** — sitemap “Başarılı” mı kontrol | 24–48 saat |
| 4 | **GA4 Data API** → Vercel `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_JSON` (§9 Adım A + admin analitik) | 15 dk |
| 5 | **Sosyal medya URL'leri** → Vercel env veya `brand.js` (§9 Adım B) | 5 dk |
| 6 | Kadro fotoğrafları | Admin `/admin/staff` |

Detaylı teknik referans: `AI_PROJE_REHBERI.md` §23, §24, §29.

---

## 1. Marka görselleri — hangisi ne işe yarar?

| Dosya | SEO gerekli mi? | Nerede kullanılır |
|-------|:---------------:|-------------------|
| **`og-image.png`** | **Evet** | WhatsApp, Facebook, LinkedIn, Twitter paylaşım önizlemesi |
| `brand-logo.png` | Kısmen | Site navbar; Organization JSON-LD `logo` alanı |
| `brand-mark.png` | Hayır | PWA manifest ikonu |
| `favicon-32.png` | Hayır | Tarayıcı sekmesi |
| `apple-touch-icon.png` | Hayır | iPhone ana ekran kısayolu |
| `brand-logo-alt.png` | Hayır | **Kaynak dosya** — siz düzenlersiniz |

### Logo güncelleme

1. `public/brand-logo-alt.png` dosyasını değiştirin
2. Terminal:
   ```powershell
   npm run og:image
   ```
3. Vercel'e **deploy** edin

Bu komut tüm türev dosyaları yeniden üretir.

---

## 2. Ortam değişkenleri (Vercel)

| Değişken | Değer | Ortamlar |
|----------|-------|----------|
| `VITE_SITE_URL` | `https://www.yeniform.com` | Production, Preview, Development |
| `APP_URL` | `https://www.yeniform.com` | Production, Preview, Development |
| `VITE_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Production, Preview (GA4 kurulunca) |
| `VITE_SOCIAL_INSTAGRAM` vb. | Tam profil URL'leri | Production (opsiyonel) |

Env değişince bir kez redeploy.

---

## 3. Google Search Console ✅

- Property: `https://www.yeniform.com` (DNS TXT — Turhost)
- Sitemap: `sitemap.xml` gönderildi
- Ana sayfa dizin isteği gönderildi

**Kontrol:** Dizin oluşturma → Site haritaları → durum **Başarılı** (24–48 saat).

---

## 4. OG (Open Graph) testi

1. [Facebook Debugger](https://developers.facebook.com/tools/debug/)
2. URL: `https://www.yeniform.com`
3. **Scrape Again** — `og-image.png` görünmeli
4. [LinkedIn Inspector](https://www.linkedin.com/post-inspector/) — aynı URL

Deploy sonrası test edin; eski görsel cache'lenmiş olabilir.

---

## 5. robots.txt

Canlı: https://www.yeniform.com/robots.txt

---

## 6. Sıralama için içerik

1. Blog — haftada 1–2 uzun yazı (800+ kelime)
2. Başarı hikayeleri — `/admin/content`
3. Kadro profilleri — `/admin/staff`
4. Backlink / sosyal paylaşım

---

## 7. Hızlı kontrol listesi

- [x] `og-image.png` — SEO sosyal görsel
- [x] `brand-logo.png` — site logosu
- [x] `BrandLogo.jsx` — PNG logo
- [x] JSON-LD Organization logo
- [x] Favicon + apple-touch-icon
- [x] Vercel SEO env
- [x] Search Console doğrulama
- [ ] **Deploy** (GA4 aktif olması için)
- [ ] Facebook/LinkedIn OG testi
- [ ] Sitemap **Başarılı**
- [x] GA4 — `G-40ENH7MC5W` (`brand.js`) + Consent Mode (`ga4Loader.js`)
- [ ] GA4 Data API — `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_JSON` (admin `/admin/analytics`)
- [ ] Sosyal medya — Vercel env veya `brand.js`

---

## 8. Sizden istenen bilgiler — adım adım nasıl alınır?

Aşağıdaki bilgileri toplayıp bana sohbette yapıştırın; kod tarafını ben güncellerim.

---

### Adım A — Google Analytics 4 (GA4) Measurement ID

**Ne işe yarar:** Ziyaretçi sayısı, hangi sayfalar görüntüleniyor, trafik kaynakları.

1. Tarayıcıda [Google Analytics](https://analytics.google.com) açın
2. Google hesabınızla giriş yapın
3. Sol altta **Yönetici** (dişli ikon) → **Mülk oluştur**
4. Mülk adı: `Yeni Form` → Saat dilimi: `Türkiye` → Para birimi: `TRY`
5. **Sonraki** → İşletme bilgilerini doldurun → **Oluştur**
6. Veri akışı: **Web** seçin
7. Web sitesi URL: `https://www.yeniform.com` → Akış adı: `Yeni Form Web`
8. **Akış oluştur** tıklayın
9. Açılan sayfada **Ölçüm Kimliği** görünür — `G-` ile başlar (ör. `G-ABC123XYZ4`)
10. Bana şunu yazın:
    ```
    GA4: G-XXXXXXXXXX
    ```

---

### Adım B — Sosyal medya URL'leri (JSON-LD sameAs)

**Ne işe yarar:** Google'a markanın resmi sosyal hesaplarını gösterir; marka bilgisi zenginleşir.

Her platform için **tam profil linkini** kopyalayın:

| Platform | Nasıl bulunur | Örnek format |
|----------|---------------|--------------|
| Instagram | Profil → ⋮ → Bağlantıyı kopyala | `https://www.instagram.com/kullaniciadi` |
| Facebook | Sayfa → Hakkında → Sayfa şeffaflığı veya adres çubuğu | `https://www.facebook.com/sayfaadi` |
| LinkedIn | Şirket sayfası → adres çubuğu | `https://www.linkedin.com/company/yeniform` |
| X (Twitter) | Profil → adres çubuğu | `https://x.com/kullaniciadi` |
| YouTube | Kanal → Paylaş → Kanal URL'sini kopyala | `https://www.youtube.com/@kanal` |

Hesabınız yoksa o platformu atlayın — zorunlu değil.

Bana şunu yazın:
```
Instagram: https://www.instagram.com/...
Facebook: https://www.facebook.com/...
LinkedIn: https://www.linkedin.com/company/...
```

---

### Adım E — GA4 Data API (Admin paneli `/admin/analytics`)

**Ne işe yarar:** Admin panelinde son 28 gün aktif kullanıcı, oturum, sayfa görüntüleme ve sayfa hunisi (`/`, `/membership`, `/onboarding`, `/dashboard`).

> **Önemli:** `G-40ENH7MC5W` = **Ölçüm Kimliği** (ziyaretçi takibi). Data API için ayrıca **sayısal Mülk Kimliği** gerekir (ör. `512345678`).

#### E1 — Google Cloud projesi ve API

1. [Google Cloud Console](https://console.cloud.google.com) → GA4 ile aynı Google hesabı
2. Üstten proje seçin (yoksa **Yeni proje** → ad: `Yeni Form Analytics`)
3. **API'ler ve Hizmetler → Kitaplık** → **Google Analytics Data API** ara → **Etkinleştir**

#### E2 — Service account oluşturma

1. **IAM ve Yönetici → Hizmet Hesapları** → **Hizmet hesabı oluştur**
2. Ad: `yeniform-ga4-reader` → **Oluştur ve devam et**
3. Rol: **Görüntüleyici** (Viewer) yeterli — veya rol atlamayıp sadece GA4 tarafında yetki verin (E3)
4. **Bitti** → oluşan hesaba tıklayın → **Anahtarlar** sekmesi
5. **Anahtar ekle → Yeni anahtar oluştur → JSON** → `.json` dosyası indirilir

Bu dosyayı **güvenli tutun**; repoya veya sohbete yapıştırmayın.

#### E3 — GA4 mülküne service account ekleme

1. [Google Analytics](https://analytics.google.com) → **Yönetici** (sol altta)
2. **Mülk Erişim Yönetimi** (Property column, orta sütun)
3. **+** → **Kullanıcıları ekle**
4. E-posta: JSON içindeki `client_email` (ör. `yeniform-ga4-reader@proje-id.iam.gserviceaccount.com`)
5. Rol: **Görüntüleyici** → **Ekle**

#### E4 — Mülk Kimliğini (Property ID) bulma

1. Analytics → **Yönetici** → **Mülk ayarları** (Property settings)
2. Sağ üstte **MÜLK KİMLİĞİ** — yalnızca rakamlar (ör. `512345678`)
3. `G-…` değil; bu sayıyı kopyalayın

#### E5 — Vercel ortam değişkenleri

[Vercel Dashboard](https://vercel.com) → proje `serenova-f-t` → **Settings → Environment Variables**

| Değişken | Değer | Ortamlar |
|----------|-------|----------|
| `GA4_PROPERTY_ID` | `512345678` (rakamlar) | Production, Preview |
| `GA4_SERVICE_ACCOUNT_JSON` | İndirdiğiniz JSON dosyasının **tam içeriği** (tek satır veya çok satır) | Production, Preview |

**JSON'u Vercel'e yapıştırma:**

- Dosyayı bir metin editöründe açın, tümünü kopyalayın (`{ "type": "service_account", ... }`)
- Vercel'de **Value** alanına yapıştırın; tırnakları escape etmeyin — ham JSON olmalı
- İsteğe bağlı: `VITE_GA4_MEASUREMENT_ID` = `G-40ENH7MC5W` (zaten `brand.js`'te var; env ile override edilebilir)

#### E6 — Deploy ve doğrulama

1. **Deployments** → son deploy → **⋯ → Redeploy** (env değişince zorunlu)
2. `admin@yeniform.com` ile giriş → **Admin → Analitik**
3. **Google Analytics 4** bölümünde aktif kullanıcı / oturum / sayfa hunisi görünmeli
4. Hata alırsanız:
   - `403` / `permission` → E3'te service account eklendi mi?
   - `API has not been used` → E1'de Data API etkin mi? (birkaç dakika bekleyin)
   - `Geçersiz service account JSON` → JSON bozulmuş; yeniden yapıştırın

**Güvenlik:** `GA4_SERVICE_ACCOUNT_JSON` yalnızca sunucu tarafında (`api/ga4-report.js`); tarayıcıya gitmez. Endpoint yalnızca **admin oturumu** ile çalışır.

---


1. Deploy tamamlandıktan sonra [Facebook Debugger](https://developers.facebook.com/tools/debug/)
2. `https://www.yeniform.com` yapıştır → **Debug**
3. Görsel `og-image.png` (Yeni Form logosu) görünmeli
4. **Scrape Again** ile cache yenileyin
5. LinkedIn için [Post Inspector](https://www.linkedin.com/post-inspector/) — aynı URL

Sonucu bana yazın: “OG test tamam” veya sorun varsa ekran görüntüsü.

---

### Adım D — Search Console haftalık kontrol

1. [Google Search Console](https://search.google.com/search-console)
2. `https://www.yeniform.com` mülkünü seçin
3. **Dizin oluşturma → Site haritaları** — durum **Başarılı**, ~15 URL
4. **Dizin oluşturma → Sayfalar** — dizine eklenen sayfa sayısı
5. Google'da arayın: `site:yeniform.com`

---

## 9. Bilgi verince ne yapılır?

| Verdiğiniz bilgi | Sizin yapmanız gereken | Kod tarafı |
|------------------|------------------------|------------|
| `GA4: G-…` | Vercel → **Environment Variables** → `VITE_GA4_MEASUREMENT_ID` = `G-…` (Production + Preview) → **Redeploy** | ✅ `GoogleAnalytics.jsx` — SPA sayfa izleme hazır |
| GA4 Data API | Vercel → `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_JSON` (§8 Adım E) → **Redeploy** | ✅ `api/ga4-report.js` — admin `/admin/analytics` |
| Sosyal medya URL'leri | Vercel → `VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_FACEBOOK`, … veya bana yazın → `brand.js` | ✅ `brand.js` env + manuel destek |
| “Deploy et” | Vercel Dashboard → Deployments → son deploy | — |

---

*Logo kaynağı: `public/brand-logo-alt.png` · Üretim: `npm run og:image` · Site logosu: `BrandLogo.jsx`*
