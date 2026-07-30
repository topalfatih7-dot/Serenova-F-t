---
name: Tam Sistem Tarama 2026-07-30
overview: Yeni Form web uygulamasının tüm iş akışlarını kapsayan tam sistem tarama raporu (2026-07-30). Önceki rapordan (2026-07-29) bu yana yapılan değişiklikler + tüm sistemlerin güncel durumu incelendi.
todos: []
isProject: false
---

# Yeni Form — Tam Sistem Tarama Raporu (2026-07-30)

> Kapsam: Web repo (Vite SPA + Vercel `api/` + Supabase)
> Önceki rapor: [`docs/TAM_TARAMA_RAPORU.md`](docs/TAM_TARAMA_RAPORU.md) (2026-07-29)
> SoT: [`AI_PROJE_REHBERI.md`](AI_PROJE_REHBERI.md)

---

## 1. Genel Durum (2026-07-30 itibarıyla)

**Son commit serisi:** landing/membership UI polishleri + WhatsApp Cloud API + session reminders cron kaldırma + Google OAuth stabilizasyonu.

**Bugün eklenen (yeni) migrasyonlar:**
- `20260730_seed_success_stories_with_photos.sql` — görselli başarı hikayeleri
- `20260730_whatsapp_delivery_log.sql` — WhatsApp delivery audit tablosu (PII minimize: yalnızca phone hash)

---

## 2. İş Akışları — Detaylı Durum

### 2.1 Auth Akışı

```
Kullanıcı → /login veya /onboarding
  ├── Email/şifre: api/auth (signup/password-login) + Turnstile + rate limit
  ├── Google OAuth: Supabase OAuth → /auth/callback → AuthCallbackPage
  └── Şifre sıfırlama: api/auth (password-reset) → email link
```

- **Turnstile koruması:** `signup`, `password-login`, `contact` vb. bot-korumalı set'te
- **Single-session:** `claim-active-session` / `verify-active-session` → `_singleSession.js`
- **Form session token:** Turnstile tek kullanımlık; signup flow için `issueFormSession` → `authSessionToken`
- **Disposable email engeli:** `_disposableEmail.js`
- **ProfileCompletionGate:** Google OAuth sonrası eksik profil tamamlama
- **Unlock-signup:** var ama bilerek devre dışı (bot suistimali)
- **Durum:** Sağlıklı. Google OAuth ilk-deneme fix (47b5b82b) canlıda.

### 2.2 Kayıt ve Üyelik Aktivasyon Akışı

```
Kayıt (free) → members tablo (membership='free', freeTrialExpiresAt=+48s)
  └── Ücretli paket seçimi → /onboarding → Stripe Checkout
      └── stripe-checkout.js (recurring/subscription veya one_time/payment)
          └── checkout.session.completed → stripe-webhook.js
              └── activateMembership() → members UPDATE + payments INSERT + activities INSERT
```

- **Yeni üye:** `freeTrialExpiresAt` (+48 saat) ile oluşur
- **Ücretli aktivasyon:** yalnızca webhook üzerinden (istemci `changeMemberPlan` engelli)
- **Abonelik yenileme:** `invoice.paid` → `renewMembership()` → expiry uzatma
- **İptal:** `customer.subscription.deleted` → `stripeSubscriptionId` temizliği
- **KRITIK AÇIK OPS:** Stripe Dashboard'a `invoice.paid` + `customer.subscription.deleted` event'leri **hâlâ eklenmedi** → abonelik yenilemesi çalışmaz

### 2.3 Üye Panel İş Akışları

| Özellik | Gate | API/DB | Durum |
|---------|------|--------|-------|
| Dashboard + HealthScoreCard | `canAccessMemberDashboard` (ücretli veya aktif 48s) | hydrate + healthAnalysis | Sağlıklı |
| Sağlık testi | deneme bitince `saveOnly` (AI yok) | `ai-health-analysis` | Sağlıklı |
| Takvim (program completion) | `UnpaidMemberGate` | programs | Sağlıklı |
| Kalori (foto/manuel) | entitlement guard + `UnpaidMemberGate` | `ai-food-text`/`ai-food-vision` | Sağlıklı |
| Randevu | `UnpaidMemberGate` (fix uygulandı Tur3) | `auth` book-session | Sağlıklı |
| Mesajlar | `UnpaidMemberGate` | chat realtime | Sağlıklı |
| Programlar | `UnpaidMemberGate` | programs | Sağlıklı |
| Video Kütüphanesi | `UnpaidMemberGate` + program-scoped | `auth` exercise-video-url(s) | Sağlıklı |
| Bildirimler / Destek | Gate yok (erişilebilir) | members.data / tickets | Bilinen — kasıtlı |
| Profil | `UnpaidMemberProfileAlert` inline | members | Sağlıklı |
| Ödeme yönetimi | Açık | payments + Stripe Portal | Sağlıklı |

