# 07 — Authentication Analysis

Sources read in full: `src/services/supabaseClient.js`, `src/services/authStorage.js`,
`src/services/singleSession.js`, `src/services/authSessionFromUrl.js`, `src/services/oauthAuth.js`,
`src/services/apiAuth.js`, `src/services/authVerification.js`, `src/components/auth/RequireAuth.jsx`,
`src/components/auth/ProfileCompletionGate.jsx`, `src/components/auth/AuthRedirectHandler.jsx`,
`src/utils/authPaths.js`, `api/auth.js`, `api/_apiAuth.js`, `api/_guards.js`, plus the auth-related
~700 lines of `src/services/supabaseDb.js` (`login`, `logout`, `register*`, `completeOAuthMember`,
`resolveQuickPostLoginPath`, `recordSocialLogin`, `ensureAuthForRegistration`).

## 1. Identity provider

100% Supabase Auth (`@supabase/supabase-js`, GoTrue). No custom JWT issuance. Auth methods used:
- **Email + password** (`supabase.auth.signInWithPassword` / a custom `register_email_user`
  Postgres RPC called via the service-role key from `api/auth.js` `action=signup`, NOT
  `supabase.auth.signUp` directly — see §3, this is deliberate to avoid GoTrue's built-in
  leaked-password (HIBP) check rejecting the direct `signUp` call path in some cases, per source
  comments).
- **Google OAuth** (`supabase.auth.signInWithOAuth({provider:'google'})`) — only provider wired up
  (`PROVIDERS = ['google']` in `oauthAuth.js`); Apple Sign-In is referenced in project docs
  (`docs/setup/APPLE_SETUP.md`) but explicitly noted as "ertelendi" (postponed) in
  `YAPILACAKLAR.md` — **not implemented in code**, mark as `UNKNOWN/NOT IMPLEMENTED`, do not build
  it into the RN app unless separately instructed.
- **Magic link / OTP email** (`supabase.auth.signInWithOtp`) — used for phone-verification email
  fallback and password recovery (server-triggered via `api/auth.js`).
- **Phone OTP** (`supabase.auth.updateUser({phone})` triggers SMS OTP) — used only for phone
  *verification* of an already-authenticated user, not as a login method, and only if an SMS
  provider (e.g. Twilio) is configured in Supabase; otherwise silently falls back to the email-link
  method (`isSmsProviderError` regex check in `authVerification.js`).

## 2. Role resolution (client + server, verified identical logic in both places)

There is **no separate roles table for admin/member**; role is derived at runtime:
```
roleForUser(user, staffList):
  email == ADMIN_EMAIL (config: VITE_ADMIN_EMAIL, default 'admin@yeniform.com') → 'admin'
  else if user.id/email found in `staff` table                                   → 'staff'
  else                                                                            → 'member'
```
(`src/services/supabaseDb.js` `roleForUser`; server-side equivalent in `api/_guards.js`
`requireAdmin` compares email to `getAdminEmail()` OR queries `members.role === 'admin'` via the
service-role client). `session.type` (`'admin'|'staff'|'member'`) is what `RequireAuth` and the
entire app gate on. **There is no client-writable "role" field** — a member can never elevate
themselves; staff rows are only created by an admin (`sb.addStaff`) and the ADMIN_EMAIL is a
server/env-configured constant.

## 3. Registration flow (email/password)

1. User fills the onboarding wizard (`OnboardingPage`) → calls `AppContext.register(profile,
   membership, packageConfig)` (free/onboarding flow) or `registerWithPayment`/`registerWithPlan`
   (paid flows — see `06-api-analysis.md` for Stripe interplay).
