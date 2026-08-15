# Stripe webhook — KAPANDI (2026-08-14)

> **Durum:** Live production endpoint event’leri doğrulandı.  
> Kod: `api/stripe-webhook.js` (`invoice.paid` → süre uzatma, `customer.subscription.deleted` → subscription id temizliği).  
> Checkout: `api/stripe-checkout.js` (recurring → `mode: subscription`; doktor → `payment`).  
> Basil (2025-03-31+): `invoice.subscription` yok; yenileme `parent.subscription_details.subscription` + metadata snapshot okur.

Endpoint: `https://www.yeniform.com/api/stripe-webhook` (Live, enabled)

---

## Yapılacaklar (Stripe Dashboard)

Live ve Test mode’u **ayrı ayrı** kontrol et (ikisinde de webhook varsa ikisine de ekle).

- [x] [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
- [x] Production endpoint’i aç (ör. `https://www.yeniform.com/api/stripe-webhook`)
- [x] **Events to send** / Add events — emin ol:
  - [x] `checkout.session.completed` (zaten olmalı)
  - [ ] `checkout.session.async_payment_succeeded` (opsiyonel; kart ödemesinde şart değil — eklenmedi)
  - [x] **`invoice.paid`** ← zorunlu (yenileme)
  - [x] **`customer.subscription.deleted`** ← zorunlu (iptal temizliği)
- [x] Signing secret (`whsec_…`) = Vercel **`STRIPE_WEBHOOK_SECRET`** (Production). Mevcut endpoint’e event eklendi; secret değişmedi.
- [ ] (İsteğe bağlı) Test mode: subscription al → fatura paid → `expiresAt` uzadı mı; Portal iptal → subscription id temizlendi mi
