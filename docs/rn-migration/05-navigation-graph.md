# 05 — Navigation Graph

Source: `src/App.jsx` (full file, 211 lines, read completely), `src/components/auth/RequireAuth.jsx`,
`src/components/auth/ProfileCompletionGate.jsx`, `src/components/layout/{PublicLayout,AppShell,
AdminShell,StaffShell,Sidebar,PanelMobileMenu}.jsx`, `src/config/memberNav.js`.

## 1. Routing technology

`react-router-dom` v7, `<BrowserRouter>`, nested `<Route>` layouts with `<Outlet/>`. All non-critical
pages are `lazy()`-loaded (code-split); `LandingPage` and layout/guard components are eager. There
is a single `<Suspense fallback={<RouteFallback/>}>` wrapping the whole `<Routes>` tree (one shared
spinner for all lazy loads, not per-route).

**RN equivalent:** React Navigation (`@react-navigation/native`) with a root `NavigationContainer`,
nested Stack/Tab navigators mirroring the 4 layout groups below. RN has no route-based code
splitting equivalent in the same sense (all JS is bundled), so the `lazy()`/`Suspense` mechanism
does not need to be reproduced — this is a `NOTE`, not a task, per "no invented features."

## 2. Top-level layout groups (4 route trees)

| Group | Layout wrapper | Guard | Base path |
|---|---|---|---|
| Public | `PublicLayout` (navbar + footer) | none | `/`, `/login`, etc. |
| Auth flows (chromeless) | none (full-screen) | none | `/auth/callback` |
| Member | `AppShell` (sidebar/topbar) | `RequireAuth role="member"` → `ProfileCompletionGate` | `/dashboard`, ... |
| Staff | `StaffShell` (sidebar) | `RequireAuth role="staff"` | `/staff`, ... |
| Admin | `AdminShell` (sidebar) | `RequireAuth role="admin"` | `/admin`, ... |

## 3. Full route table (verified exhaustively from `src/App.jsx`)

### 3.1 Chromeless (no layout)
| Path | Component | Notes |
|---|---|---|
| `/auth/callback` | `AuthCallbackPage` | Handles all Supabase auth redirect flows (PKCE code exchange, magic link, recovery, OAuth, email/phone verification). Full-screen, no navbar. |

### 3.2 Public (`PublicLayout` wrapper — navbar + footer)
| Path | Component | Notes |
|---|---|---|
| `/` (index) | `LandingPage` | Eager-loaded (not lazy) — the marketing homepage. |
| `/login` | `LoginPage` | |
| `/register` | → redirect to `/onboarding` | `<Navigate replace>` |
| `/forgot-password` | `ForgotPasswordPage` | |
| `/reset-password` | `ResetPasswordPage` | |
| `/onboarding` | `OnboardingPage` | Registration wizard (also used for OAuth profile completion). |
| `/membership` | `MembershipComparisonPage` | Plan comparison/pricing. |
| `/hakkimizda` | `AboutPage` | Turkish "About" — canonical path. |
| `/about` | → redirect to `/hakkimizda` | |
| `/builder` | → redirect to `/membership` | Legacy alias. |
| `/stories` | `SuccessStoriesPage` | |
| `/blog` | `BlogPage` | |
| `/blog/:id` | `BlogPostPage` | |
| `/team/coaches` | `TeamListPage role="coaches"` | |
| `/team/dietitians` | `TeamListPage role="dietitians"` | |
| `/team/doctors` | `TeamListPage role="doctors"` | |
| `/team/apply` | `StaffApplicationPage` | Public job-application form. |
| `/corporate` | `CorporatePage` | B2B marketing page. |
| `/corporate/apply` | `CorporateApplicationPage` | |
| `/team/:id` | `StaffProfilePage` | Public staff profile page. |
| `/legal/:slug` | `LegalDocumentPage` | Dynamic legal doc by slug (`src/data/legalDocuments.js` + `src/data/legal/`). |
| `/kvkk` | → redirect to `/legal/kvkk` | |
| `/privacy` | → redirect to `/legal/gizlilik-politikasi` | |
| `/terms` | → redirect to `/legal/uyelik-ve-abonelik-sozlesmesi` | |
| `*` (catch-all) | `NotFoundPage` | 404, still inside `PublicLayout`. |

