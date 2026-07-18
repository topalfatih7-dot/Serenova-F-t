# Public — Forgot Password (IMPLEMENTATION LOCK)

- **Expo:** `/(auth)/forgot-password`
- **Web:** `ForgotPasswordPage.jsx`
- **Priority:** P0

## Behavior

1. Email field; submit if includes `@` else toast **Geçerli bir e-posta girin**
2. If Supabase missing: **Supabase yapılandırması eksik**
3. `supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: '{SITE}/auth/callback?next=reset-password' })`
   - **PKCE:** client must store code_verifier (use Supabase RN PKCE flow / expo linking)
4. Success UI: sent state (web checkmark card) — user told to check email
5. Error toast: err.message or **Bağlantı gönderilemedi**
6. Link back to login

## Mobile DIFF

Deep link scheme must match Auth callback + reset-password route.

## Acceptance

- [ ] redirectTo query `next=reset-password`
- [ ] PKCE compatible
