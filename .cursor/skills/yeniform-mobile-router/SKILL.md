---
name: yeniform-mobile-router
description: >-
  Routes Yeni Form mobile work to the correct project skill. Use when the user
  mentions React Native, Expo, mobil uygulama, docs/mobile, native iOS/Android,
  handoff spec, or any Yeni Form mobile feature (üyelik, IAP, Stripe, chat,
  Daily, sağlık testi, koç programı, diyetisyen, admin panel, egzersiz videosu).
---

# Yeni Form Mobile Router

## When activated

1. Classify the user request into one or more buckets below.
2. **Read** the matching skill’s `SKILL.md` (and `reference.md` if needed) before editing.
3. Prefer `docs/mobile/` as source of truth for mobile behavior; verify against `src/` / `api/` when implementing or updating specs.
4. For Supabase schema/RLS, also read `.agents/skills/supabase/SKILL.md`.

## Routing table

| Signal in request | Read next |
|-------------------|-----------|
| spesifikasyon, handoff, docs/mobile yaz/güncelle | `yeniform-mobile-spec` |
| Expo kod, ekran implement, Router, RN UI | `yeniform-expo-app` |
| paket, üyelik, entitlement, IAP, RevenueCat, Stripe | `yeniform-membership-payments` |
| login, kayıt, onboarding, OAuth, şifre, gate | `yeniform-auth-onboarding` |
| mesaj, chat, realtime, Daily, video call, push | `yeniform-chat-realtime-video` |
| sağlık testi, takvim, program, öğün, kalori | `yeniform-health-programs` |
| staff, koç, diyetisyen, admin, premium, başvuru | `yeniform-staff-admin` |
| kütüphane, signed URL, thumbnail, video_pending | `yeniform-media-exercises` |

Multiple signals → read router targets **in parallel**, then execute in dependency order (auth/entitlement before feature UI).

## Hard rules

- First read `docs/mobile/IMPLEMENTATION-LOCK.md` on any mobile task.
- Do not invent product rules; use `docs/mobile/` + web code.
- Payments in-app: IAP via RevenueCat; web Stripe remains; entitlement in Supabase `members`.
- Panels: member + staff + admin all in scope unless user narrows.
- Turkish UI copy parity with web — locked strings win over “better” copy.
- If conflict between imagination and LOCK file → LOCK wins.

## Index

See [../README.md](../README.md).
