# Auth & Onboarding — Reference

## `/api/auth` actions (see contracts/api-auth.md)

`signup` | `unlock-signup` | `password-login` | `email-send` | `email-confirm` | `password-reset` | `password-change` | `book-session` | `exercise-video-url(s)` | …

## Key files

- `src/pages/auth/LoginPage.jsx`, `ForgotPasswordPage.jsx` (`POST /api/auth` `password-reset` + Turnstile; client `resetPasswordForEmail` kullanılmaz), `ResetPasswordPage.jsx`, `AuthCallbackPage.jsx`
- `src/pages/OnboardingPage.jsx`
- `src/components/auth/RequireAuth.jsx`, `ProfileCompletionGate.jsx`
- `src/components/profile/PasswordChangeSection.jsx` — üye profili; `POST /api/auth` `password-change` (eski şifre + yeni ×2). Client `signInWithPassword` yok.
- `src/services/supabaseDb.js` — `login`, `ensureAuthForRegistration`, `register*`, `completeOAuthMember`
- `src/services/oauthAuth.js` — Google + Facebook on web (`signInWithSocial`)
- Ops: `docs/OPS_GOOGLE_OAUTH.md`, `docs/OPS_FACEBOOK_OAUTH.md`
- `src/utils/memberProfile.js` — `hasRegisteredMember`, `isSocialAuthUser`

## Staff force password

`staff.data.tempPasswordIssued` → `StaffForcePasswordChange` before shell use.
