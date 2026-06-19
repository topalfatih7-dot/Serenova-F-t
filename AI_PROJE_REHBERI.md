# Yeni Form (donusum-programi) — Yapay Zeka Proje Rehberi

> **Bu dosyanın amacı:** Başka bir yapay zekaya veya geliştiriciye projeyi satır satır aramadan anlatabilmek.  
> **Proje kökü:** `c:\Users\opas2\OneDrive\Desktop\Yazilim\donusum-programi\`  
> **Marka adı:** Yeni Form (`src/config/brand.js`)  
> **Son güncelleme:** 2026-06-19 (Bkz. §17: tek-dosya Supabase kurulumu, plan değiştirme, profil yeniden tasarımı, kadro sayfaları, ülke kodu, gradient bölümler, ölü kod temizliği)

---

## Nasıl Kullanılır (AI için)

1. Önce **§2 Mimari Özet** ve **§3 Veri Akışı** bölümlerini oku.
2. Bir özellik arıyorsan **§5 Sistemler (Detaylı)** tablosuna bak.
3. Bir dosya arıyorsan **§7 Tam Dosya Envanteri** listesine bak.
4. Veritabanı değişikliği için **§4 Veritabanı** ve `supabase/` SQL dosyalarına bak.
5. Rota/sayfa eşlemesi için **§6 Rota Haritası** bölümüne bak.

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
  │
  ├─► AppContext → useApp() → tüm sayfalar
  │
  ├─► POST /api/telegram-notify (giriş/kayıt bildirimi)
  │
  ├─► POST /api/contact (Bize Ulaşın formu)
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
| `setup.sql` | Eklentiler, tüm tablolar (custom_foods dahil), RLS, trigger, RPC'ler, storage bucket, varsayılan paketler ve onaylı admin kullanıcısı | İlk/temiz kurulum — Supabase SQL Editor'a yapıştırıp bir kez çalıştır |

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
| `plans` | Üyelik paketleri (migrate) | Herkese okuma; admin yazar |

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

### `members` tablosu sütunları vs JSONB

**Sütunlarda (ilişkisel):**
- `id`, `email`, `name`, `role`, `membership`, `membership_status`
- `assigned_coach_id`, `assigned_dietitian_id`

**JSONB `data` içinde (uygulama tarafı):**
Profil alanları (boy, kilo, hedefler, şehir, telefon…), `packageConfig`, `supportSchedule`, `coachSessions`, `dietitianSessions`, `healthAnalysis`, `notifications`, `tasks`, `progress`, `settings`, `premiumStartedAt`, `premiumExpiresAt`, `pauseUntil`, fotoğraf URL'leri vb.

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
| Şifre sıfırlama | `src/pages/auth/ForgotPasswordPage.jsx` | Supabase reset e-postası |
| Şifre kuralları | `src/services/password.js` | `PASSWORD_RULES`, `isPasswordValid` |

### 5.2 Merkezi State (AppContext)

**Dosya:** `src/context/AppContext.jsx`

**State (useApp() ile erişilir):**
- Kullanıcı: `user`, `membership`, `membershipStatus`, `isAuthenticated`, `isAdmin`, `isStaff`
- Seanslar: `coachSessions`, `dietitianSessions`
- İçerik: `testimonials`, `faqs`, `successStories`, `posts`, `exercises`, `plans`
- Admin: `platform`, `adminStats`, `membershipBreakdown`, `monthlyGrowth`, `sessionStats`

**Aksiyonlar (tam liste):**
`login`, `logout`, `register`, `registerWithPayment`, `registerWithPlan`, `savePlan`, `changePlan` (mevcut üyenin planını değiştirir — yeni kayıt OLUŞTURMAZ), `processPremiumPayment`, `upgradeToPremium`, `savePackage`, `saveSupportSchedule`, `pauseMembership`, `resumeMembership`, `cancelMembership`, `renewMembership`, `adminPatchMember`, `adminUpdatePremium`, `addStaff`, `editStaff`, `removeStaff`, `createProgram`, `addPost`, `editPost`, `removePost`, `createTicket`, `setTicketStatus`, `sendTicketReply`, `uploadExerciseVideo`, `addExercise`, `editExercise`, `removeExercise`, `createMembershipRequest`, `resolveMembershipRequest`, `addContent`, `editContent`, `removeContent`, `submitSuccessStory`, `markNotificationRead`, `markAllNotificationsRead`, `rescheduleSession`, `cancelSession`, `toggleTask`, `updateProfile`, `updateSettings`, `refresh`

### 5.3 Kayıt ve Onboarding

| Adım | Dosya | Ne yapar |
|------|-------|----------|
| 7 adımlı kayıt | `src/pages/OnboardingPage.jsx` | Profil → hedefler → paket → randevu → ödeme |
| Kural tabanlı sağlık analizi | `src/services/aiAnalysis.js` | BMI, kalori, beslenme ve antrenman önerileri — kural tabanlı hesaplama |
| Sağlık hesapları | `src/services/health.js` | `calculateBMI`, `bmiCategory`, etiket sabitleri |
| Test ödeme | `src/config/testPayment.js` + `src/components/payment/PaymentForm.jsx` | Sahte kart doğrulama — **gerçek ödeme gateway yok** |
| Kayıt akışları | `supabaseDb.js` L460–535 | `register`, `registerWithPayment`, `registerWithPlan`, `processPremiumPayment` |
| Türkiye illeri | `src/data/turkeyCities.js` | 81 il/ilçe listesi |

### 5.4 Üyelik Planları

| Ne | Nerede |
|----|--------|
| Fallback plan tanımları | `src/data/membershipPlans.js` — `FREE`, `GUMUS`, `ALTIN`, `PLATINUM`, `ALL_PLANS` |
| DB planları | `plans` tablosu → `supabaseDb.getPlans()` / `upsertPlan()` |
| Plan karşılaştırma sayfası | `src/pages/MembershipComparisonPage.jsx` |
| Admin plan düzenleme | `src/pages/admin/AdminPlansPage.jsx` |
| Premium üyelik mantığı | `src/services/premiumMembership.js` — süre hesabı, uzatma |
| Üyelik talepleri | `src/pages/admin/AdminRequestsPage.jsx` — freeze/cancel/resume/renew |

**Plan ID'leri ve yapıları:**
- `free` (Basic): Otomatik sağlık analizi + Otomatik beslenme/antrenman programları + Temel video erişimi
- `gumus` (Gümüş): Basic özellikler + Manuel kalori hesaplama + Haftada 1 koç + Aylık 1 diyetisyen
- `altin` (Altın): Gümüş özellikler + Haftada 2 koç + Aylık 2 diyetisyen + Öncelikli destek
- `platinum` (Platinum): Altın özellikler + **Fotoğraflı kalori tespiti** + Haftada 3 koç + Haftada 1 diyetisyen + 7/24 VIP
- `premium` (Eski): Geriye dönük uyumluluk için `altin` ile eşdeğer

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
| Dashboard | `/dashboard` | `DashboardPage.jsx` | Kişisel sağlık analizi, grafikler, görevler, yaklaşan seanslar |
| Takvim | `/calendar` | `CalendarPage.jsx` | Birleşik takvim (`CalendarView`, `SessionCard`) |
| Koç randevuları | `/schedule/coach` | `CoachSchedulePage.jsx` | Liste, erteleme, iptal |
| Diyetisyen randevuları | `/schedule/dietitian` | `DietitianSchedulePage.jsx` | Liste, erteleme, iptal |
| Programlar | `/programs` | `ProgramsPage.jsx` | Atanan programlar |
| Egzersiz kütüphanesi | `/library` | `ExerciseLibraryPage.jsx` | Arama, filtre, video |
| Kalori hesaplayıcı | `/calorie` | `CalorieCalculatorPage.jsx` | **Paket bazlı erişim:** Basic erişemez, Gümüş/Altın manuel giriş, Platinum fotoğraflı analiz |
| Bildirimler | `/notifications` | `NotificationsPage.jsx` | Okundu işaretleme |
| Destek | `/support` | `SupportPage.jsx` | Ticket oluşturma/thread |
| Profil | `/profile` | `ProfilePage.jsx` | Profil, üyelik, atanan koç/diyetisyen |
| Video görüşme | `/call/:type/:id` | `VideoCallPage.jsx` | Daily.co |

**Layout:** `AppShell` → `Sidebar` + `TopBar` + `MobileNav`

### 5.9 Personel Paneli

| Sayfa | Rota | Dosya |
|-------|------|-------|
| Genel bakış | `/staff` | `staff/StaffOverviewPage.jsx` — danışan sayısı, haftalık randevular |
| Danışanlar | `/staff/clients` | `staff/StaffClientsPage.jsx` — program oluşturma, randevu yönetimi |
| Programlar | `/staff/programs` | `staff/StaffProgramsPage.jsx` |
| Kütüphane | `/staff/library` | `ExerciseLibraryPage.jsx` (paylaşımlı) |
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
| Kütüphane | `/admin/library` | `AdminLibraryPage.jsx` | exercises, storage |
| Kadro | `/admin/staff` | `AdminStaffPage.jsx` | staff, RPC |
| Blog | `/admin/blog` | `AdminBlogPage.jsx` | posts |
| İçerik | `/admin/content` | `AdminContentPage.jsx` | site_content |
| Abonelikler | `/admin/subscriptions` | `AdminSubscriptionsPage.jsx` | payments |
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
/onboarding          → OnboardingPage
/membership          → MembershipComparisonPage
/builder             → redirect /membership
/stories             → SuccessStoriesPage
/blog                → BlogPage
/blog/:id            → BlogPostPage
/team/:id            → StaffProfilePage
*                    → NotFoundPage
```

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
```

### Personel (RequireAuth staff)
```
/staff/call/:sessionType/:sessionId  → VideoCallPage (staff)
/staff               → StaffOverviewPage
/staff/clients       → StaffClientsPage
/staff/programs      → StaffProgramsPage
/staff/library       → ExerciseLibraryPage
```

### Admin (RequireAuth admin)
```
/admin               → AdminOverviewPage
/admin/members       → AdminMembersPage
/admin/plans         → AdminPlansPage
/admin/premium       → AdminPremiumPage
/admin/requests      → AdminRequestsPage
/admin/library       → AdminLibraryPage
/admin/staff         → AdminStaffPage
/admin/blog          → AdminBlogPage
/admin/content       → AdminContentPage
/admin/subscriptions → AdminSubscriptionsPage
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
| `contact.js` | POST | Bize Ulaşın formu → Telegram |

