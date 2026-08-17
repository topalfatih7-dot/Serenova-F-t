# Schema builder’lar

`src/config/seo.js`:

- `buildOrganizationSchema` — sameAs yalnızca gerçek URL
- `buildWebSiteSchema` — SearchAction `https://www.yeniform.com/blog?q={search_term_string}` (BlogPage `?q=` + `q` varken noindex)
- `buildAggregateRatingSchema` — yalnızca gerçek testimonial ortalaması; `n < 5` ise basma
- `buildFaqSchema` — max 20
- `buildServiceSchema` — `offers[].price` TRY, `priceCurrency`
- `buildHowToSchema` — süreç adımları
- `buildArticleSchema` — `author` Organization (`Yeni Form Ekibi`; kadro adı yok)
- `buildPersonSchema` — `image` absolute; profil instagram/linkedin/website `sameAs`
- `buildBreadcrumbSchema`
- `buildItemListSchema`
- `buildSpeakableWebPageSchema` — `.speakable-intro`, `.faq-section`

YMYL: sağlık iddiasına kaynak; footer disclaimer.
