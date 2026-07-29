# 00 — Overview

## Ürün

**Yeni Form** (`yeniform.com`) — online koçluk + online diyetisyen + doktor (tek seferlik) wellness platformu.

## Mobil hedef stack

- Expo (SDK 56+ hedef; implementasyon repo’sunda pinlenir)  
- Expo Router  
- Supabase Auth + DB + Realtime + Storage  
- RevenueCat (IAP)  
- Daily.co (video seans)  
- expo-notifications  

## Mimari parity (web)

```
Auth (Supabase) → hydrate members/staff → role shell
  member | staff | admin
API: Vercel /api/* (aynı backend)
```

State dilimleri (web): `useAuth` / `useData` / `useActions` — mobilde eşdeğer context/hooks.

## Ortam

| Değişken | Not |
|----------|-----|
| Supabase URL + anon/publishable | Client |
| RevenueCat API keys | iOS/Android |
| EAS projectId | Push |
| Daily domain | Video |
| Turnstile | Web auth; mobilde native captcha stratejisi ayrı karar |

## Dışında kalan (bilinçli)

- Stripe Checkout UI (yalnızca web)  
- Admin GA4 Data API (web admin)  
- SEO landings / blog cron (web)
