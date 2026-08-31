---
name: yeniform-seo
description: >-
  Yeni Form SEO mühendisliği: PAGE_SEO, prerender, sitemap, schema.org, GSC,
  küme sayfaları, E-E-A-T, GEO, GSC Excel analizi. Use when working on SEO,
  meta, canonical, sitemap, robots, JSON-LD, prerender-seo, Search Console,
  /online-diyetisyen, /online-kocluk, /kilo-verme, /beslenme/hamilelik, blog,
  staff public profiles, llms.txt, or adding a public page.
---

# Yeni Form — SEO

Public site: `https://www.yeniform.com`. SPA (Vite) + build prerender + `/sitemap.xml` → `api/sitemap.js`.

## Yeni public sayfa (zorunlu sıra)

Tam adımlar: [checklist.md](checklist.md) ve [docs/SEO_SAYFA_EKLEME.md](../../../docs/SEO_SAYFA_EKLEME.md).

1. `src/data/seoServiceContent.js` (küme/hizmet) veya sayfa içi copy
2. `src/config/seo.js` → `PAGE_SEO`
3. `src/App.jsx` Route
4. `api/sitemap.js` → `STATIC_ROUTES`
5. `scripts/prerender-seo.mjs` (SERVICE_PAGES döngüsü veya STATIC_SHELLS)
6. `SeoHead` / `PublicRouteSeo` + JSON-LD
7. `npm run build` (prerender)
8. Deploy sonrası GSC URL Inspection

## Mimari

| Dosya | Görev |
|-------|--------|
| `src/config/seo.js` | PAGE_SEO, schema builder, slug |
| `src/data/seoServiceContent.js` | Hizmet + küme copy (H1, FAQ, CTA) |
| `src/components/seo/*` | SeoHead, JsonLd, PublicRouteSeo, NoIndexHead |
| `scripts/prerender-seo.mjs` | Googlebot HTML shell |
| `api/sitemap.js` | Dinamik sitemap (blog + kadro + static) |
| `public/robots.txt` | Crawl |
| `public/llms.txt` | GEO / AI crawler |

Prerender `#seo-static-content` görsel olarak gizlenir; React aynı niyeti gösterir. Cloaking değildir — H1 prerender = canlı H1 olmalı.

## Yasaklar

- Sahte `AggregateRating` / uydurma `reviewCount`
- İnce şehir sayfası (`/istanbul/online-diyetisyen`)
- Yeni `api/*.js` (Hobby 12/12; sitemap genişlemesi aynı function)
- Keyword stuffing; aynı ticari kelimede iki para sayfası
- Tıbbi teşhis/tedavi iddiası; YMYL sayfalarında disclaimer
- Uydurma sosyal `sameAs` URL

## Schema

Builder’lar ve kurallar: [schemas.md](schemas.md).

## Doğrulama

[verify.md](verify.md). Sitemap asla 500 dönmemeli.

## MCP

- Supabase: posts, staff bio, `site_content` testimonial rating
- Browser: canlı title/H1/canonical
- GSC/GA4 API yok — kullanıcı CSV/xlsx; [gsc-playbook.md](gsc-playbook.md)
- Vercel MCP yoksa Dashboard log; sitemap 500’de önce `api/sitemap.js` modül init

## Anahtar kelime silosu

GSC gerçeği ve sahiplik tablosu: [gsc-playbook.md](gsc-playbook.md). İhlal etme.

Pillar: `/` marka · `/online-diyetisyen` (hizmet, fiyat yok) · `/online-kocluk` · `/membership` (paket karşılaştır; title’da `fiyatları` yok).

Küme: `/kilo-verme` · `/online-diyetisyen/fiyat` (yalnız diyet fiyat) · `/online-kocluk/ev-antrenman` · `/beslenme/sporcu-beslenmesi` · `/beslenme/pcos` · `/beslenme/insulin-direnci` · `/beslenme/hamilelik` · `/kalori-hesaplama` (public BMR/TDEE; `/calorie` üye, rakip değil).

Şehir doorway yok.

Detay: [docs/SEO_KEYWORDS.md](../../../docs/SEO_KEYWORDS.md) · [docs/SEO_MASTER_PLAN.md](../../../docs/SEO_MASTER_PLAN.md)
