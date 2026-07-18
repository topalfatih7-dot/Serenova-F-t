---
name: yeniform-expo-app
description: >-
  Implements Yeni Form Expo React Native app from docs/mobile specs. Use when
  scaffolding Expo, Expo Router screens, RN UI, native modules (RevenueCat,
  Daily, push, camera), or coding mobil uygulama screens for member/staff/admin.
---

# Yeni Form Expo Implementation

## Preconditions

1. Read `docs/mobile/IMPLEMENTATION-LOCK.md` — obey fully.
2. Read `yeniform-mobile-router` routing result.
3. Read relevant `docs/mobile/screens/**` + `flows/**` + `contracts/**`.
4. If screen is marked IMPLEMENTATION LOCK, treat every string/JSON/gate as mandatory.
5. If spec missing or GAP → **stop**. Do not invent UI, endpoints, or fields. Use gap protocol in IMPLEMENTATION-LOCK.md.

## Stack defaults

- Expo (current stable SDK) + Expo Router (file-based)
- Supabase JS client with SecureStore session
- UI: StyleSheet / theme from `docs/mobile/02-design-system.md`
- IAP: RevenueCat (`yeniform-membership-payments`)
- Video call: Daily React Native (`yeniform-chat-realtime-video`)
- Media: `yeniform-media-exercises`

## Folder suggestion

```
mobile/   # or apps/mobile
  app/           # Expo Router
  src/theme/
  src/services/  # supabase, api, iap
  src/features/
```

## Implementation checklist

- [ ] Role gates match `03-navigation.md` (member/staff/admin)
- [ ] ProfileCompletionGate parity (`hasRegisteredMember`)
- [ ] Entitlement checks before gated features
- [ ] API calls use Bearer session; same paths as `contracts/`
- [ ] Empty/loading/error states from screen spec
- [ ] Turkish copy

## Related

[reference.md](reference.md)