2. `sb.register()` → `ensureAuthForRegistration(profile)`:
   a. Validates email format (`normalizeEmailAddress`).
   b. If a phone is given, checks a Postgres RPC `phone_in_use` to reject duplicate phone numbers
      (`error: 'Bu telefon numarası zaten kayıtlı...'`).
   c. Calls `supabase.auth.signOut()` defensively (clears any stale session).
   d. **Primary path:** `POST /api/auth {action:'signup', email, password, name}` → server calls
      Postgres RPC `register_email_user(p_email, p_password, p_name)` via the **service-role**
      client. This RPC (defined in `supabase/migrations/*`, not yet inspected — `UNKNOWN` exact
      SQL, but behaviorally: creates the `auth.users` row bypassing GoTrue's own signup endpoint,
      returns `{ok, user_id}` or `{ok:false, error:'already_registered'|<password issue>}`).
      Rationale documented in code comment: avoids GoTrue's own HIBP leaked-password rejection
      interfering with the custom flow. On success, client then calls
      `supabase.auth.signInWithPassword` to establish the session (`signInAfterSignup`).
   e. **Fallback path** (if `/api/auth` unreachable — "Vite only" local dev without Vercel
      functions running): standard `supabase.auth.signUp({email, password, options:{data:{name},
      emailRedirectTo}})`. Error messages are pattern-matched (`validate email`, `already
      registered`, `known to be weak/pwned/hibp`) and rewritten into fixed Turkish user-facing
      strings (see verbatim strings in the file — Cursor must reuse these exact strings, not
      paraphrase).
   f. If signup succeeds but no session was returned, retries a plain sign-in
      (`signInAfterSignup`); if that fails with "not confirmed", calls
      `POST /api/auth {action:'unlock-signup', email, password}` which force-confirms the email via
      `admin.auth.admin.updateUserById(user.id, {email_confirm:true})` (service-role), then retries
      sign-in once more.
3. On auth success, `buildAndPersistMember()` builds the full `members` row (see field list in
   `06-api-analysis.md` §3) and **`upsertMember()`s it directly from the browser** (RLS must allow
   a member to insert/update their own row — verify RLS policy in `supabase/setup.sql` if a
   discrepancy appears during RN testing; not fully re-verified line-by-line in this pass).
4. Logs an `activities` row (`signup`), fires a Telegram notification (`notifyTelegram
   ('member_signup', ...)`), inserts a `payments` row if `opts.payment` was passed (paid signup),
   clears any `pending_registration` auth-user metadata.

## 4. Login flow

`AppContext.login(email, password, remember)` → `sb.login()`:
1. `setRememberMe(remember)` + `clearAllAuthTokens()` if NOT remembering (forces session storage
   only — see §7) + `syncAutoRefresh(remember)` (stops Supabase's background token auto-refresh
   entirely when "remember me" is off, so the session dies with the tab/session-storage).
2. `supabase.auth.signInWithPassword({email, password})`. **Any** error is normalized to the single
   message `'E-posta veya şifre hatalı.'` (no distinction surfaced between "wrong password" and
   "no such user" — deliberate to avoid user enumeration).
3. Resolves role via `roleForUser`, resolves a display name (`resolveActorName`), logs an
   `activities` row + Telegram notification specific to the role (`admin_login`/`staff_login`/
   `member_login`).
4. Back in `AppContext.login`: on success, calls `reloadRemote()` (full `hydrate()`), returns
   `{success, role, isAdmin}`.
5. Separately, `AppContext`'s `onAuthChange` listener fires `registerActiveSession()` on the
   `SIGNED_IN` event (see §5) — i.e., single-session claiming happens via the Supabase auth-state
   listener, not inline in the `login()` call itself.

## 5. Single active session enforcement ("signed in on another device" kill-switch)

Fully custom, server-assisted, verified in `src/services/singleSession.js` + `api/auth.js`
(`claim-active-session`/`verify-active-session` actions delegate to `api/_singleSession.js` —
`claimActiveSession`/`isActiveSession`, **not yet read in full**, marked for a follow-up pass but
behavior is inferable from call sites):
- On every `SIGNED_IN` event, the client calls `registerActiveSession()` →
  `POST /api/auth {action:'claim-active-session'}` with the fresh bearer token — this presumably
  records "this token/session is now THE active one" server-side (likely in a Postgres table
  keyed by user id, storing token or session id — `UNKNOWN` exact schema, not yet inspected).