### 3.3 Member area (`RequireAuth role="member"` → `ProfileCompletionGate` → `AppShell`)
| Path | Component | Notes |
|---|---|---|
| `/call/:sessionType/:sessionId` | `VideoCallPage audience="member"` | **Outside `AppShell`** but still inside `RequireAuth`+`ProfileCompletionGate` — full-screen video call, no sidebar. `sessionType` ∈ `coach\|dietitian\|doctor`. |
| `/dashboard` | `DashboardPage` | Home/dashboard. |
| `/health-test` | `HealthTestPage` | |
| `/health-test/finish` | `HealthTestFinishPage` | |
| `/health-test/:sectionId` | `HealthTestSectionPage` | |
| `/calendar` | `CalendarPage` | |
| `/calorie` | `CalorieCalculatorPage` | AI food analysis. |
| `/schedule` | `AppointmentsPage` | |
| `/schedule/coach` | → redirect to `/schedule?tab=coach` | |
| `/schedule/dietitian` | → redirect to `/schedule?tab=dietitian` | |
| `/schedule/doctor` | → redirect to `/schedule?tab=doctor` | |
| `/notifications` | `NotificationsPage` | |
| `/messages` | `MessagesPage` | |
| `/messages/:role` | `MessagesPage` | `role` param selects which staff-type thread. |
| `/support` | `SupportPage` | |
| `/programs` | `ProgramsPage` | |
| `/library` | `ExerciseLibraryPage` | |
| `/profile` | `ProfilePage` | |
| `/profile/payments` | `PaymentManagementPage audience="member"` | |

### 3.4 Staff area (`RequireAuth role="staff"` → `StaffShell`)
| Path | Component | Notes |
|---|---|---|
| `/staff/call/:sessionType/:sessionId` | `VideoCallPage audience="staff"` | Outside `StaffShell`, full-screen. |
| `/staff` | `StaffOverviewPage` | |
| `/staff/clients` | `StaffClientsPage` | |
| `/staff/clients/:memberId/health` | `MemberHealthProfilePage audience="staff"` | Shared component also used by admin (§3.5). |
| `/staff/clients/:memberId/program` | `StaffClientProgramPage` | |
| `/staff/messages` | `StaffMessagesPage` | |
| `/staff/messages/:memberId` | `StaffMessagesPage` | |
| `/staff/admin-messages` | `StaffAdminMessagesPage` | |
| `/staff/collab-messages` | `StaffCollabMessagesPage` | coach↔dietitian only (see §4). |
| `/staff/collab-messages/:memberId` | `StaffCollabMessagesPage` | |
| `/staff/programs` | `StaffProgramsPage` | |
| `/staff/lists` | `StaffListsPage` | |
| `/staff/library` | `StaffLibraryGate` | Gate component, not a page — wraps exercise library access for staff. |
| `/staff/payments` | `PaymentManagementPage audience="staff"` | |
| `/staff/profile` | `StaffSelfProfilePage` | |

### 3.5 Admin area (`RequireAuth role="admin"` → `AdminShell`)
| Path | Component | Notes |
|---|---|---|
| `/admin` | `AdminOverviewPage` | |
| `/admin/members` | `AdminMembersPage` | |
| `/admin/members/:memberId/health` | `MemberHealthProfilePage audience="admin"` | |
| `/admin/plans` | `AdminPlansPage` | |
| `/admin/premium` | `AdminPremiumPage` | |
| `/admin/applications` | `AdminApplicationsPage` | |
| `/admin/library` | `AdminLibraryPage` | |
| `/admin/staff` | `AdminStaffPage` | |
| `/admin/blog` | `AdminBlogPage` | |
| `/admin/content` | `AdminContentPage` | |
| `/admin/subscriptions` | `AdminSubscriptionsPage` | 238-byte stub file — verify content in `08` doc; likely placeholder/deprecated. |
| `/admin/payments` | `PaymentManagementPage audience="admin"` | |
| `/admin/sessions` | `AdminSessionsPage` | |
| `/admin/support` | `AdminSupportPage` | |
| `/admin/messages` | `AdminMessagesPage` | |
| `/admin/messages/staff/:staffId` | `AdminMessagesPage` | |
| `/admin/messages/audit` | `AdminMessagesPage` | |
| `/admin/messages/audit/:threadId` | `AdminMessagesPage` | |
| `/admin/messages/collab` | `AdminMessagesPage` | |
| `/admin/messages/collab/:threadId` | `AdminMessagesPage` | |
| `/admin/analytics` | `AdminAnalyticsPage` | |
| `/admin/activity` | `AdminActivityPage` | |
| `/admin/account` | `AdminAccountPage` | Admin's own account/password settings. |

