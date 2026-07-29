# Yeni Form — Mobil handoff (`docs/mobile`)

> **DURAKLATILDI (2026-07-29):** Mobil / Expo / handoff genişletmesi şu an yapılmayacak.  
> Bu klasör arşiv bilgisidir; web ürün çalışmasına devam edilir. Mobil işe dönülünce buradan devam.

Bu klasör, **web repo’ya erişimi olmayan** Expo ekibinin Yeni Form mobil uygulamasını (üye + staff + admin) üretebilmesi içindir.

## Durum

| Parça | Durum |
|-------|--------|
| Foundations (bu dosya + LOCK + envanter + membership + F01) | Taslak mevcut — **genişletme yok** |
| domains / flows / screens / contracts (tam set) | Erteledi |
| Expo uygulama kodu | Erteledi (ayrı repo) |

## Okuma sırası

1. [IMPLEMENTATION-LOCK.md](./IMPLEMENTATION-LOCK.md) — uydurma yasağı  
2. [00-overview.md](./00-overview.md) — ürün + stack  
3. [appendices/A-screen-inventory.md](./appendices/A-screen-inventory.md) — tüm yüzeyler  
4. [domains/membership.md](./domains/membership.md) — plan / gate / Stripe vs IAP  

Sonra: auth → health → programs → chat → media → payments contracts.

## Paneller

- **Member** — `/dashboard`, HT, takvim, kalori, mesaj, randevu, program, kütüphane, profil  
- **Staff** — koç / diyetisyen / doktor (nav split)  
- **Admin** — CRUD + premium + içerik  

## Ödeme (kilitli)

- **Mobil dijital abonelik:** App Store / Play → **RevenueCat** → aynı Supabase `members` entitlement  
- **Web:** Stripe Checkout Subscription (+ doktor one-shot) — mobil checkout’ta Stripe yok  

## Kaynak doğrulama

Belirsizlikte web: `AI_PROJE_REHBERI.md`, `src/App.jsx`, `src/data/membershipPlans.js`, `api/*`. Spec’te “bakınız src” yeterli değildir — davranışı göm.