- Every 60 seconds (`setInterval`) AND on `document.visibilitychange` → `'visible'`, AND on every
  `TOKEN_REFRESHED` auth event, the client calls `verifyActiveSessionOrSignOut()` →
  `verifyActiveSession()` → `POST /api/auth {action:'verify-active-session'}`. If the server says
  `valid:false` (i.e., a newer login elsewhere claimed the "active" slot), the client:
  1. Sets `sessionStorage['nf-session-revoked'] = '1'`.
  2. Calls `supabase.auth.signOut()` + `clearAllAuthTokens()`.
  3. On next render of the login page, `consumeSessionRevokedMessage()` reads+clears that flag and
     (presumably) shows the message `SESSION_REVOKED_MESSAGE = 'Hesabınız başka bir cihazdan
     açıldı. Güvenlik için bu oturum sonlandırıldı.'` — verify exact display site in `08` LoginPage
     analysis.
- **RN implication:** this pattern (poll + visibility-triggered check + forced sign-out) ports
  directly to RN using `AppState` (`'active'` transitions) instead of
  `document.visibilitychange`, and the same `/api/auth` endpoint. This is a genuine multi-device
  security feature and must be preserved exactly, not simplified.

## 6. Session establishment from URL (`AuthCallbackPage` support logic) — **web-only transport**

`src/services/authSessionFromUrl.js` (`establishAuthSessionFromUrl`) handles FOUR different
Supabase redirect shapes, tried in order:
1. `token_hash` + `type` query/hash params → `supabase.auth.verifyOtp({token_hash, type})`.
2. Already-detected session (race with Supabase's own `detectSessionInUrl`, which this project
   disables — see `supabaseClient.js` `detectSessionInUrl:false` — but a session may already exist
   from a previous exchange in the same tab).
3. PKCE `code` param → `supabase.auth.exchangeCodeForSession(code)`, with a fallback wait loop
   (`waitForDetectedSession`) in case the code was already consumed by a race.
4. Implicit hash tokens `access_token`+`refresh_token` → `supabase.auth.setSession(...)`.
5. Final fallback: poll `getSession()` for up to `waitMs` (default 2500ms).
`AuthRedirectHandler` (mounted at the app root, on every route except the 4 auth pages) exists
solely to catch cases where Supabase's hosted email templates redirect to the site ROOT instead of
`/auth/callback`, and re-navigates to `/auth/callback` with normalized params.
**This entire mechanism (URL query/hash parsing) is a web-browser-address-bar concept and has NO
direct RN equivalent.** For RN:
- Password reset / magic link / email verification links must open the app via a **custom URL
  scheme or Universal Link / App Link** (e.g. `yeniform://auth-callback?...` or
  `https://www.yeniform.com/auth/callback?...` configured as an associated domain), handled with
  `Linking.getInitialURL()`/`Linking.addEventListener('url', ...)` (or `expo-linking`).
  Supabase's redirect URL allow-list and email templates will need a mobile-aware redirect target
  — this is a **backend/Supabase-dashboard configuration task**, not a pure code port; flag as
  `RN-SPECIFIC — requires Supabase Auth redirect URL configuration`, tracked in the task list.
- The token-exchange **business logic** (steps 1/3/4 above — `verifyOtp`/`exchangeCodeForSession`/
  `setSession`) is unchanged; `@supabase/supabase-js` supports RN identically once given a
  `Linking`-sourced URL string instead of `window.location`.
- Google OAuth in RN requires `supabase.auth.signInWithOAuth` opened via an in-app browser
  (`expo-web-browser` / `react-native-inappbrowser-reborn`) rather than `window.location.replace`
  (`oauthAuth.js` line ~72) — again a transport change, not a logic change.

## 7. Session storage ("Beni hatırla" / Remember Me)

`src/services/authStorage.js` (verified, full file):
- `REMEMBER_KEY = 'nf-remember-me'` in `localStorage`.
- Custom Supabase `auth.storage` adapter: reads/writes to `localStorage` if remembered, else
  `sessionStorage`; on `setItem`, actively removes the key from the OTHER storage first (prevents
  stale duplicate tokens). `removeItem` clears from both. `getRememberMe()`/`setRememberMe()`
  control which storage is "active"; turning remember OFF also proactively deletes all
  `sb-*-auth-token*` keys from `localStorage` (`clearAllAuthTokens` helper, also used on logout and
  on forced sign-out from §5).