### 7.3 Supabase SQL (`supabase/`)

| Dosya | Amaç |
|-------|------|
| `setup.sql` | **Tek dosya** tertemiz kurulum (şema + RLS + RPC + storage + paketler + admin) |

### 7.4 Context (`src/context/`)

| Dosya | Export |
|-------|--------|
| `AppContext.jsx` | `AppProvider`, `useApp` |
| `ToastContext.jsx` | `ToastProvider`, `useToast` |

### 7.5 Config (`src/config/`)

| Dosya | Export |
|-------|--------|
| `brand.js` | `BRAND`, `ADMIN_CREDENTIALS` |
| `videoCall.js` | `VIDEO_CALL_CONFIG`, `buildRoomUrl`, `memberCallPath`, `staffCallPath`, `SESSION_TYPE_META` |
| `testPayment.js` | `TEST_CARD`, `validateTestPayment` |

### 7.6 Services (`src/services/`)

| Dosya | Ana export/fonksiyonlar | Kullanılıyor mu |
|-------|-------------------------|-----------------|
| `supabaseClient.js` | `supabase`, `isSupabaseEnabled`, `syncAutoRefresh` | ✅ |
| `supabaseDb.js` | `hydrate`, `login`, `logout`, `changeMemberPlan`, tüm CRUD | ✅ Ana veri katmanı |
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
| `contactForm.js` | `submitContactForm` | ✅ |
| `videoCallSession.js` | `resolveCallContext`, `canJoinSession` | ✅ |

