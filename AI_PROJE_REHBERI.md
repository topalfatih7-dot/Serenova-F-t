# Yeni Form (donusum-programi) — Yapay Zeka Proje Rehberi

> **Bu dosyanın amacı:** Başka bir yapay zekaya veya geliştiriciye projeyi satır satır aramadan anlatabilmek.  
> **Proje kökü:** `Adsız/` (macOS: `/Users/mac/Desktop/Serenova-F-t/Adsız`)  
> **Vercel proje:** `topalfatih7-3924s-projects/serenova-f-t`  
> **Marka adı:** Yeni Form (`src/config/brand.js`)  
> **Son güncelleme:** 2026-07-07 · §61 takvim hareket modalı · sağlık testi birleştirme · UX iyileştirmeleri  
> **Son oturum özeti:** Takvim `ExerciseDetailModal` + xs thumbnail · diyetisyen test bölüm birleştirme · scroll/menü · kütüphane filtreleri

---

## Son Durum Özeti (2026-07-07)

**Canlı:** `https://www.yeniform.com` · Vercel `serenova-f-t` · Supabase Auth + PostgreSQL + Storage

| Alan | Durum | Doğrulama / Not |
|------|-------|-----------------|
| Stripe Checkout + webhook | ✅ Canlı | `STRIPE_WEBHOOK_SECRET` Vercel production'da; `npm run test:stripe`, `npm run test:stripe:checkout` |
| Sosyal giriş | Google only | Apple/Facebook UI kaldırıldı — `src/services/oauthAuth.js` |
| RLS performans | ✅ Uygulandı | Migration `20260705_rls_performance_tuning.sql`; `npm run test:rls` (19/19) |
| Storage güvenliği | ✅ | `staff-application-docs` listeleme admin-only; `exercise-videos` private + imzalı URL |
| Kayıt → Stripe UX | ✅ | Header `isFullyRegistered` — ödeme öncesi sahte "Profil · İsim" yok |
| Sağlık testi akışı | ✅ | Hub `/health-test` · kategori `/health-test/:sectionId` · onay `/health-test/finish`; grid 2/3/4 sütun |
| Hareket kütüphanesi filtreleri | ✅ | Konum + makine (`locations`, `requires_machine`); sıralama UI kaldırıldı (varsayılan A→Z) |
| Programlarım antrenman UI | ✅ | `ExerciseVideoThumbnail` — hareket satırında video ilk karesi (sol) |
| Takvim antrenman detayı | ✅ | `ExerciseDetailModal` (thumbnail tık); `İzle` inline video; satırda açıklama yok |
| Diyetisyen sağlık testi | ✅ | 3 bölüm birleştirildi; `diet_activity` koç paketinde gizli (`skipWhenCoach`) |
| Personel sağlık görünümü | ✅ | `showHealthAnalysis={false}` personelde; admin'de tam analiz |
| Ekip mesajları etiketleme | ✅ | Personel adı birincil; alt başlık `Danışan adına: …` |
| Üye navigasyon | ✅ | `memberNav.js` — Sağlık Testi `/health-test`, Randevular `/schedule?tab=` |
| GA4 Consent Mode | ✅ | `ga4Loader.js` + `ConsentBanner` — onay sonrası yükleme |
| Admin GA4 hunisi | Kısmi | Platform hunisi + opsiyonel `api/ga4-report` (service account) |
| Blog slug SEO | ✅ | `blogSlug.js` — `/blog/baslik-slug` (+ UUID uyumluluk) |
| Çıkış UX | ✅ | `loggingOut` — Sidebar, Profile, Staff/Admin shell, mobil menü |
| Paket süre gösterimi | ✅ | `getPlanDurationLabel()` — landing, onboarding, süre seçici |
| Admin → Premium Yönetimi | ✅ | **Tüm üyeler** (Basic dahil) listelenir; paket/süre/atama değiştirilebilir |
| Veritabanı migrasyon | Otomatik | `npm run db:migrate` — `.cursor/rules/supabase-auto-migrate.mdc` |
| Bilinçli bekleyen | ⚠️ Manuel | `auth_leaked_password_protection` → Supabase Dashboard → Auth → Policies |

**Kritik kural:** Production veri kaynağı yalnızca `src/services/supabaseDb.js`. Kayıt sırasında auth session Stripe öncesinde açılır (`ensureAuthForRegistration`); `members` satırı webhook ile oluşur — bu yüzden header'da `hasRegisteredMember()` kontrolü vardır.

---

## Nasıl Kullanılır (AI için)

1. Önce **§2 Mimari Özet** ve **§3 Veri Akışı** bölümlerini oku.
2. Bir özellik arıyorsan **§5 Sistemler (Detaylı)** tablosuna bak.
3. Bir dosya arıyorsan **§7 Tam Dosya Envanteri** listesine bak.
4. Veritabanı değişikliği için **§4 Veritabanı** ve `supabase/` SQL dosyalarına bak.
5. Rota/sayfa eşlemesi için **§6 Rota Haritası** bölümüne bak.
6. Son değişiklikler için **§53–61 Değişiklik Günlüğü** (2026-07-03 — 2026-07-07); tam arşiv **§14–52** (2026-06 — 2026-07-01).
7. **Güncel proje durumu** için dosyanın başındaki **Son Durum Özeti** tablosuna bak.
8. Ortam değişkenleri ve auth durumu için **§34.4**; telefon SMS (Twilio) yeniden açılınca **§34.5** bölümüne bak.
9. **Şifre sıfırlama ve Supabase e-posta şablonları** için **§46** bölümüne bak.
10. **Paket → koç/diyetisyen atama mantığı** için **§36.1** ve `membershipPlans.js` yardımcı fonksiyonlarına bak.
11. **Her sayfanın ne yaptığı** için **§36.8 Sayfa Envanteri (AI için detaylı)** bölümüne bak.
12. **Harici servis kurulumu / yapılacaklar** için **`docs/setup/README.md`** indeksine bak (Supabase, OAuth, Stripe, Telegram, AI, Video, SEO).

**Kritik kural:** Production veri kaynağı yalnızca `src/services/supabaseDb.js`. (Eski `localDb.js` legacy katmanı silindi.)

---

## 1. Proje Özeti

| Alan | Değer |
|------|-------|
| Tür | React 19 SPA (Single Page Application) |
| Build aracı | Vite 8 |
| Stil | Tailwind CSS 4 |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Sunucu API | Vercel Serverless (`api/` klasörü) |
| Video görüşme | Daily.co (`@daily-co/daily-js`) |
| Bildirimler | Telegram Bot API |
| Dağıtım | Vercel (`vercel.json` SPA rewrite) |

### npm komutları (`package.json`)

| Komut | İşlev |
|-------|-------|
| `npm run dev` | Geliştirme sunucusu (Vite) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Build önizleme |
| `npm run lint` | ESLint |
| `npm run test:ai` | AI endpoint testleri (`scripts/test-ai.mjs`) |
| `npm run test:stripe` | Stripe webhook imza + olay işleme testi (`scripts/test-stripe-webhook.mjs`) |
| `npm run test:stripe:checkout` | Canlı Stripe Checkout session oluşturma testi (ödeme almaz) |
| `npm run test:rls` | RLS politika davranış testi (`scripts/test-rls-policies.mjs`) |
| `npm run db:migrate` | Supabase migration'ları uygular (`scripts/db-migrate.mjs`) |
| `npm run import:exercises` | Hareket kütüphanesi import pipeline |
| `npm run backfill:exercise-locations` | Yalnızca `locations` + `requires_machine` backfill (çeviri yok) |
| `npm run og:image` | Open Graph görseli üretir |

---

## 2. Mimari Özet

```
main.jsx
  └─ App.jsx
       ├─ AppProvider (AppContext) ──► supabaseDb.hydrate()
       ├─ ToastProvider
       └─ BrowserRouter
            ├─ PublicLayout (/, login, onboarding, blog…)
            ├─ RequireAuth role=member + AppShell (üye paneli)
            ├─ RequireAuth role=staff + StaffShell (personel paneli)
            └─ RequireAuth role=admin + AdminShell (admin paneli)
```

### Giriş noktaları

| Dosya | Satır | Ne yapar |
|-------|-------|----------|
| `src/main.jsx` | 1–10 | React StrictMode, `#root` mount, `index.css` import |
| `src/App.jsx` | 51–122 | Tüm route tanımları, layout shell'leri |
| `src/context/AppContext.jsx` | 24–441 | Merkezi state, tüm CRUD aksiyonları |
| `src/services/supabaseDb.js` | 173–235 | `hydrate()` — tüm veriyi Supabase'den çeker |

---

## 3. Veri Akışı

```
Tarayıcı
  │
  ├─► Supabase Auth (login/register/logout)
  │     └─► members tablosu (trigger: handle_new_user)
  │
  ├─► supabaseDb.hydrate()
  │     ├─ Herkese açık: staff, posts, site_content, exercises, plans
  │     └─ Giriş varsa: members, programs, tickets, activities, payments
  │     └─ Admin ise ek: staff_applications, corporate_applications, contact_inquiries
  │
  ├─► AppContext → useApp() → tüm sayfalar
  │
  ├─► POST /api/telegram-notify (giriş/kayıt bildirimi)
  │
  ├─► POST /api/contact (Bize Ulaşın → Telegram ikincil; birincil kayıt `contact_inquiries` RPC)
  │
  ├─► POST /api/calorie-chat-notify (Kalori chat → Telegram iletişim chat'i)
  │
  ├─► POST /api/ai-food-text (Kalori chat → Gemini metin analizi)
  │
  ├─► POST /api/ai-food-vision (Fotoğraf kalori — Platinum)
  │
  ├─► GET/POST /api/ai-blog-generate (Günlük blog cron — CRON_SECRET)
  │
  └─► Daily.co WebRTC (VideoCallPage → useDailyCall)
```

### Rol çözümleme (`supabaseDb.js` → `roleForUser`)

| Rol | Koşul | Yönlendirme (LoginPage) |
|-----|-------|-------------------------|
| **admin** | E-posta = `admin@serenova.fit` | `/admin` |
| **staff** | E-posta `staff` tablosunda kayıtlı | `/staff` |
| **member** | Diğer tüm auth kullanıcıları | **`/profile`** |

> `roleForEmail()` tanımlı ama kullanılmaz. Aktif: `roleForUser(user, staffList)`.

Admin e-postası üç yerde senkron olmalı:
- `src/config/brand.js` → `ADMIN_CREDENTIALS.email`
- `supabase/setup.sql` → `is_admin()` fonksiyonu
- `supabase/create_admin.sql` → admin kullanıcı oluşturma

---

## 4. Veritabanı (Supabase)

### SQL dosyaları (`supabase/`)

**Artık TEK dosya var:** `setup.sql` — idempotent, kendi kendine yeten tertemiz kurulum.
Eski monolitik `schema.sql` kaldırıldı; şema kaynağı `setup.sql` + `migrations/`
(hepsi `setup.sql` içinde birleştirildi).

| Dosya | Ne yapar | Ne zaman çalıştırılır |
|-------|----------|----------------------|
| `setup.sql` | Eklentiler, tüm tablolar, RLS, trigger, RPC'ler, storage bucket, varsayılan paketler ve onaylı admin kullanıcısı | İlk/temiz kurulum — Supabase SQL Editor |
| `migrations/*.sql` | Artımlı değişiklikler (staff_applications, corporate_applications, contact_inquiries, vb.) | Cursor Supabase MCP `apply_migration` **(tercih)** veya SQL Editor |

> **`custom_foods` kaldırıldı** (2026-06-24) — kalori chat artık bu tabloya yazmıyor. Migration: `20260624_corporate_contact_cleanup.sql`.

### Uzak Supabase projesi (production)

| | |
|---|---|
| Proje adı | **Yeni Form** |
| Project ref / ID | `rvzksmyhsgxgrxgeabmi` |
| Bölge | `ap-south-1` |
| API URL | `https://rvzksmyhsgxgrxgeabmi.supabase.co` |

Cursor **Supabase MCP** eklentisi bağlıyken ajan, bu projede migration uygulayabilir, SQL doğrulaması yapabilir ve şema değişikliklerini uzaktan yönetebilir.

### Migration uygulama (tercih: Cursor Supabase MCP)

1. Repoda `supabase/migrations/YYYYMMDD_aciklama.sql` oluştur veya güncelle.
2. MCP **`apply_migration`** — `project_id: rvzksmyhsgxgrxgeabmi`, `name: snake_case`, `query: <dosya içeriği>`.
3. MCP **`list_migrations`** — uzak kayıtta göründüğünü doğrula.
4. MCP **`execute_sql`** — RPC / RLS / veri temizliği kontrol sorgusu.

**Manuel alternatif:** Supabase Dashboard → SQL Editor → migration dosya içeriğini yapıştır → Run.

**İlk/temiz kurulum:** `setup.sql` (idempotent) — yeni boş projede tek seferde tüm şema.

**Çalıştırma (manuel kurulum):** Supabase Dashboard → SQL Editor → `supabase/setup.sql` içeriğini yapıştır → Run.
Tekrar çalıştırmak güvenlidir (her şey `if not exists` / `on conflict` / `create or replace`).
Admin: `admin@serenova.fit` / `Serenova2026!`.

### Tablolar

| Tablo | Amaç | RLS özeti |
|-------|------|-----------|
| `members` | Üyeler; detaylar `data` JSONB | Üye kendi; staff atanan; admin hepsi |
| `staff` | Koç/diyetisyen/doktor kadrosu | Herkese okuma; admin yazma (`admin_upsert_staff`); personel kendi `name`+`data` günceller (`staff_update_self_profile` RPC) |
| `programs` | Antrenman/beslenme programları | Üye/staff/admin |
| `posts` | Blog yazıları | Yayınlanan herkese; admin yazar |
| `tickets` | Destek talepleri + mesajlar | Üye kendi; admin hepsi |
| `activities` | Admin aktivite akışı | Yalnız admin okur |
| `payments` | Ödeme kayıtları | Üye kendi; admin hepsi |
| `site_content` | testimonial, faq, success_story | Herkese okuma; admin yazar |
| `exercises` | Hareket kütüphanesi | Herkese okuma; admin yazar |
| `membership_requests` | ~~dondur/iptal/yenile~~ | **Kaldırıldı** (2026-06-25 migration) |
| `plans` | Üyelik paketleri | Herkese okuma; admin yazar |
| `staff_applications` | Koç/diyetisyen kadro başvuruları | RPC ile herkes insert; admin okur/onaylar |
| `corporate_applications` | Kurumsal wellness başvuruları | RPC ile herkes insert; admin okur/günceller |
| `contact_inquiries` | Landing “Bize Ulaşın” mesajları | RPC ile herkes insert; admin okur/günceller |
| `user_presence` | Çevrimiçi durum + admin istatistik | `presenceService.js` (supabaseDb dışı) |
| `chat_threads` | Üye ↔ personel sohbet thread'leri | Üye kendi; personel atanmış danışan; admin hepsi |
| `chat_messages` | Üye ↔ personel mesajları | Thread erişimi olanlar |
| `admin_staff_threads` | Admin ↔ personel sohbet thread'leri | Admin hepsi; personel kendi thread'i |
| `admin_staff_messages` | Admin ↔ personel mesajları | Thread erişimi olanlar |

**Kaldırılan tablolar:** `custom_foods` (kullanılmıyordu, 2026-06-24 migration ile drop).

### Storage

