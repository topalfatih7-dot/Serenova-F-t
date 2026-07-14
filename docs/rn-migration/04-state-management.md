# 04 — State Management Analysis

Source of truth read in full: `src/context/AppContext.jsx` (1468 lines, the entire file was
read). Secondary: `src/context/ToastContext.jsx` (72 lines, read in full).

## 1. Summary

There is **no Redux, no Redux Toolkit, no Zustand, no Jotai, no MobX**. All global application
state lives in exactly one React Context: `AppContext`. A second, unrelated context
(`ToastContext`) handles ephemeral toast messages. There are no other `createContext` calls
anywhere in `src/` (only these two context files exist in `src/context/`).

`AppContext` is simultaneously:
- a **data cache** (one big `remoteDb` object mirroring several Supabase tables),
- a **selector layer** (dozens of `useMemo` derived values),
- an **action/mutation layer** (all business-logic "write" operations), and
- a **realtime sync target** (Supabase Realtime pushes patch this same state).

This is architecturally equivalent to a hand-rolled Redux store with thunks, except everything
is colocated in one function component (`AppProvider`) instead of separate
reducers/actions/selectors files. For RN, the direct 1:1 port is "one Context + one custom hook",
but see `15-risks-migration-strategy.md` for why a more modular split (still Context/hooks, no
new library required unless the team wants one) is recommended at task-breakdown time — Cursor
must not decide this unilaterally, it must follow whatever `16-19-task-list-*.md` specifies.

## 2. `AppContext` internal state (`useState`/`useRef`, verified line-by-line)

| State | Type | Purpose |
|---|---|---|
| `remoteDb` | object \| null | The entire hydrated dataset from Supabase (see shape below). `null` until first `hydrate()` resolves. |
| `loading` | bool | True until the first `hydrate()` call resolves. Gates the initial full-screen `LoadingScreen`. |
| `syncing` | bool | True while `reloadRemote()` is in flight (used for a lightweight overlay `LoadingScreen`, not a full block, on subsequent reloads). |
| `loggingOut` | bool | True during `logout()` — used to show a logging-out state and suppress the loading overlay via `authFastPath`. |
| `chatThreads`, `chatMessages` | array, map(threadId→array) | Member↔staff support/coaching chat. |
| `adminStaffThreads`, `adminStaffMessages` | array, map | Admin↔staff internal chat. |
| `staffCollabThreads`, `staffCollabMessages` | array, map | Coach↔dietitian collaboration chat about a shared member. |
| `chatHydratedKey` (ref) | string | Dedup key so chat threads are re-hydrated only when session/member/staff set actually changes (`chatHydrationKey()` util). |
| `chatThreadIdsRef`, `adminStaffThreadIdsRef`, `staffCollabThreadIdsRef` (refs) | Set | Used by the realtime subscriber to decide if an incoming Postgres-changes event is relevant to the current user without re-subscribing on every render. |
| `sessionTypeRef` (ref) | string | Latest `session.type`, read inside realtime callbacks without retriggering the subscription effect. |
| `remoteDbRef`, `memberRef` (refs) | mirrors of `remoteDb`/`currentMember` | Let callbacks read the latest value without becoming effect dependencies (avoids realtime channel re-subscription churn — explicitly commented in source as a deliberate perf fix). |
| `notificationsDirtyRef`, `notificationFlushTimerRef`, `notificationFlushInFlightRef` (refs) | — | Debounced batched persistence of "notification read" state (1.5s debounce, see §5). |

`remoteDb` shape (from `EMPTY_DB` fallback + `hydrate()` return, `src/services/supabaseDb.js`):
```js
{
  version: 2,
  members: [],              // member-role objects (JSONB `data` blob + a few real columns)
  staff: [],                // coach/dietitian/doctor directory
  programs: [],              // nutrition/workout programs assigned to members
  posts: [],                 // blog posts
  tickets: [],               // support tickets
  activities: [],             // activity/audit log entries
  payments: [],               // payment records
  exercises: [],              // NOT populated by hydrate() (always [] — see below) 
  exerciseCount: 0,           // count-only; full exercise list is paginated/lazy via useExerciseLibrary
  plans: ALL_PLANS,            // membership plans (DB-backed, falls back to static ALL_PLANS)
  staffApplications: [],       // admin-only
  corporateApplications: [],   // admin-only
  contactInquiries: [],        // admin-only
  session: null,                // { type: 'admin'|'staff'|'member', memberId?, staffId?, email }
  authUser: null,                // { id, email, name, identities, app_metadata }
  content: { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null },
}
```
**Note (verified in `hydrateOnce()`):** `exercises` is always returned as `[]` from `hydrate()` —
the exercise library is deliberately NOT loaded into global state (it can be large with video
assets); it is fetched separately and paginated via `src/hooks/useExerciseLibrary.js` /
`src/services/exerciseLibrary.js`. Only `exerciseCount` (a `head:true` count query) is in global
state, used for e.g. showing "120+ exercises" on marketing surfaces.

