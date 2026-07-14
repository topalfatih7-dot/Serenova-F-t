# React Native Migration Blueprint — "Yeni Form" (Serenova-F-t)

> Source of truth for a full, ground-up React Native rebuild of the existing React + Vite web app.
> Built by exhaustive inspection of the repository at `c:\Users\opas2\OneDrive\Desktop\Serenova-F-t`.
> Status legend: ✅ done · 🚧 in progress · ⬜ not started yet.
>
> **Rule for the implementing agent (Cursor):** this document set is the ONLY source of truth.
> Do not guess, invent, redesign, rename, or "improve" anything. If something is not documented here,
> treat it as `UNKNOWN` and stop to ask, do not assume. Every business rule referenced here was read
> directly from the source files listed next to it — file paths are given so you can re-verify.

## 0. How this blueprint is organized

This is a **multi-file** document set under `docs/rn-migration/`. Read files in numeric order the first
time; after that, use this index to jump to the section you need.

| # | File | Contents | Status |
|---|------|----------|--------|
| 00 | `00-INDEX.md` | This file — executive summary, map, legend | 🚧 |
| 01 | `01-architecture-overview.md` | Stack, entry point, provider tree, request lifecycle | ✅ |
| 02 | `02-folder-structure-file-inventory.md` | Every file in `src/`, `api/`, `supabase/`, purpose column | ⬜ |
| 03 | `03-dependency-graphs.md` | Component/hook/context/API dependency graphs | ⬜ |
| 04 | `04-state-management.md` | `AppContext`, `ToastContext`, data flow, realtime sync | ✅ |
| 05 | `05-navigation-graph.md` | Full route table, guards, redirects, deep links | ✅ |
| 06 | `06-api-analysis.md` | `api/*.js` serverless endpoints + `src/services/*` DB layer | 🚧 (12/12 HTTP endpoints done; ~28 service files pending deep read) |
| 07 | `07-authentication.md` | Login/logout/refresh/roles/session/OAuth/Apple | ✅ |
| 08a/08b | `08a-screens-analysis-*.md` | Screen-by-screen analysis (63 pages) | ⬜ |
| 09a/09b | `09a-components-analysis-*.md` | Component-by-component analysis (126 components) | ⬜ |
| 10 | `10-hooks-utils-analysis.md` | 14 hooks + 38 utils | ⬜ |
| 11 | `11-ui-design-system.md` | Colors, typography, spacing, Tailwind theme, dark mode | ⬜ |
| 12 | `12-third-party-libraries.md` | Every npm package, RN equivalent, migration difficulty | ⬜ |
| 13 | `13-forms-validation.md` | Every form, fields, validation rules | ⬜ |
| 14 | `14-edge-cases.md` | Empty/error/offline/401/403/race-condition catalogue | ⬜ |
| 15 | `15-risks-migration-strategy.md` | Risks, phased strategy, RN-specific gaps | ⬜ |
| 16-19 | `16-task-list-*.md` | Atomic implementation tasks (Task 001 → N) | ⬜ |
| 20 | `20-final-validation-checklist.md` | Final sign-off checklist | ⬜ |

## 1. Executive Summary

**Product:** "Yeni Form" (brand) / repo name `donusum-programi` — a Turkish-language online
coaching/wellness platform (coaching, dietitian, doctor consultations, video calls, exercise
library, calorie tracking, blog, admin panel, staff panel, Stripe payments).