- `supabaseClient.js` also explicitly disables Supabase's automatic session-in-URL detection
  (`detectSessionInUrl:false`) and manually toggles `supabase.auth.startAutoRefresh()` /
  `stopAutoRefresh()` based on the remember-me flag (`syncAutoRefresh`) — i.e., **when "remember
  me" is off, background token refresh is disabled entirely**, so the session silently expires
  when the access token's TTL runs out even if the tab stays open.
- **RN port:** replace the `localStorage`/`sessionStorage` dichotomy with a single
  `@react-native-async-storage/async-storage`-backed adapter for "remembered" sessions. For the
  "don't remember me" case (session-only), RN has no direct sessionStorage equivalent — this
  needs an explicit design decision (e.g., in-memory-only storage that is cleared on app cold
  start) documented as a task, not invented silently by Cursor.

## 8. Logout

`AppContext.logout()`: sets `loggingOut=true` (UI shows a spinner on the sidebar logout button,
verified in `AdminShell`/`StaffShell`/`Sidebar`), flushes any pending optimistic notification
writes (`flushNotificationReads`), calls `sb.logout()` (logs an `activities` row + Telegram
notification, then `supabase.auth.signOut()` + `clearAllAuthTokens()` + `syncAutoRefresh(false)`),
then `reloadRemote()` (re-hydrates to the signed-out `EMPTY_DB`-ish state), finally
`loggingOut=false`.

## 9. Email verification (in-app, separate from Supabase's own `email_confirm`)

**Deliberately decoupled from Supabase's built-in `email_confirmed_at`** (source comment: "auth
tarafındaki email_confirmed_at kayıt sırasında sunucu tarafından açıldığı için güvenilmez" — i.e.
`register_email_user` RPC auto-confirms emails server-side for the custom signup flow, so Supabase's
own flag can't be used as a trust signal). Instead the app tracks its own
`members.data.emailVerifiedAt` field:
1. `sendEmailVerification()` → `POST /api/auth {action:'email-send'}` (bearer-token authenticated)
   → server generates a random 32-byte hex token (`evt`), stores
   `members.data.pendingEmailVerification = {token, expiresAt: now+24h, email}`, sends an OTP email
   via Supabase (`signInWithOtp` with `shouldCreateUser:false`) whose link points to
   `${APP_URL}/auth/callback?verify=email&evt=<token>`.
2. User clicks the link → `AuthCallbackPage` (not yet fully read — tracked in `08` doc) extracts
   `evt` → `confirmEmailVerificationByEvt(evt)` → `POST /api/auth {action:'email-confirm', evt}` →
   server looks up the member row by `data->pendingEmailVerification->>token`, checks expiry,
   optionally cross-checks the bearer token's user id if present (prevents verifying someone else's
   pending token while signed in as a different user), sets `emailVerifiedAt` and clears the
   pending object.
3. Alternative code-entry path: `confirmEmailVerification(code, member)` uses
   `supabase.auth.verifyOtp({email, token: code, type:'email'})` (6-digit OTP code typed manually)
   then calls `markEmailVerified`.
4. `refreshEmailVerification(member)` — a manual "check status" button re-reads
   `members.data.emailVerifiedAt` directly (no side effect) for the case where the user verified in
   another tab/device and needs the current tab to catch up.

## 10. Phone verification

Two paths depending on `VITE_PHONE_VERIFY_VIA_EMAIL` and whether an SMS provider is configured:
- **SMS OTP (primary):** `supabase.auth.updateUser({phone: e164})` → Supabase sends an SMS OTP to
  the E.164-formatted number → user enters the code → `supabase.auth.verifyOtp({phone, token, type:
  'phone_change'})` → `markPhoneVerified`.
- **Email-link fallback (if SMS provider errors, matched via regex on the error message
  containing `provider|twilio|messagebird|sms|not enabled|...`, or if
  `VITE_PHONE_VERIFY_VIA_EMAIL=true`):** stores `pendingPhoneVerify:{phone, e164, viaEmail:true,
  sentAt}` on the member, sends an OTP email to the (already verified) account email via
  `signInWithOtp` with a redirect to `/auth/callback?verify=phone`, and on confirmation uses
  `verifyOtp({email, token, type:'email'})` instead of the phone-based verify.

