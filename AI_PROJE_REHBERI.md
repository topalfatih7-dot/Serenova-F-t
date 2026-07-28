# Yeni Form — AI Proje Rehberi (sıkı)

> **Amaç:** Az token ile doğru bağlam. Detay için kod / `.cursor/skills/yeniform-*` / `docs/*`.  
> **Canlı:** https://www.yeniform.com · Vercel `serenova-f-t` · Supabase `rvzksmyhsgxgrxgeabmi`  
> **Marka:** `src/config/brand.js` · **Güncelleme:** 2026-07-27

**AI okuma sırası:** §0 kurallar → §2 durum → ilgili skill → kod. Tam dosya envanteri / eski changelog **yok** (git history).

---

## 0. Kırılmaması gereken kurallar

1. Production veri SoT: `src/services/supabaseDb.js` (eski `localDb` yok).
2. Ücretli plan **yalnızca** Stripe webhook / admin — istemci `changeMemberPlan` ile açılmaz.
3. Kayıt: auth session Stripe öncesi açılır; `members` satırı çoğu zaman webhook ile gelir → header `hasRegisteredMember()` / `isFullyRegistered`.
4. **Vercel Hobby ≤12 serverless fn.** Yeni `api/*.js` ekleme; mevcut multiplex’e `task=` ekle. `_*.js` ve `api/_coaching/*` sayılmaz.
5. AI program mimarisi (tersine çevirme): **Safety → Mifflin makrolar → deterministic workout (`runCoachingEngine`) → `food_dictionary` allowlist → LLM sadece başlık/öğün metni → `nutritionGuard` → persist.** LLM `exerciseId` seçmez; BMR/TDEE/P/F/C uydurmaz.
6. Deficit: BMI&lt;18.5 veya ED sinyali → kapalı. Kcal tabanı ≥ max(BMR, 1200♀/1500♂). Protein 1.6–2.4 g/kg; yağ ≥0.6 g/kg. Yüksek risk: failure yok, yumuşak RIR.
7. `prefer_not` ≠ gebelik (`safetyGate` yalnız `yes|suspect`).
8. `exercise-videos` **private**; imzalı URL ≤15 dk; kapak `exercise-thumbs` public webp; DB’de `video_url` = storage path.
9. Migration / plan değişince: `npm run db:migrate` (kullanıcıya SQL yapıştır deme) — `.cursor/rules/supabase-auto-migrate.mdc`.
10. Plan sırası: Basic(`free`/0) → Eko → Diyet → Spor → Doktor → Vip. Aktif ID’ler: `PLAN_IDS` in `membershipPlans.js`.

---

## 1. Stack

| | |
|--|--|
| App | Vite 8 + React 19 + RR7 + Tailwind 4 · `src/main.jsx` → `App.jsx` |
| State | `AppContext` dilimleri: `useAuth` / `useData` / `useActions` (+ `useApp`) |
| DB/Auth/Storage | Supabase · `setup.sql` + `migrations/` |
| Ödeme | Stripe Checkout + webhook (web). RevenueCat/IAP **bu repoda yok**. |
| Video | Daily.co · `api/daily-room.js` |
| AI | Program GPT-4.1 · Kalori GPT-4o · Skor/ipucu/blog Gemini flash-lite |
| Deploy | `vercel.json` SPA rewrite + cron + `sitemap.xml` → `api/sitemap` · build: `vite` + `prerender-seo.mjs` |

---

## 2. Durum (2026-07-27)

**Canlı / tamam:** Stripe Checkout+webhook · Google OAuth (Apple/FB UI yok) · HT hub `/health-test` · AI Basic/Eko + Coaching Engine · sağlık skoru (HT sonrası otomatik, **manuel “Skoru yenile” yok**) · skor trendi · `food_dictionary` grounding · spor yeri `home|gym|office` → egzersiz `locations` · SEO `/online-diyetisyen` `/online-kocluk` + prerender · private video + 15dk imza · RLS + üyelik güvenlik Faz1 · klinik not `updateMemberRow` · haftalık adherence tablosu · günün ipucu cron · paket atama `staffAssignment` / `membershipPlans`.

**Ops açık (kod değil):**

| P | Konu |
|---|------|
| P0 | GSC: service URL indeks + sitemap yenile |
| P1 | Admin içerik/kadro bio · SEO off-page · Leaked Password Protection · yasal metin hukuk onayı |
| P2 | Hakediş (sessionAttendance) · Stripe Customer Portal · `phone_in_use` rate limit · Denetim Faz 2–5 (`docs/ROADMAP_DENETIM.md`) · OG debugger |

