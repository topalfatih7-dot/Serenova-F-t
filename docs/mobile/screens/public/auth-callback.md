# Public — Auth Callback (IMPLEMENTATION LOCK)

- **Expo:** `/(auth)/callback` (+ deep link)
- **Web:** `AuthCallbackPage.jsx`
- **Priority:** P0

## Jobs

1. Exchange code / hash tokens for session (`establishSession`)
2. Query `verify=email` / `next=reset-password` / OAuth return
3. Route:
   - reset → reset-password
   - OAuth incomplete → onboarding?oauth=1
   - else role home (admin/staff/profile)

## Mobile

Configure Supabase redirect URLs for `yeniform://auth/callback` (or chosen scheme) + https site.

## Acceptance

- [ ] Handles recovery + OAuth + email verify
- [ ] No silent drop of errors — show web parity messages
