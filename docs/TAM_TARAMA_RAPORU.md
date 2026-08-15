# Yeni Form — Tam Ürün Tarama Raporu

> **Tarih:** 2026-07-29  
> **Kapsam:** Web repo (Vite SPA + Vercel `api/` + Supabase) — public / auth / üye / staff / admin  
> **Yöntem:** Rota+nav+API envanteri, referans grafı, gate çapraz kontrol, kod UX walk, Supabase advisors  
> **Kod değişikliği:** Bu rapor yalnızca bulgu; silme/ekleme ayrı uygulama turunda

**SoT:** [`AI_PROJE_REHBERI.md`](../AI_PROJE_REHBERI.md) · [`docs/ROADMAP_DENETIM.md`](ROADMAP_DENETIM.md) · [`src/App.jsx`](../src/App.jsx)

---

## Özet verdict

> **UYARI (2026-08-02):** Bu raporun gövdesi 2026-07-29 tarihli tarama notları içerir. Güncel SoT: freemium (48s deneme YOK), Expo/mobil bu repoda YOK, `fullVideo` entitlement YOK. Aşağıdaki 48s / Expo / fullVideo satırları tarihseldir — uygulama için kullanmayın.

**2026-08-02:** Mobil/Expo docs + Expo Push bu web reposundan kaldırıldı. Freemium (ücretsiz kayıt + soft-lock) SoT.
**2026-07-29 uygulama sonrası:** Tur 1–5 + legal/GSC hazır; web omurga tamam. **2026-08-14:** Stripe Live webhook `invoice.paid` + `customer.subscription.deleted` doğrulandı.

| Alan | Durum (güncel) |
|------|--------|
| Rota / gate / SEO | P0 hydrate + unpaid gate hizası yapıldı |
| Üyelik / Stripe | Subscription auto-renew + Portal; `eko` satış kapalı |
| Faz 4 aktivasyon | Metrik + GA4 + checklist |
| API | 12/12 Hobby dolu; multiplex sağlıklı |
| Mobil | **Erteledi** — şu an genişletilmiyor |
| Supabase | `members_staff_safe` invoker; bilinen EXECUTE WARN’lar bilinçli |

---

## Faz A — Rota / gate / API envanteri

### A1. Gate modeli (kanıt)

| Bayrak | Tanım | Kaynak |
|--------|--------|--------|
| `isUnpaidMember` | `!isPaidMembership(membership)` — denemede de **true** | [`AppContext.jsx`](../src/context/AppContext.jsx) ~1341–1345 |
| `canAccessMemberDashboard` | ücretli **veya** aktif 48s deneme | [`membershipPlans.js`](../src/data/membershipPlans.js) `canAccessMemberDashboard` |
| `isFreeTrialActive` | `free` + geçerli `freeTrialExpiresAt` | aynı |

**Rehber §0.10 ile uyum:** denemede dashboard + HT + AI 1×; mesaj/program/takvim/kütüphane gate.

### A2. Üye paneli matrisi

| Path | Page | Nav | Gate | Empty/loading | API/DB |
|------|------|-----|------|---------------|--------|
| `/dashboard` | DashboardPage | evet | `canAccessMemberDashboard` → değilse `UnpaidMemberGate` | skor/program kartları | hydrate + healthAnalysis |
| `/health-test` (+/:sectionId, /finish) | HT pages | evet | deneme bitince `saveOnly` (AI yok) | bölüm progress | `ai-health-analysis` |
| `/calendar` | CalendarPage | evet | `UnpaidMemberGate` if unpaid | program boş halleri | programs + completion |
| `/calorie` | CalorieCalculatorPage | evet | **entitlement** (`memberHasManual/PhotoCalorieAccess`) — `UnpaidMemberGate` yok | kilit UI + `/membership` CTA | `ai-food-text` / `ai-food-vision` |
| `/schedule` | AppointmentsPage | evet | **paket tab** `packageIncludes*` + EmptyState — tam gate yok | `MemberScheduleView` locked | `auth` book-session |
| `/messages` (+/:role) | MessagesPage | evet | `UnpaidMemberGate` | EmptyState | chat realtime |
| `/programs` | ProgramsPage | evet | `UnpaidMemberGate` | EmptyState | programs |
| `/library` | ExerciseLibraryPage | evet | `UnpaidMemberGate`; program-scoped liste | EmptyState; `videoPending` stub | `auth` exercise-video-url(s) |
| `/notifications` | NotificationsPage | evet | **yok** (erişilebilir) | EmptyState | members.data |
| `/support` | SupportPage | evet | **yok** (erişilebilir) | — | tickets |
| `/profile` | ProfilePage | evet | `UnpaidMemberProfileAlert` inline | — | members |
| `/profile/payments` | PaymentManagementPage | evet | açık | EmptyState | payments + Portal |
| `/call/:…` | VideoCallPage | hayır | Auth only (shell dışı) | — | `daily-room` + attendance |
| `/membership` (public) | MembershipComparisonPage | yalnız `free` upgrade chip | public | — | plans / Stripe |

