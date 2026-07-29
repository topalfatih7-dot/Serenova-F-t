# Yeni Form — AI Proje Rehberi (sıkı)

> **Amaç:** Az token ile doğru bağlam. Detay için kod / `.cursor/skills/yeniform-*` / `docs/*`.  
> **Canlı:** https://www.yeniform.com · Vercel `serenova-f-t` · Supabase `rvzksmyhsgxgrxgeabmi`  
> **Marka:** `src/config/brand.js` · **Güncelleme:** 2026-07-29

**AI okuma sırası:** §0 kurallar → §2 durum → ilgili skill → kod. Tam dosya envanteri / eski changelog **yok** (git history).

---

## 0. Kırılmaması gereken kurallar

1. Production veri SoT: `src/services/supabaseDb.js` (eski `localDb` yok).
2. Ücretli plan **yalnızca** Stripe webhook / admin — istemci `changeMemberPlan` ile açılmaz.
3. Kayıt: ücretsiz → `members` hemen (`membership: 'free'`); ücretli → auth session Stripe öncesi, `members` webhook ile → header `hasRegisteredMember()` / `isFullyRegistered`.
4. **Vercel Hobby ≤12 serverless fn.** Yeni `api/*.js` ekleme (slot dolu: 12/12); mevcut multiplex’e `task=` / `action=` ekle. `_*.js` sayılmaz.
5. AI üretim yüzeyleri: kalori (`ai-food-text` / `ai-food-vision`), günlük blog, günlük tüyo, **sağlık skoru + staff brief** (`ai-health-analysis`, GPT-5.4 — yalnızca ücretli üyelik). Program / diyet listesi / öğün menüsü AI **yok**. Üye: dashboard’da skorlar (`HealthScoreCard`); `staffBrief` yalnızca personel.
6. `exercise-videos` **private**; imzalı URL ≤15 dk; kapak `exercise-thumbs` public webp; DB’de `video_url` = storage path.
7. Migration / plan değişince: `npm run db:migrate` (kullanıcıya SQL yapıştır deme) — `.cursor/rules/supabase-auto-migrate.mdc`.
8. Satılan plan sırası: Eko Diyet(0) → Diyet(1) → Eko Spor(2) → Spor(3) → Doktor(4) → Vip(5). `free` = ücretsiz kayıt + süresi bitmiş fallback; eski `eko` yeni satış kapalı. Aktif ID’ler: `SELLABLE_PLAN_IDS` in `membershipPlans.js`.
9. **İletişim gizliliği:** Personel ↔ üye e-posta/telefon **görülmez** (`members_staff_safe` + UI). Admin kendi panellerinde görür. Platform dışı iletişim sohbette `contactInfoGuard` ile engellenir.
10. **Paketsiz üye:** `membership === 'free'` → `UnpaidMemberGate` (dashboard/mesajlar/program/takvim/kütüphane). `/health-test` kayıt serbest, AI analiz yok. Profil + `/membership` açık. Stripe Portal: `POST /api/stripe-checkout` · `action: create-portal-session`. Hakediş: video attendance → `staff_earnings`.

---

## 1. Stack

| | |
|--|--|
| App | Vite 8 + React 19 + RR7 + Tailwind 4 · `src/main.jsx` → `App.jsx` |
| State | `AppContext` dilimleri: `useAuth` / `useData` / `useActions` (+ `useApp`) |
| DB/Auth/Storage | Supabase · `setup.sql` + `migrations/` |
| Ödeme | Stripe Checkout + webhook (web). RevenueCat/IAP **bu repoda yok**. |
| Video | Daily.co · `api/daily-room.js` |
| AI | Kalori GPT-4o · Staff sağlık GPT-5.4 · Blog/ipucu Gemini flash-lite |
| Deploy | `vercel.json` SPA rewrite + cron + `sitemap.xml` → `api/sitemap` · build: `vite` + `prerender-seo.mjs` |

---

## 2. Durum (2026-07-29)

**Canlı / tamam:** Stripe Checkout+webhook · Google OAuth · HT hub `/health-test` · kalori AI · **sağlık skoru (üye dashboard) + staff brief (GPT-5.4)** · blog + günlük tüyo cron · SEO `/online-diyetisyen` `/online-kocluk` · private video + 15dk imza · RLS + üyelik güvenlik Faz1 · personel program builder (koç: haftalık gün şablonu + gün bazlı seans saati; diyetisyen: tam sayfa liste builder).

**Kaldırıldı (2026-07-28):** AI Basic/Eko program+diyet üretimi · Coaching Engine · `ai-nutrition-tips` fn · Basic/Eko yeni satış. (Staff sağlık analizi 2026-07-29 geri eklendi — program üretimi yok. Ücretsiz kayıt 2026-07-29 yeniden açıldı.)

**Ops açık:** GSC, admin içerik, yasal metin ince ayar. Denetim Faz 2–3 (paketsiz lock, Portal, hakediş) tamam → `docs/ROADMAP_DENETIM.md`. Faz 4–5 (aktivasyon, auto-renew) bekliyor.

