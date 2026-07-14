# 06 — API Analysis

Two distinct "API" layers exist. **Layer A** = 12 real HTTP endpoints under `api/*.js` (Vercel
serverless functions, called via `fetch()`), documented exhaustively in §1 (all 12 read in full).
**Layer B** = direct Supabase table/RPC access from `src/services/*.js` (no HTTP layer at all —
the "endpoint" is a Postgres table + RLS policy), documented in §2 (partially verified; the
service layer is 35 files/~230 exported functions, the single largest file `supabaseDb.js` —
2053 lines — has been read across its first ~900 lines in full plus grep-located signatures for
the remainder; full 100% line-by-line coverage of every mutation is tracked as `UNKNOWN`/pending
in §2.4 and must be completed before writing the corresponding RN data-layer tasks).

## 1. Layer A — Vercel serverless endpoints (`api/*.js`)

All 12 public endpoints share this shape: `export default async function handler(req, res)`,
manual CORS headers, manual `OPTIONS` short-circuit, manual JSON body parsing
(`typeof req.body === 'string' ? JSON.parse(req.body) : req.body`), manual method check, then a
guard from `api/_guards.js`. **There is no Express, no router library, no middleware chain** —
every file is a fully self-contained handler. Several endpoints are "fan-in" routers themselves
(one file, multiple logical actions) to stay under Vercel Hobby's 12-serverless-function limit
(explicit source comments confirm this — `api/auth.js` and `api/ai-blog-generate.js`).

| # | Method | URL | Auth | Purpose | Request body | Success response | Error responses |
|---|---|---|---|---|---|---|---|
| 1 | POST | `/api/auth` | none / bearer (action-dependent) | Unified auth router — 11 actions (see table below) | `{action, ...}` | `{ok:true, ...}` | 400/401/403/405/409/503 |
| 2 | POST | `/api/contact.js` → `/api/contact` | `requireNotifySecret` (header `X-Notify-Secret`) | "Bize Ulaşın" contact form → Telegram | `{name,email,phone?,subject,message}` | `{ok:true}` | 400 (missing/short fields), 401 (bad secret), 405, 502 (Telegram failure), 503 (missing `TELEGRAM_CONTACT_CHAT_ID`) |
| 3 | POST | `/api/application-notify` | `requireNotifySecret` | Staff/corporate application → Telegram (2 sub-types) | `{type:'staff_application'\|'corporate_application', ...}` | `{ok:true}` | 400, 401, 405, 502, 503 |
| 4 | POST | `/api/telegram-notify` | `requireNotifySecret` | Generic internal event → Telegram (login/logout/signup templates, §1.1) | `{event, name?, email?, role?, at?}` or `{message}` | `{ok:true}` | 401, 405, 502, 503 |
| 5 | POST | `/api/daily-room` | `requireAuth` (bearer) | Create/ensure a Daily.co room + mint a meeting token | `{roomName, userName?, isOwner?}` | `{ok:true, token, roomUrl}` | 400 (`roomName` required), 401, 405, 500, 503 (`DAILY_API_KEY` missing) |
| 6 | POST | `/api/ai-food-text` | `requireAuth` | Gemini text→calorie analysis (chat "I ate X" messages) | `{text}` (≤2000 chars) | `{ok:true, label, items:[{name,amount,unit,cal}], confidence}` | 400 (empty/too long), 401, 405, 502/500 (Gemini error), 503 (`GEMINI_API_KEY` missing) |
| 7 | POST | `/api/ai-food-vision` | `requireAuth` | Gemini 2.0 Flash vision→calorie analysis (food photo) | `{image: base64 or data-URL, mimeType?}` | same shape as #6 | 400 (`image` required), 401, 405, 500/502, 503 |
| 8 | POST | `/api/ai-nutrition-tips` | `requireAuth` | Gemini personalized nutrition tips (water/hydration tips explicitly filtered out — `filterTips` regex `\bsu\b|hidrasyon|litre|water`) | `{profile, healthTestSummary}` | `{ok:true, tips:[string]≤6, focus, aiGenerated:true}` | 401, 405, 500, 502 (0 tips after filtering), 503 |
| 9 | GET/POST | `/api/ai-blog-generate` (also fans in `?task=daily-tip`→`_dailyTip.js`, `?task=supabase-health`→`_supabaseHealth.js`) | `requireCronSecret` (Vercel Cron `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret`) | Autonomous daily blog-post generator (Gemini), dedups by "already posted today" unless `force:true`/`?force=true`; topic rotation via `BLOG_TOPIC_ROTATION`, deterministic by day-of-year | `{force?:bool}` (blog task) | 201 `{ok:true, id, title, category, charCount, readMinutes, createdAt}`; 200 `{ok:true, skipped:true, reason}` if already posted | 405, 500, 502 (content too short — `BLOG_MIN_CHARS`), 503 |
| 10 | POST | `/api/stripe-checkout` | bearer (manual, not `_guards.js`) | Create a Stripe Checkout session for a paid plan purchase/change | `{planId, durationMonths?:1\|3\|6, flow?:'register'\|'change', email?}` | `{ok:true, url, id}` | 400 (invalid plan / no price found), 401, 405, 500, 503 (Stripe or Supabase admin not configured) |
| 11 | POST | `/api/stripe-webhook` (`bodyParser:false` — raw body required for signature verify) | Stripe signature (`stripe-signature` header + `STRIPE_WEBHOOK_SECRET`) | Fulfillment: activates membership on `checkout.session.completed`; Telegram-notifies on completed/expired/async-failed/payment_intent.failed | raw Stripe event | `{received:true}` | 400 (signature invalid), 500 |
| 12 | POST | `/api/telegram-notify` | (listed above, #4) | — | — | — | — |
| 13 | GET/HEAD | `/api/sitemap.js` (served at `/sitemap.xml` via `vercel.json` rewrite) | none (public) | Dynamic XML sitemap: static routes + published blog posts + active staff profiles | — | XML body, `Content-Type: application/xml`, `s-maxage=3600` | 405 (wrong method) |

**Endpoint #13 (`sitemap.js`) is 100% SEO/web-only — explicitly out of scope for the RN app (no
search-engine crawling of a mobile app). Do not port; mark any related task `SKIP — web-only`.**