### 7.7 Hooks (`src/hooks/`)

| Dosya | Export |
|-------|--------|
| `useDailyCall.js` | `useDailyCall`, `attachTrack` |
| `useRelativeTimeTick.js` | default (30 sn re-render) |
| `useLocalStorage.js` | `useLocalStorage` |

### 7.8 Utils (`src/utils/`)

| Dosya | Export |
|-------|--------|
| `formatDuration.js` | `formatDurationTr`, `formatMinutesTr` |
| `relativeTime.js` | `formatRelativeTime`, `RELATIVE_TIME_TICK_MS` |
| `staffRoles.js` | `STAFF_ROLES`, `normalizeStaffRole`, `staffRoleLabel` |
| `scrollToContact.js` | `CONTACT_SECTION_ID`, `scrollToContactSection` |

### 7.9 Data (`src/data/`)

| Dosya | Export |
|-------|--------|
| `membershipPlans.js` | `ALL_PLANS`, `FREE_PLAN`, `GUMUS_PLAN`, `isPaidMembership`, `getDefaultPackageForPlan` |
| `turkeyCities.js` | `TURKEY_CITIES`, `CITY_NAMES`, `getDistricts` |
| `blogPosts.js` | `BLOG_CATEGORIES`, `DEFAULT_POSTS` (Supabase boşsa fallback) |
| `countryCodes.js` | `COUNTRY_CODES`, `DEFAULT_COUNTRY_ISO`, `getCountry`, `isValidNationalNumber`, `formatNationalNumber`, `toE164` |
| `healthTest.js` | `HEALTH_SECTIONS`, `EMPTY_HEALTH_TEST`, `getApplicableSections`, `isSectionComplete`, `describeHealthTest` |

