---
name: yeniform-auth-onboarding
description: >-
  Handles Yeni Form auth, login, signup, Google OAuth, password reset,
  ProfileCompletionGate, and onboarding. Use when working on giriş, kayıt,
  onboarding, OAuth, şifre sıfırlama, Turnstile, auth gate, or session unlock.
---

# Yeni Form Auth & Onboarding

## Critical rules

1. Production clients should not call `signInWithPassword` / `signUp` raw against Supabase for password flows — use `POST /api/auth` actions (Turnstile / rate limit). See `api/auth.js` and `docs/SECURITY_OPS.md`.
2. Auth session may exist **before** `members` row (Stripe/IAP pending). UI must use `hasRegisteredMember` — no fake profile header.
3. `ProfileCompletionGate`: if member role and not registered → `/onboarding?plan=…` (+ `oauth=1` when social).

## Onboarding steps (current web)

**Step 0 Hesap:** name, email (non-OAuth), phone+country, gender, password×2 + PASSWORD_RULES, legal consents.  
**Step 1 Üyelik:** plan cards + duration 1/3/6 + Turnstile → register / checkout.

## Roles after login

- admin → `/admin`
- staff → `/staff` (force password if `tempPasswordIssued`)
- member → dashboard/profile per registration state

## Checklist

- [ ] Deep link auth callback + reset password
- [ ] Google OAuth; **Apple Sign-In required on iOS** for store
- [ ] Disposable email + rate limits honored via API
- [ ] Specs: `docs/mobile/05-auth-onboarding.md`, `flows/F01–F03`

## Related

[reference.md](reference.md)