### 1.1 `/api/auth` action sub-table (verified, all 11 actions read in `api/auth.js`)

| Action | Auth | Body | Behavior |
|---|---|---|---|
| `signup` | none | `{email,password,name}` | Calls Postgres RPC `register_email_user` via service-role (bypasses GoTrue's own signup to control password-validation error messages); 409 if `already_registered`. |
| `unlock-signup` | none | `{email,password}` | Force-confirms an unconfirmed email (`admin.auth.admin.updateUserById(..., {email_confirm:true})`) after verifying the password is correct via a throwaway anon client sign-in attempt. |
| `email-send` | bearer | `{action:'email-send'}` | Generates a 32-byte-hex `evt` token, stores `members.data.pendingEmailVerification{token,expiresAt:+24h,email}`, sends OTP email via `signInWithOtp`. |
| `email-confirm` | none/bearer optional | `{evt}` | Looks up member by `data->pendingEmailVerification->>token` (Postgres JSON path filter), checks 24h expiry, sets `emailVerifiedAt`. |
| `password-reset` | none | `{email}` | Sends a Supabase recovery email via direct `POST {SUPABASE_URL}/auth/v1/recover` (service-role), redirect to `/auth/callback?next=reset-password`. |
| `book-session` | bearer | `{type, startsAt, duration}` | Delegates to `api/_bookSession.js` `bookSessionForMember` (not yet fully read — tracked `UNKNOWN`). |
| `exercise-video-url` | bearer | `{path}` | Signed URL (15 min TTL) for one exercise video in Supabase Storage bucket `exercise-videos`; path validated against `^[\w.-]+$` (no traversal). |
| `exercise-video-urls` | bearer | `{paths:[]}` (max 30, deduped) | Batch signed URLs, same bucket/TTL. |
| `ga4-report` | (delegates to `_ga4Report.js`, guard internal) | — | GA4 reporting proxy — not yet fully read, tracked `UNKNOWN`. |
| `claim-active-session` | bearer | — | Delegates to `api/_singleSession.js` `claimActiveSession` — records this token as the one active session for the user (exact storage schema `UNKNOWN`, pending read). |
| `verify-active-session` | bearer | — | Delegates to `isActiveSession(user, token)` — returns `{ok:true, valid:bool}`. |

### 1.2 Server-side internal helper files (`_`-prefixed, not directly callable) — inventory only, NOT yet fully read line-by-line

| File | Inferred purpose (from imports/usage at call sites) |
|---|---|
| `_ai-prompts.js` | All Gemini prompt templates/config objects (`FOOD_TEXT_*`, `FOOD_VISION_*`, `NUTRITION_*`, `BLOG_*`) — the actual AI prompt engineering lives here. |
| `_apiAuth.js` | `getBearerToken`, `getUserFromRequest` (verified, read in full — see `07-authentication.md` §12). |
| `_appUrl.js` | `getAppUrl()` — resolves the canonical app URL for building redirect links server-side. |
| `_blog-images.js` | `coverForCategory(category)` — maps a blog category to a stock cover image + alt text. |
| `_bookSession.js` | `bookSessionForMember` — server-side self-service appointment booking logic (conflict checking against staff availability), used by `/api/auth {action:'book-session'}`. |
| `_createMemberFromPending.js` | `createMemberFromPendingRegistration` — used by `stripe-webhook.js` to create the `members` row from `auth.users.user_metadata.pending_registration` after a successful paid Stripe Checkout (i.e., **paid registration creates the Postgres user record only after payment**, not before). |
| `_daily-tip-fallback.js` | Static fallback "tip of the day" content if Gemini generation fails/is skipped. |
| `_dailyTip.js` | `handleDailyTip` — daily dashboard tip endpoint logic (cron + on-demand). |
| `_email.js` | `normalizeEmailAddress` (server-side mirror of the client util). |
| `_ga4Report.js` | `handleGa4Report` — GA4 Reporting API proxy (admin analytics). |
| `_gemini.js` | `callGemini`, `parseJsonResponse`, `isGeminiConfigured` — the actual Gemini API client wrapper. |
| `_guards.js` | Verified in full — see `07-authentication.md` §12. |
| `_memberPackages.js` | Server-side mirrors of `src/utils/memberPackages.js` logic (`resolvePackagePurchase`, `isOneTimePlan`, `migrateLegacyToPackages`, `sanitizeStaffForPackage`, `syncMemberPackages`) — duplicated (not imported) between client and server, a **potential drift risk** flagged for `15-risks-migration-strategy.md`. |
| `_password.js` | `isPasswordValid`, `passwordRequirementsMessage`, `formatPasswordAuthError` — password policy enforcement (server-side; client-side equivalent in `src/services/password.js`, not yet cross-checked for identical rules — flagged `UNKNOWN`, must verify both match before RN implements its own client-side validator). |
| `_singleSession.js` | `claimActiveSession`, `isActiveSession` — single-session-enforcement storage, not yet read. |
| `_stripe.js` | `getStripe`, `isStripeConfigured`, `CURRENCY`, `PLAN_FALLBACK`, `isPaidPlanId`, `toMinorUnits`, `getTierPrice` — Stripe SDK wrapper + plan/price fallback table. |
| `_supabaseAdmin.js` | `getSupabaseAdmin`, `getSupabaseUrl`, `isSupabaseAdminConfigured` — service-role Supabase client factory (verified via usage, not yet read in full). |
| `_supabaseHealth.js` | `handleSupabaseHealth` — ops health-check cron (Supabase quota/access), Telegram-alerts on failure. |
| `_telegramSend.js` | `sendTelegramMessage({chatId, text})` — shared Telegram send helper (used by `application-notify.js`, `stripe-webhook.js`). |

**These 19 internal files require a dedicated follow-up read-through before the corresponding
RN/backend-integration tasks are finalized** — they are NOT part of the RN app's own codebase
(they stay on Vercel), but their **request/response contracts** must be 100% understood since RN
calls them exactly as the web app does. Tracked as open work in `00-INDEX.md`.

## 2. Layer B — Supabase direct-access data layer (`src/services/supabaseDb.js` + siblings)

### 2.1 Verified Postgres tables (from `hydrate()`/`hydrateOnce()`, fully read)

`members`, `staff`, `staff_directory` (a restricted-column public view/table of `staff`, added by
migration `20260715_staff_contact_field_hardening` per source comment — RLS on raw `staff` now
scopes to admin/self only), `programs`, `posts` (blog), `tickets` (support), `activities`
(audit/activity feed), `payments`, `exercises` (count-only in hydrate; full rows fetched
separately), `site_content` (generic `kind`-tagged content: `testimonial`/`faq`/`success_story`/
`exercise_taxonomy`), `plans`, `staff_applications`, `corporate_applications`,
`contact_inquiries`. Every one of these (except `staff_directory`) follows the **same storage
pattern**: a handful of real/queryable columns (id, and whatever needs indexing/RLS-filtering —
e.g. `member_id`, `email`, `role`, `status`, `published`, `is_active`) PLUS one `data JSONB`
column holding the rest of the object as free-form JSON, reassembled client-side by a
`rowTo<Entity>()` mapper function. **This is the entire "schema" — there is no fully-normalized
relational schema for anything except the FK-like scalar columns.** RN implementers must NOT
attempt to "normalize" this into stricter typed tables — reuse the exact same tables/columns.

### 2.2 Verified auth/session functions (full read, see `07-authentication.md` for behavior)
`getSession`, `getUser`, `resolveAuthUser`, `onAuthChange`, `AUTH_EVENTS_REQUIRING_HYDRATE`,
`hydrate`/`hydrateOnce`/`fetchAuthenticatedBundle`, `fetchMemberSessions`,
`fetchAdminSessionSummaries`, `login`, `logout`, `ensureAuthForRegistration`,
`savePendingRegistrationMetadata`, `clearPendingRegistrationMetadata`, `register`,
`completeOAuthMember`, `resolveQuickPostLoginPath`, `recordSocialLogin`, `registerWithPayment`,
`registerWithPlan`.

### 2.3 Verified member-mutation functions (full read)
`saveMemberPatch` (generic member field patcher — the workhorse used by most of `AppContext`'s
"Strategy A" actions, includes phone-normalization side logic per source), `patchMemberVerification`,
`saveSupportSchedule`, `processPremiumPayment`, `changeMemberPlan`, `withPremiumDates` (internal
helper — computes `premiumStartedAt`/`premiumExpiresAt`/`packageConfig` from a plan+duration),
`buildAndPersistMember` (internal — full field list for a newly-registered member, see
`07-authentication.md` §3 step 3), `upsertMember` (internal), `addActivity` (internal — audit log
writer, also fires Telegram).

### 2.4 Remaining functions — enumerated by name via grep (NOT yet individually read; behavior
inferred only from name + surrounding domain comments, marked `UNKNOWN` pending full read)