### A3. Public / auth

| Path | Nav/chrome | Hydrate pass-through | Not |
|------|------------|----------------------|-----|
| `/` | PublicLayout | evet | Landing |
| `/login`, `/forgot-password`, `/reset-password`, `/onboarding`, `/auth/callback` | auth fast | evet | |
| `/membership`, `/hakkimizda`, `/stories`, `/blog`, `/corporate`, `/team/*`, `/legal/*` | public | evet (`/team`, `/legal` prefix) | |
| `/online-diyetisyen`, `/online-kocluk` | public | **HAYIR** | hydrate sırasında full `LoadingScreen` riski |
| `/register` → onboarding, `/about` → hakkimizda, `/builder` → membership | redirect | — | |
| `/kvkk` `/privacy` `/terms` | redirect → legal | evet | |

### A4. Staff (rol nav)

| Path | Coach | Dietitian | Doctor | Not |
|------|-------|-----------|--------|-----|
| `/staff`, `/staff/profile`, `/staff/clients`, `/staff/notifications`, `/staff/messages` | nav | nav | nav | |
| `/staff/collab-messages` | nav | nav | hayır | |
| `/staff/admin-messages` | nav | nav | nav | |
| `/staff/programs` (+edit) | nav | rota var, nav yok | rota var, nav yok | diyetisyen/doktor URL ile erişebilir |
| `/staff/lists` | hayır | nav | hayır | |
| `/staff/library` | nav | `StaffLibraryGate` yönlendirir | aynı | |
| `/staff/payments` | nav | nav | nav | gerçek `staff_earnings` |
| `/staff/clients/:id/health\|program\|list` | deep | deep | deep | program=koç, list=diyet |
| `/staff/call/…` | shell dışı | | | Daily |

### A5. Admin

Tüm `ADMIN_NAV` path’leri `App.jsx` ile eşleşiyor. Ek deep link’ler: `members/:id/health`, `programs/:id/edit`, `messages/{staff,audit,collab}/…`.

### A6. API envanteri (12/12)

| Handler | Actions / tasks | Auth / guard notu |
|---------|-----------------|-------------------|
| `auth.js` | signup, unlock-signup, password-login, email-send/confirm, password-reset, book-session, session-attendance, exercise-video-url(s), ga4-report, ai-usage-report, claim/verify-active-session | Turnstile + rate limit (bot-guarded set) |
| `ai-blog-generate.js` | blog, daily-tip, supabase-health, membership-expiry | CRON / üye tip |
| `ai-food-text.js` / `ai-food-vision.js` | — | plan guard |
| `ai-health-analysis.js` | skor + staffBrief | ücretli veya 48s deneme; force yalnız ücretli |
| `application-notify.js` | Expo push | eski form payload → **410**; mobil push canlı |
| `contact.js` | contact, staff_application, corporate_application, staff_doc_upload | Turnstile |
| `daily-room.js` | room + token | session auth |
| `sitemap.js` | SEO | public |
| `stripe-checkout.js` | Checkout + `create-portal-session` | üye auth (portal) |
| `stripe-webhook.js` | checkout completed/expired/failed, payment_intent failed | Stripe signature |
| `telegram-notify.js` | login/signup lifecycle | internal |