### 2.4 AI Sistemleri

```
Kalori (foto): /api/ai-food-vision → GPT-4o → food_dictionary cache
Kalori (metin): /api/ai-food-text → GPT-4o → food_dictionary cache
Sağlık skoru: /api/ai-health-analysis → GPT-5.4 → members.data.healthAnalysis + healthScoreHistory
Blog: /api/ai-blog-generate (cron 05:00) → Gemini flash-lite → posts
Günlük tüyo: /api/ai-blog-generate?task=daily-tip (cron 04:00) → Gemini → site_content
Üyelik süresi: /api/ai-blog-generate?task=membership-expiry (cron 03:00) → _membershipExpiry.js
```

- **Sağlık analizi guard:** ücretli VEYA aktif 48s deneme; deneme → 1× (fingerprint match → 409); force yalnız ücretli
- **Fingerprint:** `buildHealthAnalysisFingerprint` — profil + HT verisi hash'i; aynı fingerprint → yeniden analiz engellenir
- **staffBrief:** personelde yalnızca ücretli üyelikte gösterilir
- **AI kullanım log:** `ai_usage_logs` tablosu + günlük quota kontrolü (`_aiQuota.js`)
- **Rate limit:** `enforceRateLimit` endpoint başına (ai-health-analysis: 20/saat)
- **Durum:** Sağlıklı. GPT-5.4 (`OPENAI_HEALTH_MODEL`) kullanımda.

### 2.5 Staff Panel İş Akışları

```
Personel auth → /staff (StaffShell)
  ├── Koç: danışanlar → /staff/clients/:id/program → CoachProgramEditor
  ├── Diyetisyen: danışanlar → /staff/clients/:id/list → NutritionProgramBuilder
  ├── Tüm roller: mesajlar, randevular, bildirimler, ödeme (staff_earnings)
  └── Sağlık brief: StaffHealthBrief — skorlar her zaman; brief yalnız ücretli üye
```

- **İletişim gizliliği:** `members_staff_safe` view (SECURITY INVOKER migration uygulandı 2026-07-29)
- **contactInfoGuard:** chat'te e-posta/telefon paylaşımı engeli
- **Hakediş:** video attendance → `staff_earnings` (gerçek veri; mock kaldırıldı)
- **Program builder:** koç haftalık şablon (gün bazlı seans saati); diyetisyen tam sayfa liste builder
- **StaffLibraryGate:** diyetisyen/doktor kütüphaneden yönlendirilir

### 2.6 Admin Panel İş Akışları

- **Üyeler:** liste/detay/premium atama/program görüntüleme-düzenleme
- **Planlar:** tam dinamik paket yönetimi (`AdminPlansPage`) — DB entitlements, fiyat katmanları, is_sellable
- **Blog/içerik:** `AdminBlogPage`, `AdminContentPage`
- **Başvurular:** staff başvuruları + CV görüntüleme
- **Analitik:** `AdminAnalyticsPage` (aktivasyon hunisi + GA4 metrikleri)
- **AI maliyeti:** `AdminAiCostsPage` (ai_usage_logs)
- **Hakediş:** onay/ödeme işaretleme

### 2.7 Video Görüşme (Daily.co)

```
Randevu rezervasyonu → api/auth (book-session)
  → api/daily-room (room + token oluştur)
  → VideoCallPage (Daily SDK)
  → api/auth (session-attendance) → staff_earnings
```

- **Katılım penceresi:** `_videoJoinWindows.js` — erken/geç join kontrolü
- **Güvenlik:** session auth; üye/personel ID çapraz kontrol
- **Durum:** Sağlıklı (9753cf16 fix).

### 2.8 Egzersiz Video Kütüphanesi

```
Üye /library → program-scoped filtre
  → ExerciseDetailModal → VideoPlayer
  → getExerciseVideoUrl() → createSignedUrl (RLS, client-first)
  → fallback: api/auth (exercise-video-url) → 15 dk signed URL
```

- `exercise-videos` bucket: private. DB'de yalnızca path.
- `exercise-thumbs` bucket: public webp. `getExerciseThumbUrl()` ile türetilir.
- `video_pending=true` → signed URL isteği yapılmaz
- **Durum:** Sağlıklı. `fullVideo` entitlement runtime'da henüz uygulanmıyor (program-scoped kaldı — bilinçli ürün kararı).

### 2.9 Chat & Realtime

- Üye ↔ Personel: `chatDb.js` + Supabase realtime
- Personel ↔ Personel: `staffCollabChatDb.js`
- Admin ↔ Staff: `adminChatDb.js`
- Unread badge, bildirim, `ChatConsentModal`
- Platform dışı iletişim: `contactInfoGuard` + DB trigger `strip_staff_contact_fields`