**Current stack (verified from `package.json`, `vite.config.js`, `src/App.jsx`):**
- React 19 + Vite 8, client-only SPA, `react-router-dom` v7 (`BrowserRouter`)
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`) + a large hand-written `src/index.css`
- Backend: Supabase (Postgres + Auth + Storage + Realtime) via `@supabase/supabase-js` — **no custom
  Node/Express backend**; `api/*.js` are Vercel serverless functions (see `06-api-analysis.md`)
- State: no Redux. Global state lives in one big custom context: `src/context/AppContext.jsx`
  (1468 lines) backed directly by Supabase queries in `src/services/supabaseDb.js` (79KB, the single
  largest file in the project). A second context, `src/context/ToastContext.jsx`, handles toasts.
- Payments: Stripe Checkout (redirect-based), gated by `VITE_STRIPE_ENABLED`
  (`src/config/stripe.js`)
- Video calls: Daily.co (`@daily-co/daily-js`), room/token minted server-side via `api/daily-room.js`
- AI features: Google Gemini via `api/_gemini.js` (food-text/food-vision analysis, nutrition tips,
  blog generation)
- Notifications: Telegram bot webhooks (`api/telegram-notify.js`) for internal ops alerts
- Charts: `recharts`; Animation: `framer-motion`; Icons: `lucide-react`; PDF export: `html2pdf.js`
- No i18n library — all copy is hardcoded Turkish text inline in JSX/data files.
- No Redux/Zustand/RTK-Query — data fetching is done ad hoc via direct Supabase client calls,
  centralized behind the `src/services/*.js` service modules and re-exposed through `AppContext`.

**User roles (verified from `src/App.jsx` route guards and `AppContext`):** `member`, `staff`
(coach/dietitian/doctor — see `src/utils/staffRoles.js`), `admin`. Enforced client-side by
`RequireAuth` (`src/components/auth/RequireAuth.jsx`) checking `AppContext`'s `db.session.type`,
and server-side by RLS policies in `supabase/setup.sql` + `supabase/migrations/*` and by
`api/_guards.js` (`requireAuth`, `requireAdmin`).

**Why this matters for RN:** because there is no Redux, no formal API-layer abstraction (no
axios/fetch wrapper, no react-query/SWR), and no navigation library other than
`react-router-dom`, the RN rebuild must recreate:
1. A **navigation architecture** (React Navigation: stacks/tabs per role) equivalent to the
   route table in `05-navigation-graph.md`.
2. A **global state layer** equivalent to `AppContext` (Context + hooks, or a state library —
   decision deferred to `15-risks-migration-strategy.md`, NOT to be decided by Cursor ad hoc).
3. A **Supabase client layer** using `@supabase/supabase-js` (RN-compatible) with
   `AsyncStorage`-backed session persistence instead of `localStorage`/`sessionStorage`
   (`src/services/authStorage.js` must be re-implemented, not ported verbatim).
4. Full parity for every screen, component, hook, util, and business rule documented in this
   folder — with `UNKNOWN` markers wherever the source could not be conclusively read.

**Scale (verified directory counts):**
- `src/pages/`: 63 page files (incl. `admin/`, `auth/`, `staff/`, `legal/`, `payments/`, `shared/`)
- `src/components/`: 126 component files across 21 subfolders
- `src/services/`: 35 files (Supabase/data access layer)
- `src/utils/`: 38 files (pure business-logic helpers)
- `src/hooks/`: 14 custom hooks
- `src/data/`: 36 files (static content, plan definitions, health-test question banks, legal texts)
- `api/`: 31 Vercel serverless functions (12 public endpoints + 19 `_`-prefixed internal helpers)
- `supabase/`: 66 files (53 SQL migrations + `setup.sql` + `seed.sql` + edge functions + email templates)

**Pre-existing internal documentation found in the repo (not authored by this blueprint):**
- `AI_PROJE_REHBERI.md` (264KB, Turkish) — a large pre-existing project guide/journal.
- `YAPILACAKLAR.md` — Turkish TODO/status tracker (business/ops tasks, not code tasks).
- `docs/` — setup guides (Supabase, OAuth, Apple Sign-In, etc.)
These are **not** treated as authoritative for this blueprint; every claim in this blueprint is
independently re-verified against the actual `.jsx`/`.js` source files. Where the existing guide
was skimmed for cross-reference and something could not be verified directly in code, it is marked
`UNKNOWN`.

## 2. Top-level repository map (verified via `list_dir`)

```
Serenova-F-t/
├─ api/                  31 files — Vercel serverless functions (Node, NOT Express)
├─ docs/                 setup guides (Supabase/OAuth/Apple/etc.) — reference only
├─ public/               static assets (favicon, brand images, robots.txt, etc.)
├─ scripts/              22 Node maintenance/import scripts (exercise import, thumbnails, etc.) — build/ops tooling, NOT part of the runtime app
├─ src/
│  ├─ App.jsx            route table (63 routes) — see 05-navigation-graph.md
│  ├─ main.jsx           React root bootstrap
│  ├─ index.css          57KB — Tailwind v4 theme + global styles — see 11-ui-design-system.md
│  ├─ components/        126 files, 21 subfolders — see 09-components-analysis
│  ├─ config/            5 files — brand.js, memberNav.js, seo.js, stripe.js, videoCall.js
│  ├─ context/           AppContext.jsx (global state), ToastContext.jsx
│  ├─ data/              36 files — static content/config data (not user data)
│  ├─ hooks/             14 custom hooks
│  ├─ pages/             63 files, 6 subfolders — see 08-screens-analysis
│  ├─ services/          35 files — Supabase access layer — see 06-api-analysis.md
│  └─ utils/             38 files — pure helper functions
├─ supabase/             53 SQL migrations + setup.sql (49.7KB) + seed.sql + 1 edge function
├─ index.html            Vite HTML entry (SPA shell, meta tags)
├─ vite.config.js        Vite build config
├─ vercel.json           Vercel routing/build config
└─ package.json          dependencies (see 12-third-party-libraries.md)
```

## 3. Reading order for the Cursor implementation agent

1. `01-architecture-overview.md` → `04-state-management.md` → `05-navigation-graph.md` →
   `06-api-analysis.md` → `07-authentication.md` — foundational, read fully before any code.
2. `11-ui-design-system.md` and `12-third-party-libraries.md` — needed before scaffolding the RN
   project (theme tokens, library choices).
3. `08a/08b` (screens) and `09a/09b` (components) — read the specific screen/component section
   immediately before implementing its task from `16-19-task-list-*.md`.
4. `13-forms-validation.md` and `14-edge-cases.md` — read alongside every screen that has a form
   or a network call.
5. `16-19-task-list-*.md` — the actual work order. Tasks are numbered and must be executed in
   order unless explicitly marked parallelizable.
6. `20-final-validation-checklist.md` — final QA pass after all tasks are done.

---
*This index will be updated as each remaining section is completed. Do not consider this blueprint final until every file above is marked ✅.*
