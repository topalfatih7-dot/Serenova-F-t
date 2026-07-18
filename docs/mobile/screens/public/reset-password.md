# Public — Reset Password (IMPLEMENTATION LOCK)

- **Expo:** `/(auth)/reset-password`
- **Web:** `ResetPasswordPage.jsx`
- **Priority:** P0

## Preconditions

Recovery session from auth callback / deep link.

## Fields

New password + confirm; validate with `PASSWORD_RULES` / `isPasswordValid` (same as onboarding — 8+ mixed).

## Action

`supabase.auth.updateUser({ password })` then navigate login or profile; toast success (copy from web page at implement — read ResetPasswordPage for exact strings).

## Acceptance

- [ ] PASSWORD_RULES checklist UI
- [ ] No weak password accepted
