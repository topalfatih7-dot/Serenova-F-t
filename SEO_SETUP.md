# SEO & Google Search Console — Yeni Form (yeniform.com)

> **Canonical site:** https://www.yeniform.com  
> **Sitemap:** https://www.yeniform.com/sitemap.xml  
> **OG görsel:** https://www.yeniform.com/og-image.png (1200×630 PNG)  
> **Son güncelleme:** 2026-06-23

`yeniform.com` adresi otomatik olarak `www` sürümüne yönlendirilir (308).

---

## Durum özeti (2026-06-23)

### Tamamlanan
- [x] Vercel `VITE_SITE_URL` + `APP_URL` = `https://www.yeniform.com`
- [x] `robots.txt`, `/sitemap.xml`, sayfa meta + JSON-LD altyapısı
- [x] `index.html` canonical + OG mutlak URL'ler (`www`)
- [x] Google Search Console — property doğrulandı (Turhost DNS TXT)
- [x] Sitemap Search Console'a gönderildi
- [x] Ana sayfa dizine ekleme isteği gönderildi

### Sırada (sizin yapmanız gereken)
- [ ] OG test — [Facebook Debugger](https://developers.facebook.com/tools/debug/) + [LinkedIn Inspector](https://www.linkedin.com/post-inspector/) → `https://www.yeniform.com`
- [ ] Search Console'da sitemap durumunun **Başarılı** olmasını bekleyin (24–48 saat)
- [ ] Haftalık Search Console kontrolü (Sayfalar, Site haritaları)

### Opsiyonel / iyileştirme
- [ ] GA4 (`G-XXXXXXXXXX`) — `SEO_SETUP.md` §5
- [ ] Sosyal medya URL'leri → `src/config/brand.js` → `socialUrls`
- [ ] `public/brand-logo.png` kaydet → `npm run og:image` → redeploy
- [ ] Blog + kadro içerik zenginleştirme — `YAPILACAKLAR.md` SEO bölümü

Detaylı teknik referans: `AI_PROJE_REHBERI.md` §23–§24.

---

## 1. Ortam değişkenleri (Vercel)

**Production + Preview + Development** için:

| Değişken | Değer |
|----------|-------|
| `VITE_SITE_URL` | `https://www.yeniform.com` |
| `APP_URL` | `https://www.yeniform.com` |

PowerShell (Vercel CLI):

```powershell
"https://www.yeniform.com" | npx vercel env add VITE_SITE_URL production
"https://www.yeniform.com" | npx vercel env add VITE_SITE_URL preview
"https://www.yeniform.com" | npx vercel env add VITE_SITE_URL development
"https://www.yeniform.com" | npx vercel env add APP_URL production
"https://www.yeniform.com" | npx vercel env add APP_URL preview
"https://www.yeniform.com" | npx vercel env add APP_URL development
```

Env değişikliğinden sonra **bir kez redeploy** yapın.

---

## 2. Google Search Console kurulumu

### Adım A — Property ekleme

1. [Google Search Console](https://search.google.com/search-console) → **Özellik ekle**
2. **URL öneki** seçin: `https://www.yeniform.com`
3. Doğrulama: **DNS TXT** (Turhost) veya **HTML meta etiketi**

### Adım B — Turhost DNS doğrulama (önerilen)

1. Search Console → DNS kaydı yöntemi → `google-site-verification=...` değerini kopyalayın
2. Turhost → Alan adları → `yeniform.com` → **DNS Yönetimi**
3. Yeni **TXT** kaydı: Host `@`, Değer = Google'ın verdiği tam metin
4. 5–30 dk bekleyin → Search Console'da **Doğrula**

### Adım B (alternatif) — Meta etiket

```html
<meta name="google-site-verification" content="KODUNUZ" />
```

`index.html` içindeki yorum satırına yapıştırın → deploy → Doğrula.

### Adım C — Sitemap gönderme

1. Search Console → **Dizin oluşturma** → **Site haritaları**
2. `sitemap.xml` gönderin
3. Kontrol: `https://www.yeniform.com/sitemap.xml` tarayıcıda XML listesi göstermeli

> İlk saatlerde durum **Getirilemedi** görünebilir; 24–48 saat içinde **Başarılı** olması normaldir.

### Adım D — Ana sayfa dizine ekleme

1. Üst arama: `https://www.yeniform.com`
2. **Canlı URL'yi test et** → **Dizine eklenmesini iste**

---

## 3. OG (Open Graph) görseli

| Dosya | Açıklama |
|-------|----------|
| `public/og-image.png` | Sosyal paylaşım görseli (1200×630 PNG) |
| `public/brand-logo.png` | Kaynak logo (yeniden üretim için) |
| `public/favicon.svg` | Site favicon |

Güncelleme:

1. `public/brand-logo.png` kaydedin
2. `npm run og:image` → `public/og-image.png` yenilenir
3. Redeploy

Test: [Facebook](https://developers.facebook.com/tools/debug/) · [LinkedIn](https://www.linkedin.com/post-inspector/) → **Scrape Again**

---

## 4. robots.txt

Canlı: `https://www.yeniform.com/robots.txt`

- Public sayfalar: indexlenebilir
- Panel rotaları: `Disallow`
- Sitemap: `https://www.yeniform.com/sitemap.xml`

---

## 5. İsteğe bağlı — Google Analytics 4

1. [Google Analytics](https://analytics.google.com) → Yeni mülk
2. Measurement ID (`G-XXXXXXXXXX`)
3. `index.html` `<head>` içine gtag script ekleyin → deploy

---

## 6. Sıralama için içerik önerileri

1. **Blog** — haftada 1–2 uzun yazı (800+ kelime)
2. **Başarı hikayeleri** — onaylı gerçek üye hikayeleri
3. **Kadro profilleri** — bio, specialty, fotoğraf
4. **Görsel sıkıştırma** — kadro/blog görselleri
5. **Backlink** — sosyal medya, iş ortakları

---

## 7. Hızlı kontrol listesi

- [x] Vercel'de `VITE_SITE_URL` + `APP_URL` = `https://www.yeniform.com`
- [x] `https://www.yeniform.com/sitemap.xml` çalışıyor
- [x] `https://www.yeniform.com/robots.txt` çalışıyor
- [x] `https://www.yeniform.com/og-image.png` açılıyor
- [x] Search Console property doğrulandı
- [x] Sitemap gönderildi
- [x] Ana sayfa dizine ekleme isteği gönderildi
- [ ] Facebook/LinkedIn OG testi yapıldı
- [ ] Sitemap durumu **Başarılı** (bekleniyor)
- [ ] (Opsiyonel) GA4 kuruldu
- [ ] (Opsiyonel) `brand.js` → `socialUrls` dolduruldu
