# Yeni Form — Mobil Spesifikasyon (Handoff)

Bu klasör, **web reposuna erişimi olmayan** bir ekibin Expo React Native uygulamasını yazabilmesi için self-contained spesifikasyondur.

**Zorunlu ilk dosya:** [IMPLEMENTATION-LOCK.md](IMPLEMENTATION-LOCK.md) — uydurma yasağı, gap protokolü, UI/API kilidi.

**Tamamlandı:** [COMPLETE.md](COMPLETE.md) — tüm paneller LOCK; skills hazır.

İlgili Cursor skill’leri: [`.cursor/skills/README.md`](../../.cursor/skills/README.md) — iş geldiğinde önce `yeniform-mobile-router`.

## Okuma sırası

0. [IMPLEMENTATION-LOCK.md](IMPLEMENTATION-LOCK.md)
1. [00-executive-summary.md](00-executive-summary.md)
2. [01-architecture.md](01-architecture.md)
3. [02-design-system.md](02-design-system.md)
4. [03-navigation.md](03-navigation.md)
5. [04-payments-iap.md](04-payments-iap.md)
6. [05-auth-onboarding.md](05-auth-onboarding.md)
7. [domains/](domains/) → [flows/](flows/) → [screens/](screens/) → [contracts/](contracts/) → [appendices/](appendices/)

## Klasörler

| Path | İçerik |
|------|--------|
| `domains/` | membership, health catalog, chat, programs, media, realtime, AI, notifications |
| `flows/` | F01–F15 uçtan uca senaryolar |
| `screens/member\|staff\|admin\|public/` | Ekran spesifikasyonları |
| `contracts/` | API + DB + env |
| `appendices/` | inventory, roadmap, handoff, legal, copy |

## Yazım standardı

- “Kaynağa bakın” tek başına yeterli değil — davranış burada gömülü
- Paket kapıları: `free\|eko\|diyet\|spor\|doktor\|vip`
- JSON örnekleri contracts altında
- Skills ile çapraz: uygulama işi → `yeniform-expo-app`; spec güncelleme → `yeniform-mobile-spec`

## Kararlar

- Expo + Expo Router  
- Üye + Staff + Admin  
- Ödeme: RevenueCat IAP (mobil) + Stripe (web); entitlement Supabase  