---

## Faz B — Ölü / legacy kod

### B1. Silme adayları (0 çağrı doğrulandı)

| Hedef | Dosya | Kanıt | Öneri |
|-------|-------|-------|--------|
| `shouldAutoplayExerciseVideo` | `src/utils/videoPlayerPlatform.js:120` | yalnız tanım; UI `shouldAttemptAutoplay` kullanıyor | **Sil** |
| `getHealthPackageContext` | `src/data/healthTest.js:194` | 0 import; her zaman `{hasCoach:true, hasDietitian:true}` | **Sil** |
| `buildCoachProgramPayload` | `src/utils/coachProgram.js:168` | 0 çağrı; editor `dayCarts` yolunu kullanıyor | **Sil** |

### B2. Legacy — sakla (hâlâ canlı)

| Hedef | Durum | Öneri |
|-------|--------|--------|
| `applyStaffAssignments` | `@deprecated` ama [`supabaseDb.js`](../src/services/supabaseDb.js) import + çağrı (~2390) | Atama tarafını `assignStaffOnly`’ye indir; session alanlarını ayır; sonra deprecated kaldır |
| `cycleDay` / `cycleSameDaily` / `usesLegacyCycleDayRotation` | Programs + NutritionProgramBuilder + programSchedule aktif | Sakla; yeni programlar weekly/cycleSameDaily |
| `videoPending` | Admin library + VideoPlayer + üye “Video yakında” | Ürün kararı: zorunlu video / gizle / tut |
| Legacy plan ID `eko` (+ gumus/altin…) | Katalog + migrate; **DB’de 0 `eko` üye** | Satış kapalı kalsın; migrate helper sakla; admin cleanup opsiyonel |
| `application-notify` 410 | Bilinçli kapanış | Dokümante; silme yok |

### B3. Orphan sayfalar

`src/pages/**` lazy listesi `App.jsx` ile örtüşüyor. Yardımcı: `staff/staffAppointments.js` (sayfa değil). Orphan page yok.

### B4. `memberHasFullVideoAccess`

Tanımlı ([`memberPackages.js`](../src/utils/memberPackages.js)) ama **hiçbir sayfada kullanılmıyor**. Üye kütüphanesi yalnızca `isUnpaidMember` + program-scoped filtre. Entitlement `fullVideo` admin plan editöründe var; runtime’da etkisiz → video-pazarlama kararının teknik borcu.

---

## Faz C — Eksikler / ne eklenmeli (P0–P2)

### P0 — güvenlik / para / erişim tutarlılığı

| # | Bulgu | Kanıt | Öneri |
|---|--------|-------|--------|
| P0-1 | SEO hydrate blokajı | `authPaths.js` içinde `/online-diyetisyen` / `/online-kocluk` yok | `PUBLIC_HYDRATE_PASS_THROUGH`’a ekle |
| P0-2 | Supabase `members_staff_safe` SECURITY DEFINER view | Advisor ERROR | [Linter 0010](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view) — bilerek mi doğrula; gerekirse INVOKER/policy |
| P0-3 | Anon EXECUTE `is_admin`, `phone_in_use`, `get_online_stats` | Advisor WARN | Kasıtlı public RPC değilse `REVOKE EXECUTE FROM anon` |
| P0-4 | Authenticated EXECUTE admin_* RPC | Advisor WARN | Fonksiyon içi `is_admin()` guard’ı kodda doğrula; yoksa revoke |

### P1 — dönüşüm / UX / ürün dürüstlüğü

