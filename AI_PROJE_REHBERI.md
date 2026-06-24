# Yeni Form (donusum-programi) — Yapay Zeka Proje Rehberi

> **Bu dosyanın amacı:** Başka bir yapay zekaya veya geliştiriciye projeyi satır satır aramadan anlatabilmek.  
> **Proje kökü:** `c:\Users\opas2\OneDrive\Desktop\Serenova-F-t\`  
> **Vercel proje:** `topalfatih7-3924s-projects/serenova-f-t`  
> **Marka adı:** Yeni Form (`src/config/brand.js`)  
> **Son güncelleme:** 2026-06-24 (§35: stabilizasyon — callback bug, çökme hataları, 27 orphan dosya + git temizliği)

---

## Nasıl Kullanılır (AI için)

1. Önce **§2 Mimari Özet** ve **§3 Veri Akışı** bölümlerini oku.
2. Bir özellik arıyorsan **§5 Sistemler (Detaylı)** tablosuna bak.
3. Bir dosya arıyorsan **§7 Tam Dosya Envanteri** listesine bak.
4. Veritabanı değişikliği için **§4 Veritabanı** ve `supabase/` SQL dosyalarına bak.
5. Rota/sayfa eşlemesi için **§6 Rota Haritası** bölümüne bak.
6. Son değişiklikler için **§30–34 Değişiklik Günlüğü** bölümlerine bak.
7. Ortam değişkenleri ve auth durumu için **§34.4**; telefon SMS (Twilio) yeniden açılınca **§34.5** bölümüne bak.

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
  │     └─ Giriş varsa: members, programs, tickets, activities, payments, membership_requests
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
  └─► Daily.co WebRTC (VideoCallPage → useDailyCall)
```

### Rol çözümleme (`supabaseDb.js` → `roleForEmail`)

| Rol | Koşul | Yönlendirme (LoginPage) |
|-----|-------|-------------------------|
| **admin** | E-posta = `admin@serenova.fit` | `/admin` |
| **staff** | E-posta `staff` tablosunda kayıtlı | `/staff` |
| **member** | Diğer tüm auth kullanıcıları | `/dashboard` |

Admin e-postası üç yerde senkron olmalı:
- `src/config/brand.js` → `ADMIN_CREDENTIALS.email`
- `supabase/schema.sql` → `is_admin()` fonksiyonu
- `supabase/create_admin.sql` → admin kullanıcı oluşturma

---

## 4. Veritabanı (Supabase)

### SQL dosyaları (`supabase/`)

**Artık TEK dosya var:** `setup.sql` — idempotent, kendi kendine yeten tertemiz kurulum.
Eski `schema.sql` + `migrate_*.sql` + `seed.sql` + `create_admin.sql` dosyaları silindi
(hepsi `setup.sql` içinde birleştirildi).

| Dosya | Ne yapar | Ne zaman çalıştırılır |
|-------|----------|----------------------|
| `setup.sql` | Eklentiler, tüm tablolar, RLS, trigger, RPC'ler, storage bucket, varsayılan paketler ve onaylı admin kullanıcısı | İlk/temiz kurulum — Supabase SQL Editor |
| `migrations/*.sql` | Artımlı değişiklikler (staff_applications, corporate_applications, contact_inquiries, vb.) | `supabase migration` veya SQL Editor |

> **`custom_foods` kaldırıldı** (2026-06-24) — kalori chat artık bu tabloya yazmıyor. Migration: `20260624_corporate_contact_cleanup.sql`.


**Çalıştırma:** Supabase Dashboard → SQL Editor → `supabase/setup.sql` içeriğini yapıştır → Run.
Tekrar çalıştırmak güvenlidir (her şey `if not exists` / `on conflict` / `create or replace`).
Admin: `admin@serenova.fit` / `Serenova2026!`.

### Tablolar

| Tablo | Amaç | RLS özeti |
|-------|------|-----------|
| `members` | Üyeler; detaylar `data` JSONB | Üye kendi; staff atanan; admin hepsi |
| `staff` | Koç/diyetisyen/doktor kadrosu | Herkese okuma; admin yazma |
| `programs` | Antrenman/beslenme programları | Üye/staff/admin |
| `posts` | Blog yazıları | Yayınlanan herkese; admin yazar |
| `tickets` | Destek talepleri + mesajlar | Üye kendi; admin hepsi |
| `activities` | Admin aktivite akışı | Yalnız admin okur |
| `payments` | Ödeme kayıtları | Üye kendi; admin hepsi |
| `site_content` | testimonial, faq, success_story | Herkese okuma; admin yazar |
| `exercises` | Hareket kütüphanesi | Herkese okuma; admin yazar |
| `membership_requests` | dondur/iptal/yenile talepleri | Üye oluşturur; admin onaylar |
| `plans` | Üyelik paketleri | Herkese okuma; admin yazar |
| `staff_applications` | Koç/diyetisyen kadro başvuruları | RPC ile herkes insert; admin okur/onaylar |
| `corporate_applications` | Kurumsal wellness başvuruları | RPC ile herkes insert; admin okur/günceller |
| `contact_inquiries` | Landing “Bize Ulaşın” mesajları | RPC ile herkes insert; admin okur/günceller |
| `user_presence` | Video görüşme çevrimiçi durumu | `presenceService.js` (supabaseDb dışı) |