- Bucket: **`exercise-videos`** — **private** (2026-07-04 §48'den itibaren); admin yükleme
- Yükleme: `supabaseDb.uploadExerciseVideo()` → `AdminLibraryPage` — artık kalıcı public URL değil, sadece storage **path** döner
- Oynatma: `VideoPlayer.jsx` path'i görünce `supabaseDb.getExerciseVideoUrl()` → **`POST /api/auth`** (`action: 'exercise-video-url'`, service role) → **1 saatlik imzalı URL**. Vercel Hobby 12 fonksiyon limiti nedeniyle ayrı `api/exercise-video-url.js` kaldırıldı.
- Üye kütüphanesi: **Spor/VIP** (veya çoklu paket union) → tam video; diğer paketler liste görür, oynatma kilitli (`memberHasFullVideoAccess`).
- Eski kayıtlardaki tam public URL'ler de `VideoPlayer` içinde otomatik path'e çevrilip imzalanır (geriye dönük veri migrasyonu gerekmedi).
- YouTube linkleri bu akışın dışında, aynen `iframe embed` ile oynatılıyor.

### RPC fonksiyonları

| Fonksiyon | Amaç |
|-----------|------|
| `admin_upsert_staff(...)` | Staff + auth.users oluşturma/güncelleme |
| `admin_delete_staff(p_id)` | Staff + auth silme |
| `admin_delete_member(p_id)` | Üye + ödemeler, programlar, destek, sohbet, auth silme |
| `is_admin()`, `is_staff()`, `current_email()`, `current_staff_id()` | RLS yardımcıları |
| `handle_new_user()` trigger | Kayıtta `members` satırı açar |
| `submit_staff_application(...)` | Kadro başvurusu (anon + authenticated) |
| `submit_corporate_application(...)` | Kurumsal başvuru (anon + authenticated) |
| `submit_contact_inquiry(...)` | İletişim formu kaydı (anon + authenticated) |

### `members` tablosu sütunları vs JSONB

**Sütunlarda (ilişkisel):**
- `id`, `email`, `name`, `role`, `membership`, `membership_status`
- `assigned_coach_id`, `assigned_dietitian_id`

**JSONB `data` içinde (uygulama tarafı):**
Profil alanları (boy, kilo, hedefler, şehir, telefon…), `healthTest` (sağlık testi cevapları), **`healthAnalysis`** (kural tabanlı kişisel özet — egzersiz + beslenme), `packageConfig`, `supportSchedule`, `coachSessions`, `dietitianSessions`, `notifications`, `tasks`, `progress` (weight, workouts, **meals**, mood), **`completedActivities`** (öğün + aktivite tamamlama), `calorieHistory`, `settings`, `premiumStartedAt`, `premiumExpiresAt`, fotoğraf URL'leri vb.

**`posts.data` JSONB:** `title`, `category`, `excerpt`, `author`, `readMinutes`, `accent`, `content`, **`coverImage`**, **`coverImageAlt`**, `createdAt`, `updatedAt`.

**Mapping:** `supabaseDb.js` satır 19–57
- `memberToRow()` — sütun + JSONB ayırır
- `rowToMember()` — birleştirir; `assignedCoachId` hem sütundan hem JSONB'den okunur

### Seans objesi yapısı (`coachSessions` / `dietitianSessions`)

Üretim: **Admin panelinden elle** — `src/components/admin/ManualSessionEditor.jsx` (otomatik `supportSessions.js` kaldırıldı)

```javascript
{
  id: 'cs-1234567890-abc123',   // uid('cs') veya uid('ds')
  type: 'coach' | 'dietitian',
  title: 'Koç Görüşmesi',
  date: '2026-06-18T10:00:00.000Z',  // ISO string
  duration: 30,                       // dakika (koç: 30, diyetisyen: 40)
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed',
  coach: 'Koç Adı'                    // diyetisyen seanslarında da bu alan adı kullanılır
}
```

---

## 5. Sistemler (Detaylı)

### 5.1 Kimlik Doğrulama ve Oturum

| Ne | Nerede | Detay |
|----|--------|-------|
| Supabase client | `src/services/supabaseClient.js` | `createClient`, `isSupabaseEnabled`, `syncAutoRefresh` |
| Oturum persist | `src/services/authStorage.js` | `rememberMe` → localStorage vs sessionStorage |
| Login/logout | `supabaseDb.js` L262–302 | Telegram bildirimi gönderir |
| Route guard | `src/components/auth/RequireAuth.jsx` | Rol bazlı redirect |
| Login UI | `src/pages/auth/LoginPage.jsx` | Rol bazlı yönlendirme |
| Şifre sıfırlama | `ForgotPasswordPage.jsx` → `POST /api/auth` → `AuthCallbackPage` → `ResetPasswordPage.jsx` | Sunucu recover + token_hash (PKCE); §46 |
| Auth callback | `src/pages/auth/AuthCallbackPage.jsx` | E-posta/telefon doğrulama linkleri, recovery yönlendirme |
| İsteğe bağlı doğrulama | `src/services/authVerification.js` + `VerificationSection.jsx` | Profilden e-posta/telefon; kayıtta zorunlu değil |
| Kayıt oturum açma | `api/auth-unlock-signup.js` + `ensureAuthForSignup()` | Confirm email açıkken bile kayıt sonrası giriş |
| Şifre kuralları | `src/services/password.js` | `PASSWORD_RULES`, `isPasswordValid` |

### 5.2 Merkezi State (AppContext)

**Dosya:** `src/context/AppContext.jsx`

**State (useApp() ile erişilir):**
- Kullanıcı: `user`, `membership`, `membershipStatus`, `isAuthenticated`, `isAdmin`, `isStaff`, `loggingOut` (çıkış sırasında spinner — §57)
- Seanslar: `coachSessions`, `dietitianSessions`
- İçerik: `testimonials`, `faqs`, `successStories`, `posts`, `exercises`, `plans`
- Admin: `platform`, `adminStats`, `membershipBreakdown`, `monthlyGrowth`, `sessionStats`
- Başvurular (admin hydrate): `staffApplications`, `corporateApplications`, `contactInquiries`
- Mesajlaşma: `chatThreads`, `chatMessages`, `adminStaffThreads`, `adminStaffMessages`
- **Bildirim rozetleri (2026-06-28):** `chatUnreadCount`, `adminStaffUnreadCount`, `staffAdminUnreadCount`, `pendingApplicationsCount`, `openSupportTicketsCount`, `notificationUnreadCount` — nav badge kaynakları (§42)

**Aksiyonlar (tam liste):**
`login`, `logout`, `register`, `registerWithPayment`, `registerWithPlan`, `savePlan`, `changePlan` (mevcut üyenin planını değiştirir — yeni kayıt OLUŞTURMAZ), `processPremiumPayment`, `upgradeToPremium`, `savePackage`, `saveSupportSchedule`, `pauseMembership`, `resumeMembership`, `cancelMembership`, `renewMembership`, `adminPatchMember`, `adminUpdatePremium`, `addStaff`, `editStaff`, `removeStaff`, `createProgram`, `addPost`, `editPost`, `removePost`, `createTicket`, `setTicketStatus`, `sendTicketReply`, `uploadExerciseVideo`, `addExercise`, `editExercise`, `removeExercise`, `createMembershipRequest`, `resolveMembershipRequest`, `resolveStaffApplication`, `resolveCorporateApplication`, `updateContactInquiryStatus`, `addContent`, `editContent`, `removeContent`, `submitSuccessStory`, `markNotificationRead`, `markAllNotificationsRead`, `rescheduleSession`, `cancelSession`, `toggleTask`, `toggleMealCompletion`, `updateProfile`, `updateSettings`, `refresh`

### 5.3 Kayıt ve Onboarding

| Adım | Dosya | Ne yapar |
|------|-------|----------|
| 7 adımlı kayıt | `src/pages/OnboardingPage.jsx` | Profil → hedefler → paket → randevu → ödeme |
| Kural tabanlı sağlık analizi | `src/services/aiAnalysis.js` | BMI, kalori, beslenme ve antrenman önerileri — kural tabanlı hesaplama |
| Sağlık hesapları | `src/services/health.js` | `calculateBMI`, `bmiCategory`, etiket sabitleri |
| Test ödeme (fallback) | `src/config/testPayment.js` + `src/components/payment/PaymentForm.jsx` | Sahte kart (4242…) doğrulama — Stripe kapalıyken kullanılır |
| **Stripe ödeme (gerçek)** | `api/stripe-checkout.js`, `api/stripe-webhook.js`, `src/services/stripePayment.js` | `VITE_STRIPE_ENABLED=true` → Stripe Checkout. Bkz. §22 + `docs/setup/STRIPE_SETUP.md` |
| Kayıt akışları | `supabaseDb.js` L460–535 | `register`, `registerWithPayment`, `registerWithPlan`, `processPremiumPayment` |
| Türkiye illeri | `src/data/turkeyCities.js` | 81 il/ilçe listesi |

### 5.4 Üyelik Planları

| Ne | Nerede |
|----|--------|
| Fallback plan tanımları | `src/data/membershipPlans.js` — `FREE`, `EKO`, `DIYET`, `SPOR`, `KURUCU`, `VIP`, `ALL_PLANS` |
| Fiyat kademeleri (1/3/6 ay) | `membershipPlans.js` → `PLAN_PRICING`, `getTierPrice()`, `DURATION_OPTIONS` |
| DB planları | `plans` tablosu (`pricing_tiers` jsonb) → `supabaseDb.getPlans()` / `upsertPlan()` |
| Plan karşılaştırma sayfası | `src/pages/MembershipComparisonPage.jsx` |
| Admin plan düzenleme | `src/pages/admin/AdminPlansPage.jsx` |
| Premium üyelik mantığı | `src/services/premiumMembership.js` — **ay bazlı** süre hesabı, süre dolunca `free` plana düşürme |
| Paket süre etiketi (UI) | `membershipPlans.js` → `DURATION_OPTIONS[].days`, `getPlanDurationLabel()` — landing/onboarding kartları (§57) |
| Paket → personel ihtiyacı | `membershipPlans.js` → `packageIncludesCoach`, `packageIncludesDietitian`, `memberNeedsStaffAssignment`, `sanitizeStaffForPackage` (§36.1) |
| Üyelik dondurma/iptal talepleri | **Kaldırıldı** — `membership_requests` tablosu drop (`20260625_audit_rls_plans_cleanup.sql`); eski `AdminRequestsPage.jsx` silindi |
| Stripe ödeme + süre | `api/stripe-checkout.js` (`durationMonths`), `api/stripe-webhook.js` |

**Plan ID'leri ve yapıları (2026-06-24 güncellemesi):**

| ID | Ad | Aylık fiyat | 3 Aylık | 6 Aylık | Görüşmeler |
|----|-----|-------------|---------|---------|------------|
| `free` | Basic | Ücretsiz | — | — | Yok |
| `eko` | Eko Paket | 1.299₺ | 2.999₺ | 3.999₺ | Yok (program güncellemeleri) |
| `diyet` | Diyet Paketi | 2.499₺ | 6.499₺ | 9.999₺ | Ayda 2 diyetisyen |
| `spor` | Spor Paketi | 2.499₺ | 6.499₺ | 9.999₺ | Ayda 2 koç |
| `kurucu` | 100 Kurucu Üye | 3.499₺ | 6.999₺ | 10.999₺ | Ayda 2 koç + 2 diyetisyen |
| `vip` | Vip Paket | 4.999₺ | 12.999₺ | 19.999₺ | Ayda 2 koç + 2 diyetisyen |

**Süre mantığı:**
- Kayıt/ödeme sırasında müşteri 1, 3 veya 6 ay seçer (`durationMonths`).
- `packageConfig.durationMonths` + `premiumExpiresAt` = başlangıç + N takvim ayı.
- Süre dolunca `syncMembershipExpiryStatus()` üyeyi otomatik `free` plana düşürür (girişte kontrol edilir).
- Eski planlar (`gumus`, `altin`, `platinum`, `premium`) geriye dönük uyumluluk için `PAID_MEMBERSHIPS` içinde kalır; DB'de pasif.

**Migrasyon:** `supabase/migrations/20260624_new_package_plans.sql`

### 5.5 Paket Oluşturma, Atama ve Randevu Yönetimi

| Ne | Nerede |
|----|--------|
| Paket fiyat hesabı | `src/services/packagePricing.js` — `calculatePackagePrice`, `getRecommendedPackage` |
| Koç/diyetisyen atama mantığı | `src/services/staffAssignment.js` — `assignStaffOnly`, `applyStaffAssignments` — **paket dışı rol atamasını null yapar** |
| Paket → personel yardımcıları | `src/data/membershipPlans.js` — `packageIncludesCoach`, `packageIncludesDietitian`, `sanitizeStaffForPackage` |
| Admin manuel randevu UI | `src/components/admin/ManualSessionEditor.jsx` — pakete göre koç/diyetisyen bölümleri |
| Admin premium atama UI | `src/pages/admin/AdminPremiumPage.jsx` — tüm üyeler, paket/süre değiştirme, koç/diyetisyen/doktor dropdown'ları (§58) |
| Randevu planlama UI (kayıt) | `src/components/package/SupportScheduler.jsx`, `WeeklyAvailability.jsx` |
| Otomatik randevu üretimi | **Kaldırıldı** — admin panelinden elle girilir (`supportSessions.js` silindi) |
| Kaldırıldı | `PackageBuilder.jsx`, `PackageBuilderPage.jsx`, `PackageSummaryCard.jsx`, `NumberSelector.jsx` silindi (`/builder` → `/membership` redirect korunuyor) |

**Paket → personel eşlemesi (2026-06-25):**

| Plan | Koç | Diyetisyen | Admin'de görünen |
|------|-----|------------|------------------|
| `eko` | Yok | Yok | Atama bölümü gizli |
| `diyet` | Yok | Ayda 2 | Yalnızca diyetisyen |
| `spor` | Ayda 2 | Yok | Yalnızca koç |
| `kurucu`, `vip` | Ayda 2 | Ayda 2 | Her ikisi |

Plan değişiminde (`changeMemberPlan`, Stripe webhook, `processPremiumPayment`) `sanitizeStaffForPackage()` paket dışı `assignedCoachId`, `assignedDietitianId`, `coachSessions`, `dietitianSessions` temizler.

### 5.6 Video Görüşme (Daily.co) — YENİ SİSTEM

Bu sistem projeye sonradan eklenmiş tam entegre video görüşme modülüdür.

| Dosya | Satır/Sorumluluk |
|-------|------------------|
| `src/config/videoCall.js` | Daily domain, oda adı, join penceresi, `buildRoomUrl`, `memberCallPath`, `staffCallPath` |
| `src/services/videoCallSession.js` | Zaman penceresi, erişim kontrolü, `resolveCallContext` |
| `src/hooks/useDailyCall.js` | Daily.co call object; kamera/mik/ekran paylaşımı |
| `src/pages/VideoCallPage.jsx` | Görüşme odası sayfası (üye + staff) |
| `src/components/video/VideoCallUI.jsx` | `ParticipantTile`, `CallControls`, `DeviceSelectors` |
| `src/components/video/VideoJoinLink.jsx` | Randevu kartında "Katıl" linki |
| `src/components/calendar/SessionCard.jsx` | Seans kartı + VideoJoinLink entegrasyonu |
| `src/utils/formatDuration.js` | Türkçe süre formatı |

**Rotalar:**
- Üye: `/call/:sessionType/:sessionId` → `VideoCallPage audience="member"`
- Staff: `/staff/call/:sessionType/:sessionId` → `VideoCallPage audience="staff"`

**Oda adı formatı:** `{roomPrefix}-{coach|dietitian}-{sessionId}` (örn. `donusum-coach-cs-1234567890-abc123`)

**Oda URL:** `https://{VITE_DAILY_DOMAIN}/{oda-adı}`

**Katılım penceresi:** Randevudan `VITE_VIDEO_JOIN_MINUTES_BEFORE` (varsayılan 15) dk önce → seans süresi + `VITE_VIDEO_JOIN_MINUTES_AFTER` (varsayılan 30) dk sonra

**Env değişkenleri:** `.env.example` L24–30

### 5.7 Telegram Bildirimleri

| Ne | Nerede |
|----|--------|
| İstemci çağrısı | `src/services/telegramNotify.js` → `notifyTelegram(event, payload)` |
| Sunucu handler | `api/telegram-notify.js` — POST; olay: member_signup, member_login, staff_login, admin_login vb. |
| İletişim formu | `src/services/contactForm.js` → `api/contact.js` → `TELEGRAM_CONTACT_CHAT_ID` |
| Kadro başvurusu | `src/services/applicationNotify.js` → `api/application-notify.js` → `TELEGRAM_STAFF_APPLICATION_CHAT_ID` (yalnızca iletişim bilgileri) |
| Kurumsal başvuru | `src/services/applicationNotify.js` → `api/application-notify.js` → `TELEGRAM_CORPORATE_APPLICATION_CHAT_ID` (yalnızca iletişim bilgileri) |
| Landing form UI | `src/components/landing/ContactSection.jsx` |
| Kurulum rehberi | `docs/setup/TELEGRAM_SETUP.md` |

**Kaldırıldı (2026-06-27):** Kalori chat Telegram bildirimi (`api/calorie-chat-notify.js` — deprecated, çağrılmıyor).

**Güvenlik:** `TELEGRAM_BOT_TOKEN` yalnızca Vercel sunucusunda; tarayıcıya gitmez.

### 5.8 Üye Paneli

| Sayfa | Rota | Dosya | Ana işlev |
|-------|------|-------|-----------|
| Dashboard | `/dashboard` | `DashboardPage.jsx` | Sağlık analizi, kilo/antrenman/**öğün** grafikleri, görevler, yaklaşan seanslar |
| Takvim | `/calendar` | `CalendarPage.jsx` | Yan yana **Diyet Listesi \| Koç Programı**; thumbnail → `ExerciseDetailModal`; **İzle** inline video |
| Randevular | `/schedule?tab=` | `AppointmentsPage.jsx` | Koç / diyetisyen / doktor sekmeleri; eski `/schedule/coach` vb. → redirect |
| Sağlık testleri | `/health-test` | `HealthTestPage.jsx` + `HealthTestHub.jsx` | Kategori hub; `/health-test/:sectionId`, `/health-test/finish` |
| Programlar | `/programs` | `ProgramsPage.jsx` | Antrenman/beslenme; hareket satırında `ExerciseVideoThumbnail` + video modal |
| Egzersiz kütüphanesi | `/library` | `ExerciseLibraryPage.jsx` | Filtre: arama, tip, zorluk, ekipman, konum, makine (sıralama UI yok); video gate |
| Kalori hesaplayıcı | `/calorie` | `CalorieCalculatorPage.jsx` | **Paket bazlı erişim:** Gümüş+ yazarak, Platinum fotoğraflı tahmini kalori (müşteriye YZ/AI ifadesi gösterilmez) |
| Bildirimler | `/notifications` | `NotificationsPage.jsx` | Okundu işaretleme |
| Destek | `/support` | `SupportPage.jsx` | Ticket oluşturma/thread |
| Profil | `/profile` | `ProfilePage.jsx` | Profil, üyelik, atanan koç/diyetisyen |
| Ödeme (mock) | `/profile/payments` | `PaymentManagementPage.jsx` | Kayıtlı kartlar, ödeme geçmişi (demo) |
| Video görüşme | `/call/:type/:id` | `VideoCallPage.jsx` | Daily.co |

**Layout:** `AppShell` → `Sidebar` + `TopBar` + `MobileNav`

**Nav rozetleri (2026-06-28):** Mesajlar (`chatUnreadCount`), Bildirimler (`notificationUnreadCount`), Destek (`openSupportTicketsCount`) — `Sidebar.jsx` + mobil `AppShell` / `PanelMobileMenu` (§42)

### 5.9 Personel Paneli

| Sayfa | Rota | Dosya |
|-------|------|-------|
| Genel bakış | `/staff` | `staff/StaffOverviewPage.jsx` — danışan sayısı, haftalık randevular |
| Danışanlar | `/staff/clients` | `staff/StaffClientsPage.jsx` — program/liste oluşturma, randevu yönetimi |
| Danışan sağlık profili | `/staff/clients/:memberId/health` | `shared/MemberHealthProfilePage.jsx` (`audience="staff"`) — test cevapları + klinik notlar; **otomatik `healthAnalysis` gösterilmez** |
| Mesajlar | `/staff/messages`, `/staff/messages/:memberId` | `staff/StaffMessagesPage.jsx` — danışan sohbetleri |
| Ekip mesajları | `/staff/collab-messages`, `…/:memberId` | `staff/StaffCollabMessagesPage.jsx` — koç↔diyetisyen; başlık: personel adı + `Danışan adına: …` |
| Admin mesajları | `/staff/admin-messages` | `staff/StaffAdminMessagesPage.jsx` — admin ↔ personel |
| Programlar (koç) | `/staff/programs` | `staff/StaffProgramsPage.jsx` — diyetisyen `/staff/lists`'e yönlendirilir |
| Listeler (diyetisyen) | `/staff/lists` | `staff/StaffListsPage.jsx` — beslenme listeleri özeti |
| Kütüphane | `/staff/library` | `StaffLibraryGate.jsx` — diyetisyen → `/staff/lists`; koç → `ExerciseLibraryPage` |
| Ödeme (mock) | `/staff/payments` | `payments/PaymentManagementPage.jsx` |
| Video görüşme | `/staff/call/:type/:id` | `VideoCallPage.jsx` |

**Layout:** `StaffShell` — `src/components/layout/StaffShell.jsx`

**Nav rozeti:** Mesajlar menüsünde danışan + admin okunmamış toplamı (`chatUnreadCount + staffAdminUnreadCount`) — §42

**Rol yardımcıları:** `src/utils/staffRoles.js` — `coach`, `dietitian`, `doctor`

### 5.10 Admin Paneli

**Navigasyon kaynağı:** `src/components/layout/AdminShell.jsx` → `adminNav` dizisi (sidebar + mobil menü)

| Sayfa | Rota | Dosya | Tablolar / Veri |
|-------|------|-------|-----------------|
| Genel bakış | `/admin` | `AdminOverviewPage.jsx` | activities, tickets, members, platformStats |
| Üyeler | `/admin/members` | `AdminMembersPage.jsx` | members — detay modal, `MemberHealthInsights`, pakete göre koç/diyetisyen satırları |
| Üye sağlık profili | `/admin/members/:memberId/health` | `shared/MemberHealthProfilePage.jsx` (`audience="admin"`) — test cevapları + klinik notlar + **`healthAnalysis` özeti** |
| Paketler | `/admin/plans` | `AdminPlansPage.jsx` | plans |
| Premium Yönetimi | `/admin/premium` | `AdminPremiumPage.jsx` | **Tüm üyeler** (Basic dahil) — paket/süre değiştirme, koç/diyetisyen/doktor atama, `ManualSessionEditor` (§58) |
| Başvurular | `/admin/applications` | `AdminApplicationsPage.jsx` | staff_applications, corporate_applications, contact_inquiries |
| Kütüphane | `/admin/library` | `AdminLibraryPage.jsx` | exercises, storage |
| Kadromuz | `/admin/staff` | `AdminStaffPage.jsx` | staff, RPC |
| Blog | `/admin/blog` | `AdminBlogPage.jsx` | posts |
| İçerik | `/admin/content` | `AdminContentPage.jsx` | site_content (başarı hikâyeleri) |
| Abonelikler | `/admin/subscriptions` | `AdminSubscriptionsPage.jsx` | payments |
| Ödeme (mock UI) | `/admin/payments` | `PaymentManagementPage.jsx` | mockPayments.js |
| Seanslar | `/admin/sessions` | `AdminSessionsPage.jsx` | members.data → coachSessions + dietitianSessions |
| Mesajlar | `/admin/messages` (+ `/staff/:staffId`, `/audit/:threadId`) | `AdminMessagesPage.jsx` | admin_staff_*, chat_* (denetim salt okunur + PDF) |
| Destek | `/admin/support` | `AdminSupportPage.jsx` | tickets |
| Analitik | `/admin/analytics` | `AdminAnalyticsPage.jsx` | members, payments |
| Aktivite | `/admin/activity` | `AdminActivityPage.jsx` | activities |

**Kaldırılan admin sayfası:** `AdminRequestsPage.jsx` (`/admin/requests`) — üyelik dondurma/iptal talepleri kaldırıldı.

**Manuel seans ekleme:** `src/components/admin/ManualSessionEditor.jsx` — `coachMeetingsPerMonth` ve `coachMeetingsPerWeek` destekler.

**Layout:** `AdminShell` — `src/components/layout/AdminShell.jsx`

**Nav rozetleri (2026-06-28):** Başvurular (`pendingApplicationsCount`), Mesajlar (`adminStaffUnreadCount`), Destek Talepleri (`openSupportTicketsCount`) — §42

### 5.11 Genel (Public) Sayfalar

| Sayfa | Rota | Dosya |
|-------|------|-------|
| Ana sayfa | `/` | `LandingPage.jsx` — hero, fiyat, SSS, kadro, yorumlar, **Son Yazılarımız**, iletişim |
| Üyelik karşılaştırma | `/membership` | `MembershipComparisonPage.jsx` |
| Kayıt | `/onboarding` | `OnboardingPage.jsx` |
| Başarı hikâyeleri | `/stories` | `SuccessStoriesPage.jsx` |
| Blog listesi | `/blog` | `BlogPage.jsx` | Supabase `posts` + kapak görselleri |
| Blog yazısı | `/blog/:id` | `BlogPostPage.jsx` | Hero kapak + içerik |
| Ana sayfa blog | `/` | `LatestBlogPosts.jsx` | Son 3 yayınlanmış yazı |
| Kadro profili | `/team/:id` | `StaffProfilePage.jsx` |
| Kadro listeleri | `/team/coaches`, `/team/dietitians`, `/team/doctors` | `TeamListPage.jsx` (role prop) |
| Kadro başvurusu | `/team/apply` | `StaffApplicationPage.jsx` |
| Kurumsal tanıtım | `/corporate` | `CorporatePage.jsx` |
| Kurumsal başvuru | `/corporate/apply` | `CorporateApplicationPage.jsx` |
| KVKK | `/kvkk` | `legal/LegalDocumentPage.jsx` (slug=`kvkk`) |
| Gizlilik | `/privacy` | `legal/LegalDocumentPage.jsx` (slug=`privacy`) |
| Kullanım şartları | `/terms` | `legal/LegalDocumentPage.jsx` (slug=`terms`) |
| 404 | `*` | `NotFoundPage.jsx` |

**Yasal içerik kaynağı:** `src/data/legalDocuments.js` → `LEGAL_DOCUMENTS`  
**Çerez onayı:** `src/components/ui/ConsentBanner.jsx` (PublicLayout'ta)

**Layout:** `PublicLayout.jsx` — header/footer, `scrollToContactSection` (`src/utils/scrollToContact.js`)

### 5.12 İstatistik ve Platform Verisi

**Dosya:** `src/services/platformStats.js`

| Fonksiyon | Ne hesaplar |
|-----------|-------------|
| `getCurrentMember(db)` | Oturum açmış üye |
| `getCurrentStaff(db)` | Oturum açmış personel |
| `computeAdminStats(db)` | KPI: üye sayısı, gelir, açık ticket, **paket bazlı** `unassignedPremium` |
| `computeMembershipBreakdown(db)` | Plan dağılımı |
| `computeMonthlyGrowth(db)` | Aylık büyüme grafiği verisi |
| `getSessionStats(db)` | Seans istatistikleri |

### 5.13 Toast Bildirimleri

**Dosya:** `src/context/ToastContext.jsx`  
**Kullanım:** `const { toast } = useToast()` → `toast('Mesaj', 'success'|'error'|'warning'|'info')`

---

## 6. Rota Haritası (Tam)

Kaynak: `src/App.jsx` satır 56–117

### Public (PublicLayout)
```
/                    → LandingPage
/login               → LoginPage
/register            → redirect /onboarding
/forgot-password     → ForgotPasswordPage
/auth/callback       → AuthCallbackPage (doğrulama + şifre sıfırlama yönlendirme)
/reset-password      → ResetPasswordPage
/onboarding          → OnboardingPage
/membership          → MembershipComparisonPage
/builder             → redirect /membership
/stories             → SuccessStoriesPage
/blog                → BlogPage
/blog/:id            → BlogPostPage
/team/coaches        → TeamListPage (koçlar)
/team/dietitians     → TeamListPage (diyetisyenler)
/team/doctors        → TeamListPage (doktorlar)
/team/apply          → StaffApplicationPage (kadro başvurusu)
/corporate           → CorporatePage (kurumsal tanıtım)
/corporate/apply     → CorporateApplicationPage (kurumsal başvuru)
/team/:id            → StaffProfilePage
/kvkk                → LegalDocumentPage (slug=kvkk)
/privacy             → LegalDocumentPage (slug=privacy)
/terms               → LegalDocumentPage (slug=terms)
*                    → NotFoundPage
```

**Navbar (PublicLayout) — sadeleştirilmiş (2026-06-24):**

| Üst seviye | Tip | Not |
|------------|-----|-----|
| Ana Sayfa | doğrudan | `/` |
| Üyelikler | doğrudan | `/membership` |
| Kurumsal | doğrudan | `/corporate` — başvuru sayfada CTA |
| **Keşfet** | dropdown | Başarı Hikayeleri (`/stories`), Blog (`/blog`) |
| Kadromuz | dropdown | Koçlar, Diyetisyenler, Doktorlar + **Kadromuza Katıl** footer |
| Destek | doğrudan | yalnız giriş yapmış üyeler |

**Navbar'dan kaldırıldı (footer / landing'de):** Bize Ulaşın, Kurumsal dropdown

**Korunan:** `PromoBanner` (tüm public sayfalarda, kapatılınca `localStorage` ile gizlenir)

**Eski rotalar korunuyor:** `/corporate/apply`, `/stories`, `/#bize-ulasin`

### Üye (RequireAuth member)
```
/call/:sessionType/:sessionId  → VideoCallPage (member)
/dashboard           → DashboardPage
/calendar            → CalendarPage
/calorie             → CalorieCalculatorPage
/health-test         → HealthTestPage (hub)
/health-test/:sectionId → HealthTestSectionPage
/health-test/finish  → HealthTestFinishPage
/schedule            → AppointmentsPage (?tab=coach|dietitian|doctor)
/schedule/coach      → redirect → /schedule?tab=coach
/schedule/dietitian  → redirect → /schedule?tab=dietitian
/schedule/doctor     → redirect → /schedule?tab=doctor
/notifications       → NotificationsPage
/support             → SupportPage
/programs            → ProgramsPage
/library             → ExerciseLibraryPage
/profile             → ProfilePage
/profile/payments    → PaymentManagementPage (member, mock)
```

> **Not:** `CoachSchedulePage.jsx` / `DietitianSchedulePage.jsx` repoda duruyor; üye menüsü artık birleşik `AppointmentsPage` kullanır.

### Personel (RequireAuth staff)
```
/staff/call/:sessionType/:sessionId  → VideoCallPage (staff)
/staff               → StaffOverviewPage
/staff/clients       → StaffClientsPage
/staff/messages      → StaffMessagesPage
/staff/messages/:memberId → StaffMessagesPage
/staff/collab-messages → StaffCollabMessagesPage
/staff/collab-messages/:memberId → StaffCollabMessagesPage
/staff/admin-messages → StaffAdminMessagesPage
/staff/programs      → StaffProgramsPage (koç; diyetisyen → /staff/lists)
/staff/lists         → StaffListsPage (diyetisyen beslenme listeleri)
/staff/library       → StaffLibraryGate (diyetisyen → /staff/lists)
/staff/payments      → PaymentManagementPage (staff, mock)
```

### Admin (RequireAuth admin)
```
/admin               → AdminOverviewPage
/admin/members       → AdminMembersPage
/admin/plans         → AdminPlansPage
/admin/premium       → AdminPremiumPage (tüm üyeler — paket/süre/atama yönetimi)
/admin/applications  → AdminApplicationsPage (kadro + kurumsal + iletişim)
/admin/library       → AdminLibraryPage
/admin/staff         → AdminStaffPage
/admin/blog          → AdminBlogPage
/admin/content       → AdminContentPage (başarı hikâyeleri filtreleri)
/admin/subscriptions → AdminSubscriptionsPage
/admin/payments      → PaymentManagementPage (admin, mock)
/admin/sessions      → AdminSessionsPage
/admin/messages      → AdminMessagesPage (personel sohbet + danışan denetimi)
/admin/messages/staff/:staffId → AdminMessagesPage
/admin/messages/audit/:threadId → AdminMessagesPage (salt okunur + PDF)
/admin/support       → AdminSupportPage
/admin/analytics     → AdminAnalyticsPage
/admin/activity      → AdminActivityPage
```

---

## 7. Tam Dosya Envanteri

### 7.0 Kurulum rehberleri (`docs/setup/`)

> **Ana indeks:** [`docs/setup/README.md`](docs/setup/README.md) — öncelik sırası, Supabase proje linkleri, yapılacaklar özeti.

| Dosya | Konu | Durum |
|-------|------|-------|
| `docs/setup/README.md` | Tüm kurulum rehberlerinin indeksi | — |
| `docs/setup/SUPABASE_SETUP.md` | Supabase proje, SQL, admin, migration | ✅ |
| `docs/setup/OAUTH_SETUP.md` | Google, Facebook, Apple (özet) | ⬜ Dashboard |
| `docs/setup/APPLE_SETUP.md` | Sign in with Apple (detaylı adımlar) | ⬜ **Ertelendi** |
| `docs/setup/STRIPE_SETUP.md` | Stripe Checkout, webhook, Vercel env | ⬜ Canlı anahtarlar |
| `docs/setup/TELEGRAM_SETUP.md` | Bot, chat ID, bildirim kanalları | Kısmen |
| `docs/setup/AI_SETUP.md` | Gemini API, kalori AI | ✅ |
| `docs/setup/VIDEO_SETUP.md` | Daily.co video görüşme | ✅ |
| `docs/setup/HIGGSFIELD_SETUP.md` | Higgsfield AI görsel/video (Cursor MCP — deneme) | 🧪 Opsiyonel |
| `docs/setup/SEO_SETUP.md` | Search Console, sitemap, OG | ✅ |

**İlgili (setup dışı):**

| Dosya | Amaç |
|-------|------|
| `supabase/setup.sql` | Tek dosya şema + RLS + RPC + planlar |
| `supabase/migrations/*.sql` | Artımlı migration'lar → `npm run db:migrate` |
| `supabase/email-templates/README.md` | Auth e-posta şablonları |
| `YAPILACAKLAR.md` | Satışa hazırlık checklist (kök) |

### 7.1 Kök dizin

| Dosya | Amaç |
|-------|------|
| `package.json` | Bağımlılıklar ve npm scriptleri |
| `vite.config.js` | React + Tailwind eklentileri |
| `vercel.json` | `/api/*` API route; SPA rewrite |
| `eslint.config.js` | ESLint yapılandırması |
| `index.html` | Giriş HTML, Google Fonts |
| `.env.example` | Ortam değişkeni şablonu |
| `.gitignore` | Git ignore kuralları |
| `README.md` | Kurulum özeti |
| `YAPILACAKLAR.md` | Yapılacaklar checklist |
| `AI_PROJE_REHBERI.md` | Bu dosya — AI/geliştirici proje rehberi |
| `docs/setup/` | **Tüm kurulum rehberleri** (bkz. §7.0) |

### 7.2 API (`api/`)

| Dosya | HTTP | Amaç | Auth |
|-------|------|------|------|
| `_guards.js` | — | `requireAuth`, `requireAdmin`, `requireNotifySecret`, **`requireCronSecret`**, CORS | Yardımcı |
| `_apiAuth.js` | — | Bearer token → Supabase user | Yardımcı |
| `telegram-notify.js` | POST | Giriş/kayıt Telegram bildirimleri | `requireNotifySecret` |
| `contact.js` | POST | Bize Ulaşın → Telegram | `requireNotifySecret` |
| `calorie-chat-notify.js` | POST | Kalori chat → Telegram | `requireAuth` + secret |
| `ai-food-text.js` | POST | Gemini metin kalori analizi | `requireAuth` |
| `ai-food-vision.js` | POST | Gemini fotoğraf kalori analizi | `requireAuth` |
| `ai-blog-generate.js` | GET/POST | Günlük AI blog üretimi → `posts` | **`requireCronSecret`** |
| `_gemini.js` | — | Gemini API + model fallback zinciri | Yardımcı |
| `_ai-prompts.js` | — | Kalori + blog promptları | Yardımcı |
| `_blog-images.js` | — | Kategori bazlı blog kapak URL'leri | Yardımcı |
| `daily-room.js` | POST | Daily.co oda oluşturma | `requireAuth` |
| `stripe-checkout.js` | POST | Stripe ödeme oturumu | — |
| `stripe-webhook.js` | POST | Ödeme sonrası üyelik aktivasyonu + `sanitizeStaffForPackage` | Stripe imza |
| `auth.js` | POST | Auth yardımcıları | — |
| `sitemap.js` | GET | Dinamik XML sitemap | — |

**İstemci tarafı auth header:** `src/services/apiAuth.js` → `getApiAuthHeaders()` — AI ve Daily API çağrılarında `Authorization: Bearer` ekler.

### 7.3 Supabase SQL (`supabase/`)

| Dosya | Amaç |
|-------|------|
| `setup.sql` | **Tek dosya** tertemiz kurulum (şema + RLS + RPC + storage + paketler + admin) |
| `migrations/20260623_staff_applications.sql` | Kadro başvuruları tablosu + RPC |
| `migrations/20260624_corporate_contact_cleanup.sql` | Kurumsal + iletişim tabloları; `custom_foods` drop |
| `migrations/20260625_security_guards.sql` | `is_admin` genişletme, activities RLS, `increment_food_usage` drop |
| `migrations/20260625_fix_is_admin_rls_recursion.sql` | `is_admin()` RLS özyineleme düzeltmesi |
| `migrations/20260625_audit_rls_plans_cleanup.sql` | `programs` RLS scope, `membership_requests` drop, staff_applications insert kapatıldı |
| `migrations/20260625_remove_demo_faqs_membership_freeze.sql` | Demo FAQ silindi, pause/cancel statüleri sıfırlandı |
| `migrations/20260625_clean_demo_content_expand_blogs.sql` | Demo testimonial/success story silindi, blog içerikleri genişletildi |
| `migrations/20260625_storage_listing_guard.sql` | Storage listeleme güvenliği |
| `migrations/20260627_member_staff_chat.sql` | Üye ↔ personel chat tabloları + RLS |
| `migrations/20260627_admin_staff_chat.sql` | Admin ↔ personel chat tabloları + RLS |
| `migrations/20260627_team_public_seed.sql` | Kadro vitrin profilleri seed (`public/team` görselleri) |
| `migrations/20260628_chat_presence_peers.sql` | Chat partnerlerinin `user_presence` okuma RLS'i |

### 7.4 Context (`src/context/`)

| Dosya | Export |
|-------|--------|
| `AppContext.jsx` | `AppProvider`, `useApp` |
| `ToastContext.jsx` | `ToastProvider`, `useToast` |

### 7.5 Config (`src/config/`)

| Dosya | Export |
|-------|--------|
| `brand.js` | `BRAND`, `ADMIN_CREDENTIALS`, `BRAND.assets` (logo, mark, ogImage) |
| `seo.js` | `SEO`, `PAGE_SEO`, `getSiteUrl`, JSON-LD builder'ları |
| `videoCall.js` | `VIDEO_CALL_CONFIG`, `buildRoomUrl`, `memberCallPath`, `staffCallPath`, `SESSION_TYPE_META` |
| `testPayment.js` | `TEST_CARD`, `validateTestPayment` |

### 7.6 Services (`src/services/`)

| Dosya | Ana export/fonksiyonlar | Kullanılıyor mu |
|-------|-------------------------|-----------------|
| `supabaseClient.js` | `supabase`, `isSupabaseEnabled`, `syncAutoRefresh` | ✅ |
| `supabaseDb.js` | `hydrate`, `login`, `logout`, tüm CRUD, başvuru RPC'leri | ✅ Ana veri katmanı |
| `contactForm.js` | `submitContactForm` → `submitContactInquiry` + Telegram | ✅ |
| `memberHealthSync.js` | Otomatik program + sağlık analizi senkronu | ✅ (`staffId: null` sistem programları) |
| `staffAssignment.js` | `assignStaffOnly`, `applyStaffAssignments`, `countStaffClients` — paket bazlı atama | ✅ |
| `packagePricing.js` | `calculatePackagePrice`, `getRecommendedPackage` | ✅ |
| `apiAuth.js` | `getApiAuthHeaders` — korunan API istekleri için Bearer token | ✅ |
| `premiumMembership.js` | `computePremiumExpiresAt`, `extendPremiumExpiry` | ✅ |
| `platformStats.js` | `computeAdminStats`, `getSessionStats` | ✅ |
| `aiAnalysis.js` | `generateHealthAnalysis` | ✅ (YZ kavramı kaldırıldı, kural tabanlı analiz) |
| `health.js` | `calculateBMI`, `bmiCategory` | ✅ |
| `availability.js` | `AVAILABILITY_HOURS`, `formatAvailabilityRanges` | ✅ |
| `password.js` | `PASSWORD_RULES`, `isPasswordValid` | ✅ |
| `authStorage.js` | `getRememberMe`, `setRememberMe`, `authStorage` | ✅ |
| `telegramNotify.js` | `notifyTelegram` | ✅ |
| `videoCallSession.js` | `resolveCallContext`, `canJoinSession` | ✅ |

### 7.7 Hooks (`src/hooks/`)

| Dosya | Export |
|-------|--------|
| `useDailyCall.js` | `useDailyCall`, `attachTrack` |
| `useRelativeTimeTick.js` | default (30 sn re-render) |
| `useLocalStorage.js` | `useLocalStorage` |
| `usePlatformDisplayStats.js` | `usePlatformDisplayStats` — landing/canlı sayaç gösterim eşikleri |
| `useHealthAnalysisSync.js` | Dashboard'da sağlık testi tamam ama özet yoksa otomatik `syncMemberHealthAssets` |
| `useChatPresence.js` | Sohbet partnerlerinin çevrimiçi durumu (`isOnline`, `lastSeenAt`, `anyAdminOnline`) |
| `useMediaQuery.js` | Responsive breakpoint hook (chat split vb.) |
| `useRealtimeSync.js` | Supabase Realtime abonelikleri (chat, başvurular, tickets) |

### 7.8 Utils (`src/utils/`)

| Dosya | Export |
|-------|--------|
| `formatDuration.js` | `formatDurationTr`, `formatMinutesTr` |
| `relativeTime.js` | `formatRelativeTime`, `RELATIVE_TIME_TICK_MS` |
| `staffRoles.js` | `STAFF_ROLES`, `normalizeStaffRole`, `staffRoleLabel` |
| `scrollToContact.js` | `CONTACT_SECTION_ID`, `scrollToContactSection` |
| `displayPlatformStats.js` | `getDisplayMemberCount`, `getDisplayOnlineCount`, `pickSessionOnlineBoost` — min. 1250 üye / 16–25 çevrimiçi eşikleri |
| `memberProgress.js` | `buildMealProgress`, streak, workout + öğün ilerleme |
| `programSchedule.js` | `mealCompletionKey`, `groupEntriesByMeal`, `isMealCompleted`, `splitEntriesByType` |
| `blogImages.js` | `resolveBlogCover`, `coverForCategory` — kategori bazlı Unsplash kapak |
| `healthProfile.js` | `inferGoalsFromHealthTest`, `enrichProfileForAnalysis` — sağlık testi → profil |
| `aiErrors.js` | `formatAiError` — AI hata mesajları |
| `presenceStatus.js` | `isUserOnline`, `formatLastSeen` — çevrimiçi eşik (90 sn) |
| `chatAccess.js` | Thread erişim, inbox sıralama, okunmamış sayımı |
| `exportChatPdf.js` | Admin denetim sohbeti PDF dışa aktarım |

### 7.9 Data (`src/data/`)

| Dosya | Export |
|-------|--------|
| `membershipPlans.js` | `ALL_PLANS`, plan tanımları, `isPaidMembership`, `getDefaultPackageForPlan`, **`packageIncludesCoach`**, **`packageIncludesDietitian`**, **`memberNeedsStaffAssignment`**, **`sanitizeStaffForPackage`** |
| `legalDocuments.js` | `LEGAL_DOCUMENTS` — KVKK, gizlilik, kullanım şartları metinleri (`/kvkk`, `/privacy`, `/terms`) |
| `turkeyCities.js` | `TURKEY_CITIES`, `CITY_NAMES`, `getDistricts` |
| `blogPosts.js` | `BLOG_CATEGORIES`, `DEFAULT_POSTS` (Supabase boşsa fallback) |
| `countryCodes.js` | `COUNTRY_CODES`, `DEFAULT_COUNTRY_ISO`, `getCountry`, `isValidNationalNumber`, `formatNationalNumber`, `toE164` |
| `healthTest.js` | `HEALTH_SECTIONS`, `EMPTY_HEALTH_TEST`, `getApplicableSections`, `isSectionComplete`, `describeHealthTest` |
| `staffApplication.js` | Kadro başvuru form şeması, validasyon, `APPLICATION_STEPS`, koç/diyetisyen alan sabitleri |
| `corporateApplication.js` | Kurumsal başvuru form şeması, validasyon |
| `mockPayments.js` | Ödeme yönetimi demo verisi (üye/staff/admin) |

### 7.10 Pages (`src/pages/`) — 45+ dosya

```
VideoCallPage.jsx
LandingPage.jsx
OnboardingPage.jsx
MembershipComparisonPage.jsx
DashboardPage.jsx
CalendarPage.jsx
AppointmentsPage.jsx            ← /schedule birleşik randevular
CoachSchedulePage.jsx           ← legacy (redirect dışı kullanılmıyor)
DietitianSchedulePage.jsx       ← legacy
NotificationsPage.jsx
SupportPage.jsx
ProfilePage.jsx
ProgramsPage.jsx              ← antrenman satırında ExerciseVideoThumbnail
HealthTestPage.jsx
HealthTestSectionPage.jsx
HealthTestFinishPage.jsx
CalorieCalculatorPage.jsx
ExerciseLibraryPage.jsx
SuccessStoriesPage.jsx
BlogPage.jsx
BlogPostPage.jsx
StaffProfilePage.jsx
TeamListPage.jsx                ← /team/coaches|dietitians|doctors (role prop ile)
StaffApplicationPage.jsx        ← /team/apply (kadro başvurusu)
CorporatePage.jsx               ← /corporate
CorporateApplicationPage.jsx    ← /corporate/apply
legal/LegalDocumentPage.jsx     ← /kvkk, /privacy, /terms
NotFoundPage.jsx
auth/LoginPage.jsx
auth/ForgotPasswordPage.jsx
staff/StaffOverviewPage.jsx
staff/StaffClientsPage.jsx
staff/StaffProgramsPage.jsx
staff/StaffListsPage.jsx        ← diyetisyen beslenme listeleri
payments/PaymentManagementPage.jsx  ← üye/staff/admin ödeme UI (mock)
admin/AdminOverviewPage.jsx
admin/AdminMembersPage.jsx
admin/AdminPlansPage.jsx
admin/AdminPremiumPage.jsx      ← tüm üyeler — paket/süre/atama yönetimi (§58)
admin/AdminApplicationsPage.jsx ← kadro + kurumsal + iletişim
admin/AdminLibraryPage.jsx
admin/AdminStaffPage.jsx
admin/AdminBlogPage.jsx
admin/AdminContentPage.jsx
admin/AdminSubscriptionsPage.jsx
admin/AdminSessionsPage.jsx
admin/AdminSupportPage.jsx
admin/AdminAnalyticsPage.jsx
admin/AdminActivityPage.jsx
```

### 7.11 Components (`src/components/`) — 50+ dosya

**Layout:** `PublicLayout`, `NavDropdown` (footer CTA desteği), `AppShell`, `AdminShell`, `StaffShell`, `Sidebar`, `TopBar`, `MobileNav`, `PanelMobileMenu`, `ScrollToTop`

**Staff:** `StaffLibraryGate`, `NutritionProgramBuilder`, `StaffMemberCard`, `StaffProfileDisplay`

**Auth:** `RequireAuth`

**Landing:** `PricingCard`, `FAQAccordion`, `TeamCarousel`, `TestimonialCarousel`, `WhyUsSection`, `ContactSection`

**Video:** `VideoCallUI`, `VideoJoinLink`, `StaffVideoPanel` (personel için görüntülü görüşme alanı)

**Onboarding / sağlık testi:** `HealthTestStep`, `HealthTestPrompt`, `HealthTestHub` (kategori kartları), `HealthTestFlow` (bölüm veya tam akış)

**Kütüphane:** `ExerciseCategorySelect`, `ExercisePagination`, `ExerciseVideoThumbnail` (program + takvim thumb `xs`), `ExerciseDetailModal` (kütüphane/takvim detay), `VideoPlayer` (imzalı URL)

**Package:** `SupportScheduler`, `WeeklyAvailability`, `AvailabilityView`

**Admin:** `ManualSessionEditor`, `StaffFormModal`, `AdminActiveUsersPanel`

**Member:** `MemberHealthInsights` — admin üye detayında sağlık analizi (`showHealthAnalysis`, varsayılan `true`); personel panelinde **`false`**. `MemberHealthProfilePanel` — tam sağlık sayfası; analiz yalnızca admin (`showHealthAnalysis={audience === 'admin'}`)

**Calendar:** `SessionCard`, `CalendarView`

**Dashboard:** `ProgressChart` (WeightChart, WorkoutChart, MealChart, MoodChart)

**Notifications:** `NotificationItem`

**Payment:** `PaymentForm`

**Support:** `SupportForm`, `TicketThread`

**Social:** `SuccessStoryCard`

**UI:** `BrandLogo`, `MembershipBadge`, `StatsCard`, `Modal`, `LoadingScreen`, `ConfigErrorScreen`, `EmptyState`, `Skeleton`, `FormField`, `PhoneField` (ülke kodlu telefon girişi), `PhotoUpload`, `Stepper`, `RangeSelector`, `ToggleGroup`, `DisclaimerBox`, `ConsentBanner`, `OnboardingTutorial`, `VideoPlayer`, `PresenceIndicator` (çevrimiçi nokta + `AvatarWithPresence`)

**SEO:** `SeoHead`, `PublicRouteSeo`, `JsonLd`, `NoIndexHead`

### 7.12 Stil

| Dosya | Amaç |
|-------|------|
| `src/index.css` | Tailwind v4 import, `@theme` renk paleti (brand/sage/cream/gold), özel utility sınıfları |

---

## 8. Ortam Değişkenleri

Kaynak: `.env.example`

| Değişken | Kapsam | Servis |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | İstemci | Supabase proje URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` veya `VITE_SUPABASE_ANON_KEY` | İstemci | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Sunucu (GİZLİ) | `api/auth-unlock-signup.js`, Stripe webhook; **VITE_ olmadan** |
| `SUPABASE_URL` | Sunucu | Service-role istemcisi (yedek: `VITE_SUPABASE_URL`) |
| `VITE_PHONE_VERIFY_ENABLED` | İstemci | `true` → profilde telefon doğrulama kartı görünür (şu an `false`) |
| `VITE_PHONE_VERIFY_VIA_EMAIL` | İstemci | Telefon açıkken SMS yoksa e-posta link yedeği (`false` = yalnızca SMS dene) |
| `TELEGRAM_BOT_TOKEN` | Sunucu | Telegram Bot |
| `TELEGRAM_CHAT_ID` | Sunucu | Giriş/kayıt bildirimleri |
| `TELEGRAM_CONTACT_CHAT_ID` | Sunucu | İletişim formu |
| `TELEGRAM_PAYMENT_CHAT_ID` | Sunucu | **Stripe ödeme (başarılı/başarısız) bildirimleri**; boşsa `TELEGRAM_CHAT_ID`'ye düşer |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Sunucu (GİZLİ) | Stripe Checkout + webhook |
| `VITE_STRIPE_ENABLED` / `VITE_STRIPE_PUBLISHABLE_KEY` | İstemci | Stripe akışı on/off + (ops.) publishable key |
| `TELEGRAM_NOTIFY_SECRET` / `VITE_TELEGRAM_NOTIFY_SECRET` | Sunucu + istemci | API spam koruması |
| `VITE_DAILY_DOMAIN` | İstemci | Daily.co subdomain |
| `VITE_DAILY_ROOM_PREFIX` | İstemci | Oda adı öneki (varsayılan: donusum) |
| `VITE_DAILY_API_KEY` | İstemci (opsiyonel) | İleride REST API |
| `VITE_VIDEO_JOIN_MINUTES_BEFORE` | İstemci | Randevu penceresi başlangıcı (dk) |
| `VITE_VIDEO_JOIN_MINUTES_AFTER` | İstemci | Randevu penceresi bitişi (dk) |
| `VITE_SITE_URL` | İstemci + sunucu | Canonical URL, sitemap, Open Graph (sonunda `/` yok) |
| `APP_URL` | Sunucu | Sitemap/Stripe yedek site kökü |

---

## 9. supabaseDb.js Fonksiyon Referansı

| Fonksiyon | Satır (yaklaşık) | Ne yapar |
|-----------|------------------|----------|
| `getSession()` | 92 | Mevcut oturum |
| `getUser()` | 97 | Auth user |
| `resolveAuthUser()` | 104 | User + metadata |
| `onAuthChange(cb)` | 117 | Auth state listener |
| `getPlans()` | 150 | Plan listesi |
| `upsertPlan(plan)` | 156 | Plan kaydet |
| `hydrate()` | 173 | Tüm veriyi yükle |
| `login(email, password, remember)` | 262 | Giriş + Telegram |
| `logout()` | 303 | Çıkış |
| `register(...)` | 460 | Ücretsiz kayıt |
| `registerWithPayment(...)` | 466 | Ödemeli kayıt |
| `registerWithPlan(...)` | 475 | Plan bazlı kayıt |
| `saveMemberPatch(member, patch)` | 485 | Üye güncelle |
| `saveSupportSchedule(member, schedule)` | 494 | Randevu planı kaydet |
| `processPremiumPayment(...)` | 504 | Premium ödeme işle |
| `addStaff(data)` | 536 | Kadro ekle (RPC) |
| `editStaff(id, patch)` | 553 | Kadro düzenle (admin RPC) |
| `updateStaffSelfProfile(id, patch)` | — | Personel kendi profili (`staff_update_self_profile` RPC; kilitli alanlar DB'de korunur) |
| `removeStaff(id)` | 571 | Kadro sil |
| `addPost/editPost/removePost` | 576–603 | Blog CRUD |
| `addContent/editContent/removeContent` | 605–619 | Site içerik CRUD |
| `submitSuccessStory(...)` | 621 | Başarı hikâyesi gönder |
| `uploadExerciseVideo(file)` | 638 | Storage yükleme |
| `addExercise/editExercise/removeExercise` | 649–667 | Egzersiz CRUD |
| `createMembershipRequest(...)` | 670 | Üyelik talebi |
| `resolveMembershipRequest(...)` | 679 | Talep onay/red |
| `submitStaffApplication(form)` | — | Kadro başvurusu RPC (`buildStaffApplicationPayload`) |
| `uploadStaffApplicationDoc(file)` | — | Sertifika belgesi → `staff-application-docs` bucket |
| `resolveStaffApplication(app, approve)` | — | Onay → `admin_upsert_staff` + geçici şifre |
| `submitCorporateApplication(form)` | — | Kurumsal başvuru RPC |
| `resolveCorporateApplication(app, status)` | — | Kurumsal durum güncelle |
| `submitContactInquiry(form)` | — | İletişim formu RPC |
| `updateContactInquiryStatus(inq, status)` | — | İletişim okundu/çözüldü |
| `createProgram(data)` | 697 | Program oluştur (`staffId: null` sistem programları) |
| `createTicket(...)` | 737 | Destek talebi |
| `setTicketStatus/sendTicketReply` | 753–769 | Ticket işlemleri |
| `adminUpdatePremiumMembership(...)` | 769 | Admin premium yönetimi |

---

## 10. "Nerede Ne Değiştirilir" Hızlı Tablo

| İstediğin değişiklik | Dosya |
|----------------------|-------|
| Yeni sayfa/route ekle | `src/App.jsx` + yeni page dosyası |
| Menü linki (üye) | `src/components/layout/Sidebar.jsx`, `AppShell.jsx` |
| Menü linki (public navbar) | `src/components/layout/PublicLayout.jsx`, `NavDropdown.jsx` |
| Kadromuza Katıl (navbar alt) | `PublicLayout.jsx` → `teamDropdownFooter` → `NavDropdown` `footer` prop |
| Kurumsal menü | `PublicLayout.jsx` → `corporateSubLinks` |
| Menü linki (admin) | `src/components/layout/AdminShell.jsx` |
| Başvurular admin | `src/pages/admin/AdminApplicationsPage.jsx` (Kadro / Kurumsal / İletişim; kadro → **CV PDF**) |
| Kadro başvuru formu | `src/pages/StaffApplicationPage.jsx`, `src/data/staffApplication.js` |
| Kurumsal başvuru formu | `src/pages/CorporateApplicationPage.jsx`, `src/data/corporateApplication.js` |
| Bize Ulaşın DB kaydı | `src/services/contactForm.js` → `submitContactInquiry` |
| Öğün tamamlama + grafik | `src/utils/memberProgress.js`, `DashboardPage.jsx`, `CalendarPage.jsx` |
| Diyetisyen listeler | `StaffListsPage.jsx`, `StaffShell.jsx` (kütüphane yok) |
| Ödeme UI (mock) | `src/pages/payments/PaymentManagementPage.jsx`, `src/data/mockPayments.js` |
| Menü linki (staff) | `src/components/layout/StaffShell.jsx` |
| Marka adı/logo | `src/config/brand.js`, `src/components/ui/BrandLogo.jsx` |
| Sosyal medya (SEO sameAs) | `src/config/brand.js` → `socialUrls` |
| Admin e-postası | `src/config/brand.js` + `supabase/setup.sql` is_admin() |
| Üyelik planları (fallback) | `src/data/membershipPlans.js` — `FREE_PLAN` (Basic), `GUMUS_PLAN`, `ALTIN_PLAN`, `PLATINUM_PLAN` |
| Üyelik planları (canlı) | Admin panel `/admin/plans` veya `plans` tablosu |
| Paket yapısı (Basic→Platinum) | `src/data/membershipPlans.js` satırlar 10–90 |
| Kalori hesaplayıcı erişim kontrolü | `src/pages/CalorieCalculatorPage.jsx` satırlar 137–142, 225–253 |
| Video görüşme ayarları | `src/config/videoCall.js` + `.env` |
| Telegram bildirim metni | `api/telegram-notify.js` |
| Veritabanı şeması | `supabase/setup.sql` + `supabase/migrations/*.sql` |
| Yeni API endpoint | `api/` klasörü + `vercel.json` |
| Renk/stil tema | `src/index.css` @theme bloğu |
| Toast mesajları | Sayfa içinde `useToast()` |
| Seans / randevu yönetimi | `src/components/admin/ManualSessionEditor.jsx` + `AdminPremiumPage.jsx` |
| Koç/diyetisyen atama + paket değiştirme (admin) | `AdminPremiumPage.jsx` + `adminUpdatePremium` + `staffAssignment.js` + `membershipPlans.js` |
| Public header "giriş yapılmış" gösterimi | `PublicLayout.jsx` → `isFullyRegistered` + `hasRegisteredMember()` (§57) |
| Çıkış loading | `AppContext.jsx` → `loggingOut` + panel shell çıkış butonları (§57) |
| Paket gün/süre etiketi (UI) | `membershipPlans.js` → `getPlanDurationLabel()` + `PricingCard`, `MembershipPlanCard`, `MembershipDurationPicker` |
| Kural tabanlı sağlık analizi | `src/services/aiAnalysis.js` — `generateHealthAnalysis()` |
| Landing üye/çevrimiçi gösterim eşikleri | `src/utils/displayPlatformStats.js`, `src/hooks/usePlatformDisplayStats.js`, `LiveActiveCounter.jsx`, `LandingPage.jsx` |
| Kayıt akışı (2 adım) | `src/pages/OnboardingPage.jsx` |
| Sağlık testi (panel sonrası) | `HealthTestWidget.jsx`, `HealthTestPrompt.jsx`, `HealthTestHub.jsx`, `HealthTestFlow.jsx` (hub + bölüm modu) |
| Kişisel bilgiler (profil) | `src/components/profile/PersonalInfoSection.jsx` |
| Otomatik program/analiz senkronu | `src/services/memberHealthSync.js` |
| Sayfa geçişinde scroll üste | `src/components/layout/ScrollToTop.jsx` → `PublicLayout.jsx` |
| MobileNav bağlantı düzeltmesi | `src/components/layout/MobileNav.jsx` — `/builder` → `/membership` |
| Şifre sıfırlama / doğrulama | `ForgotPasswordPage`, `ResetPasswordPage`, `AuthCallbackPage`, `VerificationSection.jsx`, `authVerification.js` |
| Service role kurulumu | ✅ Tamamlandı — §34.4 |
| Rol kontrolü | `src/components/auth/RequireAuth.jsx` |
| SEO meta / canonical | `src/components/seo/SeoHead.jsx` + `src/config/seo.js` |
| Sayfa bazlı SEO | `src/config/seo.js` → `PAGE_SEO` |
| Dinamik SEO (blog/kadro) | `BlogPostPage.jsx`, `StaffProfilePage.jsx` |
| Sitemap | `api/sitemap.js` → `/sitemap.xml` |
| robots.txt | `public/robots.txt` |
| Open Graph görseli | `public/og-image.png` — `npm run og:image` |
| Site logosu | `public/brand-logo.png` — `BrandLogo.jsx` |
| Favicon / ikon | `public/brand-mark.png`, `favicon-32.png` |
| Logo kaynağı | `public/brand-logo-alt.png` → `npm run og:image` |

---

## 11. Bilinen Sınırlamalar ve Tuzaklar

1. **Ödeme: Stripe canlıda çalışıyor** — `VITE_STRIPE_ENABLED=true` + Vercel'de `STRIPE_WEBHOOK_SECRET` zorunlu. Webhook kopuksa ödeme alınır ama üyelik açılmaz (§55). Test: `npm run test:stripe`, `npm run test:stripe:checkout`. Bayrak kapalıyken `PaymentForm` + `testPayment.js` simülasyonu devrede kalır.
2. **Kural tabanlı analiz** — `aiAnalysis.js` kural tabanlı hesaplama yapar (YZ/LLM yok).
3. **localDb.js silindi** (2026-06-24) — diskten kaldırıldı; tek veri kaynağı `supabaseDb.js`.
4. **PackageBuilder dosyaları silindi** — `/builder` → `/membership` redirect korunuyor.
5. **Ödeme Yönetimi sayfası mock** — `PaymentManagementPage` demo veri kullanır; gerçek `payments` tablosu Stripe webhook ile dolar (§22).
6. **Şifre sıfırlama** — §34 ile Supabase Auth + PKCE bağlandı; Supabase redirect URL'leri ve `SUPABASE_SERVICE_ROLE_KEY` gerekir.
7. **Üyelik dondurma/iptal talepleri kaldırıldı** (2026-06-25) — `membership_requests` tablosu ve `AdminRequestsPage` silindi.
8. **Daily REST API kullanılmıyor** — odalar deterministik URL ile açılır.
9. **Seanslar JSONB'de** — ayrı `sessions` tablosu yok.
10. **Doctor rolü** — frontend + DB destekler.
11. **RLS koç erişimi** — `assigned_coach_id` / `assigned_dietitian_id` sütunlarına bağlı.
12. **Sistem programları** — `staffId` mutlaka `null` olmalı (`'system'` UUID FK hatası verir); `createProgram` filtreler.
13. **Kayıt sırasında auth session erken açılır** — Stripe öncesi `ensureAuthForRegistration` session oluşturur; header bunu `isFullyRegistered` ile ayırır (§57).
14. **RLS performans lint'leri (§56)** — `auth_rls_initplan`, unindexed FK ve çoğu `multiple_permissive_policies` düzeltildi; kalan tek bilinen uyarı: `site_content` insert policy çakışması (bilinçli).
15. **Leaked password protection** — Supabase Dashboard'dan manuel açılmalı (`auth_leaked_password_protection` WARN).

### Paket Sistemi Yapısı (2026-06-24 Güncellemesi)

| Paket | Manuel Kalori | Fotoğraflı Kalori | Görüşmeler |
|-------|---------------|-------------------|------------|
| **Basic** (free) | ❌ | ❌ | Yok |
| **Eko** | ✅ | ❌ | Yok (ayda 2 diyet + 1 spor program güncellemesi) |
| **Diyet** | ✅ | ✅ | Ayda 2 diyetisyen |
| **Spor** | ✅ | ✅ | Ayda 2 koç |
| **Kurucu** | ✅ | ✅ | Ayda 2 koç + 2 diyetisyen |
| **Vip** | ✅ | ✅ | Ayda 2 koç + 2 diyetisyen |

**Notlar:**
- Tüm ücretli paketlerde 1, 3 veya 6 aylık süre seçimi vardır.
- Süre dolunca üyelik otomatik `free` plana düşer (`premiumMembership.js`).
- Kalori hesaplayıcıya ücretli paketler erişir; fotoğraflı analiz diyet/spor/kurucu/vip paketlerinde.

---

## 12. Dış Servis Bağımlılıkları

| Servis | Paket/Dosya | Kullanım |
|--------|-------------|----------|
| Supabase | `@supabase/supabase-js` | Auth, DB, Storage |
| Daily.co | `@daily-co/daily-js` | Video görüşme |
| Telegram | `api/*.js` (fetch) | Bildirimler |
| Vercel | `vercel.json` | Hosting + serverless |
| Google Fonts | `index.html` | Inter, Plus Jakarta Sans |
| Recharts | `recharts` | Admin/üye grafikleri |
| Framer Motion | `framer-motion` | Animasyonlar, toast |
| date-fns | `date-fns` | Tarih işlemleri |
| lucide-react | `lucide-react` | İkonlar |

---

## 13. Dosya Sayısı Özeti

| Kategori | Adet |
|----------|------|
| Pages | 39 |
| Components | 49 |
| Services | 16 |
| Hooks | 3 |
| Context | 2 |
| Config | 3 |
| Utils | 4 |
| Data | 3 |
| Root src | 3 (App.jsx, main.jsx, index.css) |
| API | 2 |
| Supabase SQL | 6 |
| Kök config | 6 |
| Dokümantasyon | 10+ (`docs/setup/*`, README, YAPILACAKLAR, AI_PROJE_REHBERI) |

**Toplam kaynak (`src/`):** 113 dosya

---

## 14. Son Güncelleme Özeti (2026-06-18)

### Yapılan Temel Değişiklikler

#### 1. YZ/Yapay Zeka Kavramı Kaldırıldı
- `aiAnalysis.js` servisi "Kural Tabanlı Analiz" olarak yeniden adlandırıldı
- `generateAiAnalysis()` → `generateHealthAnalysis()` fonksiyon ismi değiştirildi
- `aiAnalysis` veri alanı → `healthAnalysis` olarak güncellendi
- Tüm UI metinlerinde "YZ/AI" ifadeleri "Kişisel Sağlık Analizi" ile değiştirildi

#### 2. Paket Sistemi Yeniden Yapılandırıldı

| Eski Yapı | Yeni Yapı |
|-----------|-----------|
| Ücretsiz (free) | **Basic** - Otomatik programlar |
| Gümüş | **Gümüş** - Manuel kalori + Koç/Diyetisyen |
| Altın | **Altın** - Manuel kalori + Daha fazla görüşme |
| Platinum | **Platinum** - Fotoğraflı kalori + Tüm özellikler |

**Basic Paket Özellikleri:**
- Otomatik sağlık analizi
- Otomatik beslenme programı (kural tabanlı)
- Otomatik antrenman programı (hareket kütüphanesinden)
- Temel video erişimi
- Program takibi
- Koç/Diyetisyen görüşmesi **yok**
- Manuel kalori hesaplama **yok**

#### 3. Kalori Hesaplayıcı Erişim Kontrolü
- **Basic kullanıcılar:** Erişim yok (Planları İncele butonu gösterilir)
- **Gümüş/Altın kullanıcılar:** Manuel besin girişi modu
- **Platinum kullanıcılar:** Manuel giriş + Fotoğraflı kalori tespiti

#### 4. MobileNav Düzeltmesi
- Ölü `/builder` linki → `/membership` olarak düzeltildi
- "Premium" etiketi → "Planlar" olarak değiştirildi

### Değiştirilen Dosyalar
1. `src/services/aiAnalysis.js` — YZ → Kural tabanlı analiz
2. `src/services/supabaseDb.js` — `healthAnalysis` alanı
3. `src/data/membershipPlans.js` — Paket özellikleri güncellendi
4. `src/pages/OnboardingPage.jsx` — AI referansları kaldırıldı
5. `src/pages/DashboardPage.jsx` — `AiAnalysisPanel` → `HealthAnalysisPanel`
6. `src/pages/MembershipComparisonPage.jsx` — Karşılaştırma tablosu güncellendi
7. `src/pages/CalorieCalculatorPage.jsx` — Paket bazlı erişim kontrolü eklendi
8. `src/components/layout/MobileNav.jsx` — Link düzeltmesi

---

## 15. Son Güncelleme Özeti (2026-06-19)

### Yapılan Temel Değişiklikler

#### 1. Koç Program Oluşturma Arayüzü Yenilendi (`StaffClientsPage.jsx`)

**Eski akış:** Tek formda açılır-liste ile gün seçimi, tüm detaylar alt alta.

**Yeni akış:**
- "Program Oluştur" butonuna tıklandığında modal açılır.
- Modalin tepesinde **haftalık takvim** (Pzt–Paz 7 buton) görünür.
- Her güne tıklandığında o gün seçilir; hareket eklendikçe butonun üzerinde sayı rozeti belirir.
- **İki sütun düzeni (PC):**
  - **Sol:** Seçili günün hareketleri listesi (isim, saat, tekrar/süre, not, video simgesi, sil butonu).
  - **Sağ:** Hareket ekleme paneli — kütüphane arama, hareket seçimi (✓ işaretli), başlangıç/bitiş saati, ölçü tipi, tekrar/süre, not.
- **Mobil:** Sütunlar alt alta sıralanır.
- **Program özeti:** Alt kısımda eklenen günlerin özet etiketleri (ör. `Pzt: 2 Çar: 1`).
- Modal boyutu `lg` → `xl` olarak güncellendi.

```
src/pages/staff/StaffClientsPage.jsx
  - CoachProgramBuilder yeniden yazıldı (takvim + iki sütun)
  - İmport: Check, CalendarCheck eklendi
  - Modal size="xl"
```

#### 2. Dashboard — Otomatik Haftalık Plan ve Beslenme Planı Kaldırıldı (`DashboardPage.jsx`)

`HealthAnalysisPanel` artık şunları **göstermez:**
- ~~Önerilen Haftalık Antrenman Planı~~ (`coachRecommendations.weeklyPlan`)
- ~~Kişiselleştirilmiş Beslenme Planı~~ (`dietitianRecommendations.mealPlan`)

`HealthAnalysisPanel` artık şunları **gösterir:**
- VKİ, Günlük Kalori, Günlük Su
- Günlük Makro Hedefler (Protein, Karbonhidrat, Yağ)
- Video Kütüphanesinden Öneriler (kütüphane egzersizleri)
- Beslenme İpuçları
- Premium CTA

> **Neden?** Haftalık plan ve beslenme planı artık `ProgramsPage`'de gerçek program olarak görünür.

```
src/pages/DashboardPage.jsx
  - weeklyPlan bölümü kaldırıldı
  - mealPlan bölümü kaldırıldı
  - Utensils import kaldırıldı (artık kullanılmıyor)
```

#### 3. Basic Paket — Kayıt Sonrası Otomatik Program Oluşturma (`OnboardingPage.jsx`)

Basic (ücretsiz) kullanıcı kaydolduğunda `finishFree()` fonksiyonu artık:
1. `generateHealthAnalysis()` ile sağlık analizi oluşturur.
2. `register()` ile üyeyi kaydeder → `result.member.id` ile üye ID alınır.
3. **Otomatik Antrenman Programı:** Analizden gelen kütüphane egzersizlerini Pzt/Çar/Cum rotasyonuna dağıtarak `createProgram({ type: 'workout', ... })` ile kaydeder.
4. **Otomatik Beslenme Programı:** Analizden gelen `mealPlan` satırlarını `createProgram({ type: 'nutrition', ... })` ile kaydeder.
5. Her iki program da `staffId: 'system'`, `staffName: 'Yeni Form'` etiketiyle oluşturulur (koç görüşmesi gerektirmez).
6. Programlar `ProgramsPage` (`/programs`) üzerinden görüntülenebilir.

> **Kütüphane dışı hareket yok:** Egzersizler yalnızca `db.exercises` (hareket kütüphanesi) kaynağından alınır.

```
src/pages/OnboardingPage.jsx
  - createProgram useApp()'tan alındı
  - finishFree() içinde otomatik workout + nutrition programı oluşturuluyor
```

### Değiştirilen Dosyalar (2026-06-19)
1. `src/pages/staff/StaffClientsPage.jsx` — Koç program arayüzü
2. `src/pages/DashboardPage.jsx` — weeklyPlan + mealPlan kaldırıldı
3. `src/pages/OnboardingPage.jsx` — Basic kayıt sonrası otomatik program

---

## 16. AI (Yapay Zeka) Entegrasyonu (2026-06-19)

### Genel Yaklaşım
AI **opsiyonel** ve **maliyet-optimize** bir katmandır. Mimari, Telegram
entegrasyonuyla birebir aynıdır: API anahtarı **yalnızca sunucuda** (Vercel
Environment Variables) tutulur, tarayıcıya asla sızmaz. Anahtar yoksa uygulama
eskisi gibi çalışır (foto analizi demo, beslenme kural tabanlı).

**Seçilen sağlayıcı:** Google **Gemini 2.5 Flash Lite** (varsayılan) — düşük maliyet; kota dolunca **`gemini-flash-lite-latest`** ve **`gemini-2.0-flash-lite`** fallback. Kurulum: `docs/setup/AI_SETUP.md`.

### AI Entegrasyon Noktaları

| Özellik | Endpoint | Frontend Servis | Kullanım Yeri |
|---------|----------|-----------------|----------------|
| **Metin Kalori (Chat)** | `api/ai-food-text.js` | `src/services/calorieChat.js` | `CalorieCalculatorPage.jsx` (Gümüş+) |
| **Fotoğraflı Kalori** | `api/ai-food-vision.js` | `src/services/aiVision.js` | `CalorieCalculatorPage.jsx` (Platinum) |
| **Günlük Blog Makalesi** | `api/ai-blog-generate.js` | — (cron) | Vercel Cron → `posts` tablosu |
| **Kalori Telegram** | `api/calorie-chat-notify.js` | `calorieChat.js` | Chat mesajı → Telegram |

### Dosyalar

```
api/_gemini.js          → Gemini API + model fallback (503/429 → sıradaki model)
api/_ai-prompts.js      → Kalori + blog promptları (Yeni Form marka bağlamı)
api/_blog-images.js     → Blog kapak görselleri (kategori → Unsplash URL)
api/ai-food-vision.js   → Fotoğraf → kalori
api/ai-food-text.js     → Metin → kalori
api/ai-blog-generate.js → Günlük blog → Supabase posts (min. 1350 karakter, hedef ~1800)
scripts/test-ai.mjs     → npm run test:ai
scripts/patch-blog-covers.mjs → Mevcut yazılara coverImage ekler
vercel.json             → crons: 05:00 UTC (08:00 TR) → /api/ai-blog-generate
```

### Ortam Değişkenleri (Vercel)

| Değişken | Açıklama | VITE_ ön eki? |
|----------|----------|:-------------:|
| `GEMINI_API_KEY` | Gemini API anahtarı (GİZLİ) | ❌ Hayır |
| `GEMINI_MODEL` | Model (varsayılan `gemini-2.5-flash-lite`) | ❌ Hayır |
| `CRON_SECRET` | Blog cron koruması (Vercel otomatik Bearer) | ❌ Hayır |
| `VITE_AI_VISION_ENABLED` | Foto analizi (varsayılan açık; `false` ile kapat) | ✅ Evet |
| `VITE_AI_CHAT_ENABLED` | Chat kalori analizi bayrağı | ✅ Evet |

### Davranış (2026-06-25 güncellemesi)
- Kalori chat/foto **her zaman API'yi dener**; sunucuda `GEMINI_API_KEY` olmalı.
- `isCalorieAiEnabled()` / `isAiVisionEnabled()` → yalnızca `VITE_AI_*=false` ile kapatılır.
- Blog cron: günde 1 yazı; aynı gün tekrar üretmez (`force=true` ile test).
- Yeni blog yazılarına otomatik `coverImage` + `coverImageAlt` atanır.

### Dashboard Değişikliği
- `HealthAnalysisPanel` en altındaki **"Planları İncele" (Premium CTA)** kaldırıldı.

---

## 17. Son Güncelleme Özeti (2026-06-19 — UI/UX + Plan + Temizlik)

### 1. Tek Dosya Supabase Kurulumu
- `supabase/setup.sql` tek, idempotent dosya. Eski `schema.sql` (537 satır, `membership_requests` dahil) kaldırıldı; yerine deprecation stub bırakıldı. Artımlı güncellemeler `supabase/migrations/` + `npm run db:migrate`.
- Çalıştırma: SQL Editor'a yapıştır → Run. Admin: `admin@serenova.fit` / `Serenova2026!`.

### 2. Mevcut Üyenin Planını Değiştirme (yeni kayıt sorunu çözüldü)
- **Sorun:** Giriş yapmış (ör. Basic) üye paket seçmeye çalışınca `/onboarding` yeni kayıt başlatıyordu.
- **Çözüm:**
  - `supabaseDb.changeMemberPlan(member, planId, planPrice)` — mevcut üyeyi günceller (membership + packageConfig + premium tarihleri), ücretli ise `payments` kaydı ekler. Yeni hesap açmaz.
  - `AppContext.changePlan(planId, planPrice)` aksiyonu.
  - `OnboardingPage` artık giriş yapmış üye için (`isExistingMember`) erken `return` ile **`PlanChangeView`** render eder: plan kartları + ücretli planlarda ödeme modalı → `changePlan` → `/profile`.

### 3. Profil Sayfası Yeniden Tasarımı (`ProfilePage.jsx`)
- Sosyal medya tarzı: gradient kapak + orb'lar, üstte taşan büyük avatar (kamera düğmesi), isim/e-posta/şehir, üyelik rozeti.
- İstatistik şeridi: Program / Randevu / Seri sayıları.
- Kart grid: Kişisel Bilgiler (inline düzenle), Bildirim Ayarları, Abonelik (**Planı Değiştir** → `/onboarding`).
- Tüm eski işlevler korundu (düzenleme modalı, ayarlar, uzman/randevu kartı, çıkış).

### 4. Kadromuz Sayfaları Düzeltildi (`TeamListPage.jsx` + `App.jsx`)
- **Sorun:** `/team/coaches|dietitians|doctors` rotaları statikti ama sayfa `useParams().role` okuyordu → `role` undefined → ana sayfaya redirect.
- **Çözüm:** Rotalara `role` prop'u geçildi (`<TeamListPage role="coaches" />`); sayfa `roleProp || params.role` kullanıyor.

### 5. Ülke Kodu Tek Gösterim (`PhoneField.jsx`)
- **Sorun:** Bayrak + ülke kodu iki kez görünüyordu (standalone bayrak + select metni + `+90` ön eki).
- **Çözüm:** Kompakt tetikleyici (bayrak + `+kod` + chevron), native `<select>` görünmez şekilde üzerine bindirildi; input artık kodu tekrarlamıyor.

### 6. Landing — Gradient Bölümler + Mobil Rozet
- "Üyelerimiz Ne Diyor" arkasındaki **fotoğraf kaldırıldı** → renkli gradient + animasyonlu orb'lar.
- "Sık Sorulan Sorular" arkasına da renkli gradient + orb'lar eklendi.
- Mobil üyelik kartlarındaki **Popüler/Premium rozetleri** artık görünüyor (yatay kaydırma kabına `pt-6` eklendi; `overflow` kırpması giderildi).

### 7. Hamburger Menü — Animasyonlu Renkli Parıltı
- `index.css`: `@keyframes hamburgerGlow` (pulsing glow) + `::before` conic-gradient dönen halka.
- `PublicLayout` mobil menü butonuna `hamburger-glow` (menü kapalıyken) uygulandı. `prefers-reduced-motion` saygılı.

### 8. Destek Kategorileri Sadeleştirildi (`SupportForm.jsx`)
- "Üyelik / iptal" ve "Tatil dondurma" kaldırıldı. Kalan: Genel soru, Teknik sorun, Sağlık bildirimi, Ödeme.

### 9. Ölü Kod Temizliği + Kod Bölme
- Silinen dosyalar: `services/localDb.js`, `pages/PackageBuilderPage.jsx`, `components/package/PackageBuilder.jsx`, `components/package/PackageSummaryCard.jsx`, `components/ui/NumberSelector.jsx`.
- `App.jsx` route bazlı `lazy` + `Suspense`: başlangıç paketi ~1.74MB → ~508KB.

### Değiştirilen/Eklenen Dosyalar (2026-06-19)
- `supabase/setup.sql` (tek dosya), diğer SQL dosyaları silindi
- `src/services/supabaseDb.js` (`changeMemberPlan`)
- `src/context/AppContext.jsx` (`changePlan`)
- `src/pages/OnboardingPage.jsx` (`PlanChangeView` + erken return)
- `src/pages/ProfilePage.jsx` (yeniden tasarım)
- `src/pages/TeamListPage.jsx` + `src/App.jsx` (role prop)
- `src/components/ui/PhoneField.jsx` (tek gösterim)
- `src/pages/LandingPage.jsx` (gradient bölümler + mobil rozet)
- `src/components/layout/PublicLayout.jsx` + `src/index.css` (hamburger parıltı)
- `src/components/support/SupportForm.jsx` (kategoriler)

---

## 18. Son Değişiklikler (2026-06-20)

### 1. Navbar — Keşfet dropdown + Kadro landing'den kaldırıldı
- **Landing'den `TeamSection` kaldırıldı** — kadro yalnızca navbar **Kadromuz** dropdown'undan (`/team/coaches|dietitians|doctors`).
- **Hikayeler + Blog** → **Keşfet** açılır menüsü altında toplandı (`NavDropdown.jsx`).
- Mobil menüde aynı gruplama.

### 2. Kalori hesaplayıcı — chat-first, Telegram + AI
- **Eski sistem kaldırıldı:** sabit `FOOD_DB` listesi, manuel arama/sepet, `parseFoodText`, `custom_foods` otomatik kayıt (`addCustomFood`, `incrementFoodUsage`).
- **Yeni akış:** kullanıcı yazar → paralel:
  1. `POST /api/calorie-chat-notify` → `TELEGRAM_CONTACT_CHAT_ID` (Bize Ulaşın chat'i)
  2. `POST /api/ai-food-text` → Gemini kalori analizi (fotoğraf modu ile aynı JSON)
- **Fotoğraf modu** (Platinum): `/api/ai-food-vision` — değişmedi.
- **Yeni dosyalar:** `api/ai-food-text.js`, `api/calorie-chat-notify.js`, `src/services/calorieChat.js`
- **Token tasarrufu:** bilinmeyen besin tahmini + DB'ye otomatik kayıt yok.

### 3. Video görüşme — responsive + token düzeltmesi
- **Mobil:** tam ekran uzak video + sağ altta PiP yerel kamera (`pip` prop).
- **Mobil çekmece:** görüşme bilgisi + cihaz seçimi (`detailsOpen`).
- **`h-dvh`** + `safe-area-inset-bottom` footer.
- **Bug fix:** Daily meeting token effect artık `sessionId`, `displayName` değişince yeniden alınıyor (eskiden yalnızca `configured`).

### 4. Dokümantasyon
- **`YAPILACAKLAR.md`** — tüm setup adımları, Vercel env checklist, Supabase test sonuçları.
- Setup detayları hâlâ: `docs/setup/SUPABASE_SETUP.md`, `docs/setup/TELEGRAM_SETUP.md`, `docs/setup/AI_SETUP.md`, `docs/setup/VIDEO_SETUP.md`.

### 5. Supabase
- Migration `20260620_revoke_anon_rpc` **uygulandı** (admin RPC anon erişimi kapatıldı).
- Kalori chat için **yeni tablo gerekmez**; `custom_foods` artık kullanılmıyor.

### 6. Vercel
- CLI ile proje bağlandı; Gemini, Daily (`yeniform.daily.co`), Telegram, Supabase env'leri eklendi.
- **Yerel dev:** `npm run dev` → Vite + `/api/*` middleware (`vite.config.js`); `.env.local` okunur, redeploy gerekmez.

### Değiştirilen/Eklenen Dosyalar (2026-06-20)
- `src/components/layout/NavDropdown.jsx` (yeni)
- `src/components/layout/PublicLayout.jsx`
- `src/pages/LandingPage.jsx`
- `src/pages/CalorieCalculatorPage.jsx` (yeniden yazıldı)
- `src/pages/VideoCallPage.jsx`, `src/components/video/VideoCallUI.jsx`, `src/hooks/useDailyCall.js`
- `api/ai-food-text.js`, `api/calorie-chat-notify.js`, `api/_ai-prompts.js`
- `src/services/calorieChat.js` (yeni)
- `YAPILACAKLAR.md` (yeni)
- `.env.local` (Telegram format düzeltmesi)

---

## 19. Son Değişiklikler (2026-06-22)

### 1. Landing istatistik eşikleri (üye + çevrimiçi)
- **Hero kartı** (`LandingPage.jsx`): Sabit `2.500+` kaldırıldı; canlı üye sayısı `usePlatformDisplayStats` ile gelir.
- **Canlı sayaç şeridi** (`LiveActiveCounter.jsx`): Aynı mantık.
- **Kurallar** (`displayPlatformStats.js`):
  - Gerçek üye sayısı **1250'nin altındaysa** → `1250+` gösterilir.
  - **1250 ve üzeri** → gerçek sayı (artı işareti yok).
  - Çevrimiçi kullanıcı **25'ten azsa** → oturum boyunca **16–25 arası sabit rastgele** sayı.
  - **25 ve üzeri** → gerçek çevrimiçi sayı.

### 2. Nasıl Çalışır — mobil adım düzeni
- **Yalnızca mobil:** Adım ikonları kart metninin **üst border ortasına** yerleştirildi.
- Adımlar arasında **animasyonlu yeşil-mavi dikey bağlantı çizgisi** (`how-it-works-connector` — `index.css`).
- Masaüstü düzeni değişmedi (sol ikon + dikey çizgi).

### 3. Başarı Hikayeleri hero
- `/stories` sayfası başlığı `PlansAnimatedBackground` ile sarıldı (üyelik seçenekleri bölümüyle aynı aurora gradient + orb animasyonu).
- `section-badge`, `section-title`, `section-subtitle` sınıfları kullanıldı.

### 4. Navbar sayfa geçişi scroll düzeltmesi
- `ScrollToTop.jsx`: Rota değişince (hash yoksa) `window.scrollTo(0, 0)`.
- `PublicLayout.jsx` içinde mount edildi — sayfa altındayken başka sayfaya tıklanınca yeni sayfa üstten açılır.

### 5. Navbar logo kaldırıldı
- ~~`BrandLogo` navbar'dan çıkarıldı~~ **Geri alındı (2026-06-22):** `BrandLogo` navbar'da tekrar kullanılıyor.

### Değiştirilen/Eklenen Dosyalar (2026-06-22)
- `src/utils/displayPlatformStats.js` (yeni)
- `src/hooks/usePlatformDisplayStats.js` (yeni)
- `src/components/layout/ScrollToTop.jsx` (yeni)
- `src/pages/LandingPage.jsx`
- `src/components/landing/LiveActiveCounter.jsx`
- `src/components/landing/HowItWorksSection.jsx`
- `src/pages/SuccessStoriesPage.jsx`
- `src/components/layout/PublicLayout.jsx`
- `src/index.css` (`how-it-works-connector`)

---

## 20. Son Değişiklikler (2026-06-22 — Kayıt Akışı)

### 1. Kayıt formu sadeleştirildi (`OnboardingPage.jsx`)
- **Adım 1 — Hesap:** Ad soyad, e-posta, telefon, **cinsiyet (Kadın/Erkek — zorunlu, "belirtmek istemiyorum" yok)**, şifre (+ tekrar). Mobile-first, tek ekrana sığacak kompakt düzen (`min-h-[100dvh]`, `max-w-lg`).
- **Adım 2 — Üyelik:** Plan seçimi (+ ücretli planlarda ödeme modalı).
- Kaldırıldı (kayıttan): yaş, şehir, ölçüler, fotoğraf, hedefler, spor/beslenme tercihleri, sağlık testi, sağlık onayı.
- Kayıt sonrası otomatik program/analiz **sağlık testi tamamlanınca** `memberHealthSync.js` devreye girer (boy/kilo yoksa testten türetilir).

### 2. Sağlık testi — panel sonrası akış

**Giriş noktaları:**
- Rehber turu (`OnboardingTutorial`) kapanınca `onComplete` → `HealthTestPrompt` (FAB veya hemen çöz)
- Üye menüsü → `/health-test` (`HealthTestPage` → `HealthTestHub`)
- Tamamlanmamışsa menüde amber `!` badge (`memberNav.js`)

**Hub modeli (2026-07):** Tek uzun akış yerine kategori bazlı tamamlama:
| Rota | Dosya | İşlev |
|------|-------|-------|
| `/health-test` | `HealthTestPage.jsx` → `HealthTestHub.jsx` | Toplam ilerleme + kategori kartları |
| `/health-test/:sectionId` | `HealthTestSectionPage.jsx` → `HealthTestFlow` (`sectionId` modu) | Tek bölüm soruları |
| `/health-test/finish` | `HealthTestFinishPage.jsx` | Tüm bölümler bitince onay + disclaimer |

**Hub grid (responsive):** mobil **2**, tablet (`md`) **3**, masaüstü (`lg`) **4** sütun — `max-w-3xl` kaldırıldı, tam genişlik.

**Veri:** `src/data/healthTest.js` — `getHealthTestHubSections`, `getOverallHealthTestProgress`, `isSectionComplete`, `isQuestionFullyAnswered` (çoklu seçim + koşullu "Diğer" detay).

**Eski akış (hâlâ geçerli):** Prompt → `HealthTestFlow` (tüm sorular) veya hub'dan bölüm bölüm → `healthTest`, `healthAck`, `disclaimer` DB'ye (`saveHealthTestProgress` / tamamlama).

- **Testi Şimdi Çöz** → `/health-test` hub veya doğrudan flow
- **Sonra Hatırlat** → FAB (`HealthTestWidget.jsx`)
- Bileşenler: `HealthTestPrompt.jsx`, `HealthTestHub.jsx`, `HealthTestFlow.jsx`, `HealthTestWidget.jsx`

### 3. Kişisel bilgiler — profil sayfası
- `PersonalInfoSection.jsx`: yaş, cinsiyet, şehir/ilçe, ölçüler, fotoğraf, hedefler, spor seviyesi, beslenme tercihleri.
- Düzenle modalından güncellenir; üyelik seçimi **yok** (kayıtta yapılır).
- Kayıt sonrası `syncMemberHealthAssets()` — sağlık testi + profil yeterliyse Basic için otomatik analiz + program oluşturur.

### 4. Yeni servis
- `src/services/memberHealthSync.js` — `profileReadyForAnalysis`, `createAutoProgramsForMember`, `syncMemberHealthAssets`.

### Değiştirilen/Eklenen Dosyalar (§20)
- `src/pages/OnboardingPage.jsx` (yeniden yazıldı — 2 adım)
- `src/components/onboarding/HealthTestPrompt.jsx` (yeni)
- `src/components/onboarding/HealthTestHub.jsx` (kategori hub)
- `src/components/onboarding/HealthTestFlow.jsx` (bölüm veya tam akış)
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`
- `src/components/dashboard/HealthTestWidget.jsx` (yeni)
- `src/components/profile/PersonalInfoSection.jsx` (yeni)
- `src/services/memberHealthSync.js` (yeni)
- `src/components/ui/OnboardingTutorial.jsx` (`onComplete` callback)
- `src/pages/DashboardPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/components/layout/PublicLayout.jsx` (logo geri alındı)

---

## 21. Son Değişiklikler (2026-06-22 — Kayıt Formu, Hikaye, Blog, Doğrulamalar)

### 1. Kayıt formu yeniden tasarlandı (`OnboardingPage.jsx`)
- Giriş sayfasıyla (`auth/LoginPage.jsx`) aynı **split-screen** düzen: solda video arka planlı marka paneli + avantaj listesi (masaüstü), sağda kart içinde adımlı form.
- Mobilde sol panel gizlenir, form tam genişlik; üstte `BrandLogo`.
- Adım 1 (Hesap) + Adım 2 (Üyelik planı) korundu; alt aksiyonlar gradient buton + "Geri".
- `PlanChangeView` (mevcut üyenin plan değişimi) aynı dosyada korunur.

### 2. E-posta regex + telefon çift kayıt engeli
- `OnboardingPage`: `EMAIL_RE` ile gerçek e-posta doğrulaması, hata alan altında gösterilir.
- **Telefon tekilliği:** `supabaseDb.ensureAuthForSignup()` kayıt öncesi `phone_in_use` RPC'sini çağırır; numara kayıtlıysa hata döner.
- **RPC:** `public.phone_in_use(p_phone text)` — `SECURITY DEFINER`, sabit `search_path`, sadece rakama indirgenmiş karşılaştırma; `anon`+`authenticated` çağırabilir. `supabase/setup.sql` içinde tanımlı.

### 3. Başarı hikayesi — üye panelinden gönderme
- Yeni paylaşılan bileşen: `src/components/social/SuccessStorySubmitModal.jsx`.
- **Dashboard**'a "Başarı Hikayeni Paylaş" hızlı erişim kartı eklendi → modal açar → `submitSuccessStory`.
- `SuccessStoriesPage` aynı modalı kullanır; giriş yoksa `/login`'e yönlendirir.

### 4. Blog sayfası hero
- `BlogPage.jsx` üstüne `PlansAnimatedBackground` hero (başarı hikayeleri sayfasıyla aynı aurora gradient), `section-badge/title/subtitle`.

### 5. Örnek içerik (Supabase `site_content`)
- 4 örnek **yorum** (testimonial) + 5 örnek **SSS** (faq) eklendi (toplam 6'şar).

### Değiştirilen/Eklenen Dosyalar (§21)
- `src/pages/OnboardingPage.jsx`, `src/pages/SuccessStoriesPage.jsx`, `src/pages/BlogPage.jsx`, `src/pages/DashboardPage.jsx`
- `src/components/social/SuccessStorySubmitModal.jsx` (yeni)
- `src/services/supabaseDb.js` (`ensureAuthForSignup` telefon kontrolü)
- `supabase/setup.sql` (`phone_in_use` RPC)

---

## 22. Ödeme Sistemi — Stripe Altyapısı (2026-06-22)

### Genel
İki mod vardır ve `VITE_STRIPE_ENABLED` bayrağı ile seçilir:
- **Stripe açık (`true`):** Gerçek **Stripe Checkout** (yönlendirmeli, hosted) akışı.
- **Stripe kapalı:** Eski **test kartı** simülasyonu (`PaymentForm` + `4242…`).

Tüm gizli anahtarlar **yalnızca sunucuda** (Vercel) tutulur — Telegram/AI ile aynı desen.

### Akış (kayıt + plan değişimi)
```
Plan seç → (kayıt akışında önce ücretsiz hesap oluştur, oturum aç)
   → POST /api/stripe-checkout (Supabase token doğrulanır, fiyat SUNUCUDA belirlenir)
   → Stripe Checkout sayfası → kart ile ödeme
   → Stripe → POST /api/stripe-webhook (checkout.session.completed)
        → service-role ile: members.membership + premium tarihleri AKTİF,
          payments + activities kaydı (idempotent: stripeSessionId tekrarına kapalı)
          → Telegram ✅ "Ödeme başarılı" (TELEGRAM_PAYMENT_CHAT_ID)
   → success: /dashboard?payment=success (kayıt) | /profile?payment=success (değişim)
   → cancel:  /onboarding?payment=cancelled
```

### Telegram ödeme bildirimleri (2026-07-01)
Webhook, `TELEGRAM_PAYMENT_CHAT_ID` (yoksa `TELEGRAM_CHAT_ID`) tanımlıysa şu olaylarda
mesaj atar (`api/_telegramSend.js` → `notifyPaymentTelegram`):
| Olay | Mesaj |
|------|-------|
| `checkout.session.completed` (paid) | ✅ Ödeme başarılı (üye, e-posta, plan, tutar, session) — sadece **yeni** ödemede; duplicate'te atlanır |
| `checkout.session.expired` | ❌ Oturum tamamlanmadan doldu |
| `checkout.session.async_payment_failed` | ❌ Gecikmeli ödeme başarısız |
| `payment_intent.payment_failed` | ❌ Kart reddi (`last_payment_error.message`) |

Bunun için Stripe webhook'una bu 4 event eklenmeli. `stripe-checkout.js` metadata'yı
hem session'a hem `payment_intent_data.metadata`'ya yazar (başarısız olayda da plan/isim
bilgisi taşınır). Telegram hatası ödeme akışını **etkilemez** (try/catch içinde).

### Dosyalar
| Dosya | Görev |
|-------|-------|
| `api/_stripe.js` | Stripe istemcisi, `CURRENCY=try`, `PLAN_FALLBACK` yedek fiyatlar, `toMinorUnits` |
| `api/_supabaseAdmin.js` | Service-role Supabase istemcisi (RLS atlar) |
| `api/stripe-checkout.js` | POST: token doğrula → fiyatı `plans` tablosundan/yedekten al → Checkout oturumu (metadata: memberId, memberName, planId, planName, planPrice, durationMonths, durationLabel, flow, email; ayrıca `payment_intent_data.metadata`) |
| `api/stripe-webhook.js` | Ham gövde + imza doğrulama (`bodyParser:false`), üyelik aktifleştirme, idempotent + başarılı/başarısız **Telegram bildirimi** |
| `src/config/stripe.js` | `isStripeEnabled()`, `STRIPE_PUBLISHABLE_KEY` |
| `src/services/stripePayment.js` | `startStripeCheckout(planId, flow)` — token alır, endpoint'i çağırır, URL'e yönlendirir |

### Wiring
- `OnboardingPage`: `finish()` ücretli planda Stripe açıksa `startStripeRegister()` (önce `register(...,'free')`, sonra checkout). `PlanChangeView.handleConfirm()` ücretli planda `startStripeCheckout(..., 'change')`.
- Dönüş işleme: `DashboardPage` + `ProfilePage` → `?payment=success` toast + `refresh()` (webhook gecikmesi için 4 sn sonra tekrar). `OnboardingPage`/`PlanChangeView` → `?payment=cancelled` toast.

### Güvenlik tasarımı
- Fiyat **istemciden alınmaz** (sunucu `plans`/yedek).
- Üye kimliği **access token doğrulanarak** belirlenir (spoof engeli).
- Webhook **imzayla** doğrulanır ve **idempotent**'tir.
- `SUPABASE_SERVICE_ROLE_KEY` yalnızca webhook'ta; RLS'yi yalnızca sunucuda atlar.

### Gerekli env (özet — detay `docs/setup/STRIPE_SETUP.md`)
| Değişken | Kapsam |
|----------|--------|
| `STRIPE_SECRET_KEY` | Sunucu (gizli) |
| `STRIPE_WEBHOOK_SECRET` | Sunucu (gizli) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sunucu (gizli) |
| `SUPABASE_URL` | Sunucu (VITE_SUPABASE_URL yedek) |
| `APP_URL` | Sunucu (opsiyonel) |
| `VITE_STRIPE_ENABLED` | İstemci (on/off) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | İstemci (opsiyonel) |
| `TELEGRAM_PAYMENT_CHAT_ID` | Sunucu (ödeme bildirimi; yedek `TELEGRAM_CHAT_ID`) |

### Bağımlılık
- `stripe` (npm) sunucu tarafı eklendi. İstemci redirect akışı ek paket gerektirmez.

### Üyelik süresi doğrulaması
- 4 haftalık planlar **28 gün** sonrasına biter (`computePremiumExpiresAt`); webhook da aynı hesabı kullanır (`computeExpiry`). DB'de doğrulandı (ör. 21 Haz → 19 Tem).

---

## 23. SEO Altyapısı (2026-06-22)

### Genel
React SPA olduğu için meta etiketleri istemci tarafında `SeoHead` bileşeni ile güncellenir. Google JS render destekler; ilk HTML'de de temel meta `index.html` içinde mevcuttur.

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/config/seo.js` | Site URL, varsayılan meta, `PAGE_SEO` rotaları, JSON-LD builder'ları |
| `src/components/seo/SeoHead.jsx` | title, description, keywords, canonical, OG, Twitter Card, robots |
| `src/components/seo/PublicRouteSeo.jsx` | PublicLayout'ta statik rotalar için otomatik meta |
| `src/components/seo/JsonLd.jsx` | Yapılandırılmış veri script enjeksiyonu |
| `src/components/seo/NoIndexHead.jsx` | Üye/staff/admin/video panelleri → `noindex, nofollow` |
| `public/robots.txt` | Crawler kuralları + sitemap referansı |
| `public/og-image.png` | Sosyal paylaşım görseli (1200×630) — `og:image` meta |
| `public/brand-logo.png` | Yatay logo — navbar, giriş (`BrandLogo.jsx`) |
| `public/brand-mark.png` | İkon karesi — favicon, manifest, JSON-LD |
| `public/brand-logo-alt.png` | Logo kaynağı — değiştir → `npm run og:image` |
| `scripts/generate-og-image.mjs` | Tüm marka PNG'lerini üretir |
| `docs/setup/SEO_SETUP.md` | Search Console + sitemap + OG kurulum rehberi |
| `public/site.webmanifest` | PWA-lite manifest |
| `api/sitemap.js` | Dinamik XML sitemap (blog + kadro profilleri Supabase'den) |

### Sayfa SEO eşlemesi

| Rota | Meta kaynağı | JSON-LD |
|------|--------------|---------|
| `/` | `PAGE_SEO['/']` + `PublicRouteSeo` | Organization, WebSite, FAQPage (`LandingPage`) |
| `/membership`, `/onboarding`, `/stories`, `/blog`, `/team/*` | `PAGE_SEO` | ItemList (`BlogPage`, `TeamListPage`) |
| `/blog/:id` | `BlogPostPage` → `SeoHead` | Article + BreadcrumbList |
| `/team/:id` | `StaffProfilePage` → `SeoHead` | Person + BreadcrumbList |
| `/login`, `/forgot-password` | `PAGE_SEO` | `noindex` |
| `*` (404) | `NotFoundPage` | `noindex` |
| `/dashboard`, `/admin/*`, `/staff/*`, `/call/*` | `NoIndexHead` | `noindex` |

### Sitemap & robots
- **URL:** `https://ALANADINIZ.com/sitemap.xml` (`vercel.json` rewrite → `api/sitemap.js`)
- Statik rotalar + Supabase `posts` (published) + `staff` (active) otomatik eklenir.
- `robots.txt` panel rotalarını `Disallow` eder.

### Gerekli env
```
VITE_SITE_URL=https://www.yeniform.com   # canonical + OG (sonunda / yok)
APP_URL=https://www.yeniform.com         # sitemap sunucu yedeği
```

**Canlı site:** https://www.yeniform.com (`yeniform.com` → `www` yönlendirmesi)

### Production checklist (manuel)
1. ~~Vercel'e `VITE_SITE_URL` ve `APP_URL` ekleyin~~ ✅ `www.yeniform.com` (3 ortam)
2. ~~Google Search Console property + sitemap~~ ✅ 2026-06-23
3. ~~Ana sayfa dizine ekleme isteği~~ ✅ 2026-06-23
4. ~~Blog seed (5 yazı)~~ ✅ sitemap'te doğrulandı
5. OG debugger testi (Facebook + LinkedIn) — **bekliyor**
6. Search Console sitemap “Başarılı” — **24–48 saat bekle**
7. GA4 measurement ID → `index.html` (opsiyonel — ID gerekli)
8. `src/config/brand.js` → `socialUrls` (opsiyonel — URL'ler gerekli)
9. Kadro fotoğrafları + blog içerik kalitesi (devam eden)

### Erişilebilirlik (SEO ile ilişkili)
- `PublicLayout`: skip link (`#main-content`), `<main>`, nav `aria-label`
- Hero fallback görseline anlamlı `alt` metni

### Değiştirilen/Eklenen Dosyalar (§23)
- `src/config/seo.js`, `src/components/seo/*` (4 dosya)
- `index.html`, `vercel.json`, `vite.config.js` (sitemap dev rewrite)
- `public/robots.txt`, `public/site.webmanifest` (not: `og-image.svg` §35.4'te silindi — OG artık programatik üretiliyor)
- `api/sitemap.js`
- `src/components/layout/PublicLayout.jsx`, `AppShell.jsx`, `AdminShell.jsx`, `StaffShell.jsx`
- `src/pages/LandingPage.jsx`, `BlogPostPage.jsx`, `StaffProfilePage.jsx`, `NotFoundPage.jsx`, `VideoCallPage.jsx`
- `.env.example`

---

## 24. SEO Operasyon Durumu (2026-06-23 — canlı denetim)

### Tamamlanan (teknik + manuel + doğrulandı)

| Alan | Durum | Not |
|------|--------|-----|
| Meta / canonical / OG | ✅ Kod + canlı | `www.yeniform.com` |
| `robots.txt` + `sitemap.xml` | ✅ Canlı | **15 URL** (8 statik + 5 blog + 2 kadro) |
| Vercel `VITE_SITE_URL` + `APP_URL` | ✅ | Production, Preview, Development |
| Yerel `.env.local` SEO env | ✅ | Aynı canonical URL |
| Search Console doğrulama | ✅ | Turhost DNS TXT |
| Sitemap gönderimi | ✅ | Durum “Başarılı” için 24–48 saat bekle |
| Ana sayfa dizin isteği | ✅ | URL denetimi |
| Panel `noindex` | ✅ | dashboard, admin, staff, call |
| JSON-LD | ✅ | Organization, WebSite, FAQ, Article, Person, Breadcrumb, ItemList |
| `public/favicon.svg` | ⚠️ Eski YF ikonu — artık `favicon-32.png` kullanılıyor |
| `public/og-image.png` | ✅ | Sosyal paylaşım (1200×630, sade logo) |
| `public/brand-logo.png` | ✅ | Navbar + JSON-LD Organization logo |
| `public/brand-mark.png` | ✅ | Favicon + manifest |
| BrandLogo bileşeni | ✅ | `brand-logo.png` kullanıyor |
| Blog seed (5 yazı) | ✅ | Supabase + sitemap |
| `yeniform.com` → `www` | ✅ | 308 redirect |

### Acil — yapılacaklar (öncelik sırası)

| # | Görev | Kim | Dosya / yer |
|---|--------|-----|-------------|
| 1 | OG debugger testi | Siz (manuel) | Facebook + LinkedIn → `https://www.yeniform.com` |
| 2 | Sitemap “Başarılı” bekle / kontrol | Siz | Search Console → Site haritaları |
| 3 | Kadro fotoğrafları (eksik profiller) | Admin | `/admin/staff` |
| 4 | Haftalık Search Console kontrolü | Siz | Sayfalar, site haritaları |
| 5 | GA4 Measurement ID verin | Siz → agent | `index.html` |
| 6 | Sosyal medya URL'leri verin | Siz → agent | `src/config/brand.js` → `socialUrls` |

### Opsiyonel / iyileştirme

| Görev | Nerede |
|-------|--------|
| `public/brand-logo.png` + `npm run og:image` | Script `favicon.svg` yedek kullanır |
| Blog içerik kalitesi (800+ kelime) | `/admin/blog` |
| Başarı hikayesi artırma | `/admin/content` |
| Backlink / sosyal medya paylaşımı | Dış kanal |
| SSR / prerender (ileri seviye) | Vite SSR veya prerender plugin — şu an SPA |

### Supabase içerik snapshot (2026-06-23 — sitemap doğrulaması)

| Kaynak | Sayı | SEO notu |
|--------|------|----------|
| Yayınlanmış blog | 5 | Seed uygulandı — içerik uzunluğu/anahtar kelime optimizasyonu devam |
| Aktif kadro | 2 | Sitemap'te profil URL'leri mevcut |
| FAQ | 6 | Landing JSON-LD'de kullanılıyor |
| Onaylı başarı hikayesi | 5 | `/stories` sayfasında |

### Kod değişiklikleri (2026-06-23 SEO denetimi)

- `public/og-image.png` — canlı siteden repoya eklendi (deploy kaybı riski giderildi)
- `scripts/generate-og-image.mjs` — `brand-logo.png` yoksa `favicon.svg` yedek
- `docs/setup/SEO_SETUP.md`, `YAPILACAKLAR.md` — canlı denetim sonuçları

Detaylı kurulum: `docs/setup/SEO_SETUP.md`

---

## 25. Kadro & Blog Profil Genişletmesi (2026-06-23)

### staff.data JSONB şeması (yeni alanlar)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `title` | string | Unvan (ör. Uzman Diyetisyen) |
| `specialty` | string | Ana uzmanlık (kart başlığı) |
| `specialties` | string[] | Uzmanlık etiketleri |
| `bio` | string | Uzun biyografi (profil sayfası) |
| `education` | `{degree,school,year}[]` | Eğitim |
| `experienceYears` | number | Toplam deneyim yılı |
| `experiences` | `{title,organization,period,description}[]` | İş deneyimi |
| `certificates` | `{name,issuer,year}[]` | Sertifika / diploma |
| `languages` | string[] | Konuşulan diller |
| `photo`, `phone`, `workDays`, `workStart`, `workEnd` | (mevcut) | Görsel, iletişim, randevu |

Eski `description` alanı okunurken `bio`'ya normalize edilir (`normalizeStaffProfile`).

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/data/staffProfile.js` | Form şeması + normalize |
| `src/components/admin/StaffFormModal.jsx` | Sekmeli admin formu |
| `src/components/staff/StaffProfileDisplay.jsx` | Modern profil sayfası |
| `src/components/staff/StaffMemberCard.jsx` | Responsive kadro kartı |
| `src/pages/admin/AdminStaffPage.jsx` | Kadro yönetimi |
| `src/pages/TeamListPage.jsx`, `StaffProfilePage.jsx` | Public görünüm |
| `src/utils/blogContent.js` | `estimateReadMinutes()` |
| `supabase/migrations/20260623_staff_profiles_blog_seed.sql` | Örnek kadro + 5 blog seed |

### Blog

- `posts.data` JSONB yapısı aynı; `addPost` / `editPost` okuma süresini içerikten hesaplar.
- `src/data/blogPosts.js` — 5 örnek yazı (fallback + seed kaynağı).

### Veritabanı seed (manuel)

Supabase SQL Editor'da çalıştırın: `supabase/migrations/20260623_staff_profiles_blog_seed.sql`  
(Mevcut blog yazılarını siler ve 5 yeni yazı ekler; kadro profillerini zenginleştirir.)

---

## 26. Yorumlar Slider'ı + Kayıt UX Yenilemesi (2026-06-23)

### Yorumlar (TestimonialCarousel) — yatay slider + genişletilebilir

`src/components/landing/TestimonialCarousel.jsx` tamamen yeniden yazıldı. Önceki
hâli masaüstünde 3'lü/2'li grid, sadece mobilde tek kart taşıyıcıydı. Yeni hâl
"Gerçek Başarı Hikayeleri" (`SuccessStoriesPreview`) ile aynı deneyimi sunar:

- **Tek yatay kaydırılabilir slider** (tüm cihazlarda) — `snap-x snap-mandatory`,
  gizli scrollbar (`[scrollbar-width:none]` + `[&::-webkit-scrollbar]:hidden`).
- **Sol/sağ ok butonları** (`sm` ve üstünde) — `scrollRef` + `canLeft/canRight`
  durumuna göre etkinleşir; mobilde "yana kaydırın →" ipucu metni.
- **Uzun yorumlar kısaltılır:** `PREVIEW_LIMIT = 180` karakter üstü yorumlarda
  `line-clamp-4` uygulanır ve **aşağı ok (ChevronDown)** ile "Devamını oku /
  Daha az göster" toggle'ı açılır (kart bazlı `expanded` state).
- Kart genişliği `w-[min(85vw,340px)] sm:w-[360px]`; yıldız + rozet korunur.

### Kayıt paket seçimi (OnboardingPage step 1) — modern + ikna odaklı

`src/pages/OnboardingPage.jsx` step 1 kartları 2'li küçük grid'den **tek sütun
zengin kartlara** (mobile-first) çevrildi:

- `RECOMMENDED_PLAN = 'kurucu'` → animasyonlu **"En Çok Tercih"** rozeti (pulse),
  amber glow ring, üzerinden geçen **parıltı (shimmer) animasyonu**, "Bu Planı Seç ★".
- **Fiyat parçalama** (`dailyPrice`): ücretli planlarda "Günde yalnızca ~₺X"
  rozeti ile yüksek aylık fiyatın algısı yumuşatılır (psikolojik teşvik).
- Kartlar `framer-motion` ile stagger giriş + `whileHover y:-3` + `whileTap`.
- Önerilen kart 4 özellik, diğerleri 3 özellik gösterir; "+N özellik daha" satırı.
- Seçili/önerilen durumlarda ikon arka planı renklenir, ring + check rozeti.

### Giriş & Kayıt formları tutarlılığı

Giriş (`LoginPage`) ve kayıt (`OnboardingPage`) formları aynı görsel aileye getirildi:

| Öğe | Ortak değer |
|-----|-------------|
| Sağ panel container | `px-4 py-10 sm:px-8` |
| Mobil logo boşluğu | `mb-8 lg:hidden` |
| Form kartı | `rounded-3xl border-white/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm` |
| Alan stili | `FormField` (emphasis) — etiket `text-xs uppercase tracking-wide`, input `py-3.5 pl-11 border-cream-400 bg-white` |
| Şifre alanı | `FormField` ile aynı emphasis stili + göz aç/kapa |
| Birincil buton | `py-3.5` brand→sage gradyan |

- `LoginPage` artık `FormField`'i import edip e-posta için kullanır; şifre alanı
  da aynı emphasis stiline getirildi (önceki `border-cream-200 bg-cream-50` farkı kaldırıldı).
- Onboarding şifre/tekrar inputları emphasis stiline (`border-cream-400 bg-white py-3.5`) hizalandı.

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/landing/TestimonialCarousel.jsx` | Yatay slider + genişletilebilir yorum |
| `src/pages/OnboardingPage.jsx` | Yeni paket kartları + form hizalaması |
| `src/pages/auth/LoginPage.jsx` | `FormField` kullanımı + stil hizalaması |

---

## 27. Bildirimler, Kayıt Popup, Program & Takvim Sistemi (2026-06-23)

### Anlık bildirimler (toast + okunmamış sayı)

- `NotificationToastBridge` (`src/components/notifications/NotificationToastBridge.jsx`) — Supabase
  Realtime ile `members` UPDATE geldiğinde yeni bildirimleri toast olarak gösterir (sayfa yenileme gerekmez).
- Okunmamış sayı: `TopBar` / `AppShell` / `MobileNav` — `notifications.filter(n => !n.read).length`.
- Bildirim kaynakları: program oluşturma, koç/diyetisyen ataması, destek yanıtı, kayıt hoş geldin.
- `support-reply` bug fix: `text` → `message` (`supabaseDb.js`).

### Kayıt hoş geldin popup

- `WelcomeSuccessModal` — kayıt/ödeme sonrası animasyonlu teşekkür popup, ardından `/dashboard`.

### Program oluşturma (staff)

| Rol | Bileşen | Özellik |
|-----|---------|---------|
| Koç | `CoachProgramBuilder` (StaffClientsPage) | **Her hafta tekrarla** (Pzt–Paz) veya **belirli tarih** modu |
| Diyetisyen | `NutritionProgramBuilder` | Tarih bazlı öğünler: kahvaltı, öğle, akşam, ara öğün, not |

Ortak şema (`programs.data.entries[]`):
- `date: 'yyyy-MM-dd'` — net tarih
- `day: 0–6` — haftalık tekrar (geriye uyumlu)
- Beslenme: `mealType`, `name`, `note`

Yardımcı: `src/utils/programSchedule.js` — `entryMatchesDate`, `getProgramEntriesForDate`.

### Takvim (üye)

- `CalendarPage` — tarih + haftalık girdi desteği; **tüm günler** açılır ve tamamlanabilir (§37).
- Beslenme listesi: öğün adı + "Öğün içeriği" bloğu (`mealContentText`).
- Antrenman satırında yalnızca **hareket adı** + saat/set; açıklama listede gösterilmez.
- Sol thumbnail tıklanınca kütüphane tarzı detay modalı (`ExerciseDetailModal`, `z-[70]`); gün paneli açık kalır.
- Hareket videosu **aynı satırda** genişletilir (`İzle` / `Gizle`), ayrı modal yok.
- Tamamlama → `toggleActivityCompletion` → `streak` + `progress.workouts` güncellenir.

### Streak & grafikler

- `src/utils/memberProgress.js` — `computeStreak`, `buildWorkoutProgress`, `buildProgressPatch`.
- `AppContext.toggleActivityCompletion` — tamamlama + streak/grafik tek çağrıda.

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/utils/programSchedule.js` | Tarih/haftalık program eşleme |
| `src/utils/memberProgress.js` | Streak + workout grafik verisi |
| `src/components/notifications/NotificationToastBridge.jsx` | Realtime toast |
| `src/components/auth/WelcomeSuccessModal.jsx` | Kayıt sonrası popup |
| `src/components/staff/NutritionProgramBuilder.jsx` | Diyetisyen tarihli öğün formu |
| `src/pages/CalendarPage.jsx` | Takvim + öğün/antrenman tamamlama (tüm günler) |
| `src/pages/staff/StaffClientsPage.jsx` | Koç tarih modu |
| `src/context/AppContext.jsx` | `toggleActivityCompletion` |

---

*Bu rehber, projedeki tüm sistemlerin tek referans noktasıdır. Kod değişikliği yapmadan önce ilgili bölümü okuyun; arama yapmadan dosya yolunu ve sorumluluğu buradan bulabilirsiniz.*

---

## 28. SEO Canlı Denetim (2026-06-23)

Agent tarafından Vercel CLI + canlı URL testleri ile doğrulandı.

### Vercel ortam değişkenleri (`npx vercel env ls`)

| Değişken | Ortamlar | SEO |
|----------|----------|-----|
| `VITE_SITE_URL` | Production, Preview, Development | ✅ |
| `APP_URL` | Production, Preview, Development | ✅ |
| `VITE_SUPABASE_URL` | Preview, Production | Sitemap dinamik URL için |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Preview, Production | Sitemap anon okuma |

### Canlı URL testleri

| URL | HTTP | Sonuç |
|-----|------|-------|
| `https://www.yeniform.com/sitemap.xml` | 200 | 15 URL, canonical `www` |
| `https://www.yeniform.com/robots.txt` | 200 | Sitemap satırı doğru |
| `https://www.yeniform.com/og-image.png` | 200 | PNG ~200 KB |
| `https://yeniform.com/` | 308 | → `www` |

### Yerel env (`.env.local`)

```
VITE_SITE_URL=https://www.yeniform.com
APP_URL=https://www.yeniform.com
```

Diğer değişkenler (Supabase, Telegram, Gemini, Daily) SEO dışı — mevcut ve çalışıyor.

### Bu oturumda yapılan kod düzeltmeleri

- `public/og-image.png` repoya eklendi (önceden yalnızca canlıda vardı)
- `scripts/generate-og-image.mjs` — `favicon.svg` yedek logo kaynağı
- `docs/setup/SEO_SETUP.md`, `YAPILACAKLAR.md`, §24 güncellendi

### Kullanıcıdan beklenen

1. OG Facebook/LinkedIn debugger (manuel)
2. GA4 ID (`G-…`)
3. Sosyal medya URL'leri
4. (Opsiyonel) `public/brand-logo-alt.png` güncelle → `npm run og:image`

---

## 29. Marka Görselleri & Logo Entegrasyonu (2026-06-23)

### Dosya rolleri (hangisi nerede kullanılır)

| Dosya | Boyut / tür | Kullanım yeri | SEO? |
|-------|-------------|---------------|:----:|
| `public/brand-logo-alt.png` | Kaynak PNG | Siz düzenlersiniz; script girdisi | ❌ |
| `public/brand-logo.png` | Yatay logo | `BrandLogo.jsx`, navbar, giriş, kayıt, paneller | JSON-LD logo |
| `public/brand-mark.png` | İkon karesi | `site.webmanifest` | ❌ |
| `public/favicon-32.png` | 32×32 | `index.html` sekme ikonu | ❌ |
| `public/apple-touch-icon.png` | 180×180 | iOS ana ekran | ❌ |
| `public/og-image.png` | 1200×630 | `index.html` + `SeoHead` → `og:image`, Twitter Card | **✅** |

> **SEO için tek zorunlu görsel:** `og-image.png`. Diğerleri marka tutarlılığı içindir.

### Üretim komutu

```powershell
npm run og:image
```

Kaynak: `public/brand-logo-alt.png` → çıktılar: `brand-logo.png`, `brand-mark.png`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`

### Kod bağlantıları

| Dosya | Değişiklik |
|-------|------------|
| `src/config/brand.js` | `BRAND.assets` — logo, mark, ogImage yolları |
| `src/components/ui/BrandLogo.jsx` | `<img src={BRAND.assets.logo}>` — eski YF gradient kutusu kaldırıldı |
| `src/config/seo.js` | `ogImage` + Organization JSON-LD `logo` → `brand-logo.png` |
| `index.html` | `favicon-32.png`, `apple-touch-icon.png` |
| `public/site.webmanifest` | `brand-mark.png` ikonu |
| `scripts/generate-og-image.mjs` | Kaynak PNG'den tüm türevleri üretir |
| `scripts/brandAssets.mjs` | OG arka plan SVG (alt yazısız) |

### OG görsel tasarımı

- Gradient wellness arka plan + ortada beyaz kart
- Kart içinde yalnızca yatay logo (alt slogan yok)
- Paylaşım başlığı/açıklaması HTML meta etiketlerinden gelir

### Kullanıcıdan beklenen (detay: `docs/setup/SEO_SETUP.md` §9)

1. GA4 Measurement ID (`G-…`)
2. Sosyal medya URL'leri → `brand.js` → `socialUrls`
3. OG debugger testi (Facebook + LinkedIn)
4. Search Console sitemap “Başarılı” kontrolü
5. **Deploy** — logo + og-image değişiklikleri canlıya

---

## 30. Diyetisyen Listeleri, Takvim Öğün Onayı & Ödeme UI (2026-06-23)

### Diyetisyen paneli — “Programlar” → “Listeler”

| Değişiklik | Detay |
|------------|-------|
| Video kütüphanesi | Diyetisyenler `/staff/library` → otomatik `/staff/lists` (`StaffLibraryGate.jsx`) |
| Navigasyon | `StaffShell.jsx`: diyetisyen → Danışanlarım, **Listeler**, Ödeme; koç → Programlar, Kütüphane, Ödeme |
| Veri modeli | Değişmedi: `programs` tablosu, `type: 'nutrition'` — yalnızca UI “liste” dili |
| Oluşturma | `StaffClientsPage` + `NutritionProgramBuilder` — “Liste Oluştur”, “Beslenme Listesini Gönder” |
| Liste özeti | `StaffListsPage.jsx` — gönderilen beslenme listeleri |

### Üye takvimi — yan yana görünüm + öğün onayı

**Dosya:** `src/pages/CalendarPage.jsx`, `src/utils/programSchedule.js`, `src/context/AppContext.jsx`

- Gün paneli `max-w-5xl`, iki sütun: **Diyet Listesi** (sol) | **Koç Programı** (sağ)
- Beslenme: tek tek madde değil, **öğün bazlı** onay (`breakfast`, `lunch`, …)
- Tamamlanma anahtarı: `mealCompletionKey(dateStr, mealType)` → `completedActivities[dateStr]` dizisinde
- `toggleMealCompletion(dateStr, mealType, entryIds)` — öğün işaretlenince o öğündeki tüm entry ID’leri de işaretlenir
- Antrenman: hareket bazlı onay (önceki davranış)
- Antrenman satırında hareket açıklaması gösterilmez; **İzle** ile video aynı satırda açılır
- Gün ilerleme sayacı: `workout sayısı + öğün sayısı` (beslenme maddesi sayısı değil)

Yardımcılar (`programSchedule.js`):
- `groupEntriesByMeal`, `isMealCompleted`, `splitEntriesByType`, `mealCompletionKey`

### Admin — başarı hikâyeleri filtreleri

**Dosya:** `src/pages/admin/AdminContentPage.jsx`

- Başarı Hikâyeleri sekmesinde: **Tümü | Yayında | İncelemede**
- Sekmeye geçildiğinde bekleyen varsa varsayılan filtre “İncelemede”
- Her filtrede sayaç rozeti

### Ödeme yönetimi (mock frontend)

**Dosyalar:**
- `src/data/mockPayments.js` — kayıtlı kartlar, ödeme geçmişi, personel kazançları, admin özeti
- `src/pages/payments/PaymentManagementPage.jsx` — `audience`: `member` | `staff` | `admin`

| Panel | Rota | Bölümler |
|-------|------|----------|
| Üye | `/profile/payments` | Kayıtlı kartlarım, ödeme geçmişim |
| Koç / Diyetisyen | `/staff/payments` | Kazanç özeti, bekleyen ödemeler, işlem geçmişi |
| Admin | `/admin/payments` | Platform ödeme özeti, personel ödemeleri |

> Stripe entegrasyonu henüz yok; sayfa üstünde demo uyarısı. Gerçek ödeme §22 altyapısıyla sonra bağlanacak.

### Navigasyon güncellemeleri

- `Sidebar.jsx` + `AppShell.jsx`: Ödeme Yönetimi
- `StaffShell.jsx`: role göre menü
- `AdminShell.jsx`: Ödeme Yönetimi

### Sonraki adımlar (backend)

1. ~~`completedActivities` öğün anahtarlarının Supabase `members.data` ile senkronu~~ → §31
2. Stripe Checkout → gerçek kart kaydı ve ödeme geçmişi
3. Personel hakediş hesaplama API’si (seans / paket bazlı)

---

## 31. Öğün Senkronu, Öğün Grafiği & Kadro Başvuruları (2026-06-23)

### Öğün tamamlama — Supabase senkronu

- `completedActivities` ve `progress.meals` → `members.data` JSONB (`memberToRow` / `saveMemberPatch`)
- `toggleMealCompletion` → `patchCurrentRemote` → `upsertMember` (anında Supabase'e yazılır)
- `buildProgressPatch` artık `progress.meals` üretir (`buildMealProgress` — haftalık öğün tamamlama)
- `dayFullyComplete` öğün bazlı beslenmeyi dikkate alır (streak doğru hesaplanır)

### Üye paneli — ayrı öğün grafiği

**Dosya:** `DashboardPage.jsx`, `ProgressChart.jsx` (`MealChart`)

- Antrenman grafiğinden **ayrı** üçüncü kart: **Öğün Takibi**
- Haftalık planlanan vs tamamlanan öğün sayısı (bar chart)

### Kadro başvuru sistemi

**Migration:** `supabase/migrations/20260623_staff_applications.sql` (canlıya uygulandı)

| Tablo / RPC | Açıklama |
|-------------|----------|
| `staff_applications` | Koç/diyetisyen başvuruları (`status`: pending/approved/rejected) |
| `submit_staff_application()` | Herkese açık RPC (anon + authenticated) |

**Başvuru formu alanları (2026-06-26 güncellemesi):**

| Adım | Koç | Diyetisyen |
|------|-----|------------|
| **1 — Kişisel Bilgiler** | Ad, e-posta, telefon, cinsiyet, il/ilçe (dropdown), salon bilgisi, LinkedIn/Instagram/YouTube/web | Aynı |
| **2 — Uzmanlık** | 26 uzmanlık alanı, deneyim yılı, yetkin danışan grupları (5 kategori) | Uzmanlık, deneyim, mezuniyet bölümü, diploma/oda no |
| **3 — Eğitim & Sertifika** | Lise/önlisans/lisans + bölüm + GPA; **GSB federasyon antrenörlük belgesi** (federasyon + 1–5. kademe); uluslararası/branş sertifikaları + belge yükleme | Eğitim listesi + sertifika listesi |
| **4 — Çalışma Tercihleri** | Günler, saat dilimi (:00/:30), çalışma yaklaşımları, hizmet alanları, özet | Günler, saat dilimi, özet |

**Kaldırılan (koç):** ünvan, bio, birincil sertifika türü, adım 3 müsaitlik (4. adıma taşındı).

**Depolama:** `staff-application-docs` bucket — sertifika PDF/görsel yükleme (`uploadStaffApplicationDoc`).

**Migration:** `20260626_staff_application_docs_storage.sql`

**Önceki alan tablosu (arşiv):**

| Alan | Koç | Diyetisyen |
|------|:---:|:----------:|
| Ad, e-posta, telefon, şehir | ✓ | ✓ |
| Ünvan, uzmanlık alanları, deneyim yılı | ✓ | ✓ |
| Eğitim (min. 1), sertifikalar (min. 1) | ✓ | ✓ |
| Tanıtım metni (bio), LinkedIn | ✓ | ✓ |
| Müsaitlik (günler + saat) | ✓ | ✓ |
| Birincil sertifika türü (NASM, ACE…) | ✓ | — |
| Online koçluk deneyimi | ✓ | — |
| Mezuniyet bölümü | — | ✓ |
| Diploma / TDD oda kayıt no | — | ✓ |

**Rotalar:**
- `/team/apply?role=coach|dietitian` → `StaffApplicationPage.jsx`
- **Navbar → Kadromuz** menüsünün en altı: **Kadromuza Katıl** (`NavDropdown` `footer`, `btn-wellness` stili) — *liste sayfası altında değil*
- `/admin/applications` → `AdminApplicationsPage.jsx` → Kadro sekmesi (onay → `admin_upsert_staff`, geçici şifre modal)

**Dosyalar:** `src/data/staffApplication.js`, `submitStaffApplication`, `resolveStaffApplication` (`supabaseDb.js`)

---

## 32. Kurumsal Başvuru, Navbar & Proje Stabilizasyonu (2026-06-24)

### Navbar — Kadromuza Katıl konumu (düzeltme)

| Önceki | Güncel |
|--------|--------|
| `TeamListPage` altında büyük CTA kutusu | **Kaldırıldı** |
| — | `PublicLayout` → **Kadromuz** dropdown → en altta **Kadromuza Katıl** |
| — | Mobil menüde Kadromuz listesinin altında aynı buton |

**Dosyalar:** `PublicLayout.jsx`, `NavDropdown.jsx` (`footer` prop)

### Navbar — Kurumsal bölümü (yeni)

| Menü öğesi | Rota | Sayfa |
|------------|------|-------|
| Kurumsal Wellness | `/corporate` | `CorporatePage.jsx` |
| Kurumsal Başvuru | `/corporate/apply` | `CorporateApplicationPage.jsx` |

**Başvuru alanları:** şirket adı, yetkili, e-posta, telefon, şehir, sektör, çalışan sayısı aralığı, ilgilenilen hizmetler (çoklu), ihtiyaç metni, tercih edilen başlangıç tarihi.

**Dosyalar:** `src/data/corporateApplication.js`, `submitCorporateApplication`, `resolveCorporateApplication`

### Admin — Başvurular (birleşik panel)

**Rota:** `/admin/applications` → `AdminApplicationsPage.jsx`

| Sekme | Kaynak tablo | Admin aksiyonları |
|-------|--------------|-------------------|
| **Kadro** | `staff_applications` | Onayla (personel hesabı + geçici şifre), Reddet |
| **Kurumsal** | `corporate_applications` | İletişimde, Onayla, Reddet |
| **İletişim** | `contact_inquiries` | Okundu, Çözüldü |

`AppContext`: `staffApplications`, `corporateApplications`, `contactInquiries`, `resolveStaffApplication`, `resolveCorporateApplication`, `updateContactInquiryStatus`

### İletişim formu — Supabase senkronu

**Akış:** `ContactSection.jsx` → `contactForm.js` → **`submitContactInquiry` (Supabase, zorunlu)** → `/api/contact` (Telegram, ikincil)

**Tablo:** `contact_inquiries` (`status`: new | read | resolved)

### Veri katmanı denetimi & stabilizasyon

| Değişiklik | Detay |
|------------|-------|
| `localDb.js` | Diskten **silindi** — hiçbir import yoktu |
| `custom_foods` | Tablo + `supabaseDb` helper'ları **kaldırıldı** |
| Otomatik programlar | `memberHealthSync.js` → `staffId: null` (FK uyumu) |
| `createProgram` | `staffId === 'system'` → `null` normalize |
| `completedActivities` | `members.data` JSONB; öğün anahtarları `yyyy-MM-dd_meal_{type}` |
| `progress.meals` | Dashboard öğün grafiği; `buildMealProgress` ile haftalık |

### Supabase migration özeti (2026-06-23 — 2026-06-24)

| Migration | İçerik |
|-----------|--------|
| `20260623_staff_applications.sql` | `staff_applications` + `submit_staff_application` |
| `20260624_corporate_contact_cleanup.sql` | `corporate_applications`, `contact_inquiries`, RPC'ler, `custom_foods` DROP |

### Hâlâ mock / eksik (bilinçli)

| Özellik | Durum |
|---------|-------|
| Ödeme Yönetimi UI | Mock (`mockPayments.js`); Stripe sonraki aşama |
| Şifre sıfırlama | ✅ §34 — `ForgotPasswordPage` + `ResetPasswordPage` + `/auth/callback` |
| E-posta/telefon doğrulama | ✅ E-posta profilden (bağlantı); telefon şimdilik kapalı (`VITE_PHONE_VERIFY_ENABLED=false`) |
| Üyelik talepleri (üye UI) | API var, arayüz henüz yok |

### İlgili dosya envanteri (yeni)

| Dosya | Amaç |
|-------|------|
| `src/pages/CorporatePage.jsx` | Kurumsal tanıtım |
| `src/pages/CorporateApplicationPage.jsx` | Kurumsal başvuru formu |
| `src/pages/StaffApplicationPage.jsx` | Kadro başvuru formu (4 adım) |
| `src/pages/admin/AdminApplicationsPage.jsx` | 3 sekmeli başvuru yönetimi |
| `src/data/corporateApplication.js` | Kurumsal form şeması + validasyon |
| `src/data/staffApplication.js` | Kadro form şeması + validasyon |
| `src/data/mockPayments.js` | Ödeme demo verisi |
| `src/pages/payments/PaymentManagementPage.jsx` | Üye/staff/admin ödeme UI |
| `src/components/staff/StaffLibraryGate.jsx` | Diyetisyen → `/staff/lists` redirect |
| `src/pages/staff/StaffListsPage.jsx` | Diyetisyen beslenme listeleri |
| `src/utils/memberProgress.js` | Streak, workout + **meal** progress |
| `src/components/dashboard/ProgressChart.jsx` | `WeightChart`, `WorkoutChart`, `MealChart` |

### Sonraki adımlar

1. Stripe → `PaymentManagementPage` gerçek `payments` tablosu
2. ~~`ForgotPasswordPage` → `supabase.auth.resetPasswordForEmail`~~ ✅ §34
3. Üye panelinde `membership_requests` oluşturma UI (dondur/iptal)
4. ~~`setup.sql` birleştirme~~ ✅ (2026-06-24)
5. **Twilio SMS** → §34.5 (telefon şimdilik kapalı; Twilio hazır olunca `VITE_PHONE_VERIFY_ENABLED=true`)

---

## 33. Navbar Sadeleştirme & setup.sql Senkronu (2026-06-24)

### setup.sql

Migration içeriği `setup.sql`'e birleştirildi:

| Değişiklik | Detay |
|------------|-------|
| **Eklendi** | `staff_applications`, `corporate_applications`, `contact_inquiries` tabloları + RLS |
| **Eklendi** | `submit_staff_application`, `submit_corporate_application`, `submit_contact_inquiry` RPC |
| **Kaldırıldı** | `custom_foods` tablosu, RLS politikaları, `increment_food_usage` RPC |

Yeni kurulum: yalnızca `supabase/setup.sql` çalıştırılır; migration dosyaları artımlı güncelleme içindir.

### Navbar — önce / sonra

| Önce (6 üst öğe + 3 dropdown) | Sonra (4 üst öğe + 1 dropdown) |
|-------------------------------|--------------------------------|
| Ana Sayfa | *(logo)* |
| Üyelikler | Üyelikler |
| Bize Ulaşın | *(footer + landing)* |
| Keşfet ▼ (Blog, Hikayeler) | Blog *(doğrudan)* |
| Kadromuz ▼ | Kadromuz ▼ |
| Kurumsal ▼ (2 link) | Kurumsal *(doğrudan → `/corporate`)* |

### İsteğe bağlı daha fazla sadeleştirme (henüz uygulanmadı)

| Öğe | Öneri | Risk |
|-----|-------|------|
| **Doktorlar** ayrı liste | Koç/Diyetisyen ile tek `/team` hub + sekmeler | Kadro sayfaları refactor |
| **PromoBanner** | Kampanya bitince kaldır veya yalnız ana sayfada göster | Dönüşüm düşebilir |
| **Destek** (üye nav) | Zaten panel sidebar'da var; public nav'den kaldırılabilir | Üye landing'deyken destek erişimi zorlaşır |
| **Kurumsal** | B2B düşük trafikse footer'a taşınabilir | Kurumsal görünürlük azalır |
| **Kadromuz dropdown** | Tek `/team` sayfası + filtre; nav'den dropdown kaldır | 3 ayrı SEO sayfası birleşir |

**Dosya:** `src/components/layout/PublicLayout.jsx`

---

## 34. Auth Doğrulama, Şifre Sıfırlama & Ortam Kurulumu (2026-06-24)

### 34.1 Özet — ne değişti?

| Özellik | Önceki | Güncel |
|---------|--------|--------|
| Kayıt + e-posta onayı | Confirm email açıksa kayıt yarım kalıyordu | Kayıt tamamlanır; doğrulama **profilden isteğe bağlı** |
| Şifre sıfırlama | Kod vardı, PKCE/redirect eksikti | `/forgot-password` → e-posta → `/auth/callback` → `/reset-password` |
| E-posta doğrulama | Yok / çalışmıyordu | Profil → **bağlantı** gönder → tıkla → sonuç ekranı → **Durumu Yenile** |
| Telefon doğrulama | SMS denemesi 500 veriyordu | **Şimdilik kapalı** (`VITE_PHONE_VERIFY_ENABLED=false`); Twilio hazır olunca açılacak |
| Auth callback hatası | "Geçersiz bağlantı" + login yönlendirme | Başarı / yönlendirme ekranı; Hotmail prefetch için nazik mesaj |
| Router hatası | `Link` router dışında kalabiliyordu | `BrowserRouter` en dış katmana alındı (`App.jsx`) |
| Vercel production | Eski build | ✅ `VITE_PHONE_VERIFY_ENABLED=false` + redeploy (2026-06-24) |

**Tasarım ilkesi:** Kayıt anında e-posta/telefon **zorunlu değil** — kullanıcı önce üye olur, sonra `/profile` → **Hesap Doğrulama** kartından isterse e-postasını onaylar.

**Supabase e-posta şablonu notu:** Varsayılan Magic Link şablonu `{{ .ConfirmationURL }}` kullanır → e-postada **6 haneli kod değil bağlantı** gelir. Kod istenirse Dashboard → Email Templates → Magic Link içine `{{ .Token }}` eklenmeli (opsiyonel).

### 34.2 Akış diyagramları

**Kayıt (onboarding):**
```
signUp → oturum yoksa → POST /api/auth-unlock-signup (service role)
      → signInWithPassword → buildAndPersistMember
      → members.data.emailVerifiedAt / phoneVerifiedAt = null
```

**Şifre sıfırlama:**
```
/forgot-password → POST /api/auth { action: password-reset, email }
→ Sunucu APP_URL ile redirect: /auth/callback?next=reset-password
→ Supabase Recovery e-postası (token_hash şablonu — §46)
→ /auth/callback?token_hash=…&type=recovery&next=reset-password
→ verifyOtp(token_hash, type: recovery) → oturum
→ /reset-password → updateUser({ password }) → signOut → /login
```

**Profil — e-posta doğrulama (güncel 2026-06-24, sunucu API):**
```
Profil → Doğrulama Bağlantısı Gönder → POST /api/auth { action: email-send }
→ Sunucu APP_URL ile redirect üretir (localhost değil): /auth/callback?verify=email&evt=…
→ members.data.pendingEmailVerification jetonu kaydedilir
→ Supabase magic link e-postası gönderilir
→ AuthRedirectHandler: /?code=… veya #error=… → /auth/callback?verify=email&…
→ AuthCallbackPage:
   • evt varsa → POST /api/auth { action: email-confirm, evt }
   • otp_expired + evt → yine evt ile doğrulama (e-posta önizleme tüketse bile)
   • code varsa → exchangeCodeForSession + evt/markEmailVerified
→ "Panele Git" → reloadRemote() → /dashboard
```

**Gerekli env (Vercel):** `APP_URL=https://www.yeniform.com` (veya `VITE_SITE_URL`)

**Supabase Auth → Redirect URLs:** `https://www.yeniform.com/auth/callback`, `https://www.yeniform.com/**`, yerel geliştirme için `http://localhost:3000/auth/callback`

**Önemli:** `api/auth-unlock-signup.js` kayıtta `email_confirm: true` yapar (giriş için).
Profil doğrulaması ayrı takip edilir: `members.data.emailVerifiedAt`.

**Profil — telefon doğrulama (şimdilik kapalı):**
```
VITE_PHONE_VERIFY_ENABLED=false → VerificationSection telefon kartını göstermez
Twilio hazır olunca:
  VITE_PHONE_VERIFY_ENABLED=true
  updateUser({ phone }) → SMS OTP → verifyOtp(type: 'phone_change')
  (signInWithOtp({ phone }) KULLANILMAZ — members.email NOT NULL trigger ile 500 verir)
```

### 34.3 Yeni / güncellenen dosyalar

| Dosya | Görev |
|-------|-------|
| `api/auth.js` | Birleşik auth: unlock-signup, email-send, email-confirm, **password-reset** |
| `api/_appUrl.js` | Sunucu tarafı kanonik site URL (`APP_URL`) |
| `src/services/authVerification.js` | API üzerinden bağlantı gönder, `confirmEmailVerificationByEvt` |
| `src/components/profile/VerificationSection.jsx` | E-posta UI; telefon `VITE_PHONE_VERIFY_ENABLED` ile gizli |
| `src/components/auth/AuthRedirectHandler.jsx` | `/?code=` / `#error=` → `/auth/callback` yönlendirme |
| `src/pages/auth/AuthCallbackPage.jsx` | evt + PKCE doğrulama, hata/otp_expired UI |
| `src/pages/auth/ResetPasswordPage.jsx` | PKCE oturum bekleme + yeni şifre |
| `src/pages/auth/ForgotPasswordPage.jsx` | Sunucu API ile sıfırlama e-postası (`password-reset`) |
| `src/services/authSessionFromUrl.js` | PKCE code + token_hash oturum kurulumu |
| `src/services/supabaseDb.js` | `ensureAuthForSignup`, `patchMemberVerification`, `emailVerifiedAt` |
| `src/context/AppContext.jsx` | `verificationStatus`, `refreshVerification` |
| `src/App.jsx` | `BrowserRouter` dış sarmalayıcı; `/auth/callback` rotası |
| `.env.local` | Yerel Supabase + service role (gitignore) |

**members.data JSONB (yeni alanlar):**
- `emailVerifiedAt` — ISO string veya `null`
- `pendingEmailVerification` — `{ token, expiresAt, email }` (doğrulama bağlantısı beklerken)
- `phoneVerifiedAt` — ISO string veya `null`
- `pendingPhoneVerify` — telefon e-posta yedeği beklerken geçici (telefon açılınca)

### 34.4 Ortam kurulumu — tamamlandı (2026-06-24)

| Alan | Durum | Not |
|------|--------|-----|
| `.env.local` (yerel) | ✅ | `VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_PHONE_VERIFY_ENABLED=false` |
| Vercel Production / Preview / Development | ✅ | `VITE_PHONE_VERIFY_ENABLED=false` eklendi + **production deploy** |
| Vercel Supabase istemci | ✅ | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Supabase Auth redirect URL'leri | ✅ | `/auth/callback`, `/reset-password` (localhost + www.yeniform.com) |
| Kayıt unlock API | ✅ | `api/auth-unlock-signup.js` + service role |
| Şifre sıfırlama | ✅ | PKCE + `/auth/callback` |
| E-posta doğrulama | ✅ | Bağlantı + sonuç ekranı + Durumu Yenile |
| Telefon doğrulama | ⏸ Kapalı | `VITE_PHONE_VERIFY_ENABLED=false` (UI + Vercel) |
| **Twilio SMS** | ⏳ Sonra | Telefon yeniden açılınca §34.5 |

**Supabase proje:** Yeni Form · ref `rvzksmyhsgxgrxgeabmi` · URL `https://rvzksmyhsgxgrxgeabmi.supabase.co`  
**Canlı site:** https://www.yeniform.com (deploy: 2026-06-24)

### 34.5 Telefon SMS (Twilio) — telefon yeniden açılınca

Telefon doğrulama şu an **kapalı**. Twilio tam kurulunca:

#### A) Twilio Console (twilio.com/console)

| # | Nerede | Ne alınır |
|---|--------|-----------|
| 1 | Ana sayfa / Account Info | **Account SID** (`AC...`) |
| 2 | Ana sayfa / Account Info | **Auth Token** → Show → kopyala |
| 3 | **Phone Numbers** → Buy a number | SMS destekli numara (trial'da test için yeterli) |
| 4 | *(Önerilen)* **Messaging** → **Services** → Create | **Messaging Service SID** (`MG...`) |

> Trial hesapta SMS yalnızca **Verified Caller IDs** listesindeki numaralara gider.

#### B) Supabase — Phone provider

1. [Authentication → Providers → Phone](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers)
2. **Enable Phone provider** → SMS provider: **Twilio**
3. **Account SID**, **Auth Token**, **Message Service SID** → **Save**

#### C) Uygulama env — telefonu aç

`.env.local` ve Vercel (Production + Preview + Development):
```
VITE_PHONE_VERIFY_ENABLED=true
VITE_PHONE_VERIFY_VIA_EMAIL=false
```
Yerel: `npm run dev` yeniden başlatın. Vercel: **Redeploy**.

#### D) Test

Profil → Hesap Doğrulama → telefon → **SMS Kodu Gönder** → kodu gir → **Onayla**

| Sorun | Çözüm |
|-------|--------|
| SMS gelmiyor (trial) | Twilio → Verified Caller IDs → kendi numaranızı doğrulayın |
| 500 Database error | `signInWithOtp({phone})` kullanmayın; kod `updateUser` + `phone_change` kullanır |
| Telefon kartı görünmüyor | `VITE_PHONE_VERIFY_ENABLED=true` + redeploy |

> Twilio Auth Token yalnızca Supabase Dashboard'a girilir; repoya veya `VITE_` env'e konmaz.

### 34.6 AppContext aksiyonları (doğrulama)

`useApp()` ile:
- `verificationStatus` — `{ emailVerified, phoneVerified, email, phone }`
- `sendEmailVerification`, `confirmEmailVerification` (opsiyonel kod girişi)
- `refreshVerification` — bağlantı sonrası profilde **Durumu Yenile**
- `sendPhoneVerification`, `confirmPhoneVerification` — telefon açıkken

### 34.7 Değiştirilen dosyalar (§34)

- `api/auth-unlock-signup.js` (yeni)
- `src/services/authVerification.js` (yeni)
- `src/components/profile/VerificationSection.jsx` (yeni)
- `src/pages/auth/AuthCallbackPage.jsx` (yeni — sonuç ekranı)
- `src/pages/auth/ResetPasswordPage.jsx`, `ForgotPasswordPage.jsx`
- `src/services/supabaseDb.js`, `src/context/AppContext.jsx`, `src/pages/ProfilePage.jsx`
- `src/App.jsx`, `.env.local`, `.env.example`
- Vercel env: `VITE_PHONE_VERIFY_ENABLED=false` (Production / Preview / Development) + production deploy

---

## 35. Stabilizasyon & Temizlik (2026-06-24)

> Bütün proje denetimi: e-posta doğrulama UI bug'ı, çalışma-zamanı hataları, kullanılmayan dosya/foto temizliği ve git deposu sağlığı.

### 35.1 E-posta doğrulama callback "doğrulanıyor" takılması — **düzeltildi**

**Sorun:** `AuthCallbackPage.jsx`'te `finish()` fonksiyonunun `try/catch`'i yoktu ve `setPhase('success')` çağrısı `reloadRemote()`'tan **sonra** geliyordu. `reloadRemote()` yavaşlar/hata verirse ekran sonsuza dek "E-postanız doğrulanıyor…" ekranında kalıyordu.

**Çözüm (`src/pages/auth/AuthCallbackPage.jsx`):**
- `markSuccess(session)` yardımcısı eklendi → doğrulama başarılı olur olmaz UI **hemen** "success" durumuna geçer, `reloadRemote()` arka planda (UI'ı bloklamadan) çalışır.
- `evt` jetonu artık en öncelikli ve en güvenilir yol; başarılıysa `establishSession().catch(() => null)` ile oturum best-effort kurulur.
- `finish().catch(...)` ile sarıldı → beklenmeyen hatada ekran **asla** "doğrulanıyor"da kalmaz, "error" durumuna düşer.

### 35.2 Çalışma-zamanı / Hooks hataları — **düzeltildi**

| Dosya | Sorun | Çözüm |
|-------|-------|-------|
| `src/pages/admin/AdminSessionsPage.jsx` | `paidPlans is not defined` (sayfayı çökerten `no-undef`) | `isPaidMembership(m.membership)` kullanıldı |
| `src/pages/TeamListPage.jsx` | `useMemo` koşullu erken `return`'ten sonra çağrılıyordu (Rules of Hooks ihlali → render çökmesi riski) | Tüm `useMemo` hook'ları koşulsuz hale getirildi, erken `return` aşağıya alındı |

### 35.3 Kullanılmayan kod temizliği (orphan dosyalar)

**Silinen orphan `.jsx`/`.js` (hiçbir yerden import edilmiyordu):**
- Sayfa/paket: `pages/PackageBuilderPage.jsx`, `components/package/PackageBuilder.jsx`, `components/package/PackageSummaryCard.jsx`, `components/ui/NumberSelector.jsx` (`/builder` zaten `/membership`'e yönleniyor)
- Landing: `components/landing/TeamSection.jsx`, `components/landing/TeamCarousel.jsx`
- UI/Layout: `components/calendar/CalendarView.jsx`, `components/layout/MobileNav.jsx`, `components/ui/ToggleGroup.jsx`, `components/ui/RangeSelector.jsx`, `components/ui/Skeleton.jsx`
- Hook: `hooks/useLocalStorage.js`
- Servis (aktif `calorieChat.js` + `aiVision.js` ile değişen eski sürümler): `services/foodParser.js`, `services/aiFoodEstimate.js`, `services/aiNutrition.js`, `services/supportSessions.js`
- Data: `data/exerciseTaxonomy.js`

**Silinen orphan API endpoint'leri** (frontend artık çağırmıyor; Vercel fonksiyon sayısı 12 → 10, Hobby limiti altında pay açıldı):
- `api/ai-food-estimate.js`, `api/ai-nutrition.js`

**Korunanlar (yanlış pozitif değil — hâlâ kullanımda):**
- `services/packagePricing.js` → `supabaseDb.js` + `platformStats.js`
- `components/package/SupportScheduler.jsx` → `weekdayLabel`/`WEEKDAYS`/`DEFAULT_SUPPORT_SCHEDULE` staff sayfalarında
- `api/_ai-prompts.js`, `api/_gemini.js` → `ai-food-vision.js` + `ai-food-text.js`

### 35.4 Kullanılmayan görsel/asset temizliği

| Silinen | Neden |
|---------|-------|
| `public/Ekran görüntüsü 2026-06-23 192931.png` | Geçici ekran görüntüsü, referans yok |
| `public/logo-icon.png` (185 KB) | Referans yok |
| `public/favicon-192.png` (45 KB) | Referans yok (manifest `brand-mark` + `apple-touch`, `index.html` `favicon-32` kullanıyor) |
| `public/og-image.svg` | OG görseli artık programatik (`scripts/brandAssets.mjs` → `og-image.png`) üretiliyor |
| `public/icons.svg` | Referans yok |
| `src/assets/react.svg`, `src/assets/vite.svg` | Vite şablon kalıntısı |
| `src/assets/hero.png` | `public/hero-bg.png` kullanılıyor |

**Korunan kritik görseller:** `brand-logo.png`, `brand-mark.png`, `og-image.png`, `favicon-32.png`, `apple-touch-icon.png`, `brand-logo-alt.png` (og kaynağı), tüm `*-bg.{png,jpg}` (landing arka planları). `favicon.svg` tarayıcı yedeği olarak bırakıldı.

### 35.5 Git deposu sağlığı — **kritik**

`node_modules/` (17.975 dosya) ve `dist/` (8 dosya) `.gitignore`'da olmasına rağmen git'e commit edilmişti (depo izlenen dosyalarının ~%98'i).

- `git rm -r --cached node_modules dist` → yerel dosyalar **silinmedi**, yalnızca git takibinden çıkarıldı.
- İzlenen dosya sayısı **18.260 → 277**.

### 35.6 Lint temizliği

- Tüm `no-unused-vars`, `no-undef`, `react-hooks/rules-of-hooks` hataları **sıfırlandı** (kullanılmayan import'lar, ölü değişkenler, `handleQuickAction`, legacy `ProgramSection` vb. temizlendi).
- Kalanlar yalnızca stilistik en-iyi-uygulama uyarıları (`set-state-in-effect`, `react-refresh/only-export-components`) — çalışmayı etkilemez, davranış değiştirmemek için dokunulmadı.

### 35.7 Veritabanı / Supabase denetimi

- **18 tablo** aktif ve kod ile eşleşiyor: `members`, `staff`, `programs`, `posts`, `tickets`, `activities`, `payments`, `site_content`, `exercises`, `plans`, `user_presence`, `staff_applications`, `corporate_applications`, `contact_inquiries`, `chat_threads`, `chat_messages`, `admin_staff_threads`, `admin_staff_messages`. (`membership_requests` kaldırıldı — §36.3)
- `plans` tablosu doğrulandı: aktif paketler `free, eko, diyet, spor, kurucu, vip`; eskiler `gumus, altin, platinum` `is_active=false`.
- `localStorage` kullanımlarının tümü yerinde (FAB konumu, tutorial/banner dismiss, remember-me) — DB'ye taşınması gereken veri yok.
- Güvenlik advisor uyarıları (`get_advisors`): çoğu kasıtlı public `SECURITY DEFINER` RPC (`submit_*`, `phone_in_use`). **Aksiyon önerisi:** Supabase Dashboard → Auth → "Leaked password protection"ı açın (kod gerektirmez).

### 35.8 Bilinçli placeholder (kopuk bağlantı değil)

`src/pages/payments/PaymentManagementPage.jsx` (member/staff/admin `*/payments` rotaları) `data/mockPayments.js` ile çalışır. Sayfanın üstünde net **"mock (demo) veri — gerçek Stripe entegrasyonu sonraki aşamada"** banner'ı vardır; alt başlıklarda "(demo veri)" yazar. Gerçek `payments` tablosu admin istatistiklerinde kullanılır. Kayıtlı kartlar (Stripe) ve personel hakedişi için gerçek veri kaynağı henüz yok → planlı gelecek işi.

### 35.9 Değiştirilen/Silinen dosyalar (§35)

**Düzeltildi:** `src/pages/auth/AuthCallbackPage.jsx`, `src/pages/admin/AdminSessionsPage.jsx`, `src/pages/TeamListPage.jsx`, `src/pages/CalendarPage.jsx`, `src/pages/SupportPage.jsx`, `src/pages/admin/AdminContentPage.jsx`, `src/services/aiAnalysis.js`, `src/components/dashboard/DraggableHealthFab.jsx`, `api/_gemini.js` + 5 sayfada kullanılmayan import temizliği.

**Silindi (18 kod + 7 asset + 2 API = 27 dosya):** §35.3 ve §35.4 listeleri.

**Git:** `node_modules/`, `dist/` takibi kaldırıldı.

---

## 36. Paket Bazlı Atama, Güvenlik, Yasal Sayfalar & Sayfa Envanteri (2026-06-25)

> Bu bölüm 2026-06-25 tarihli tüm önemli değişiklikleri ve AI'ın projeyi hızlı anlaması için sayfa envanterini içerir.

### 36.1 Paket bazlı koç / diyetisyen ataması — **yeni sistem**

**İş kuralı:** Müşterinin ödediği pakette hangi görüşme türü varsa admin panelinde yalnızca o atama alanı açılır. Paket değişince paket dışı atamalar ve randevular otomatik temizlenir.

#### Merkezi yardımcılar (`src/data/membershipPlans.js`)

| Fonksiyon | Ne yapar |
|-----------|----------|
| `packageIncludesCoach(pkg)` | `coachMeetingsPerMonth` veya `coachMeetingsPerWeek` > 0 |
| `packageIncludesDietitian(pkg)` | `dietitianMeetingsPerMonth` > 0 |
| `getCoachMeetingsPerMonth(pkg)` | Aylık koç limiti (haftalık × 4 fallback) |
| `memberNeedsStaffAssignment(member)` | Pakete göre eksik koç veya diyetisyen ataması var mı |
| `sanitizeStaffForPackage(pkg, data)` | Paket dışı `assignedCoachId`, `assignedDietitianId`, `coachSessions`, `dietitianSessions` → null/[] |

#### Plan → görüşme eşlemesi (`PACKAGE_BY_PLAN`)

| planId | coachMeetingsPerMonth | dietitianMeetingsPerMonth |
|--------|----------------------|---------------------------|
| `eko` | 0 | 0 |
| `diyet` | 0 | 2 |
| `spor` | 2 | 0 |
| `kurucu` | 2 | 2 |
| `vip` | 2 | 2 |

Legacy planlar (`gumus`, `altin`, `platinum`, `premium`) `coachMeetingsPerWeek` de kullanabilir — `packageIncludesCoach` her iki alanı da okur.

#### Etkilenen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/admin/AdminPremiumPage.jsx` | Atama dropdown'ları ve kart sütunları pakete göre; "Atama eksik" filtresi `memberNeedsStaffAssignment` |
| `src/components/admin/ManualSessionEditor.jsx` | Koç bölümü `coachMeetingsPerMonth` desteği; pakette görüşme yoksa bilgi mesajı |
| `src/pages/admin/AdminMembersPage.jsx` | Üye detayında koç/diyetisyen satırları pakete göre |
| `src/services/staffAssignment.js` | Paket dışı rol atamasını null yapar; seansları filtreler |
| `src/services/supabaseDb.js` | `changeMemberPlan`, `processPremiumPayment` → `sanitizeStaffForPackage` |
| `api/stripe-webhook.js` | Ödeme sonrası aktivasyonda inline `sanitizeStaffForPackage` |
| `src/services/platformStats.js` | `unassignedPremium` → `memberNeedsStaffAssignment` |
| `src/pages/staff/StaffOverviewPage.jsx` | `getStaffClients` → `packageIncludesCoach/Dietitian` |

#### Admin Premium akışı (`/admin/premium`)

1. Üye kartı: yalnızca paketteki roller için Koç/Diyetisyen sütunu gösterilir.
2. Düzenleme modalı:
   - **Spor** → "Koç Ataması" bölümü + koç randevuları
   - **Diyet** → "Diyetisyen Ataması" bölümü + diyetisyen randevuları
   - **Kurucu/VIP** → "Koç & Diyetisyen" + her iki randevu editörü
   - **Eko** → atama bölümü yok; randevu editöründe "birebir görüşme yok" mesajı
3. Kaydet → `adminUpdatePremium` → `applyStaffAssignments` → Supabase `members`

---

### 36.2 API güvenlik guard'ları

**Amaç:** Hassas API endpoint'lerinin anonim çağrılmasını engellemek.

| Dosya | Rol |
|-------|-----|
| `api/_guards.js` | `requireAuth`, `requireAdmin`, `requireNotifySecret`, CORS |
| `api/_apiAuth.js` | `Authorization: Bearer` → Supabase JWT doğrulama |
| `src/services/apiAuth.js` | İstemci: `getApiAuthHeaders()` |

**Korumalı endpoint'ler:**

| Endpoint | Guard |
|----------|-------|
| `ai-food-text.js` | `requireAuth` |
| `ai-food-vision.js` | `requireAuth` |
| `daily-room.js` | `requireAuth` |
| `calorie-chat-notify.js` | `requireAuth` + `requireNotifySecret` |
| `telegram-notify.js`, `contact.js` | `requireNotifySecret` (production'da `TELEGRAM_NOTIFY_SECRET` zorunlu) |

---

### 36.3 Supabase güvenlik ve şema migrasyonları (2026-06-25)

| Migration | Özet |
|-----------|------|
| `20260625_security_guards.sql` | `is_admin()` e-posta VEYA `members.role=admin`; activities insert RLS; `increment_food_usage` kaldırıldı |
| `20260625_fix_is_admin_rls_recursion.sql` | `is_admin()` RLS sonsuz döngü düzeltmesi |
| `20260625_audit_rls_plans_cleanup.sql` | `staff_manages_member()`; programs RLS yalnızca atanan danışanlar; **`membership_requests` tablosu drop**; staff_applications doğrudan insert kapatıldı (yalnızca RPC) |
| `20260625_remove_demo_faqs_membership_freeze.sql` | Demo FAQ silindi; `paused`/`cancelled` üyelik statüleri `active`'e çekildi |
| `20260625_clean_demo_content_expand_blogs.sql` | Demo testimonial ve örnek başarı hikâyeleri silindi; blog içerikleri 800+ karakter |
| `20260625_storage_listing_guard.sql` | Storage bucket listeleme kısıtı |

**Kaldırılan özellikler:** Üyelik dondurma/iptal talepleri (`membership_requests`), demo SSS içerikleri.

---

### 36.4 Yasal sayfalar ve çerez onayı

| Rota | Dosya | İçerik kaynağı |
|------|-------|----------------|
| `/kvkk` | `src/pages/legal/LegalDocumentPage.jsx` | `src/data/legalDocuments.js` → `LEGAL_DOCUMENTS.kvkk` |
| `/privacy` | aynı | `LEGAL_DOCUMENTS.privacy` |
| `/terms` | aynı | `LEGAL_DOCUMENTS.terms` |

`LegalDocumentPage` slug prop veya URL'den doküman seçer; `SeoHead` ile meta etiketleri ayarlar.

**Çerez banner:** `src/components/ui/ConsentBanner.jsx` — `PublicLayout` içinde; KVKK/gizlilik linkleri.

---

### 36.5 Yeni bileşen: MemberHealthInsights

**Dosya:** `src/components/member/MemberHealthInsights.jsx`  
**Kullanım:** `AdminMembersPage.jsx` üye detay modalında; `StaffClientsPage.jsx` danışan özet modalında (`showHealthAnalysis={false}`)

**Props:** `showLocation`, `compact`, **`showHealthAnalysis`** (varsayılan `true`)

Gösterir: (opsiyonel) VKİ / form skoru / önerilen kalori / koç-diyetisyen öneri metinleri (`healthAnalysis` — **yalnızca `showHealthAnalysis=true` iken**), sağlık testi bölümleri, hedefler, beslenme tercihleri, konum.

**Personel paneli kuralı:** Koç, diyetisyen ve doktor arayüzlerinde otomatik sağlık analizi (`members.data.healthAnalysis`) **gösterilmez**. Personel yalnızca ham test cevapları + kendi klinik notlarını (`healthStaffNotes`) görür. Analiz üretimi üye tarafında (`syncMemberHealthAssets`, dashboard) devam eder.

**İlgili dosyalar:**
| Dosya | Rol |
|-------|-----|
| `src/pages/shared/MemberHealthProfilePage.jsx` | Admin + personel ortak sayfa |
| `src/components/member/MemberHealthProfilePanel.jsx` | Test cevapları, profil özeti, not paneli |
| `src/components/member/HealthStaffNotesPanel.jsx` | Kalıcı klinik notlar (`members.data.healthStaffNotes[]`) |
| `src/data/healthStaffNotes.js` | Not yardımcıları |

---

### 36.6 Personel paneli — danışan filtreleme

`src/pages/staff/StaffOverviewPage.jsx` → `getStaffClients(members, role, staffId)`:

- Koç rolü: yalnızca `packageIncludesCoach` olan ve `assignedCoachId === staffId` üyeler
- Diyetisyen: yalnızca `packageIncludesDietitian` olan ve `assignedDietitianId === staffId` üyeler

Böylece spor paketli üye diyetisyen listesinde, diyet paketli üye koç listesinde görünmez.

---

### 36.7 Değiştirilen / eklenen dosyalar (§36 özeti)

**Yeni:** `src/data/legalDocuments.js`, `src/pages/legal/LegalDocumentPage.jsx`, `src/components/member/MemberHealthInsights.jsx`, `api/_guards.js`, `api/_apiAuth.js`, `src/services/apiAuth.js`, `supabase/migrations/20260625_*.sql` (6 dosya)

**Güncellenen:** `AdminPremiumPage.jsx`, `AdminMembersPage.jsx`, `ManualSessionEditor.jsx`, `membershipPlans.js`, `staffAssignment.js`, `supabaseDb.js`, `stripe-webhook.js`, `platformStats.js`, `StaffOverviewPage.jsx`, `App.jsx`, `PublicLayout.jsx`, `ConsentBanner.jsx`, çeşitli API route'ları

**Silinen:** `src/pages/admin/AdminRequestsPage.jsx` (üyelik talepleri UI)

---

### 36.8 Sayfa Envanteri (AI için detaylı)

Aşağıdaki tablolar bir yapay zekanın "X özelliği nerede?" sorusuna doğrudan cevap vermesi içindir. Her sayfa: **rota → dosya → layout → veri kaynağı → ana UI blokları**.

#### A) Public sayfalar (`PublicLayout` — header, footer, PromoBanner, ConsentBanner)

| Rota | Dosya | Ana bölümler / bileşenler | Veri |
|------|-------|----------------------------|------|
| `/` | `LandingPage.jsx` | Hero, fiyat kartları (`PricingCard`), TrustStrip, WhyUs, SSS (`FAQAccordion`), yorumlar, kadro önizleme, **Son Yazılarımız** (`LatestBlogPosts`), iletişim (`ContactSection`), canlı sayaç (`LiveActiveCounter`) | `useApp().platform.plans`, `site_content`, `usePlatformDisplayStats`, `posts` |
| `/membership` | `MembershipComparisonPage.jsx` | Plan karşılaştırma tablosu, süre seçimi (1/3/6 ay), Stripe/checkout CTA | `plans` tablosu + `membershipPlans.js` fallback |
| `/onboarding` | `OnboardingPage.jsx` | Çok adımlı kayıt: profil, sağlık testi (`HealthTestStep`), plan seçimi, ödeme | `register`, `registerWithPlan`, `processPremiumPayment` |
| `/login` | `auth/LoginPage.jsx` | E-posta/şifre giriş, rol yönlendirme | `supabaseDb.login` |
| `/forgot-password` | `auth/ForgotPasswordPage.jsx` | Şifre sıfırlama e-postası | Supabase Auth |
| `/reset-password` | `auth/ResetPasswordPage.jsx` | Yeni şifre belirleme | Supabase Auth PKCE |
| `/auth/callback` | `auth/AuthCallbackPage.jsx` | E-posta doğrulama / OAuth callback sonuç ekranı | `establishSession`, `reloadRemote` |
| `/stories` | `SuccessStoriesPage.jsx` | Başarı hikayeleri grid (`SuccessStoryCard`) | `site_content` kind=`success_story` |
| `/blog` | `BlogPage.jsx` | Blog listesi, kategori filtre | `posts` |
| `/blog/:id` | `BlogPostPage.jsx` | Tekil yazı, JSON-LD | `posts` |
| `/team/coaches` | `TeamListPage.jsx` role=`coaches` | Koç listesi kartları | `staff` role=coach |
| `/team/dietitians` | `TeamListPage.jsx` role=`dietitians` | Diyetisyen listesi | `staff` role=dietitian |
| `/team/doctors` | `TeamListPage.jsx` role=`doctors` | Doktor listesi | `staff` role=doctor |
| `/team/:id` | `StaffProfilePage.jsx` | Kadro profil detayı (`StaffProfileDisplay`) | `staff` |
| `/team/apply` | `StaffApplicationPage.jsx` | Kadro başvuru formu (çok adımlı) | RPC `submit_staff_application` |
| `/corporate` | `CorporatePage.jsx` | Kurumsal tanıtım, paket özeti | statik + `corporateApplication.js` |
| `/corporate/apply` | `CorporateApplicationPage.jsx` | Kurumsal başvuru formu | RPC `submit_corporate_application` |
| `/kvkk`, `/privacy`, `/terms` | `legal/LegalDocumentPage.jsx` | Yasal metin bölümleri | `legalDocuments.js` |

#### B) Üye paneli (`RequireAuth member` + `AppShell` — Sidebar, TopBar, MobileNav)

| Rota | Dosya | Ana bölümler | Veri / aksiyonlar |
|------|-------|--------------|-------------------|
| `/dashboard` | `DashboardPage.jsx` | Sağlık özeti, kilo/antrenman/öğün grafikleri (`ProgressChart`), görevler, yaklaşan seanslar, sürüklenebilir sağlık FAB | `user`, `myPrograms`, `coachSessions`, `dietitianSessions` |
| `/calendar` | `CalendarPage.jsx` | Diyet \| Koç yan yana; xs thumbnail → detay modal; İzle inline video | `myPrograms`, `completedActivities` |
| `/schedule` | `AppointmentsPage.jsx` | Birleşik randevular `?tab=coach\|dietitian\|doctor` | `user.*Sessions` |
| `/health-test` | `HealthTestPage.jsx` | Sağlık testi hub — kategori kartları, toplam ilerleme | `healthTest.js`, `HealthTestHub` |
| `/health-test/:sectionId` | `HealthTestSectionPage.jsx` | Tek test bölümü | `HealthTestFlow` |
| `/health-test/finish` | `HealthTestFinishPage.jsx` | Onay + disclaimer | `healthAck`, `disclaimer` |
| `/programs` | `ProgramsPage.jsx` | Antrenman/beslenme; `entries[]` tıklanabilir video; `ExerciseVideoThumbnail` | `programs` |
| `/library` | `ExerciseLibraryPage.jsx` | Filtre çubuğu (konum/makine); sıralama UI yok; video gate | `exercises` |
| `/calorie` | `CalorieCalculatorPage.jsx` | Chat-first kalori hesaplama; paket bazlı fotoğraflı erişim | `ai-food-text`, `ai-food-vision` API |
| `/notifications` | `NotificationsPage.jsx` | Bildirim listesi, okundu | `user.notifications` |
| `/support` | `SupportPage.jsx` | Ticket oluştur, thread (`SupportForm`, `TicketThread`) | `tickets` |
| `/profile` | `ProfilePage.jsx` | Kişisel bilgi, üyelik rozeti, koç/diyetisyen (pakete göre), doğrulama, plan değiştirme | `PersonalInfoSection`, `VerificationSection`, `changePlan` |
| `/profile/payments` | `payments/PaymentManagementPage.jsx` | Mock ödeme geçmişi (demo banner) | `mockPayments.js` |
| `/call/:type/:id` | `VideoCallPage.jsx` | Daily.co görüşme odası | `videoCallSession.js`, `useDailyCall` |

#### C) Personel paneli (`RequireAuth staff` + `StaffShell`)

| Rota | Dosya | Rol | Ana işlev |
|------|-------|-----|-----------|
| `/staff` | `staff/StaffOverviewPage.jsx` | her ikisi | Danışan sayısı, yaklaşan randevular, `StaffVideoPanel` |
| `/staff/profile` | `staff/StaffSelfProfilePage.jsx` | her ikisi | Personel profil düzenleme (`StaffProfileEditor`); şifre değişimi mevcut şifre ile |
| `/staff/clients` | `staff/StaffClientsPage.jsx` | her ikisi | Danışan listesi, program/liste oluşturma, randevu yönetimi |
| `/staff/clients/:memberId/health` | `shared/MemberHealthProfilePage.jsx` | her ikisi | Sağlık testi cevapları + klinik notlar (**`healthAnalysis` yok**) |
| `/staff/collab-messages` | `staff/StaffCollabMessagesPage.jsx` | koç, diyetisyen | Ekip içi mesaj; inbox: peer adı büyük, `Danışan adına: …` alt satır |
| `/staff/programs` | `staff/StaffProgramsPage.jsx` | koç | Antrenman programları; diyetisyen → `/staff/lists` redirect |
| `/staff/lists` | `staff/StaffListsPage.jsx` | diyetisyen | Beslenme listeleri özeti |
| `/staff/library` | `StaffLibraryGate.jsx` | koç→library, diyetisyen→lists | Rol bazlı yönlendirme |
| `/staff/payments` | `payments/PaymentManagementPage.jsx` | mock hakediş UI | demo |
| `/staff/call/:type/:id` | `VideoCallPage.jsx` | görüşme | Daily.co |

**Danışan filtresi:** `getStaffClients()` — paket + atama kontrolü (§36.6).

#### D) Admin paneli (`RequireAuth admin` + `AdminShell`)

| Rota | Dosya | Ne yapılır | Kritik bileşenler |
|------|-------|------------|-------------------|
| `/admin` | `AdminOverviewPage.jsx` | KPI kartları, grafikler, açık ticket, atama eksik sayısı | `computeAdminStats`, Recharts |
| `/admin/members` | `AdminMembersPage.jsx` | Üye arama/liste, detay modal (profil, paket, sağlık) | `MemberHealthInsights`, `AdminActiveUsersPanel` |
| `/admin/members/:memberId/health` | `shared/MemberHealthProfilePage.jsx` | Tam sağlık profili + notlar + **`healthAnalysis` özeti** | `MemberHealthProfilePanel`, `HealthStaffNotesPanel` |
| `/admin/plans` | `AdminPlansPage.jsx` | DB plan CRUD, fiyat kademeleri, özellik listesi | `upsertPlan` |
| `/admin/premium` | `AdminPremiumPage.jsx` | **Tüm üyeler** — paket/süre değiştirme, koç/diyetisyen/doktor atama, manuel randevu | `EditPremiumModal`, `ManualSessionEditor`, `adminUpdatePremium` (§58) |
| `/admin/applications` | `AdminApplicationsPage.jsx` | Kadro + kurumsal + iletişim başvuruları (onay/red, **CV PDF**) | 3 tab |
| `/admin/library` | `AdminLibraryPage.jsx` | Egzersiz CRUD, video yükleme (Storage) | `uploadExerciseVideo` |
| `/admin/staff` | `AdminStaffPage.jsx` | Kadro ekle/düzenle/sil | RPC `admin_upsert_staff` |
| `/admin/blog` | `AdminBlogPage.jsx` | Blog yazısı CRUD | `posts` |
| `/admin/content` | `AdminContentPage.jsx` | Başarı hikayeleri yönetimi | `site_content` |
| `/admin/subscriptions` | `AdminSubscriptionsPage.jsx` | Ödeme/abonelik kayıtları listesi | `payments` |
| `/admin/payments` | `PaymentManagementPage.jsx` | Mock ödeme UI (demo) | `mockPayments.js` |
| `/admin/sessions` | `AdminSessionsPage.jsx` | Tüm üyelerin koç+diyetisyen seansları tablosu | `coachSessions`, `dietitianSessions` |
| `/admin/support` | `AdminSupportPage.jsx` | Destek ticket yönetimi | `tickets` |
| `/admin/analytics` | `AdminAnalyticsPage.jsx` | Gelir, büyüme, plan dağılımı grafikleri | `platformStats` |
| `/admin/activity` | `AdminActivityPage.jsx` | Admin aktivite akışı | `activities` |

#### E) Layout ve ortak kabuklar

| Dosya | Kullanıldığı yer | İçerik |
|-------|------------------|--------|
| `PublicLayout.jsx` | Public rotalar | Navbar (`NavDropdown`), footer, `ConsentBanner`, `PromoBanner`, `ScrollToTop`; header `isFullyRegistered` (§57) |
| `AppShell.jsx` | Üye paneli | `Sidebar`, `TopBar`, `PanelMobileMenu` |
| `StaffShell.jsx` | Personel paneli | Personel nav, çıkış |
| `AdminShell.jsx` | Admin paneli | 15 maddelik `adminNav`, `AnimatedBackground`, `NoIndexHead` |
| `RequireAuth.jsx` | Tüm korumalı rotalar | Rol kontrolü (member/staff/admin), yönlendirme |

#### F) Context — tüm panellerin ortak veri kaynağı

**Dosya:** `src/context/AppContext.jsx`

| Export | Açıklama |
|--------|----------|
| `platform` | `members`, `staff`, `programs`, `posts`, `tickets`, `payments`, `plans`, `site_content`, `exercises`… |
| `user` / `staffUser` | Oturum açmış üye veya personel |
| `adminUpdatePremium(memberId, opts)` | Koç/diyetisyen atama + seans kaydı |
| `changePlan(planId, price, months)` | Mevcut üye plan değişimi + `sanitizeStaffForPackage` |
| `register`, `login`, `logout` | Auth akışları |
| `reloadRemote()` | `hydrate()` yeniden çağır |

#### G) Hızlı "özellik → dosya" referansı

| Özellik arıyorsan | İlk bakılacak dosya |
|-------------------|---------------------|
| Koç atama (admin) | `AdminPremiumPage.jsx` |
| Paket limitleri | `membershipPlans.js` → `PACKAGE_BY_PLAN` |
| Plan değişimi sonrası temizlik | `sanitizeStaffForPackage` |
| Stripe ödeme sonrası üyelik | `api/stripe-webhook.js` |
| Video görüşme katılım | `videoCallSession.js`, `VideoCallPage.jsx` |
| Kalori AI | `CalorieCalculatorPage.jsx`, `api/ai-food-text.js` |
| Sağlık analizi üretimi | `aiAnalysis.js`, `memberHealthSync.js` |
| Landing istatistikleri | `usePlatformDisplayStats.js`, `displayPlatformStats.js` |
| SEO meta | `config/seo.js`, `SeoHead.jsx` |
| Telegram bildirim | `telegramNotify.js`, `api/telegram-notify.js` |
| Yasal metinler | `legalDocuments.js`, `LegalDocumentPage.jsx` |
| RLS / DB şema | `supabase/setup.sql`, `supabase/migrations/` |

---

### 36.9 AI görev şablonları

**"Spor paketine koç ataması ekle"** → `AdminPremiumPage.jsx` + `adminUpdatePremium` + `staffAssignment.js`; `packageIncludesCoach` kontrolü.

**"Diyet paketinde diyetisyen görünmüyor"** → `member.packageConfig.dietitianMeetingsPerMonth` ve `packageIncludesDietitian` kontrol et; Stripe webhook `defaultPackageForPlan` eşlemesine bak.

**"Plan değişince eski koç hâlâ atanmış"** → `changeMemberPlan` veya webhook'ta `sanitizeStaffForPackage` çağrılıyor mu kontrol et.

**"API 401 dönüyor"** → İstemci `getApiAuthHeaders()` kullanıyor mu; sunucu `requireAuth` guard'ı var mı.

**"Admin atama eksik sayısı yanlış"** → `memberNeedsStaffAssignment` — eko paketli üyeler sayılmamalı.

---

## 37. Sağlık Testi Günlük Rutin, Takvim Erişimi & Beslenme Öğün Yapısı (2026-06-25)

> Supabase/Vercel migration gerekmez — veriler `members.data.healthTest` (JSONB) ve program `entries` (JSONB) içinde kalır.

### 37.1 Sağlık testi — yeni "Günlük Rutin" bölümü

**Dosya:** `src/data/healthTest.js` → bölüm id: `routine`, ikon: `Clock`

| Soru anahtarı | Tip | İçerik |
|---------------|-----|--------|
| `shiftWork` | single | Vardiyalı çalışıyor musunuz? (evet/hayır + açıklama) |
| `shiftWorkDetail` | text (koşullu) | Vardiya düzeni açıklaması |
| `wakeTime` | time | Kalkış saati |
| `sleepTime` | time | Yatış saati |
| `breakfastTime` | time | Kahvaltı saati |
| `lunchTime` | time | Öğle yemeği saati |
| `dinnerTime` | time | Akşam yemeği saati |

**UI:** `src/components/onboarding/HealthTestStep.jsx` — yeni `time` sorusu tipi, teal tema, ikonlu saat seçici.

### 37.2 Takvim erişim kısıtı kaldırıldı

**Dosya:** `src/pages/CalendarPage.jsx` — tüm günler açılır; öğün/antrenman tamamlama her gün için çalışır.

### 37.3 Beslenme listesi — öğün yapısı

**`MEAL_TYPES`:** kahvaltı, sabah–öğle ara, öğle, öğle–akşam ara, akşam.

**Diyetisyen:** `NutritionProgramBuilder.jsx` — öğün adı + tek "Öğün içeriği" alanı; ara öğünler ayrı slotlar.

**Takvim:** `MealGroupRow` — "Öğün içeriği" bloğu (`mealContentText`).

### 37.4 Değiştirilen dosyalar

`healthTest.js`, `HealthTestStep.jsx`, `CalendarPage.jsx`, `programSchedule.js`, `NutritionProgramBuilder.jsx`, `StaffListsPage.jsx`, `AI_PROJE_REHBERI.md`

---

## 38. AI Blog Cron, Kişisel Sağlık Özeti & Blog Kapak Görselleri (2026-06-25)

> **Migration gerekmez** — tüm veriler mevcut JSONB alanlarında (`members.data`, `posts.data`).  
> `supabase/setup.sql` üst yorum bloğu JSONB şeması ile güncellendi.

### 38.1 Günlük AI blog (Vercel Cron)

| Alan | Değer |
|------|-------|
| Endpoint | `api/ai-blog-generate.js` |
| Cron | `vercel.json` → `0 5 * * *` (08:00 Türkiye) |
| Koruma | `CRON_SECRET` → `requireCronSecret()` |
| Model | `gemini-2.5-flash-lite` (+ fallback zinciri) |
| Min. içerik | 1350 karakter (hedef ~1800; 4+ alt başlık, ipuçları listesi) |
| Max token | 4096 (`BLOG_CONFIG.maxOutputTokens`) |
| Kayıt | Supabase `posts` — `published: true`, `data.coverImage` |

**Prompt:** `api/_ai-prompts.js` → `BLOG_SYSTEM`, `buildBlogInstruction()`, kategori rotasyonu (`BLOG_TOPIC_ROTATION`).

**Mevcut yazılara görsel:** `node scripts/patch-blog-covers.mjs` (service role gerekir).

### 38.2 Blog kapak görselleri (UI)

| Dosya | Rol |
|-------|-----|
| `src/utils/blogImages.js` | `resolveBlogCover`, `coverForCategory` — Unsplash CDN |
| `api/_blog-images.js` | Sunucu tarafı aynı eşleme (cron) |
| `src/components/landing/LatestBlogPosts.jsx` | Ana sayfa **"Son Yazılarımız"** (son 3 yazı) |
| `src/pages/BlogPage.jsx` | Liste kartlarında kapak fotoğrafı |
| `src/pages/BlogPostPage.jsx` | Hero kapak + başlık overlay |
| `supabaseDb.addPost/editPost` | `coverImage` otomatik atanır |

### 38.3 Kişisel Sağlık Özeti (Dashboard)

**Akış:**
1. Üye sağlık testini tamamlar (`HealthTestWidget` veya kayıt sonrası).
2. `syncMemberHealthAssets()` → `enrichProfileForAnalysis()` → `generateHealthAnalysis()`.
3. Sonuç `members.data.healthAnalysis` olarak kaydedilir.
4. Dashboard `HealthAnalysisPanel` — test özeti, VKİ, kalori, makrolar, **kütüphane egzersizleri**, **beslenme planı**, haftalık antrenman.

**Önemli değişiklik:** `profileReadyForAnalysis()` artık yalnızca **sağlık testinin tamamlanmasını** ister; boy/kilo/hedef yoksa `healthProfile.js` test cevaplarından türetir (tahmini metrik uyarısı gösterilir).

| Dosya | Rol |
|-------|-----|
| `src/utils/healthProfile.js` | `inferGoalsFromHealthTest`, `enrichProfileForAnalysis` |
| `src/services/memberHealthSync.js` | Senkron + otomatik program oluşturma |
| `src/services/aiAnalysis.js` | Kütüphane skorlaması, beslenme ipuçları (test bazlı) |
| `src/hooks/useHealthAnalysisSync.js` | Dashboard otomatik özet üretimi |
| `src/pages/DashboardPage.jsx` | Genişletilmiş `HealthAnalysisPanel` |

**Egzersiz kaynağı:** `exercises` tablosu → `supabaseDb.hydrate()` → `coachRecommendations.exercises[]`.

### 38.3.1 Personel vs admin — sağlık profili görünümü

| Alan | Üye (dashboard) | Admin | Koç / diyetisyen / doktor |
|------|-----------------|-------|---------------------------|
| `healthAnalysis` (VKİ, form skoru, kalori, AI özet) | ✅ Dashboard | ✅ Modal + `/admin/members/:id/health` | ❌ **Gösterilmez** |
| Sağlık testi cevapları (`describeHealthTest`) | ✅ | ✅ | ✅ `/staff/clients/:id/health` |
| Klinik notlar (`healthStaffNotes`) | ❌ | ✅ yaz/oku | ✅ yaz/oku |

**Uygulama:** `MemberHealthInsights` → `showHealthAnalysis={false}` (`StaffClientsPage`). `MemberHealthProfilePanel` → `showHealthAnalysis={audience === 'admin'}`.

**Yeni personel sağlık UI eklerken:** `healthAnalysis` bloğunu personel rotalarına **ekleme**; yalnızca admin ve üye dashboard'unda kalır.

### 38.4 Kalori AI (client güncellemesi)

- `CalorieCalculatorPage.jsx` — chat/foto **doğrudan API çağırır** (client-side kapı kaldırıldı).
- `calorieChat.js` / `aiVision.js` — varsayılan **açık** (`VITE_AI_*=false` hariç).
- Promptlar Yeni Form marka bağlamı ile güncellendi (`api/_ai-prompts.js`).

### 38.5 Gemini model fallback

`api/_gemini.js` → sırayla dener: `GEMINI_MODEL` → `gemini-2.5-flash-lite` → `gemini-flash-lite-latest` → `gemini-2.0-flash-lite` (429/503'te).

### 38.6 Ortam değişkenleri (yeni)

| Değişken | Açıklama |
|----------|----------|
| `CRON_SECRET` | Blog cron + manuel tetikleme |
| `VITE_AI_CHAT_ENABLED` | Chat kalori bayrağı |
| `GEMINI_MODEL` | Önerilen: `gemini-2.5-flash-lite` |

### 38.7 Değiştirilen / eklenen dosyalar

`api/ai-blog-generate.js`, `api/_blog-images.js`, `api/_gemini.js`, `api/_ai-prompts.js`, `api/_guards.js`, `vercel.json`, `.env.example`, `src/utils/blogImages.js`, `src/utils/healthProfile.js`, `src/hooks/useHealthAnalysisSync.js`, `src/components/landing/LatestBlogPosts.jsx`, `src/pages/LandingPage.jsx`, `src/pages/BlogPage.jsx`, `src/pages/BlogPostPage.jsx`, `src/pages/DashboardPage.jsx`, `src/pages/CalorieCalculatorPage.jsx`, `src/services/memberHealthSync.js`, `src/services/aiAnalysis.js`, `src/services/supabaseDb.js`, `src/services/calorieChat.js`, `src/services/aiVision.js`, `scripts/test-ai.mjs`, `scripts/patch-blog-covers.mjs`, `supabase/setup.sql`, `AI_PROJE_REHBERI.md`

---

## 39. Kadro Başvuru Formu Yenileme (2026-06-26)

### Özet

`/team/apply` sayfası dokümandaki alan listesine göre yenilendi: blog sayfasındaki `PlansAnimatedBackground` hero, **accordion (dokununca açılan) bölümler**, kategorize renkli seçim kartları, toplu belge yükleme, popup başvuru özeti.

### Form adımları

| # | Etiket | İçerik |
|---|--------|--------|
| 1 | Kişisel Bilgiler | Accordion: temel bilgiler, konum, salon, sosyal medya |
| 2 | Uzmanlık & Deneyim | Koç: `COACH_SPECIALTY_GROUPS` (5 kategori grid) + yetkin gruplar (accordion) + **Diğer** metin alanı; Diyetisyen: uzmanlık + mesleki bilgiler |
| 3 | Eğitim & Sertifika | Koç: eğitim + resmi antrenörlük (**Diğer yok**) + uluslararası/branş (**Diğer → input**) + **toplu belge yükleme** (`certificateFiles[]`); Diyetisyen: liste |
| 4 | Yaklaşım & Hizmet | Çalışma yaklaşımları + animasyonlu hizmet alanı kartları — **çalışma saatleri kaldırıldı** |

### UX özellikleri

- `AccordionSection` — bölüme dokununca aşağı açılır (`StaffApplicationUi.jsx`)
- `GroupedChipSelect` / `FlatChipSelect` / `ServiceAreaGrid` — renkli animasyonlu seçimler
- `OTHER_OPTION` (`'Diğer'`) — uzmanlık, gruplar, sertifikalar (resmi hariç), yaklaşım, hizmet alanları
- `ApplicationSummaryModal` — adım 4 sonunda popup özet + **Başvuruyu Onayla ve Gönder**
- `BulkCertUpload` — sertifika PDF/görselleri tek alanda çoklu yükleme

### Supabase

| Öğe | Açıklama |
|-----|----------|
| `staff_applications.data` | JSONB: `specialtyOther`, `competentGroupOther`, `workApproachOther`, `serviceAreaOther`, `certificateFiles: [{name, url}]` |
| `submit_staff_application` | Değişmedi — RPC aynı |
| `staff-application-docs` | Public bucket; anon insert |
| `uploadStaffApplicationDoc` | `supabaseDb.js` |

**Kaldırılan alanlar (koç):** `workDays`, `workStart`, `workEnd`, sertifika başına `certDocuments` (yerine `certificateFiles`)

**Migration:** `supabase/migrations/20260626_staff_application_docs_storage.sql` (canlıya uygulandı)

### Admin

`AdminApplicationsPage.jsx` → Kadro detay: Diğer metin alanları, `certificateFiles` linkleri, çalışma saatleri gösterimi kaldırıldı.

### Dosyalar

`src/data/staffApplication.js`, `src/components/staff/StaffApplicationUi.jsx`, `src/pages/StaffApplicationPage.jsx`, `src/pages/admin/AdminApplicationsPage.jsx`, `src/services/supabaseDb.js`

---

## 40. Personel Hakediş Politikası (2026-06-26)

### İş modeli

| Karar | Değer |
|-------|--------|
| Personel statüsü | **Serbest meslek** (çalışan değil) — ödeme öncesi/sonrası fatura beklenir |
| Faturalandırılabilir iş | Yalnızca **tamamlanan video görüşme** (koç + diyetisyen) |
| Faturalandırılmayan | Antrenman programı, beslenme listesi, revizyonlar |
| Birim ücret | **500 ₺ / görüşme** (`STAFF_SESSION_RATE_TRY`) |
| Minimum ödeme eşiği | **Yok** (ileride `STAFF_MIN_PAYOUT_THRESHOLD_TRY` ile eklenebilir) |
| Ödeme döngüsü | Cumartesi 00:00 → Cuma 23:59 kapanış, **ödeme Cuma** |

### Video katılım zorunluluğu

Hakediş için **üye ve personelin ikisi de** Daily.co odasına katılmalı; eşzamanlı süre en az **15 dk** (`STAFF_MIN_OVERLAP_MINUTES`).

**Seans JSONB alanı (planlanan):**

```json
{
  "attendance": {
    "member": { "joinedAt": "...", "leftAt": "..." },
    "staff": { "joinedAt": "...", "leftAt": "..." },
    "overlapMinutes": 28,
    "billable": true,
    "evaluatedAt": "..."
  },
  "status": "completed"
}
```

**Değerlendirme:** `src/services/sessionAttendance.js` → `evaluateSessionBillable()`, `buildSessionAttendancePatch()`

**Uygulama aşamaları:**

1. `VideoCallPage` — join/leave olaylarında `/api/session-attendance` (planlı)
2. Oda kapanınca veya her iki taraf ayrılınca overlap hesapla
3. `billable: true` → `staff_earning_lines` satırı (`amount: 500`, `status: pending`)
4. Admin haftalık batch onayı → EFT + `paid`

**Alternatif (ileri):** Daily.co webhook (`participant.joined` / `left`) — client manipülasyonuna karşı daha güvenilir.

### Veritabanı (planlı)

| Tablo | Açıklama |
|-------|----------|
| `staff_earning_lines` | `staff_id`, `member_id`, `session_id`, `type`, `amount`, `period_key`, `status` |
| `staff_payout_batches` | Haftalık toplu ödeme, fatura ref, `paid_at` |

### Dosyalar

`src/data/staffPayouts.js`, `src/services/sessionAttendance.js`, `src/data/mockPayments.js`, `src/pages/payments/PaymentManagementPage.jsx`

**Mevcut durum:** Kurallar kodlandı; hakediş tabloları ve video attendance API henüz yok — personel ekranı demo veri.

---

## 41. Üye–Personel Mesajlaşma (2026-06-26)

### Özet

Paket kapsamındaki **atanmış koç/diyetisyen** ile güvenli mesajlaşma. Mesajlar Supabase'de kalıcı; sohbet öncesi bilgilendirme onayı; okunmamış rozet + üst sıralama.

### Erişim kuralları

| Rol | Kiminle yazışır |
|-----|-----------------|
| Üye | Yalnızca `assignedCoachId` / `assignedDietitianId` — pakette ilgili hizmet varsa |
| Koç / Diyetisyen | Tüm atanmış aktif danışanlar |
| Admin | Tüm personel (admin ↔ personel thread); tüm danışan–personel sohbetlerini **salt okunur** görür |
| Personel | Admin ile ayrı thread (`/staff/admin-messages`) |
| Program/liste | Personel, danışanın **tüm** programlarını görür (koç antrenman + diyetisyen beslenme) — mevcut `staff_manages_member` RLS |

### Veritabanı

| Tablo | Açıklama |
|-------|----------|
| `chat_threads` | `member_id`, `staff_id`, `staff_role`, `last_message_at`, `data` (unread, preview, consent) |
| `chat_messages` | `thread_id`, `sender_type`, `data.text`, `created_at` |
| `admin_staff_threads` | `staff_id`, `last_message_at`, `data` (adminUnread, staffUnread, preview) |
| `admin_staff_messages` | `thread_id`, `sender_type` (`admin` \| `staff`), `data.text`, `created_at` |

**Migration (canlı — Yeni Form projesi):**

| Dosya | Supabase migration adı | Durum |
|-------|------------------------|-------|
| `20260627_member_staff_chat.sql` | `member_staff_chat` | ✅ Uygulandı (`20260626124337`) |
| `20260627_admin_staff_chat.sql` | `admin_staff_chat` | ✅ Uygulandı (`20260627170712`) |

**Realtime:** `chat_threads`, `chat_messages`, `admin_staff_threads`, `admin_staff_messages` → `useRealtimeSync`

**Kalıcılık:** Tüm mesajlar ilgili tablolara INSERT ile yazılır; thread meta (`last_message_at`, unread, preview) `data` JSONB içinde güncellenir. Admin denetim görünümü mevcut `chat_*` kayıtlarını okur; PDF dışa aktarım sunucuya yazmaz.

### Rotalar

| Rota | Sayfa |
|------|-------|
| `/messages`, `/messages/:role` | `MessagesPage.jsx` (üye) |
| `/staff/messages`, `/staff/messages/:memberId` | `StaffMessagesPage.jsx` |
| `/staff/admin-messages` | `StaffAdminMessagesPage.jsx` (personel ↔ admin) |
| `/admin/messages`, `/admin/messages/staff/:staffId` | `AdminMessagesPage.jsx` — personel sohbetleri |
| `/admin/messages/audit`, `/admin/messages/audit/:threadId` | `AdminMessagesPage.jsx` — danışan–personel denetimi + PDF |

### UI

- `ChatThreadView` — renkli balonlar (koç brand, diyetisyen sage); `readOnly` denetim modu
- `AdminStaffChatView` — admin ↔ personel balonları
- `ChatConsentModal` — kayıt uyarısı (ilk sohbet)
- `ChatCollapsiblePrograms` — rol bazlı program paneli (koç antrenman / diyetisyen beslenme)
- `ChatWorkspace` — responsive sohbet iskeleti (inbox + thread)
- Nav rozeti: `chatUnreadCount` — Sidebar, TopBar, StaffShell, AppShell mobil; `adminStaffUnreadCount` / `staffAdminUnreadCount` — admin/personel admin mesajları; **§42** ile birleşik başvuru/destek/bildirim rozetleri eklendi
- PDF: `exportChatPdf.js` — danışan–personel denetim kaydı indirme (`html2pdf.js`, lazy import)

### Responsive düzen (2026-06-26)

| Breakpoint | Davranış |
|------------|----------|
| **&lt; 768px (mobil)** | Tek panel: önce sohbet listesi; sohbet seçilince tam ekran thread + geri butonu. Mesaj alanı `100dvh` tabanlı yükseklik; composer altta sabit (`safe-area-inset-bottom`). Uyarı bandı ve başlık alt yazısı sohbet açıkken gizlenir. |
| **≥ 768px (tablet, `md`)** | Yan yana split: inbox ~220–260px + thread. `max-w-none` ile kenar boşlukları azaltılır; `PanelPageShell` tam genişlik kullanır. |
| **≥ 1024px (`lg`)** | Inbox genişliği ~260–300px; masaüstü deneyimi. |

**Dosyalar:** `src/components/chat/ChatWorkspace.jsx`, `src/hooks/useMediaQuery.js`

**Mobil rotalar:** Üye `/messages/:role`, personel `/staff/messages/:memberId`, admin `/admin/messages/staff/:staffId` ve `/admin/messages/audit/:threadId` — geri ile liste rotasına dönülür.

### Presence broadcast (2026-06-27)

`presenceService.js` istatistik yayını için Supabase Realtime **`httpSend('stats', payload)`** kullanır (ephemeral kanal + `removeChannel`). Eski `.send()` REST fallback uyarısı kaldırıldı. Abone tarafı: `subscribeOnlineStats()` — broadcast + 30 sn poll yedek.

**Chat çevrimiçi durumu (2026-06-28 — §42):** Sohbet partnerlerinin `user_presence` kaydı `useChatPresence` + `fetchPresenceForUsers()` ile okunur; inbox avatarında yeşil/gri nokta, thread başlığında etiket. RLS: `20260628_chat_presence_peers.sql`.

### Müşteri arayüzü & Telegram (2026-06-27)

- **YZ/AI ifadeleri kaldırıldı** — kalori, dashboard beslenme ipuçları, profil, gizlilik metni; hata mesajları teknik detay göstermez (`formatAiError`).
- **Kalori → Telegram kaldırıldı** — `notifyCalorieChatMessage` silindi; `api/calorie-chat-notify.js` deprecated.
- **Başvuru Telegram'ı ayrıldı** — `api/application-notify.js` + `TELEGRAM_STAFF_APPLICATION_CHAT_ID`, `TELEGRAM_CORPORATE_APPLICATION_CHAT_ID`; mesajda yalnızca iletişim bilgileri.

### Dosyalar

`src/services/chatDb.js`, `src/services/adminChatDb.js`, `src/utils/chatAccess.js`, `src/utils/exportChatPdf.js`, `src/components/chat/*`, `src/pages/MessagesPage.jsx`, `src/pages/staff/StaffMessagesPage.jsx`, `src/pages/staff/StaffAdminMessagesPage.jsx`, `src/pages/admin/AdminMessagesPage.jsx`, `src/context/AppContext.jsx`, `src/hooks/useRealtimeSync.js`, `src/hooks/useMediaQuery.js`, `src/hooks/useChatPresence.js`, `src/components/ui/PresenceIndicator.jsx`, `src/utils/presenceStatus.js`

---

## 42. Chat Çevrimiçi Durumu, Panel Rozetleri & Kadro Profil Birleşimi (2026-06-28)

### Chat çevrimiçi / çevrimdışı göstergesi

Sohbet partnerlerinin anlık durumu `user_presence` tablosundan okunur; 90 sn içinde heartbeat varsa **çevrimiçi** sayılır (`presenceStatus.js`).

| Ekran | Gösterim |
|-------|----------|
| Üye → koç/diyetisyen | `MessagesPage` — inbox avatar noktası + thread başlığı etiketi |
| Personel → danışan | `StaffMessagesPage` — aynı |
| Admin → personel | `AdminMessagesPage` — personel listesi + sohbet başlığı |
| Personel → admin | `StaffAdminMessagesPage` — herhangi bir admin çevrimiçiyse "Çevrimiçi" |

**Hook:** `useChatPresence(userIds, { includeAdmins })` → `{ isOnline, lastSeenAt, anyAdminOnline }`

**Servis:** `presenceService.js` → `fetchPresenceForUsers(userIds)` (Realtime `postgres_changes` + poll yedek)

**UI:** `PresenceIndicator.jsx`, `AvatarWithPresence`, `ChatThreadHeader.presence` prop (`ChatWorkspace.jsx`)

**RLS migration:** `supabase/migrations/20260628_chat_presence_peers.sql` — policy `user_presence_chat_peers`:
- Üye yalnızca kendi `chat_threads` partnerinin presence'ını okur
- Personel, admin rolündeki kullanıcıların presence'ını okuyabilir (`admin_staff_threads` varsa)

### Panel navigasyon bildirim rozetleri

Menü öğelerinde kırmızı sayaç (`9+` üst sınır); Realtime ile anlık güncellenir.

| Panel | Menü | Kaynak (`AppContext`) | Tetikleyici |
|-------|------|----------------------|-------------|
| **Admin** | Başvurular | `pendingApplicationsCount` | `staff_applications` pending + `corporate_applications` pending + `contact_inquiries` new |
| **Admin** | Mesajlar | `adminStaffUnreadCount` | `admin_staff_threads.data.adminUnread` |
| **Admin** | Destek Talepleri | `openSupportTicketsCount` | Tüm açık/bekleyen ticket'lar |
| **Üye** | Mesajlar | `chatUnreadCount` | Atanmış personel thread'leri |
| **Üye** | Bildirimler | `notificationUnreadCount` | `members.notifications` okunmamış |
| **Üye** | Destek | `openSupportTicketsCount` | Üyenin açık ticket'ları |
| **Personel** | Mesajlar | `chatUnreadCount + staffAdminUnreadCount` | Danışan + admin mesajları toplamı |

**Layout dosyaları:** `AdminShell.jsx`, `StaffShell.jsx`, `Sidebar.jsx`, `AppShell.jsx` (mobil nav), `PanelMobileMenu.jsx`

**Realtime:** `useRealtimeSync.js` — admin için `staff_applications`, `corporate_applications`, `contact_inquiries` INSERT/UPDATE dinlenir → `reloadRemote()`

### Kadro vitrin seed & birleşik profil şeması

| Öğe | Açıklama |
|-----|----------|
| `public/team/team-coach-*.png`, `team-dietitian-*.png` | Landing Kadromuz görselleri |
| `src/data/seedTeamProfiles.js` | 4 referans profil (2 koç, 2 diyetisyen) |
| `20260627_team_public_seed.sql` | `staff` tablosuna vitrin kayıtları |
| `src/data/staffProfile.js` | `staffProfileDataPayload()` — admin manuel ekleme + başvuru onayı ortak şema |
| `src/data/staffApplication.js` | `applicationToStaffPayload()` — onay sonrası staff kaydına dönüşüm |

**Kadro başvurusu (2026-06-28):** İsteğe bağlı profil fotoğrafı (`PhotoUpload` variant `portrait`, `optional`); şehir, ilçe, cinsiyet, sosyal linkler başvuru formunda.

**Admin manuel ekleme:** `StaffFormModal.jsx` — başvuru formu ile aynı alan seti (foto, konum, sosyal vb.).

### Güvenlik / repo

- `.gitignore` genişletildi: `.cron-secret.local.txt`, `.env*.local`, IDE/OS artefaktları
- `.cron-secret.local.txt` git takibinden çıkarıldı (yerel cron secret)

### Dosyalar (özet)

`src/context/AppContext.jsx`, `src/hooks/useRealtimeSync.js`, `src/hooks/useChatPresence.js`, `src/services/presenceService.js`, `src/utils/presenceStatus.js`, `src/components/ui/PresenceIndicator.jsx`, `src/components/layout/{AdminShell,StaffShell,Sidebar,AppShell}.jsx`, `src/pages/{MessagesPage,staff/StaffMessagesPage,staff/StaffAdminMessagesPage,admin/AdminMessagesPage}.jsx`, `src/data/{seedTeamProfiles,staffProfile,staffApplication}.js`, `src/components/admin/StaffFormModal.jsx`, `src/pages/StaffApplicationPage.jsx`, `supabase/migrations/20260627_team_public_seed.sql`, `supabase/migrations/20260628_chat_presence_peers.sql`, `AI_PROJE_REHBERI.md`

---

## 43. Realtime Mesajlaşma & Çevrimiçi Durum Düzeltmeleri (2026-06-28)

### Kök neden 1 — Realtime kanal churn (anlık mesaj gitmiyor/gelmiyor)

`AppContext` içindeki `subscribeRealtimeSync` effect'i `remoteDb?.session` **nesne referansına** bağlıydı. `remoteDb` her veri güncellemesinde (mesaj gönderme, bildirim okuma, ticket, realtime member UPDATE) yeni nesne olarak set edildiği için, effect sürekli cleanup + yeniden subscribe çalıştırıyordu. Bu da Supabase realtime kanallarının (`chat-messages-sync`, `chat-threads-sync` vb.) durmadan yıkılıp kurulmasına ve realtime'ın **sessizce durmasına** yol açıyordu.

**Çözüm:** Bağımlılık primitive'lere çekildi → `sessionType` (string) + `currentMember?.id` + `currentStaff?.id`. Kanallar yalnızca oturum kimliği değişince yeniden kurulur.

```js
const sessionType = remoteDb?.session?.type
useEffect(() => { /* subscribeRealtimeSync(...) */ },
  [isSupabaseEnabled, sessionType, currentMember?.id, currentStaff?.id, reloadRemote])
```

### Kök neden 2 — Yanlış presence rolü (aktiflik sistemi)

`startPresenceTracker → resolvePresenceInfo` oturum tipi henüz hazır değilken `role: s?.type || 'member'` ile **'member'** yazıyordu; bu yüzden koç/diyetisyen/admin satırları `user_presence`'ta yanlış role ile kaydoluyordu (`anyAdminOnline` ve chat peer durumu bozuluyordu).

**Çözüm:**
- Oturum tipi (`s?.type`) çözülmeden presence yazılmaz (erken `return null`).
- Rol doğrudan oturumdan alınır; staff adı id **veya** e-posta ile eşleşir; admin adı `authUser`'dan gelir.
- Mevcut hatalı satırlar düzeltildi: `update user_presence set role='staff'` (staff tablosuyla eşleşen) ve `role='admin'` (admin e-postası).

### Güvence katmanı — Polling fallback

Realtime bir an düşse bile mesajların gelmesi için **açık sohbette 8 sn'lik poll** eklendi (`loadChatMessages`/`loadAdminStaffMessages` periyodik tazeleme): `MessagesPage`, `StaffMessagesPage`, `StaffAdminMessagesPage`, `AdminMessagesPage` (denetim 10 sn).

### Veritabanı doğrulamaları (MCP ile)

| Kontrol | Sonuç |
|---------|-------|
| Realtime publication | `chat_threads`, `chat_messages`, `admin_staff_threads`, `admin_staff_messages`, `user_presence`, `members`, `tickets` — ✅ ekli |
| RLS | Tüm chat + presence tablolarında etkin; politikalar `is_admin()` / `staff_manages_member()` / `auth.uid()` ile doğru |
| Üye ↔ personel atama | `members.assigned_coach_id` / `assigned_dietitian_id` geçerli staff'a bağlı → `staff_manages_member` çalışıyor |
| `user_presence` rolleri | admin=1, staff=4, member=6 (düzeltme sonrası) |

**Online eşiği:** `OFFLINE_MS = 90 sn`, heartbeat 30 sn (`presenceService.js` / `presenceStatus.js`).

### Dosyalar

`src/context/AppContext.jsx`, `src/pages/MessagesPage.jsx`, `src/pages/staff/StaffMessagesPage.jsx`, `src/pages/staff/StaffAdminMessagesPage.jsx`, `src/pages/admin/AdminMessagesPage.jsx`

---

## 44. Personel Mesajlaşma — Danışan Listesi & RLS (2026-06-28)

### Belirti

Koç/diyetisyen **Mesajlar** panelinde atanmış danışanlar görünmüyordu; danışan tarafında mesajlaşma da etkilenebiliyordu.

### Kök neden 1 — Inbox yalnızca mevcut thread'lere bağlıydı

`StaffMessagesPage` sohbet listesini `chatThreads` üzerinden kuruyordu; atanmış danışan için henüz `chat_threads` satırı yoksa (ilk mesaj öncesi) danışan inbox'ta **hiç listelenmiyordu**.

**Çözüm:** Inbox artık `getStaffClients` ile gelen **atanmış danışanlar** üzerinden kurulur (`buildStaffChatInbox`); thread yoksa danışan yine listede görünür, seçimde veya mesaj gönderiminde `getOrCreateChatThread` ile otomatik oluşturulur.

### Kök neden 2 — Sohbet hydration danışan değişimini izlemiyordu

`AppContext` chat effect'inde `chatHydratedKey` yalnızca oturum tipi + id ile hesaplanıyordu. Admin yeni danışan atadığında veya personel oturumu açıkken danışan listesi güncellense bile thread oluşturma **tekrar çalışmıyordu**.

**Çözüm:**
- `staffClientsSignature()` ile danışan id imzası hydration anahtarına eklendi.
- `getCurrentStaff()` ile personel çözümlemesi (id + e-posta yedeği).
- `refreshStaffChatThreads()` ve `ensureStaffChatThread()` — sayfa açılışında ve danışan seçiminde thread garantisi.

### Kök neden 3 — Rol & filtre tutarsızlığı

`getStaffClients` ham `role` değerini kullanıyordu; `normalizeStaffRole` olmadan koç ataması diyetisyen dalına düşebiliyordu. Ayrıca `membershipStatus` boş olan aktif üyeler eleniyordu.

**Çözüm:** `normalizeStaffRole`, varsayılan `active` durumu, atama sütunu (`assigned_coach_id` / `assigned_dietitian_id`) önceliği.

### Kök neden 4 — RLS e-posta eşleşmesi (case-sensitive)

`staff_manages_member()` ve `members_select` politikası `s.email = current_email()` ile **birebir** karşılaştırıyordu. JWT e-postası ile `staff.email` farklı büyük/küçük harf taşıyorsa personel **hiç danışan satırı okuyamıyordu** (RLS boş liste).

**Migration:** `20260628_staff_email_rls_case_insensitive.sql`

- `lower(s.email) = lower(current_email())` — `staff_manages_member`, `current_staff_id`, `members_select`, `members_update`

### Yardımcılar (`chatAccess.js`)

| Fonksiyon | Açıklama |
|-----------|----------|
| `getStaffClients(members, role, staffId)` | Atanmış aktif ücretli danışanlar |
| `buildStaffChatInbox(clients, threads, staffUser)` | Danışan ↔ thread eşlemesi |
| `sortStaffInboxItems(items)` | Okunmamış + son mesaj sıralaması |
| `staffClientsSignature(...)` | Hydration cache anahtarı için danışan imzası |

### Dosyalar

`src/pages/staff/StaffMessagesPage.jsx`, `src/context/AppContext.jsx`, `src/utils/chatAccess.js`, `src/services/chatDb.js`, `supabase/migrations/20260628_staff_email_rls_case_insensitive.sql`

---

## 45. Landing Performans, SEO Slug Profilleri & UX İyileştirmeleri (2026-06-28)

### Landing performans optimizasyonu

Scroll/navigasyon lag'ini azaltmak için Framer Motion tabanlı **sürekli (infinite) orb animasyonları** CSS'e taşındı; reflow tetikleyen animasyonlar kaldırıldı.

| Dosya | Değişiklik |
|-------|------------|
| `src/index.css` | `landingOrbPulseA/B/C`, `landingBlobRotateCW/CCW` keyframe'leri + `prefers-reduced-motion` |
| `SectionBackdrop.jsx` | 3× JS orb → `.landing-orb-a/b/c` CSS sınıfları |
| `PlansAnimatedBackground.jsx` | JS orb kaldırıldı; CSS aurora yeterli |
| `LandingPage.jsx` hero | rotate/scale JS blob'ları CSS'e; video `poster` + `<img>` fallback kaldırıldı, `preload="metadata"` |
| `PromoBanner.jsx` | `height:'auto'` → `opacity + y` (reflow yok) |
| `RotatingHeroText.jsx` | `filter:blur()` kaldırıldı (metin rasterization maliyeti) |
| `WhyUsSection.jsx` | `viewport margin:'50px'`; accordion süresi kısaltıldı |
| Diğer landing bileşenleri | Tüm `whileInView` → `viewport={{ once: true, margin: "50px" }}` |

### UX / metin düzenlemeleri

| Alan | Değişiklik |
|------|------------|
| **WhyUsSection** | Accordion CTA linkleri `text-white/90`; "Evde ve salonda antrenman rehberliği" |
| **LandingPage hero** | Metin: ev + spor salonu hedef kitlesi; video arkası poster/görsel kaldırıldı |
| **LatestBlogPosts** | Sağ sütun `md:grid-rows-2` ile eşit yükseklik; dikey kart düzeni, excerpt eklendi |

### SEO — kadro profil slug'ları

"Koç Ahmet Yeni Form" gibi aramalar için SEO dostu URL'ler:

| Fonksiyon | Dosya | Açıklama |
|-----------|-------|----------|
| `slugifyTurkish()` | `src/config/seo.js` | Türkçe karakter destekli slug |
| `staffPublicSlug(member)` | `src/config/seo.js` | Örn. `koc-ahmet-yilmaz` |
| `staffProfilePath(member)` | `src/config/seo.js` | `/team/koc-ahmet-yilmaz` |
| `findStaffMember(staff, param)` | `src/config/seo.js` | UUID veya slug ile eşleşme |
| `buildStaffProfileKeywords()` | `src/config/seo.js` | `"koç ahmet", "ahmet yeni form"` vb. meta keywords |

**Davranış:**
- Profil linkleri artık slug URL kullanır (`StaffMemberCard`, `TeamListPage` ItemList schema).
- UUID ile erişim (`/team/<uuid>`) otomatik slug URL'ine **301 benzeri client redirect** (`StaffProfilePage` → `<Navigate replace>`).
- `buildPersonSchema` → `url`, `sameAs` (sosyal linkler) eklendi.
- `api/sitemap.js` → kadro profilleri slug path ile listelenir (`priority: 0.6`).
- `index.html`, `PAGE_SEO['/']` → ev + spor salonu anahtar kelimeleri.
- `BlogPostPage` → kategori/yazar keywords meta.

**Örnek URL:** `/team/koc-ahmet-yilmaz` (koç rolü + isim slug)

### Dosyalar

`src/index.css`, `src/config/seo.js`, `src/pages/LandingPage.jsx`, `src/pages/StaffProfilePage.jsx`, `src/pages/BlogPostPage.jsx`, `src/pages/TeamListPage.jsx`, `src/components/landing/{WhyUsSection,LatestBlogPosts,PromoBanner,RotatingHeroText,SectionBackdrop,PlansAnimatedBackground}.jsx`, `src/components/staff/StaffMemberCard.jsx`, `src/pages/auth/AuthCallbackPage.jsx`, `api/sitemap.js`, `index.html`, `AI_PROJE_REHBERI.md`

---

## 46. Şifre Sıfırlama Düzeltmesi & Özel E-posta Şablonları (2026-06-28)

### Sorun

E-posta doğrulama (profil → bağlantı gönder) çalışıyordu; **şifre sıfırlama çalışmıyordu**. Kök nedenler:

| # | Neden | Etki |
|---|--------|------|
| 1 | Uygulama `flowType: 'pkce'` kullanıyor; varsayılan Supabase **Recovery** şablonu `{{ .ConfirmationURL }}` ile PKCE `code` üretiyor | Farklı tarayıcı/cihazda `exchangeCodeForSession` başarısız (code_verifier yok) |
| 2 | `ForgotPasswordPage` istemciden `resetPasswordForEmail` + `getSiteUrl()` (tarayıcı origin) çağırıyordu | Production'da yanlış redirect; e-posta doğrulama gibi sunucu `APP_URL` kullanılmıyordu |
| 3 | `AuthRedirectHandler` kök URL'deki `?code=` parametresini otomatik `verify=email` sanıyordu | Recovery linki e-posta doğrulama akışına düşebiliyordu |

E-posta doğrulama **evt jetonu** ile oturumsuz da tamamlanabildiği için etkilenmiyordu; şifre sıfırlama oturuma **mutlaka** ihtiyaç duyar.

### Çözüm (kod)

| Dosya | Değişiklik |
|-------|------------|
| `api/auth.js` | `action: password-reset` → `/auth/v1/recover` (service role) + `getAppUrl()` redirect |
| `src/pages/auth/ForgotPasswordPage.jsx` | İstemci Supabase çağrısı kaldırıldı → `POST /api/auth` |
| `src/services/authSessionFromUrl.js` | **Yeni** — `verifyOtp({ token_hash, type })` + `exchangeCodeForSession` + oturum bekleme |
| `src/pages/auth/AuthCallbackPage.jsx` | `establishSession()` → paylaşılan helper |
| `src/pages/auth/ResetPasswordPage.jsx` | token_hash oturumu; yalnızca `PASSWORD_RECOVERY` eventi |
| `src/components/auth/AuthRedirectHandler.jsx` | Recovery `type=recovery` / `token_hash` ayrımı; `code` → otomatik `verify=email` kaldırıldı |

### Güncel şifre sıfırlama akışı

```
/forgot-password
  → POST /api/auth { action: "password-reset", email }
  → sendRecoveryEmail → redirect_to=https://www.yeniform.com/auth/callback?next=reset-password
  → Supabase Recovery e-postası (Dashboard şablonu — aşağıda)
  → Kullanıcı linke tıklar
  → /auth/callback?token_hash=…&type=recovery&next=reset-password
  → verifyOtp → oturum → /reset-password
  → updateUser({ password }) → signOut(local) → /login
```

### Supabase Dashboard — zorunlu manuel adımlar

> Kod tek başına yeterli değil; **Recovery e-posta şablonunu Dashboard'da güncellemeniz gerekir.**

#### A) E-posta şablonları (Türkçe, Yeni Form markası)

Kaynak HTML: `supabase/email-templates/`

| Dosya | Dashboard → Email Templates | Subject (konu) |
|-------|----------------------------|------------------|
| `recovery.html` | **Reset Password** | `Yeni Form — Şifre sıfırlama bağlantınız` |
| `magic-link.html` | **Magic Link** | `Yeni Form — E-posta doğrulama bağlantınız` |
| `confirm-signup.html` | **Confirm signup** | `Yeni Form — Hesabınızı doğrulayın` |

**Recovery şablonu kritik satır** (PKCE uyumlu):

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=reset-password">
  Yeni Şifre Belirle
</a>
```

Magic Link (profil e-posta doğrulama) — `RedirectTo` sunucudan gelir (`evt` jetonlu URL):

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">
  E-postamı Doğrula
</a>
```

Detaylı adımlar: `supabase/email-templates/README.md`

Dashboard: [Email Templates](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/templates)

#### B) Özel gönderen — info@yeniform.com

Supabase varsayılan gönderici: `noreply@mail.app.supabase.io`. Kendi adresiniz için:

1. [Authentication → SMTP Settings](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/smtp)
2. **Enable Custom SMTP**
3. Önerilen:
   - **Sender email:** `info@yeniform.com`
   - **Sender name:** `Yeni Form`
   - SMTP: Resend / SendGrid / Brevo / Amazon SES (domain DNS: SPF + DKIM + DMARC)

> SMTP kimlik bilgileri repoya veya `VITE_` env'e **konmaz** — yalnızca Supabase Dashboard.

#### C) URL yapılandırması

[Authentication → URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

| Alan | Değer |
|------|-------|
| Site URL | `https://www.yeniform.com` |
| Redirect URLs | `https://www.yeniform.com/**`, `http://localhost:5173/**` |

#### D) Vercel env (değişmedi)

```
APP_URL=https://www.yeniform.com
VITE_SITE_URL=https://www.yeniform.com
SUPABASE_SERVICE_ROLE_KEY=…
```

### Test planı

1. Dashboard'da **Recovery** şablonunu `supabase/email-templates/recovery.html` ile güncelle → Save
2. `/forgot-password` → kayıtlı e-posta gir → "Bağlantı gönderildi"
3. E-postadaki linke tıkla (farklı tarayıcıda da dene) → `/reset-password` formu açılmalı
4. Yeni şifre kaydet → `/login` yönlendirmesi → yeni şifre ile giriş
5. *(Opsiyonel)* SMTP kur → gönderen `info@yeniform.com` görünmeli

### Değiştirilen / eklenen dosyalar

- `api/auth.js`
- `src/services/authSessionFromUrl.js` *(yeni)*
- `src/pages/auth/{ForgotPasswordPage,ResetPasswordPage,AuthCallbackPage}.jsx`
- `src/components/auth/AuthRedirectHandler.jsx`
- `supabase/email-templates/{recovery,magic-link,confirm-signup}.html`, `README.md`
- `AI_PROJE_REHBERI.md` (bu bölüm)

---

## 47. Şifre Sıfırlama — Kök Neden Düzeltmesi & Yeni Sayfa (2026-06-28)

### Log analizi ile tespit edilen sorun

Supabase auth loglarından:

```
action: user_recovery_requested  path: /recover  status: 200   ← API çalışıyor, mail gidiyor
action: user_recovery_requested  path: /otp       status: 200   ← e-posta doğrulama (magic_link)
mail.send  mail_type: magic_link  ← sadece e-posta doğrulama için log var
```

**Kök neden:** §46'da eklenen `api/auth.js → password-reset` aksiyonu sunucu tarafından `/auth/v1/recover` çağırıyor.
Sunucu taraflı recover çağrısı PKCE `code_verifier` oluşturmuyor.
Supabase **implicit flow** ile hash token (`#access_token=...&type=recovery`) gönderiyor.
`supabase-js` ise `flowType: 'pkce'` yapılandırmasıyla hash tokenleri **işlemiyor** → oturum kurulamıyor → `/reset-password` "geçersiz bağlantı" gösteriyor.

### Çözüm

| Değişiklik | Detay |
|------------|-------|
| `ForgotPasswordPage.jsx` | Sunucu API kaldırıldı. **Client-side** `supabase.auth.resetPasswordForEmail` kullanıyor; PKCE `code_verifier` localStorage'a kaydediliyor |
| `authSessionFromUrl.js` | **3 yol** → token_hash (custom template) + code (PKCE) + implicit hash token (fallback: `setSession`) |
| `ResetPasswordPage.jsx` | **Tamamen yeniden yazıldı**: tam sayfa marka tasarımı, şifre güç göstergesi, göz ikonu, animasyonlu durumlar |
| `AuthCallbackPage.jsx` | Recovery tespiti genişletildi; her durumda `/reset-password`'e navigate edilir, oturum kurulumu `ResetPasswordPage`'e bırakıldı |

### Güncel şifre sıfırlama akışı (düzeltilmiş)

```
/forgot-password
  → supabase.auth.resetPasswordForEmail(email, { redirectTo: /auth/callback?next=reset-password })
  → PKCE code_verifier localStorage'a kaydedilir
  → Supabase varsayılan recovery e-postası gönderilir (noreply@mail.app.supabase.io)
  → Kullanıcı linke tıklar
  → Supabase PKCE ile code üretir
  → https://www.yeniform.com/auth/callback?next=reset-password&code=XXX
  → AuthCallbackPage: next=reset-password → isRecovery=true → navigate /reset-password
  → ResetPasswordPage: establishAuthSessionFromUrl → exchangeCodeForSession(code) → oturum ✓
  → Şifre formu açılır → updateUser({ password }) → signOut(local) → /login
```

**Özel SMTP + custom template kurulunca** (§46 devam eder):
- Recovery e-postasında `token_hash` + `type=recovery` URL olarak gelir
- `authSessionFromUrl.js` bu durumu da işler (adım 1: `verifyOtp`)
- Farklı tarayıcıda / cihazda da çalışır

### Yeni ResetPasswordPage özellikleri

- Tam sayfa gradient arka plan (AuthCallbackPage ile aynı marka dili)
- Şifre güç göstergesi (PASSWORD_RULES üzerinden canlı)
- Göz ikonu ile şifre görünürlük toggle
- Animasyonlu durumlar: loading → ready → done | invalid
- Eşleşme kontrolü (canlı, anında geri bildirim)
- Kaydet butonu: tüm kurallar sağlanmadan disabled

### Dosyalar

`src/pages/auth/{ForgotPasswordPage,ResetPasswordPage,AuthCallbackPage}.jsx`
`src/services/authSessionFromUrl.js`
`AI_PROJE_REHBERI.md`

---

## 48. token_hash Yönlendirme Hatası & ForgotPasswordPage Yeniden Tasarım (2026-06-28)

### Log'dan tespit edilen ikinci hata

Kullanıcı tarafından paylaşılan gerçek e-posta bağlantısı:
```
https://www.yeniform.com/auth/callback?token_hash=pkce_3451b143e825...&type=recovery&next=reset-password
```

`pkce_` önekli `token_hash` → client-side PKCE ile üretildi (§47 düzeltmesi doğru çalışıyor).

**Yeni sorun:** `AuthCallbackPage` `isRecovery` durumunda önce `verifyOtp(token_hash)` çağırıp token'ı **tek kullanımlık olduğu için tüketiyordu**, sonra `/reset-password`'e yönlendiriyordu ama `token_hash`'i URL'e **taşımıyordu**. `ResetPasswordPage` token_hash'siz açılıyordu → `getSession()` null → "geçersiz bağlantı".

### Düzeltme

| Dosya | Değişiklik |
|-------|------------|
| `AuthCallbackPage.jsx` | Recovery'de `verifyOtp` **kaldırıldı**. Token tüketilmeden `/reset-password?token_hash=pkce_...&type=recovery` URL'ye taşınır |
| `ResetPasswordPage.jsx` | `useSearchParams()` ile `token_hash` okunur → `verifyOtp` burada tek sefer çağrılır → oturum kurulur → form gösterilir |

### Güncel DOĞRU şifre sıfırlama akışı (§48 sonrası)

```
/forgot-password → supabase.auth.resetPasswordForEmail (PKCE, code_verifier localStorage)
→ Supabase recovery e-postası (default template: {{ .ConfirmationURL }})
→ Kullanıcı tıklar → Supabase PKCE işler
→ /auth/callback?token_hash=pkce_XXX&type=recovery&next=reset-password
→ AuthCallbackPage: isRecovery=true → navigate /reset-password?token_hash=pkce_XXX&type=recovery
→ ResetPasswordPage: verifyOtp({ token_hash: 'pkce_XXX', type: 'recovery' }) → oturum ✓
→ Şifre formu → updateUser({ password }) → signOut(local) → /login
```

### ForgotPasswordPage yeni tasarım

- Tam sayfa gradient arka plan (marka renkleri)
- Üst şerit (brand → sage → violet gradyan)
- Mail ikonu kartı
- AnimatePresence: form ↔ başarı durumu geçişi
- Başarı ekranında: e-posta adresi göster, spam uyarısı, "Farklı e-posta dene" butonu
- "Hesabınızı hatırladınız mı? Giriş yapın" alt bağlantısı

### Dosyalar

`src/pages/auth/{ForgotPasswordPage,ResetPasswordPage,AuthCallbackPage}.jsx`
`AI_PROJE_REHBERI.md`

---

## 49. AuthRedirectHandler Sonsuz Döngü Düzeltmesi (2026-06-28)

### Sorun (videoda gözlemlenen)

Deploy sonrası şifre sıfırlama sayfası 20-30 kez farklı URL'lere gidip geliyordu. Kök neden:

```
AuthCallbackPage → navigate /reset-password?token_hash=pkce_XXX&type=recovery
AuthRedirectHandler (her sayfada çalışır!):
  - pathname = /reset-password ≠ /auth/callback → atlamıyor
  - tokenHash = pkce_XXX → null değil → erken return yapmıyor
  - type = recovery → params'a next=reset-password ekliyor
  - navigate /auth/callback?token_hash=pkce_XXX&type=recovery&next=reset-password
AuthCallbackPage → navigate /reset-password?token_hash=pkce_XXX&type=recovery
AuthRedirectHandler → ... → SONSUZ DÖNGÜ
```

### Düzeltme

| Dosya | Değişiklik |
|-------|------------|
| `AuthRedirectHandler.jsx` | `AUTH_PAGES` listesi: `/auth/callback`, `/reset-password`, `/login`, `/forgot-password` → hepsi atlanıyor |
| `ResetPasswordPage.jsx` | `verifyOtp` başarısında `window.history.replaceState({}, '', '/reset-password')` → URL'den `token_hash` + `type` temizleniyor |

### Tam şifre sıfırlama akışı (§49 sonrası — son hâli)

```
/forgot-password (aynı tarayıcı)
  → supabase.auth.resetPasswordForEmail → PKCE code_verifier localStorage'a kaydedilir
  → Supabase recovery e-postası gönderilir
  → Kullanıcı linke AYNI TARAYICIDA tıklar
  → https://www.yeniform.com/auth/callback?token_hash=pkce_XXX&type=recovery&next=reset-password
  → AuthRedirectHandler: /auth/callback → ATLA
  → AuthCallbackPage: isRecovery=true → navigate /reset-password?token_hash=pkce_XXX&type=recovery
  → AuthRedirectHandler: /reset-password → ATLA (yeni eklendi)
  → ResetPasswordPage: verifyOtp(token_hash) → BAŞARI → URL /reset-password'e temizlendi
  → Şifre formu açılır → updateUser({ password }) → signOut(local) → /login
```

### Dosyalar

`src/components/auth/AuthRedirectHandler.jsx`
`src/pages/auth/ResetPasswordPage.jsx`
`AI_PROJE_REHBERI.md`

---

## 50. Personel Profil Düzenleme + DB Güvenliği (2026-06-29)

### Personel paneli — `/staff/profile`

Koç ve diyetisyenler kendi profillerini panelden günceller. **Başvuru onayında kaydedilen alanlar düzenlenemez** (UI + DB):

| Düzenlenebilir | Kilitli (admin / başvuru onayı) |
|----------------|----------------------------------|
| Ad, telefon, unvan, cinsiyet, il/ilçe | E-posta, rol |
| Fotoğraf, biyografi | Uzmanlık, deneyim yılı, diller |
| Çalışma günleri/saatleri | Eğitim, iş deneyimi, sertifikalar |
| Sosyal medya linkleri | |

**Sekmeler:** Profil · Çalışma · Güvenlik (Uzmanlık/Eğitim/Sertifikalar kaldırıldı).

**Şifre:** Güvenlik sekmesinde önce **mevcut şifre** doğrulanır (`signInWithPassword`), ardından `updateUser({ password })`.

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/pages/staff/StaffSelfProfilePage.jsx` | Personel profil sayfası |
| `src/components/staff/StaffProfileEditor.jsx` | Sekmeli düzenleyici + kilitli alan filtresi (`lockedProfileFields`) |
| `src/services/supabaseDb.js` | `updateStaffSelfProfile()` → RPC |
| `src/context/AppContext.jsx` | `updateStaffProfile` context API |
| `src/components/layout/StaffShell.jsx` | Menü: **Profilim** |
| `supabase/migrations/20260629_staff_self_profile_update.sql` | RLS + RPC migration |
| `supabase/migrations/20260630_remove_staff_headline.sql` | headline temizliği |

### Veritabanı

**RLS `staff_self_update`:** Büyük/küçük harf duyarsız e-posta; `WITH CHECK (id = current_staff_id())`.

**RPC `staff_update_self_profile(p_name, p_data)`:**

- `security definer`; yalnızca `current_staff_id()` satırını günceller.
- `name` + birleştirilmiş `data` JSONB.
- Başvuru onaylı anahtarlar her zaman mevcut kayıttan geri yazılır: `specialty`, `specialties`, `experienceYears`, `languages`, `education`, `experiences`, `certificates`.
- Birleştirme sonrası `- 'headline'` ile slogan alanı silinir.
- Admin kadro CRUD hâlâ `admin_upsert_staff` RPC ile.

**Uzak projede uygulama durumu (2026-06-29, MCP ile):**

| Repo dosyası | Uzak migration adı | Durum |
|---|---|---|
| `20260629_staff_self_profile_update.sql` | `staff_self_profile_update` | ✅ Uygulandı |
| `20260630_remove_staff_headline.sql` | `remove_staff_headline` | ✅ Uygulandı |

**Doğrulama sorgusu (2026-06-29):**

```sql
SELECT
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'staff_update_self_profile') AS rpc_exists,
  (SELECT count(*) FROM public.staff WHERE data ? 'headline') AS staff_with_headline,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'staff' AND policyname = 'staff_self_update') AS self_update_policy;
-- Sonuç: rpc_exists=true, staff_with_headline=0, self_update_policy=1
```

Yeni kurulumlarda `setup.sql` bu RPC ve güncel RLS'yi içerir.

### Üyelik / kurumsal (aynı dönem)

- `MembershipReassurance` hero'dan kaldırıldı; üyelik sayfası sonuna taşındı.
- "Nasıl üye olursunuz?" plan kartlarının üstüne alındı.
- Kurumsal sayfa: video vitrinindeki "Canlı seans" chip kaldırıldı.

### headline (slogan) kaldırıldı (2026-06-30)

`staff.data.headline` alanı kullanımdan kaldırıldı. Başvuru onayı, admin formu ve personel profil düzenlemede slogan istenmez.

- `staffProfileDataPayload` artık `headline` yazmaz; migration `20260630_remove_staff_headline.sql` mevcut kayıtlardan siler (**uzak projede uygulandı**).
- `staff_update_self_profile` RPC birleştirme sonrası `- 'headline'` uygular.
- Public kartlar ve SEO açıklamaları `bio` kullanır.

---

## 51. Kadro Başvurusu CV PDF İndirme (2026-06-30)

Admin panelinde gelen personel başvurularından tek tıkla **A4 PDF özgeçmiş** oluşturulur. Veritabanı değişikliği yok — mevcut `staff_applications` kaydı client-side HTML → PDF (`html2pdf.js`).

### Kullanım

**Rota:** `/admin/applications` → **Kadro** sekmesi

| Konum | Buton | Davranış |
|-------|-------|----------|
| Başvuru kartı (kapalı) | **CV İndir** | Anında PDF indirir |
| Detay açık | **PDF Olarak İndir** | Aynı; üstte vurgulu CV kutusu |

Dosya adı: `cv-{ad-soyad-slug}-{basvuru-tarihi}.pdf`

### PDF içeriği

Koç ve diyetisyen için başvuru formundaki tüm alanlar:

- Fotoğraf, iletişim, konum, salon (varsa), sosyal medya, diller
- Uzmanlık, deneyim, yetkin gruplar, eğitim, sertifikalar
- Koç: resmi/uluslararası/branş sertifikaları, çalışma yaklaşımı, hizmet alanları, belge listesi
- Diyetisyen: mezuniyet, oda no, tanıtım, eğitim ve sertifika listeleri
- Alt bilgi: başvuru tarihi, durum (bekliyor/onaylandı/reddedildi)

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/utils/exportStaffApplicationCv.js` | `buildStaffApplicationCvHtml`, `downloadStaffApplicationCvPdf` |
| `src/pages/admin/AdminApplicationsPage.jsx` | CV İndir butonları + yükleme durumu |
| `src/utils/exportChatPdf.js` | Aynı `html2pdf.js` lazy import kalıbı (referans) |

### Notlar

- Profil fotoğrafı Supabase Storage URL ise `html2canvas` `useCORS: true` ile render edilir.
- Kurumsal ve iletişim başvurularında CV özelliği yok (yalnızca kadro).

---

## 52. Üye Silme CASCADE + Yetim Veri Temizliği (2026-07-01)

Manuel DB silmelerinden kalan ödeme, abonelik ve destek kayıtları artık görünmez; admin panelden güvenli üye silme eklendi.

### Sorun

`payments`, `tickets`, `activities` tablolarında `member_id` **ON DELETE SET NULL** idi. Üye `members` veya `auth.users` üzerinden silindiğinde satırlar kalıyor; JSONB içindeki `memberName`, `amount`, paket bilgisi admin gelir/abonelik ekranlarında hayalet veri olarak görünüyordu.

### Çözüm

| Katman | Değişiklik |
|--------|------------|
| **Migration** `20260701_member_cascade_delete.sql` | Yetim satırları siler; FK → `ON DELETE CASCADE`; `admin_delete_member(p_id)` RPC |
| **hydrate** | `memberScopedData.js` ile payments/tickets/activities/programs yalnızca mevcut üye ID'leri |
| **platformStats** | Gelir ve bilet istatistikleri filtrelenmiş ödemelerden |
| **Admin UI** | `/admin/members` → üye detayında **Üyeyi Sil** (admin hesabı korunur) |

### `admin_delete_member(p_id)`

- Yalnızca `is_admin()` çağırabilir
- `admin@serenova.fit` / `role = admin` silinemez
- Sıra: `DELETE members` (CASCADE → programs, payments, tickets, activities, chat_threads, chat_messages) → `DELETE auth.users`

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `supabase/migrations/20260701_member_cascade_delete.sql` | Yetim temizlik + FK + RPC |
| `src/utils/memberScopedData.js` | `memberIdSet`, `filterByMemberIds`, `filterProgramsForMembers` |
| `src/services/supabaseDb.js` | `hydrate` filtresi, `removeMember()` |
| `src/context/AppContext.jsx` | `removeMember` |
| `src/pages/admin/AdminMembersPage.jsx` | Silme UI |
| `src/data/staffApplication.js` | Profil fotoğrafı artık zorunlu değil |
| `src/components/ui/PhotoUpload.jsx` | `optional` prop |

### Uzak Supabase

Migration MCP `apply_migration` ile **Yeni Form** (`rvzksmyhsgxgrxgeabmi`) projesine **uygulandı** (2026-07-01).

---

## Son Değişiklikler (2026-07-02 — Kayıt, Loading, Bildirimler, OAuth)

### 1. Kayıt — zorunlu cinsiyet

| Dosya | Değişiklik |
|-------|------------|
| `src/data/genders.js` | `MEMBER_GENDERS` — yalnızca `female` / `male` |
| `src/components/ui/GenderSelect.jsx` | İki butonlu seçim (opt-out yok) |
| `src/pages/OnboardingPage.jsx` | Adım 1'de zorunlu cinsiyet; Stripe pending metadata'ya `gender` |
| `src/components/profile/PersonalInfoSection.jsx` | Aynı bileşen; profilde de zorunlu |
| `src/services/supabaseDb.js` | `savePendingRegistrationMetadata`, `completeOAuthMember` cinsiyet doğrulaması |
| `api/_createMemberFromPending.js` | Webhook üye oluştururken `gender` zorunlu |

### 2. Loading ekranı

| Dosya | Değişiklik |
|-------|------------|
| `src/components/ui/LoadingScreen.jsx` | Yalnızca logo (mark + spinner); metin / bounce noktaları kaldırıldı |
| `src/context/AppContext.jsx` | `updateSettings` artık tam `reloadRemote` yapmıyor → rehber turu kapanınca overlay çıkmaz |

### 3. Tarayıcı bildirimi + ses

| Dosya | Değişiklik |
|-------|------------|
| `src/utils/browserNotifications.js` | `requestNotificationPermission`, `showBrowserNotification`, `playNotificationSound` |
| `src/components/notifications/NotificationToastBridge.jsx` | Toast + ses + arka planda tarayıcı bildirimi |
| `src/pages/ProfilePage.jsx` | `soundNotifs` toggle; push açılınca izin isteği |
| `members.settings` varsayılan | `soundNotifs: true` eklendi |

### 4. Google OAuth markalama

- Kurulum: `docs/setup/OAUTH_SETUP.md` — Google OAuth consent screen **Yeni Form**, logo, `yeniform.com` domain.
- Alt satırdaki `supabase.co` metni için opsiyonel: Supabase **Custom Auth Domain** (`auth.yeniform.com`).

### 5. Program + mesaj bildirimleri (2026-07-02)

| Dosya | Görev |
|-------|-------|
| `supabase/migrations/20260712_append_member_notification.sql` | RPC `append_member_notification` — personel program/mesaj sonrası atomik bildirim |
| `src/services/memberNotifications.js` | `pushMemberNotification`, `notifyMemberProgram`, `notifyMemberChatMessage` |
| `src/services/chatDb.js` | Koç/diyetisyen mesajı → üye bildirimi |
| `src/services/supabaseDb.js` | `createProgram` → program bildirimi |
| `src/pages/NotificationsPage.jsx` | Tıklanınca `/programs`, `/messages/{role}`, `/support` |
| `src/components/notifications/NotificationItem.jsx` | `chat` tipi ikonu |

---

## 53. Kadro Başvurusu — GSB Federasyon Kademeleri (2026-07-03)

Koç başvuru formunda resmi antrenörlük alanı, GSB Antrenör Eğitimi Yönetmeliği (RG 14.12.2019) kademelerine göre yenilendi.

| Kademe | Unvan |
|--------|-------|
| 1 | Yardımcı Antrenör |
| 2 | Temel Antrenör |
| 3 | Kıdemli Antrenör |
| 4 | Başantrenör |
| 5 | Teknik Direktör |

**Form alanları (`federationCerts` JSONB):**
- Federasyon seçimi (`COACHING_FEDERATIONS` — TVGFBF öncelikli, 12 federasyon + Diğer)
- Çoklu kademe seçimi (`COACHING_LICENSE_LEVELS`)
- Birden fazla federasyon kaydı eklenebilir
- “GSB federasyon antrenörlük belgem yok” seçeneği

**Dosyalar:** `src/data/staffApplication.js` (`FederationCertEditor` veri sabitleri, `getOfficialCoachingCertLabels`), `src/components/staff/StaffApplicationUi.jsx` (`FederationCertEditor`), `src/pages/StaffApplicationPage.jsx`, `src/pages/admin/AdminApplicationsPage.jsx`, `src/utils/exportStaffApplicationCv.js`

**Geriye uyumluluk:** Eski başvurulardaki `officialCoachingCerts` dizisi admin/CV görünümünde hâlâ okunur.

---

## 54. Hareket Kütüphanesi — Video Güvenliği: Private Bucket + İmzalı URL (2026-07-04)

Önceden `exercise-videos` bucket'ı `public: true` idi; `uploadExerciseVideo()` kalıcı `getPublicUrl()` döndürüyordu ve bu URL `exercises.video_url` alanında client state'e kadar taşınıyordu — gerçek dosya adresi tarayıcıda süresiz açık kalıyordu.

**Yeni akış:** bucket private → yükleme sadece storage **path** döner → oynatma anında `api/exercise-video-url.js` (service role, `requireAuth` guard) **1 saatlik imzalı URL** üretir. Erişim kapsamı değişmedi (paket bazlı kısıtlama eklenmedi — giriş yapan her üye/koç/admin tüm kütüphaneyi görebiliyor, öncekiyle aynı).

| Dosya | Değişiklik |
|-------|------------|
| `supabase/migrations/20260704_private_exercise_videos.sql` | `exercise-videos` bucket'ı `public = false` |
| `api/exercise-video-url.js` | Yeni — `requireAuth` + service role `createSignedUrl(path, 3600)` |
| `src/services/supabaseDb.js` | `uploadExerciseVideo()` artık path döner; yeni `getExerciseVideoUrl(path)` |
| `src/context/AppContext.jsx` | `getExerciseVideoUrl` action eklendi |
| `src/components/ui/VideoPlayer.jsx` | Path/tam public URL algılar → imzalı URL çekip oynatır; YouTube linkleri değişmedi |

**Geriye uyumluluk:** Eski kayıtlardaki tam public URL'ler `VideoPlayer` içinde `/object/public/exercise-videos/` işaretinden path'e çevrilip imzalanıyor — ayrı bir veri migrasyon script'i gerekmedi. `ExerciseLibraryPage`, `AdminLibraryPage`, `CalendarPage`, `ProgramsPage` aynı `VideoPlayer` bileşenini kullandığı için tüm ekranlar otomatik korunuyor.

**Bilinen sınır:** 1600 video ölçeğinde Supabase ücretsiz depolama/bant genişliği limitleri yetersiz kalabilir (ayrı konu — gerekirse Cloudflare R2'ye taşıma değerlendirilecek).

### 54.1 Hareket kütüphanesi — filtre çubuğu UX (2026-07-07)

**Dosyalar:** `src/pages/ExerciseLibraryPage.jsx`, `src/components/library/ExerciseCategorySelect.jsx`

Üye (`/library`) ve koç (`/staff/library` → `staffMode`) aynı sayfayı kullanır. Filtre paneli mobil-first büyütüldü:

| Öğe | Davranış |
|-----|----------|
| Etiketler (`Hareket Ara`, tip, zorluk…) | `text-sm` → `sm:text-base`, uppercase |
| Arama / select | `min-h-[3rem]` (sm: `3.25rem`), `text-base` → `sm:text-lg` |
| Renk | Her alan farklı tema (`FILTER_THEMES`): arama **violet**, tip **brand/mavi**, zorluk **amber**, ekipman **teal**, konum **rose**, makine **slate** |
| Düzen | Arama **her zaman tam genişlik** (ayrı satır); filtreler alt satırda grid: `sm:` 2, `md:` 3, `lg:` 4, `xl:` 5 sütun. **Sıralama seçici kaldırıldı** (varsayılan: isim A→Z) |
| `ExerciseCategorySelect` | `max-w-xs` kaldırıldı; tam genişlik, kütüphane ile aynı boy |

Yeni filtre stili eklerken `ExerciseLibraryPage` içindeki `FILTER_THEMES` sabitlerini kullanın veya aynı ölçekleri koruyun.

### 54.2 Hareket metadata — konum ve makine (`locations`, `requiresMachine`) (2026-07-07)

**Kaynak:** `1600exercisedbpro/_metadata_enrichment/` (`CHANGELOG.md`, `classification_rules.md`, `summary.json`)

1600exercisedbpro JSON kayıtlarına eklenen alanlar Supabase `exercises` tablosuna yansıtıldı:

| Alan (JSON) | DB kolonu | Tip | Filtre UI |
|-------------|-----------|-----|-----------|
| `locations` | `locations` | `text[]` — `office`, `home`, `gym` | Konum → Ofis / Ev / Salon |
| `requiresMachine` | `requires_machine` | `boolean` | Makine → Makinalı / Makinasız |

**Dosyalar:** `supabase/migrations/20260707_exercises_location_machine.sql`, `scripts/import-exercises.mjs` (`normalizeLocations`), `src/services/exerciseLibrary.js` (`applyFilters`: `.contains('locations', …)`, `.eq('requires_machine', …)`), `src/data/exerciseTurkish.js` (Türkçe etiketler), `ExerciseLibraryPage.jsx`

**Import:** Metadata upsert mevcut kayıtları günceller — video adımı gerekmez:
```bash
npm run db:migrate
node scripts/import-exercises.mjs
```

**Hızlı backfill (yalnızca konum/makine, çeviri yok):**
```bash
npm run backfill:exercise-locations
```
Script: `scripts/backfill-exercise-locations.mjs` — tam import yerine `locations` + `requires_machine` alanlarını 1600exercisedbpro JSON'dan yazar.

**Sınıflandırma kuralları (özet):** Makinalı = `machine`, `cable`, `smith machine`, `leverage machine`, `assisted`. Konum paket + ekipman kurallarıyla atanır (ofis paketi → ofis; kablo/makine → salon; dambıl/bant → ev+salon vb.). Detay: `1600exercisedbpro/_metadata_enrichment/classification_rules.md`.

### 54.3 Programlarım — hareket video thumbnail (2026-07-07)

**Dosyalar:** `src/pages/ProgramsPage.jsx`, `src/components/library/ExerciseVideoThumbnail.jsx`

Üye `/programs` antrenman satırları (`p.entries[]`, `videoUrl` varsa):
- Sol tarafta **video ilk karesi** (56–64 px, responsive)
- Supabase path → imzalı URL + `<video preload="metadata">`; YouTube → statik thumb
- Tıklanınca mevcut `VideoPlayer` modal; hover'da `prefetchExerciseVideo`
- Video yoksa Dambıl ikonlu gradient fallback; beslenme satırları elma ikonu (değişmedi)
- Boyutlar: `xs` (36px, takvim), `sm`, `md` (varsayılan program)

### 54.4 Takvim — hareket detay modalı (2026-07-07)

**Dosyalar:** `src/pages/CalendarPage.jsx`, `src/components/library/ExerciseDetailModal.jsx`, `src/services/exerciseLibrary.js` (`fetchExerciseById`)

Gün paneli (`z-[60]`) antrenman satırı:
- Satırda yalnızca isim + saat/set; **açıklama listede yok**
- Sol **xs thumbnail** tık → `ExerciseDetailModal` (`z-[70]`) — kütüphane ile aynı rozetler + açıklama; `exerciseId` varsa DB'den metadata tamamlanır
- **İzle / Gizle** → video aynı satırda inline (`VideoPlayer`); modal açmaz

---

## 55. Genel Proje Taraması — Stripe Webhook Kopukluğu, Sosyal Giriş Sadeleştirme, Güvenlik (2026-07-05)

Uçtan uca proje taraması: veri akışları, Supabase bağlantıları, Stripe entegrasyonu, RLS/storage güvenliği ve React hook kuralları kontrol edildi.

**Kritik bulgu — Stripe webhook hiç bağlı değildi:** Stripe hesabında `/api/stripe-webhook` için **hiçbir webhook endpoint'i tanımlı değildi** ve Vercel production'da `STRIPE_WEBHOOK_SECRET` **tamamen boştu**. Sonuç: Checkout ödemesi tamamlansa bile Stripe'ın gönderdiği `checkout.session.completed` olayı hiçbir yere ulaşmıyordu → **üyelik asla aktifleşmiyordu** (ödeme alınıp paket açılmıyor olabilirdi).

Düzeltme:
1. Stripe API ile canlı modda yeni webhook endpoint oluşturuldu (`https://www.yeniform.com/api/stripe-webhook`, events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`).
2. Dönen `whsec_...` → Vercel production `STRIPE_WEBHOOK_SECRET` olarak eklendi (`vercel env add`) + `.env.local` güncellendi.
3. Production yeniden deploy edildi (env değişikliği için gerekli) → `POST /api/stripe-webhook` artık imza doğrulamasına düşüyor (önceden "yapılandırma eksik" veriyordu).
4. Doğrulama: `scripts/test-stripe-webhook.mjs` (11/11 ✅, mevcut script) + yeni `scripts/test-stripe-checkout.mjs` (canlı anahtarla gerçek Checkout session oluşturup ücret almadan `expire` ediyor, 7/7 ✅) — `npm run test:stripe` / `npm run test:stripe:checkout`.

**Sosyal giriş sadeleştirme:** Apple ve Facebook ile giriş/kayıt kaldırıldı, yalnızca Google kaldı — `SocialAuthButtons.jsx`, `oauthAuth.js` (`PROVIDERS = ['google']`), `OnboardingPage.jsx` ve `AuthCallbackPage.jsx` metinleri güncellendi. (Bu değişiklik oturumun başında zaten kısmen yapılmıştı, tarama ile tamamlandığı doğrulandı.) `docs/setup/APPLE_SETUP.md` / `FACEBOOK_SETUP.md` ileride tekrar açmak için repoda duruyor.

**React hook kuralı ihlali (gerçek çökme riski):** `StaffCollabMessagesPage.jsx` içinde rol kontrolü (`if (role !== 'coach' && role !== 'dietitian') return <Navigate />`) tüm `useState/useMemo/useEffect` çağrılarından **önce** early-return yapıyordu → `staffUser.role` async yüklenince hook sırası değişip React "Rendered fewer hooks than expected" hatası verebilirdi. Guard, tüm hook'lardan sonraya taşındı.

**Supabase güvenlik — herkese açık dosya listeleme:** `staff-application-docs` bucket'ında (kadro başvuru CV/sertifika belgeleri) `select` RLS policy'si herkese (anon dahil) bucket içeriğini **listeleme** izni veriyordu (`get_advisors` → `public_bucket_allows_listing`). Migration `20260705_restrict_staff_docs_listing.sql` ile `select` yalnızca `is_admin()` ile sınırlandı. (Bucket `public=true` kaldığı için tekil dosyaya doğrudan public URL ile erişim etkilenmedi — admin panelindeki mevcut linkler çalışmaya devam ediyor; yalnızca toplu enumerasyon kapatıldı.)

**Kontrol edilip değiştirilmeyenler (bilinçli):**
- `get_advisors` → çok sayıda `SECURITY DEFINER` RPC uyarısı (`is_admin`, `current_staff_id`, `staff_manages_member`, `submit_*` formları vb.): bunlar RLS policy'lerinin içinden çağrıldığı için `EXECUTE` yetkisi kaldırılamaz (kaldırılırsa RLS kırılır); tasarım gereği.
- `auth_leaked_password_protection` (WARN): Supabase Dashboard → Authentication → Policies üzerinden manuel açılmalı (MCP'de bu ayar için tool yok).
- Performans lint'leri (`auth_rls_initplan`, `multiple_permissive_policies`, unindexed FK'ler): → **§56'da düzeltildi** (`npm run test:rls`).
- `npm run lint` çıktısındaki ~103 hata/23 uyarı (çoğu `no-unused-vars` ve `react-hooks/set-state-in-effect` stil uyarıları) oturum öncesinden mevcuttu (HEAD'de de aynı sayı); gerçek çökme riski taşıyan tek hook hatası (yukarıdaki) düzeltildi, geri kalanı ayrı bir temizlik turu gerektiriyor.

| Dosya | Değişiklik |
|-------|------------|
| `scripts/test-stripe-checkout.mjs` | Yeni — canlı Stripe anahtarıyla Checkout session oluşturup ücret almadan temizleyen test |
| `supabase/migrations/20260705_restrict_staff_docs_listing.sql` | `staff-application-docs` select policy → admin-only |
| `src/pages/staff/StaffCollabMessagesPage.jsx` | Hook kuralı ihlali düzeltmesi (early-return hook'lardan sonraya taşındı) |
| Vercel `STRIPE_WEBHOOK_SECRET` (production) | Yeni eklendi + redeploy |
| Stripe (canlı hesap) | Yeni webhook endpoint (`we_1TpnprGm0Qpi2P1JsFF8FAV3`) |

## 56. RLS Performans Bakımı — auth_rls_initplan, Unindexed FK, Multiple Permissive Policies (2026-07-05)

§55'te ertelenen performans lint'leri (fonksiyonel hata değil, ölçek optimizasyonu) tek bir bakım turunda düzeltildi. Migration: `supabase/migrations/20260705_rls_performance_tuning.sql`. Davranış değişikliği **yok** — yalnızca sorgu planı/erişim politikası konsolidasyonu; `scripts/test-rls-policies.mjs` (`npm run test:rls`) ile 19/19 ✅ doğrulandı (anon/authenticated rolüyle gerçek Supabase sorguları: üye kendi verisini görebiliyor/başkasınınkini göremiyor, staff kendi profilini güncelleyebiliyor/başkasınınkini güncelleyemiyor, admin-only tablolara admin olmayan yazamıyor, public-read tablolar hâlâ herkese açık).

1. **`auth_rls_initplan` (22 policy):** RLS policy'lerinde doğrudan `auth.uid()` çağrıları Postgres tarafından **her satır için yeniden değerlendiriliyordu**. `(select auth.uid())` sarmalaması ile planlayıcı bunu tek seferlik `InitPlan` olarak önbelleğe alıyor (Supabase'in resmi önerisi). Etkilenen tablolar: `members`, `tickets`, `payments`, `programs`, `activities`, `chat_threads`, `chat_messages`, `staff_collab_threads`, `staff_collab_messages`, `user_presence`.
2. **Unindexed foreign keys (5 sütun):** `activities.member_id`, `payments.member_id`, `programs.member_id`, `programs.staff_id`, `tickets.member_id` için btree index eklendi — FK join/cascade delete performansı için.
3. **`multiple_permissive_policies`:** `exercises`, `plans`, `posts`, `programs`, `site_content` tablolarında `"_admin_write"` (`FOR ALL`) politikaları, aynı SELECT erişimini zaten sağlayan ayrı bir politikayla çakışıyordu (her sorguda 2 politika birden değerlendiriliyordu). `FOR ALL` politikaları `INSERT`/`UPDATE`/`DELETE`'e daraltıldı (davranış aynı — SELECT kapsamı zaten var olan politika tarafından karşılanıyordu, doğrulandı). `staff` tablosunda admin-update + self-update tek `staff_update` politikasında OR mantığıyla birleştirildi. `user_presence`'ta 3 ayrı SELECT-veren politika (`admin_select`, `chat_peers`, `self`) tek `user_presence_select` politikasında birleştirildi, yazma işlemleri `insert`/`update`/`delete` olarak ayrıldı. `site_content`'te admin-insert vs. üye-başarı-hikayesi-insert çakışması **bilinçli olarak korundu** (iki farklı rol/koşul, güvenli birleştirme karmaşıklığa değmiyor — kalan tek `multiple_permissive_policies` uyarısı budur).
4. `supabase/setup.sql` yeni kurulumların da aynı optimize edilmiş politikalarla başlaması için güncellendi (not: `chat_threads`/`staff_collab_*` tabloları zaten `setup.sql`'de tanımlı değildi — bu tablolar yalnızca migration'larda var, önceden beri var olan bir senkron farkı, bu turun kapsamı dışında).

**Kontrol edilip değiştirilmeyen:** `auth_leaked_password_protection` — kullanıcı ayrı olarak Dashboard üzerinden hallediyor.

| Dosya | Değişiklik |
|-------|------------|
| `supabase/migrations/20260705_rls_performance_tuning.sql` | Yeni — 22 policy `auth.uid()` initPlan sarmalaması, 5 index, 6 tabloda multiple-permissive-policy konsolidasyonu |
| `supabase/setup.sql` | Aynı politika/index setiyle senkronize edildi |
| `scripts/test-rls-policies.mjs` | Yeni — anon/authenticated rolüyle RLS davranış regresyon testi (`npm run test:rls`) |
| `package.json` | `test:rls` script'i eklendi |

## 57. Kayıt Sırasında Sahte "Giriş Yapılmış" Header'ı, Çıkış Loading'i, Paket Süre Gösterimi (2026-07-05)

Kullanıcı üç ayrı hata/eksiklik bildirdi: (1) paket seçip Stripe'a yönlendirilirken header sağ üstte sanki kayıt tamamlanmış gibi "Profil · İsim" görünüyordu, (2) çıkış (logout) sırasında loading göstergesi çalışmıyordu, (3) paketlerin süre/gün bilgisi hiçbir yerde görünmüyordu (yalnızca Basic'in 48 saatlik deneme banner'ı vardı).

**1. Header sahte "giriş yapılmış" görünümü:** Kök neden gerçek bir bug değil, bilinçli bir tasarım kararının yan etkisiyle ortaya çıkan kafa karıştırıcı bir ara durumdu — "Ödemeye Geç" tıklanınca `ensureAuthForRegistration` (`supabaseDb.js`) Stripe'a gitmeden **önce** gerçek bir Supabase auth session açıyor (webhook'un ödeme sonrası paketi doğru kullanıcıya bağlayabilmesi için), ama `members` satırı yalnızca webhook'ta oluşuyor. `PublicLayout` header'ı ise yalnızca session varlığına (`isAuthenticated`) bakıp "Profil · İsim" gösteriyordu — ödeme/kayıt tamamlanmadan. Çözüm: `PublicLayout.jsx`'te `isFullyRegistered = isAuthenticated && (isAdmin || isStaff || hasRegisteredMember(user))` türetildi ve header'daki tüm "giriş yapılmış" gösterimleri (masaüstü/mobil menü + footer "Destek" linki) bu değere bağlandı. Admin/staff etkilenmez (onlar `members` tablosunu kullanmaz); gerçek kayıtlı üyeler de etkilenmez (`hasRegisteredMember` zaten true). Yalnızca "session var ama üye satırı henüz yok" ara durumunda header artık misafir gibi davranıyor (ödeme/kayıt tamamlanınca otomatik "Profil"e döner).

**2. Çıkış (logout) loading eksikliği:** `handleLogout` (`ProfilePage.jsx`) `logout()`'u `await` etmeden çağırıp hemen yönlendirme yapıyordu; ayrıca arka planda sessiz çalışan bir auth-listener aynı anda `hydrate()` tetikleyip `syncing` state'ine hiç dokunmadan durumu güncelliyordu — var olan global `syncing` overlay'i bu akışta neredeyse hiç görünmüyordu. Çözüm: `AppContext.jsx`'e özel bir `loggingOut` state eklendi (`logout()` fonksiyonu artık bunu `true`/`false` yapıyor), ve tüm çıkış butonları (`ProfilePage`, `Sidebar`, `StaffShell`, `AdminShell`, `PanelMobileMenu`) bu state'i kullanarak buton üzerinde spinner gösterip butonu devre dışı bırakıyor, `logout()` tamamlanana kadar bekliyor.

**3. Paket süre/gün gösterimi:** `membershipPlans.js`'e `DURATION_OPTIONS` içine `days` alanı (Aylık=30, 3 Aylık=90, 6 Aylık=180 — sabit yaklaşık değerler, yalnızca UI gösterimi içindir; gerçek bitiş tarihi hesaplaması `premiumMembership.js`'te takvim ayına göre değişmeden kalır) ve `getPlanDurationLabel(plan)` yardımcı fonksiyonu eklendi (ücretsiz → "Süresiz", Doktor → "Tek seferlik", diğerleri → "30 gün"). Bu, `MembershipDurationPicker` (onboarding süre seçici — her seçenek altında "X gün" etiketi), `PricingCard` (landing fiyat kartları) ve `MembershipPlanCard` (onboarding/karşılaştırma sayfası plan kartları) bileşenlerine eklendi. Yan bulgu: `PricingCard`'da Doktor paketi için de yanlışlıkla "3 ve 6 aylık seçenekler de mevcut" yazıyordu (Doktor'un böyle bir seçeneği yok) — bu da düzeltildi.

| Dosya | Değişiklik |
|-------|------------|
| `src/components/layout/PublicLayout.jsx` | `isFullyRegistered` türetildi, header/footer "giriş yapılmış" gösterimleri buna bağlandı |
| `src/context/AppContext.jsx` | `loggingOut` state eklendi, `logout()` bunu yönetiyor |
| `src/pages/ProfilePage.jsx` | `handleLogout` artık `await` ediyor; çıkış butonunda spinner |
| `src/components/layout/Sidebar.jsx`, `StaffShell.jsx`, `AdminShell.jsx`, `AppShell.jsx`, `PanelMobileMenu.jsx` | `loggingOut` prop'u iletildi, çıkış butonlarında spinner + disabled |
| `src/data/membershipPlans.js` | `DURATION_OPTIONS[].days`, `getDurationDays()`, `getPlanDurationLabel()` eklendi |
| `src/components/membership/MembershipDurationPicker.jsx` | Her süre seçeneğinin altında gün sayısı gösteriliyor |
| `src/components/landing/PricingCard.jsx` | Süre etiketi eklendi; Doktor için "3/6 aylık" metni düzeltildi |
| `src/components/membership/MembershipPlanCard.jsx` | Fiyatın altında süre etiketi eklendi |

## 58. Premium Yönetimi — Tüm Üyelerin Paketi Değiştirilebilir (2026-07-05)

`AdminPremiumPage` (Admin → Premium Yönetimi) yalnızca zaten ücretli pakete sahip üyeleri (`isPaidMembership`) listeliyordu — ücretsiz (Basic) üyeler listede hiç görünmüyordu, dolayısıyla admin panelinden bir üyeyi ücretsizden ücretli pakete yükseltmek bu sayfadan mümkün değildi (backend fonksiyonu `adminUpdatePremiumMembership` zaten `membership: 'free'` dahil her planı destekliyordu, eksik olan yalnızca UI'daki filtreydi).

Değişiklik: Üye listesi artık **tüm üyeleri** gösteriyor. Ücretsiz üyeler kartta "Ücretsiz" rozetiyle ve sadeleştirilmiş bir görünümle ("Henüz paket yok — yükseltmek için tıklayın") listeleniyor; tıklanınca aynı `EditPremiumModal` açılıyor ve admin doğrudan paket/süre/koç-diyetisyen ataması yapıp üyeyi ücretli bir plana geçirebiliyor.

**Filtreler:** Tüm üyeler · Premium (ücretli) · Ücretsiz (Basic) · Aktif · Atama eksik · 7 gün içinde biten.

**İstatistik şeridi:** Premium · Ücretsiz · Atama Eksik · Sona Eriyor (`grid-cols-2 sm:grid-cols-4`).

**Backend değişmedi:** `adminUpdatePremiumMembership(memberId, options)` — `options.membership`, `durationMonths`, `addPackage`, `extendDays`, `setRemainingDays`, staff atamaları ve manuel seanslar aynı API ile kaydediliyor.

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/admin/AdminPremiumPage.jsx` | Üye listesi filtresi `isPaidMembership` zorunluluğu kaldırıldı (tüm üyeler); `PremiumMemberCard`'a ücretsiz üye için sadeleştirilmiş görünüm eklendi; filtre seçenekleri ve istatistik şeridi güncellendi |

**Commit:** `f8959c32`

---

## §59 Tam Proje Audit Düzeltmeleri (2026-07-06)

Kapsamlı kod–rehber tutarlılık taraması sonrası uygulanan düzeltmeler:

| Paket | Konu | Dosyalar / Not |
|-------|------|----------------|
| **C** | Doktor personel paneli + video call | `staffRoles.js` (3-yollu helper'lar), `videoCallSession.js`, `StaffOverviewPage`, `StaffClientsPage`, `StaffVideoPanel`, `StaffAppointmentRow`, `VideoCallPage`, `ChatThreadView`, `StaffMessagesPage` |
| **B2** | Kan tahlili entitlement | `membershipPlans.js` `PACKAGE_BY_PLAN`: diyet/spor/vip → `doctorMeetingsPerMonth: 1`; senkron: `api/stripe-webhook.js`, `api/_memberPackages.js` |
| **H** | Doktor mesajı | `chatAccess.js` `getMemberChatContacts` → `assignedDoctorId` |
| **L** | Legacy `?plan=` güvenliği | `OnboardingPage.jsx` `LEGACY_PLAN_MAP` + fiyat 0 reddi |
| **D** | Çoklu paket union | `memberPackages.js`: `resolveMemberEntitlements`, `memberHas*Access`, `LEGACY_PLAN_RANK` |
| **A** | Ödeme UI | `PaymentManagementPage.jsx`: sahte kart kaldırıldı; Stripe Checkout mesajı |
| **G** | Admin finans birleşimi | `/admin/payments` = grafik + ücretli üyeler; `/admin/subscriptions` → redirect |
| **B** | Video gate | `ExerciseLibraryPage`: `memberHasFullVideoAccess`; koç/staff `staffMode`. Program listesinde thumb: `ExerciseVideoThumbnail` (`ProgramsPage`) |

**Personel rol yardımcıları:** `normalizeStaffRole`, `sessionsKeyForRole`, `sessionTypeForRole`, `panelTitleForRole` — ikili `coach ? X : Y` yerine kullanılmalı.

**Self-service randevu:** Migration `20260704_staff_availability_booking.sql` + `SessionBooker` — §11 "randevu kaldırıldı" ifadesi artık geçersiz.

**Dosya envanteri (yaklaşık):** 55 sayfa · 112+ component · 43 migration · 25 `api/` dosyası (12 endpoint + 13 `_` helper).

**Entitlement API (üye):** `memberHasPhotoCalorieAccess(member)`, `memberHasManualCalorieAccess(member)`, `memberHasFullVideoAccess(member)` — tek `membership` string yerine `activePackages` union.

---

## §60 UX Navigasyon, GA4 ve SEO (2026-07-06)

| Konu | Değişiklik |
|------|------------|
| **Üye menüsü** | `src/config/memberNav.js` — tek kaynak; Sidebar + `PanelMobileMenu` |
| **Sağlık testi** | `/health-test` sayfası; kayıt/tutorial sonrası otomatik modal kaldırıldı; tamamlanmamışsa menüde `!` badge |
| **Randevular** | `/schedule?tab=coach\|dietitian\|doctor` — `AppointmentsPage.jsx`; eski `/schedule/coach` → redirect |
| **Üyelik mobil** | `MembershipComparisonAccordion.jsx` — accordion; VIP önerilen + 6 ay tasarruf rozeti |
| **Hero video** | `HeroBackgroundVideo.jsx` — `layout="cover"` (varsayılan, tam bölüm hero) veya `layout="inline"` (kart/vitrin); poster + `prefers-reduced-motion` / `prefers-reduced-data` |
| **GA4** | `ga4Loader.js` Consent Mode; `api/ga4-report.js` admin Data API; `AdminAnalyticsPage` platform hunisi |
| **Blog SEO** | `blogSlug.js` — slug URL; sitemap slug; UUID ile geriye dönük `findBlogPost` |

**Üye rota güncellemesi (§6 / §36.8):** `/health-test` (+ `:sectionId`, `/finish`), `/schedule` (tab parametreli). Eski schedule sayfaları redirect için tutulur; rota `App.jsx` redirect kullanır.

---

## §61 Sağlık Hub, Kütüphane Filtreleri, Program Thumbnail, Personel UI (2026-07-07)

| Konu | Değişiklik | Dosyalar |
|------|------------|----------|
| **Sağlık testi hub** | Kategori hub tam genişlik; grid **2 / 3 / 4** sütun; rotalar §1445 | `HealthTestHub.jsx`, `HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`, `healthTest.js` |
| **Kütüphane filtreleri** | Konum + makine metadata; renkli filtre çubuğu; **sıralama UI kaldırıldı** | §54.1–54.2, `ExerciseLibraryPage.jsx`, `exerciseLibrary.js`, migration `20260707_*` |
| **Program thumbnail** | Antrenman satırında sol video ilk karesi | §54.3, `ExerciseVideoThumbnail.jsx`, `ProgramsPage.jsx` |
| **Üye panel scroll** | Sayfa değişince `main[data-panel-scroll]` en üste (`ScrollToTop` + `AppShell`) | `ScrollToTop.jsx`, `AppShell.jsx` |
| **Üye menü tipografi** | Sidebar + mobil menü: `text-[15px]`→`text-base`, semibold, daha büyük ikon | `Sidebar.jsx`, `PanelMobileMenu.jsx` |
| **Personel sağlık** | Otomatik `healthAnalysis` gizlendi (personel); admin'de açık | `MemberHealthProfilePanel.jsx`, `MemberHealthInsights.jsx`, `StaffClientsPage.jsx` — §38.3.1 |
| **Ekip mesajları** | Inbox/thread: **personel adı** birincil; alt `Danışan adına: {üye}` | `StaffCollabMessagesPage.jsx`, `AdminMessagesPage.jsx` (collab sekmesi), `StaffCollabChatView.jsx` |
| **Blog uzunluğu** | Min ~1350, hedef ~1800 karakter; token 4096 | `api/_ai-prompts.js`, `api/ai-blog-generate.js` — commit `1e264dfa` |
| **Sağlık testi birleştirme** | `diet_family` → `diet_health`; `diet_history` → `diet_extra`; `diet_activity` koç paketinde gizlenir (`skipWhenCoach`) | `healthTestDietitianSections.js`, `healthTest.js` |
| **Takvim hareket UX** | Satırda açıklama yok; xs thumbnail → `ExerciseDetailModal` (`z-[70]`, `fetchExerciseById`); İzle satır içi video | `CalendarPage.jsx`, `ExerciseDetailModal.jsx`, `Modal.jsx` (`zClass`) |
| **Kurumsal wellness video** | `CorporatePage` vitrininde `HeroBackgroundVideo layout="inline"` — `cover` modu kart içinde 0 yükseklik veriyordu (2026-07-07 düzeltme) | `CorporatePage.jsx`, `HeroBackgroundVideo.jsx`, `index.css` (`.corporate-video-*`) |

**Rehber–kod uyum kontrolü (2026-07-07):**
- ✅ Rota haritası §6: `/health-test/*`, `/schedule`, `/staff/collab-messages`
- ✅ `ExerciseCardMedia` referansı kaldırıldı → `ExerciseVideoThumbnail` / `ExerciseLibraryPage` (§59)
- ✅ Egzersiz import: `npm run backfill:exercise-locations` — `.cursor/rules/exercise-import.mdc`
- ⚠️ `CoachSchedulePage` / `DietitianSchedulePage` repoda var; üye UI birleşik `AppointmentsPage` — eski sayfalar legacy/redirect dışı kullanılmıyor

**Commit referansları:** `1e264dfa` (sağlık hub + blog), `e2997bca` (kütüphane filtre + personel UI)
