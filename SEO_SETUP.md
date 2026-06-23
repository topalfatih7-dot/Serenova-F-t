# SEO & Google Search Console — Yeni Form (yeniform.com)

> **Canonical site:** https://www.yeniform.com  
> **Sitemap:** https://www.yeniform.com/sitemap.xml  
> **OG görsel:** https://www.yeniform.com/og-image.png (1200×630 PNG)  
> **Vercel proje:** `topalfatih7-3924s-projects/serenova-f-t`  
> **Son güncelleme:** 2026-06-23 (marka logosu + SEO entegrasyonu)

`yeniform.com` → `www.yeniform.com` **308 Permanent Redirect** (doğrulandı).

---

## Durum özeti

### Tamamlanan

| Alan | Durum |
|------|--------|
| `VITE_SITE_URL` + `APP_URL` | ✅ Vercel (Production, Preview, Development) |
| `robots.txt` + `/sitemap.xml` | ✅ Canlı — 15 URL |
| Search Console DNS doğrulama | ✅ |
| Sitemap gönderimi + dizin isteği | ✅ |
| **`public/og-image.png`** | ✅ SEO sosyal paylaşım görseli |
| **`public/brand-logo.png`** | ✅ Navbar, giriş, JSON-LD logo |
| **`BrandLogo.jsx`** | ✅ Gerçek logo PNG kullanıyor |
| Favicon + apple-touch-icon | ✅ `brand-logo-alt.png` kaynağından üretildi |
| Blog seed (5) + kadro (2) | ✅ Sitemap'te |

### Sizin yapmanız gereken

| # | Görev | Süre |
|---|--------|------|
| 1 | **Deploy** — logo + og-image değişikliklerini Vercel'e gönder | 5 dk |
| 2 | **OG debugger** — Facebook + LinkedIn → Scrape Again | 5 dk |
| 3 | **Search Console** — sitemap “Başarılı” mı kontrol | 24–48 saat |
| 4 | **GA4 ID** verin (§9 Adım A) | 10 dk |
| 5 | **Sosyal medya URL'leri** verin (§9 Adım B) | 5 dk |
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
- [ ] **Deploy** (logo güncellemesi)
- [ ] Facebook/LinkedIn OG testi
- [ ] Sitemap **Başarılı**
- [ ] GA4 kurulumu
- [ ] `socialUrls` dolduruldu

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

### Adım C — OG debugger testi (manuel, 5 dk)

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

## 9. Bilgi verince agent ne yapar?

| Verdiğiniz bilgi | Agent işlemi |
|------------------|--------------|
| `GA4: G-…` | `index.html` `<head>` içine gtag script ekler → deploy |
| Sosyal medya URL'leri | `src/config/brand.js` → `socialUrls` doldurur |
| “Deploy et” | Vercel production deploy |

---

*Logo kaynağı: `public/brand-logo-alt.png` · Üretim: `npm run og:image` · Site logosu: `BrandLogo.jsx`*