## 3. Derived/selector values (`useMemo`, verified)

`currentMember`, `currentStaff` (via `getCurrentMember`/`getCurrentStaff` from
`src/services/platformStats.js` — finds the row in `db.members`/`db.staff` matching
`db.session`), `authUser`, `isAdmin`, `isStaff`, `user` (role-aware "current profile" object —
staff profile if staff, `{name, email}` if admin, member row if member, bare authUser if
mid-onboarding, `{}` if none), `isAuthenticated` (`!!db.session`), `adminStats`,
`onboardingFunnel`, `membershipBreakdown`, `monthlyGrowth`, `sessionStats` (all from
`src/services/platformStats.js`, admin dashboard aggregates), `chatUnreadCount`,
`staffAdminUnreadCount`, `adminStaffUnreadCount`, `staffCollabUnreadCount`,
`sortedStaffCollabThreads`, `sortedAdminStaffThreads`, `pendingApplicationsCount` (admin: pending
staff apps + corporate apps + new contact inquiries), `openSupportTicketsCount`,
`notificationUnreadCount`, `myPrograms` (programs filtered by `memberId`), `myTickets`,
`platform` (subset object `{members, staff, programs, tickets, activities, payments}` — passed
to admin analytics views), `isFreeTrialExpired`, `verificationStatus`
(`{email, phone, emailVerified, phoneVerified}`).

## 4. Effects (side effects, verified)

1. **Thread-ID ref sync** — 3 effects keep `*ThreadIdsRef` sets in sync with thread arrays.
2. **Initial hydrate + auth-change subscription** (mount-only effect): calls `sb.hydrate()` once,
   subscribes via `sb.onAuthChange`. On `SIGNED_IN` → `registerActiveSession()` (single-session
   enforcement, see `07-authentication.md`). On `TOKEN_REFRESHED` →
   `verifyActiveSessionOrSignOut()`. On any event in `AUTH_EVENTS_REQUIRING_HYDRATE`
   (`INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`) → full `hydrate()` re-run.
   `TOKEN_REFRESHED` alone does NOT re-hydrate (perf: avoids a full refetch on every silent token
   refresh).
3. **Single-session polling**: `setInterval` every 60s + `visibilitychange` listener, calls
   `verifyActiveSessionOrSignOut()` while authenticated — detects "signed in elsewhere" and force
   logs out (see `07-authentication.md` §4).
4. **Chat hydration**: triggers once per unique `chatHydrationKeyString` (derived from
   session+member+staff+lists — a cache-busting composite key), fetches all 3 chat systems in
   parallel via `Promise.all`.
5. **Chat state reset**: when `hasChatSession` flips to false (logout), clears all chat state
   synchronously (this uses a render-phase state comparison pattern, not `useEffect`, to avoid a
   frame of stale data — verified at lines ~176-187).
6. **Presence tracker**: `startPresenceTracker()` (`src/services/presenceService.js`) while
   authenticated — writes periodic "I'm online, on page X" heartbeats.
7. **Realtime subscription**: `subscribeRealtimeSync()` (`src/hooks/useRealtimeSync.js`) — single
   Supabase Realtime subscription set, re-subscribed only when `sessionType`/`memberId`/`staffId`
   change (not on every `remoteDb` mutation — deliberate, per source comments). Routes
   Postgres-changes events for tickets/members/programs/3 chat systems/applications into
   `setRemoteDb`/`setChatThreads`/etc. patches.
8. **Notification flush on page hide/visibility-hidden/unmount** — ensures debounced
   notification-read state is not lost if the user closes the tab.

## 5. Mutation/write pattern — two strategies observed

