# Yeni Form — SEO sayfa ekleme

Kaynak: `.cursor/skills/yeniform-seo/checklist.md`. Yeni public URL eklerken bu sırayı atlama.

1. İçerik: `src/data/seoServiceContent.js` (`SERVICE_PAGES`) veya sayfa copy
2. Meta: `src/config/seo.js` → `PAGE_SEO`
3. Rota: `src/App.jsx`
4. Sitemap: `api/sitemap.js` → `STATIC_ROUTES`
5. Prerender: `SERVICE_PAGES` otomatik; diğerleri `STATIC_SHELLS`
6. JSON-LD + iç link
7. `npm run build`
8. GSC URL Inspection

Yasak: sahte rating, şehir doorway, yeni Vercel `api/*.js`, tıbbi teşhis copy.