Staff admin: `addStaff`, `editStaff`, `updateStaffSelfProfile`, `removeStaff`.
Member admin: `removeMember`, `adminUpdatePremiumMembership`, `adminSetMembershipStatus`.
Programs: `createProgram` (+ likely edit/list helpers inside `StaffClientProgramPage`/
`NutritionProgramBuilder`, cross-check in `09` doc).
Blog: `addPost`, `editPost`, `removePost`.
Tickets: `createTicket`, `setTicketStatus`, `sendTicketReply`.
Exercises: `uploadExerciseVideo`, `getExerciseVideoUrl`, `addExercise`, `editExercise`,
`removeExercise`, `reassignExerciseCategory`, `upsertExerciseTaxonomy` (+ separate
`src/services/exerciseLibrary.js`, 10 exports, for the paginated public-facing library —
NOT yet read).
Applications: `resolveStaffApplication`, `resolveCorporateApplication`,
`updateContactInquiryStatus`.
Site content: `addContent`, `editContent`, `removeContent`.
Success stories: `submitSuccessStory`.
Sessions/booking: `bookStaffSession`, `getStaffBookedSlots`.
Plans: `getPlans`, `upsertPlan` (verified, full read).

Sibling service files not yet individually read in full (grouped by domain, exports counted via
grep in this pass): `chatDb.js` (12 exports — member↔staff chat), `adminChatDb.js` (10 — admin↔
staff chat), `staffCollabChatDb.js` (12 — coach↔dietitian collab chat), `exerciseLibrary.js` (10),
`platformStats.js` (8 — admin dashboard aggregates, partially inferred from `AppContext` call
sites: `getCurrentMember`, `getCurrentStaff`, `computeAdminStats`, `computeMembershipBreakdown`,
`computeOnboardingFunnel`, `computeMonthlyGrowth`, `getSessionStats`), `premiumMembership.js` (8),
`presenceService.js` (8 — `startPresenceTracker` verified by call site), `aiAnalysis.js` (6 —
client-side wrapper calling `/api/ai-food-text`/`/api/ai-food-vision`/`/api/ai-nutrition-tips`),
`singleSession.js` (verified, full read — §), `videoCallSession.js` (6), `health.js` (5),
`memberNotifications.js` (5 — verified partially via `AppContext` imports:
`notifyMemberProgram`, `pushMemberNotification`, `buildMemberNotification`),
`staffAssignment.js` (5 — `applyStaffAssignments`, used by `hydrate` pipeline indirectly),
`availability.js` (4), `exerciseVideoUrlCache.js` (4), `password.js` (4), `sessionAttendance.js`
(4 — referenced in `YAPILACAKLAR.md` as a **planned/incomplete** staff-earnings feature, see
§2.5), `aiVision.js` (3), `authSessionFromUrl.js` (verified, full read), `calorieChat.js` (3),
`oauthAuth.js` (verified, full read), `packagePricing.js` (3 — `calculatePackagePrice`, used
throughout §2.3), `applicationNotify.js` (2), `memberHealthSync.js` (2), `aiNutritionTips.js` (1),
`apiAuth.js` (verified, full read), `contactForm.js` (1), `dailyTip.js` (1), `ga4Report.js` (1),
`stripePayment.js` (1), `telegramNotify.js` (1 — `notifyTelegram`, client-side helper that POSTs to
`/api/telegram-notify`).

