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

**Stripe kapalıysa:** `VITE_STRIPE_ENABLED` `true` değilse ücretli paket ödemesi
başlamaz; kullanıcıya yapılandırma mesajı gösterilir. Test kartı UI kaldırılmıştır.

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
| `STRIPE_SECRET_KEY` | `sk_test_...` / `sk_live_...` | Stripe gizli anahtarı |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Adım 5'te webhook oluşturunca alınır |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service-role (gizli) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | (VITE_SUPABASE_URL zaten varsa bu opsiyonel) |
| `APP_URL` | `https://siteniz.com` | Başarı/iptal yönlendirmesi (opsiyonel; yoksa istek origin'i kullanılır) |
| `VITE_STRIPE_ENABLED` | `true` | Arayüzde Stripe akışını açar |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` / `pk_live_...` | (Opsiyonel; redirect akışında zorunlu değil) |
| `TELEGRAM_PAYMENT_CHAT_ID` | `-100…` / `12345…` | Ödeme (başarılı/başarısız) bildirimlerinin gideceği Telegram chat. Boşsa `TELEGRAM_CHAT_ID`'ye düşer. |

> `VITE_` ile başlayanlar tarayıcıya gömülür (gizli olmayan). Diğerleri **gizli**dir.

Değişkenleri ekledikten sonra **yeniden deploy et** (env değişiklikleri build'e yansır).

---

## 5. Webhook kurulumu

Stripe, ödeme tamamlanınca senin `/api/stripe-webhook` adresine olay gönderir.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://SITENIZ.com/api/stripe-webhook`
3. **Events to send:** aşağıdakileri seç (başarılı **ve** başarısız Telegram bildirimi için):
   - `checkout.session.completed` — **ödeme başarılı** → üyelik aktif + Telegram ✅
   - `checkout.session.expired` — oturum süresi doldu/terk edildi → Telegram ❌
   - `checkout.session.async_payment_failed` — gecikmeli ödeme başarısız → Telegram ❌
   - `payment_intent.payment_failed` — kart reddi/başarısız deneme → Telegram ❌
4. Kaydet → açılan sayfada **Signing secret** (`whsec_...`) değerini kopyala.
5. Bunu Vercel'de `STRIPE_WEBHOOK_SECRET` olarak gir ve **yeniden deploy et**.

> **Telegram ödeme bildirimi:** `TELEGRAM_PAYMENT_CHAT_ID` (veya boşsa `TELEGRAM_CHAT_ID`)
> tanımlıysa webhook her başarılı/başarısız ödeme için o chat'e mesaj atar. Bot
> (`TELEGRAM_BOT_TOKEN`) o gruba/kişiye ekli olmalıdır.

---

## 6. Arayüzü açma (feature flag)

`VITE_STRIPE_ENABLED=true` olduğunda:
- Kayıt formunda ücretli plan seçilip "Ödemeye Geç"e basılınca → Stripe Checkout.
- Profil/üyelik değiştirmede ücretli plan seçilince → Stripe Checkout.

`false`/boş ise ücretli ödeme başlamaz (yapılandırma hatası mesajı). Uygulama içi test kartı UI yoktur.

---

## 7. Test etme

> **KRİTİK — Test modu vs Canlı mod:** Test kartları (`4242…`) **yalnızca TEST modunda**
> çalışır. **Canlı anahtarlarla (`sk_live_`/`pk_live_`) test kartı KABUL EDİLMEZ**;
> canlı modda girilen gerçek kart **gerçekten para çeker**. Bu yüzden geliştirme/test
> sırasında Stripe'da **"Test mode"** aç, oradan **`sk_test_…` / `pk_test_…`** anahtarlarını
> ve **test modunda ayrı bir webhook** (`whsec_…`) al; bunları env'e koy. Canlıya
> geçişte (Adım 8) live anahtarlarla değiştir.

### A) En kolay: canlı (deploy edilmiş) ortamda — TEST modu anahtarlarıyla
1. Stripe'da **Test mode** aç → `sk_test_…`, (ops.) `pk_test_…` al.
2. Bu test anahtarlarını + test webhook `whsec_…`'ini Vercel'e gir, deploy et.
3. Webhook'u **test modunda** ekle (Adım 5, aynı 4 event).
4. Siteye gir → kayıt ol → ücretli plan seç → Stripe sayfasında **test kartı** kullan:
   - Kart: `4242 4242 4242 4242`
   - Tarih: gelecekte herhangi bir ay/yıl (ör. `12/34`)
   - CVC: herhangi 3 hane · ZIP: herhangi
5. Ödeme sonrası `/dashboard?payment=success`'e döner; birkaç saniye içinde
   üyelik **aktif** olur (webhook çalışınca). `payments` ve `activities`
   tablolarında kayıt görünür, admin **Ödeme Yönetimi** ekranında listelenir ve
   Telegram'a **✅ Ödeme başarılı** mesajı düşer.
6. **Başarısız senaryo:** reddedilen kartla (`4000 0000 0000 0002`) dene →
   Telegram'a **❌ Ödeme başarısız** mesajı gelir (`payment_intent.payment_failed`).
   Ödeme sayfasını kapat/bekle → süre dolunca `checkout.session.expired` ile de ❌ gelir.

### B) Yerelde webhook testi (Stripe CLI)
```bash
# Stripe CLI kur: https://stripe.com/docs/stripe-cli
stripe login
# Yerel sunucuyu çalıştır (vercel dev → http://localhost:3000 önerilir)
stripe listen \
  --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_failed,payment_intent.payment_failed \
  --forward-to localhost:3000/api/stripe-webhook
# CLI ekranda whsec_... verir → .env.local içine STRIPE_WEBHOOK_SECRET olarak koy
# Başarısız ödemeyi tetiklemek için:  stripe trigger payment_intent.payment_failed
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
| `api/stripe-checkout.js` | Checkout oturumu oluşturur (kimlik + fiyat sunucuda; metadata + `payment_intent_data.metadata`) |
| `api/stripe-webhook.js` | Ödeme onayını işler, üyeliği aktifleştirir (idempotent) + **başarılı/başarısız Telegram bildirimi** |
| `api/_telegramSend.js` | Ödeme bildirimlerini gönderen ortak Telegram yardımcısı |
| `src/config/stripe.js` | `isStripeEnabled()` bayrağı |
| `src/services/stripePayment.js` | `startStripeCheckout(planId, flow)` |
| `src/pages/OnboardingPage.jsx` | Kayıt + plan değiştirmede Stripe yönlendirmesi |
| `src/pages/DashboardPage.jsx` / `ProfilePage.jsx` | Dönüş (`?payment=success`) işleme + tazeleme |