**Strategy A — "refetch everything" (the default, ~45 of ~55 action functions):**
```
await sb.<mutationFn>(...)     // writes to Supabase
await reloadRemote()            // sb.hydrate() again, replaces remoteDb wholesale
```
Used by: `login`, `logout`, `register`, `registerWithPayment`, `registerWithPlan`,
`completeOAuthMember`, `savePlan`, `changePlan`, `processPremiumPayment`, `upgradeToPremium`,
`saveSupportSchedule`, `addStaff`, `editStaff`, `updateStaffProfile`, `removeStaff`,
`removeMember`, `adminPatchMember`, `staffPatchMember`, `adminUpdatePremium`,
`adminSetMembershipStatus`, `addPost`, `editPost`, `removePost`, `addExercise`, `editExercise`,
`removeExercise`, `reassignExerciseCategory`, `resolveStaffApplication`,
`resolveCorporateApplication`, `updateContactInquiryStatus`, `addContent`, `editContent`,
`removeContent`, `saveExerciseTaxonomy`, `submitSuccessStory`, `bookSession`,
`refreshVerification`. This means **every one of these actions triggers a full-app data refetch**
— acceptable on web with a fast broadband connection to Supabase, but a real risk on mobile/cell
networks (see `14-edge-cases.md` "slow connection" and `15-risks-migration-strategy.md`).

**Strategy B — true optimistic local patch (5 functions, performance-sensitive paths):**
- `patchCurrentRemote(patch)` — updates `memberRef` and `remoteDb.members[...]` synchronously
  BEFORE awaiting `sb.saveMemberPatch()`; on failure, calls `reloadRemote()` to reconcile
  (silent rollback via refetch, no explicit error surfaced to caller — **edge case**: if the
  network write fails, the UI already shows the optimistic state until the reconcile refetch
  completes, which could show a flash of reverted state with no error toast). Used by:
  `savePackage`, `rescheduleSession`, `cancelSession`, `toggleTask`, `toggleActivityCompletion`,
  `toggleMealCompletion`, `updateProfile`.
- `applyNotificationsOptimistic` + `scheduleNotificationFlush`/`flushNotificationReads` —
  notification read/unread toggling is applied to local state instantly, then persisted with a
  **1.5s debounce**, coalescing rapid "mark read" clicks into a single Supabase write. In-flight
  writes are tracked (`notificationFlushInFlightRef`) so overlapping flushes serialize rather
  than race.
- `saveHealthTestProgress` — updates `memberRef`/`remoteDb` immediately (health-test wizard
  autosave, must not cause a full-screen loading flash between steps), persists in background,
  reconciles via `reloadRemote()` only on error.
- `createProgram`, `createTicket`, `sendChatMessage` (and sibling chat send functions) — append
  the server response directly into local arrays (no full refetch), a middle-ground "server
  wins, single fetch" pattern.

**RN implication:** RN networks are less reliable than desktop broadband; Strategy A's
"full refetch after every write" pattern should be preserved **behaviorally** for parity (the
blueprint forbids "optimizing" behavior), but implementers must plan for RN's
`NetInfo`/retry/loading-state UX around each of these 45 refetch-triggering actions (see
`14-edge-cases.md`).

## 6. Full public API of `useApp()` (verified exhaustive list, context `value` object)

**State fields (data):** `mode`, `loading`, `syncing`, `isAuthenticated`, `isAdmin`, `isStaff`,
`staffUser`, `staff`, `programs`, `posts`, `myPrograms`, `myTickets`, `exercises`,
`exerciseCount`, `plans`, `staffApplications`, `corporateApplications`, `contactInquiries`,
`user`, `authUser`, `membership`, `membershipStatus`, `packageConfig`, `supportSchedule`,
`coachSessions`, `dietitianSessions`, `doctorSessions`, `notifications`, `chatThreads`,
`chatMessages`, `chatUnreadCount`, `adminStaffThreads`, `adminStaffMessages`,
`adminStaffUnreadCount`, `staffAdminUnreadCount`, `pendingApplicationsCount`,
`openSupportTicketsCount`, `notificationUnreadCount`, `staffCollabThreads`,
`staffCollabMessages`, `staffCollabUnreadCount`, `tasks`, `progress`, `settings`,
`premiumExpiresAt`, `premiumStartedAt`, `freeTrialExpiresAt`, `isFreeTrialExpired`,
`testimonials`, `faqs`, `successStories`, `exerciseTaxonomy`, `platform`, `adminStats`,
`onboardingFunnel`, `membershipBreakdown`, `monthlyGrowth`, `sessionStats`, `activeUsers`,
`loggingOut`, `verificationStatus`.