**Kaldırılan tablolar:** `custom_foods` (kullanılmıyordu, 2026-06-24 migration ile drop).

### Storage

- Bucket: **`exercise-videos`** — herkese açık okuma; admin yükleme
- Yükleme: `supabaseDb.uploadExerciseVideo()` → `AdminLibraryPage`

### RPC fonksiyonları

| Fonksiyon | Amaç |
|-----------|------|
| `admin_upsert_staff(...)` | Staff + auth.users oluşturma/güncelleme |
| `admin_delete_staff(p_id)` | Staff + auth silme |
| `is_admin()`, `is_staff()`, `current_email()` | RLS yardımcıları |
| `handle_new_user()` trigger | Kayıtta `members` satırı açar |
| `submit_staff_application(...)` | Kadro başvurusu (anon + authenticated) |
| `submit_corporate_application(...)` | Kurumsal başvuru (anon + authenticated) |
| `submit_contact_inquiry(...)` | İletişim formu kaydı (anon + authenticated) |

### `members` tablosu sütunları vs JSONB

**Sütunlarda (ilişkisel):**
- `id`, `email`, `name`, `role`, `membership`, `membership_status`
- `assigned_coach_id`, `assigned_dietitian_id`

**JSONB `data` içinde (uygulama tarafı):**
Profil alanları (boy, kilo, hedefler, şehir, telefon…), `packageConfig`, `supportSchedule`, `coachSessions`, `dietitianSessions`, `healthAnalysis`, `notifications`, `tasks`, `progress` (weight, workouts, **meals**, mood), **`completedActivities`** (öğün + aktivite tamamlama), `settings`, `premiumStartedAt`, `premiumExpiresAt`, `pauseUntil`, fotoğraf URL'leri vb.

**Mapping:** `supabaseDb.js` satır 19–57
- `memberToRow()` — sütun + JSONB ayırır
- `rowToMember()` — birleştirir; `assignedCoachId` hem sütundan hem JSONB'den okunur

### Seans objesi yapısı (`coachSessions` / `dietitianSessions`)

Üretim: `src/services/supportSessions.js` → `generateSupportSessions()`

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
| Şifre sıfırlama | `ForgotPasswordPage.jsx` → `AuthCallbackPage` → `ResetPasswordPage.jsx` | PKCE; redirect `/auth/callback?next=reset-password` |
| Auth callback | `src/pages/auth/AuthCallbackPage.jsx` | E-posta/telefon doğrulama linkleri, recovery yönlendirme |
| İsteğe bağlı doğrulama | `src/services/authVerification.js` + `VerificationSection.jsx` | Profilden e-posta/telefon; kayıtta zorunlu değil |
| Kayıt oturum açma | `api/auth-unlock-signup.js` + `ensureAuthForSignup()` | Confirm email açıkken bile kayıt sonrası giriş |
| Şifre kuralları | `src/services/password.js` | `PASSWORD_RULES`, `isPasswordValid` |

### 5.2 Merkezi State (AppContext)

**Dosya:** `src/context/AppContext.jsx`

**State (useApp() ile erişilir):**
- Kullanıcı: `user`, `membership`, `membershipStatus`, `isAuthenticated`, `isAdmin`, `isStaff`
- Seanslar: `coachSessions`, `dietitianSessions`
- İçerik: `testimonials`, `faqs`, `successStories`, `posts`, `exercises`, `plans`
- Admin: `platform`, `adminStats`, `membershipBreakdown`, `monthlyGrowth`, `sessionStats`
- Başvurular (admin hydrate): `staffApplications`, `corporateApplications`, `contactInquiries`

**Aksiyonlar (tam liste):**
`login`, `logout`, `register`, `registerWithPayment`, `registerWithPlan`, `savePlan`, `changePlan` (mevcut üyenin planını değiştirir — yeni kayıt OLUŞTURMAZ), `processPremiumPayment`, `upgradeToPremium`, `savePackage`, `saveSupportSchedule`, `pauseMembership`, `resumeMembership`, `cancelMembership`, `renewMembership`, `adminPatchMember`, `adminUpdatePremium`, `addStaff`, `editStaff`, `removeStaff`, `createProgram`, `addPost`, `editPost`, `removePost`, `createTicket`, `setTicketStatus`, `sendTicketReply`, `uploadExerciseVideo`, `addExercise`, `editExercise`, `removeExercise`, `createMembershipRequest`, `resolveMembershipRequest`, `resolveStaffApplication`, `resolveCorporateApplication`, `updateContactInquiryStatus`, `addContent`, `editContent`, `removeContent`, `submitSuccessStory`, `markNotificationRead`, `markAllNotificationsRead`, `rescheduleSession`, `cancelSession`, `toggleTask`, `toggleMealCompletion`, `updateProfile`, `updateSettings`, `refresh`

### 5.3 Kayıt ve Onboarding

