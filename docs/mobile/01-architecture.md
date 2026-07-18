# 01 — Architecture

## Yüksek seviye

```
Expo App (iOS/Android)
  ├─ Expo Router (public | member tabs | staff stack | admin stack)
  ├─ Auth/Role gates
  ├─ Supabase client (Auth, Postgres, Realtime, Storage signed URLs)
  ├─ Vercel API (auth, stripe, daily-room, ai-*, contact)
  ├─ RevenueCat (IAP)
  ├─ Daily React Native (video)
  └─ Expo Notifications (push)
```

## Önerilen repo yerleşimi

```
mobile/
  app/                    # Expo Router file routes
    (public)/
    (auth)/
    (member)/
    (staff)/
    (admin)/
  src/
    theme/                # tokens from 02-design-system
    services/supabase.ts
    services/api.ts
    services/iap.ts
    features/{auth,membership,chat,health,programs,library,admin}/
  app.json / eas.json
```

Web SPA (`src/`) ile aynı Supabase projesini kullanır; mobil ayrı native binary’dir.

## State

Web parity:

| Slice | İçerik |
|-------|--------|
| Auth | user, membership, roles, badge counts, loggingOut |
| Data | lists, chat bodies, programs, platform stats |
| Actions | login/logout/register, toggles, CRUD (~80 actions on web) |

Mobilde Context veya Zustand — dilim sınırları aynı kalsın (kabuk badge’leri chat gövdesinden izole).

## Veri yükleme

1. Session restore (SecureStore)  
2. `hydrate()` eşdeğeri: role’e göre public + private tablolar  
3. Realtime subscribe (`domains/realtime.md`)  
4. Foreground’da entitlement/expiry sync  

## Ortam değişkenleri

İsimler: [contracts/env-vars.md](contracts/env-vars.md). Secret’lar EAS secrets / native config; `VITE_` prefix mobilde `EXPO_PUBLIC_` olarak map edilir.

## Build

- EAS Build (iOS + Android)  
- OTA: EAS Update (JS); native modül değişince store build  

## Güvenlik özeti

- RLS her zaman açık varsay  
- Service role yalnızca Vercel API’de  
- Exercise video path only in DB  
- Auth bot koruması: mobil strateji `05-auth-onboarding.md`  