## 11. Staff-specific auth quirk: forced temporary-password change

Not part of `AppContext`/`supabaseDb.js` auth flow per se, but a **gate on top of an already
successful staff login**: `StaffShell` checks `staffUser.data.tempPasswordIssued` (set by an admin
when creating/resetting a staff account, presumably in `addStaff`/`editStaff` — verify exact set
site in `06-api-analysis.md`) and blocks the entire staff panel behind
`<StaffForcePasswordChange>` (`src/components/auth/StaffForcePasswordChange.jsx`, not yet read in
full — tracked for `09-components-analysis`) until the staff member sets a new password, after
which it flips `tempPasswordIssued:false` directly via a Supabase `staff` table update and calls
`refresh()`.

## 12. Server-side guard primitives (`api/_guards.js`, `api/_apiAuth.js` — verified, full files)

- `getBearerToken(req)` — reads `Authorization: Bearer <token>` header.
- `getUserFromRequest(req)` — resolves the Supabase user for that token via the **service-role**
  admin client's `auth.getUser(token)` (works even though the anon client didn't make the request —
  standard "verify JWT server-side" pattern).
- `requireAuth(req)` → `{ok:false, status:401}` if no valid user, else `{ok:true, user}`.
- `requireAdmin(req)` → `requireAuth` first, then checks email === `getAdminEmail()` (env
  `ADMIN_EMAIL`, default `admin@yeniform.com`) OR a `members.role === 'admin'` DB row; else
  `{ok:false, status:403}`.
- `requireNotifySecret(req)` — for Telegram/contact endpoints: requires header
  `x-notify-secret` to match `process.env.TELEGRAM_NOTIFY_SECRET`; **hard-fails with 503 in
  production if the secret env var itself is missing** (fails closed, not open); in non-production
  with no secret configured, skips the check (`{ok:true, skipped:true}`).
- `requireCronSecret(req)` — for Vercel Cron-triggered endpoints: accepts `Authorization: Bearer
  <CRON_SECRET>` (Vercel's own cron auth convention) or header `x-cron-secret`; same fail-closed
  behavior in production.
- `setCorsHeaders`/`handleOptions` — generic CORS + OPTIONS preflight helpers used by every
  endpoint.

These 6 guard primitives are the **entire server-side authorization model**. RN does not need to
port these (they stay on the Vercel backend), but every RN network call to a protected endpoint
must send `Authorization: Bearer <supabase_access_token>` exactly as `src/services/apiAuth.js`
(`getApiAuthHeaders`) already does — that helper's logic (get session, if none try `getUser()` then
re-read session, attach bearer if present) should be ported to RN verbatim.

## 13. Unresolved items (marked `UNKNOWN`, need a follow-up read pass before implementation)

- Exact SQL/logic of the `register_email_user` Postgres RPC (`supabase/migrations/*`).
- Exact SQL/logic of the `phone_in_use` Postgres RPC.
- Exact implementation of `api/_singleSession.js` (`claimActiveSession`, `isActiveSession`) —
  storage schema for "active session" tracking.
- `AuthCallbackPage.jsx` (15275 bytes) full internal logic — where each URL-param combination
  (`verify=email`, `verify=phone`, `next=reset-password`, OAuth `flow=login|signup&plan=`, plain
  error params) routes the user to. Tracked as a required deep-read in `08a-screens-analysis-*.md`
  before its corresponding RN task is written.
- Exact RLS policies gating direct browser `upsertMember`/`saveMemberPatch` calls — must be
  re-verified against `supabase/setup.sql` + `supabase/migrations/*.sql` before assuming the RN app
  can perform the same direct-to-Postgres writes unchanged.

---
*Cross-reference: `04-state-management.md` §5-6 for how these functions are exposed via
`useApp()`; `06-api-analysis.md` for the full `/api/auth` action catalogue in endpoint-table form.*
