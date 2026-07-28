# Yeni Form — AI Proje Rehberi (sıkı)

> **Amaç:** Az token ile doğru bağlam. Detay için kod / `.cursor/skills/yeniform-*` / `docs/*`.  
> **Canlı:** https://www.yeniform.com · Vercel `serenova-f-t` · Supabase `rvzksmyhsgxgrxgeabmi`  
> **Marka:** `src/config/brand.js` · **Güncelleme:** 2026-07-28

**AI okuma sırası:** §0 kurallar → §2 durum → ilgili skill → kod. Tam dosya envanteri / eski changelog **yok** (git history).

---

## 0. Kırılmaması gereken kurallar

1. Production veri SoT: `src/services/supabaseDb.js` (eski `localDb` yok).
2. Ücretli plan **yalnızca** Stripe webhook / admin — istemci `changeMemberPlan` ile açılmaz.
3. Kayıt: auth session Stripe öncesi açılır; `members` satırı webhook ile gelir → header `hasRegisteredMember()` / `isFullyRegistered`.
4. **Vercel Hobby ≤12 serverless fn.** Yeni `api/*.js` ekleme; mevcut multiplex’e `task=` ekle. `_*.js` sayılmaz.
5. AI üretim yüzeyleri **yalnızca**: kalori (`ai-food-text` / `ai-food-vision`), günlük blog, günlük tüyo. Program / diyet listesi / sağlık skoru AI **yok**.
6. `exercise-videos` **private**; imzalı URL ≤15 dk; kapak `exercise-thumbs` public webp; DB’de `video_url` = storage path.
7. Migration / plan değişince: `npm run db:migrate` (kullanıcıya SQL yapıştır deme) — `.cursor/rules/supabase-auto-migrate.mdc`.
8. Satılan plan sırası: Diyet(0) → Spor(1) → Doktor(2) → Vip(3). `free` = süresi bitmiş fallback; `eko` yeni satış kapalı. Aktif ID’ler: `SELLABLE_PLAN_IDS` in `membershipPlans.js`.

---

## 1. Stack

| | |
|--|--|
| App | Vite 8 + React 19 + RR7 + Tailwind 4 · `src/main.jsx` → `App.jsx` |
| State | `AppContext` dilimleri: `useAuth` / `useData` / `useActions` (+ `useApp`) |
| DB/Auth/Storage | Supabase · `setup.sql` + `migrations/` |
| Ödeme | Stripe Checkout + webhook (web). RevenueCat/IAP **bu repoda yok**. |
| Video | Daily.co · `api/daily-room.js` |
| AI | Kalori GPT-4o · Blog/ipucu Gemini flash-lite |
| Deploy | `vercel.json` SPA rewrite + cron + `sitemap.xml` → `api/sitemap` · build: `vite` + `prerender-seo.mjs` |

---

## 2. Durum (2026-07-28)

**Canlı / tamam:** Stripe Checkout+webhook · Google OAuth · HT hub `/health-test` · kalori AI · blog + günlük tüyo cron · SEO `/online-diyetisyen` `/online-kocluk` · private video + 15dk imza · RLS + üyelik güvenlik Faz1 · personel program builder (koç: haftalık gün şablonu + gün bazlı seans saati; diyetisyen: tam sayfa liste builder).

**Kaldırıldı (2026-07-28):** AI Basic/Eko program+diyet üretimi · Coaching Engine · `ai-nutrition-tips` fn · sağlık skoru AI · Basic/Eko yeni satış · ücretsiz kayıt.

**Ops açık (kod değil):** GSC, admin içerik, yasal metin, denetim Faz 2–5 → `docs/ROADMAP_DENETIM.md`.

**Mobil:** Expo app **bu repoda yok**.

---

## 3. Mimari (kısa)

```
Browser → Supabase Auth
       → supabaseDb.hydrate() → AppContext → pages
       → /api/* (Vercel) · Daily WebRTC
```

**Roller:** admin = `ADMIN_CREDENTIALS.email` · staff = `staff` tablosu · else member.

---

## 4. Paketler

| ID | Satış | İnsan koç/diyet | Not |
|----|-------|-----------------|-----|
| `free` | hayır | — | Süre bitmiş fallback |
| `eko` | hayır (eski) | — | Mevcut üyeler admin ile taşınır |
| `diyet` | evet | diyetisyen | |
| `spor` | evet | koç | |
| `doktor` | evet | tek sefer doktor | |
| `vip` | evet | koç+diyet | |

