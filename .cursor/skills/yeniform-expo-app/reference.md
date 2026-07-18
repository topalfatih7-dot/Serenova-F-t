# Expo App — Reference

## Native modules expected

| Concern | Library direction |
|---------|-------------------|
| Auth session | `@supabase/supabase-js` + `expo-secure-store` |
| IAP | `react-native-purchases` (RevenueCat) |
| Push | `expo-notifications` |
| Video call | `@daily-co/react-native-daily-js` (+ peer deps) |
| Exercise video | `expo-av` / `expo-video` + signed URLs |
| Images | `expo-image-picker` (calorie vision) |
| Apple Sign-In | `expo-apple-authentication` (iOS store requirement) |

## Deep links

- Auth callback / password reset
- `call/:sessionType/:sessionId`
- Chat thread deep links
- Payment / IAP return restore on launch

## Backend

Reuse Vercel `api/*` and Supabase; do not fork business logic into a new BFF unless spec says so.