| Adım | Dosya | Ne yapar |
|------|-------|----------|
| 7 adımlı kayıt | `src/pages/OnboardingPage.jsx` | Profil → hedefler → paket → randevu → ödeme |
| Kural tabanlı sağlık analizi | `src/services/aiAnalysis.js` | BMI, kalori, beslenme ve antrenman önerileri — kural tabanlı hesaplama |
| Sağlık hesapları | `src/services/health.js` | `calculateBMI`, `bmiCategory`, etiket sabitleri |
| Test ödeme (fallback) | `src/config/testPayment.js` + `src/components/payment/PaymentForm.jsx` | Sahte kart (4242…) doğrulama — Stripe kapalıyken kullanılır |
| **Stripe ödeme (gerçek)** | `api/stripe-checkout.js`, `api/stripe-webhook.js`, `src/services/stripePayment.js` | `VITE_STRIPE_ENABLED=true` → Stripe Checkout. Bkz. §22 + `STRIPE_SETUP.md` |
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
| Üyelik talepleri | `src/pages/admin/AdminRequestsPage.jsx` — freeze/cancel/resume/renew |
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

### 5.5 Paket Oluşturma ve Randevu Üretimi

| Ne | Nerede |
|----|--------|
| Paket fiyat hesabı | `src/services/packagePricing.js` — `calculatePackagePrice`, `getRecommendedPackage` |
| Randevu slot üretimi | `src/services/supportSessions.js` — `generateSupportSessions()` |
| Koç/diyetisyen otomatik atama | `src/services/staffAssignment.js` — `applyStaffAssignments`, `findAvailableStaff` |
| Randevu planlama UI | `src/components/package/SupportScheduler.jsx`, `WeeklyAvailability.jsx` |
| Kaldırıldı | `PackageBuilder.jsx`, `PackageBuilderPage.jsx`, `PackageSummaryCard.jsx`, `NumberSelector.jsx` silindi (`/builder` → `/membership` redirect korunuyor) |

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
| İletişim formu | `src/services/contactForm.js` → `api/contact.js` |
| Landing form UI | `src/components/landing/ContactSection.jsx` |
| Kurulum rehberi | `TELEGRAM_SETUP.md` |

**Güvenlik:** `TELEGRAM_BOT_TOKEN` yalnızca Vercel sunucusunda; tarayıcıya gitmez.

### 5.8 Üye Paneli