| # | Bulgu | Kanıt | Öneri |
|---|--------|-------|--------|
| P1-1 | Gate UX tutarsızlığı | Kalori entitlement UI; randevu tab-lock; diğerleri `UnpaidMemberGate` | Free için schedule’da da tam gate veya ortak “paket yok” shell |
| P1-2 | Landing “Ücretsiz Başla” + emoji pill + stats strip | `LandingPage.jsx` hero | 48s deneme copy netleştir; hero clutter azalt (marka + 1 headline + 1 CTA) |
| P1-3 | Şişirilmiş üye/online sayıları | `displayPlatformStats.js` | **KİLİTLİ (2026-08-13):** üye <750 → 750+; ≥750 gerçek. Çevrimiçi <20 → oturum 20–25; ≥20 gerçek. Asla geri alınmaz. |
| P1-4 | Video kütüphanesi vaadi vs erişim | SEO/onboarding “kütüphane”; üye program-scoped; `fullVideo` unused | ROADMAP açık maddesini kapat: A) program-only B) fullVideo entitlement uygula C) copy yumuşat |
| P1-5 | Aktivasyon funnel (Faz 4) | ROADMAP bekliyor | Onboarding → Stripe → ilk HT → ilk program/mesaj ölçümü |
| P1-6 | Stripe Subscription auto-renew (Faz 5) | Checkout one-shot + Portal | Ürün kararı sonrası |

### P2 — temizlik / ops / docs

| # | Bulgu | Öneri |
|---|--------|--------|
| P2-1 | 3 deprecated 0-call export | Silme turu |
| P2-2 | `eko` DB cleanup | 0 üye → katalog legacy notunu sadeleştir (migrate sakla) |
| P2-3 | GSC / admin içerik / yasal ince ayar | Ops backlog |
| P2-4 | `docs/mobile/` yok | Expo handoff spec (ayrı iş) |
| P2-5 | Hobby 12/12 | Yeni endpoint yok; multiplex |
| P2-6 | Perf: unindexed FK, multiple permissive policies on `session_recordings` | Düşük öncelik index/RLS sadeleştirme |
| P2-7 | AI program/diyet | Bilinçli yok — ekleme |

---

## Faz D — UX taraması

Skor: netlik / mobil / boş-hata / vaat uyumu (1–5). Kod walk; canlı QA önerilir.

### Hotspots (en düşük)

| Ekran | N/M/B/V | Sorun | Düzeltme tipi |
|-------|---------|-------|---------------|
| Landing hero | 3/4/4/2 | Emoji pill, 🚀 CTA, stats, “Ücretsiz Başla” vs deneme; marka hero’da zayıf kalabilir | UI + copy |
| `/online-*` SEO | 4/4/3/3 | Hydrate LoadingScreen; kütüphane vaadi | P0-1 + P1-4 |
| `/calorie` (free) | 3/4/4/3 | Gate dili farklı; deneme boyunca da kilitli (rehber OK, UX şaşırtıcı) | Copy / trial entitlement kararı |
| `/schedule` (free) | 3/4/4/2 | Üç tab + “paketinizde yok” — tam duvar yok | Gate parity |
| `/library` | 4/4/4/3 | Program yoksa boş; `videoPending` “yakında”; fullVideo unused | Ürün kararı |
| Dashboard deneme bitişi | 4/4/4/4 | Gate net | — |
| Bildirimler | 4/4/4/4 | False-positive için hydrate wait var | Regresyon izle |
| Staff builder | 4/4/4/4 | Tam sayfa UX olgun | — |
| Admin content/analytics | 3/4/3/3 | Ops boşluk “yarım” hissi | İçerik doldurma |
| LiveActiveCounter | 3/4/3/2 | Floor 750+ / online 20–25 (kilitli 2026-08-13) | P1-3 kapandı |

### İyi gidenler

- AppShell / StaffShell / AdminShell + `PanelMobileMenu` (`md`) tutarlı  
- `EmptyState` admin/staff/üye mesaj-program-ödeme’de yaygın  
- `UnpaidMemberProfileAlert` profilde erişimi koruyor  
- Staff iletişim gizliliği (`members_staff_safe`) ürün kuralı olarak mevcut (view SECURITY DEFINER — P0-2)

### 48s deneme erişim özeti (doğrulandı)

| Açık | Kapalı (unpaid gate / entitlement) |
|------|-------------------------------------|
| Dashboard + skorlar | Calendar, Messages, Programs, Library |
| Health test + AI 1× | Calorie (entitlement false) |
| Profile, Support, Notifications, Payments, Membership | Schedule booking (packageIncludes false) |

---

## Faz E — Öncelikli backlog (uygulama turları)

### Tur 1 — P0 (hızlı)