### 2.10 WhatsApp Cloud API (YENİ — 2026-07-30)

```
Event trigger (randevu/program/mesaj) → api/application-notify
  → _whatsapp.js → Meta Graph API v22.0
  → whatsapp_delivery_log (audit; phone_hash)
  → Webhook GET/POST: Meta verify + delivery status
```

- Kod hazır (`api/_whatsapp.js`, `api/_whatsappEvents.js`, `api/application-notify.js`)
- Şablon listesi: `appt_confirmed_member/staff`, `appt_reminder_24h/1h`, `appt_cancelled`, `appt_rescheduled`, `program_ready`, `new_chat_message`
- **AÇIK OPS:** Meta Business doğrulama + şablon onayları + env'ler henüz yapılmadı
- `whatsapp_delivery_log` migration bugün uygulandı

### 2.11 Bildirimler (Multi-kanal)

| Kanal | Kullanım |
|-------|---------|
| Telegram | Ödeme başarılı/başarısız, kayıt, giriş lifecycle |
| Expo Push | `_expoPush.js` — mobil push (şimdilik handoff hazır, uygulama yok) |
| WhatsApp | Randevu + program bildirimleri (ops bekliyor) |
| Browser notif | `browserNotifications.js` |

### 2.12 Vercel Crons (3 adet)

| Cron | Schedule | İş |
|------|----------|-----|
| `membership-expiry` | 03:00 UTC | Süresi dolan üyelikleri `free`'ye düşür |
| `daily-tip` | 04:00 UTC | Gemini günlük sağlık tüyosu |
| `ai-blog-generate` | 05:00 UTC | Gemini blog yazısı |

- Session-reminders cron **kaldırıldı** (Hobby limiti; 96646590)
- WhatsApp reminders: cron yerine event-driven (booking anında)

---

## 3. Vercel Serverless Haritası (12/12 DOLU)

| Fonksiyon | Görev |
|-----------|-------|
| `auth.js` | signup/login/session/video-url/GA4/AI usage |
| `ai-blog-generate.js` | blog + daily-tip + expiry + supabase-health |
| `ai-food-text.js` | Metin kalori AI |
| `ai-food-vision.js` | Fotoğraf kalori AI |
| `ai-health-analysis.js` | GPT-5.4 sağlık skoru + staffBrief |
| `application-notify.js` | Expo push + WhatsApp (multiplex) |
| `contact.js` | İletişim formu + başvurular + doc upload |
| `daily-room.js` | Daily.co room + token |
| `sitemap.js` | SEO sitemap |
| `stripe-checkout.js` | Checkout + Portal |
| `stripe-webhook.js` | Stripe event işleme |
| `telegram-notify.js` | Telegram lifecycle |

**Slot dolduğundan yeni `api/*.js` eklenmez. Her genişleme multiplex ile olmalı.**

---

## 4. Güvenlik Durumu

| Alan | Durum | Not |
|------|-------|-----|
| RLS genel | Sağlıklı | Faz1 + migration serisi |
| `members_staff_safe` | SECURITY INVOKER | migration 20260729 uygulandı |
| Anon EXECUTE WARN'lar | Bilinçli istisna | `SECURITY_OPS.md` kayıtlı |
| `isAdmin()` guard | DB `platform_settings.admin_email` | `_guards.js` env öncelikli |
| Turnstile | Signup + login + contact | `_turnstile.js` |
| Rate limit | Tüm AI + auth endpoint'leri | `_rateLimit.js` |
| Stripe imzası | `webhooks.constructEvent` + raw body | `STRIPE_WEBHOOK_DEV_BYPASS` yalnız dev |
| Video URL güvenliği | Private bucket + 15dk signed URL | RLS + path validation |
| Contact guard | DB trigger + API | `contactInfoGuard` + `strip_staff_contact_fields` |
| WhatsApp webhook | `HMAC-SHA256` signature verify | `_whatsappEvents.js` |

---

## 5. Açık OPS Maddeleri (Kritik Sırayla)

### 5.1 KRITIK — Stripe webhook event'leri (gelir akışı kırık)
**Durum:** `[ ]` AÇIK — Dashboard'a event'ler eklenmemiş

Neden: `invoice.paid` olmadan abonelik yenilemez → kullanıcı ödeme yapar ama üyeliği uzamaz.

**Yapılacak:** Stripe Dashboard → Developers → Webhooks → Production endpoint →
Events ekle: `invoice.paid` + `customer.subscription.deleted`

Detay: [`docs/OPS_STRIPE_WEBHOOK.md`](docs/OPS_STRIPE_WEBHOOK.md)

### 5.2 ORTA — Google OAuth Consent Screen markalama
**Durum:** `[ ]` AÇIK

Neden: Onaylı branding olmadan OAuth "Test" modunda kalır; production kullanıcı uyarısı görür.