**Action fields (functions), grouped by domain:**
- **Auth/session:** `login`, `logout`, `register`, `completeOAuthMember`, `registerWithPayment`,
  `registerWithPlan`, `refresh`/`reloadRemote`.
- **Membership/plans:** `savePlan`, `changePlan`, `processPremiumPayment`, `upgradeToPremium`,
  `savePackage`, `saveSupportSchedule`.
- **Admin — staff mgmt:** `addStaff`, `editStaff`, `updateStaffProfile`, `removeStaff`.
- **Admin — member mgmt:** `removeMember`, `adminPatchMember`, `staffPatchMember`,
  `adminUpdatePremium`, `adminSetMembershipStatus`.
- **Programs:** `createProgram`.
- **Blog:** `addPost`, `editPost`, `removePost`.
- **Support tickets:** `createTicket`, `setTicketStatus`, `sendTicketReply`.
- **Exercise library (admin):** `uploadExerciseVideo`, `getExerciseVideoUrl`, `addExercise`,
  `editExercise`, `removeExercise`, `reassignExerciseCategory`, `saveExerciseTaxonomy`.
- **Applications (admin):** `resolveStaffApplication`, `resolveCorporateApplication`,
  `updateContactInquiryStatus`.
- **Site content (admin):** `addContent`, `editContent`, `removeContent`.
- **Success stories:** `submitSuccessStory`.
- **Notifications:** `markNotificationRead`, `markAllNotificationsRead`, `flushNotificationReads`.
- **Sessions/appointments:** `rescheduleSession`, `cancelSession`, `bookSession`,
  `getStaffBookedSlots`.
- **Member progress/tasks:** `toggleTask`, `toggleActivityCompletion`, `toggleMealCompletion`,
  `updateProfile`, `saveHealthTestProgress`, `updateSettings`.
- **Verification:** `sendEmailVerification`, `confirmEmailVerification`, `sendPhoneVerification`,
  `confirmPhoneVerification`, `refreshVerification`.
- **Chat (member↔staff):** `loadChatMessages`, `sendChatMessage`, `markChatThreadRead`,
  `refreshStaffChatThreads`, `ensureStaffChatThread`, `acceptChatConsent`.
- **Chat (admin↔staff):** `loadAdminStaffMessages`, `sendAdminStaffMessage`,
  `markAdminStaffThreadRead`, `ensureAdminStaffThread`.
- **Chat (staff collab):** `loadStaffCollabMessages`, `sendStaffCollabMessage`,
  `markStaffCollabThreadRead`, `refreshStaffCollabThreads`, `ensureStaffCollabThread`.

This is the **entire mutation surface of the app** — 55 functions. Every RN screen/component
that currently calls `useApp()` for one of these must call the RN-ported equivalent with an
**identical function signature and identical return shape** (most return
`{ success, error?, ...extra }`), per the "no redesign" rule.

## 7. `ToastContext` (verified, full file)

- `ToastProvider`: `useState([])` toast queue. `toast(message, type='success', duration=3500)`
  pushes `{id: Date.now(), message, type}`, auto-removes after `duration` ms via `setTimeout`.
  `dismiss(id)` manual close.
- 4 toast types: `success` (sage/green), `error` (red), `warning` (amber), `info` (brand/blue) —
  each with a `lucide-react` icon (`CheckCircle`/`XCircle`/`AlertTriangle`/`Info`) and a Tailwind
  color pair.
- Rendered fixed at `bottom-6 right-4` (desktop: `right-6`), stacked vertically, `z-[500]`,
  animated with `framer-motion` (`AnimatePresence`, slide+fade in from below, slide out to the
  right).
- `useToast()` hook throws if used outside provider.
- **RN port:** `Animated`/`Reanimated` + a fixed-position overlay (e.g., via a root-level
  `Toast` host similar to `react-native-toast-message`, or a custom implementation reusing this
  exact queue/timeout logic — no new business logic to invent, only the render primitives swap).

## 8. State NOT covered by AppContext (component-local state)

Many screens keep their own local `useState` for: form inputs, modal open/close, active tab,
pagination/filter state (e.g., `ExerciseLibraryPage`), wizard step index (`OnboardingPage`,
`HealthTestFlow`). These are documented per-screen in `08a/08b-screens-analysis-*.md`. This
local state does NOT need a global-state equivalent in RN — it maps directly to RN component
`useState`.

---
*Cross-reference: `06-api-analysis.md` for what `sb.*` functions actually query;
`07-authentication.md` for the auth-specific subset of this context in more detail.*