1. `PUBLIC_HYDRATE_PASS_THROUGH` ← `/online-diyetisyen`, `/online-kocluk`  
2. Supabase advisor: `members_staff_safe` + anon/authenticated EXECUTE gözden geçirme  
3. (Opsiyonel) Admin RPC grant audit

### Tur 2 — ölü kod

1. Sil: `shouldAutoplayExerciseVideo`, `getHealthPackageContext`, `buildCoachProgramPayload`  
2. `applyStaffAssignments` → ince sarmalayıcı veya `assignStaffOnly` refactor  
3. `eko` cleanup notu (0 üye)

### Tur 3 — UX hotspots

1. Landing hero sadeleştir + deneme-dürüst CTA  
2. `/schedule` free → `UnpaidMemberGate` (veya ortak unpaid shell)  
3. Kalori kilit copy’sini gate diline hizala  
4. Video kararı A/B/C uygula (`fullVideo` veya copy)

### Tur 4 — Faz 4/5 (ürün onayı)

1. Aktivasyon funnel metrikleri  
2. Stripe Subscription kararı  
3. `docs/mobile/` handoff başlangıcı

---

## Ek — DB snapshot (tarama anı)

```text
members.membership: free=6, vip=5  (eko=0)
```

Supabase security: 1 ERROR (`members_staff_safe` definer view) + çok sayıda SECURITY DEFINER EXECUTE WARN.  
Performance: unindexed FK (`ai_usage_logs`, `meal_analysis_cache`), multiple permissive policies (`session_recordings`, `site_content`), birçok unused index (INFO).

---

## Bilinçli dışı

- Expo uygulama kodu  
- `dist/`, `node_modules`  
- Yeni AI program/diyet özelliği  
- Plan dosyasının kendisi (değiştirilmedi)

---

## Uygulama durumu (Tur 1–5 + ops, 2026-07-29)

**Kararlar:** istatistik floor **kilitli (2026-08-13):** üye <750 → 750+, ≥750 gerçek; çevrimiçi <20 → oturum 20–25, ≥20 gerçek · kütüphane program-scoped · Subscription açık · **mobil ertelendi**.

| Madde | Durum |
|-------|--------|
| P0-1 SEO hydrate | Yapıldı — `authPaths.js` |
| P0-2 `members_staff_safe` | Yapıldı — `security_invoker` migration |
| P0-3/4 EXECUTE WARN | Bilinçli istisna — `SECURITY_OPS.md` |
| Ölü export silme | Yapıldı |
| `applyStaffAssignments` | Kaldırıldı → `assignStaffOnly` |
| Schedule gate | Yapıldı |
| Kalori unpaid gate + copy | Yapıldı |
| Landing CTA 48s | Yapıldı (stats aynı) |
| P1-3 public stats floor | **Kilitli 2026-08-13** — 750+ / 20–25; geri alınmaz |
| Video copy hizası | Yapıldı (runtime aynı) |
| Faz 4 aktivasyon | Tamamlandı — metrik + GA4 + checklist |
| Faz 5 Subscription | Tamamlandı — recurring auto-renew + eko pasif |
| Legal + GSC prep | Tamamlandı — manuel GSC/Stripe Dashboard kaldı |
| FAQ / SEO copy | Eko paketler + 48s deneme hizası |
| Mobil handoff | **Duraklatıldı** — genişletme yok |

---

## KİLİTLİ ürün kararı — public istatistik (2026-08-13)

Kaynak: `src/utils/displayPlatformStats.js` · Cursor kuralı: `.cursor/rules/platform-display-stats-locked.mdc`

Bu karar **geri alınmaz**. Kullanıcı açıkça “kaldır” demedikçe floor’u 0 yapma / gerçek sayıya çevirme.

| Metrik | Gerçek değer eşik altı | Eşik ve üzeri |
|--------|------------------------|---------------|
| Toplam üye (landing şerit, hero, hakkımızda) | **750+** | Gerçek sayı (`showPlus` yok) |
| Şu an çevrimiçi (landing şerit) | Oturumda sabit rastgele **20–25** | Gerçek sayı |

Admin / staff panelleri gerçek `onlineNow` / üye sayısını göstermeye devam eder.
