# Stripe Ödeme Kurulumu — Yapmanız Gerekenler

> Bu dosya, projeye eklenen **Stripe ödeme altyapısını** canlıya almak için
> **senin (geliştiricinin)** adım adım yapması gerekenleri anlatır.
> Kod tarafı hazır; aşağıdaki anahtarları ve ayarları girince çalışır.

İçindekiler:
1. [Nasıl çalışıyor (özet)](#1-nasıl-çalışıyor-özet)
2. [Stripe hesabı ve anahtarlar](#2-stripe-hesabı-ve-anahtarlar)
3. [Supabase service-role anahtarı](#3-supabase-service-role-anahtarı)
4. [Vercel ortam değişkenleri](#4-vercel-ortam-değişkenleri)
5. [Webhook kurulumu](#5-webhook-kurulumu)
6. [Arayüzü açma (feature flag)](#6-arayüzü-açma-feature-flag)
7. [Test etme](#7-test-etme)
8. [Canlıya (production) geçiş](#8-canlıya-production-geçiş)
9. [Sık karşılaşılan sorunlar](#9-sık-karşılaşılan-sorunlar)

---

## 1. Nasıl çalışıyor (özet)

Akış, **Stripe Checkout (yönlendirmeli, Stripe'ın barındırdığı ödeme sayfası)**
üzerine kuruludur — kart bilgileri sizin sunucunuza hiç dokunmaz (PCI yükü Stripe'ta).

```
Kullanıcı plan seçer (Gümüş/Altın/Platinum)
   │
   ├─ Kayıt akışı: önce ücretsiz hesap oluşturulur (oturum açılır)
   │
   ├─► POST /api/stripe-checkout   (Supabase token ile kimlik doğrulanır,
   │         fiyat SUNUCUDA belirlenir, Checkout oturumu açılır)
   │
   ├─► Kullanıcı Stripe ödeme sayfasına yönlendirilir → kartla öder
   │
   ├─► Stripe ➜ POST /api/stripe-webhook  (checkout.session.completed)
   │         └─ üyelik AKTİF edilir + payments kaydı + activity (service-role ile)
   │
   └─► Başarı: /dashboard?payment=success (kayıt) veya /profile?payment=success (plan değişimi)
       İptal:  /onboarding?payment=cancelled
```

**Önemli güvenlik notları (kodda zaten uygulandı):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` **yalnızca sunucuda** (Vercel) tutulur, `VITE_` ön eki YOKTUR, tarayıcıya gitmez.
- Fiyat **istemciden alınmaz**; sunucu `plans` tablosundan (yoksa yedek sabitten) okur.
- Üye kimliği istemciden gelen değerle değil, **Supabase access token doğrulanarak** belirlenir.
- Webhook **imza ile doğrulanır** ve **idempotent**'tir (aynı ödeme iki kez işlenmez).

**Stripe kapalıyken ne olur?** `VITE_STRIPE_ENABLED` `true` değilse uygulama
eski **test kartı** simülasyonunu (`PaymentForm` + `4242…`) kullanmaya devam eder.
Yani bu kurulumu yapmadan da site çalışır.

---

## 2. Stripe hesabı ve anahtarlar

1. [stripe.com](https://stripe.com) → ücretsiz hesap aç.
2. Türkiye için: Stripe doğrudan TR'de banka hesabına ödeme dağıtımını her ülkede
   desteklemeyebilir. Hesap açarken ülkeyi ve para birimini kontrol et. (TRY
   destekleniyor; ülke uygunluğu için Stripe'ın bölge listesine bak. Alternatif:
   iyzico/PayTR — bu kod Stripe içindir.)
3. **Test modunda** kal (sağ üstte "Test mode" açık).
4. **Developers → API keys** sayfasından:
   - **Secret key** (`sk_test_...`) → bunu kopyala (bu GİZLİ).
   - (Opsiyonel) **Publishable key** (`pk_test_...`) → redirect akışında gerekmez.

---

## 3. Supabase service-role anahtarı

Webhook, ödeme onaylanınca üyeliği RLS'yi atlayarak güncellemek için service-role
anahtarına ihtiyaç duyar.

1. Supabase Dashboard → **Project Settings → API**.
2. **Project URL**'i not al (`https://xxxx.supabase.co`).
3. **`service_role` secret** anahtarını kopyala. **Bu anahtar çok güçlüdür (RLS atlar);
   asla tarayıcıya/Git'e koyma, sadece Vercel sunucu env'ine gir.**

---

## 4. Vercel ortam değişkenleri

Vercel → Proje → **Settings → Environment Variables**. Aşağıdakileri ekle
(Production + Preview; Development için isteğe bağlı):

| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe gizli anahtarı |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Adım 5'te webhook oluşturunca alınır |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service-role (gizli) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | (VITE_SUPABASE_URL zaten varsa bu opsiyonel) |
| `APP_URL` | `https://siteniz.com` | Başarı/iptal yönlendirmesi (opsiyonel; yoksa istek origin'i kullanılır) |
| `VITE_STRIPE_ENABLED` | `true` | Arayüzde Stripe akışını açar |

> `VITE_` ile başlayanlar tarayıcıya gömülür (gizli olmayan). Diğerleri **gizli**dir.

Değişkenleri ekledikten sonra **yeniden deploy et** (env değişiklikleri build'e yansır).

---

## 5. Webhook kurulumu

Stripe, ödeme tamamlanınca senin `/api/stripe-webhook` adresine olay gönderir.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://SITENIZ.com/api/stripe-webhook`
3. **Events to send:** en az şunu seç → `checkout.session.completed`
   (istersen `checkout.session.async_payment_succeeded` da eklenebilir.)
4. Kaydet → açılan sayfada **Signing secret** (`whsec_...`) değerini kopyala.
5. Bunu Vercel'de `STRIPE_WEBHOOK_SECRET` olarak gir ve **yeniden deploy et**.

---

## 6. Arayüzü açma (feature flag)

`VITE_STRIPE_ENABLED=true` olduğunda:
- Kayıt formunda ücretli plan seçilip "Ödemeye Geç"e basılınca → Stripe Checkout.
- Profil/üyelik değiştirmede ücretli plan seçilince → Stripe Checkout.

`false`/boş ise eski test kartı modalı kullanılır (geliştirme için pratik).

---

## 7. Test etme

### A) En kolay: canlı (deploy edilmiş) ortamda
1. Yukarıdaki env'leri Vercel'e gir, deploy et.
2. Webhook'u ekle (Adım 5).
3. Siteye gir → kayıt ol → ücretli plan seç → Stripe sayfasında **test kartı** kullan:
   - Kart: `4242 4242 4242 4242`
   - Tarih: gelecekte herhangi bir ay/yıl (ör. `12/34`)
   - CVC: herhangi 3 hane · ZIP: herhangi
4. Ödeme sonrası `/dashboard?payment=success`'e döner; birkaç saniye içinde
   üyelik **aktif** olur (webhook çalışınca). `payments` ve `activities`
   tablolarında kayıt görünür.

### B) Yerelde webhook testi (Stripe CLI)
```bash
# Stripe CLI kur: https://stripe.com/docs/stripe-cli
stripe login
# Yerel sunucuyu çalıştır (npm run dev → http://localhost:5173)
stripe listen --forward-to localhost:5173/api/stripe-webhook
# CLI ekranda whsec_... verir → .env.local içine STRIPE_WEBHOOK_SECRET olarak koy
```
> Not: Yerel `npm run dev` (Vite) webhook'a **ham gövde** veremediği için imza
> doğrulaması yereldede sınırlıdır. Gerçekçi test için `vercel dev` veya
> deploy edilmiş ortamı kullan. Geçici çözüm olarak **yalnızca yerelde**
> `STRIPE_WEBHOOK_DEV_BYPASS=true` ile imza doğrulaması atlanabilir
> (production'da ASLA kullanma).

### Diğer test kartları (Stripe)
| Senaryo | Kart |
|---------|------|
| Başarılı | `4242 4242 4242 4242` |
| 3D Secure ister | `4000 0027 6000 3184` |
| Reddedilir | `4000 0000 0000 0002` |

---

## 8. Canlıya (production) geçiş

1. Stripe Dashboard'da işletme doğrulamasını tamamla (banka hesabı, kimlik vb.).
2. **Live mode**'a geç → yeni `sk_live_...` ve **canlı** webhook secret (`whsec_...`) al.
3. Vercel env'lerini canlı anahtarlarla güncelle (`STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`). Webhook endpoint'ini live modda yeniden oluştur.
4. Yeniden deploy et. Küçük bir gerçek ödemeyle uçtan uca doğrula.

---

## 9. Sık karşılaşılan sorunlar

| Belirti | Neden / Çözüm |
|---------|---------------|
| "Ödeme yapılandırması eksik" | `STRIPE_SECRET_KEY` Vercel'de yok ya da deploy edilmemiş. |
| "Sunucu yapılandırması eksik" | `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL` eksik. |
| Ödeme oluyor ama üyelik aktifleşmiyor | Webhook eklenmemiş veya `STRIPE_WEBHOOK_SECRET` yanlış. Stripe → Webhooks → "Recent deliveries" loglarına bak. |
| "İmza doğrulanamadı" | Webhook secret yanlış ya da proxy ham gövdeyi değiştiriyor. Doğru `whsec_...` girildiğinden emin ol. |
| Üyelik iki kez işleniyor | Olmaz — webhook idempotenttir (aynı `stripeSessionId` tekrar işlenmez). |
| Fiyat yanlış | `plans` tablosundaki fiyat baz alınır; yoksa `api/_stripe.js` içindeki `PLAN_FALLBACK`. |

---

## Eklenen/İlgili dosyalar (geliştirici referansı)

| Dosya | Görev |
|-------|-------|
| `api/_stripe.js` | Stripe istemcisi + yedek fiyat tablosu |
| `api/_supabaseAdmin.js` | Service-role Supabase istemcisi (RLS atlar) |
| `api/stripe-checkout.js` | Checkout oturumu oluşturur (kimlik + fiyat sunucuda) |
| `api/stripe-webhook.js` | Ödeme onayını işler, üyeliği aktifleştirir (idempotent) |
| `src/config/stripe.js` | `isStripeEnabled()` bayrağı |
| `src/services/stripePayment.js` | `startStripeCheckout(planId, flow)` |
| `src/pages/OnboardingPage.jsx` | Kayıt + plan değiştirmede Stripe yönlendirmesi |
| `src/pages/DashboardPage.jsx` / `ProfilePage.jsx` | Dönüş (`?payment=success`) işleme + tazeleme |