**Action required before RN data-layer tasks are finalized:** a dedicated follow-up pass must
read every one of the ~28 unread service files above line-by-line. This blueprint explicitly
flags this rather than guessing their contents, per the "never invent" rule.

### 2.5 Known planned-but-NOT-implemented feature (verified against `YAPILACAKLAR.md`)
"Personel hakediş modülü" (staff payout/earnings module) — `staff_earning_lines` table +
`sessionAttendance.js` + a planned `/api/session-attendance` endpoint are listed in
`YAPILACAKLAR.md` as **P2, not yet built** ("⬜"). `src/services/sessionAttendance.js` (3429
bytes) exists but its actual completeness is `UNKNOWN` — must be read before assuming it is
functional; do not build RN screens against features that turn out to be stubs.

## 3. Retry/caching/timeout policy (verified — or explicitly absent)

- **No retry logic anywhere** in `api/*.js` or `src/services/*.js` — a single failed `fetch`/
  Supabase call surfaces its error immediately to the caller (typically rendered as a toast via
  `useToast()` or an inline error string). RN must not invent retry logic beyond what is specified
  in a task.
- **No client-side response caching layer** (no react-query, no SWR, no manual TTL cache) except
  two narrow, explicit exceptions: `exerciseVideoUrlCache.js` (caches signed video URLs
  client-side, presumably respecting the 15-minute TTL from `/api/auth
  {action:'exercise-video-url'}`) and the in-flight de-dupe in `hydrate()`
  (`hydrateInFlight` promise memo prevents concurrent duplicate hydrates, not a time-based cache).
- **Timeouts:** none explicitly set on `fetch()` calls (relies on browser/platform defaults). RN
  (especially on cellular networks) may need explicit timeouts — a candidate improvement, but per
  the "no redesign" rule this must be raised as an explicit, separately-approved task in
  `15-risks-migration-strategy.md`, not silently added.
- **Signed URL TTLs (verified):** exercise video signed URLs expire after 15 minutes
  (`EXERCISE_VIDEO_EXPIRES = 15*60` in `api/auth.js`); Daily.co meeting tokens expire after 1 hour
  and become valid 60 seconds in the past (`nbf`) per `api/daily-room.js`; Daily.co rooms
  auto-delete 2 hours after creation.

---
*Cross-reference: `07-authentication.md` for the auth-specific subset of this API surface;
`13-forms-validation.md` for how form submissions map to these endpoints;
`14-edge-cases.md` for the error-response handling matrix per endpoint.*