### 7.10 Pages (`src/pages/`) — 39 dosya

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
NotFoundPage.jsx
auth/LoginPage.jsx
auth/ForgotPasswordPage.jsx
staff/StaffOverviewPage.jsx
staff/StaffClientsPage.jsx
staff/StaffProgramsPage.jsx
admin/AdminOverviewPage.jsx
admin/AdminMembersPage.jsx
admin/AdminPlansPage.jsx
admin/AdminPremiumPage.jsx
admin/AdminRequestsPage.jsx
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

### 7.11 Components (`src/components/`) — 49 dosya

**Layout:** `PublicLayout`, `AppShell`, `AdminShell`, `StaffShell`, `Sidebar`, `TopBar`, `MobileNav`, `PanelMobileMenu`

**Auth:** `RequireAuth`

**Landing:** `PricingCard`, `FAQAccordion`, `TeamCarousel`, `TestimonialCarousel`, `WhyUsSection`, `ContactSection`

**Video:** `VideoCallUI`, `VideoJoinLink`, `StaffVideoPanel` (personel için görüntülü görüşme alanı)

**Onboarding:** `HealthTestStep` (soru-soru, çok adımlı sağlık testi)

**Package:** `SupportScheduler`, `WeeklyAvailability`, `AvailabilityView`

**Admin:** `ManualSessionEditor`

**Calendar:** `SessionCard`, `CalendarView`

**Dashboard:** `ProgressChart` (WeightChart, WorkoutChart, MoodChart)

**Notifications:** `NotificationItem`

**Payment:** `PaymentForm`

**Support:** `SupportForm`, `TicketThread`

**Social:** `SuccessStoryCard`

**UI:** `BrandLogo`, `MembershipBadge`, `StatsCard`, `Modal`, `LoadingScreen`, `ConfigErrorScreen`, `EmptyState`, `Skeleton`, `FormField`, `PhoneField` (ülke kodlu telefon girişi), `PhotoUpload`, `Stepper`, `RangeSelector`, `ToggleGroup`, `DisclaimerBox`, `ConsentBanner`, `OnboardingTutorial`, `VideoPlayer`

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
| `VITE_SUPABASE_PUBLISHABLE_KEY` veya `VITE_SUPABASE_ANON_KEY` | İstemci | Supabase anon key |
| `TELEGRAM_BOT_TOKEN` | Sunucu | Telegram Bot |
| `TELEGRAM_CHAT_ID` | Sunucu | Giriş/kayıt bildirimleri |
| `TELEGRAM_CONTACT_CHAT_ID` | Sunucu | İletişim formu |
| `TELEGRAM_NOTIFY_SECRET` / `VITE_TELEGRAM_NOTIFY_SECRET` | Sunucu + istemci | API spam koruması |
| `VITE_DAILY_DOMAIN` | İstemci | Daily.co subdomain |
| `VITE_DAILY_ROOM_PREFIX` | İstemci | Oda adı öneki (varsayılan: donusum) |
| `VITE_DAILY_API_KEY` | İstemci (opsiyonel) | İleride REST API |
| `VITE_VIDEO_JOIN_MINUTES_BEFORE` | İstemci | Randevu penceresi başlangıcı (dk) |
| `VITE_VIDEO_JOIN_MINUTES_AFTER` | İstemci | Randevu penceresi bitişi (dk) |

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
| `createProgram(data)` | 697 | Program oluştur |
| `createTicket(...)` | 737 | Destek talebi |
| `setTicketStatus/sendTicketReply` | 753–769 | Ticket işlemleri |
| `adminUpdatePremiumMembership(...)` | 769 | Admin premium yönetimi |

