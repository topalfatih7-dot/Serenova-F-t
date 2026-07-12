# Yapılacaklar — Yeni Form

> **Son güncelleme:** 2026-07-02  
> Agent tarafından tamamlananlar ✅ · Senin devam ettireceklerin ⬜  
> **Kurulum rehberleri:** [`docs/setup/README.md`](./docs/setup/README.md)

---

## 🚀 Satışa hazırlık özeti

| Öncelik | Durum | Konu |
|---------|-------|------|
| P0 | ✅ | **Stripe** — yalnızca Checkout; test kartı UI kaldırıldı |
| P0 | ✅ | **Admin e-posta** — `admin@yeniform.com`; şifre kodda yok (`/admin/account`) |
| P0 | ✅ | Yasal sayfalar (`/kvkk`, `/privacy`, `/terms`) |
| P0 | ✅ | Güvenlik guard'ları + RLS düzeltmeleri |
| P1 | ⬜ | Admin panelden içerik doldur (SSS, yorumlar, başarı hikayeleri) |
| P1 | ⬜ | Kadro fotoğrafları ve biyografiler |
| P1 | ⬜ | Supabase Leaked Password Protection |
| P1 | ⬜ | Yasal metinleri hukuk danışmanına onaylat |
| P2 | ⬜ | Personel hakediş modülü — 500₺/görüşme, video katılım zorunlu, Cuma ödeme (§40) |
| P2 | ⬜ | Stripe Customer Portal |
| P2 | ⬜ | `phone_in_use` rate limit |
| P2 | ⬜ | **Apple Sign In** — [docs/setup/APPLE_SETUP.md](./docs/setup/APPLE_SETUP.md) (ertelendi) |
| P2 | ⬜ | **Google OAuth** — [docs/setup/OAUTH_SETUP.md](./docs/setup/OAUTH_SETUP.md) |

---

## 📌 Bilinçli tercihler (değiştirme)

### Landing pazarlama istatistikleri
Aşağıdakiler **bilerek** tasarlandı; gerçek sayıların altında gösterilir:

| Gösterim | Kural | Dosya |
|----------|-------|-------|
| `%94 Memnuniyet` | Sabit pazarlama metni | `LandingPage`, `TrustStrip`, `CorporatePage` |
| `1250+` üye | Gerçek üye < 1250 ise | `displayPlatformStats.js` |
| `2.500+ Üye` | Trust strip fallback | `TrustStrip.jsx` |
| `16–25` çevrimiçi | Gerçek online < 25 ise oturum boost | `displayPlatformStats.js` |

### Test kartı ödemesi (kaldırıldı)
Ücretli paketler yalnızca Stripe Checkout. `PaymentForm` / `testPayment.js` silindi.
`VITE_STRIPE_ENABLED` production'da `true` olmalı.

---

## ✅ Agent tarafından tamamlandı (2026-06-25)

### Satışa hazırlık & yasal
- [x] Yasal sayfalar: `src/data/legalDocuments.js`, `LegalDocumentPage.jsx`
- [x] Rotalar: `/kvkk`, `/privacy`, `/terms`
- [x] Footer + çerez banner yasal linkleri
- [x] Sitemap + PAGE_SEO yasal rotalar
- [x] `.env.example` → `VITE_STRIPE_ENABLED=false`

### Güvenlik & guard sistemi
- [x] `api/_guards.js` — `requireAuth`, `requireAdmin`, `requireNotifySecret`
- [x] AI endpoint'leri oturum korumalı
- [x] Daily.co token endpoint oturum korumalı
- [x] Telegram/iletişim API'leri production'da secret zorunlu
- [x] `20260625_fix_is_admin_rls_recursion` — HTTP 500 düzeltmesi
- [x] Programs RLS → yalnızca atanmış danışanlar
- [x] `membership_requests` tablosu kaldırıldı
- [x] Storage exercise-videos listeleme kısıtlandı

### Veri & UI
- [x] `PaymentManagementPage` — üye/admin gerçek `payments` tablosu
- [x] Auth callback `refresh` düzeltmesi
- [x] Admin abonelik sayfası yeni paket ID'leri
- [x] Üyelik dondurma/iptal akışları kaldırıldı
- [x] Kalori geçmişi merge (race fix)
- [x] Sağlık testi Türkçe etiketler + koç/diyetisyen görünürlüğü
- [x] Demo SSS/yorumlar temizlendi, bloglar genişletildi
- [x] Eşit yükseklikte fiyat kartları

### Vercel (canlı ortam)
- [x] `TELEGRAM_NOTIFY_SECRET` + `VITE_TELEGRAM_NOTIFY_SECRET` eklendi
- [x] Production: https://www.yeniform.com

### Supabase migration'ları (canlıya uygulandı)
- `20260625_audit_rls_plans_cleanup`
- `20260625_security_guards`
- `20260625_fix_is_admin_rls_recursion`
- `20260625_storage_listing_guard`
- `20260625_clean_demo_content_expand_blogs`
- `20260625_remove_demo_faqs_membership_freeze`

---

