# Stripe webhook — AÇIK OPS (manuel, kritik)

> **Durum:** Kod hazır · **Dashboard event’leri kullanıcıda açık değilse abonelik yenilenmez**  
> Kapanınca: bu dosyadaki checkbox’ları işaretle + [`ROADMAP_DENETIM.md`](ROADMAP_DENETIM.md) maddesini `[x]` yap

Kod: `api/stripe-webhook.js` (`invoice.paid` → süre uzatma, `customer.subscription.deleted` → subscription id temizliği).  
Checkout: `api/stripe-checkout.js` (recurring → `mode: subscription`; doktor → `payment`).

---

## Neden kritik?

| Event yoksa | Sonuç |
|-------------|--------|
| `invoice.paid` | Dönem bitince üyelik süresi **uzamaz** (otomatik yenileme kırık) |
| `customer.subscription.deleted` | Portal iptalinde `stripeSubscriptionId` **kalabilir** / durum kirli kalır |

Mevcut `checkout.session.*` ilk ödemeyi açar; **yenileme ve iptal** bu iki event’e bağlı.

---

## Yapılacaklar (Stripe Dashboard)

Live ve Test mode’u **ayrı ayrı** kontrol et (ikisinde de webhook varsa ikisine de ekle).

- [ ] [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
- [ ] Production endpoint’i aç (ör. `https://www.yeniform.com/api/stripe-webhook`)
- [ ] **Events to send** / Add events — emin ol:
  - [ ] `checkout.session.completed` (zaten olmalı)
  - [ ] `checkout.session.async_payment_succeeded` (varsa kalsın)
  - [ ] **`invoice.paid`** ← zorunlu (yenileme)
  - [ ] **`customer.subscription.deleted`** ← zorunlu (iptal temizliği)
- [ ] Signing secret (`whsec_…`) = Vercel **`STRIPE_WEBHOOK_SECRET`** (Production). Değiştiyse Redeploy
- [ ] (İsteğe bağlı) Test mode: subscription al → fatura paid → `expiresAt` uzadı mı; Portal iptal → subscription id temizlendi mi

---

## Agent / revize hatırlatması

Sonraki kod oturumunda veya PR/revize başında kullanıcıya sor:

> Stripe Dashboard webhook’ta `invoice.paid` + `customer.subscription.deleted` eklendi mi?  
> Detay: `docs/OPS_STRIPE_WEBHOOK.md`

Kullanıcı “hallettim” derse bu checklist + ROADMAP maddesini kapat.
