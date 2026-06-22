# SEO & Google Search Console — Yeni Form (yeniform.com)

> Canonical site: **https://yeniform.com**  
> Sitemap: **https://yeniform.com/sitemap.xml**  
> OG görsel: **https://yeniform.com/og-image.png** (1200×630 PNG)

---

## 1. Ortam değişkenleri (Vercel)

Aşağıdakileri **Production + Preview + Development** için ekleyin:

| Değişken | Değer |
|----------|-------|
| `VITE_SITE_URL` | `https://yeniform.com` |
| `APP_URL` | `https://yeniform.com` |

PowerShell (Vercel CLI):

```powershell
"https://yeniform.com" | npx vercel env add VITE_SITE_URL production
"https://yeniform.com" | npx vercel env add VITE_SITE_URL preview
"https://yeniform.com" | npx vercel env add VITE_SITE_URL development
"https://yeniform.com" | npx vercel env add APP_URL production
"https://yeniform.com" | npx vercel env add APP_URL preview
"https://yeniform.com" | npx vercel env add APP_URL development
```

Env ekledikten sonra **bir kez redeploy** yapın.

Yerel `.env.local` dosyasında da aynı değerler tanımlı (geliştirme için).

---

## 2. Google Search Console kurulumu

### Adım A — Property ekleme

1. [Google Search Console](https://search.google.com/search-console) → **Özellik ekle**
2. **URL öneki** seçin: `https://yeniform.com`
3. Doğrulama yöntemi: **HTML etiketi** (önerilen)

### Adım B — Meta etiket doğrulama

Search Console size şuna benzer bir kod verir:

```html
<meta name="google-site-verification" content="AbCdEf123456..." />
```

1. `index.html` dosyasını açın
2. Şu satırın yorumunu kaldırın ve `content` değerini yapıştırın:

```html
<meta name="google-site-verification" content="AbCdEf123456..." />
```

3. Deploy edin → Search Console'da **Doğrula**'ya tıklayın

> Alternatif: **DNS TXT kaydı** (domain sağlayıcınızda) — meta etiket deploy gerektirmez ama DNS yayılımı 24–48 saat sürebilir.

### Adım C — Sitemap gönderme

Doğrulama başarılı olduktan sonra:

1. Search Console → **Dizin oluşturma** → **Site haritaları**
2. Yeni site haritası URL'si: `sitemap.xml`
3. **Gönder**

Kontrol: tarayıcıda `https://yeniform.com/sitemap.xml` açılmalı (XML listesi görünür).

### Adım D — URL denetimi (ilk kontrol)

1. Search Console üst arama çubuğuna `https://yeniform.com` yazın
2. **Canlı URL'yi test et** → **Dizine eklenmesini iste** (ana sayfa için)

Blog yazıları ve kadro profilleri sitemap üzerinden zamanla taranır.

---

## 3. OG (Open Graph) görseli

| Dosya | Açıklama |
|-------|----------|
| `public/og-image.png` | Sosyal paylaşım görseli (1200×630 PNG) |
| `public/brand-logo.png` | Kaynak logo (yeniden üretim için) |

Logoyu güncellerseniz:

1. Yeni logoyu `public/brand-logo.png` olarak kaydedin
2. `npm run og:image` çalıştırın → `public/og-image.png` yenilenir
3. Redeploy

Test araçları:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) (X)

URL girin: `https://yeniform.com` → önbelleği yenileyin (Facebook'ta **Scrape Again**).

---

## 4. robots.txt

Canlı adres: `https://yeniform.com/robots.txt`

- Public sayfalar: indexlenebilir
- Panel rotaları (`/dashboard`, `/admin`, `/staff`…): engelli
- Sitemap referansı: `https://yeniform.com/sitemap.xml`

---

## 5. İsteğe bağlı — Google Analytics 4

1. [Google Analytics](https://analytics.google.com) → Yeni mülk → `yeniform.com`
2. Measurement ID alın (`G-XXXXXXXXXX`)
3. `index.html` `<head>` içine ekleyin (deploy gerekir):

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 6. Sıralama için içerik önerileri

Search Console kurulumu tek başına sıralama garantisi vermez. Öncelik sırası:

1. **Blog** — haftada 1–2 yazı (beslenme, antrenman, motivasyon)
2. **Başarı hikayeleri** — onaylı gerçek üye hikayeleri
3. **Kadro profilleri** — bio, specialty, fotoğraf dolu
4. **Sayfa hızı** — Vercel CDN zaten hızlı; görselleri sıkıştırın
5. **Backlink** — sosyal medya, iş ortakları, yerel dizinler

---

## 7. Hızlı kontrol listesi

- [ ] Vercel'de `VITE_SITE_URL` + `APP_URL` = `https://yeniform.com`
- [ ] Redeploy yapıldı
- [ ] `https://yeniform.com/sitemap.xml` çalışıyor
- [ ] `https://yeniform.com/robots.txt` çalışıyor
- [ ] `https://yeniform.com/og-image.png` görsel açılıyor
- [ ] Search Console property doğrulandı
- [ ] Sitemap Search Console'a gönderildi
- [ ] Ana sayfa "Dizine eklenmesini iste" yapıldı
- [ ] Facebook/LinkedIn debugger ile OG test edildi

Detaylı teknik referans: `AI_PROJE_REHBERI.md` §23.