**Mobil:** Expo app **bu repoda yok**. `docs/mobile/*` çalışma ağacında silinmiş (git `D`). Skills (`yeniform-expo-*`) spec niyeti; kod yok. RN migration planlanmadı.

**Denetim:** Faz 0–1 ✅ · Faz 2–5 bekliyor → `docs/ROADMAP_DENETIM.md`.

---

## 3. Mimari (kısa)

```
Browser → Supabase Auth
       → supabaseDb.hydrate() → AppContext → pages
       → /api/* (Vercel) · Daily WebRTC
```

**Roller:** admin = `ADMIN_CREDENTIALS.email` · staff = `staff` tablosu · else member → genelde `/profile` / panel.

Admin e-posta senkronu: `brand.js` ↔ `is_admin()` ↔ env.

---

## 4. Paketler

| ID | AI program | İnsan koç/diyet | Not |
|----|------------|-----------------|-----|
| `free` | Basic trial penceresi | — | HT sonrası `memberHealthSync` |
| `eko` | 15g diyet (7g rotasyon) + 30g antrenman; cron `eko-renew` | — | |
| `diyet` | — | diyetisyen | |
| `spor` | — | koç | |
| `doktor` | — | tek sefer doktor | |
| `vip` | — | koç+diyet | |

Fiyat/atama: `src/data/membershipPlans.js` · `src/services/staffAssignment.js`.

---

## 5. AI sistemleri

### 5.1 Basic / Eko program

| | |
|--|--|
| Tetik | HT complete → `memberHealthSync` · Eko upgrade/Stripe · cron `eko-renew` · admin force |
| Entry | `POST /api/ai-nutrition-tips` `task=basic-programs\|eko-programs\|eko-programs-admin` |
| Core | `api/_aiBasicPrograms.js`, `_aiEkoPrograms.js`, `api/_coaching/*` |
| Client | `src/services/memberHealthSync.js`, `aiBasicPrograms.js` |
| Persist | `programs` (`source`: `ai_basic`\|`ai_eko`) + `members.data.coachingState` |
| Smoke | `scripts/test-coaching-engine.mjs` |

Basic: çoğu zaman `cycleSameDaily: true`. Eko diyet: `cycleSameDaily: false` (7 günlük menü).

Skill: `.cursor/skills/yeniform-ai-coaching/`.

### 5.2 Sağlık skoru

- HT 6 kategori: `general|medical|nutrition|physical|lifestyle|women|men` — `healthTestSections.js` (cinsiyet filtresi; paket kilidi yok).
- `useHealthAnalysisSync` → `task=health-score` (Gemini) → `members.data.healthAnalysis`.
- Skor boyutları: `general, nutrition, movement, sleep, stress, lifestyle, motivation, readiness` + `overallScore`.
- Fallback: `computeFallbackHealthScores`. UI: `HealthScoreCard` + trend chart. Dashboard’da manuel yenileme **yok**.

### 5.3 Kalori / blog / ipucu

| Endpoint | Model | Not |
|----------|-------|-----|
| `ai-food-text` / `ai-food-vision` | GPT-4o | plan guard `_memberEntitlements` · `food_dictionary` cache |
| `ai-blog-generate` default | Gemini | cron 05:00 |
| `?task=daily-tip` | Gemini | cron 04:00 · `site_content` |
| `?task=membership-expiry` | — | cron 03:00 |
| `?task=eko-renew` | — | cron 06:00 |

---

## 6. Vercel 12-fn haritası (dokunma / çoğaltma)

**Serverless (12):** `ai-blog-generate` · `ai-food-text` · `ai-food-vision` · `ai-nutrition-tips` · `application-notify` · `auth` · `contact` · `daily-room` · `sitemap` · `stripe-checkout` · `stripe-webhook` · `telegram-notify`

**Multiplex özet:**

- `auth` — signup/login/reset · book-session · exercise-video-url(s) · ga4 · ai-usage · single-session · Turnstile
- `ai-blog-generate` — blog · daily-tip · supabase-health · membership-expiry · eko-renew
- `ai-nutrition-tips` — nutrition-tips · health-score · basic/eko-programs

---

## 7. Rotalar (özet)

**Public:** `/` `/login` `/onboarding` `/membership` `/online-diyetisyen` `/online-kocluk` `/hakkimizda` `/blog` `/team/*` `/corporate` `/legal/:slug` (+ kvkk/privacy/terms redirect)

