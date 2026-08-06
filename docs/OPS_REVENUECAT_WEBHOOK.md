# RevenueCat webhook + mobil auth — ops

Kod: [`api/revenuecat-webhook.js`](../api/revenuecat-webhook.js) · paket izolasyonu: [`api/_memberPackages.js`](../api/_memberPackages.js)

---

## Endpoint

- URL: `https://www.yeniform.com/api/revenuecat-webhook` (veya deploy host)
- Method: `POST`
- Auth: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`  
  veya header `x-revenuecat-secret: <aynı>`
- Env (Vercel): `REVENUECAT_WEBHOOK_SECRET`

Secret yoksa API **503** döner.

---

## Event’ler (işlenen)

| Tip | Davranış |
|-----|----------|
| `INITIAL_PURCHASE`, `NON_RENEWING_PURCHASE`, `PRODUCT_CHANGE`, `UNCANCELLATION` | Paket activate / change (`provider: revenuecat`) |
| `RENEWAL` | Süre uzatma |
| `EXPIRATION`, `SUBSCRIPTION_PAUSED` | Yalnız RC paketlerini expire |
| `CANCELLATION` | Ignore (süre bitene kadar erişim) |
| Bilinmeyen `product_id` | **200** `{ ignored: true }` (retry storm yok; üyelik yazılmaz) |

---

## Product ID şeması

- Abonelik: `yf_<plan>_<1|3|6>m` — plan: `eko_diyet` \| `eko_spor` \| `diyet` \| `spor` \| `vip`
- Tek seferlik: `yf_doktor_once`
- `app_user_id` = Supabase `members.id` (UUID)

---

## Stripe ile provider izolasyonu

- Expire/delete bir provider’da **yalnız o provider’ın paketlerini** etkiler.
- Üye `free` olur yalnızca aktif ücretli paket kalmadığında.
- RC expire **Stripe** `stripeSubscriptionId` / `stripe_customer_id` silmez.
- Web recurring checkout: aktif RC aboneliği varken Stripe Checkout **409** (`ACTIVE_MOBILE_SUBSCRIPTION`); doktor one-time serbest.

---

## Mobil auth (web Turnstile korunur)

- Env: `YENIFORM_MOBILE_API_SECRET` (Vercel + Expo EAS aynı değer)
- İstek: `body.client === 'yeniform-mobile'` **ve** header `X-Yeniform-Mobile-Key: <secret>`
- Secret yok/yanlış → normal Turnstile (spoof `client` işe yaramaz)
- Password-reset deep link allowlist (tam eşleşme):
  - `yeniform://auth/callback`
  - `yeniform://reset-password`
- Supabase Auth → Redirect URLs’e yalnız bu deep link’leri ekle

---

## AÇIK OPS — Stripe webhook (hatırlatma)

Dashboard’da production (ve varsa test) webhook’a şu event’ler ekli olmalı:

- `invoice.paid`
- `customer.subscription.deleted`

Detay: [`docs/OPS_STRIPE_WEBHOOK.md`](OPS_STRIPE_WEBHOOK.md)
