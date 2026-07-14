# 01 — Architecture Overview

## 1. Stack (verified)

| Layer | Technology | Source |
|---|---|---|
| UI framework | React 19 | `package.json` |
| Build tool | Vite 8 (`@vitejs/plugin-react`) | `package.json`, `vite.config.js` |
| Routing | `react-router-dom` v7, `BrowserRouter` (client-side, no SSR) | `src/App.jsx` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` plugin + hand-written `src/index.css` (57KB) | `vite.config.js`, `src/index.css` |
| Backend/DB | Supabase (Postgres + Auth + Storage + Realtime), accessed directly from the browser via `@supabase/supabase-js` | `src/services/supabaseClient.js` |
| Serverless functions | `api/*.js` — Vercel serverless functions (plain Node handlers, `export default async function handler(req, res)`), NOT Express | `api/` |
| Payments | Stripe Checkout (redirect flow), webhook-driven fulfillment | `api/stripe-checkout.js`, `api/stripe-webhook.js`, `src/config/stripe.js` |
| Video calls | Daily.co (`@daily-co/daily-js`), room/token minted server-side | `api/daily-room.js`, `src/config/videoCall.js`, `src/hooks/useDailyCall.js` |
| AI | Google Gemini (`api/_gemini.js`) for food-photo/food-text analysis, nutrition tips, blog generation | `api/ai-food-vision.js`, `api/ai-food-text.js`, `api/ai-nutrition-tips.js`, `api/ai-blog-generate.js` |
| Ops notifications | Telegram bot (`api/telegram-notify.js`, `src/services/telegramNotify.js`) | — |
| Charts | `recharts` | `package.json` |
| Animation | `framer-motion` | `package.json` |
| Icons | `lucide-react` | `package.json` |
| PDF export | `html2pdf.js` (client-side HTML→PDF, used for exporting chat transcripts / staff CVs) | `src/utils/exportChatPdf.js`, `src/utils/exportStaffApplicationCv.js` |
| Dates | `date-fns` | `package.json` |
| Analytics | Google Analytics 4 (custom loader, no `react-ga`) | `src/utils/ga4Loader.js`, `src/components/analytics/GoogleAnalytics.jsx` |

**No Redux, no Redux Toolkit, no MobX, no Zustand, no react-query/SWR/TanStack Query, no
axios, no GraphQL, no i18n library.** All of these are custom-built with plain React state,
`useContext`, and direct `fetch`/Supabase-client calls. This is critical for the RN blueprint:
there is no existing "clean" API abstraction layer to port — the data-access pattern IS
`src/services/supabaseDb.js` plus ~30 sibling service files, called directly from `AppContext`
and from pages/components.

## 2. Application bootstrap

```
index.html  (Vite SPA shell — <div id="root">, meta tags, GA4 script slot)
  → src/main.jsx  (ReactDOM.createRoot().render(<App/>))
    → src/App.jsx
       → <BrowserRouter>
          → <AppProvider>          (src/context/AppContext.jsx — global state/data)
             → <ToastProvider>     (src/context/ToastContext.jsx — toast notifications)
                → <NotificationAudioUnlock/>   (unlocks browser audio autoplay for chat "ding")
                → <NotificationToastBridge/>   (bridges member notifications → toast popups)
                → <GoogleAnalytics/>           (GA4 pageview tracking on route change)
                → <AuthRedirectHandler/>       (normalizes Supabase auth redirect params → /auth/callback)
                → <Suspense fallback={<RouteFallback/>}>
                   → <Routes> ... 63 routes (see 05-navigation-graph.md) ...
```

`src/main.jsx` (verified, full file — 229 bytes): renders `<App/>` into `#root`, wrapped in
`React.StrictMode`. No other bootstrap logic (no Sentry init, no service worker registration
visible in this file — check `public/` and `index.html` separately for any SW/manifest wiring,
marked `UNKNOWN` here since not yet inspected in this pass).

## 3. Provider tree and responsibilities

| Provider/Component | File | Responsibility |
|---|---|---|
| `AppProvider` | `src/context/AppContext.jsx` | Single global state container: session/auth, member/staff/admin profile, programs, chat (3 separate chat systems), notifications, applications, exercises, plans, presence, realtime sync, admin stats. Exposes ~40 state fields and ~55 action functions via `useApp()`. See `04-state-management.md`. |
| `ToastProvider` | `src/context/ToastContext.jsx` | Toast/snackbar queue (`success`/`error`/`warning`/`info`), auto-dismiss after 3.5s default, rendered as a fixed bottom-right stack with `framer-motion` enter/exit. |
| `NotificationAudioUnlock` | `src/components/notifications/NotificationAudioUnlock.jsx` | One-shot listener on first user interaction to unlock `<audio>` autoplay (browser policy) for the incoming-chat sound. |
| `NotificationToastBridge` | `src/components/notifications/NotificationToastBridge.jsx` | Watches `AppContext` notifications state and pushes new ones into the toast queue. |
| `GoogleAnalytics` | `src/components/analytics/GoogleAnalytics.jsx` | Fires GA4 `page_view` on every route change (via `useLocation`). |
| `AuthRedirectHandler` | `src/components/auth/AuthRedirectHandler.jsx` | Supabase sometimes redirects PKCE/OTP callbacks to the site root with `?code=`/`#access_token=` instead of `/auth/callback`; this component detects that on ANY route (except the auth pages themselves) and re-routes to `/auth/callback` with normalized query params. **RN has no URL bar / redirect ambiguity** — this whole component's problem does not exist in RN (deep link handling replaces it entirely; see `07-authentication.md`). |

## 4. Request/data lifecycle (typical authenticated page load)

1. Browser loads `index.html` → Vite serves `src/main.jsx` bundle.
2. `AppProvider` mounts. If `isSupabaseEnabled` is false (missing env vars) → renders
   `ConfigErrorScreen` and stops (see `src/services/supabaseClient.js`). This is a **hard
   dependency** — the entire app cannot function without Supabase URL + anon/publishable key.
3. `AppProvider` calls `sb.hydrate()` (`src/services/supabaseDb.js`) once on mount. `hydrate()`:
   - Resolves the current Supabase auth user (`resolveAuthUser`), determines role
     (`admin`/`staff`/`member`) by comparing email to `ADMIN_EMAIL` and to the `staff` table.
   - Fetches `staff`, `staff_directory`, `posts`, `site_content`, `exercises` (count only),
     `plans` in parallel (public/shared data — fetched even for signed-out visitors, since the
     landing page needs plans/posts/team).
   - If authenticated: fetches role-scoped `members`/`programs`/`tickets`/`activities`/`payments`
     (own row only for `member`, all rows for `staff`/`admin`, RLS-enforced), plus
     `staff_applications`/`corporate_applications`/`contact_inquiries` for `admin` only.
   - Returns one big `db` object cached in `AppContext` state (`remoteDb`).
4. `AppContext` derives `currentMember`/`currentStaff`/`isAdmin`/`isStaff`/`isAuthenticated`
   and dozens of memoized selectors (`adminStats`, `myPrograms`, `chatUnreadCount`, etc.) from
   this single `db` object — **this is the entire "state normalization" layer**; there is no
   separate normalized store, everything is derived via `useMemo` on each render.
5. `RequireAuth` (route guard) reads `isAuthenticated`/`isAdmin`/`isStaff` from `AppContext` and
   redirects via `<Navigate>` if the role doesn't match the route's required role.
6. Most write actions (`login`, `register`, `addStaff`, `createProgram`, etc.) call
   `sb.<mutationFn>()` then **re-run the entire `hydrate()`** (`reloadRemote()`) rather than
   patching local state — i.e., **no fine-grained cache invalidation**, just "refetch everything."
   A few hot paths use true optimistic local patches instead (member profile patch,
   notification read-state, health-test progress) — see `04-state-management.md` §5.
7. Supabase Realtime channels (`src/hooks/useRealtimeSync.js`) push incremental updates for
   chat/tickets/programs/members into the same `remoteDb` state between hydrates.

## 5. Why there is no "API layer" to port 1:1

Unlike a typical REST/GraphQL app, this project has:
- **No custom backend business-logic server.** `api/*.js` Vercel functions exist ONLY for
  operations that require a secret (Supabase service-role key, Stripe secret key, Gemini API
  key, Telegram bot token, Daily.co API key) that must never reach the browser. Everything else
  (all CRUD on `members`/`programs`/`tickets`/etc.) is done by the browser talking **directly**
  to Supabase's PostgREST API via `@supabase/supabase-js`, secured by Postgres Row-Level Security
  (RLS) policies defined in `supabase/setup.sql` + `supabase/migrations/*.sql`.
- **The "endpoints" for most data are Supabase table/RPC calls, not HTTP routes.** See
  `06-api-analysis.md` for the full catalogue of both the 12 real `api/*.js` HTTP endpoints and
  the Supabase table/RPC calls used from `src/services/*.js`.
- For RN, the exact same Supabase project (same URL/anon key/RLS policies) will be reused,
  through `@supabase/supabase-js` (which supports React Native with an `AsyncStorage` adapter).
  The 12 Vercel functions in `api/` will also be reused as-is (they are plain HTTP JSON
  endpoints, framework-agnostic) — the RN app simply calls the same production URLs
  (`https://www.yeniform.com/api/...`), it does not need to reimplement them.

## 6. Environment variables (verified via `import.meta.env.VITE_*` references in code)

`.env`/`.env.example`/`.env.local` files exist but are **gitignored and inaccessible to this
tool** (blocked by `.gitignore`), so exact values/defaults are `UNKNOWN`. The following variable
**names** were recovered by grepping `import.meta.env.` usages across `src/` and `process.env.`
usages across `api/`:

**Client-side (`VITE_` prefix, bundled into the app, safe to expose):**
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY` (legacy fallback),
`VITE_ADMIN_EMAIL`, `VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_FACEBOOK`, `VITE_SOCIAL_LINKEDIN`,
`VITE_SOCIAL_X`, `VITE_SOCIAL_YOUTUBE`, `VITE_GA4_MEASUREMENT_ID`, `VITE_STRIPE_ENABLED`,
`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_DAILY_DOMAIN`, `VITE_DAILY_ROOM_PREFIX`,
`VITE_DAILY_API_KEY` (referenced in `videoCall.js` but real key usage is server-side, see below),
`VITE_VIDEO_JOIN_MINUTES_BEFORE`, `VITE_VIDEO_JOIN_MINUTES_AFTER`, `VITE_PHONE_VERIFY_VIA_EMAIL`,
`VITE_SITE_URL`, `VITE_TELEGRAM_NOTIFY_SECRET`.

**Server-side only (`api/*.js`, `process.env.*`, never bundled):**
`ADMIN_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_NOTIFY_SECRET`, `CRON_SECRET`,
`GEMINI_API_KEY`, `DAILY_API_KEY`, `APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NODE_ENV`, `VERCEL` (Vercel platform flag). Full enumeration pending a complete read of every
`api/*.js` file — tracked in `06-api-analysis.md`.

**RN migration implication:** RN cannot use `import.meta.env` (Vite-specific). Use
`react-native-config` or Expo's `expo-constants`/`app.config.js` + `EXPO_PUBLIC_` prefix (if
using Expo) for the client-side variable set above. Server-side secrets stay exactly where they
are (Vercel serverless functions) — **do not** move any `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, `DAILY_API_KEY`, or `TELEGRAM_*` secret into the mobile
app bundle under any circumstances.

## 7. Build/deploy tooling (context only — not part of the runtime app to port)

- `vite.config.js`, `vercel.json`: Vite build + Vercel routing/build config. Not applicable to RN.
- `scripts/` (22 files): Node maintenance scripts (exercise data import, video thumbnail
  generation, video compression/faststart, OG image generation, DB migration runner, RLS/Stripe
  test scripts). These are **operator tooling**, not part of the shipped app; RN migration does
  not need to port them, but the RN app will consume the data they produce (e.g., exercise videos
  in Supabase Storage).
- `eslint.config.js`: lint rules only.

---
*Next: `02-folder-structure-file-inventory.md` for the exhaustive per-file table, or jump to
`04-state-management.md` for the `AppContext` deep dive.*