## ⬜ Senin yapman gerekenler

### 1. ACİL — Stripe ödeme (gerçek tahsilat için)

Vercel env listesinde **STRIPE** değişkenleri yok:

| Değişken | Değer |
|----------|-------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhooks → signing secret |
| `VITE_STRIPE_ENABLED` | `true` (canlı tahsilat başlayınca) |

Webhook URL: `https://www.yeniform.com/api/stripe-webhook`

```bash
printf '%s' 'sk_live_...' | npx vercel env add STRIPE_SECRET_KEY production
printf '%s' 'whsec_...' | npx vercel env add STRIPE_WEBHOOK_SECRET production
printf '%s' 'true' | npx vercel env add VITE_STRIPE_ENABLED production
npx vercel --prod
```

Stripe aktif olunca test kartı akışını kapat (yukarıdaki "Bilinçli tercihler" bölümüne bak).

---

### 2. ACİL — Admin hesabı

- E-posta: `admin@yeniform.com`
- Şifre: kod/dokümanda tutulmaz — panilden **Hesap Ayarları** (`/admin/account`)
- Ortam: Vercel `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` (opsiyonel override)

---

### 3. Yasal metinleri onaylat

Sayfalar yayında; metinler şablondur. Hukuk danışmanına onaylat:

- `/kvkk`, `/privacy`, `/terms`
- Güncelleme: `src/data/legalDocuments.js`

---

### 4. İçerik doldur (pazarlama öncesi)

| Görev | Nerede |
|-------|--------|
| Kadro fotoğrafları ve biyografiler | `/admin/staff` |
| Blog yazıları (800+ karakter) | `/admin/blog` |
| Başarı hikayeleri | `/admin/content` |
| SSS ve müşteri yorumları | `/admin/content` |
| GA4 ID doğrula | `brand.js` → `G-40ENH7MC5W` |
| Sosyal medya URL'leri | Vercel env `VITE_SOCIAL_*` veya `brand.js` |
| Search Console sitemap | 48 saat sonra kontrol |

---

### 5. Supabase Auth güvenliği

[Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection):

Supabase Dashboard → Authentication → Settings → Password Security

---

### 6. Yerel geliştirme

```bash
cp .env.example .env.local
# TELEGRAM_NOTIFY_SECRET değerlerini Vercel ile aynı yap
npm run dev
```

---

### 7. İleride — kod tarafı

| Görev | Açıklama |
|-------|----------|
| Test kartını production'da kapat | Stripe canlıya alınınca |
| Personel hakediş modülü | `staff_earning_lines` + `sessionAttendance` + `/api/session-attendance` |
| Stripe Customer Portal | Kayıtlı kart yönetimi |
| `phone_in_use` rate limit | Telefon enumeration riski |
| `schema.sql` senkron | ✅ Yeni kurulumda yalnızca `setup.sql`; `schema.sql` deprecation stub |
| `AI_PROJE_REHBERI.md` güncelle | Kaldırılan özellikler, guard sistemi |

---

## Ortam değişkenleri — tam liste

| Değişken | Durum (Vercel) | Not |
|----------|----------------|-----|
| `VITE_SUPABASE_URL` | ✅ | |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Gizli |
| `TELEGRAM_*` | ✅ | |
| `TELEGRAM_NOTIFY_SECRET` | ✅ | |
| `VITE_TELEGRAM_NOTIFY_SECRET` | ✅ | |
| `GEMINI_API_KEY` | ✅ | |
| `DAILY_API_KEY` | ✅ | |
| `VITE_SITE_URL` / `APP_URL` | ✅ | |
| `STRIPE_SECRET_KEY` | ❌ **eksik** | Gerçek tahsilat için |
| `STRIPE_WEBHOOK_SECRET` | ❌ **eksik** | Gerçek tahsilat için |
| `VITE_STRIPE_ENABLED` | ✅ | `true` — test kartı UI yok |

---

## Test checklist

- [ ] `/kvkk`, `/privacy`, `/terms` açılıyor
- [ ] Landing: `%94 memnuniyet` ve `1250+` üye gösterimi
- [ ] Production'da ücretli plan → test kartı modalı (Stripe kapalıyken)
- [ ] Giriş yap → `/calorie` AI analizi
- [ ] Giriş yapmadan `/api/ai-food-text` → 401
- [ ] Bize Ulaşın → Telegram
- [ ] Admin → Ödemeler gerçek veri
- [ ] Stripe checkout (secret ekledikten sonra)

---

## Hızlı komutlar

```bash
npm run dev
npm run build
npx vercel env ls
npx vercel --prod
```

---

## Dosya referansları

| Konu | Dosya |
|------|-------|
| Pazarlama istatistik eşikleri | `src/utils/displayPlatformStats.js` |
| Yasal metinler | `src/data/legalDocuments.js` |
| Stripe bayrağı | `src/config/stripe.js` |
| Env şablonu | `.env.example` |
| API guard'ları | `api/_guards.js` |
| Supabase kurulum | `docs/setup/SUPABASE_SETUP.md` |
