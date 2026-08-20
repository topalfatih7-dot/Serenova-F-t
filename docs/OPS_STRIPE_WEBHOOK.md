# Stripe webhook — iptal stacking (2026-08-20)

> Kod: `api/stripe-webhook.js`  
> Checkout: `api/stripe-checkout.js`  
> Portal config: `api/_stripePortal.js`  
> Basil (2025-03-31+): `invoice.subscription` yok; yenileme `parent.subscription_details.subscription` + metadata snapshot okur.

Endpoint: `https://www.yeniform.com/api/stripe-webhook` (Live, enabled)

---

## Events (Live **ve** Test ayrı)

- [x] `checkout.session.completed`
- [x] `invoice.paid` (yenileme — eşleşen `stripeSubscriptionId`)
- [x] `customer.subscription.deleted` (yalnız o abonelik expire; kardeş paketler durur)
- [x] **`customer.subscription.updated`** (`cancel_at_period_end`, dönem sonu) — Dashboard 2026-08-20

Signing secret (`whsec_…`) = Vercel **`STRIPE_WEBHOOK_SECRET`**. Event eklemek secret’ı değiştirmez.

## Portal (kod find-or-create)

İsteğe bağlı env (yoksa metadata `yeniform_portal`):

- `STRIPE_PORTAL_CONFIG_MANAGE` — iptal **kapalı**
- `STRIPE_PORTAL_CONFIG_PERIOD_END` — `at_period_end`, `proration_behavior: none`
- `STRIPE_PORTAL_CONFIG_IMMEDIATE` — `immediately`, `proration_behavior: none`

İlk iptal/kart isteği config yoksa Stripe’da oluşturur (secret key yetkisi gerekir).

## Stripe müşteri e-postaları

Dashboard → Settings → Customer emails: iptal / dönem sonu şablonları açık tutulabilir. Metin Stripe’ın; ürün kuralları bizim uyarı ekranımızda.

## QA

- [ ] İki abonelik: birini dönem sonunda kapat → diğeri `invoice.paid` ile uzar
- [ ] Hemen kapat → o paket expire; iade yok
- [ ] Resume → `cancelAtPeriodEnd` kalkar