| Sayfa | Rota | Dosya | Ana işlev |
|-------|------|-------|-----------|
| Dashboard | `/dashboard` | `DashboardPage.jsx` | Sağlık analizi, kilo/antrenman/**öğün** grafikleri, görevler, yaklaşan seanslar |
| Takvim | `/calendar` | `CalendarPage.jsx` | Yan yana **Diyet Listesi | Koç Programı**; öğün bazlı onay (`toggleMealCompletion`) |
| Koç randevuları | `/schedule/coach` | `CoachSchedulePage.jsx` | Liste, erteleme, iptal |
| Diyetisyen randevuları | `/schedule/dietitian` | `DietitianSchedulePage.jsx` | Liste, erteleme, iptal |
| Programlar | `/programs` | `ProgramsPage.jsx` | Atanan programlar |
| Egzersiz kütüphanesi | `/library` | `ExerciseLibraryPage.jsx` | Arama, filtre, video |
| Kalori hesaplayıcı | `/calorie` | `CalorieCalculatorPage.jsx` | **Paket bazlı erişim:** Basic erişemez, ücretli paketler manuel giriş, diyet/spor/kurucu/vip fotoğraflı analiz |
| Bildirimler | `/notifications` | `NotificationsPage.jsx` | Okundu işaretleme |
| Destek | `/support` | `SupportPage.jsx` | Ticket oluşturma/thread |
| Profil | `/profile` | `ProfilePage.jsx` | Profil, üyelik, atanan koç/diyetisyen |
| Ödeme (mock) | `/profile/payments` | `PaymentManagementPage.jsx` | Kayıtlı kartlar, ödeme geçmişi (demo) |
| Video görüşme | `/call/:type/:id` | `VideoCallPage.jsx` | Daily.co |

**Layout:** `AppShell` → `Sidebar` + `TopBar` + `MobileNav`

### 5.9 Personel Paneli

| Sayfa | Rota | Dosya |
|-------|------|-------|
| Genel bakış | `/staff` | `staff/StaffOverviewPage.jsx` — danışan sayısı, haftalık randevular |
| Danışanlar | `/staff/clients` | `staff/StaffClientsPage.jsx` — program/liste oluşturma, randevu yönetimi |
| Programlar (koç) | `/staff/programs` | `staff/StaffProgramsPage.jsx` — diyetisyen `/staff/lists`'e yönlendirilir |
| Listeler (diyetisyen) | `/staff/lists` | `staff/StaffListsPage.jsx` — beslenme listeleri özeti |
| Kütüphane | `/staff/library` | `StaffLibraryGate.jsx` — diyetisyen → `/staff/lists`; koç → `ExerciseLibraryPage` |
| Ödeme (mock) | `/staff/payments` | `payments/PaymentManagementPage.jsx` |
| Video görüşme | `/staff/call/:type/:id` | `VideoCallPage.jsx` |

**Layout:** `StaffShell` — `src/components/layout/StaffShell.jsx`

**Rol yardımcıları:** `src/utils/staffRoles.js` — `coach`, `dietitian`, `doctor`

### 5.10 Admin Paneli

| Sayfa | Rota | Dosya | Tablolar |
|-------|------|-------|----------|
| Genel bakış | `/admin` | `AdminOverviewPage.jsx` | activities, tickets, members |
| Üyeler | `/admin/members` | `AdminMembersPage.jsx` | members |
| Planlar | `/admin/plans` | `AdminPlansPage.jsx` | plans |
| Premium | `/admin/premium` | `AdminPremiumPage.jsx` | members |
| Talepler | `/admin/requests` | `AdminRequestsPage.jsx` | membership_requests |
| Başvurular | `/admin/applications` | `AdminApplicationsPage.jsx` | staff_applications, corporate_applications, contact_inquiries |
| Kütüphane | `/admin/library` | `AdminLibraryPage.jsx` | exercises, storage |
| Kadro | `/admin/staff` | `AdminStaffPage.jsx` | staff, RPC |
| Blog | `/admin/blog` | `AdminBlogPage.jsx` | posts |
| İçerik | `/admin/content` | `AdminContentPage.jsx` | site_content (başarı hikâyeleri: Tümü/Yayında/İncelemede) |
| Abonelikler | `/admin/subscriptions` | `AdminSubscriptionsPage.jsx` | payments |
| Ödeme (mock UI) | `/admin/payments` | `PaymentManagementPage.jsx` | mockPayments.js |
| Seanslar | `/admin/sessions` | `AdminSessionsPage.jsx` | members.data |
| Destek | `/admin/support` | `AdminSupportPage.jsx` | tickets |
| Analitik | `/admin/analytics` | `AdminAnalyticsPage.jsx` | members, payments |
| Aktivite | `/admin/activity` | `AdminActivityPage.jsx` | activities |

**Manuel seans ekleme:** `src/components/admin/ManualSessionEditor.jsx`

**Layout:** `AdminShell` — `src/components/layout/AdminShell.jsx`

### 5.11 Genel (Public) Sayfalar

| Sayfa | Rota | Dosya |
|-------|------|-------|
| Ana sayfa | `/` | `LandingPage.jsx` — hero, fiyat, SSS, kadro, yorumlar, iletişim |
| Üyelik karşılaştırma | `/membership` | `MembershipComparisonPage.jsx` |
| Kayıt | `/onboarding` | `OnboardingPage.jsx` |
| Başarı hikâyeleri | `/stories` | `SuccessStoriesPage.jsx` |
| Blog listesi | `/blog` | `BlogPage.jsx` |
| Blog yazısı | `/blog/:id` | `BlogPostPage.jsx` |
| Kadro profili | `/team/:id` | `StaffProfilePage.jsx` |
| Kadro listeleri | `/team/coaches`, `/team/dietitians`, `/team/doctors` | `TeamListPage.jsx` (role prop) |
| Kadro başvurusu | `/team/apply` | `StaffApplicationPage.jsx` |
| Kurumsal tanıtım | `/corporate` | `CorporatePage.jsx` |
| Kurumsal başvuru | `/corporate/apply` | `CorporateApplicationPage.jsx` |
| 404 | `*` | `NotFoundPage.jsx` |

**Layout:** `PublicLayout.jsx` — header/footer, `scrollToContactSection` (`src/utils/scrollToContact.js`)

### 5.12 İstatistik ve Platform Verisi

**Dosya:** `src/services/platformStats.js`

| Fonksiyon | Ne hesaplar |
|-----------|-------------|
| `getCurrentMember(db)` | Oturum açmış üye |
| `getCurrentStaff(db)` | Oturum açmış personel |
| `computeAdminStats(db)` | KPI: üye sayısı, gelir, açık ticket vb. |
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
/schedule/coach      → CoachSchedulePage
/schedule/dietitian  → DietitianSchedulePage
/notifications       → NotificationsPage
/support             → SupportPage
/programs            → ProgramsPage
/library             → ExerciseLibraryPage
/profile             → ProfilePage
/profile/payments    → PaymentManagementPage (member, mock)
```

### Personel (RequireAuth staff)
```
/staff/call/:sessionType/:sessionId  → VideoCallPage (staff)
/staff               → StaffOverviewPage
/staff/clients       → StaffClientsPage
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
/admin/premium       → AdminPremiumPage
/admin/requests      → AdminRequestsPage (üyelik talepleri)
/admin/applications  → AdminApplicationsPage (kadro + kurumsal + iletişim)
/admin/library       → AdminLibraryPage
/admin/staff         → AdminStaffPage
/admin/blog          → AdminBlogPage
/admin/content       → AdminContentPage (başarı hikâyeleri filtreleri)
/admin/subscriptions → AdminSubscriptionsPage
/admin/payments      → PaymentManagementPage (admin, mock)
/admin/sessions      → AdminSessionsPage
/admin/support       → AdminSupportPage
/admin/analytics     → AdminAnalyticsPage
/admin/activity      → AdminActivityPage
```

---

## 7. Tam Dosya Envanteri

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
| `SUPABASE_SETUP.md` | Supabase kurulum rehberi |
| `TELEGRAM_SETUP.md` | Telegram bot kurulum rehberi |

### 7.2 API (`api/`)

| Dosya | HTTP | Amaç |
|-------|------|------|
| `telegram-notify.js` | POST | Giriş/kayıt Telegram bildirimleri |
| `auth-unlock-signup.js` | POST | Kayıt sonrası e-posta onayı (service role) |
| `contact.js` | POST | Bize Ulaşın → Telegram (ikincil; birincil kayıt Supabase `contact_inquiries`) |
| `sitemap.js` | GET | Dinamik XML sitemap (`/sitemap.xml` rewrite) |

### 7.3 Supabase SQL (`supabase/`)

| Dosya | Amaç |
|-------|------|
| `setup.sql` | **Tek dosya** tertemiz kurulum (şema + RLS + RPC + storage + paketler + admin) |
| `migrations/20260623_staff_applications.sql` | Kadro başvuruları tablosu + RPC |
| `migrations/20260624_corporate_contact_cleanup.sql` | Kurumsal + iletişim tabloları; `custom_foods` drop |

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
| `staffAssignment.js` | `applyStaffAssignments`, `findAvailableStaff` | ✅ |
| `supportSessions.js` | `generateSupportSessions` | ✅ |
| `packagePricing.js` | `calculatePackagePrice`, `getRecommendedPackage` | ✅ |
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

### 7.9 Data (`src/data/`)

| Dosya | Export |
|-------|--------|
| `membershipPlans.js` | `ALL_PLANS`, `FREE_PLAN`, `GUMUS_PLAN`, `isPaidMembership`, `getDefaultPackageForPlan` |
| `turkeyCities.js` | `TURKEY_CITIES`, `CITY_NAMES`, `getDistricts` |
| `blogPosts.js` | `BLOG_CATEGORIES`, `DEFAULT_POSTS` (Supabase boşsa fallback) |
| `countryCodes.js` | `COUNTRY_CODES`, `DEFAULT_COUNTRY_ISO`, `getCountry`, `isValidNationalNumber`, `formatNationalNumber`, `toE164` |
| `healthTest.js` | `HEALTH_SECTIONS`, `EMPTY_HEALTH_TEST`, `getApplicableSections`, `isSectionComplete`, `describeHealthTest` |
| `staffApplication.js` | Kadro başvuru form şeması, validasyon, `STAFF_APPLICATION_STEPS` |
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
CoachSchedulePage.jsx
DietitianSchedulePage.jsx
NotificationsPage.jsx
SupportPage.jsx
ProfilePage.jsx
ProgramsPage.jsx
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
admin/AdminPremiumPage.jsx
admin/AdminRequestsPage.jsx
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

**Onboarding:** `HealthTestStep` (soru-soru, çok adımlı sağlık testi)

**Package:** `SupportScheduler`, `WeeklyAvailability`, `AvailabilityView`

**Admin:** `ManualSessionEditor`

**Calendar:** `SessionCard`, `CalendarView`

**Dashboard:** `ProgressChart` (WeightChart, WorkoutChart, MealChart, MoodChart)

**Notifications:** `NotificationItem`

**Payment:** `PaymentForm`

**Support:** `SupportForm`, `TicketThread`

**Social:** `SuccessStoryCard`

**UI:** `BrandLogo`, `MembershipBadge`, `StatsCard`, `Modal`, `LoadingScreen`, `ConfigErrorScreen`, `EmptyState`, `Skeleton`, `FormField`, `PhoneField` (ülke kodlu telefon girişi), `PhotoUpload`, `Stepper`, `RangeSelector`, `ToggleGroup`, `DisclaimerBox`, `ConsentBanner`, `OnboardingTutorial`, `VideoPlayer`

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
| `editStaff(id, patch)` | 553 | Kadro düzenle |
| `removeStaff(id)` | 571 | Kadro sil |
| `addPost/editPost/removePost` | 576–603 | Blog CRUD |
| `addContent/editContent/removeContent` | 605–619 | Site içerik CRUD |
| `submitSuccessStory(...)` | 621 | Başarı hikâyesi gönder |
| `uploadExerciseVideo(file)` | 638 | Storage yükleme |
| `addExercise/editExercise/removeExercise` | 649–667 | Egzersiz CRUD |
| `createMembershipRequest(...)` | 670 | Üyelik talebi |
| `resolveMembershipRequest(...)` | 679 | Talep onay/red |
| `submitStaffApplication(form)` | — | Kadro başvurusu RPC |
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
| Başvurular admin | `src/pages/admin/AdminApplicationsPage.jsx` (Kadro / Kurumsal / İletişim) |
| Kadro başvuru formu | `src/pages/StaffApplicationPage.jsx`, `src/data/staffApplication.js` |
| Kurumsal başvuru formu | `src/pages/CorporateApplicationPage.jsx`, `src/data/corporateApplication.js` |
| Bize Ulaşın DB kaydı | `src/services/contactForm.js` → `submitContactInquiry` |
| Öğün tamamlama + grafik | `src/utils/memberProgress.js`, `DashboardPage.jsx`, `CalendarPage.jsx` |
| Diyetisyen listeler | `StaffListsPage.jsx`, `StaffShell.jsx` (kütüphane yok) |
| Ödeme UI (mock) | `src/pages/payments/PaymentManagementPage.jsx`, `src/data/mockPayments.js` |
| Menü linki (staff) | `src/components/layout/StaffShell.jsx` |
| Marka adı/logo | `src/config/brand.js`, `src/components/ui/BrandLogo.jsx` |
| Sosyal medya (SEO sameAs) | `src/config/brand.js` → `socialUrls` |
| Admin e-postası | `src/config/brand.js` + `supabase/schema.sql` is_admin() |
| Üyelik planları (fallback) | `src/data/membershipPlans.js` — `FREE_PLAN` (Basic), `GUMUS_PLAN`, `ALTIN_PLAN`, `PLATINUM_PLAN` |
| Üyelik planları (canlı) | Admin panel `/admin/plans` veya `plans` tablosu |
| Paket yapısı (Basic→Platinum) | `src/data/membershipPlans.js` satırlar 10–90 |
| Kalori hesaplayıcı erişim kontrolü | `src/pages/CalorieCalculatorPage.jsx` satırlar 137–142, 225–253 |
| Video görüşme ayarları | `src/config/videoCall.js` + `.env` |
| Telegram bildirim metni | `api/telegram-notify.js` |
| Veritabanı şeması | `supabase/schema.sql` + migrate dosyaları |
| Yeni API endpoint | `api/` klasörü + `vercel.json` |
| Renk/stil tema | `src/index.css` @theme bloğu |
| Toast mesajları | Sayfa içinde `useToast()` |
| Seans üretim mantığı | `src/services/supportSessions.js` |
| Koç atama mantığı | `src/services/staffAssignment.js` |
| Kural tabanlı sağlık analizi | `src/services/aiAnalysis.js` — `generateHealthAnalysis()` |
| Landing üye/çevrimiçi gösterim eşikleri | `src/utils/displayPlatformStats.js`, `src/hooks/usePlatformDisplayStats.js`, `LiveActiveCounter.jsx`, `LandingPage.jsx` |
| Kayıt akışı (2 adım) | `src/pages/OnboardingPage.jsx` |
| Sağlık testi (panel sonrası) | `HealthTestWidget.jsx`, `HealthTestPrompt.jsx`, `HealthTestFlow.jsx` |
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

1. **Ödeme: Stripe altyapısı eklendi (opsiyonel)** — `VITE_STRIPE_ENABLED=true` ise gerçek Stripe Checkout akışı çalışır (`api/stripe-checkout.js` + `api/stripe-webhook.js`). Bayrak kapalıyken `PaymentForm` + `testPayment.js` simülasyonu devrede kalır. Kurulum: `STRIPE_SETUP.md`.
2. **Kural tabanlı analiz** — `aiAnalysis.js` kural tabanlı hesaplama yapar (YZ/LLM yok).
3. **localDb.js silindi** (2026-06-24) — diskten kaldırıldı; tek veri kaynağı `supabaseDb.js`.
4. **PackageBuilder dosyaları silindi** — `/builder` → `/membership` redirect korunuyor.
5. **Ödeme Yönetimi sayfası mock** — `PaymentManagementPage` demo veri kullanır; gerçek `payments` tablosu Stripe webhook ile dolar (§22).
6. **Şifre sıfırlama** — §34 ile Supabase Auth + PKCE bağlandı; Supabase redirect URL'leri ve `SUPABASE_SERVICE_ROLE_KEY` gerekir.
7. **Üyelik talepleri UI** — `membership_requests` API hazır; üye tarafında talep oluşturma UI henüz eksik (Support/Profil’e eklenecek).
8. **Daily REST API kullanılmıyor** — odalar deterministik URL ile açılır.
9. **Seanslar JSONB'de** — ayrı `sessions` tablosu yok.
10. **Doctor rolü** — frontend + DB destekler.
11. **RLS koç erişimi** — `assigned_coach_id` / `assigned_dietitian_id` sütunlarına bağlı.
12. **Sistem programları** — `staffId` mutlaka `null` olmalı (`'system'` UUID FK hatası verir); `createProgram` filtreler.

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
| Dokümantasyon | 4 (README, SUPABASE_SETUP, TELEGRAM_SETUP, bu dosya) |

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

**Seçilen sağlayıcı:** Google **Gemini 2.0 Flash** — en ucuz vision destekli
model + ücretsiz katman (15 istek/dk, 1500/gün, kart gerekmez). Kurulum: `AI_SETUP.md`.

### İki AI Entegrasyon Noktası

| Özellik | Endpoint | Frontend Servis | Kullanım Yeri |
|---------|----------|-----------------|----------------|
| **Fotoğraflı Kalori Tespiti** | `api/ai-food-vision.js` | `src/services/aiVision.js` | `CalorieCalculatorPage.jsx` (Platinum) |
| **AI Destekli Beslenme Notu** | `api/ai-nutrition.js` | `src/services/aiNutrition.js` | (hazır altyapı, opsiyonel) |

### Yeni Dosyalar

```
api/_gemini.js          → Gemini API çağrısı + JSON ayrıştırma (paylaşılan yardımcı)
api/_ai-prompts.js      → Tüm promptlar tek yerde (maliyet optimize)
api/ai-food-vision.js   → Fotoğraf → kalori serverless endpoint
api/ai-nutrition.js     → Profil → beslenme notu serverless endpoint
src/services/aiVision.js     → Görsel küçültme + /api/ai-food-vision çağrısı
src/services/aiNutrition.js  → /api/ai-nutrition çağrısı
AI_SETUP.md             → Adım adım kurulum rehberi
```

### Ortam Değişkenleri (Vercel)

| Değişken | Açıklama | VITE_ ön eki? |
|----------|----------|:-------------:|
| `GEMINI_API_KEY` | Gemini API anahtarı (GİZLİ) | ❌ Hayır |
| `GEMINI_MODEL` | Model adı (varsayılan `gemini-2.0-flash`) | ❌ Hayır |
| `VITE_AI_VISION_ENABLED` | Foto analizini arayüzde aç (`true`) | ✅ Evet |
| `VITE_AI_NUTRITION_ENABLED` | Beslenme notunu arayüzde aç (`true`) | ✅ Evet |

### Maliyet Optimizasyonu (otomatik)
- Görseller gönderilmeden önce 1024px + JPEG %80'e küçültülür.
- Model'den doğrudan JSON istenir (`responseMimeType`), gereksiz metin yok.
- `maxOutputTokens` düşük (vision 800, beslenme 500).
- Promptlar kısa. Analiz başına ~$0.0003 (ücretsiz katmanda bedava).

### Fallback Davranışı
- `isAiVisionEnabled()` → `VITE_AI_VISION_ENABLED !== 'true'` ise demo preset.
- AI çağrısı hata verirse (limit, anahtar, ağ) → arayüz demo presete düşer,
  kullanıcıya bilgi toast'ı gösterilir. **Hiçbir akış kırılmaz.**

### Dashboard Değişikliği
- `HealthAnalysisPanel` en altındaki **"Planları İncele" (Premium CTA)** kaldırıldı.

---

## 17. Son Güncelleme Özeti (2026-06-19 — UI/UX + Plan + Temizlik)

### 1. Tek Dosya Supabase Kurulumu
- `supabase/setup.sql` tek, idempotent dosya. Eski `schema.sql`, `migrate_*.sql` (4 adet), `seed.sql`, `create_admin.sql` **silindi**.
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
- Setup detayları hâlâ: `SUPABASE_SETUP.md`, `TELEGRAM_SETUP.md`, `AI_SETUP.md`, `VIDEO_SETUP.md`.

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
- **Adım 1 — Hesap:** Yalnızca ad soyad, e-posta, telefon, şifre (+ tekrar). Mobile-first, tek ekrana sığacak kompakt düzen (`min-h-[100dvh]`, `max-w-lg`).
- **Adım 2 — Üyelik:** Plan seçimi (+ ücretli planlarda ödeme modalı).
- Kaldırıldı (kayıttan): yaş, cinsiyet, şehir, ölçüler, fotoğraf, hedefler, spor/beslenme tercihleri, sağlık testi, sağlık onayı.
- Kayıt sonrası otomatik program/analiz **hemen oluşturulmaz** — profil + sağlık testi tamamlanınca `memberHealthSync.js` devreye girer.

### 2. Sağlık testi — panel sonrası akış
- Rehber turu (`OnboardingTutorial`) kapanınca `onComplete` → `HealthTestPrompt` açılır.
- **Testi Şimdi Çöz** → `HealthTestFlow` (soru-soru + onay adımı) → `healthTest`, `healthAck`, `disclaimer` DB'ye kaydedilir.
- **Sonra Hatırlat** → popup kapanır, animasyonlu **Sağlık Testini Tamamla** FAB butonu (`HealthTestWidget.jsx`).
- Test tamamlanınca FAB gösterilmez.
- Bileşenler: `HealthTestPrompt.jsx`, `HealthTestFlow.jsx`, `HealthTestWidget.jsx`.

### 3. Kişisel bilgiler — profil sayfası
- `PersonalInfoSection.jsx`: yaş, cinsiyet, şehir/ilçe, ölçüler, fotoğraf, hedefler, spor seviyesi, beslenme tercihleri.
- Düzenle modalından güncellenir; üyelik seçimi **yok** (kayıtta yapılır).
- Kayıt sonrası `syncMemberHealthAssets()` — sağlık testi + profil yeterliyse Basic için otomatik analiz + program oluşturur.

### 4. Yeni servis
- `src/services/memberHealthSync.js` — `profileReadyForAnalysis`, `createAutoProgramsForMember`, `syncMemberHealthAssets`.

### Değiştirilen/Eklenen Dosyalar (§20)
- `src/pages/OnboardingPage.jsx` (yeniden yazıldı — 2 adım)
- `src/components/onboarding/HealthTestPrompt.jsx` (yeni)
- `src/components/onboarding/HealthTestFlow.jsx` (yeni)
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
   → success: /dashboard?payment=success (kayıt) | /profile?payment=success (değişim)
   → cancel:  /onboarding?payment=cancelled
```

### Dosyalar
| Dosya | Görev |
|-------|-------|
| `api/_stripe.js` | Stripe istemcisi, `CURRENCY=try`, `PLAN_FALLBACK` yedek fiyatlar, `toMinorUnits` |
| `api/_supabaseAdmin.js` | Service-role Supabase istemcisi (RLS atlar) |
| `api/stripe-checkout.js` | POST: token doğrula → fiyatı `plans` tablosundan/yedekten al → Checkout oturumu (metadata: memberId, planId, planPrice, durationWeeks, flow) |
| `api/stripe-webhook.js` | Ham gövde + imza doğrulama (`bodyParser:false`), üyelik aktifleştirme, idempotent |
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

### Gerekli env (özet — detay `STRIPE_SETUP.md`)
| Değişken | Kapsam |
|----------|--------|
| `STRIPE_SECRET_KEY` | Sunucu (gizli) |
| `STRIPE_WEBHOOK_SECRET` | Sunucu (gizli) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sunucu (gizli) |
| `SUPABASE_URL` | Sunucu (VITE_SUPABASE_URL yedek) |
| `APP_URL` | Sunucu (opsiyonel) |
| `VITE_STRIPE_ENABLED` | İstemci (on/off) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | İstemci (opsiyonel) |

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
| `SEO_SETUP.md` | Search Console + sitemap + OG kurulum rehberi |
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
- `SEO_SETUP.md`, `YAPILACAKLAR.md` — canlı denetim sonuçları

Detaylı kurulum: `SEO_SETUP.md`

---

## 25. Kadro & Blog Profil Genişletmesi (2026-06-23)

### staff.data JSONB şeması (yeni alanlar)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `title` | string | Unvan (ör. Uzman Diyetisyen) |
| `specialty` | string | Ana uzmanlık (kart başlığı) |
| `specialties` | string[] | Uzmanlık etiketleri |
| `headline` | string | Kısa slogan (liste kartları) |
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

- `CalendarPage` — tarih + haftalık girdi desteği.
- **Sadece bugün** program detayı açılır; diğer günler kilitli (`Lock` ikonu).
- Hareket videosu **aynı sayfada** genişletilir (`İzle` / `Gizle`), ayrı modal yok.
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
| `src/pages/CalendarPage.jsx` | Kilitli günler + inline video |
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
- `SEO_SETUP.md`, `YAPILACAKLAR.md`, §24 güncellendi

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

### Kullanıcıdan beklenen (detay: `SEO_SETUP.md` §9)

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

**Başvuru formu alanları:**

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
/forgot-password → resetPasswordForEmail(redirectTo=/auth/callback?next=reset-password)
→ kullanıcı e-postadaki linke tıklar → /auth/callback → /reset-password
→ updateUser({ password })
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
| `api/auth.js` | Birleşik auth: unlock-signup, email-send, email-confirm |
| `api/_appUrl.js` | Sunucu tarafı kanonik site URL (`APP_URL`) |
| `src/services/authVerification.js` | API üzerinden bağlantı gönder, `confirmEmailVerificationByEvt` |
| `src/components/profile/VerificationSection.jsx` | E-posta UI; telefon `VITE_PHONE_VERIFY_ENABLED` ile gizli |
| `src/components/auth/AuthRedirectHandler.jsx` | `/?code=` / `#error=` → `/auth/callback` yönlendirme |
| `src/pages/auth/AuthCallbackPage.jsx` | evt + PKCE doğrulama, hata/otp_expired UI |
| `src/pages/auth/ResetPasswordPage.jsx` | PKCE oturum bekleme + yeni şifre |
| `src/pages/auth/ForgotPasswordPage.jsx` | `redirectTo` → `/auth/callback?next=reset-password` |
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

- **15 tablo** aktif ve kod ile eşleşiyor: `members`, `staff`, `programs`, `posts`, `tickets`, `activities`, `payments`, `site_content`, `exercises`, `membership_requests`, `plans`, `user_presence`, `staff_applications`, `corporate_applications`, `contact_inquiries`.
- `plans` tablosu doğrulandı: aktif paketler `free, eko, diyet, spor, kurucu, vip`; eskiler `gumus, altin, platinum` `is_active=false`.
- `localStorage` kullanımlarının tümü yerinde (FAB konumu, tutorial/banner dismiss, remember-me) — DB'ye taşınması gereken veri yok.
- Güvenlik advisor uyarıları (`get_advisors`): çoğu kasıtlı public `SECURITY DEFINER` RPC (`submit_*`, `phone_in_use`). **Aksiyon önerisi:** Supabase Dashboard → Auth → "Leaked password protection"ı açın (kod gerektirmez).

### 35.8 Bilinçli placeholder (kopuk bağlantı değil)

`src/pages/payments/PaymentManagementPage.jsx` (member/staff/admin `*/payments` rotaları) `data/mockPayments.js` ile çalışır. Sayfanın üstünde net **"mock (demo) veri — gerçek Stripe entegrasyonu sonraki aşamada"** banner'ı vardır; alt başlıklarda "(demo veri)" yazar. Gerçek `payments` tablosu admin istatistiklerinde kullanılır. Kayıtlı kartlar (Stripe) ve personel hakedişi için gerçek veri kaynağı henüz yok → planlı gelecek işi.

### 35.9 Değiştirilen/Silinen dosyalar (§35)

**Düzeltildi:** `src/pages/auth/AuthCallbackPage.jsx`, `src/pages/admin/AdminSessionsPage.jsx`, `src/pages/TeamListPage.jsx`, `src/pages/CalendarPage.jsx`, `src/pages/SupportPage.jsx`, `src/pages/admin/AdminContentPage.jsx`, `src/services/aiAnalysis.js`, `src/components/dashboard/DraggableHealthFab.jsx`, `api/_gemini.js` + 5 sayfada kullanılmayan import temizliği.

**Silindi (18 kod + 7 asset + 2 API = 27 dosya):** §35.3 ve §35.4 listeleri.

**Git:** `node_modules/`, `dist/` takibi kaldırıldı.