**Mobil:** Expo app **bu repoda yok**. Handoff spec’ler henüz `docs/mobile/` altında yok — skill’ler hedef yapıyı tanımlar.

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
| `eko_diyet` | evet | diyetisyen (1/ay) | Diyet’in ekonomik versiyonu |
| `diyet` | evet | diyetisyen (2/ay) | |
| `eko_spor` | evet | koç (1/ay) | Spor’un ekonomik versiyonu; kan tahlili yok |
| `spor` | evet | koç (2/ay) | Kan tahlili yok |
| `doktor` | evet | tek sefer doktor | |
| `vip` | evet | koç+diyet | |

Onboarding: zorunlu ücretli plan → Stripe. Fiyat/atama: `src/data/membershipPlans.js` · `src/services/staffAssignment.js`.

---

## 5. AI sistemleri

### 5.1 Kalori / blog / ipucu / staff sağlık

| Endpoint | Model | Not |
|----------|-------|-----|
| `ai-food-text` / `ai-food-vision` | GPT-4o | plan guard · `food_dictionary` cache |
| `ai-health-analysis` | GPT-5.4 (`OPENAI_HEALTH_MODEL`) | HT tamamlanınca 1×; staff-only 8 skor + `staffBrief`; program/diyet yok |
| `ai-blog-generate` default | Gemini | cron 05:00 |
| `?task=daily-tip` | Gemini | cron 04:00 · `site_content` |
| `?task=membership-expiry` | — | cron 03:00 · `api/_membershipExpiry.js` |

### 5.2 Sağlık testi + staff AI rapor

- HT 6 kategori: `healthTestSections.js`
- Tamamlanınca `useHealthAnalysisSync` → `/api/ai-health-analysis` → `members.data.healthAnalysis` (+ `healthScoreHistory`)
- Üye dashboard: `HealthScoreCard` — genel skor /100 + 8 boyut (+ trend); `staffBrief` **gösterilmez**
- Koç/diyetisyen: `StaffHealthBrief` (skor + brief); fingerprint stale → “Güncel değil” + yeniden analiz. HT/profil değişmediyse yeniden analiz **yok** (UI + hook + API 409)
- Programlar: personel (koç/diyetisyen) gönderir → `programs` tablosu
  - Koç: `/staff/clients/:id/program` — haftalık şablon (`scheduleType: 'weekly'`, `entry.day` + gün bazlı seans saati); aralık bugün→paket bitişi; müsait olmayan günlere yazılmaz
  - Diyetisyen: `/staff/clients/:id/list` — `NutritionProgramBuilder` (mantık aynı, tam sayfa UX)
  - Admin: `/admin/programs` liste/sil/görüntüle · `/admin/programs/:id/edit` tam düzenleme (`deleteProgram` / `updateProgram`; koç UI → `CoachProgramEditor`)

---

## 6. Vercel serverless haritası

**Serverless (~12):** `ai-blog-generate` · `ai-food-text` · `ai-food-vision` · `ai-health-analysis` · `application-notify` · `auth` · `contact` · `daily-room` · `sitemap` · `stripe-checkout` · `stripe-webhook` · `telegram-notify`

**Multiplex özet:**

- `auth` — signup/login/reset · book-session · session-attendance · exercise-video-url(s) · ga4 · ai-usage · single-session · Turnstile
- `ai-blog-generate` — blog · daily-tip · supabase-health · membership-expiry
- `stripe-checkout` — Checkout session · `action: create-portal-session` (Customer Portal)

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
| Promptlar | `api/_ai-prompts.js` (food + health score + blog + tip) |
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

## 11. Son delta (2026-07-29)

- Paket kataloğu: `eko_diyet` / `eko_spor` satışa açıldı (1299/2999/3999; ayda 1 görüşme).
- Spor / Eko Spor: kan tahlili (doktor hakkı) kaldırıldı; Diyet / Eko Diyet / Vip’te kaldı.
- Özellik satırı: “Yeniform Kişisel Sağlık Analizi” (diyet/spor/vip + eko’lar).
- GPT-5.4 sağlık skoru + `staffBrief` (`api/ai-health-analysis.js`); program/diyet AI yok.
- Üye panel: `HealthScoreCard` (genel /100 + boyutlar); brief personelde.
- HT tamamlanınca otomatik 1×; stale fingerprint → personel yeniden analiz. Aynı fingerprint’te yeniden analiz engelli.
- Kalori GPT-4o · blog/tip Gemini ayrı kaldı.
- Hobby serverless 12/12 (`ai-health-analysis` slotu kullanıldı).
- Faz 2–3: `UnpaidMemberGate` (`membership === 'free'`), Stripe Portal (`stripe_customer_id`), video attendance → `staff_earnings`, `aiAnalysis` orphan silindi.

## 11b. Önceki delta (2026-07-28)

- AI program/diyet/skor/tips kaldırıldı; `ai-nutrition-tips` silindi.
- Kalori + blog + günlük tüyo kaldı.
- Basic/Eko yeni satış kapandı; ücretsiz kayıt geçici kapandı sonra 2026-07-29 yeniden açıldı; Eko Diyet/Eko Spor yeniden satıldı (`SELLABLE_PLAN_IDS`).
- `membership-expiry` → `api/_membershipExpiry.js`; `eko-renew` kaldırıldı.
