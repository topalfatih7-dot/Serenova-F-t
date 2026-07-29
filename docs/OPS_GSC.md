# Google Search Console — ops checklist

Canonical: `https://www.yeniform.com`  
Sitemap: `https://www.yeniform.com/sitemap.xml` (`api/sitemap.js`)  
robots: `public/robots.txt`

## Doğrulama (birini seç)

1. **DNS TXT** (tercih) — Search Console → Alan adı özelliği → TXT kaydı.
2. **HTML meta** — GSC’den gelen token’ı Vercel / `.env` içine yaz:
   ```
   VITE_GSC_VERIFICATION=token_buraya
   ```
   Build (`vite`) `index.html` head’e meta enjekte eder (`vite.config.js` → `gscMetaPlugin`).

## İlk kurulum

1. GSC’de özellik ekle ve doğrula.
2. Sitemap gönder: `https://www.yeniform.com/sitemap.xml`
3. URL denetimi: `/`, `/online-diyetisyen`, `/online-kocluk`, `/membership`, `/blog`
4. Core Web Vitals / Mobil kullanılabilirlik raporlarını izle.

## Kod tarafı (hazır)

- Dinamik sitemap: blog + kadro + legal
- robots: üye/staff/admin paneli disallow
- SEO landings: `/online-*`
- Prerender: `npm run build` → `prerender-seo.mjs`

Manuel GSC tıklamaları bu checklist dışındadır (hesap erişimi gerekir).