Onboarding: zorunlu ücretli plan → Stripe. Fiyat/atama: `src/data/membershipPlans.js` · `src/services/staffAssignment.js`.

---

## 5. AI sistemleri

### 5.1 Kalori / blog / ipucu

| Endpoint | Model | Not |
|----------|-------|-----|
| `ai-food-text` / `ai-food-vision` | GPT-4o | plan guard · `food_dictionary` cache |
| `ai-blog-generate` default | Gemini | cron 05:00 |
| `?task=daily-tip` | Gemini | cron 04:00 · `site_content` |
| `?task=membership-expiry` | — | cron 03:00 · `api/_membershipExpiry.js` |

### 5.2 Sağlık testi (AI skor yok)

- HT 6 kategori: `healthTestSections.js`
- VKİ / ham özet UI kalır; otomatik AI skor üretimi **yok**
- Programlar: personel (koç/diyetisyen) gönderir → `programs` tablosu
  - Koç: `/staff/clients/:id/program` — haftalık şablon (`scheduleType: 'weekly'`, `entry.day` + gün bazlı seans saati); aralık bugün→paket bitişi; müsait olmayan günlere yazılmaz
  - Diyetisyen: `/staff/clients/:id/list` — `NutritionProgramBuilder` (mantık aynı, tam sayfa UX)
  - Admin: `/admin/programs` liste/sil/görüntüle · `/admin/programs/:id/edit` tam düzenleme (`deleteProgram` / `updateProgram`; koç UI → `CoachProgramEditor`)

---

## 6. Vercel serverless haritası

**Serverless (~11):** `ai-blog-generate` · `ai-food-text` · `ai-food-vision` · `application-notify` · `auth` · `contact` · `daily-room` · `sitemap` · `stripe-checkout` · `stripe-webhook` · `telegram-notify`

**Multiplex özet:**

- `auth` — signup/login/reset · book-session · exercise-video-url(s) · ga4 · ai-usage · single-session · Turnstile
- `ai-blog-generate` — blog · daily-tip · supabase-health · membership-expiry

---

## 7. Rotalar (özet)

**Public:** `/` `/login` `/onboarding` `/membership` `/online-diyetisyen` `/online-kocluk` `/hakkimizda` `/blog` `/team/*` `/corporate` `/legal/:slug`

**Üye:** `/dashboard` `/health-test` `/calendar` `/calorie` `/schedule` `/programs` `/library` `/messages` …

**Staff / Admin:** `src/App.jsx`.

---

## 8. Dosya haritası (sık kullanılan)

| Alan | Path |
|------|------|
| DB client | `src/services/supabaseDb.js` |
| HT sorular | `src/data/healthTest.js`, `healthTestSections.js` |
| VKİ | `src/services/health.js` · UI `HealthSummarySection` |
| Planlar | `src/data/membershipPlans.js` |
| SEO içerik | `src/data/seoServiceContent.js` |
| Promptlar | `api/_ai-prompts.js` (food + blog + tip) |
| Stripe | `api/stripe-*.js`, `api/_stripe.js` |
| Şema | `supabase/setup.sql`, `supabase/migrations/` |
| Env şablon | `.env.example` |

**Cursor skills:** `auth-onboarding` · `health-programs` · `media-exercises` · `membership-payments` · `chat-realtime-video` · `staff-admin` · `mobile-*` (spec only).

---

## 9. DB (özet)

**Kurulum:** `setup.sql` (idempotent). Artımlı: `migrations/` → `npm run db:migrate`.

**Çekirdek:** `members` · `staff` · `programs` · `exercises` · `plans` · `posts` · `food_dictionary` · `ai_usage_logs` · chat tabloları …

**Storage:** `exercise-videos` private · `exercise-thumbs` public webp.

---

## 10. Komutlar

| Komut | Ne |
|-------|-----|
| `npm run dev` / `dev:vercel` | Vite / local API |
| `npm run build` | Vite + SEO prerender |
| `npm run db:migrate` | Migration uygula |
| `npm run test:ai` / `test:stripe` / `test:rls` | Smoke |

---

## 11. Son delta (2026-07-28)

- AI program/diyet/skor/tips kaldırıldı; `ai-nutrition-tips` silindi.
- Kalori + blog + günlük tüyo kaldı.
- Basic/Eko yeni satış ve ücretsiz kayıt kapandı; `SELLABLE_PLAN_IDS` = diyet/spor/doktor/vip.
- `membership-expiry` → `api/_membershipExpiry.js`; `eko-renew` kaldırıldı.