---

## 10. "Nerede Ne Değiştirilir" Hızlı Tablo

| İstediğin değişiklik | Dosya |
|----------------------|-------|
| Yeni sayfa/route ekle | `src/App.jsx` + yeni page dosyası |
| Menü linki (üye) | `src/components/layout/Sidebar.jsx`, `MobileNav.jsx` |
| Menü linki (admin) | `src/components/layout/AdminShell.jsx` |
| Menü linki (staff) | `src/components/layout/StaffShell.jsx` |
| Marka adı/logo | `src/config/brand.js`, `src/components/ui/BrandLogo.jsx` |
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
| MobileNav bağlantı düzeltmesi | `src/components/layout/MobileNav.jsx` — `/builder` → `/membership` |
| Giriş sonrası yönlendirme | `src/pages/auth/LoginPage.jsx` |
| Rol kontrolü | `src/components/auth/RequireAuth.jsx` |

---

## 11. Bilinen Sınırlamalar ve Tuzaklar

1. **Gerçek ödeme yok** — `PaymentForm` + `testPayment.js` simülasyon.
2. **Kural tabanlı analiz** — `aiAnalysis.js` kural tabanlı hesaplama yapar (YZ/LLM yok).
3. **localDb.js silindi** — tek veri kaynağı `supabaseDb.js`.
4. **PackageBuilder dosyaları silindi** — `/builder` → `/membership` redirect korunuyor.
5. **Daily REST API kullanılmıyor** — odalar deterministik URL ile açılır; oda önceden Daily dashboard'da oluşturulmalı veya otomatik oluşturma açık olmalı.
6. **Seanslar JSONB'de** — ayrı `sessions` tablosu yok; `members.data.coachSessions` / `dietitianSessions`.
7. **Doctor rolü** — frontend destekler (`staffRoles.js`); DB tarafı `setup.sql` içinde (`staff_role_check`) hazır.
8. **Supabase Edge Function yok** — sunucu mantığı Vercel `api/` klasöründe.
9. **ConfigErrorScreen** — Supabase env eksikse uygulama açılmaz.
10. **RLS koç erişimi** — `assigned_coach_id` / `assigned_dietitian_id` sütunlarına bağlı; JSONB yedek değer RLS için yeterli değil.

### Paket Sistemi Yapısı (2026-06-18 Güncellemesi)

| Paket | Otomatik Program | Manuel Kalori | Fotoğraflı Kalori | Koç/Diyetisyen |
|-------|------------------|---------------|-------------------|----------------|
| **Basic** (free) | ✅ Otomatik beslenme + antrenman | ❌ Yok | ❌ Yok | ❌ Yok |
| **Gümüş** | ❌ Koç/Diyetisyen programları | ✅ Manuel giriş | ❌ Yok | ✅ Haftada 1 koç + Aylık 1 diyetisyen |
| **Altın** | ❌ Koç/Diyetisyen programları | ✅ Manuel giriş | ❌ Yok | ✅ Haftada 2 koç + Aylık 2 diyetisyen |
| **Platinum** | ❌ Koç/Diyetisyen programları | ✅ Manuel giriş | ✅ Fotoğraflı analiz | ✅ Haftada 3 koç + Haftada 1 diyetisyen |

**Notlar:**
- Basic pakette programlar otomatik oluşturulur (hareket kütüphanesinden), koç/diyetisyen görüşmesi yoktur.
- Kalori hesaplayıcıya sadece Gümüş ve üzeri paketler erişebilir.
- Fotoğraflı kalori tespiti sadece Platinum pakette kullanılabilir.

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

*Bu rehber, projedeki tüm sistemlerin tek referans noktasıdır. Kod değişikliği yapmadan önce ilgili bölümü okuyun; arama yapmadan dosya yolunu ve sorumluluğu buradan bulabilirsiniz.*