Detay: [`docs/OPS_GOOGLE_OAUTH.md`](docs/OPS_GOOGLE_OAUTH.md)

### 5.3 ORTA — WhatsApp Cloud API aktivasyonu
**Durum:** `[ ]` AÇIK — Kod + migration hazır, ops yapılmadı

Neden: Meta Business doğrulama + şablon onayları + env'ler olmadan hiçbir WA bildirimi gitmiyor.

Detay: [`docs/OPS_WHATSAPP.md`](docs/OPS_WHATSAPP.md)

---

## 6. Yeni Bulgular (2026-07-30 delta)

### 6.1 Eklenenler (bu taramada tespit edildi)
- WhatsApp entegrasyonu tamamdır kod tarafında — ops bekleniyor
- `whatsapp_delivery_log` tablosu bugün migrate edildi (PII minimize edilmiş)
- `20260730_seed_success_stories_with_photos.sql` — görselli hikayeler eklendi
- Landing/membership sayfaları birden fazla commit ile yoğun polishlandı (son 10 commit)
- `fullVideo` entitlement `EKO_SPOR_PLAN` tanımında `true` — ancak üye kütüphanesinde runtime'da program-scoped filtreleme geçerli (entitlement uygulanmıyor). Önceki rapordan bilinir, değişmedi.

### 6.2 Tutarsızlık / Potansiyel Sorunlar
- **`doktor` paketi entitlements tutarsızlığı:** `membershipPlans.js`'te `doctorMeetingsPerMonth: 1` ama asıl hakediş `doctorSessionsTotal: 1`. `_memberPackages.js` sunucu tarafı `ONE_TIME_PLANS` ile doğru handle ediyor. Ancak `DIYET_PLAN` ve `EKO_DIYET_PLAN` tanımlarında `doctorMeetingsPerMonth: 1` var — bu doktor aylık görüşme olarak yorumlanır ama rehberde "kan tahlili analizi" olarak tanımlanmış. Muğlaklık pazarlama-ürün kararı gerektirir.
- **WhatsApp `application-notify` multiplex:** `application-notify.js` hem Expo push hem WA hem 410 eski form payload'larını handle ediyor. WA env yokken graceful skip yapıyor (`isWhatsAppConfigured()` false → atla). Güvenli.
- **`ADD_ONS` array:** `membershipPlans.js`'te tanımlı (group, mental, nutrition, video, vip) ama hiçbir sayfada satışa sunulmuyor ve checkout'ta desteklenmiyor. Ürün kararı bekliyor veya ölü kod.

---

## 7. DB Snapshot (2026-07-30 tarama anı itibarıyla)

- **Migration sayısı:** 70+ migration uygulandı (2026-06-20 → 2026-07-30)
- **Yeni tablolar (son 2 gün):** `whatsapp_delivery_log`
- **Bilinen Supabase advisor durumu:**
  - `members_staff_safe`: SECURITY INVOKER (ERROR kapandı 2026-07-29)
  - Anon EXECUTE WARN'lar: bilinçli (`SECURITY_OPS.md`)
  - Performance: `ai_usage_logs`, `meal_analysis_cache` unindexed FK (P2 düşük öncelik)

---

## 8. Öncelik Matrisi (güncel)

| Öncelik | Madde | Tip |
|---------|-------|-----|
| P0 KRITIK | Stripe Dashboard webhook event'leri ekle | Ops (kod yok) |
| P1 | Google OAuth Consent Screen branding | Ops |
| P1 | WhatsApp Meta onayları + env | Ops |
| P1 | `doktor` / `diyet` / `eko_diyet` `doctorMeetingsPerMonth` muğlaklığı | Ürün kararı + copy |
| P2 | `fullVideo` entitlement runtime uygulaması | Ürün kararı |
| P2 | `ADD_ONS` array — satış kararı veya silme | Ürün kararı |
| P3 | `ai_usage_logs` FK index | DB perf |

---

## 9. İyi Gidenler (değişmedi)

- Auth / RLS / ödeme bütünlüğü: Faz 1–5 tamamlandı
- Stripe Subscription otomatik yenileme kodu hazır (ops bekleniyor)
- Staff builder'lar (koç haftalık şablon + diyetisyen liste builder) olgun
- Video güvenlik modeli (private bucket + 15dk signed URL) sağlıklı
- Gate modeli (48s deneme + unpaid lock) tutarlı
- SEO hydrate pass-through düzgün (`/online-diyetisyen`, `/online-kocluk` dahil)
- Admin dinamik paket yönetimi canlı (DB entitlements)
- GA4 + aktivasyon hunisi metrikleri canlı

---

## 10. Bilinçli Dışı

- Expo mobil uygulama (bu repoda yok; ertelendi)
- `dist/`, `node_modules`
- AI program/diyet üretimi (kaldırıldı, geri eklenmiyor)
