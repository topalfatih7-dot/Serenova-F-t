# 04 — Payments & IAP

## Model

| Kanal | Mekanizma | Ne zaman |
|-------|-----------|----------|
| iOS/Android in-app | RevenueCat → Store IAP | Uygulama içi plan satın alma / upgrade |
| Web | Stripe Checkout | yeniform.com onboarding/membership |
| Entitlement | Supabase `members` | Her iki webhook sonrası |

Uygulama içinden yalnızca Stripe’a yönlendirmek App Store reddi riski taşır; dijital üyelik için IAP kullan.

## Plan ürünleri

| Plan id | Tip | Süre SKU’ları |
|---------|-----|----------------|
| eko | auto-renewing sub | 1m, 3m, 6m |
| diyet | auto-renewing sub | 1m, 3m, 6m |
| spor | auto-renewing sub | 1m, 3m, 6m |
| vip | auto-renewing sub | 1m, 3m, 6m |
| doktor | non-consumable veya consumable one-time | once |
| free | — | IAP yok |

Önerilen product id: `yf_{plan}_{months}m` / `yf_doktor_once`.

Fiyatlar (TRY, web parity — store’da yerel para birimi ayrı tanımlanır):

| Plan | 1 ay | 3 ay | 6 ay |
|------|------|------|------|
| eko | 1299 | 2999 | 3999 |
| diyet | 2499 | 6499 | 9999 |
| spor | 2499 | 6499 | 9999 |
| vip | 4999 | 12999 | 19999 |
| doktor | 1500 once | | |

## Akış (mobil satın alma)

1. Kullanıcı plan + süre seçer  
2. RevenueCat `purchasePackage`  
3. Store onay → RevenueCat webhook → backend  
4. Backend `members.membership`, packageConfig, `premiumExpiresAt` günceller  
5. Client `refresh` / hydrate → feature unlock  

## Akış (web Stripe — mevcut)

1. `POST /api/stripe-checkout` `{ planId, flow, durationMonths }` + Bearer  
2. Redirect Checkout  
3. `stripe-webhook` → members satırı / plan güncelleme  
4. Mobil: aynı kullanıcı login → entitlement görünür; `restorePurchases` + server sync  

## Yeni API (tasarım)

`POST /api/revenuecat-webhook` — imza doğrula; event → aynı alanları Stripe ile uyumlu güncelle. Detay: [contracts/api-revenuecat-webhook.md](contracts/api-revenuecat-webhook.md).

## Restore / grace

- Uygulama açılışında RevenueCat restore + Supabase membership oku  
- Stripe grace davranışı web’de varsa parity dokümante et (`stripePaymentGrace`)  
- Süre bitince `free` düşüş  

## Staff / Admin

Satın alma yok. Admin finans ekranı: payments listesi; mock UI’lar web’de varsa mobilde “demo/parity” etiketi.

## Kabul kriterleri

- [ ] Ücretli feature IAP veya geçerli Supabase membership olmadan açılmaz  
- [ ] Web’den alan kullanıcı mobilde login ile erişir  
- [ ] Doktor one-time ayrı ürün  
- [ ] Sandbox purchase → webhook → DB doğrulanır  