**Total: 63 distinct route entries** (including redirects and the catch-all), matching the 63 files
in `src/pages/` (redirect-only routes have no dedicated page file; some page files like
`MessagesPage`/`AdminMessagesPage`/`PaymentManagementPage`/`MemberHealthProfilePage` are reused
across multiple routes via props).

## 4. Route guards (verified, full logic)

**`RequireAuth({ role })`** (`src/components/auth/RequireAuth.jsx`):
- reads `{ isAuthenticated, isAdmin, isStaff, loading }` from `AppContext`.
- while `loading` → renders `null` (blocks render until first hydrate resolves).
- not authenticated → `<Navigate to="/login" replace>` with router state
  `{ from: pathname+search, message: 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.' }`
  (message is presumably shown on the login page — verify in `08` LoginPage analysis).
- role mismatch cross-redirects: `role="admin"` non-admin → `/staff` (if staff) else `/profile`;
  `role="staff"` non-staff → `/admin` (if admin) else `/profile`; `role="member"` on an
  admin/staff session → `/admin` or `/staff` respectively. I.e., **every authenticated role always
  has exactly one "home"** and is bounced there if it hits another role's guarded route.

**`ProfileCompletionGate`** (member-only, sits between `RequireAuth role="member"` and the
`call/:sessionType/:sessionId` + `AppShell` routes):
- admin/staff → passthrough (`<Outlet/>`) immediately (defensive; shouldn't normally reach here).
- else checks `hasRegisteredMember(user)` (`src/utils/memberProfile.js`) — if the Supabase auth
  user exists but has no completed `members` row yet (e.g., OAuth sign-in before onboarding
  finished), redirects to `/onboarding?plan=<plan>&oauth=1` (plan read from query string, defaults
  `free`; `oauth=1` flag added if `isSocialAuthUser(authUser)`). Already on `/onboarding` →
  passthrough (prevents redirect loop).

**RN equivalent:** these two guards become a single navigation-state decision made once at the
root navigator (based on `isAuthenticated`/role/`hasRegisteredMember`), switching between
`AuthStack`, `OnboardingStack`, `MemberTabs`, `StaffTabs`, `AdminTabs` — this is the standard React
Navigation "conditional rendering of navigators" pattern. Do not implement per-screen guards in RN;
implement one root switch, but preserve the exact redirect **targets and conditions** listed above.

## 5. Shell/menu structure per role (drawer/tab equivalent)

### 5.1 Member (`AppShell` + `Sidebar` + `PanelMobileMenu`)
Desktop: persistent left sidebar (`Sidebar.jsx`, `w-60`/`w-72`, hidden below `md`). Mobile: a
hamburger-triggered menu (`PanelMobileMenu.jsx`, not yet fully read — see `09` component doc).
Nav items sourced from **one config** `src/config/memberNav.js` → `MEMBER_NAV` (order matters,
verified):
1. Profil (`/profile`)
2. Panel (`/dashboard`)
3. Sağlık Testleri (`/health-test`) — badge: amber `!` if health test incomplete
4. Takvim (`/calendar`)
5. Kalori Hesapla (`/calorie`)
6. Mesajlar (`/messages`) — badge: `chatUnreadCount`
7. Randevularım (`/schedule`)
8. Programlarım (`/programs`)
9. Kütüphane (`/library`)
10. Bildirimler (`/notifications`) — badge: `notificationUnreadCount`
11. Destek (`/support`) — badge: `openSupportTicketsCount`
12. Ödeme Yönetimi (`/profile/payments`)
13. **Conditional 13th item** — "Planları İncele" (`/membership`, Crown icon) appended ONLY when
    `membership === 'free'` (`buildMemberNavItems` in `memberNav.js`).

Top bar (`TopBar.jsx`, hidden on mobile, shown `md:block`) — content not yet read, tracked for
`09-components-analysis`.

**RN equivalent:** Bottom Tab Navigator cannot fit 12-13 items — recommend a Drawer Navigator (or
a "More" tab that opens the remaining items), decision to be made explicitly in
`15-risks-migration-strategy.md`/task list, NOT invented ad hoc per screen.

### 5.2 Staff (`StaffShell`)
Nav is **role-conditional** (`staffNavForRole(role)` in `StaffShell.jsx`), verified:
- Base (all staff): Genel Bakış (`/staff`), Profilim (`/staff/profile`), Danışanlarım
  (`/staff/clients`), Mesajlar (`/staff/messages`, badge `chatUnreadCount`).
- If role is `coach` or `dietitian`: + Ekip Mesajları (`/staff/collab-messages`, badge
  `staffCollabUnreadCount`) — **doctors do not get this item** (collab chat is coach↔dietitian
  only, confirmed also in `AppContext.staffCollabUnreadCount` selector which returns 0 for any
  role other than coach/dietitian).
- All staff: + Admin Mesajları (`/staff/admin-messages`, badge `staffAdminUnreadCount`).
- If role is `dietitian`: + Listeler (`/staff/lists`), + Ödeme Yönetimi (`/staff/payments`).
- Else (coach/doctor): + Programlar (`/staff/programs`), + Kütüphane (`/staff/library`), + Ödeme
  Yönetimi (`/staff/payments`).

**Forced password change:** `StaffShell` renders `<StaffForcePasswordChange>` as a **blocking
overlay** (not a route) when `staffUser.data.tempPasswordIssued` is true and the in-session
`passwordChanged` flag is false — i.e., a staff member logging in with an admin-issued temporary
password is forced to change it before seeing any staff screen, without a dedicated route (modal
over the shell). RN: same pattern — a full-screen blocking modal/screen shown conditionally, not a
separate stack entry.

### 5.3 Admin (`AdminShell`)
Fixed nav (`adminNav` array, NOT role-conditional — only one admin role), verified 16 items in
this exact order: Genel Bakış, Üyeler, Paketler, Premium Yönetimi, Başvurular (badge
`pendingApplicationsCount`), Kütüphane, Kadromuz, Finans & Ödemeler, Seanslar, Mesajlar (badge
`adminStaffUnreadCount`), Destek Talepleri (badge `openSupportTicketsCount`), Blog, İçerik,
Analitik, Aktivite, Hesap Ayarları.

## 6. Deep links / URL params consumed by pages (verified from route table + `AuthRedirectHandler`)

- `/blog/:id`, `/team/:id`, `/team/coaches|dietitians|doctors` (role via component prop, not URL
  param), `/legal/:slug`, `/call/:sessionType/:sessionId`, `/staff/call/:sessionType/:sessionId`,
  `/messages/:role`, `/staff/messages/:memberId`, `/staff/collab-messages/:memberId`,
  `/staff/clients/:memberId/health`, `/staff/clients/:memberId/program`,
  `/admin/members/:memberId/health`, `/admin/messages/staff/:staffId`,
  `/admin/messages/audit/:threadId`, `/admin/messages/collab/:threadId`.
- Query params: `/onboarding?plan=&oauth=1` (via `ProfileCompletionGate`), `/auth/callback?...`
  (many possible params — see `07-authentication.md`), `/schedule?tab=coach|dietitian|doctor`.
- **Auth deep links (web-specific, must be redesigned for RN, not ported literally):** Supabase
  email links (magic link, password recovery, email verification) point to
  `https://www.yeniform.com/auth/callback?...` (built from `getSiteUrl()`, `src/config/seo.js`).
  For RN this must become a **custom URL scheme / universal link** (e.g.
  `yeniform://auth/callback` + associated Apple/Android app links), handled by
  `AuthCallbackPage`'s RN equivalent listening via `Linking`/`expo-linking`. This is flagged as a
  **required redesign of the transport, not the business logic** — the token-exchange logic in
  `src/services/authSessionFromUrl.js` stays the same, only how the URL reaches the app changes.
  See `07-authentication.md` §6 and the dedicated task in `16-19-task-list-*.md`.

## 7. `ScrollToTop`, `NoIndexHead`, SEO components

`ScrollToTop.jsx` (member shell only, not staff/admin/public — verify in `09` doc) resets scroll
position on route change. `NoIndexHead`/`SeoHead`/`PublicRouteSeo`/`JsonLd` inject `<head>`
meta tags (SEO) — **entirely inapplicable to RN** (no concept of search-engine indexing or
`<head>`); these components/behaviors must be excluded from the RN port, not adapted. Flag any RN
task referencing them as "SKIP — web-only, no RN equivalent."

---
*Cross-reference: `07-authentication.md` for how `session.type` (member/staff/admin) is resolved;
`08a/08b` for per-screen detail of every page listed above.*
