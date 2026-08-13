# Yeni SEO sayfası checklist

```
□ src/data/seoServiceContent.js — H1, lead (ilk 2 cümle net cevap), H2 soru, 8+ FAQ, CTA, related, disclaimer
□ src/config/seo.js PAGE_SEO — title 50–60, desc 150–160, keywords
□ src/App.jsx Route → ServiceLandingPage path=...
□ api/sitemap.js STATIC_ROUTES (priority, changefreq, lastmod)
□ prerender: SERVICE_PAGES otomatik; ekstra static → STATIC_SHELLS
□ robots.txt Allow gerekmez (Allow: / var); yeni gizli rota varsa Disallow
□ Breadcrumb + Service/FAQ/HowTo JSON-LD
□ Pillar ↔ küme ↔ /membership ↔ 1–2 blog iç link
□ Canlı H1 = prerender H1
□ npm run build
□ GSC URL Inspection
```

Hizmet teması: `page.theme` = `dietitian` | `coach`. Hero yoksa pillar görseli fallback.

Title: `Anahtar Kelime — Fayda | Yeni Form` (`formatTitle` marka yoksa suffix ekler).