**Üye:** `/dashboard` `/health-test[/:sectionId|/finish]` `/calendar` `/calorie` `/schedule` `/programs` `/library` `/messages` `/notifications` `/support` `/profile` `/call/...`

**Staff:** `/staff` `/staff/clients/:id/{health,program}` `/staff/messages` `/staff/lists` `/staff/programs` `/staff/library` …

**Admin:** `/admin` `/admin/members` `/admin/premium` `/admin/library` `/admin/staff` `/admin/blog` `/admin/content` `/admin/applications` …

Kaynak: `src/App.jsx`.

---

## 8. Dosya haritası (sık kullanılan)

| Alan | Path |
|------|------|
| DB client | `src/services/supabaseDb.js` |
| HT sync / AI program tetik | `src/services/memberHealthSync.js` |
| HT sorular | `src/data/healthTest.js`, `healthTestSections.js` |
| Skor | `src/services/healthScoreAnalysis.js`, `hooks/useHealthAnalysisSync.js` |
| VKİ | `src/services/health.js` · UI `HealthSummarySection` (kart: **VKİ**, modal: **Vücut Kitle Endeksi**) |
| Planlar | `src/data/membershipPlans.js` |
| SEO içerik | `src/data/seoServiceContent.js` · `pages/services/ServiceLandingPage.jsx` |
| Coaching | `api/_coaching/` |
| Promptlar | `api/_ai-prompts.js` |
| Stripe | `api/stripe-*.js`, `api/_stripe.js` |
| Şema | `supabase/setup.sql`, `supabase/migrations/` |
| Env şablon | `.env.example` |
| Video ops | `docs/VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md`, `VIDEO_PLAYER_IOS_FULLSCREEN.md` |
| Güvenlik ops | `docs/SECURITY_OPS.md` |

**Cursor skills:** `yeniform-ai-coaching` · `auth-onboarding` · `health-programs` · `media-exercises` · `membership-payments` · `chat-realtime-video` · `staff-admin` · `mobile-*` (spec only).

---

## 9. DB (özet)

**Kurulum:** `setup.sql` (idempotent). Artımlı: `migrations/` → `npm run db:migrate`.

**Çekirdek tablolar:** `members` (detay çoğunlukla `data` JSONB) · `staff` · `programs` · `exercises` · `plans` · `posts` · `tickets` · `payments` · `activities` · `site_content` · `food_dictionary` · `chat_threads`/`chat_messages` · `admin_staff_*` · `*_applications` · `contact_inquiries` · `user_presence` · `ai_usage_logs`

**Storage:** `exercise-videos` private · `exercise-thumbs` public webp · `staff-application-docs` admin list.

---

## 10. Komutlar

| Komut | Ne |
|-------|-----|
| `npm run dev` / `dev:vercel` | Vite / local API |
| `npm run build` | Vite + SEO prerender |
| `npm run db:migrate` | Migration uygula |
| `npm run test:ai` / `test:stripe` / `test:rls` | Smoke |
| `npm run videos:compress` / `thumbs:generate` | Media pipeline |

---

## 11. Son delta (rehbere işlenen · ~07-19 → 07-27)

- Deterministic **Coaching Engine** (`api/_coaching`, Vercel path fix).
- AI Basic/Eko derinleştirme; skor manuel yenileme kaldırıldı; skor trendi + personel AI özeti.
- `food_dictionary` diyet grounding; gebelik `prefer_not` false-positive düzeltmesi.
- Spor yeri sorusu → ev/salon/ofis hareket seçimi.
- Hobby 12-fn: auth / blog / nutrition multiplex; Eko meal schema küçültme.
- HT soru yenileme (cinsiyet bazlı tüm bölümler); profil VKİ etiketi düzeni.
- `docs/mobile` silindi (working tree); rehber mobil “yok” olarak güncellendi.
- Eski §14–59 changelog bu dosyadan çıkarıldı (token); ihtiyaçta `git log` / eski commit.

---

## 12. Tuzaklar

- Yeni API dosyası = deploy kırılması (12 limit).
- Üyelik yazımı istemciden → güvenlik regression (Faz1 trigger’ları).
- Imzalı video URL cache TTL ~13 dk (`exerciseVideoUrlCache.js`); path’i public URL sanma.
- Kalori/vision plan guard’sız çağrı açma.
- `memberHealthSync` artık **stub değil** — HT sonrası Basic/Eko üretir.
- Rehberdeki eski “Kurucu” aktif plan dili → kodda aktif `doktor` + `vip` (`kurucu` legacy alias).
